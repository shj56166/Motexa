import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'

import Ajv from 'ajv'
import { RIDE_UI_API_VERSION, RIDE_UI_IMPLEMENTED_CAPABILITIES } from '../dist/constants.js'

export const RIDE_UI_ALLOWED_ACTIONS = new Set(RIDE_UI_IMPLEMENTED_CAPABILITIES)

const themeIdPattern = /^[a-z0-9]+(?:[.-][a-z0-9]+)+$/
const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/
const domainPattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/
const importGap = String.raw`(?:\s|\/\*[\s\S]*?\*\/)*`
const importSpecifier = new RegExp(String.raw`(?:from${importGap}|import${importGap}(?:\(${importGap})?)(['"])([^'"]+)\1`, 'g')
const forbiddenConfigKeys = new Set(['__proto__', 'prototype', 'constructor'])
const runtimeTokenPattern = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/
const runtimeCapabilityPattern = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/

const isRecord = (value) => value != null && typeof value === 'object' && !Array.isArray(value)

export const isSafeRelativePath = (value) =>
  typeof value === 'string' && value.length > 0 && !path.isAbsolute(value) && !/^[a-z]+:/i.test(value) && !value.split(/[\\/]+/).includes('..')

const isSafeConfigJsonValue = (value) => {
  let nodes = 0
  const visit = (candidate, depth) => {
    nodes += 1
    if (nodes > 4_096 || depth > 16) return false
    if (candidate == null || typeof candidate === 'boolean') return true
    if (typeof candidate === 'number') return Number.isFinite(candidate)
    if (typeof candidate === 'string') return candidate.length <= 8_192
    if (Array.isArray(candidate)) return candidate.every((item) => visit(item, depth + 1))
    if (!isRecord(candidate)) return false
    return Object.entries(candidate).every(([key, item]) =>
      key.length <= 128 && !forbiddenConfigKeys.has(key) && visit(item, depth + 1),
    )
  }
  if (!visit(value, 0)) return false
  return Buffer.byteLength(JSON.stringify(value), 'utf8') <= 64 * 1024
}

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(target))
    else files.push(target)
  }
  return files
}

const hasAllowedRemoteImage = (source, domains) => {
  for (const match of source.matchAll(/https?:\/\/[^\s'"`)<>{}]+/g)) {
    let url
    try { url = new URL(match[0]) } catch { return false }
    if (url.protocol !== 'https:' || !domains.has(url.hostname.toLowerCase())) return false
  }
  return true
}

const validateSource = async (directory, files, domains, errors, { allowInternalMaterialSymbols = false, materialSymbolsRoot, allowedBareModules = [] } = {}) => {
  const allowedModules = new Set(['vue', 'vue-i18n', '@motexa/ride-ui-sdk/client', '@motexa/ride-ui-sdk/contract', '@motexa/ride-ui-sdk/replay', ...allowedBareModules])
  for (const file of files) {
    if (!/\.(?:ts|tsx|js|jsx|vue|css|html)$/i.test(file) || /(?:\.spec\.[^.]+|vitest\.config\.ts)$/i.test(file)) continue
    const source = await readFile(file, 'utf8')
    if (/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*(?:\(|\.)|\bnavigator\.sendBeacon\b/.test(source)) {
      errors.push({ file, message: 'Themes cannot open network connections.' })
    }
    if (/\b(?:eval|Function)\s*\(/.test(source)) {
      errors.push({ file, message: 'Themes cannot evaluate runtime code.' })
    }
    if (/<script\b[^>]*\bsrc\s*=|<link\b[^>]*\brel\s*=\s*['"]?stylesheet|@import\s+(?:url\()?/i.test(source)) {
      errors.push({ file, message: 'Remote or additional script and stylesheet loading is not allowed.' })
    }
    if (/@font-face[\s\S]*https?:\/\//i.test(source)) {
      errors.push({ file, message: 'Remote fonts must be bundled with the theme.' })
    }
    if (!hasAllowedRemoteImage(source, domains)) {
      errors.push({ file, message: 'HTTPS resources must use a declared externalImageDomains hostname.' })
    }

    importSpecifier.lastIndex = 0
    for (const match of source.matchAll(importSpecifier)) {
      const specifier = match[2]
      if (specifier.startsWith('.')) {
        const resolved = path.resolve(path.dirname(file), specifier.split('?', 1)[0])
        if (resolved.startsWith(`${directory}${path.sep}`)) continue
        const canUseInternalIcon = allowInternalMaterialSymbols
          && materialSymbolsRoot != null
          && resolved.startsWith(`${materialSymbolsRoot}${path.sep}`)
          && specifier.endsWith('?raw')
          && resolved.endsWith('.svg')
        if (!canUseInternalIcon) errors.push({ file, message: `forbidden cross-layer import: ${specifier}` })
        continue
      }
      if (allowedModules.has(specifier)) continue
      errors.push({ file, message: `forbidden package or absolute import: ${specifier}` })
    }
  }
}

export const validateThemeDirectory = async (directory, options = {}) => {
  const errors = []
  const manifestPath = path.join(directory, 'ride-ui.json')
  let manifest
  try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')) } catch (error) {
    return { manifest: null, errors: [{ file: manifestPath, message: `Cannot read ride-ui.json: ${error instanceof Error ? error.message : String(error)}` }] }
  }

  const fail = (message, file = manifestPath) => errors.push({ file, message })
  const id = typeof manifest.id === 'string' ? manifest.id : path.basename(directory)
  if (manifest.manifestVersion !== 1) fail('manifestVersion must be 1.')
  if (!themeIdPattern.test(manifest.id ?? '')) fail('id must use lowercase reverse-domain style.')
  if (!options.allowTemplateDirectory && manifest.id !== path.basename(directory)) fail('id must exactly match the theme directory name.')
  if (typeof manifest.name !== 'string' || manifest.name.trim().length === 0 || manifest.name.length > 80) fail('name must contain 1 to 80 characters.')
  if (!semverPattern.test(manifest.version ?? '')) fail('version must be semver.')
  if (!isSafeRelativePath(manifest.entry)) fail('entry must be a safe relative path.')
  if (manifest.api?.major !== 1 || !Number.isInteger(manifest.api?.minMinor) || manifest.api.minMinor < 0) fail('api must declare major 1 and a non-negative minMinor.')
  else if (manifest.api.minMinor > RIDE_UI_API_VERSION.minor) fail(`api.minMinor ${manifest.api.minMinor} exceeds this SDK's API 1.${RIDE_UI_API_VERSION.minor}.`)
  if (!Array.isArray(manifest.orientations) || manifest.orientations.length === 0 || new Set(manifest.orientations).size !== manifest.orientations.length || manifest.orientations.some((value) => value !== 'portrait' && value !== 'landscape')) {
    fail('orientations must contain portrait and/or landscape exactly once.')
  }
  for (const field of ['requiredCapabilities', 'optionalCapabilities']) {
    const capabilities = manifest[field] ?? []
    if (!Array.isArray(capabilities) || capabilities.some((value) => typeof value !== 'string' || !RIDE_UI_ALLOWED_ACTIONS.has(value))) fail(`${field} must contain only Ride UI V1 action names.`)
    else if (new Set(capabilities).size !== capabilities.length) fail(`${field} must not contain duplicates.`)
  }
  if ((manifest.requiredCapabilities ?? []).some((capability) => (manifest.optionalCapabilities ?? []).includes(capability))) fail('A capability cannot be both required and optional.')
  if (manifest.runtime != null) {
    const runtime = manifest.runtime
    if (!isRecord(runtime)) fail('runtime must be an object.')
    else {
      if (!themeIdPattern.test(runtime.publisherId ?? '')) fail('runtime.publisherId must use lowercase reverse-domain style.')
      if (typeof runtime.releaseId !== 'string' || runtime.releaseId.length < 3 || runtime.releaseId.length > 160 || !/^[0-9A-Za-z@._+-]+$/.test(runtime.releaseId)) fail('runtime.releaseId must be a stable 3 to 160 character release identifier.')
      if (runtime.renderer !== 'web') fail('runtime.renderer must be web for a Web source theme.')
      if (!runtimeTokenPattern.test(runtime.variantId ?? '')) fail('runtime.variantId must be a lowercase token.')
      const enumArray = (field, allowed, { required = true } = {}) => {
        const values = runtime[field]
        if (!Array.isArray(values) || (required && values.length === 0) || new Set(values).size !== values.length || values.some((value) => !allowed.has(value))) {
          fail(`runtime.${field} must contain ${required ? 'one or more' : 'only unique'} supported values.`)
        }
      }
      enumArray('targets', new Set(['phone', 'agent']))
      enumArray('renderTargets', new Set(['phone', 'vehicle-cast']))
      enumArray('requiredInputCapabilities', new Set(['touch', 'pointer', 'keyboard']), { required: false })
      if (!Number.isInteger(runtime.minAndroidApi) || runtime.minAndroidApi < 23) fail('runtime.minAndroidApi must be an integer of at least 23.')
      if (!isRecord(runtime.runtimeRequirements) || !Number.isInteger(runtime.runtimeRequirements.minWebViewMajor) || runtime.runtimeRequirements.minWebViewMajor < 1 || !Array.isArray(runtime.runtimeRequirements.features) || runtime.runtimeRequirements.features.some((value) => !runtimeCapabilityPattern.test(value))) fail('runtime.runtimeRequirements must declare minWebViewMajor and feature tokens.')
      if (!isRecord(runtime.viewport) || !Number.isInteger(runtime.viewport.minWidth) || runtime.viewport.minWidth < 1 || !Number.isInteger(runtime.viewport.minHeight) || runtime.viewport.minHeight < 1 || !Number.isInteger(runtime.viewport.maxWidth) || runtime.viewport.maxWidth < runtime.viewport.minWidth || !Number.isInteger(runtime.viewport.maxHeight) || runtime.viewport.maxHeight < runtime.viewport.minHeight || typeof runtime.viewport.scalable !== 'boolean') fail('runtime.viewport must declare valid min/max dimensions and scalable.')
      for (const field of ['dataCapabilities', 'rendererFeatures']) {
        const values = runtime[field]
        if (!Array.isArray(values) || new Set(values).size !== values.length || values.some((value) => !runtimeCapabilityPattern.test(value))) fail(`runtime.${field} must contain unique capability tokens.`)
      }
      if (!isRecord(runtime.metadata) || typeof runtime.metadata.author !== 'string' || runtime.metadata.author.trim().length === 0 || typeof runtime.metadata.license !== 'string' || runtime.metadata.license.trim().length === 0 || typeof runtime.metadata.description !== 'string') fail('runtime.metadata must declare author, license, and description.')
      if (!isRecord(runtime.performance) || !Array.isArray(runtime.performance.targetRefreshHz) || runtime.performance.targetRefreshHz.length === 0 || runtime.performance.targetRefreshHz.some((value) => !Number.isInteger(value) || value < 1 || value > 240) || !['low', 'standard', 'high'].includes(runtime.performance.resourceClass)) fail('runtime.performance must declare targetRefreshHz and resourceClass.')
    }
  }
  const domains = new Set()
  if (manifest.externalImageDomains != null && (!Array.isArray(manifest.externalImageDomains) || manifest.externalImageDomains.some((domain) => typeof domain !== 'string' || !domainPattern.test(domain)))) {
    fail('externalImageDomains must contain lowercase DNS hostnames only.')
  } else {
    for (const domain of manifest.externalImageDomains ?? []) domains.add(domain)
  }
  if (manifest.preview != null) {
    const image = manifest.preview?.image
    const imagePath = isSafeRelativePath(image) ? path.resolve(directory, image) : null
    if (!isSafeRelativePath(image) || !/\.(?:webp|png|jpe?g|svg)$/i.test(image) || imagePath == null || !imagePath.startsWith(`${directory}${path.sep}`)) fail('preview.image must be a safe image path.')
    else { try { await stat(imagePath) } catch { fail(`preview image does not exist: ${image}`) } }
    const scenarios = manifest.preview.scenarios
    if (scenarios != null) {
      const ids = new Set()
      if (!Array.isArray(scenarios) || scenarios.length === 0) fail('preview.scenarios must contain at least one scenario when declared.')
      else for (const scenario of scenarios) {
        if (!isRecord(scenario) || typeof scenario.id !== 'string' || !/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(scenario.id) || ids.has(scenario.id)) {
          fail('preview.scenarios must contain unique lowercase scenario ids.')
          continue
        }
        ids.add(scenario.id)
        if (!isRecord(scenario.label) || typeof scenario.label.zh !== 'string' || typeof scenario.label.en !== 'string' || !scenario.label.zh.trim() || !scenario.label.en.trim()) fail(`preview scenario ${scenario.id} must provide Chinese and English labels.`)
        for (const field of ['speedKmh', 'powerW', 'throttlePct', 'throttleVoltage']) {
          if (scenario[field] != null && (typeof scenario[field] !== 'number' || !Number.isFinite(scenario[field]))) fail(`preview scenario ${scenario.id}.${field} must be a finite number.`)
        }
        if (scenario.visualState != null && !['calm', 'boost', 'surge', 'alert'].includes(scenario.visualState)) fail(`preview scenario ${scenario.id}.visualState is invalid.`)
      }
    }
  }
  if (manifest.config != null) {
    const config = manifest.config
    const schemaPath = isSafeRelativePath(config.schema) ? path.resolve(directory, config.schema) : null
    if (!Number.isInteger(config.schemaVersion) || config.schemaVersion < 1) fail('config.schemaVersion must be a positive integer.')
    if (!isSafeRelativePath(config.schema) || !config.schema.endsWith('.schema.json') || schemaPath == null || !schemaPath.startsWith(`${directory}${path.sep}`)) fail('config.schema must be a safe relative *.schema.json path.')
    else {
      try {
        const schema = JSON.parse(await readFile(schemaPath, 'utf8'))
        const validate = new Ajv({ allErrors: true, strict: true, $data: true }).compile(schema)
        if (!Object.hasOwn(config, 'default')) fail('config.default is required.')
        else if (!isSafeConfigJsonValue(config.default)) fail('config.default exceeds runtime JSON safety limits.')
        else if (!validate(config.default)) fail(`config.default does not match schema: ${validate.errors?.map((error) => error.message).join(', ')}`)
      } catch (error) { fail(`Cannot compile config schema: ${error instanceof Error ? error.message : String(error)}`, schemaPath) }
    }
  }
  if (isSafeRelativePath(manifest.entry)) {
    const entryPath = path.resolve(directory, manifest.entry)
    if (!entryPath.startsWith(`${directory}${path.sep}`)) fail('entry escapes the theme directory.')
    else { try { await stat(entryPath) } catch { fail(`entry does not exist: ${manifest.entry}`) } }
  }
  const files = await walk(directory)
  await validateSource(directory, files, domains, errors, options)
  return { id, manifest, errors }
}
