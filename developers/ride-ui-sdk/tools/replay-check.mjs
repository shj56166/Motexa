import assert from 'node:assert/strict'

import { RIDE_UI_REPLAY_SCENARIOS_V1, createRideUiReplaySampleV1 } from '@motexa/ride-ui-sdk/replay'

const seen = new Set()
for (const scenario of RIDE_UI_REPLAY_SCENARIOS_V1) {
  const start = createRideUiReplaySampleV1(scenario.id, 0)
  const middle = createRideUiReplaySampleV1(scenario.id, 30_000)
  const end = createRideUiReplaySampleV1(scenario.id, 60_000)
  assert.equal(start.scenarioId, scenario.id)
  assert.equal(middle.monotonicMs, 30_000)
  assert.equal(end.elapsedMs, 60_000)
  assert.deepEqual(middle, createRideUiReplaySampleV1(scenario.id, 30_000))
  seen.add(scenario.id)
}
assert.equal(seen.size, RIDE_UI_REPLAY_SCENARIOS_V1.length)
assert.equal(createRideUiReplaySampleV1('vehicle-status', 20_000).vehicleParking.value, 0)
assert.equal(createRideUiReplaySampleV1('vehicle-status', 35_000).vehicleGear.value, null)
assert.equal(createRideUiReplaySampleV1('vehicle-status', 45_000).vehicleParking.freshness, 'stale')
assert.equal(createRideUiReplaySampleV1('vehicle-status', 55_000).vehicleParking.freshness, 'unavailable')
assert.equal(createRideUiReplaySampleV1('missing-gps', 30_000).gpsSpeed.value, null)
assert.ok(createRideUiReplaySampleV1('regeneration', 30_000).power.value < 0)
assert.equal(createRideUiReplaySampleV1('source-switch', 30_000).speed.source, 'vehicle')
assert.ok(createRideUiReplaySampleV1('clock-shift', 30_000).generatedAtEpochMs < createRideUiReplaySampleV1('clock-shift', 29_999).generatedAtEpochMs)

process.stdout.write(`Replay validation passed (${seen.size} deterministic scenarios).\n`)
