# GitHub publishing and FAQ

Publish the standalone SDK development repository, not the full Motexa App project. README, bilingual documentation, example, SDK, CI, and Pages workflows are included.

## Create a repository

1. Extract `Motexa-Ride-UI-SDK-1.5.0-GitHub.zip` and enter its root.
2. Create an empty GitHub repository, initialize/commit this directory, and use your actual remote URL. Do not push from the full App project.
3. Run `pnpm install --frozen-lockfile` and `pnpm release:build` before publication.
4. Review CI after pushing. Attach the delivery ZIP, demo, and digests from `dist/release/` to a GitHub Release.

The maintainer chooses repository name and remote URL; no uncreated repository link is assumed. A release tag may be `sdk-v1.5.0`. Include SDK/API/Demo versions because they are versioned separately.

## Release description template

```text
Motexa Ride UI SDK 1.5.0 / API 1.11 / Demo 0.2.0

Public SDK, Vue/TypeScript example, synthetic browser debugger,
theme validation/packaging tools, bilingual documentation.

GitHub.zip: standalone source repository.
GitHub-Release.zip: source + browser build + docs site + demo runtime.
*.ride-ui-runtime.zip: import into Motexa App; not an APK.
Digests: adjacent .sha256 files and release.json.

MIT applies only to the example scope in LICENSE.md.
SDK, reference files, SDK documentation, and App are excluded.
Fill in the actual build and real-device validation status.
```

## Use the docs on a website

`docs/zh-CN/` and `docs/en-US/` are the content source. `docs/navigation.json` defines navigation. Relative Markdown links work on GitHub and are rewritten for websites at build time.

```sh
pnpm release:build
pnpm docs:preview
```

`dist/docs-site/` is a backend-free static site using relative resources. Deploy at a domain root or subdirectory. It includes language switching, navigation, a table of contents, synthetic debugger, and demo download.

Alternatively, extract `Motexa-Ride-UI-SDK-1.5.0-Docs-Site.zip` and deploy its site contents. If your server applies a CSP, the debugger's self-contained preview requires inline scripts/styles to be permitted; the theme retains its `allow-scripts` sandbox.

For GitHub Pages, select GitHub Actions in Settings → Pages, then manually run `Deploy developer docs to Pages`. CI builds only; Pages deploys when a maintainer starts that workflow.

The Motexa website reads the same Markdown at `/docs/developers` and `/docs/developers/:slug`. Sync public debugger/release assets before building the website; see its README. Edit Markdown, not generated HTML or a second website copy.

## FAQ

**Is everything MIT?** No. The root license covers specified example code/tools only. SDK, reference files, and documentation are not relicensed. Do not add a blanket MIT LICENSE when creating the repository.

**Can another App connect to vehicles with it?** There is no such endpoint. Real data comes from the App's theme host.

**Is it read-only?** It includes controlled interactions. Connections, vehicle writes, and permissions remain App responsibilities.

**Does replay contain user data?** No, samples are synthetic. Do not attach real ride history, credentials, or internal logs to issues.

**Does a correct digest allow installation?** It verifies integrity. The App still checks identity, authorization, compatibility, and installation policy.

**Must native protocol docs be public?** No. Publish presentation contracts, examples, and theme guides. App/internal protocol documentation stays outside the release.
