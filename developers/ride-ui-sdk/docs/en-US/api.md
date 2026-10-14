# Data and client API

The authoritative public types are `vendor/ride-ui-sdk/dist/client.d.ts` and `contract.d.ts`. The exported `RIDE_UI_TELEMETRY_KEYS_V1` lists telemetry keys. Theme runtime code imports only `client` and `contract`; `replay` is for development.

## Lifecycle

```ts
import { createRideUiClient } from '@motexa/ride-ui-sdk/client'
import type { RideUiInitContextV1 } from '@motexa/ride-ui-sdk/contract'

const client = createRideUiClient('partner.example-dashboard')
let context: RideUiInitContextV1 | null = null
client.subscribeContext(next => { context = next })
client.subscribeDisplayFrame(frame => {
  const text = frame.speedKmh == null ? '--' : frame.speedKmh.toFixed(0)
  console.log(text, frame.state)
})
client.ready()

async function refresh() {
  if (!context?.capabilities.includes('ride.refresh')) return
  const result = await client.requestAction('ride.refresh')
  if (!result.ok) console.log(result.error?.code)
}

// Dispose on page/component teardown.
```

Use one client per theme instance. Subscriptions return unsubscribe functions. The SDK handles `theme.ready` → `host.init` and later message sessions. Do not recreate the bridge. Session identifiers isolate messages only.

| Method | Purpose |
| --- | --- |
| `ready()` | Announce theme readiness |
| `subscribeContext(listener)` | Mode, locale, scheme, safe areas, capabilities, settings, initial snapshot |
| `subscribeSnapshot(listener)` | Full scene and normalized telemetry |
| `subscribeFrame(listener)` | High-frequency speed, power, selected metrics |
| `subscribeDisplayFrame(listener)` | Host speed presentation frames |
| `requestAction(action, payload?)` | Promise of host action result |
| `reportError(error)` | Report theme errors |
| `dispose()` | Release listeners and pending requests |

## Metrics and missing data

`snapshot.telemetry[key]` is a `RideUiMetricValueV1`:

| Field | Meaning |
| --- | --- |
| `value` / `canonicalUnit` | Numeric value and calculation unit; null means unavailable |
| `displayValue` / `displayUnit` | Host-formatted text and display unit |
| `source` | gps, bms, controller, vehicle, fused, none |
| `quality` | measured, fused, held, estimated, missing |
| `freshness` | fresh, stale, unavailable |
| `sampledAtEpochMs` | Sample wall-clock time, possibly null |
| `ageMs` / `timeMappingQuality` | Optional age and time mapping quality |
| `sourceRef` and provenance | Opaque metadata, not device addresses or callable sessions |
| `estimateMeta` | Optional estimate semantics, status, and coverage |

Prefer display fields for text and numeric values for graphics. Never replace null with zero or present estimates/stale samples as live measurements. Common keys include `speed`, `soc`, `power`, `busCurrent`; devices provide only their supported subset.

## Gear and parking status (API 1.11)

Receive these independent, unitless states through `subscribeSnapshot`, not fast frames. A vehicle can retain its selected gear while in P.

| Key | Values |
| --- | --- |
| `vehicleGear` | 1 = low, 2 = middle, 3 = high; unknown/missing = `null` |
| `vehicleParking` | 1 = P engaged, 0 = P released; unknown/missing = `null` |

ZEEHO provides both states. Ninebot MMAX90 live gear and P mappings remain unverified and return `null`, `quality: 'missing'`, `freshness: 'unavailable'`. Zero speed does not imply parking. The SDK fills absent fields from older API 1.x hosts with unavailable metrics.

```ts
client.subscribeSnapshot(snapshot => {
  const gear = snapshot.telemetry.vehicleGear
  const parking = snapshot.telemetry.vehicleParking
  const gearText = gear?.freshness === 'fresh' && gear.value != null
    ? ({ 1: 'Low', 2: 'Middle', 3: 'High' } as Record<number, string>)[gear.value] ?? '--'
    : '--'
  const parkingText = parking?.freshness === 'fresh' && parking.value != null
    ? parking.value === 1 ? 'P' : 'P released'
    : '--'
  console.log(gearText, parkingText)
})
```

Do not filter out legitimate zero values with a truthiness check. Source metadata and field sampling time are preserved; battery updates cannot refresh old status. Stale values can be labelled as historical, but must not be presented as current. The **Vehicle gear / parking states** preview cycles through all six combinations, unknown gear, stale and unavailable states; manual controls are also available.

## Speed presentation

After a display frame arrives, use `frame.speedKmh` for digits, pointers, and bars, **including null**. Never restore `telemetry.speed` when presentation speed becomes missing. `state` is `live`, `held`, or `missing`.

`telemetry.speed` remains measured telemetry. Do not add a second smoothing filter. Use `resolveRideUiSpeedPrecision(context.speedDecimalEnabled, hideSpeedDecimal)` for decimal precision. Sequence and monotonic time support ordering; wall-clock time alone is insufficient.

## Capabilities and actions

`context.capabilities` lists currently available actions. `context.environment?.dataCapabilities` describes data capabilities. Manifest required/optional capabilities are declarations, not authorization.

| Action | Intent |
| --- | --- |
| `ride.request-exit` / `ride.refresh` | Request exit or refresh |
| `display.set-orientation` | Payload `{ mode: 'portrait' }` or `{ mode: 'landscape' }` |
| `theme.open-picker` / `theme.open-settings` | Open host theme picker/settings |
| `theme.config-patch` | Submit versioned theme settings |
| `vehicle.open-settings` | Open host settings; no vehicle parameter write permission |
| `dynamics.recalibrate` / `ride.black-screen-lock` | Request host calibration or lock |
| `feedback.haptic` / `preview.metrics-reorder` | Host-supported haptics or preview ordering |

Action names do not promise availability in every host/mode. For actions without a payload example, use the public types and supported host behavior rather than guessing parameters.

Results contain `requestId`, `ok`, optional `result`, and `error`. Error codes are `denied`, `unavailable`, `invalid`, `conflict`, `timeout`, `failed`. Keep UI consistent with actual host state after failure.

## Compatibility

Declare API major/minimum minor in the manifest. Tolerate unknown optional fields within API 1.x and guard optional environment fields. Check capabilities before using new features. Package version does not grant host capabilities.

See [Manifest and settings](theme-config.md) and [Build and App installation](build-install.md).
