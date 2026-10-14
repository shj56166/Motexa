import { RIDE_UI_API_VERSION, RIDE_UI_CHANNEL, RIDE_UI_IMPLEMENTED_CAPABILITIES, } from './constants.js';
import { RIDE_UI_TELEMETRY_KEYS_V1 } from './generated/telemetryCatalog.js';
export { RIDE_UI_API_VERSION, RIDE_UI_CHANNEL, RIDE_UI_IMPLEMENTED_CAPABILITIES, RIDE_UI_TELEMETRY_KEYS_V1 };
export const resolveRideUiSpeedPrecision = (speedDecimalEnabled, hideSpeedDecimal) => speedDecimalEnabled && !hideSpeedDecimal ? 1 : 0;
export const createUnavailableRideUiTelemetryV1 = () => Object.fromEntries(RIDE_UI_TELEMETRY_KEYS_V1.map((key) => [key, {
        value: null,
        canonicalUnit: '',
        displayValue: '--',
        displayUnit: '',
        source: 'none',
        quality: 'missing',
        freshness: 'unavailable',
        sampledAtEpochMs: null,
    }]));
const isRecord = (value) => value != null && typeof value === 'object' && !Array.isArray(value);
const hasEnvelope = (value) => {
    if (!isRecord(value) || value.channel !== RIDE_UI_CHANNEL || !isRecord(value.api)) {
        return false;
    }
    return value.api.major === RIDE_UI_API_VERSION.major && typeof value.sessionId === 'string';
};
const isRideUiActionNameV1 = (value) => typeof value === 'string' && RIDE_UI_IMPLEMENTED_CAPABILITIES.includes(value);
export const parseRideUiThemeMessageV1 = (value) => {
    if (!hasEnvelope(value) || !isRecord(value.payload)) {
        return null;
    }
    if (value.type === 'theme.ready' && typeof value.payload.themeId === 'string') {
        return value;
    }
    if (value.type === 'theme.display-frame-consumed' && Number.isSafeInteger(value.payload.frameSeq)) {
        return value;
    }
    if (value.type === 'theme.action' &&
        typeof value.payload.requestId === 'string' &&
        isRideUiActionNameV1(value.payload.action)) {
        if (value.payload.action === 'theme.config-patch') {
            const payload = value.payload.payload;
            if (!isRecord(payload) ||
                !Number.isInteger(payload.schemaVersion) ||
                !Number.isInteger(payload.baseRevision) ||
                !Object.hasOwn(payload, 'patch')) {
                return null;
            }
        }
        return value;
    }
    if (value.type === 'theme.error' && typeof value.payload.message === 'string') {
        return value;
    }
    return null;
};
export const parseRideUiHostMessageV1 = (value) => {
    if (!hasEnvelope(value) || !isRecord(value.payload)) {
        return null;
    }
    if (value.type === 'ride.display-frame') {
        const p = value.payload;
        return Number.isSafeInteger(p.frameSeq) && p.frameSeq >= 0
            && typeof p.generatedAtEpochMs === 'number' && Number.isFinite(p.generatedAtEpochMs)
            && typeof p.generatedAtMonotonicMs === 'number' && Number.isFinite(p.generatedAtMonotonicMs)
            && typeof p.bufferMs === 'number' && Number.isFinite(p.bufferMs) && p.bufferMs >= 0
            && typeof p.periodMs === 'number' && Number.isFinite(p.periodMs) && p.periodMs >= 0
            && (p.speedKmh === null || typeof p.speedKmh === 'number' && Number.isFinite(p.speedKmh) && p.speedKmh >= 0)
            && ['live', 'held', 'missing'].includes(String(p.state))
            && ['gps', 'controller', 'vehicle', 'none', 'fused', 'phone'].includes(String(p.source))
            ? value : null;
    }
    if (['host.init', 'ride.fast-frame', 'ride.state', 'host.action-result'].includes(String(value.type))) {
        return value;
    }
    return null;
};
export const createRideUiHostMessageV1 = (type, sessionId, payload) => ({
    channel: RIDE_UI_CHANNEL,
    api: RIDE_UI_API_VERSION,
    sessionId,
    type,
    payload,
});
