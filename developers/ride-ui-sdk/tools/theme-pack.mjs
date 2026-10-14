import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import { zipSync } from 'fflate'
import { validateThemeDirectory } from '@motexa/ride-ui-sdk/tools/validate-theme'

const projectRoot = process.cwd()
const root = path.join(projectRoot, 'theme')
const result = await validateThemeDirectory(root, { allowTemplateDirectory: true })
if (result.errors.length > 0 || result.manifest == null) {
  for (const error of result.errors) process.stderr.write(`${error.message} (${error.file})\n`)
  process.exitCode = 1
} else {
  const submissionPath = path.join(root, 'submission.json')
  let submission
  try { submission = JSON.parse(await readFile(submissionPath, 'utf8')) } catch (error) {
    throw new Error(`Cannot read submission.json: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (
    submission?.submissionVersion !== 1
    || submission.themeId !== result.manifest.id
    || submission.themeVersion !== result.manifest.version
    || typeof submission.author !== 'string'
    || submission.author.trim().length === 0
    || submission.rightsAccepted !== true
  ) {
    throw new Error('submission.json must match the manifest, name the author, and set rightsAccepted to true.')
  }

  const files = new Map()
  const addFile = async (relative) => {
    const absolute = path.resolve(root, relative)
    if (!absolute.startsWith(`${root}${path.sep}`)) throw new Error(`Refusing to pack path outside the theme: ${relative}`)
    files.set(`${result.manifest.id}/${relative.replaceAll(path.sep, '/')}`, await readFile(absolute))
  }
  const addTree = async (relative) => {
    const absolute = path.join(root, relative)
    try {
      const entries = await readdir(absolute, { withFileTypes: true })
      for (const entry of entries) {
        const child = path.join(relative, entry.name)
        if (entry.isDirectory()) await addTree(child)
        else if (entry.isFile()) await addFile(child)
      }
    } catch (error) {
      if ((error).code !== 'ENOENT') throw error
    }
  }

  await addFile('ride-ui.json')
  await addFile('submission.json')
  for (const notice of ['LICENSE.md', 'THIRD-PARTY-NOTICES.md']) {
    try { files.set(`${result.manifest.id}/${notice}`, await readFile(path.join(projectRoot, notice))) }
    catch (error) { if (error.code !== 'ENOENT') throw error }
  }
  await addTree('src')
  await addTree('assets')
  if (result.manifest.config != null) await addFile(result.manifest.config.schema)
  if (result.manifest.preview != null) await addFile(result.manifest.preview.image)
  const target = path.join(projectRoot, 'dist', `${result.manifest.id}-${result.manifest.version}.ride-ui.zip`)
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, zipSync(Object.fromEntries(files), { level: 9 }))
  const size = (await stat(target)).size
  process.stdout.write(`Packed ${path.basename(target)} (${size} bytes).\n`)
}
