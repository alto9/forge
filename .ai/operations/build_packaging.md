# Build Packaging

Forge packaging must carry the extension UI, workflow schema contracts, worker runtime assets, and managed-local Temporal support without making external Temporal users install a different extension.

## Packaging Rules

- The extension package includes Forge Studio surfaces needed to discover, inspect, start, and monitor workflows.
- Workflow schema files under `.ai/schemas/` are treated as contract assets for repository workflow definitions.
- Worker code and process-launch assets are packaged or resolved in a way that keeps workflow execution outside the VS Code extension host (worker packaging detail in #20).
- Managed local Temporal uses **npm-bundled dev server assets** shipped inside the extension. Users do not install the Temporal CLI separately for managed-local mode.
- Packaging does not bundle user workflow definitions; those remain repo-owned `.ai/workflows/*.json` files.

## Managed-local Temporal packaging

The extension ships:

- npm dependencies required to spawn the Temporal dev server as a **supervised child Node process** (not inside the extension host)
- A launch entry script resolved from extension install path (platform-agnostic Node; no per-OS CLI binary bundle)
- Schema contract files under `.ai/schemas/` copied or referenced for validation modules

The extension does **not** ship per-platform Temporal CLI binaries. External-mode users connect to operator-managed clusters (#19) without a different extension build.

## CI packaging checks

Before release, CI must verify:

- Workflow schema assets under `.ai/schemas/` are present in the packaged extension (or referenced consistently by validation modules)
- The managed-local dev server launch script and its npm dependency closure resolve from a clean `npm ci && npm run build && npm run package` artifact
- Worker launch assets required for #20 are validated when that milestone lands; #18 CI asserts only the dev-server supervisor entry is packaged

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
