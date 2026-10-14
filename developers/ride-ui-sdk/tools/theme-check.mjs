import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { validateThemeDirectory } from '@motexa/ride-ui-sdk/tools/validate-theme'

const result = await validateThemeDirectory(fileURLToPath(new URL('../theme', import.meta.url)), { allowTemplateDirectory: true })
if (result.errors.length === 0) {
  process.stdout.write(`Theme ${result.manifest.id} passed validation.\n`)
} else {
  for (const error of result.errors) process.stderr.write(`${error.message} (${error.file})\n`)
  process.exitCode = 1
}
