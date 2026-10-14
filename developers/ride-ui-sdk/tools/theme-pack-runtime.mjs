import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import { unzipSync, zipSync } from 'fflate'
import {
  createRideUiRuntimePackage,
  encodeCanonicalJson,
  sha256Hex,
  verifyRideUiRuntimePackage,
} from '@motexa/ride-ui-sdk/tools/runtime-package'
import { validateThemeDirectory } from '@motexa/ride-ui-sdk/tools/validate-theme'

const projectRoot = process.cwd()
const themeRoot = path.join(projectRoot, 'theme')
const buildRoot = path.join(projectRoot, 'dist', 'runtime-web')
const sourceManifestPath = path.join(themeRoot, 'ride-ui.json')
const sourceManifestBytes = await readFile(sourceManifestPath)
const sourceManifest = JSON.parse(sourceManifestBytes.toString('utf8'))
const validation = await validateThemeDirectory(themeRoot, { allowTemplateDirectory: true })
if (validation.errors.length > 0) {
  for (const error of validation.errors) process.stderr.write(`${error.message} (${error.file})\n`)
  process.exitCode = 1
} else {
  const files = new Map([['ride-ui.json', new Uint8Array(sourceManifestBytes)]])
  for (const [source, target] of [
    ['LICENSE.md', 'licenses/demo-LICENSE.md'],
    ['THIRD-PARTY-NOTICES.md', 'licenses/third-party-notices.md'],
  ]) {
    try { files.set(target, new Uint8Array(await readFile(path.join(projectRoot, source)))) }
    catch (error) { if (error.code !== 'ENOENT') throw error }
  }
  const addTree = async (directory, packagePrefix) => {
    const entries = await readdir(directory, { withFileTypes: true })
    entries.sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0)
    for (const entry of entries) {
      if (entry.isSymbolicLink()) throw new Error(`Runtime build cannot contain a symbolic link: ${entry.name}`)
      const absolute = path.join(directory, entry.name)
      const packagePath = `${packagePrefix}/${entry.name}`.replaceAll('\\', '/')
      if (entry.isDirectory()) await addTree(absolute, packagePath)
      else if (entry.isFile()) files.set(packagePath, new Uint8Array(await readFile(absolute)))
    }
  }
  await addTree(buildRoot, 'web')
  if (sourceManifest.config != null) {
    files.set('config/schema.json', new Uint8Array(await readFile(path.join(themeRoot, sourceManifest.config.schema))))
    files.set('config/defaults.json', encodeCanonicalJson(sourceManifest.config.default))
  }
  if (sourceManifest.preview != null) {
    const extension = path.extname(sourceManifest.preview.image).toLowerCase()
    files.set(`preview/preview${extension}`, new Uint8Array(await readFile(path.join(themeRoot, sourceManifest.preview.image))))
  }

  const runtimePackage = createRideUiRuntimePackage({ sourceManifest, sourceManifestBytes: new Uint8Array(sourceManifestBytes), files })
  const verification = verifyRideUiRuntimePackage(runtimePackage.files)
  if (verification.errors.length > 0) throw new Error(`Generated runtime package failed verification: ${verification.errors.join('; ')}`)

  const fixedMtime = new Date('1980-01-01T00:00:00.000Z')
  const zipEntries = Object.fromEntries([...runtimePackage.files.entries()]
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([filePath, bytes]) => [filePath, [bytes, { mtime: fixedMtime }]]))
  const archive = zipSync(zipEntries, { level: 9 })
  const unpacked = new Map(Object.entries(unzipSync(archive)))
  const archiveVerification = verifyRideUiRuntimePackage(unpacked)
  if (archiveVerification.errors.length > 0) throw new Error(`Archived runtime package failed verification: ${archiveVerification.errors.join('; ')}`)

  const outputRoot = path.join(projectRoot, 'dist')
  const baseName = `${sourceManifest.id}-${sourceManifest.version}-${sourceManifest.runtime.variantId}.ride-ui-runtime`
  const output = path.join(outputRoot, `${baseName}.zip`)
  const integrityOutput = path.join(outputRoot, `${baseName}.integrity.json`)
  await mkdir(outputRoot, { recursive: true })
  await writeFile(output, archive)
  await writeFile(integrityOutput, encodeCanonicalJson({
    artifactSha256: sha256Hex(archive),
    packageManifestSha256: runtimePackage.packageManifestSha256,
    bytes: (await stat(output)).size,
    trustOrigin: runtimePackage.packageManifest.trust.origin,
    officiallyReviewed: false,
  }))
  process.stdout.write(`Packed Web runtime: ${output}\n`)
  process.stdout.write(`Artifact SHA-256: ${sha256Hex(archive)}\n`)
  process.stdout.write(`Manifest SHA-256: ${runtimePackage.packageManifestSha256}\n`)
  process.stdout.write('Trust: owner digest approval required; not officially reviewed or installed.\n')
}
