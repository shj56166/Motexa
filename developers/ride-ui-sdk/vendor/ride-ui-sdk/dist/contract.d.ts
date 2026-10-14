import { RIDE_UI_API_VERSION, RIDE_UI_CHANNEL, RIDE_UI_IMPLEMENTED_CAPABILITIES } from './constants.js';
import { RIDE_UI_TELEMETRY_KEYS_V1 } from './generated/telemetryCatalog.js';
export { RIDE_UI_API_VERSION, RIDE_UI_CHANNEL, RIDE_UI_IMPLEMENTED_CAPABILITIES, RIDE_UI_TELEMETRY_KEYS_V1 };
export type RideUiOrientation = 'portrait' | 'landscape';
export type RideUiContextMode = 'live' | 'edit-preview' | 'background-preview' | 'theme-settings';
export type RideUiColorScheme = 'light' | 'dark';
export type RideUiMetricQuality = 'measured' | 'fused' | 'held' | 'estimated' | 'missing';
export type RideUiMetricFreshness = 'fresh' | 'stale' | 'unavailable';
export type RideUiMetricSource = 'gps' | 'bms' | 'controller' | 'vehicle' | 'fused' | 'none';
export interface RideUiEstimateMetaV1 {
    method?: string;
    semantic?: string;
    status?: 'measured' | 'estimated' | 'provisional' | 'unavailable';
    confidence?: 'high' | 'medium' | 'low' | 'provisional';
    coveragePct?: number | null;
    windowKm?: number | null;
    capacitySource?: string | null;
    energySource?: string | null;
    accountingMode?: 'consumed' | 'net';
    locationAvailable?: boolean | null;
    calibrationState?: string | null;
    reason?: string | null;
}
export type RideUiVisualState = 'calm' | 'boost' | 'surge' | 'alert';
export type RideUiAnimationSource = 'power' | 'throttle' | 'speed';
export type RideUiStatusState = 'ok' | 'pending' | 'failed';
export type RideUiSpeedState = 'live' | 'held';
export type RideUiPreviewMode = 'screen' | 'metrics';
export type RideUiJsonValue = null | boolean | number | string | RideUiJsonValue[] | {
    [key: string]: RideUiJsonValue;
};
export type RideUiHostKindV1 = 'phone' | 'agent';
export type RideUiRendererV1 = 'web' | 'native';
export type RideUiRenderTargetV1 = 'phone' | 'vehicle-cast';
export type RideUiMetricTimeQualityV1 = 'local_monotonic' | 'good' | 'degraded' | 'invalid' | 'unknown';
export declare const resolveRideUiSpeedPrecision: (speedDecimalEnabled: boolean, hideSpeedDecimal: boolean) => 0 | 1;
export interface RideUiSeriesPointV1 {
    at: number;
    value: number | null;
}
export interface RideUiMetricValueV1 {
    value: number | null;
    canonicalUnit: string;
    displayValue: string;
    displayUnit: string;
    source: RideUiMetricSource;
    quality: RideUiMetricQuality;
    freshness: RideUiMetricFreshness;
    sampledAtEpochMs: number | null;
    /** API 1.9 optional provenance extension; relays must preserve these values. */
    sourceRef?: string;
    bootId?: string;
    sourceGeneration?: number;
    sampleSeq?: number;
    sourceMonotonicNanos?: number;
    ageMs?: number | null;
    timeMappingQuality?: RideUiMetricTimeQualityV1;
    mappingUncertaintyMs?: number | null;
    estimateMeta?: RideUiEstimateMetaV1;
}
export type RideUiTelemetryKeyV1 = typeof RIDE_UI_TELEMETRY_KEYS_V1[number];
export type RideUiTelemetryV1 = Record<RideUiTelemetryKeyV1, RideUiMetricValueV1>;
export type RideUiCanonicalMetricV1 = Omit<RideUiMetricValueV1, 'displayValue' | 'displayUnit'>;
/** Native-produced input shared by phone/Agent and adapted unchanged by native/Web renderers. */
export interface RideUiCanonicalDisplaySnapshotV1 {
    schemaMajor: 1;
    schemaMinor: number;
    revision: number;
    generatedAtEpochMs: number;
    metrics: Record<RideUiTelemetryKeyV1, RideUiCanonicalMetricV1>;
}
export declare const createUnavailableRideUiTelemetryV1: () => RideUiTelemetryV1;
export interface RideUiMetricV1 {
    id: string;
    label: string;
    value: string;
    numericValue?: number | null;
    unit: string;
    note?: string;
    source?: string;
    dimmed?: boolean;
    lines?: string[];
    tone: string;
    size: '1x1' | '1x2' | '2x2';
    style: 'minimal' | 'glass' | 'glow';
    slot?: number;
}
export interface RideUiStatusItemV1 {
    key: 'gps' | 'bms' | 'controller';
    label: string;
    state: RideUiStatusState;
    srLabel: string;
}
export interface RideUiBackgroundV1 {
    enabled: boolean;
    imageUrl: string;
    dim: number;
    focalX: number;
    focalY: number;
    zoom: number;
}
export interface RideUiAnimationEffectV1 {
    source: RideUiAnimationSource;
    available: boolean;
    rawRatio: number;
    triggerRatio: number;
    active: boolean;
    intensity: number;
    maxPowerW: number;
    maxSpeedKmh: number;
}
export interface RideUiSceneV1 {
    background: RideUiBackgroundV1;
    hero: {
        speedDisplay: string;
        speedNumericValue: number | null;
        speedDisplayState: RideUiSpeedState;
        powerDisplay: string;
        powerNumericValue: number | null;
        isPowerFocusMode: boolean;
    };
    status: {
        items: RideUiStatusItemV1[];
        isRecording: boolean;
        isMockPreview: boolean;
    };
    metrics: {
        items: RideUiMetricV1[];
        fits: boolean;
        editable: boolean;
    };
    trends: {
        primaryPoints: RideUiSeriesPointV1[];
        secondaryPoints: RideUiSeriesPointV1[];
        powerDisplay: string;
        efficiencyDisplay: string;
        visible: boolean;
        forceVisible: boolean;
    };
    layout: {
        renderTarget?: 'phone' | 'vehicle-cast';
        orientation: RideUiOrientation;
        compactLandscape: boolean;
        compactPortrait: boolean;
        lowPower: boolean;
        animationsEnabled: boolean;
        previewMode: RideUiPreviewMode;
        editableMetrics: boolean;
    };
    controls: {
        visible: boolean;
        orientationLockMode: RideUiOrientation;
        orientationLockLabel: string;
        dynamicsCanRecalibrate: boolean;
        dynamicsCalibrationLabel: string;
        refreshRideDisabled: boolean;
        refreshRideLabel: string;
    };
    hint: {
        title: string | null;
        detail: string | null;
        tone: 'info' | 'success' | 'warning';
    };
    calibrationStatus: {
        visible: boolean;
        state: 'gps_calibrating' | 'estimated_waiting_gps' | 'waiting_inputs';
        label: string;
        detail: string | null;
    };
    visualSignals: {
        state: RideUiVisualState;
        lowPower: boolean;
        motionStrength: number;
        powerStrength: number;
        effect?: RideUiAnimationEffectV1;
        profile?: 'live' | 'preview';
    };
}
export interface RideUiSnapshotV1 {
    schemaVersion: 1;
    revision: number;
    generatedAtEpochMs: number;
    scene: RideUiSceneV1;
    telemetry: RideUiTelemetryV1;
}
export interface RideUiInitContextV1 {
    themeId: string;
    mode: RideUiContextMode;
    locale: string;
    colorScheme: RideUiColorScheme;
    speedDecimalEnabled: boolean;
    safeArea: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    capabilities: RideUiActionNameV1[];
    /** Optional in API 1.9 so older themes and hosts remain wire-compatible. */
    environment?: {
        hostKind: RideUiHostKindV1;
        renderer: RideUiRendererV1;
        renderTarget: RideUiRenderTargetV1;
        outputId: string;
        viewport: {
            widthPx: number;
            heightPx: number;
            density: number;
            orientation: RideUiOrientation;
        };
        input: {
            touch: boolean;
            pointer: boolean;
            keyboard: boolean;
        };
        dataCapabilities: string[];
    };
    config: {
        schemaVersion: number;
        revision: number;
        data: unknown;
    };
    snapshot: RideUiSnapshotV1;
    speedPresentation?: {
        mode: 'instant' | 'smooth10hz';
        lowPower: boolean;
    };
}
export interface RideUiFastFrameV1 {
    generatedAtEpochMs: number;
    speedDisplay: string;
    speedNumericValue: number | null;
    powerDisplay: string;
    powerNumericValue: number | null;
    speedDisplayState: RideUiSpeedState;
    visualSignals: RideUiSceneV1['visualSignals'];
    telemetry: Pick<RideUiTelemetryV1, 'speed' | 'speed.gps' | 'speed.vehicle' | 'speed.controller' | 'power' | 'busCurrent' | 'phaseCurrent' | 'throttlePct' | 'throttleVoltage' | 'controllerRpm'>;
}
/** Native presentation output. telemetry.speed remains the measured source value. */
export interface RideUiDisplayFrameV1 {
    frameSeq: number;
    generatedAtEpochMs: number;
    generatedAtMonotonicMs: number;
    speedKmh: number | null;
    source: RideUiMetricSource;
    state: 'live' | 'held' | 'missing';
    bufferMs: number;
    periodMs: number;
    jitterMs?: number;
    duplicateCount?: number;
    rejectedCount?: number;
    underrunCount?: number;
}
export type RideUiActionNameV1 = typeof RIDE_UI_IMPLEMENTED_CAPABILITIES[number];
export interface RideUiConfigPatchV1 {
    schemaVersion: number;
    baseRevision: number;
    patch: RideUiJsonValue;
}
export interface RideUiActionRequestV1 {
    requestId: string;
    action: RideUiActionNameV1;
    payload?: unknown;
}
export type RideUiActionErrorCodeV1 = 'denied' | 'unavailable' | 'invalid' | 'conflict' | 'timeout' | 'failed';
export interface RideUiActionResultV1 {
    requestId: string;
    ok: boolean;
    result?: unknown;
    error?: {
        code: RideUiActionErrorCodeV1;
        message: string;
    };
}
interface RideUiEnvelopeBase<TType extends string, TPayload> {
    channel: typeof RIDE_UI_CHANNEL;
    api: typeof RIDE_UI_API_VERSION;
    sessionId: string;
    type: TType;
    payload: TPayload;
}
export type RideUiHostMessageV1 = RideUiEnvelopeBase<'host.init', RideUiInitContextV1> | RideUiEnvelopeBase<'ride.fast-frame', RideUiFastFrameV1> | RideUiEnvelopeBase<'ride.display-frame', RideUiDisplayFrameV1> | RideUiEnvelopeBase<'ride.state', RideUiSnapshotV1> | RideUiEnvelopeBase<'host.action-result', RideUiActionResultV1>;
export type RideUiThemeMessageV1 = RideUiEnvelopeBase<'theme.ready', {
    themeId: string;
    displayFrames?: boolean;
}> | RideUiEnvelopeBase<'theme.display-frame-consumed', {
    frameSeq: number;
}> | RideUiEnvelopeBase<'theme.action', RideUiActionRequestV1> | RideUiEnvelopeBase<'theme.error', {
    message: string;
    stack?: string;
}>;
export declare const parseRideUiThemeMessageV1: (value: unknown) => RideUiThemeMessageV1 | null;
export declare const parseRideUiHostMessageV1: (value: unknown) => RideUiHostMessageV1 | null;
export declare const createRideUiHostMessageV1: <T extends RideUiHostMessageV1["type"]>(type: T, sessionId: string, payload: Extract<RideUiHostMessageV1, {
    type: T;
}>["payload"]) => Extract<RideUiHostMessageV1, {
    type: T;
}>;
