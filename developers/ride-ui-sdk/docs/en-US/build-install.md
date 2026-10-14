# Build and App installation

Builds produce browser previews, an App-importable theme runtime package, and public SDK/example/documentation archives. **A theme runtime package is not an Android APK.**

## Commands

| Command | Result |
| --- | --- |
| `pnpm theme:check` | Manifest and source validation |
| `pnpm typecheck` | Vue/TypeScript validation |
| `pnpm theme:replay-check` | Six synthetic scenarios |
| `pnpm theme:build` | Browser debugger in `dist/development/` |
| `pnpm theme:pack-runtime` | `dist/runtime-web/`, runtime ZIP, integrity JSON |
| `pnpm theme:runtime-check` | Verify runtime resources/digests |
| `pnpm theme:pack` | Legacy source-review ZIP; not installable |
| `pnpm docs:build` | Static documentation site; requires browser/runtime builds |
| `pnpm release:build` | Complete validation, builds, documentation, release archives |

## Demo runtime

```sh
pnpm theme:pack-runtime
pnpm theme:runtime-check
```

The example writes `dist/partner.example-dashboard-0.2.0-web-default.ride-ui-runtime.zip`. Adjacent `.integrity.json` contains archive/manifest digests. Full releases also emit `.sha256` files. Runtime ZIPs contain compiled theme resources, manifest, configuration, and license notices, without debugger or theme source.

Resource names, sizes, and SHA-256 values are recorded in the manifest. A digest proves file integrity, not publisher approval. The packer does not sign, install, or authorize packages.

## Import into the App

Use the Motexa App's ride-theme import entry with the runtime ZIP and follow preview, verification, and enable steps. Entry labels vary by App version. Import must satisfy App network verification and installation policy; do not modify the App to bypass checks.

For LAN distribution:

```sh
pnpm theme:serve-runtime -- --bind 0.0.0.0 --port 5189
```

Open `http://127.0.0.1:5189/` on your computer and choose the IPv4 address/QR code on the phone's network. In the App, choose the LAN import entry and scan or paste the URL. The server exposes the runtime ZIP only; the QR carries its URL and the App handles installation.

Check Wi-Fi/network, firewall, adapter address, and port if unreachable. Bind to `0.0.0.0` only when sharing the runtime package with your phone; the mock host does not need LAN exposure.

## Release output

```sh
pnpm release:build
```

`dist/release/` contains:

- `Motexa-Ride-UI-SDK-1.5.0-GitHub.zip`: standalone repository, compiled SDK, docs, CI, Pages workflows.
- `Motexa-Ride-UI-SDK-1.5.0-GitHub-Release.zip`: source plus debugger build, runtime files, docs site, demo ZIP.
- `Motexa-Ride-UI-SDK-1.5.0-Docs-Site.zip`: deployable static docs site with debugger and demo download.
- Demo `*.ride-ui-runtime.zip` and integrity JSON.
- Per-artifact `.sha256` files and `release.json`.

Each archive has `SDK-CONTENTS.sha256.json` with per-file digests, excluding itself. Packaging uses explicit files/directories rather than archiving the whole working directory.

Automated checks cover types, manifest, replay, resources, and integrity. Phone/vehicle installation, layout, performance, and host support need separate real-device testing.
