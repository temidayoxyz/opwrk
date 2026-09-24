# OpWrk

Local-first AI work for files, research, documents, and recurring tasks.

> [!NOTE]
> OpWrk began with the [OpenChamber](https://github.com/openchamber/openchamber)
> codebase, but it is an independently maintained product. It does not sync with
> OpenChamber. Existing OpenChamber features remain while we reshape the app
> around general work.

## What OpWrk is

OpWrk is an installable, open-source work agent powered by
[OpenCode](https://opencode.ai). It is designed for people who want an agent to
research, work with local files, create useful deliverables, and run recurring
tasks without first creating an OpWrk account or moving their setup into an
OpWrk cloud service.

The app and its workspaces run locally. Users bring their own model provider or
connect a local model. Requests sent to a cloud model still leave the computer
and follow that provider's data policy. OpWrk will make that boundary visible.

## Product principles

- **Useful without an OpWrk account.** Local work, provider setup, skills,
  schedules, and history must not depend on an OpWrk control plane.
- **User-owned work.** Files and generated artifacts live in a workspace the
  user controls.
- **Provider choice.** OpWrk uses OpenCode's provider catalog and supports API
  keys, compatible custom endpoints, and local models.
- **Work and Plan.** Work can act within granted permissions. Plan is read-only
  and helps inspect, reason, and prepare an approach.
- **Artifacts before implementation details.** Documents, PDFs, spreadsheets,
  presentations, structured data, images, and cited reports are primary
  outputs.
- **Understandable control.** Permission prompts and activity history explain
  actions in language a non-developer can evaluate.
- **Browser and desktop parity.** Shared product changes are developed in the
  web UI and checked in the Electron desktop app before a phase is complete.

Read [the product definition](docs/OPWRK_PRODUCT.md) for the first release
contract and [the architecture notes](docs/OPWRK_ARCHITECTURE.md) for the fork
and runtime boundaries.

## Current architecture

OpWrk directly forks OpenChamber and currently keeps its package boundaries:

| Package | Responsibility |
| --- | --- |
| `packages/ui` | Shared React UI, state, and runtime contracts |
| `packages/web` | Browser/PWA surface, local server, and CLI |
| `packages/electron` | Desktop shell for Windows, macOS, and Linux |
| `packages/vscode` | VS Code extension |
| `packages/mobile` | iOS and Android shell |

The desktop build bundles a matching OpenCode executable. Users do not need a
separate OpenCode installation. OpenCode remains an upstream dependency rather
than copied source, which keeps provider and model support upgradeable.

Some internal package names and environment variables still use the
`openchamber` name. We will migrate them in tested slices so existing web and
desktop behavior stays runnable throughout the fork.

## Development

Prerequisites:

- Bun 1.3.14
- Node.js 22 or newer
- Git

```bash
git clone https://github.com/temidayoxyz/opwrk.git
cd opwrk
bun install
bun run dev
```

`bun run dev` starts the web UI with hot module replacement. Use the URL printed
in the terminal. For the desktop app with the same shared UI:

```bash
bun run electron:dev
```

Useful checks:

```bash
bun run type-check
bun run lint
bun run test
bun run build
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for package-specific commands and review
requirements.

## First release target

The first release will prove one complete local workflow:

1. Open OpWrk without creating an OpWrk account.
2. Select a local workspace.
3. Connect a model provider locally or use a local model.
4. Research a topic or analyze workspace files.
5. Create and preview a finished artifact.
6. Open that artifact in an installed desktop app.
7. Schedule the task to run locally again.
8. Review the files, sources, tools, and permissions used.

## Contributing

OpWrk is early. Issues that help define the account-free onboarding and the
research-to-artifact workflow are especially useful. Read
[CONTRIBUTING.md](CONTRIBUTING.md) before changing code.

Security reports belong in a private GitHub security advisory. See
[SECURITY.md](SECURITY.md).

## Acknowledgments

Thanks to the [OpenChamber](https://github.com/openchamber/openchamber)
maintainers and contributors. Their shared UI, local server, and desktop app
provided OpWrk's starting codebase. We retain the original MIT attribution in
the [license](LICENSE) and Git history. OpenChamber does not maintain or support
OpWrk.

Thanks to the [OpenCode](https://github.com/anomalyco/opencode) maintainers and
contributors for the agent runtime, SDK, and model-provider integration. OpWrk
uses OpenCode as a dependency; it does not fork OpenCode's source into this
repository. OpWrk is not affiliated with either project or any model provider.

See [FORK_NOTICE.md](FORK_NOTICE.md) for provenance and licensing details.

## License

MIT. See [LICENSE](LICENSE).
