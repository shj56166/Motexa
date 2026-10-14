import type { RideUiMetricFreshness, RideUiMetricQuality, RideUiMetricSource, RideUiDisplayFrameV1 } from './contract';
/** Presentation-shaped replay fixture for browser development; no production JS interpolator. */
export declare const createRideUiDisplayReplayFrameV1: (scenarioId: RideUiReplayScenarioIdV1, elapsedMs: number, frameSeq: number, baseEpochMs?: number) => RideUiDisplayFrameV1;
export declare const RIDE_UI_REPLAY_DURATION_MS: 60000;
export declare const RIDE_UI_REPLAY_SCENARIOS_V1: readonly [{
    readonly id: "normal";
    readonly label: "Normal ride";
}, {
    readonly id: "missing-gps";
    readonly label: "Missing GPS";
}, {
    readonly id: "stale";
    readonly label: "Stale telemetry";
}, {
    readonly id: "regeneration";
    readonly label: "Regenerative braking";
}, {
    readonly id: "source-switch";
    readonly label: "GPS to vehicle source switch";
}, {
    readonly id: "clock-shift";
    readonly label: "Wall-clock rollback";
}, {
    readonly id: "vehicle-status";
    readonly label: "Vehicle gear / parking states";
}];
export type RideUiReplayScenarioIdV1 = typeof RIDE_UI_REPLAY_SCENARIOS_V1[number]['id'];
export interface RideUiReplaySignalV1 {
    value: number | null;
    source: RideUiMetricSource;
    quality: RideUiMetricQuality;
    freshness: RideUiMetricFreshness;
    sampledAtEpochMs: number | null;
}
export interface RideUiReplaySampleV1 {
    schemaVersion: 1;
    scenarioId: RideUiReplayScenarioIdV1;
    elapsedMs: number;
    monotonicMs: number;
    generatedAtEpochMs: number;
    note: string;
    speed: RideUiReplaySignalV1;
    gpsSpeed: RideUiReplaySignalV1;
    vehicleSpeed: RideUiReplaySignalV1;
    power: RideUiReplaySignalV1;
    vehicleGear: RideUiReplaySignalV1;
    vehicleParking: RideUiReplaySignalV1;
}
export declare const createRideUiReplaySampleV1: (scenarioId: RideUiReplayScenarioIdV1, elapsedMs: number, baseEpochMs?: number) => RideUiReplaySampleV1;
