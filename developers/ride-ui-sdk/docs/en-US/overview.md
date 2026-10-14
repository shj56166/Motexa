# SDK overview

Motexa Ride UI SDK builds Web dashboard themes hosted inside the Motexa App. The App converts vehicle data into normalized presentation data. Themes subscribe through the SDK and request interactions allowed by the current host.

Current versions: **SDK 1.5.0 / message API 1.11 / Demo 0.2.0**. Package and message API versions describe different things.

## Data flow

```text
Vehicle → App connection and protocol conversion → normalized data → SDK → theme
Theme → SDK action request → App policy checks and execution → result
```

The SDK carries no vehicle protocol driver. A field in the contract does not imply every device provides it. Render according to capabilities, availability, quality, and freshness.

## Repository contents

| Path | Purpose |
| --- | --- |
| `vendor/ride-ui-sdk/` | Compiled client, public types, synthetic replay, validation tools |
| `theme/` | Vue/TypeScript example, manifest, configuration schema |
| `mock-host.ts` / `mock-config.ts` | Browser debugger and in-memory settings |
| `reference/ride-ui-manifest-v1.json` | Public Web theme manifest reference |
| `tools/` | Validation, packaging, LAN distribution, documentation builds |
| `docs/` | Bilingual Markdown reused by GitHub and websites |

The debugger uses synthetic samples. It does not connect to Bluetooth or real vehicles and does not read user ride history. Development builds require no App source; running a theme still requires the App or mock host.

## Capabilities and limits

The SDK provides normalized display data and controlled interactions such as refresh, orientation, and theme settings. **It is not a strictly read-only API.** The host decides which actions are available. Declaring an action does not authorize it.

The public development target is an App-hosted Web theme. There is no independent Android App data endpoint, arbitrary native plugin access, vehicle driver, vehicle parameter write interface, or cross-App data service. Environment types describing other hosts or renderers do not expose their implementation.

## Publication and licensing

The root `LICENSE.md` applies MIT only to the specified example code and example tools. It excludes `vendor/`, `reference/`, SDK documentation, and the Motexa App. Dependency notices remain in `THIRD-PARTY-NOTICES.md`.

App source, native implementations, private protocol documentation, raw device frames, device credentials, signing material, and private installation code are outside this repository. Public documentation covers presentation contracts and theme development only.

Host isolation, capability checks, and authorization enforce the boundary. Hiding interface names is not a security boundary, and the SDK does not promise to prevent independent implementations of similar interfaces. Digests and message session identifiers are not installation approval or vehicle credentials.

Continue with [Quick start](quick-start.md) and the [Browser debugger](debugger.md).
