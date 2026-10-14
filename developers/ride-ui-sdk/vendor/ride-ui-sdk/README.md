# Motexa Ride UI SDK

This package is the public, versioned interface for Motexa Ride UI themes.
Themes may import only `@motexa/ride-ui-sdk/client` and
`@motexa/ride-ui-sdk/contract`; they communicate with the host only through
the documented message protocol.

The supported integration runs inside the Motexa App's theme host. The App
converts device protocols into normalized telemetry before delivering SDK
messages. The SDK is a client for that host, not a standalone vehicle driver or
an interface for another Android application. Device discovery, connections,
credentials, protocol parsing and authorization remain owned by the App.

Read [DEVELOPMENT.md](DEVELOPMENT.md) for the public integration guide, data
semantics, capability checks and distribution boundary. Public archives contain
only the explicitly listed SDK files, the theme starter and synthetic replay;
internal source generators and protocol documentation are excluded.

The SDK starts with an empty-session `theme.ready` bootstrap message. The
script-only sandboxed host replies with `host.init`, which assigns the random
session ID required for later state, action, and error messages.

The current wire contract is API 1.11. `vehicleGear` (1 low / 2 middle / 3 high)
and `vehicleParking` (1 P engaged / 0 P released) are independent, unitless
snapshot telemetry fields. Missing values remain null, including unverified
Ninebot MMAX90 states. Only fresh values represent current vehicle state.
Older hosts' absent telemetry fields are filled with unavailable values.
The optional `host.init.environment`
object adds host kind, renderer, output target, viewport, input, and data
capabilities without invalidating API 1.x themes that do not read it.

`subscribeDisplayFrame(listener)` receives native `ride.display-frame` presentation
values once per animation frame, retaining only the newest pending value. Use
`speedKmh` for speed digits, pointers and bars, including `null` for missing speed;
do not fall back to measured speed after a display frame has arrived. `state` is
`live`, `held` or `missing`. Frames include a monotonic frame sequence, generation
time, source, `bufferMs` and estimated `periodMs`. `telemetry.speed` remains the
measured speed and its original provenance; do not apply a second speed filter.

API 1.11 hosts advertise `native-speed-presentation` in environment data capabilities.
Normal phone outputs follow vsync, low-power outputs are capped at 30fps, and cast
outputs sample the same native timeline at their output rate. Legacy `subscribeFrame`
consumers receive display speed in the hero fields while telemetry stays measured.
Hosts without native presentation use direct speed input or deterministic SDK replay.

`@motexa/ride-ui-sdk/replay` contains deterministic normal, missing-GPS,
stale, regenerative-braking, source-switch, and wall-clock-rollback samples for
the independent browser mock host. `tools/runtime-package.mjs` is the shared
runtime manifest/integrity implementation used by the partner template. It
verifies an exact resource allow-list and SHA-256 for every file; it does not
sign, authorize, install, or publish a bundle.

Configured themes declare a JSON schema and defaults in `ride-ui.json`. Hosts
open them in `theme-settings` mode and accept `theme.config-patch` only when
that capability is advertised. Include the current `schemaVersion` and
`baseRevision`, then adopt the host's returned config; conflicts include the
latest revision. Configuration belongs to the host, including imported themes.
The partner starter demonstrates a settings page and explicit save button
that works in the script-only sandbox.

Runtime packages permit only exact quoted W3C SVG, XHTML, XLink, and MathML
namespace identifiers in scripts. They still reject network calls, dynamic
execution, and other remote URLs. Namespace identifiers are DOM metadata.
