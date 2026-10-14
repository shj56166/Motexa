# Manifest and settings

`theme/ride-ui.json` declares source entry, identity, API, capabilities, outputs, and configuration. The public reference is `reference/ride-ui-manifest-v1.json`; validation and runtime checks enforce the actual rules.

## Manifest fields

| Field | Purpose |
| --- | --- |
| `id` / `name` / `version` | Stable unique identity, display name, release version |
| `entry` | Source entry relative to theme root, e.g. `src/main.ts` |
| `api.major` / `api.minMinor` | Example requires API 1.11 |
| `orientations` | Actual supported orientations |
| `requiredCapabilities` | Essential capabilities; keep minimal |
| `optionalCapabilities` | Enable if available, otherwise degrade gracefully |
| `runtime` | Publisher/release identity, Web variant, targets, requirements |
| `config` | Schema version/path and defaults |

The example declares phone/agent, phone/vehicle-cast, Android API 26, WebView 120, viewport limits, and data capabilities. These are compatibility requirements, not device access grants or verified support. Narrow targets to those you actually support.

## Settings

The example has `accent`, `hideSpeedDecimal`, and `showPower`. Defaults must satisfy the schema. Runtime packaging includes `config/schema.json` and `config/defaults.json`.

The App opens settings in `theme-settings` mode. Read schema version, revision, and data from `context.config`, maintain a separate editing draft, and submit on an explicit save click:

```ts
const result = await client.requestAction('theme.config-patch', {
  schemaVersion: context.config.schemaVersion,
  baseRevision: context.config.revision,
  patch: { accent: 'cyan', hideSpeedDecimal: true, showPower: true },
})
const returned = (result.result as { config?: typeof context.config } | undefined)?.config
if (returned) {
  // Adopt the returned revision/data in component state.
}
if (!result.ok) {
  // On conflict, reset the draft to latest data and ask the user to review.
}
```

Check the `theme.config-patch` capability and prevent duplicate submissions. `baseRevision` protects concurrent updates; conflicts include latest configuration. Do not retry by blindly overwriting it. Themes do not persist settings in localStorage.

## Layout

Use `context.safeArea`, host orientation/viewport, locale, and scheme. Reduce motion when low power or animations are disabled. No-input outputs must still display essential data. Preview mode may disable interactions; capabilities decide button behavior.

Use explicit buttons to save. Native form submission is unavailable in the theme sandbox and cannot replace SDK actions.

## Resources

Bundle images, styles, and fonts locally. Do not use fetch, remote scripts/styles/fonts, dynamic execution, Capacitor, direct parent navigation, or host storage. Settings use the SDK only. Debugger and documentation resources never enter the theme runtime package.

Review [Debugger](debugger.md) behavior and [build an installable package](build-install.md).
