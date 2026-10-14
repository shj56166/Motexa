import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import { unzipSync } from 'fflate'
import { sha256Hex, verifyRideUiRuntimePackage } from '@motexa/ride-ui-sdk/tools/runtime-package'

let packagePath = process.argv[2]
if (packagePath == null) {
  const outputRoot = path.join(process.cwd(), 'dist')
  const candidates = (await readdir(outputRoot)).filter((name) => name.endsWith('.ride-ui-runtime.zip')).sort()
  if (candidates.length !== 1) throw new Error(`Expected exactly one runtime ZIP in ${outputRoot}; pass its path explicitly.`)
  packagePath = path.join(outputRoot, candidates[0])
}
const archive = new Uint8Array(await readFile(path.resolve(packagePath)))
const files = new Map(Object.entries(unzipSync(archive)))
const result = verifyRideUiRuntimePackage(files)
if (result.errors.length > 0) {
  for (const error of result.errors) process.stderr.write(`${error}\n`)
  process.exitCode = 1
} else {
  process.stdout.write(`Runtime package verified: ${result.manifest.themeId} ${result.manifest.themeVersion}\n`)
  process.stdout.write(`Files: ${result.manifest.resources.fileCount}; unpacked bytes: ${result.manifest.resources.totalBytes}\n`)
  process.stdout.write(`Artifact SHA-256: ${sha256Hex(archive)}\n`)
  process.stdout.write(`Manifest SHA-256: ${result.manifestSha256}\n`)
}
