# Build Packaging

Forge packaging must carry the extension UI, workflow schema contracts, worker runtime assets, and managed-local Temporal support without making external Temporal users install a different extension.

## Packaging Rules

- The extension package includes Forge Studio surfaces needed to discover, inspect, start, and monitor workflows.
- Workflow schema files under `.ai/schemas/` are treated as contract assets for repository workflow definitions.
- Worker code and process-launch assets are packaged so workflow and activity execution runs in a supervised child Node process outside the VS Code extension host.
- Managed local Temporal uses **npm-bundled dev server assets** shipped inside the extension. Users do not install the Temporal CLI separately for managed-local mode.
- Packaging does not bundle user workflow definitions; those remain repo-owned `.ai/workflows/*.json` files.

## Managed-local Temporal packaging

The extension ships:

- npm dependencies required to spawn the Temporal dev server as a **supervised child Node process** (not inside the extension host)
- A launch entry script resolved from extension install path (platform-agnostic Node; no per-OS CLI binary bundle)
- Schema contract files under `.ai/schemas/` copied or referenced for validation modules

The extension does **not** ship per-platform Temporal CLI binaries. External-mode users connect to operator-managed clusters (#19) without a different extension build.

## Worker packaging

The extension ships:

- A worker launch entry script at `resources/workflow/worker/` resolved from the extension install path (platform-agnostic Node)
- npm dependencies required to run the Temporal worker runtime and bundled workflow/activity modules in a **supervised child Node process** (not inside the extension host)
- Shared workflow schema and validation modules referenced by worker code

The extension host package includes the Temporal **client** only. Workflow determinism and activity execution run in the worker child.

At spawn, the extension passes resolved Temporal connection settings to the worker via environment variables (`FORGE_TEMPORAL_*` per `.ai/runtime/configuration.md`). External API keys are read from SecretStorage (or env override) and injected into the child environment at spawn; they are never written to the worker manifest or logs.

Forge records `{extensionGlobalStorage}/temporal/{windowId}/worker-manifest.json` with `extensionVersion`, `workerEntryPath`, and runtime `pid` for upgrade detection. When the packaged extension version changes, Forge gracefully stops and restarts the worker on the next readiness check.

## CI packaging checks

Before release, CI must verify:

- Workflow schema assets under `.ai/schemas/` are present in the packaged extension (or referenced consistently by validation modules)
- The managed-local dev server launch script and its npm dependency closure resolve from a clean `npm ci && npm run build && npm run package` artifact
- Worker launch entry under `resources/workflow/worker/` and its npm dependency closure resolve from a clean `npm ci && npm run build && npm run package` artifact

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
