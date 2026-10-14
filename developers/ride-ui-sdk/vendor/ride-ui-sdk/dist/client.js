import { RIDE_UI_API_VERSION, RIDE_UI_CHANNEL, parseRideUiHostMessageV1, createUnavailableRideUiTelemetryV1, } from './contract';
// Older API 1.x hosts may omit fields added by a newer SDK.
const normalizeSnapshot = (snapshot) => ({
    ...snapshot,
    telemetry: { ...createUnavailableRideUiTelemetryV1(), ...snapshot.telemetry },
});
const createRequestId = () => typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `ride-ui-${Date.now()}-${Math.random().toString(16).slice(2)}`;
export const createRideUiClient = (themeId) => {
    // Sandboxed theme documents have an opaque origin, so window.name is not a
    // reliable host-to-theme channel. The host assigns the session in host.init.
    let sessionId = '';
    const snapshotListeners = new Set();
    const frameListeners = new Set();
    const displayListeners = new Set();
    const contextListeners = new Set();
    const pending = new Map();
    let latestSnapshot = null;
    let latestFrame = null;
    let frameFromSnapshot = false;
    let latestDisplay = null;
    let pendingDisplay = null;
    let animationFrame = 0;
    let disposed = false;
    const nativeTransport = typeof window !== 'undefined' ? window.MotexaRideUiNativeBridge : undefined;
    const withDisplaySpeed = (frame) => latestDisplay == null ? frame : {
        ...frame,
        speedNumericValue: latestDisplay.speedKmh,
        speedDisplay: latestDisplay.speedKmh == null ? '--' : latestDisplay.speedKmh.toFixed(0),
        speedDisplayState: latestDisplay.state === 'held' ? 'held' : 'live',
    };
    const deliverDisplay = () => {
        animationFrame = 0;
        if (disposed || !pendingDisplay)
            return;
        latestDisplay = pendingDisplay;
        pendingDisplay = null;
        try {
            displayListeners.forEach(listener => listener(latestDisplay));
            if (!latestFrame && latestSnapshot) {
                frameFromSnapshot = true;
                const { hero, visualSignals } = latestSnapshot.scene;
                const t = latestSnapshot.telemetry;
                latestFrame = {
                    generatedAtEpochMs: latestSnapshot.generatedAtEpochMs, ...hero, visualSignals,
                    telemetry: { speed: t.speed, 'speed.gps': t['speed.gps'], 'speed.vehicle': t['speed.vehicle'],
                        'speed.controller': t['speed.controller'], power: t.power, busCurrent: t.busCurrent,
                        phaseCurrent: t.phaseCurrent, throttlePct: t.throttlePct, throttleVoltage: t.throttleVoltage, controllerRpm: t.controllerRpm },
                };
            }
            if (latestFrame)
                frameListeners.forEach(listener => listener(withDisplaySpeed(latestFrame)));
        }
        finally {
            post({ channel: RIDE_UI_CHANNEL, api: RIDE_UI_API_VERSION, sessionId,
                type: 'theme.display-frame-consumed', payload: { frameSeq: latestDisplay.frameSeq } });
        }
    };
    const post = (message) => {
        if (disposed)
            return;
        if (nativeTransport != null)
            nativeTransport.postMessage(JSON.stringify(message));
        else
            window.parent.postMessage(message, '*');
    };
    const handleMessage = (value) => {
        const message = parseRideUiHostMessageV1(value);
        if (!message) {
            return;
        }
        if (message.type === 'host.init') {
            if (sessionId !== message.sessionId) {
                cancelAnimationFrame(animationFrame);
                animationFrame = 0;
                latestDisplay = pendingDisplay = null;
                latestFrame = null;
                frameFromSnapshot = false;
            }
            sessionId = message.sessionId;
            latestSnapshot = normalizeSnapshot(message.payload.snapshot);
            contextListeners.forEach((listener) => listener({ ...message.payload, snapshot: latestSnapshot }));
            snapshotListeners.forEach((listener) => listener(latestSnapshot));
            return;
        }
        if (message.sessionId !== sessionId) {
            return;
        }
        if (message.type === 'ride.state') {
            latestSnapshot = normalizeSnapshot(message.payload);
            if (frameFromSnapshot)
                latestFrame = null;
            snapshotListeners.forEach((listener) => listener(latestSnapshot));
            return;
        }
        if (message.type === 'ride.fast-frame') {
            latestFrame = message.payload;
            frameFromSnapshot = false;
            if (!pendingDisplay)
                frameListeners.forEach((listener) => listener(withDisplaySpeed(message.payload)));
            return;
        }
        if (message.type === 'ride.display-frame') {
            if (message.payload.frameSeq <= (pendingDisplay?.frameSeq ?? latestDisplay?.frameSeq ?? -1))
                return;
            pendingDisplay = message.payload;
            if (!animationFrame)
                animationFrame = requestAnimationFrame(deliverDisplay);
            return;
        }
        if (message.type === 'host.action-result') {
            const request = pending.get(message.payload.requestId);
            if (!request) {
                return;
            }
            clearTimeout(request.timeout);
            pending.delete(message.payload.requestId);
            request.resolve(message.payload);
        }
    };
    const handleWindowMessage = (event) => {
        if (event.source !== window.parent)
            return;
        handleMessage(event.data);
    };
    const handleNativeMessage = (value) => {
        try {
            handleMessage(JSON.parse(value));
        }
        catch { /* Native transport drops malformed messages. */ }
    };
    window.addEventListener('message', handleWindowMessage);
    if (nativeTransport != null)
        window.__motexaRideUiNativeReceive = handleNativeMessage;
    return {
        ready() {
            post({
                channel: RIDE_UI_CHANNEL,
                api: RIDE_UI_API_VERSION,
                // Bootstrap is authenticated by the parent WindowProxy and theme ID.
                // Subsequent messages use the random session from host.init.
                sessionId: '',
                type: 'theme.ready',
                payload: { themeId, displayFrames: true },
            });
        },
        subscribeSnapshot(listener) {
            snapshotListeners.add(listener);
            if (latestSnapshot) {
                listener(latestSnapshot);
            }
            return () => snapshotListeners.delete(listener);
        },
        subscribeFrame(listener) {
            frameListeners.add(listener);
            return () => frameListeners.delete(listener);
        },
        subscribeDisplayFrame(listener) {
            displayListeners.add(listener);
            if (latestDisplay)
                listener(latestDisplay);
            return () => displayListeners.delete(listener);
        },
        subscribeContext(listener) {
            contextListeners.add(listener);
            return () => contextListeners.delete(listener);
        },
        requestAction(action, payload) {
            const requestId = createRequestId();
            const request = { requestId, action, payload };
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    pending.delete(requestId);
                    resolve({
                        requestId,
                        ok: false,
                        error: { code: 'timeout', message: 'Ride UI host did not answer the action request.' },
                    });
                }, 5_000);
                pending.set(requestId, { resolve, timeout });
                post({
                    channel: RIDE_UI_CHANNEL,
                    api: RIDE_UI_API_VERSION,
                    sessionId,
                    type: 'theme.action',
                    payload: request,
                });
            });
        },
        reportError(error) {
            const resolved = error instanceof Error ? error : new Error(String(error));
            post({
                channel: RIDE_UI_CHANNEL,
                api: RIDE_UI_API_VERSION,
                sessionId,
                type: 'theme.error',
                payload: { message: resolved.message, stack: resolved.stack },
            });
        },
        dispose() {
            if (disposed) {
                return;
            }
            disposed = true;
            cancelAnimationFrame(animationFrame);
            pendingDisplay = null;
            window.removeEventListener('message', handleWindowMessage);
            if (nativeTransport != null && window.__motexaRideUiNativeReceive === handleNativeMessage) {
                delete window.__motexaRideUiNativeReceive;
            }
            for (const [requestId, request] of pending) {
                clearTimeout(request.timeout);
                request.resolve({
                    requestId,
                    ok: false,
                    error: { code: 'failed', message: 'Ride UI client was disposed.' },
                });
            }
            pending.clear();
            snapshotListeners.clear();
            frameListeners.clear();
            displayListeners.clear();
            contextListeners.clear();
        },
    };
};
