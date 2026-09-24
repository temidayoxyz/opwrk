# OpWrk architecture notes

## Fork relationship

OpWrk directly forks OpenChamber under the MIT License. It owns its product
changes and does not depend on contributing them back upstream.

OpenCode remains an external runtime dependency. Desktop builds bundle the
matching executable, and advanced users may point OpWrk at a compatible local
installation. This keeps provider support and engine upgrades separate from
the OpWrk product code.

## Runtime shape

The inherited package boundaries are useful and remain in place during the
first product milestones:

```text
packages/ui       shared product UI and runtime contracts
packages/web      browser/PWA UI host, local server, and CLI
packages/electron desktop integration and packaging
packages/vscode   editor integration
packages/mobile   mobile clients
packages/sdk      third-party panel contract
```

Most product work belongs in `packages/ui` or `packages/web`. Electron owns
native windows, dialogs, installed-app opening, notifications, updates, and
privileged process boundaries. Shared components must not import Electron.

## Browser-led UI development

The default development loop runs the shared React UI through Vite with hot
module replacement. It is opened in the Codex in-app browser for inspection,
interaction, screenshots, and element-level feedback.

Each user-visible phase then receives an Electron check using the same shared
UI. This catches differences in runtime bootstrap, local server behavior,
custom protocols, browser panels, native dialogs, and packaged assets.

Browser success alone is insufficient evidence for desktop-only behavior.

## Desktop shell decision

Electron remains the first desktop shell because the inherited application
runs its Bun/Node server in the Electron main process and already implements
the browser panel, PTYs, OpenCode lifecycle, SSH, tunnels, updates, deep links,
and native windows.

A Tauri shell may be added later as a parallel package. It must prove parity
through the shared runtime contracts before replacing Electron. A Tauri port
would need an explicit strategy for the local server and native Node modules,
usually a packaged sidecar or a rewritten host service.

## Local data boundary

The core application must keep these on the user's device:

- OpWrk preferences and onboarding state
- Provider configuration and credentials
- Workspace grants
- Task and artifact metadata
- Skills and local connector configuration
- Schedules and execution history

Credentials should use the operating-system credential store where the desktop
runtime supports it. The UI must identify cloud-bound requests before the user
connects a remote model or service.

## Migration rule

The upstream code uses `openchamber` in package names, environment variables,
protocols, persisted directories, and executable identities. Those names are
changed in focused slices with compatibility handling and cross-runtime tests.
A repository-wide text replacement would risk stored data, updates, external
scripts, and packaged application behavior.
