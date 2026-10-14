import assert from 'node:assert/strict'
import { copyFile, lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { escapeHtml as esc, renderDocument } from './docs-renderer.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.join(root, 'dist/docs-site')
const navigation = JSON.parse(await readFile(path.join(root, 'docs/navigation.json'), 'utf8'))
const manifest = JSON.parse(await readFile(path.join(root, 'theme/ride-ui.json'), 'utf8'))
const sdk = JSON.parse(await readFile(path.join(root, 'vendor/ride-ui-sdk/package.json'), 'utf8'))
assert.equal(navigation.sdkVersion, sdk.version)
assert.equal(navigation.demoVersion, manifest.version)
const slugs = new Set(navigation.articles.map(article => article.slug))
assert.equal(slugs.size, navigation.articles.length, 'Duplicate article slug')
const runtimeName = `${manifest.id}-${manifest.version}-${manifest.runtime.variantId}.ride-ui-runtime.zip`
const integrityName = runtimeName.replace(/\.zip$/, '.integrity.json')
await mkdir(output, { recursive: true })
await mkdir(path.join(output, 'downloads'), { recursive: true })
for (const name of [runtimeName, integrityName]) await copyFile(path.join(root, 'dist', name), path.join(output, 'downloads', name))
const integrity = JSON.parse(await readFile(path.join(root, 'dist', integrityName), 'utf8'))
await writeFile(path.join(output, 'downloads', `${runtimeName}.sha256`), `${integrity.artifactSha256}  ${runtimeName}\n`, 'utf8')
// Exactly the compiled debugger assets; no source, maps, dependencies or logs.
async function copyDebugger(directory, destination) {
  await mkdir(destination, { recursive: true })
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const source = path.join(directory, entry.name)
    assert.ok(!(await lstat(source)).isSymbolicLink(), source)
    if (entry.isDirectory()) {
      assert.equal(entry.name, 'assets', 'Unexpected debugger directory')
      await copyDebugger(source, path.join(destination, entry.name))
    } else {
      assert.match(entry.name, /\.(?:html|js|css|svg|png|jpe?g|webp|woff2?)$/i)
      await copyFile(source, path.join(destination, entry.name))
    }
  }
}
await copyDebugger(path.join(root, 'dist/development'), path.join(output, 'debugger'))
// A script-only iframe has an opaque origin. External modules require CORS
// headers that static hosts cannot all configure. Inline the already validated
// single-entry runtime build without granting allow-same-origin to the iframe.
let previewHtml = await readFile(path.join(root, 'dist/runtime-web/index.html'), 'utf8')
for (const match of [...previewHtml.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)]) {
  const sourcePath = path.resolve(root, 'dist/runtime-web', match[1])
  assert.ok(sourcePath.startsWith(`${path.join(root, 'dist/runtime-web')}${path.sep}`))
  const script = await readFile(sourcePath, 'utf8')
  assert.ok(!/\bimport\s*(?:[({*]|[\w$]+\s+from)|\bexport\s*(?:\{|default)/.test(script), 'Preview runtime must be a single self-contained chunk')
  previewHtml = previewHtml.replace(match[0], () => `<script type="module">${script.replace(/<\/script/gi, '<\\/script')}</script>`)
}
for (const match of [...previewHtml.matchAll(/<link\b(?=[^>]*rel="stylesheet")[^>]*href="([^"]+)"[^>]*>/g)]) {
  const sourcePath = path.resolve(root, 'dist/runtime-web', match[1])
  assert.ok(sourcePath.startsWith(`${path.join(root, 'dist/runtime-web')}${path.sep}`))
  const style = await readFile(sourcePath, 'utf8')
  previewHtml = previewHtml.replace(match[0], () => `<style>${style.replace(/<\/style/gi, '<\\/style')}</style>`)
}
await writeFile(path.join(output, 'debugger/index.html'), previewHtml, 'utf8')
await copyFile(path.join(root, 'tools/docs.css'), path.join(output, 'docs.css'))
await copyFile(path.join(root, 'LICENSE.md'), path.join(output, 'downloads/LICENSE.md'))
await copyFile(path.join(root, 'THIRD-PARTY-NOTICES.md'), path.join(output, 'downloads/THIRD-PARTY-NOTICES.md'))
const siteCss = `:root{color-scheme:dark;--bg:#06070b;--ink:#e6e9ef;--muted:#a1aabc;--line:#303644;--accent:#ff765d;--mono:ui-monospace,Consolas,monospace;font-family:system-ui,sans-serif}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--muted)}a{color:inherit;text-decoration:none}a:focus-visible{outline:2px solid var(--accent);outline-offset:4px}.bar{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:25px max(24px,calc((100vw - 1320px)/2));border-bottom:1px solid var(--line)}.bar strong{color:var(--ink);font-size:16px}.bar span{display:block;margin-top:6px;font:12px var(--mono)}.layout{display:grid;grid-template-columns:210px minmax(0,760px) 170px;gap:40px;max-width:1320px;margin:0 auto;padding:40px 24px}.nav,.toc{position:sticky;top:24px;align-self:start;display:grid;gap:8px;font-size:13px}.nav a,.toc a{display:block;padding:10px;border-radius:6px;line-height:1.5}.nav a[aria-current=page]{color:var(--ink);background:#1e2634}.nav a:hover,.toc a:hover{color:var(--accent)}.nav small{padding:10px;color:var(--muted)}.toc b{padding:10px;color:var(--ink)}.toc a{font-size:12px}.toc a[data-depth='3']{padding-left:20px}.pager{display:flex;justify-content:space-between;gap:20px;margin:42px 0 0;border-top:1px solid var(--line);padding-top:20px;font-size:13px}.foot{max-width:1320px;margin:0 auto;padding:24px;color:var(--muted);font-size:12px}.foot a{text-decoration:underline}.skip{position:absolute;top:-80px;left:16px;padding:12px;background:#222;color:#fff}.skip:focus{top:8px}@media(max-width:1100px){.layout{grid-template-columns:190px minmax(0,1fr)}.toc{display:none}}@media(max-width:700px){.bar{padding:20px;align-items:flex-start}.bar span{display:block;margin-top:6px;font-size:11px}.layout{grid-template-columns:1fr;padding:24px 20px;gap:28px}.nav{position:static;display:flex;flex-wrap:wrap;gap:3px}.nav a{padding:8px;font-size:12px}.nav small{width:100%;padding:8px}.bar strong{font-size:14px}}`
await writeFile(path.join(output, 'site.css'), siteCss, 'utf8')
await writeFile(path.join(output, '.nojekyll'), '', 'utf8')
for (const locale of navigation.locales) {
  const zh = locale === 'zh-CN'
  const localeRoot = path.join(output, locale)
  await mkdir(localeRoot, { recursive: true })
  for (const [index, article] of navigation.articles.entries()) {
    assert.match(article.slug, /^[a-z0-9-]+$/)
    const source = await readFile(path.join(root, 'docs', locale, `${article.slug}.md`), 'utf8')
    const rendered = renderDocument(source, href => {
      if (/^[^/#]+\.md(?:#.*)?$/.test(href)) {
        const [file, hash] = href.split('#')
        assert.ok(slugs.has(file.slice(0, -3)), `Unknown link ${href}`)
        return file.replace(/\.md$/, '.html') + (hash ? `#${hash}` : '')
      }
      assert.ok(href.startsWith('#') || /^https?:\/\//.test(href), `Unsupported link ${href}`)
      return href
    })
    const otherLocale = zh ? 'en-US' : 'zh-CN'
    const nav = navigation.articles.map(item => `<a href="./${item.slug}.html"${article.slug === item.slug ? ' aria-current="page"' : ''}>${esc(item.title[locale])}</a>`).join('')
    const toc = rendered.headings.map(item => `<a data-depth="${item.depth}" href="#${esc(item.id)}">${esc(item.title)}</a>`).join('')
    const neighbors = [navigation.articles[index - 1], navigation.articles[index + 1]].map((item, position) => item ? `<a href="./${item.slug}.html">${position === 0 ? '← ' : ''}${esc(item.title[locale])}${position === 1 ? ' →' : ''}</a>` : '<span></span>').join('')
    const html = `<!doctype html><html lang="${locale}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Motexa App-hosted Ride UI SDK ${navigation.sdkVersion}"><title>${esc(article.title[locale])} · Motexa SDK</title><link rel="stylesheet" href="../site.css"><link rel="stylesheet" href="../docs.css"></head><body><a class="skip" href="#content">${zh ? '跳到正文' : 'Skip to content'}</a><header class="bar"><a href="./overview.html"><strong>Motexa Ride UI SDK</strong><span>SDK ${navigation.sdkVersion} / API ${navigation.apiVersion}</span></a><a href="../${otherLocale}/${article.slug}.html" lang="${otherLocale}">${zh ? 'English' : '中文'}</a></header><div class="layout"><nav class="nav" aria-label="${zh ? '开发文档' : 'Developer docs'}">${nav}<small>${zh ? '开发工具' : 'Development tools'}</small><a href="../debugger/mock-host.html">${zh ? '打开合成数据调试器 ↗' : 'Open synthetic debugger ↗'}</a><a href="../downloads/${runtimeName}" download>${zh ? '下载 Demo 安装包' : 'Download demo runtime'}</a></nav><main id="content" class="sdk-prose">${rendered.html}<nav class="pager" aria-label="${zh ? '相邻文章' : 'Adjacent articles'}">${neighbors}</nav></main><aside class="toc" aria-label="${zh ? '本页目录' : 'On this page'}"><b>${zh ? '本页目录' : 'On this page'}</b>${toc}</aside></div><footer class="foot">SDK ${navigation.sdkVersion} · API ${navigation.apiVersion} · Demo ${navigation.demoVersion} · <a href="../downloads/LICENSE.md">${zh ? '示例许可范围' : 'Example license scope'}</a> · <a href="../downloads/THIRD-PARTY-NOTICES.md">${zh ? '第三方声明' : 'Third-party notices'}</a></footer></body></html>`
    await writeFile(path.join(localeRoot, `${article.slug}.html`), html, 'utf8')
  }
}
await writeFile(path.join(output, 'index.html'), '<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=./zh-CN/overview.html"><title>Motexa SDK 开发文档</title></head><body><a href="./zh-CN/overview.html">中文开发文档</a> · <a href="./en-US/overview.html">English documentation</a></body></html>', 'utf8')
console.log(`Built ${navigation.articles.length * navigation.locales.length} documentation pages: ${output}`)
