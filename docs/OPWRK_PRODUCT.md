# OpWrk product definition

## Product promise

OpWrk is an installable work agent that can research, use local files, create
finished artifacts, and repeat tasks on a schedule. A user can complete the
core workflow without creating an OpWrk account or configuring an OpWrk cloud
service.

Local-first describes where OpWrk runs and stores its state. It does not imply
that every model runs locally. The app must identify the destination before it
sends data to a cloud model or connector.

## People we are designing for

The default experience is for someone who can describe the result they need but
may not understand Git, shells, package managers, or source-code diffs.
Developer features remain useful and can appear behind a dedicated setting or
contextual action.

## Agent modes

### Work

Work is the default action mode. It can create and change files, use approved
tools, browse, and complete multi-step tasks within the workspace and
permission boundaries. This is the user-facing replacement for OpenCode's
Build label.

### Plan

Plan is read-only. It can inspect available context, ask questions, evaluate
options, and prepare an approach. It cannot change files or take write actions.

The UI should describe the practical difference between these modes without
requiring the user to understand agent implementation details.

## First release contract

A release candidate is useful when a new user can complete this loop:

1. Launch the desktop app without an OpWrk login.
2. Choose a local workspace and understand its access level.
3. Add a provider key locally or select a detected local model.
4. Ask OpWrk to research a topic or analyze existing workspace files.
5. Follow progress and answer a question without losing the task state.
6. Receive a finished artifact and preview it inside OpWrk.
7. Revise the artifact from the task or preview context.
8. Open the file in an installed desktop app.
9. Schedule the task locally and inspect its next run.
10. Review which local files, external sources, models, and tools were used.

The same task and artifact UI must work in the browser/PWA and Electron. Native
file dialogs, installed-app opening, notifications, and background behavior are
checked in Electron.

## Initial artifact types

- Markdown and rich documents
- PDF
- Excel-compatible workbooks with formulas
- PowerPoint-compatible presentations
- CSV and structured data
- Images
- Research reports with source citations

An artifact is more than a file link. OpWrk needs a type-aware preview,
provenance, an open-in-app action where supported, and a clear relationship to
the task that produced it.

## Required product areas

### Local onboarding

Provider and model setup lives on the device. OpWrk can offer optional remote
services later, but dismissing them must leave the core product usable.

### Workspaces and tasks

The UI uses workspace for the user-approved folder and task for an agent run.
Repository, branch, diff, and pull-request concepts belong to Developer mode or
appear only when relevant.

### Artifacts and sources

Files, generated artifacts, research sources, browser activity, and tool
activity must be visible without opening a terminal transcript.

### Permissions

Approvals state the resource, intended action, and consequence. OpWrk should
support read-only, read-write, and read-write-without-delete workspace access.
Deletion and external side effects require stronger confirmation than local
reads.

### Local automation

Schedules and execution history remain local. A background service may keep
tasks running, but using the scheduler must not require a hosted OpWrk account.

## First-release exclusions

- Organization administration and team policy management
- Mandatory cross-device synchronization
- A hosted model gateway
- Full control of arbitrary desktop applications
- Replacing the OpenCode engine
- Replacing Electron with Tauri before desktop parity is measurable
