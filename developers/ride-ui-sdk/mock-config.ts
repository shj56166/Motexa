import Ajv from 'ajv'
import type { RideUiConfigPatchV1, RideUiInitContextV1 } from '@motexa/ride-ui-sdk/contract'
import manifest from './theme/ride-ui.json'
import schema from './theme/config.schema.json'

export const createMockConfigStore = () => {
  const validate = new Ajv({ strict: true }).compile(schema)
  let current: RideUiInitContextV1['config'] = {
    schemaVersion: manifest.config.schemaVersion, revision: 0, data: structuredClone(manifest.config.default),
  }
  return {
    read: () => structuredClone(current),
    patch: (request: RideUiConfigPatchV1) => {
      const reject = (code: 'invalid' | 'conflict') => ({ ok: false as const, code, config: structuredClone(current) })
      if (request.schemaVersion !== current.schemaVersion) return reject('invalid')
      if (request.baseRevision !== current.revision) return reject('conflict')
      if (!request.patch || typeof request.patch !== 'object' || Array.isArray(request.patch)) return reject('invalid')
      // This example schema has only flat properties; null deletes a property.
      const data = { ...current.data as Record<string, unknown> }
      for (const [key, value] of Object.entries(request.patch)) {
        if (!Object.hasOwn(schema.properties, key)) return reject('invalid')
        if (value === null) delete data[key]
        else data[key] = value
      }
      if (!validate(data)) return reject('invalid')
      current = { ...current, revision: current.revision + 1, data }
      return { ok: true as const, config: structuredClone(current) }
    },
  }
}
