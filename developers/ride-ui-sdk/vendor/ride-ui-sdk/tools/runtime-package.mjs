import { createHash } from 'node:crypto'
import path from 'node:path'

import { RIDE_UI_API_VERSION, RIDE_UI_IMPLEMENTED_CAPABILITIES } from '../dist/constants.js'

const textEncoder = new TextEncoder()
const allowedTargets = new Set(['phone', 'agent'])
const allowedRenderTargets = new Set(['phone', 'vehicle-cast'])
const allowedInputCapabilities = new Set(['touch', 'pointer', 'keyboard'])
const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 4096
const MAX_IMAGE_TOTAL_BYTES = 16 * 1024 * 1024

export const RIDE_UI_RUNTIME_PACKAGE_FORMAT_VERSION = 1
export const RIDE_UI_RUNTIME_PACKAGE_KIND = 'web-bundle'

export const sha256Hex = (value) => createHash('sha256').update(value).digest('hex')

export const encodeCanonicalJson = (value) => textEncoder.encode(`${JSON.stringify(value, null, 2)}\n`)

const isRecord = (value) => value != null && typeof value === 'object' && !Array.isArray(value)

const assertSafePackagePath = (value) => {
  if (
    typeof value !== 'string'
    || value.length === 0
    || value.includes('\\')
    || path.posix.isAbsolute(value)
    || value.split('/').some((segment) => segment.length === 0 || segment === '.' || segment === '..')
  ) throw new Error(`Unsafe runtime package path: ${String(value)}`)
}

const assertUniqueEnumArray = (value, allowed, field, { empty = false } = {}) => {
  if (!Array.isArray(value) || (!empty && value.length === 0) || new Set(value).size !== value.length || value.some((item) => !allowed.has(item))) {
    throw new Error(`${field} contains unsupported or duplicate values.`)
  }
}

const assertTokenArray = (value, field) => {
  if (!Array.isArray(value) || new Set(value).size !== value.length || value.some((item) => typeof item !== 'string' || !/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(item))) {
    throw new Error(`${field} must contain unique lowercase capability tokens.`)
  }
}

const asUtf8 = (bytes) => new TextDecoder('utf-8', { fatal: true }).decode(bytes)

const readU16 = (bytes, offset) => bytes[offset] | (bytes[offset + 1] << 8)
const readU32 = (bytes, offset) => (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0

const imageDimensions = (filePath, bytes) => {
  const extension = path.posix.extname(filePath).toLowerCase()
  if (extension === '.png' && bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { width: readU32(bytes, 16), height: readU32(bytes, 20) }
  }
  if ((extension === '.jpg' || extension === '.jpeg') && bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue }
      const marker = bytes[offset + 1]
      const length = (bytes[offset + 2] << 8) | bytes[offset + 3]
      if (length < 2 || offset + length + 2 > bytes.length) break
      if (marker >= 0xc0 && marker <= 0xc3 || marker >= 0xc5 && marker <= 0xc7 || marker >= 0xc9 && marker <= 0xcb || marker >= 0xcd && marker <= 0xcf) {
        return { width: (bytes[offset + 7] << 8) | bytes[offset + 8], height: (bytes[offset + 5] << 8) | bytes[offset + 6] }
      }
      offset += length + 2
    }
  }
  if (extension === '.webp' && bytes.length >= 30 && asUtf8(bytes.subarray(0, 4)) === 'RIFF' && asUtf8(bytes.subarray(8, 12)) === 'WEBP') {
    const kind = asUtf8(bytes.subarray(12, 16))
    if (kind === 'VP8X') return { width: 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)), height: 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)) }
    if (kind === 'VP8 ' && bytes.length > 30) return { width: readU16(bytes, 26), height: readU16(bytes, 28) }
    if (kind === 'VP8L' && bytes.length > 25) return { width: 1 + (((bytes[21] | (bytes[22] << 8) | (bytes[23] << 16)) & 0x3fff)), height: 1 + (((bytes[23] >> 6 | (bytes[24] << 2) | (bytes[25] << 10)) & 0x3fff)) }
  }
  return null
}

const validateStaticSvg = (filePath, bytes) => {
  let source
  try { source = asUtf8(bytes) } catch { throw new Error(`SVG must be valid UTF-8: ${filePath}`) }
  if (source.length > 2 * 1024 * 1024) throw new Error(`SVG exceeds the 2 MiB limit: ${filePath}`)
  if (!/<svg(?:\s|>)/i.test(source)) throw new Error(`SVG root is missing: ${filePath}`)
  if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(source)) throw new Error(`SVG document type declarations and external stylesheets are not allowed: ${filePath}`)
  if (/xmlns\s*=\s*["'](?!http:\/\/www\.w3\.org\/2000\/svg)[^"']+["']/i.test(source)) throw new Error(`SVG contains an unsupported default namespace: ${filePath}`)
  if (/<(?:script|foreignObject|animate|animateMotion|animateTransform|set|filter|image)\b/i.test(source) || /\bon[a-z]+\s*=/i.test(source)) {
    throw new Error(`SVG contains executable, animated, filtered, or embedded content: ${filePath}`)
  }
  if (/(?:href|xlink:href)\s*=\s*["']\s*(?:https?:|\/\/|data:|file:|content:)/i.test(source) || /url\s*\(\s*(?:https?:|\/\/|file:|content:)/i.test(source)) {
    throw new Error(`SVG contains an external resource reference: ${filePath}`)
  }
  if (/<style\b[^>]*>[\s\S]*?(?:@import|url\s*\([^)]*\b(?:https?:|\/\/))/i.test(source)) throw new Error(`SVG contains external CSS: ${filePath}`)
  const viewBox = source.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)
  if (viewBox != null) {
    const values = viewBox[1].trim().split(/[\s,]+/).map(Number)
    if (values.length !== 4 || values.some((value) => !Number.isFinite(value) || Math.abs(value) > MAX_IMAGE_DIMENSION)) throw new Error(`SVG viewBox is outside the supported bounds: ${filePath}`)
  }
  const namespaceMatches = [...source.matchAll(/xmlns(?::([\w.-]+))?\s*=\s*["']([^"']+)["']/gi)]
  if (namespaceMatches.some(([, prefix, uri]) => prefix != null && uri !== 'http://www.w3.org/2000/svg')) throw new Error(`SVG contains an unsupported namespace: ${filePath}`)
}

const validateRuntimeResourceContents = (entries) => {
  let imageBytes = 0
  for (const [filePath, bytes] of entries) {
    const extension = path.posix.extname(filePath).toLowerCase()
    if (['.js', '.mjs', '.css', '.html', '.htm', '.svg'].includes(extension)) {
      let source
      try { source = asUtf8(bytes) } catch { throw new Error(`Runtime text resource must be valid UTF-8: ${filePath}`) }
      const withoutXmlNamespaces = source.replace(/(["'`])http:\/\/www\.w3\.org\/(?:2000\/svg|1999\/xhtml|1999\/xlink|1998\/Math\/MathML)\1/g, "'xml-namespace:'")
      if (/https?:\/\/|\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|importScripts)\s*\(|\bnavigator\.(?:sendBeacon|serviceWorker)\b|\b(?:eval|Function|WebAssembly\.(?:compile|instantiate))\s*\(/.test(withoutXmlNamespaces)) {
        throw new Error(`Runtime resource contains a network or dynamic-execution primitive: ${filePath}`)
      }
      if (/@import\b|url\s*\(\s*(?:https?:|\/\/|file:|content:)/i.test(source) || /<(?:script|link)\b[^>]*(?:https?:\/\/|\/\/|file:|content:)/i.test(source)) {
        throw new Error(`Runtime resource contains external script, stylesheet, or URL loading: ${filePath}`)
      }
    }
    if (['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(extension)) {
      if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error(`Image exceeds the 4 MiB limit: ${filePath}`)
      const validSignature = extension === '.png'
        ? bytes.length >= 8 && bytes[0] === 0x89 && asUtf8(bytes.subarray(1, 4)) === 'PNG' && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
        : extension === '.jpg' || extension === '.jpeg'
          ? bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8
          : extension === '.webp'
            ? bytes.length >= 16 && asUtf8(bytes.subarray(0, 4)) === 'RIFF' && asUtf8(bytes.subarray(8, 12)) === 'WEBP'
            : true
      if (!validSignature) throw new Error(`Image format is invalid: ${filePath}`)
      imageBytes += bytes.byteLength
      if (imageBytes > MAX_IMAGE_TOTAL_BYTES) throw new Error('Runtime image resources exceed the 16 MiB total limit')
      if (extension === '.svg') validateStaticSvg(filePath, bytes)
      const dimensions = imageDimensions(filePath, bytes)
      if (extension !== '.svg' && dimensions == null) throw new Error(`Image dimensions are missing or invalid: ${filePath}`)
      if (dimensions != null && (dimensions.width < 1 || dimensions.height < 1 || dimensions.width > MAX_IMAGE_DIMENSION || dimensions.height > MAX_IMAGE_DIMENSION)) throw new Error(`Image dimensions exceed 4096x4096: ${filePath}`)
    }
  }
}

const assertRuntimeSourceManifest = (sourceManifest) => {
  if (!isRecord(sourceManifest) || sourceManifest.manifestVersion !== 1) throw new Error('ride-ui.json must be a manifestVersion 1 object.')
  if (sourceManifest.api?.major !== RIDE_UI_API_VERSION.major || !Number.isInteger(sourceManifest.api?.minMinor) || sourceManifest.api.minMinor < 0 || sourceManifest.api.minMinor > RIDE_UI_API_VERSION.minor) {
    throw new Error(`Theme API must be compatible with SDK ${RIDE_UI_API_VERSION.major}.${RIDE_UI_API_VERSION.minor}.`)
  }
  const runtime = sourceManifest.runtime
  if (!isRecord(runtime)) throw new Error('ride-ui.json runtime metadata is required for theme:pack-runtime.')
  if (runtime.renderer !== 'web') throw new Error('Only renderer=web can produce a Web runtime package.')
  if (typeof runtime.publisherId !== 'string' || typeof runtime.releaseId !== 'string' || typeof runtime.variantId !== 'string') throw new Error('Runtime publisherId, releaseId, and variantId are required.')
  assertUniqueEnumArray(runtime.targets, allowedTargets, 'runtime.targets')
  assertUniqueEnumArray(runtime.renderTargets, allowedRenderTargets, 'runtime.renderTargets')
  assertUniqueEnumArray(runtime.requiredInputCapabilities, allowedInputCapabilities, 'runtime.requiredInputCapabilities', { empty: true })
  assertTokenArray(runtime.dataCapabilities, 'runtime.dataCapabilities')
  assertTokenArray(runtime.rendererFeatures, 'runtime.rendererFeatures')
  const requiredActions = sourceManifest.requiredCapabilities ?? []
  const optionalActions = sourceManifest.optionalCapabilities ?? []
  for (const action of [...requiredActions, ...optionalActions]) {
    if (!RIDE_UI_IMPLEMENTED_CAPABILITIES.includes(action)) throw new Error(`Unknown Ride UI action: ${action}`)
  }
  if ((sourceManifest.externalImageDomains?.length ?? 0) > 0) throw new Error('Agent runtime packages cannot declare externalImageDomains; phone runtime packages also require every image resource to be bundled locally.')
  return runtime
}

const normalizedEntries = (files) => {
  if (!(files instanceof Map)) throw new Error('Runtime files must be provided as a Map.')
  const entries = [...files.entries()].map(([filePath, bytes]) => {
    assertSafePackagePath(filePath)
    if (filePath === 'package-manifest.json') throw new Error('package-manifest.json is generated and cannot be supplied as a resource.')
    if (!(bytes instanceof Uint8Array)) throw new Error(`Runtime resource must be Uint8Array: ${filePath}`)
    return [filePath, bytes]
  })
  entries.sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
  if (new Set(entries.map(([filePath]) => filePath)).size !== entries.length) throw new Error('Runtime resource paths must be unique.')
  return entries
}

export const createRideUiRuntimePackage = ({ sourceManifest, sourceManifestBytes, files }) => {
  const runtime = assertRuntimeSourceManifest(sourceManifest)
  if (!(sourceManifestBytes instanceof Uint8Array)) throw new Error('sourceManifestBytes must be Uint8Array.')
  const entries = normalizedEntries(files)
  validateRuntimeResourceContents(entries)
  const byPath = new Map(entries)
  if (!byPath.has('ride-ui.json')) throw new Error('Runtime package must contain ride-ui.json.')
  if (sha256Hex(byPath.get('ride-ui.json')) !== sha256Hex(sourceManifestBytes)) throw new Error('The packaged ride-ui.json does not match the validated source manifest bytes.')
  if (!byPath.has('web/index.html')) throw new Error('Runtime package must contain compiled web/index.html.')

  const resourceFiles = entries.map(([filePath, bytes]) => ({
    path: filePath,
    bytes: bytes.byteLength,
    sha256: sha256Hex(bytes),
  }))
  for (const resource of resourceFiles) {
    if (resource.bytes === 0 && (resource.path === 'web/index.html' || resource.path === 'ride-ui.json')) {
      throw new Error(`Runtime entry resources must not be empty: ${resource.path}`)
    }
  }
  const resourceByPath = new Map(resourceFiles.map((resource) => [resource.path, resource]))
  const config = sourceManifest.config == null ? null : {
    schemaVersion: sourceManifest.config.schemaVersion,
    schemaPath: 'config/schema.json',
    defaultsPath: 'config/defaults.json',
    defaultsSha256: resourceByPath.get('config/defaults.json')?.sha256 ?? null,
  }
  if (config != null && (!resourceByPath.has(config.schemaPath) || config.defaultsSha256 == null)) throw new Error('Configured themes must package config/schema.json and config/defaults.json.')
  const previewPath = sourceManifest.preview == null ? null : 'preview/preview' + path.posix.extname(sourceManifest.preview.image).toLowerCase()
  if (previewPath != null && !resourceByPath.has(previewPath)) throw new Error(`Runtime preview is missing: ${previewPath}`)

  const packageManifest = {
    packageFormatVersion: RIDE_UI_RUNTIME_PACKAGE_FORMAT_VERSION,
    packageKind: RIDE_UI_RUNTIME_PACKAGE_KIND,
    themeId: sourceManifest.id,
    themeVersion: sourceManifest.version,
    releaseId: runtime.releaseId,
    publisherId: runtime.publisherId,
    renderer: runtime.renderer,
    variantId: runtime.variantId,
    entry: 'web/index.html',
    api: { major: sourceManifest.api.major, minMinor: sourceManifest.api.minMinor },
    sourceManifest: { path: 'ride-ui.json', sha256: sha256Hex(sourceManifestBytes) },
    targets: [...runtime.targets],
    minAndroidApi: runtime.minAndroidApi,
    runtimeRequirements: runtime.runtimeRequirements,
    display: {
      orientations: [...sourceManifest.orientations],
      renderTargets: [...runtime.renderTargets],
      viewport: runtime.viewport,
      requiredInputCapabilities: [...runtime.requiredInputCapabilities],
    },
    capabilities: {
      requiredActions: [...(sourceManifest.requiredCapabilities ?? [])],
      optionalActions: [...(sourceManifest.optionalCapabilities ?? [])],
      data: [...runtime.dataCapabilities],
      rendererFeatures: [...runtime.rendererFeatures],
    },
    config,
    resources: {
      fileCount: resourceFiles.length,
      totalBytes: resourceFiles.reduce((total, resource) => total + resource.bytes, 0),
      files: resourceFiles,
    },
    metadata: {
      name: sourceManifest.name,
      description: runtime.metadata.description,
      author: runtime.metadata.author,
      license: runtime.metadata.license,
      previewPath,
    },
    performance: runtime.performance,
    trust: {
      origin: 'owner-digest-approval-required',
      signature: null,
      officiallyReviewed: false,
    },
  }
  const packageManifestBytes = encodeCanonicalJson(packageManifest)
  return {
    packageManifest,
    packageManifestBytes,
    packageManifestSha256: sha256Hex(packageManifestBytes),
    files: new Map([['package-manifest.json', packageManifestBytes], ...entries]),
  }
}

export const verifyRideUiRuntimePackage = (files) => {
  const errors = []
  let manifest
  const packageManifestBytes = files instanceof Map ? files.get('package-manifest.json') : null
  if (!(packageManifestBytes instanceof Uint8Array)) return { manifest: null, manifestSha256: null, errors: ['package-manifest.json is missing.'] }
  try { manifest = JSON.parse(new TextDecoder().decode(packageManifestBytes)) } catch (error) {
    return { manifest: null, manifestSha256: sha256Hex(packageManifestBytes), errors: [`package-manifest.json is invalid JSON: ${error instanceof Error ? error.message : String(error)}`] }
  }
  if (manifest.packageFormatVersion !== RIDE_UI_RUNTIME_PACKAGE_FORMAT_VERSION) errors.push('Unsupported packageFormatVersion.')
  if (manifest.packageKind !== RIDE_UI_RUNTIME_PACKAGE_KIND) errors.push('packageKind must be web-bundle.')
  if (manifest.renderer !== 'web') errors.push('renderer must be web.')
  if (manifest.entry !== 'web/index.html') errors.push('entry must be web/index.html.')
  if (manifest.api?.major !== RIDE_UI_API_VERSION.major || !Number.isInteger(manifest.api?.minMinor) || manifest.api.minMinor > RIDE_UI_API_VERSION.minor) errors.push(`Package API is incompatible with SDK ${RIDE_UI_API_VERSION.major}.${RIDE_UI_API_VERSION.minor}.`)
  try {
    assertUniqueEnumArray(manifest.targets, allowedTargets, 'targets')
    assertUniqueEnumArray(manifest.display?.renderTargets, allowedRenderTargets, 'display.renderTargets')
    assertUniqueEnumArray(manifest.display?.requiredInputCapabilities, allowedInputCapabilities, 'display.requiredInputCapabilities', { empty: true })
    assertTokenArray(manifest.capabilities?.data, 'capabilities.data')
    assertTokenArray(manifest.capabilities?.rendererFeatures, 'capabilities.rendererFeatures')
  } catch (error) { errors.push(error instanceof Error ? error.message : String(error)) }
  if (!Number.isInteger(manifest.minAndroidApi) || manifest.minAndroidApi < 23) errors.push('minAndroidApi is invalid.')
  if (!isRecord(manifest.runtimeRequirements) || !Number.isInteger(manifest.runtimeRequirements.minWebViewMajor) || !Array.isArray(manifest.runtimeRequirements.features)) errors.push('runtimeRequirements is invalid.')
  const requiredActions = manifest.capabilities?.requiredActions
  const optionalActions = manifest.capabilities?.optionalActions
  if (!Array.isArray(requiredActions) || !Array.isArray(optionalActions) || [...requiredActions, ...optionalActions].some((action) => !RIDE_UI_IMPLEMENTED_CAPABILITIES.includes(action)) || requiredActions.some((action) => optionalActions.includes(action))) errors.push('Action capabilities are invalid, unknown, or overlap.')
  if (manifest.trust?.origin !== 'owner-digest-approval-required' || manifest.trust?.signature !== null || manifest.trust?.officiallyReviewed !== false) errors.push('Unsigned personal runtime packages must require owner digest approval and cannot claim review.')
  const declared = Array.isArray(manifest.resources?.files) ? manifest.resources.files : []
  const actualPaths = files instanceof Map ? [...files.keys()].filter((filePath) => filePath !== 'package-manifest.json').sort((a, b) => a < b ? -1 : a > b ? 1 : 0) : []
  const declaredPaths = declared.map((resource) => resource?.path)
  if (new Set(declaredPaths).size !== declaredPaths.length || JSON.stringify(declaredPaths) !== JSON.stringify(actualPaths)) errors.push('Runtime resource list does not exactly match package files in sorted order.')
  let totalBytes = 0
  for (const resource of declared) {
    try { assertSafePackagePath(resource.path) } catch (error) { errors.push(error.message); continue }
    const bytes = files.get(resource.path)
    if (!(bytes instanceof Uint8Array)) { errors.push(`Missing resource: ${resource.path}`); continue }
    totalBytes += bytes.byteLength
    if (resource.bytes !== bytes.byteLength) errors.push(`Byte length mismatch: ${resource.path}`)
    if (resource.sha256 !== sha256Hex(bytes)) errors.push(`SHA-256 mismatch: ${resource.path}`)
    if (resource.bytes === 0 && (resource.path === 'web/index.html' || resource.path === 'ride-ui.json')) errors.push(`Runtime entry resources must not be empty: ${resource.path}`)
  }
  if (manifest.resources?.fileCount !== declared.length) errors.push('resources.fileCount is incorrect.')
  if (manifest.resources?.totalBytes !== totalBytes) errors.push('resources.totalBytes is incorrect.')
  const sourceBytes = files instanceof Map ? files.get(manifest.sourceManifest?.path) : null
  if (!(sourceBytes instanceof Uint8Array) || manifest.sourceManifest?.sha256 !== sha256Hex(sourceBytes)) errors.push('sourceManifest digest is missing or invalid.')
  if (manifest.sourceManifest?.path !== 'ride-ui.json') errors.push('sourceManifest.path must be ride-ui.json.')
  if (sourceBytes instanceof Uint8Array) {
    try {
      const source = JSON.parse(new TextDecoder().decode(sourceBytes))
      const runtime = source.runtime
      if (source.id !== manifest.themeId || source.version !== manifest.themeVersion) errors.push('Package identity does not match ride-ui.json.')
      if (JSON.stringify(source.api) !== JSON.stringify(manifest.api)) errors.push('Package API does not match ride-ui.json.')
      if (runtime?.releaseId !== manifest.releaseId || runtime?.publisherId !== manifest.publisherId || runtime?.renderer !== manifest.renderer || runtime?.variantId !== manifest.variantId) errors.push('Package release or renderer identity does not match ride-ui.json.')
      if (JSON.stringify(runtime?.targets) !== JSON.stringify(manifest.targets) || JSON.stringify(runtime?.renderTargets) !== JSON.stringify(manifest.display?.renderTargets)) errors.push('Package targets do not match ride-ui.json.')
      if (JSON.stringify(source.requiredCapabilities ?? []) !== JSON.stringify(requiredActions) || JSON.stringify(source.optionalCapabilities ?? []) !== JSON.stringify(optionalActions)) errors.push('Package action capabilities do not match ride-ui.json.')
      if ((source.externalImageDomains?.length ?? 0) > 0) errors.push('Agent package ride-ui.json declares forbidden external image domains; phone packages must bundle every image resource.')
    } catch (error) { errors.push(`ride-ui.json is invalid: ${error instanceof Error ? error.message : String(error)}`) }
  }
  if (!(files instanceof Map) || !files.has(manifest.entry)) errors.push('Compiled Web entry is missing.')
  try { validateRuntimeResourceContents(files instanceof Map ? [...files.entries()].filter(([filePath]) => filePath !== 'package-manifest.json') : []) } catch (error) { errors.push(error instanceof Error ? error.message : String(error)) }
  return { manifest, manifestSha256: sha256Hex(packageManifestBytes), errors }
}
