/** Presentation-shaped replay fixture for browser development; no production JS interpolator. */
export const createRideUiDisplayReplayFrameV1 = (scenarioId, elapsedMs, frameSeq, baseEpochMs = 1_800_000_000_000) => {
    const sample = createRideUiReplaySampleV1(scenarioId, elapsedMs, baseEpochMs);
    return {
        frameSeq, generatedAtEpochMs: sample.generatedAtEpochMs, generatedAtMonotonicMs: sample.monotonicMs,
        speedKmh: sample.speed.value, source: sample.speed.source,
        state: sample.speed.value == null ? 'missing' : sample.speed.freshness === 'stale' ? 'held' : 'live',
        bufferMs: 0, periodMs: 1_000,
    };
};
export const RIDE_UI_REPLAY_DURATION_MS = 60_000;
export const RIDE_UI_REPLAY_SCENARIOS_V1 = [
    { id: 'normal', label: 'Normal ride' },
    { id: 'missing-gps', label: 'Missing GPS' },
    { id: 'stale', label: 'Stale telemetry' },
    { id: 'regeneration', label: 'Regenerative braking' },
    { id: 'source-switch', label: 'GPS to vehicle source switch' },
    { id: 'clock-shift', label: 'Wall-clock rollback' },
    { id: 'vehicle-status', label: 'Vehicle gear / parking states' },
];
const clampElapsed = (elapsedMs) => Math.max(0, Math.min(RIDE_UI_REPLAY_DURATION_MS, Number.isFinite(elapsedMs) ? Math.round(elapsedMs) : 0));
const measured = (value, source, sampledAtEpochMs) => ({
    value,
    source,
    quality: 'measured',
    freshness: 'fresh',
    sampledAtEpochMs,
});
const missing = (source) => ({
    value: null,
    source,
    quality: 'missing',
    freshness: 'unavailable',
    sampledAtEpochMs: null,
});
export const createRideUiReplaySampleV1 = (scenarioId, elapsedMs, baseEpochMs = 1_735_689_600_000) => {
    const elapsed = clampElapsed(elapsedMs);
    const phase = elapsed / RIDE_UI_REPLAY_DURATION_MS;
    const speedKmh = Number((24 + Math.sin(phase * Math.PI * 2) * 15 + phase * 22).toFixed(1));
    const normalPowerW = Math.round(1_200 + Math.sin(phase * Math.PI * 4) * 1_800 + speedKmh * 42);
    const wallClockRollbackMs = scenarioId === 'clock-shift' && elapsed >= 30_000 ? -45_000 : 0;
    const generatedAtEpochMs = baseEpochMs + elapsed + wallClockRollbackMs;
    const gps = measured(speedKmh, 'gps', generatedAtEpochMs);
    const vehicle = measured(Number((speedKmh * 0.994).toFixed(1)), 'vehicle', generatedAtEpochMs);
    const power = measured(normalPowerW, 'bms', generatedAtEpochMs);
    let speed = gps;
    let gpsSpeed = gps;
    let vehicleSpeed = vehicle;
    let note = 'All primary telemetry is fresh.';
    let vehicleGear = missing('none');
    let vehicleParking = missing('none');
    if (scenarioId === 'vehicle-status') {
        if (elapsed < 30_000) {
            vehicleGear = measured(1 + Math.floor(elapsed / 5_000) % 3, 'vehicle', generatedAtEpochMs);
            vehicleParking = measured(elapsed < 15_000 ? 1 : 0, 'vehicle', generatedAtEpochMs);
            note = 'Low, middle and high gear, first in P and then with P released.';
        }
        else if (elapsed < 40_000) {
            vehicleParking = measured(0, 'vehicle', generatedAtEpochMs);
            note = 'Unknown gear; parking released remains a valid zero.';
        }
        else if (elapsed < 50_000) {
            vehicleGear = { ...measured(2, 'vehicle', baseEpochMs + 30_000), quality: 'held', freshness: 'stale' };
            vehicleParking = { ...measured(1, 'vehicle', baseEpochMs + 30_000), quality: 'held', freshness: 'stale' };
            note = 'Old vehicle status must not be displayed as current.';
        }
        else {
            note = 'Status unavailable, including vehicles without verified gear / P mappings.';
        }
    }
    if (scenarioId === 'missing-gps') {
        gpsSpeed = missing('gps');
        speed = vehicle;
        note = 'GPS is unavailable; fused speed uses the vehicle source.';
    }
    else if (scenarioId === 'stale') {
        const sampledAtEpochMs = generatedAtEpochMs - 8_000;
        speed = { ...gps, quality: 'held', freshness: 'stale', sampledAtEpochMs };
        gpsSpeed = { ...speed };
        vehicleSpeed = { ...vehicle, quality: 'held', freshness: 'stale', sampledAtEpochMs };
        power.quality = 'held';
        power.freshness = 'stale';
        power.sampledAtEpochMs = sampledAtEpochMs;
        note = 'All values are held from a sample eight seconds old.';
    }
    else if (scenarioId === 'regeneration') {
        power.value = -Math.round(900 + 1_800 * Math.abs(Math.sin(phase * Math.PI)));
        power.source = 'controller';
        note = 'Negative power represents regenerative braking.';
    }
    else if (scenarioId === 'source-switch' && elapsed >= 30_000) {
        gpsSpeed = missing('gps');
        speed = vehicle;
        note = 'The selected speed source changed from GPS to vehicle at 30 seconds.';
    }
    else if (scenarioId === 'source-switch') {
        note = 'GPS is selected until the 30-second source boundary.';
    }
    else if (scenarioId === 'clock-shift') {
        note = elapsed >= 30_000
            ? 'Wall clock moved back 45 seconds; monotonic replay time still increases.'
            : 'A wall-clock rollback occurs at 30 seconds.';
    }
    return {
        schemaVersion: 1,
        scenarioId,
        elapsedMs: elapsed,
        monotonicMs: elapsed,
        generatedAtEpochMs,
        note,
        speed,
        gpsSpeed,
        vehicleSpeed,
        power,
        vehicleGear,
        vehicleParking,
    };
};
