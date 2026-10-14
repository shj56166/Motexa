# Browser debugger

The debugger is a synthetic host using the same public SDK message contract as the App. It checks UI, handshake, settings, and controlled actions. It does not connect to hardware or prove compatibility with a particular phone or vehicle display.

## Launch

Run `pnpm dev` and visit `/mock-host.html`. To preview a compiled build:

```sh
pnpm theme:build
pnpm exec vite preview --outDir dist/development --host 127.0.0.1 --port 5187 --strictPort
```

Visit `http://127.0.0.1:5187/mock-host.html`. The static documentation site also links to the debugger. Serve it over HTTP rather than opening HTML with `file://`.

## Controls

| Control | What to check |
| --- | --- |
| Replay scenario / time / Play | Scenario selection, seeking, looping 60-second timeline |
| Speed / Power | Manual speed and power, including negative power |
| Host / Render target | phone / agent and phone / vehicle-cast environment |
| Input | Touch and no-input presentation |
| Locale | Chinese and English environment |
| Width / Height / Orientation | Pixel viewport and portrait/landscape layout |
| Mode | Live dashboard, settings, read-only background preview |
| App speed decimals | App decimals combined with theme decimal preference |
| Color scheme | Dark and light |
| Telemetry quality | fresh, stale / held, missing |
| Action response | Success or denial |
| Recording / Low power / Animations | Recording indicator, power and motion states |

Host/render selectors change environment descriptions; they do not emulate an Android WebView or actual output device. Replay takes over speed, power, and quality and disables manual controls.

## Replay scenarios

Manual **Vehicle gear / Parking** controls select low/middle/high/unknown gear
and P engaged/released/unavailable. Status tiles show current values only when fresh.

| ID | Expected review |
| --- | --- |
| `normal` | Acceleration, deceleration, power |
| `vehicle-status` | Six gear/P combinations, followed by unknown gear, stale and unavailable status |
| `missing-gps` | Missing GPS state; other data only where available |
| `stale` | Held values retain stale/held indication |
| `regeneration` | Negative power is not clamped to zero |
| `source-switch` | Value and source update together |
| `clock-shift` | Wall-clock rollback does not break duration or animation |

## Settings and denial checks

1. Select Theme settings, change accent/decimals/power visibility, and save.
2. Return to Live dashboard, then reopen settings; changes persist within this mock-host session.
3. Select Denied and save again; show an error and keep the previous saved configuration.
4. Check Read-only preview and No input; respect current capabilities.
5. Select Missing; unavailable speed/metrics show `--` and do not restore old measured values.

Mock settings live in memory and reset on reload. The debugger does not replace App persistence, import authorization, or device testing.

## Troubleshooting

`Waiting for theme handshake`: open through the host, call `ready()`, and check browser load errors.

`Theme ID mismatch`: client and manifest IDs differ.

Blank page: run type checking/build and inspect DevTools Console. Under a website subdirectory, keep `mock-host.html`, `index.html`, and `assets/` together.

`denied`: check mode, Action response, and `context.capabilities`. See [Client API](api.md).
