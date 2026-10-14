import manifest from './theme/ride-ui.json'
import { createMockConfigStore } from './mock-config'
import {
  createRideUiHostMessageV1,
  createUnavailableRideUiTelemetryV1,
  parseRideUiThemeMessageV1,
  type RideUiActionResultV1,
  type RideUiConfigPatchV1,
  type RideUiContextMode,
  type RideUiInitContextV1,
  type RideUiMetricFreshness,
  type RideUiMetricQuality,
  type RideUiMetricSource,
  type RideUiTelemetryKeyV1,
  type RideUiTelemetryV1,
} from '@motexa/ride-ui-sdk/contract'
import {
  RIDE_UI_REPLAY_DURATION_MS,
  RIDE_UI_REPLAY_SCENARIOS_V1,
  createRideUiReplaySampleV1,
  createRideUiDisplayReplayFrameV1,
  type RideUiReplaySampleV1,
  type RideUiReplayScenarioIdV1,
  type RideUiReplaySignalV1,
} from '@motexa/ride-ui-sdk/replay'

type QualityMode = 'fresh' | 'stale' | 'missing'
type ReplayMode = 'manual' | RideUiReplayScenarioIdV1

const root = document.querySelector<HTMLDivElement>('#mock-host-root')
if (!root) throw new Error('Missing mock host root.')

root.innerHTML = `
  <main class="mock-host">
    <aside class="controls">
      <header><span>MOTEXA SDK</span><h1>Ride UI mock host</h1></header>
      <label>Replay scenario <select data-input="scenario"><option value="manual">Manual controls</option>${RIDE_UI_REPLAY_SCENARIOS_V1.map(({ id, label }) => `<option value="${id}">${label}</option>`).join('')}</select></label>
      <label>Replay time <output data-output="timeline">0.0 s</output><input data-input="timeline" type="range" min="0" max="${RIDE_UI_REPLAY_DURATION_MS}" step="250" value="0"></label>
      <label class="toggle"><input data-input="playback" type="checkbox"><span>Play deterministic replay</span></label>
      <label>Speed <output data-output="speed">46.2 km/h</output><input data-input="speed" type="range" min="0" max="180" step="0.1" value="46.2"></label>
      <label>Power <output data-output="power">3600 W</output><input data-input="power" type="range" min="-3000" max="18000" step="50" value="3600"></label>
      <label>Host <select data-input="host"><option value="phone">Phone</option><option value="agent">HT2 Agent</option></select></label>
      <label>Render target <select data-input="render-target"><option value="phone">Phone display</option><option value="vehicle-cast">Vehicle cast</option></select></label>
      <label>Input <select data-input="input-capability"><option value="touch">Touch</option><option value="none">No input</option></select></label>
      <label>Locale <select data-input="locale"><option value="zh">zh</option><option value="en">en</option></select></label>
      <div class="pair"><label>Width px<input data-input="width" type="number" min="320" max="2560" value="1120"></label><label>Height px<input data-input="height" type="number" min="240" max="1600" value="680"></label></div>
      <label>Orientation <select data-input="orientation"><option value="landscape">Landscape</option><option value="portrait">Portrait</option></select></label>
      <label>Mode <select data-input="mode"><option value="live">Live dashboard</option><option value="theme-settings">Theme settings</option><option value="background-preview">Read-only preview</option></select></label>
      <label class="toggle"><input data-input="speed-decimal" type="checkbox" checked><span>App speed decimals</span></label>
      <label>Color scheme <select data-input="scheme"><option value="dark">Dark</option><option value="light">Light</option></select></label>
      <label>Telemetry quality <select data-input="quality"><option value="fresh">Fresh</option><option value="stale">Stale / held</option><option value="missing">Missing</option></select></label>
      <label>Vehicle gear <select data-input="vehicle-gear"><option value="1">Low</option><option value="2">Middle</option><option value="3" selected>High</option><option value="unknown">Unknown</option></select></label>
      <label>Parking <select data-input="vehicle-parking"><option value="1">P engaged</option><option value="0" selected>P released</option><option value="unknown">Unavailable</option></select></label>
      <label>Current vehicle status <output data-output="vehicle-status">--</output></label>
      <label>Action response <select data-input="action"><option value="success">Success</option><option value="denied">Denied</option></select></label>
      <label class="toggle"><input data-input="recording" type="checkbox" checked><span>Recording</span></label>
      <label class="toggle"><input data-input="low-power" type="checkbox"><span>Low power mode</span></label>
      <label class="toggle"><input data-input="animations" type="checkbox" checked><span>Animations enabled</span></label>
      <p data-log role="status">Waiting for theme handshake.</p>
    </aside>
    <section class="preview" data-orientation="landscape"><iframe data-theme title="Ride UI theme preview" sandbox="allow-scripts"></iframe></section>
  </main>`

const style = document.createElement('style')
style.textContent = `
  :root{font-family:Inter,"Segoe UI",Arial,sans-serif;background:#e8edf3;color:#162335}*{box-sizing:border-box}body{margin:0}.mock-host{display:grid;grid-template-columns:320px minmax(0,1fr);min-height:100vh}.controls{display:grid;align-content:start;gap:12px;padding:18px;border-right:1px solid #c7d1dd;background:#fff}.controls header span{color:#147af3;font-size:11px;font-weight:800}.controls h1{margin:4px 0 8px;font-size:19px}.controls label{display:grid;gap:7px;color:#516276;font-size:12px;font-weight:700}.controls output{justify-self:end;color:#147af3;font-variant-numeric:tabular-nums}.controls input,.controls select{width:100%;font:inherit}.controls select,.controls input[type="number"]{height:35px;padding:0 8px;border:1px solid #b5c3d3;border-radius:4px;background:#fff}.controls .toggle{grid-template-columns:auto 1fr;align-items:center}.controls .toggle input{width:17px;height:17px;margin:0}.controls .pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}.controls p{min-height:42px;margin:4px 0 0;padding:9px;border-left:3px solid #147af3;background:#f1f6fc;color:#40536a;font-size:12px;line-height:1.35}.preview{display:grid;place-items:center;min-width:0;min-height:0;padding:20px;background:#273241;overflow:auto}.preview iframe{display:block;max-width:100%;max-height:100%;border:0;box-shadow:0 20px 54px rgba(0,0,0,.26);background:#090c12}@media(max-width:760px){.mock-host{grid-template-columns:1fr;grid-template-rows:auto minmax(460px,1fr)}.controls{grid-template-columns:1fr 1fr;border-right:0;border-bottom:1px solid #c7d1dd}.controls header,.controls p{grid-column:1/-1}.preview{padding:10px}}`
document.head.append(style)

const frame = root.querySelector<HTMLIFrameElement>('[data-theme]')
const log = root.querySelector<HTMLElement>('[data-log]')
const preview = root.querySelector<HTMLElement>('.preview')
if (!frame || !log || !preview) throw new Error('Mock host controls are incomplete.')

const input = <T extends HTMLInputElement | HTMLSelectElement>(name: string) => {
  const element = root.querySelector<T>(`[data-input="${name}"]`)
  if (!element) throw new Error(`Missing ${name} control.`)
  return element
}
const output = (name: string) => root.querySelector<HTMLOutputElement>(`[data-output="${name}"]`)

const speedInput = input<HTMLInputElement>('speed')
const powerInput = input<HTMLInputElement>('power')
const scenarioInput = input<HTMLSelectElement>('scenario')
const timelineInput = input<HTMLInputElement>('timeline')
const playbackInput = input<HTMLInputElement>('playback')
const hostInput = input<HTMLSelectElement>('host')
const renderTargetInput = input<HTMLSelectElement>('render-target')
const inputCapabilityInput = input<HTMLSelectElement>('input-capability')
const localeInput = input<HTMLSelectElement>('locale')
const widthInput = input<HTMLInputElement>('width')
const heightInput = input<HTMLInputElement>('height')
const orientationInput = input<HTMLSelectElement>('orientation')
const modeInput = input<HTMLSelectElement>('mode')
const speedDecimalInput = input<HTMLInputElement>('speed-decimal')
const schemeInput = input<HTMLSelectElement>('scheme')
const qualityInput = input<HTMLSelectElement>('quality')
const vehicleGearInput = input<HTMLSelectElement>('vehicle-gear')
const vehicleParkingInput = input<HTMLSelectElement>('vehicle-parking')
const actionInput = input<HTMLSelectElement>('action')
const recordingInput = input<HTMLInputElement>('recording')
const lowPowerInput = input<HTMLInputElement>('low-power')
const animationsInput = input<HTMLInputElement>('animations')

let sessionId = crypto.randomUUID()
let ready = false
let displaySequence = 0
let playbackElapsedMs: number | null = null
let revision = 0
const configStore = createMockConfigStore()

const replaySample = (): RideUiReplaySampleV1 | null => scenarioInput.value === 'manual'
  ? null
  : createRideUiReplaySampleV1(scenarioInput.value as RideUiReplayScenarioIdV1, Number(timelineInput.value))

const quality = (): { freshness: RideUiMetricFreshness; quality: RideUiMetricQuality } => {
  const mode = qualityInput.value as QualityMode
  return mode === 'missing'
    ? { freshness: 'unavailable', quality: 'missing' }
    : mode === 'stale'
      ? { freshness: 'stale', quality: 'held' }
      : { freshness: 'fresh', quality: 'measured' }
}

const metric = (
  value: number,
  unit: string,
  source: RideUiMetricSource,
  digits = 0,
  status = quality(),
  sampledAtEpochMs: number | null = status.quality === 'missing' ? null : Date.now(),
): RideUiTelemetryV1[keyof RideUiTelemetryV1] => {
  if (status.quality === 'missing') return {
    value: null, canonicalUnit: unit, displayValue: '--', displayUnit: unit, source, ...status, sampledAtEpochMs: null,
  }
  return {
    value, canonicalUnit: unit, displayValue: value.toFixed(digits).replace(/\.0+$/, ''), displayUnit: unit, source, ...status, sampledAtEpochMs,
  }
}

const replayMetric = (signal: RideUiReplaySignalV1, unit: string, digits = 0) => metric(
  signal.value ?? 0,
  unit,
  signal.source,
  digits,
  { quality: signal.quality, freshness: signal.freshness },
  signal.sampledAtEpochMs,
)

const telemetry = (sample: RideUiReplaySampleV1 | null): RideUiTelemetryV1 => {
  const values = createUnavailableRideUiTelemetryV1()
  const assign = (key: RideUiTelemetryKeyV1, value: number, unit: string, source: RideUiMetricSource, digits = 0) => { values[key] = metric(value, unit, source, digits) }
  const speed = sample?.speed.value ?? Number(speedInput.value)
  const power = sample?.power.value ?? Number(powerInput.value)
  if (sample == null) {
    assign('speed', speed, 'km/h', 'gps', 1)
    assign('speed.gps', speed, 'km/h', 'gps', 1)
    assign('speed.vehicle', speed * .995, 'km/h', 'vehicle', 1)
    assign('power', power, 'W', 'fused')
    assign('power.bms', power, 'W', 'bms')
  } else {
    values.speed = replayMetric(sample.speed, 'km/h', 1)
    values['speed.gps'] = replayMetric(sample.gpsSpeed, 'km/h', 1)
    values['speed.vehicle'] = replayMetric(sample.vehicleSpeed, 'km/h', 1)
    values.power = replayMetric(sample.power, 'W')
    values['power.bms'] = replayMetric(sample.power, 'W')
  }
  assign('speed.controller', speed * 1.005, 'km/h', 'controller', 1)
  assign('busCurrent', -Math.abs(power / 74), 'A', 'controller', 1)
  assign('phaseCurrent', Math.abs(power / 26), 'A', 'controller', 1)
  assign('voltage', 74.2, 'V', 'bms', 1)
  assign('soc', 68, '%', 'bms')
  assign('efficiency', 47.8, 'Wh/km', 'fused', 1)
  assign('controllerRpm', Math.max(0, speed * 118), 'rpm', 'controller')
  assign('throttlePct', Math.max(0, Math.min(100, power / 120)), '%', 'controller')
  assign('throttleVoltage', Math.max(0, Math.min(5, power / 3600)), 'V', 'controller', 2)
  if (sample != null) {
    values.vehicleGear = replayMetric(sample.vehicleGear, '')
    values.vehicleParking = replayMetric(sample.vehicleParking, '')
  } else {
    const gear = vehicleGearInput.value
    const parking = vehicleParkingInput.value
    if (gear !== 'unknown') assign('vehicleGear', Number(gear), '', 'vehicle')
    if (parking !== 'unknown') assign('vehicleParking', Number(parking), '', 'vehicle')
  }
  const gearText = values.vehicleGear.freshness === 'fresh' && values.vehicleGear.value != null
    ? ['', 'Low', 'Middle', 'High'][values.vehicleGear.value] ?? '--' : '--'
  const parkingText = values.vehicleParking.freshness === 'fresh' && values.vehicleParking.value != null
    ? values.vehicleParking.value === 1 ? 'P' : 'P released' : '--'
  output('vehicle-status')!.value = gearText + ' / ' + parkingText
  return values
}

const snapshot = () => {
  revision += 1
  const sample = replaySample()
  const values = telemetry(sample)
  const missing = values.speed.quality === 'missing'
  const speed = values.speed.value ?? 0
  const power = values.power.value ?? 0
  return {
    schemaVersion: 1 as const,
    revision,
    generatedAtEpochMs: sample?.generatedAtEpochMs ?? Date.now(),
    telemetry: values,
    scene: {
      background: { enabled: false, imageUrl: '', dim: 0, focalX: 50, focalY: 50, zoom: 1 },
      hero: { speedDisplay: missing ? '--' : speed.toFixed(1), speedNumericValue: missing ? null : speed, speedDisplayState: values.speed.freshness === 'stale' ? 'held' as const : 'live' as const, powerDisplay: values.power.value == null ? '--' : Math.round(power).toString(), powerNumericValue: values.power.value, isPowerFocusMode: speed < 18 },
      status: { items: [{ key: 'gps' as const, label: 'GPS', state: values['speed.gps'].value == null ? 'failed' as const : 'ok' as const, srLabel: values['speed.gps'].value == null ? 'GPS unavailable' : 'GPS connected' }, { key: 'bms' as const, label: 'BMS', state: values.power.value == null ? 'failed' as const : 'ok' as const, srLabel: values.power.value == null ? 'BMS unavailable' : 'BMS connected' }, { key: 'controller' as const, label: 'CTRL', state: 'ok' as const, srLabel: 'Controller connected' }], isRecording: recordingInput.checked, isMockPreview: true },
      metrics: { items: [{ id: 'soc', label: 'Battery', value: values.soc.displayValue, numericValue: values.soc.value, unit: '%', tone: 'green', size: '1x1' as const, style: 'minimal' as const }], fits: true, editable: false },
      trends: { primaryPoints: [], secondaryPoints: [], powerDisplay: missing ? '--' : Math.round(power).toString(), efficiencyDisplay: values.efficiency.displayValue, visible: false, forceVisible: false },
      layout: { renderTarget: renderTargetInput.value as 'phone' | 'vehicle-cast', orientation: orientationInput.value as 'portrait' | 'landscape', compactLandscape: false, compactPortrait: false, lowPower: lowPowerInput.checked, animationsEnabled: animationsInput.checked, previewMode: 'screen' as const, editableMetrics: false },
      controls: { visible: true, orientationLockMode: orientationInput.value as 'portrait' | 'landscape', orientationLockLabel: orientationInput.value, dynamicsCanRecalibrate: false, dynamicsCalibrationLabel: '', refreshRideDisabled: false, refreshRideLabel: 'Refresh' },
      hint: { title: null, detail: null, tone: 'info' as const },
      calibrationStatus: { visible: false, state: 'waiting_inputs' as const, label: '', detail: null },
      visualSignals: { state: power > 9000 ? 'alert' as const : power > 4000 ? 'surge' as const : 'boost' as const, lowPower: lowPowerInput.checked, motionStrength: Math.min(1, speed / 100), powerStrength: Math.min(1, Math.abs(power) / 12000), profile: 'preview' as const },
    },
  }
}

const capabilities = (): RideUiInitContextV1['capabilities'] => {
  if (renderTargetInput.value === 'vehicle-cast' || inputCapabilityInput.value === 'none' || modeInput.value === 'background-preview') return []
  return modeInput.value === 'theme-settings'
    ? ['theme.open-picker', 'theme.config-patch', 'display.set-orientation', 'feedback.haptic']
    : ['ride.request-exit', 'ride.refresh', 'display.set-orientation', 'theme.open-settings', 'feedback.haptic']
}

const post = (message: unknown) => frame.contentWindow?.postMessage(message, '*')
const sendInit = () => post(createRideUiHostMessageV1('host.init', sessionId, {
  themeId: manifest.id,
  mode: modeInput.value as RideUiContextMode,
  locale: localeInput.value,
  colorScheme: schemeInput.value as 'light' | 'dark',
  speedDecimalEnabled: speedDecimalInput.checked,
  safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
  capabilities: capabilities(),
  environment: {
    hostKind: hostInput.value as 'phone' | 'agent',
    renderer: 'web',
    renderTarget: renderTargetInput.value as 'phone' | 'vehicle-cast',
    outputId: 'mock-output-1',
    viewport: { widthPx: Number(widthInput.value), heightPx: Number(heightInput.value), density: 1, orientation: orientationInput.value as 'portrait' | 'landscape' },
    input: { touch: inputCapabilityInput.value === 'touch', pointer: inputCapabilityInput.value === 'touch', keyboard: false },
    dataCapabilities: ['telemetry.v1', 'fast-frame.v1', 'display-frame-replay'],
  },
  config: configStore.read(),
  snapshot: snapshot(),
}))
const sendDisplay = (current?: ReturnType<typeof snapshot>) => {
  if (scenarioInput.value === 'manual') current ??= snapshot()
  const display = scenarioInput.value !== 'manual'
    ? createRideUiDisplayReplayFrameV1(scenarioInput.value as RideUiReplayScenarioIdV1, playbackElapsedMs ?? Number(timelineInput.value), ++displaySequence, 1_735_689_600_000)
    : { frameSeq: ++displaySequence, generatedAtEpochMs: current!.generatedAtEpochMs, generatedAtMonotonicMs: performance.now(),
      speedKmh: current!.scene.hero.speedNumericValue, source: current!.telemetry.speed.source,
      state: current!.scene.hero.speedNumericValue == null ? 'missing' as const : current!.scene.hero.speedDisplayState, bufferMs: 0, periodMs: 0 }
  post(createRideUiHostMessageV1('ride.display-frame', sessionId, display))
}
const sendUpdate = () => {
  if (!ready) return
  const current = snapshot()
  post(createRideUiHostMessageV1('ride.state', sessionId, current))
  post(createRideUiHostMessageV1('ride.fast-frame', sessionId, {
    generatedAtEpochMs: current.generatedAtEpochMs, speedDisplay: current.scene.hero.speedDisplay, speedNumericValue: current.scene.hero.speedNumericValue,
    powerDisplay: current.scene.hero.powerDisplay, powerNumericValue: current.scene.hero.powerNumericValue,
    speedDisplayState: current.scene.hero.speedDisplayState, visualSignals: current.scene.visualSignals,
    telemetry: { speed: current.telemetry.speed, 'speed.gps': current.telemetry['speed.gps'], 'speed.vehicle': current.telemetry['speed.vehicle'], 'speed.controller': current.telemetry['speed.controller'], power: current.telemetry.power, busCurrent: current.telemetry.busCurrent, phaseCurrent: current.telemetry.phaseCurrent, throttlePct: current.telemetry.throttlePct, throttleVoltage: current.telemetry.throttleVoltage, controllerRpm: current.telemetry.controllerRpm },
  }))
  if (!playbackFrame) sendDisplay(current)

}

const syncControls = () => {
  const sample = replaySample()
  output('timeline')!.value = `${(Number(timelineInput.value) / 1000).toFixed(1)} s`
  output('speed')!.value = `${(sample?.speed.value ?? Number(speedInput.value)).toFixed(1)} km/h`
  output('power')!.value = `${Math.round(sample?.power.value ?? Number(powerInput.value))} W`
  speedInput.disabled = sample != null
  powerInput.disabled = sample != null
  qualityInput.disabled = sample != null
  preview.dataset.orientation = orientationInput.value
  frame.style.width = `${Number(widthInput.value)}px`
  frame.style.height = `${Number(heightInput.value)}px`
  if (sample != null) log.textContent = `${sample.note} Monotonic ${(sample.monotonicMs / 1000).toFixed(1)} s; wall ${new Date(sample.generatedAtEpochMs).toISOString()}.`
  sendUpdate()
}

for (const control of [speedInput, powerInput, scenarioInput, timelineInput, qualityInput, vehicleGearInput, vehicleParkingInput, actionInput, recordingInput, lowPowerInput, animationsInput]) {
  control.addEventListener('input', syncControls)
}
for (const control of [hostInput, renderTargetInput, inputCapabilityInput, localeInput, widthInput, heightInput, orientationInput, schemeInput, modeInput, speedDecimalInput]) {
  control.addEventListener('input', () => { if (ready) sendInit(); syncControls() })
}

let playbackFrame = 0
const syncPlayback = () => {
  cancelAnimationFrame(playbackFrame)
  playbackFrame = 0
  playbackElapsedMs = null
  if (!playbackInput.checked || scenarioInput.value === 'manual' || document.hidden) return
  const startedAt = performance.now(), initialMs = Number(timelineInput.value)
  let lastDisplayAt = -Infinity, lastStateAt = -Infinity
  const tick = (now: number) => {
    playbackElapsedMs = (initialMs + now - startedAt) % RIDE_UI_REPLAY_DURATION_MS
    timelineInput.value = String(playbackElapsedMs)
    if (ready && now - lastDisplayAt >= (lowPowerInput.checked || renderTargetInput.value === 'vehicle-cast' ? 1000 / 30 : 0)) {
      sendDisplay()
      lastDisplayAt = now
    }
    if (now - lastStateAt >= 250) { syncControls(); lastStateAt = now }
    playbackFrame = requestAnimationFrame(tick)
  }
  playbackFrame = requestAnimationFrame(tick)
}
playbackInput.addEventListener('change', syncPlayback)
scenarioInput.addEventListener('change', syncPlayback)
timelineInput.addEventListener('input', syncPlayback)
document.addEventListener('visibilitychange', syncPlayback)
window.addEventListener('pagehide', () => cancelAnimationFrame(playbackFrame))

window.addEventListener('message', (event) => {
  if (event.source !== frame.contentWindow) return
  const message = parseRideUiThemeMessageV1(event.data)
  if (!message) return
  if (message.type === 'theme.ready') {
    if (message.sessionId !== '' && message.sessionId !== sessionId) return
    ready = message.payload.themeId === manifest.id
    log.textContent = ready ? 'Theme connected. Changes are sent as state, display frames and config messages.' : 'Theme ID mismatch.'
    if (ready) { sendInit(); sendUpdate() }
    return
  }
  if (message.sessionId !== sessionId) return
  if (message.type === 'theme.error') {
    log.textContent = `Theme error: ${message.payload.message}`
    return
  }
  if (message.type !== 'theme.action') return
  const request = message.payload
  let result: RideUiActionResultV1 = { requestId: request.requestId, ok: true }
  if (actionInput.value === 'denied' || !capabilities().includes(request.action)) {
    result = { requestId: request.requestId, ok: false, error: { code: 'denied', message: 'Mock host denied this action.' } }
  } else if (request.action === 'theme.config-patch') {
    const outcome = configStore.patch(request.payload as RideUiConfigPatchV1)
    result = { requestId: request.requestId, ok: outcome.ok, result: { config: outcome.config },
      ...(!outcome.ok ? { error: { code: outcome.code, message: outcome.code === 'conflict' ? 'Configuration revision changed.' : 'Configuration does not match its schema.' } } : {}) }
  } else if (request.action === 'display.set-orientation') {
    const mode = (request.payload as { mode?: unknown } | null)?.mode
    if (mode === 'portrait' || mode === 'landscape') {
      orientationInput.value = mode
      const width = Number(widthInput.value), height = Number(heightInput.value)
      if ((mode === 'portrait') === (width > height)) {
        widthInput.value = String(height); heightInput.value = String(width)
      }
    } else result = { requestId: request.requestId, ok: false, error: { code: 'invalid', message: 'Invalid orientation.' } }
  } else if (request.action === 'theme.open-settings') modeInput.value = 'theme-settings'
  else if (request.action === 'theme.open-picker' || request.action === 'ride.request-exit') modeInput.value = 'live'
  log.textContent = result.ok ? `Action accepted: ${request.action}` : `Action denied: ${request.action}`
  post(createRideUiHostMessageV1('host.action-result', sessionId, result))
  if (result.ok) sendInit()
  syncControls()
})

frame.name = sessionId
frame.src = new URL('./index.html', window.location.href).href
syncControls()
