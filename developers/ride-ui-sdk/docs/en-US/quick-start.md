# Quick start

Start the example in a browser, then turn it into your own App-hosted theme. No App source or connected device is required.

## Requirements

Use Node.js **22.12 or later**, pnpm **10.33.2**, and a modern browser. Node.js 22 LTS is recommended. Windows users may use `pnpm.cmd` to avoid PowerShell script execution policy issues.

From the extracted repository root:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the server URL printed by Vite and visit `/mock-host.html`. A working handshake displays `Theme connected` and loads the dashboard. Use the actual port reported by the terminal.

## Example files

| File | Purpose |
| --- | --- |
| `theme/src/PartnerTheme.vue` | Dashboard layout |
| `theme/src/useDashboard.ts` | Subscriptions, missing values, actions, settings |
| `theme/src/ThemeSettings.vue` | Settings UI |
| `theme/src/style.css` | Styling and responsive layout |
| `theme/ride-ui.json` | Identity, API, capabilities, runtime requirements |
| `theme/submission.json` | Source submission metadata |
| `theme/config.schema.json` | Settings fields and validation |

The example uses ID `partner.example-dashboard`, version `0.2.0`. Before publishing your own theme, choose a stable unique ID and update manifest/submission identities and runtime declarations together. Keep the runtime `releaseId` consistent with your release version. The example reads its client ID from the manifest.

## Minimal subscription

```ts
import { createRideUiClient } from '@motexa/ride-ui-sdk/client'
import manifest from '../ride-ui.json'

const client = createRideUiClient(manifest.id)
const stop = client.subscribeSnapshot(snapshot => {
  const soc = snapshot.telemetry.soc
  const label = soc.value == null ? '--' : soc.displayValue
  // Assign label to your component state.
  console.log(label)
})
client.ready()

// On component teardown:
// stop()
// client.dispose()
```

Register listeners before calling `ready()`. Do not implement bridge messaging yourself. Opening the theme's `index.html` alone provides no data; load it through the mock host.

## Checks

```sh
pnpm theme:check
pnpm typecheck
pnpm theme:replay-check
pnpm theme:build
```

Validation checks manifest/source rules; type checking verifies API usage; replay checks synthetic fixtures; the build writes `dist/development/` including the debugger.

Manually review portrait/landscape, 320px width, light/dark, missing/stale data, low power, settings saves, and denied actions. See the [Debugger guide](debugger.md) and [Build and App installation](build-install.md).
