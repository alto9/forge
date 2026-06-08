# Configuration

Forge workflow configuration selects how workflow definitions are discovered and how Temporal execution is reached.

## Configuration Model

- Workflow definitions are discovered from `.ai/workflows/*.json` in the selected repository context.
- Runtime mode distinguishes **managed local** Temporal from **external** or Cloud Temporal endpoints.
- Managed local mode configures npm-bundled Temporal dev server startup, window-scoped persistence, worker supervision (see #20), and single-user workflow assumptions.
- External or Cloud mode configures Temporal endpoint, namespace, task queue, credential binding, and worker connectivity (see issue #19).
- Workflow configuration references stable activity IDs, validators, agent paths, skill paths, and artifact locations declared by workflow JSON.
- Configuration must not require embedding secrets in workflow definition files.

## Setting precedence

When the same value can be set in multiple places, Forge resolves in this order (highest wins):

1. Workspace settings (`settings.json` in `.vscode/` or multi-root workspace file)
2. User settings
3. Environment variables (`FORGE_TEMPORAL_*`; see table below)
4. Built-in defaults in this contract

Workflow JSON declares policy identifiers and artifact paths; it does not override Temporal connection settings.

## VS Code settings (`forge.temporal.*`)

| Key | Type | Default | Scope | Purpose |
|-----|------|---------|-------|---------|
| `forge.temporal.mode` | `managedLocal` \| `external` | `managedLocal` | window | Selects managed-local dev server vs external endpoint (#19). |
| `forge.temporal.managedLocal.grpcPort` | number | `7233` | window | gRPC port for the window-scoped dev server. |
| `forge.temporal.managedLocal.uiPort` | number | `8233` | window | Temporal Web UI port (diagnostics only in v1). |
| `forge.temporal.managedLocal.persistencePath` | string | _(computed)_ | window | Override for dev server persistence directory. When empty, Forge uses the computed default below. |
| `forge.temporal.managedLocal.namespace` | string | `forge-local` | window | Temporal namespace for managed-local runs. |
| `forge.temporal.managedLocal.taskQueue` | string | `forge-workflows` | window | Default task queue for workflow workers in this window. |

**Computed default persistence path:** `{extensionGlobalStorage}/temporal/{windowId}/` where `windowId` is a stable identifier for the VS Code window. Persistence survives extension restart within the same window context so #21 recovery can reconnect.

External-mode keys (`forge.temporal.external.*`) are defined in issue #19 refinement.

## Environment variable overrides

| Variable | Maps to setting | Example |
|----------|-----------------|---------|
| `FORGE_TEMPORAL_MODE` | `forge.temporal.mode` | `managedLocal` |
| `FORGE_TEMPORAL_MANAGED_LOCAL_GRPC_PORT` | `forge.temporal.managedLocal.grpcPort` | `7233` |
| `FORGE_TEMPORAL_MANAGED_LOCAL_UI_PORT` | `forge.temporal.managedLocal.uiPort` | `8233` |
| `FORGE_TEMPORAL_MANAGED_LOCAL_PERSISTENCE_PATH` | `forge.temporal.managedLocal.persistencePath` | `/tmp/forge-temporal` |
| `FORGE_TEMPORAL_MANAGED_LOCAL_NAMESPACE` | `forge.temporal.managedLocal.namespace` | `forge-local` |
| `FORGE_TEMPORAL_MANAGED_LOCAL_TASK_QUEUE` | `forge.temporal.managedLocal.taskQueue` | `forge-workflows` |

## Managed-local readiness gate

When `forge.temporal.mode` is `managedLocal`, Forge blocks workflow run creation until the window-scoped dev server reports **ready**. If startup fails, Forge reports `configuration invalid` (`.ai/business_logic/error_state.md`) with remediation steps and does **not** auto-fallback to external mode. The user may switch mode explicitly after fixing the environment.

Managed-local Temporal starts **lazily** on first workflow run or explicit readiness check in the window, not on every extension activation.

## Single-user assumptions

Managed-local mode targets one developer on one machine. Forge runs at most **one** dev server per VS Code window (shared by multi-root folders in that window). There is **no** v1 hard cap on concurrent workflow runs; throughput limits follow local machine and Temporal dev server capacity.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
