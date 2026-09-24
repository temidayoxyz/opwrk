# OpWrk Web

This package runs OpWrk's local web server and serves the shared React interface. The browser and PWA use the same UI as the Electron desktop app. OpWrk runs OpenCode locally by default; an OpWrk account is not required.

## Develop from source

From the repository root:

```bash
bun install
bun run dev
```

Open the local URL printed by the dev server. The UI uses hot reload, so changes in `packages/ui` also appear in the desktop development build.

If the pinned OpenCode binary has been staged for desktop builds, the dev server uses it with separate temporary data so a newer system OpenCode cannot migrate or conflict with your personal OpenCode database. Set `OPENCODE_BINARY` to override this choice. If the binary is absent and your system OpenCode is incompatible, stage the pinned runtime with `bun run oc-dev prepare-opencode-cli` and restart `bun run dev`.

For a desktop window, run `bun run electron:dev` from the root. For a packaged desktop app, see [the desktop README](../electron/README.md).

## Current distribution status

There is no published OpWrk web package or one-click web self-update yet. The inherited `@openchamber/web` package name and `openchamber` CLI remain internal compatibility identifiers during the fork migration. Do not install that npm package expecting an OpWrk release. The web app checks OpWrk's GitHub releases for version information but will not run an OpenChamber package-manager update.

The Electron updater is separate: it uses OpWrk release assets and update manifests from [OpWrk releases](https://github.com/temidayoxyz/opwrk/releases). A desktop release will only be published after its installers and update manifests are validated.

## Local data and network access

Model credentials are configured through OpenCode and remain on this machine unless you choose a remote provider. Serving the UI beyond loopback is optional and requires deliberate network configuration. Protect any LAN or public endpoint with authentication and a trusted network boundary.

The source still contains some `OPENCHAMBER_*` environment variables, storage paths, and wire identifiers. These remain compatibility contracts for existing data and clients; they are not OpWrk cloud services. They will be migrated individually, with data-preserving tests.

## Ownership

The server starts and manages OpenCode, exposes OpWrk-owned APIs, and serves browser assets. Shared UI and runtime-neutral behavior live in `packages/ui`; native capabilities belong in `packages/electron`. See the root [README](../../README.md) for the product overview.

## License

MIT. OpWrk acknowledges [OpenChamber](https://github.com/openchamber/openchamber) as its direct codebase origin and [OpenCode](https://github.com/anomalyco/opencode) as its agent runtime.
