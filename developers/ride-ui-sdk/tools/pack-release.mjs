import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { copyFile, lstat, mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { unzipSync, zipSync } from 'fflate'
import { verifyRideUiRuntimePackage } from '@motexa/ride-ui-sdk/tools/runtime-package'

const root = await realpath(fileURLToPath(new URL('../', import.meta.url)))
const sdk = JSON.parse(await readFile(path.join(root, 'vendor/ride-ui-sdk/package.json'), 'utf8'))
const manifest = JSON.parse(await readFile(path.join(root, 'theme/ride-ui.json'), 'utf8'))
const navigation = JSON.parse(await readFile(path.join(root, 'docs/navigation.json'), 'utf8'))
const output = path.join(root, 'dist/release')
const baseName = `Motexa-Ride-UI-SDK-${sdk.version}-GitHub`
const runtimeName = `${manifest.id}-${manifest.version}-${manifest.runtime.variantId}.ride-ui-runtime.zip`
const integrityName = runtimeName.replace(/\.zip$/, '.integrity.json')
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const entries = new Map()

async function addFile(relative) {
  assert.ok(!relative.includes('\\') && !relative.startsWith('/') && !relative.split('/').some(part => !part || part === '.' || part === '..'), relative)
  const absolute = path.join(root, relative)
  const info = await lstat(absolute)
  assert.ok(info.isFile() && !info.isSymbolicLink(), relative)
  assert.ok((await realpath(absolute)).startsWith(`${root}${path.sep}`), relative)
  assert.ok(!entries.has(relative), `Duplicate file ${relative}`)
  entries.set(relative, await readFile(absolute))
}

const sourceFiles = [
  '.gitignore', '.gitattributes', 'README.md', 'CONTRIBUTING.md', 'LICENSE.md',
  'THIRD-PARTY-NOTICES.md', 'SDK-DEVELOPMENT.md', 'SDK-VERSION.txt',
  'package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vite.config.ts',
  'index.html', 'mock-host.html', 'mock-host.ts', 'mock-config.ts',
  '.github/workflows/ci.yml', '.github/workflows/pages.yml',
  'reference/ride-ui-manifest-v1.json', 'docs/navigation.json',
  'theme/ride-ui.json', 'theme/submission.json', 'theme/config.schema.json',
  'theme/src/main.ts', 'theme/src/PartnerTheme.vue', 'theme/src/ThemeSettings.vue',
  'theme/src/useDashboard.ts', 'theme/src/style.css',
  ...['theme-check.mjs', 'theme-pack.mjs', 'theme-pack-runtime.mjs', 'serve-runtime.mjs',
    'runtime-package-check.mjs', 'replay-check.mjs', 'build-docs.mjs', 'pack-release.mjs',
    'docs-renderer.mjs', 'docs-renderer.d.mts', 'docs.css'].map(name => `tools/${name}`),
  'vendor/ride-ui-sdk/package.json', ...sdk.files.map(name => `vendor/ride-ui-sdk/${name}`),
  ...navigation.locales.flatMap(locale => navigation.articles.map(article => `docs/${locale}/${article.slug}.md`)),
]
for (const relative of sourceFiles) await addFile(relative)

function audit(content) {
  for (const [name, bytes] of content) {
    assert.ok(!/(?:^|\/)(?:node_modules|android|\.git|\.env|src-private)(?:\/|$)|\.(?:java|kt|aidl|so|dex|apk|jks|keystore|pem|map)$/i.test(name), name)
    const forbidden = new RegExp(['Native' + 'DeviceSession', 'Bluetooth' + 'Gatt', 'BEGIN (?:EC |RSA )?' + 'PRIVATE KEY', 'BLE逆向' + '协议规格书', '原生BLE' + '协议接口契约'].join('|'))
    if (!name.endsWith('.zip')) assert.ok(!forbidden.test(bytes.toString('utf8')), name)
  }
}
async function archive(name, content = entries) {
  audit(content)
  const files = Object.fromEntries([...content].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([file, bytes]) => [file, digest(bytes)]))
  const inventory = Buffer.from(`${JSON.stringify({ sdkVersion: sdk.version, apiVersion: navigation.apiVersion, demoVersion: manifest.version, files }, null, 2)}\n`, 'utf8')
  const zipped = zipSync(Object.fromEntries([...content, ['SDK-CONTENTS.sha256.json', inventory]].map(([file, bytes]) => [`${name}/${file}`, [bytes, { mtime: new Date('1980-01-01T00:00:00Z') }]])), { level: 9 })
  const restored = unzipSync(zipped)
  assert.equal(Object.keys(restored).length, content.size + 1)
  for (const [file, hash] of Object.entries(files)) assert.equal(digest(restored[`${name}/${file}`]), hash, file)
  const archiveName = `${name}.zip`
  await writeFile(path.join(output, archiveName), zipped)
  await writeFile(path.join(output, `${archiveName}.sha256`), `${digest(zipped)}  ${archiveName}\n`, 'utf8')
  return { file: archiveName, bytes: zipped.length, sha256: digest(zipped), fileCount: content.size + 1 }
}
await mkdir(output, { recursive: true })
const source = await archive(baseName)
async function addBuildTree(relative) {
  const absolute = path.join(root, relative)
  assert.ok(!(await lstat(absolute)).isSymbolicLink(), relative)
  for (const entry of (await readdir(absolute, { withFileTypes: true })).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    const target = `${relative}/${entry.name}`
    assert.ok(!entry.isSymbolicLink(), target)
    if (entry.isDirectory()) await addBuildTree(target)
    else {
      assert.ok(entry.name === '.nojekyll' || /\.(?:html|js|css|svg|png|jpe?g|webp|woff2?|md|zip|json|sha256)$/.test(entry.name), target)
      await addFile(target)
    }
  }
}
for (const directory of ['dist/development', 'dist/runtime-web', 'dist/docs-site']) await addBuildTree(directory)
for (const name of [runtimeName, integrityName]) await addFile(`dist/${name}`)
const runtimeBytes = entries.get(`dist/${runtimeName}`)
const runtimeFiles = new Map(Object.entries(unzipSync(runtimeBytes)))
const verified = verifyRideUiRuntimePackage(runtimeFiles)
assert.deepEqual(verified.errors, [])
assert.ok(![...runtimeFiles.keys()].some(name => /mock-host|mockHost|\.ts$|\.vue$|\.map$/.test(name)))
assert.ok(runtimeFiles.has('licenses/demo-LICENSE.md') && runtimeFiles.has('licenses/third-party-notices.md'))
const integrity = JSON.parse(entries.get(`dist/${integrityName}`).toString('utf8'))
assert.equal(integrity.artifactSha256, digest(runtimeBytes))
assert.equal(integrity.packageManifestSha256, verified.manifestSha256)
assert.equal(integrity.bytes, runtimeBytes.length)
assert.equal(digest(entries.get(`dist/docs-site/downloads/${runtimeName}`)), digest(runtimeBytes))
const delivery = await archive(`${baseName}-Release`)
const docsSite = await archive(`Motexa-Ride-UI-SDK-${sdk.version}-Docs-Site`, new Map([...entries].filter(([file]) => file.startsWith('dist/docs-site/')).map(([file, bytes]) => [file.slice('dist/docs-site/'.length), bytes])))
for (const name of [runtimeName, integrityName]) await copyFile(path.join(root, 'dist', name), path.join(output, name))
await writeFile(path.join(output, `${runtimeName}.sha256`), `${digest(runtimeBytes)}  ${runtimeName}\n`, 'utf8')
const release = {
  sdkVersion: sdk.version, apiVersion: navigation.apiVersion, demoId: manifest.id, demoVersion: manifest.version,
  artifacts: [source, delivery, docsSite, { file: runtimeName, bytes: runtimeBytes.length, sha256: digest(runtimeBytes), packageManifestSha256: verified.manifestSha256 }],
  validation: { runtimeIntegrity: true, realDeviceInstallation: 'not-verified-by-build' },
}
await writeFile(path.join(output, 'release.json'), `${JSON.stringify(release, null, 2)}\n`, 'utf8')
console.log(JSON.stringify(release, null, 2))
