import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import process from 'node:process'
import { networkInterfaces } from 'node:os'
import QRCode from 'qrcode'

const projectRoot = process.cwd()
const outputRoot = path.join(projectRoot, 'dist')
const args = process.argv.slice(2)
const readFlag = (name, fallback) => {
  const index = args.indexOf(name)
  return index >= 0 && args[index + 1] != null ? args[index + 1] : fallback
}
const bind = readFlag('--bind', '127.0.0.1')
const port = Number(readFlag('--port', '5189'))
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid --port')
const explicitPackage = readFlag('--package', null)
const candidates = (await readdir(outputRoot)).filter((name) => name.endsWith('.ride-ui-runtime.zip')).sort()
if (explicitPackage == null && candidates.length !== 1) {
  throw new Error(candidates.length === 0
    ? 'Build one *.ride-ui-runtime.zip before starting the runtime server.'
    : `Expected exactly one runtime ZIP in ${outputRoot}; pass --package <path> explicitly.`)
}
const packagePath = explicitPackage == null
  ? path.join(outputRoot, candidates[0])
  : path.resolve(projectRoot, explicitPackage)
const packageStat = await stat(packagePath).catch(() => null)
if (packageStat == null || !packageStat.isFile() || !packagePath.endsWith('.ride-ui-runtime.zip')) throw new Error('Build one *.ride-ui-runtime.zip before starting the runtime server.')
const bytes = packageStat.size
const digest = createHash('sha256')
await new Promise((resolve, reject) => {
  const stream = createReadStream(packagePath)
  stream.on('data', (chunk) => digest.update(chunk))
  stream.on('end', resolve)
  stream.on('error', reject)
})
const artifactSha256 = digest.digest('hex')
const isPrivateIpv4 = (address) => {
  const parts = address.split('.').map(Number)
  return parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)
    && (parts[0] === 10 || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168))
}
const addresses = [...new Set(Object.values(networkInterfaces()).flat()
  .filter((entry) => entry && entry.family === 'IPv4' && !entry.internal && isPrivateIpv4(entry.address))
  .map((entry) => entry.address))].filter((address) => bind === '0.0.0.0' || bind === address)
const targets = await Promise.all(addresses.map(async (address) => {
  const url = `http://${address}:${port}/runtime.ride-ui-runtime.zip`
  return { url, svg: await QRCode.toString(url, { type: 'svg', margin: 4, errorCorrectionLevel: 'M' }),
    terminal: await QRCode.toString(url, { type: 'terminal', small: true }) }
}))
const page = Buffer.from(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>内网主题导入</title><style>body{margin:0;padding:32px;font:16px system-ui;background:#f4f6fa;color:#182334}main{max-width:780px;margin:auto}section{background:white;padding:24px;border-radius:24px;margin:20px 0}svg{display:block;width:260px;max-width:100%;height:auto}code{overflow-wrap:anywhere}p{line-height:1.7}</style>
<main><h1>主题包内网服务</h1><p>电脑端只需运行此服务并保持页面打开，无需使用电脑摄像头或扫码。手机与电脑连接同一局域网后，在 App 的骑行主题页打开「从内网获取」，点击「扫码获取地址」，扫描下方二维码，再点击「获取主题」。也可以直接把下方地址填入 App。</p>
${targets.length ? targets.map(({url, svg}) => `<section>${svg}<code>${url}</code></section>`).join('') : '<section>未找到可访问的内网 IPv4。请使用 --bind 0.0.0.0 启动，并确认电脑已连接局域网。</section>'}
<p>多个地址时，选择与手机处于同一网段的地址。二维码只用于把地址传给手机，不会直接安装主题；电脑端也可以直接复制地址给手机手动输入。</p></main></html>`, 'utf8')
const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return
  }
  if (request.url === '/') {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': String(page.length), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
    response.end(request.method === 'HEAD' ? undefined : page)
    return
  }
  if (request.url !== '/runtime.ride-ui-runtime.zip') {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); response.end('Not found'); return
  }
  response.writeHead(200, {
    'Content-Type': 'application/zip',
    'Content-Length': String(bytes),
    'Content-Disposition': 'attachment; filename="theme.ride-ui-runtime.zip"',
    'X-Artifact-SHA256': artifactSha256,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  if (request.method === 'GET') createReadStream(packagePath).pipe(response)
  else response.end()
})
server.on('clientError', (_error, socket) => socket.destroy())
server.listen({ host: bind, port }, () => {
  process.stdout.write(`Serving ${path.basename(packagePath)} at http://${bind}:${port}/runtime.ride-ui-runtime.zip\n`)
  process.stdout.write(`QR page: http://${bind === '0.0.0.0' ? '127.0.0.1' : bind}:${port}/\n`)
  for (const target of targets) process.stdout.write(`${target.url}\n${target.terminal}\n`)
  if (!targets.length) process.stdout.write('No reachable private IPv4. For phone import, use --bind 0.0.0.0 on a LAN.\n')
  process.stdout.write(`Content-Length: ${bytes}\nSHA-256: ${artifactSha256}\n`)
})
process.on('SIGINT', () => server.close(() => process.exit(0)))
