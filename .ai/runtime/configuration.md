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

### External or Cloud mode (`forge.temporal.external.*`)

| Key | Type | Default | Scope | Purpose |
|-----|------|---------|-------|---------|
| `forge.temporal.external.address` | string | _(required)_ | window | gRPC endpoint as `host:port` (Temporal Cloud: `{namespace}.{accountId}.tmprl.cloud:7233` or `{namespace}.{accountId}.api.temporal.io:7233`). |
| `forge.temporal.external.namespace` | string | _(required)_ | window | Temporal namespace (Cloud: `namespace.accountId`; self-hosted: operator namespace name). |
| `forge.temporal.external.taskQueue` | string | `forge-workflows` | window | Default task queue for workflow workers connecting to this endpoint. |
| `forge.temporal.external.auth.mode` | `apiKey` \| `tlsServer` \| `insecure` | `apiKey` | window | Client authentication mode (see **External auth modes**). |
| `forge.temporal.external.tls.enabled` | boolean | `true` | window | When `true`, Forge uses TLS for gRPC. Required for Temporal Cloud. Set `false` only with `insecure` auth on loopback hosts. |
| `forge.temporal.external.tls.serverName` | string | _(empty)_ | window | Optional TLS SNI / server name override for self-hosted clusters. |

**Secrets (not settings):** API keys and future certificate material are stored in VS Code SecretStorage, not in `settings.json`. v1 secret key: `forge.temporal.external.apiKey`. Users set the key through **Forge: Set Temporal API Key** (or equivalent command). Environment variable `FORGE_TEMPORAL_EXTERNAL_API_KEY` overrides SecretStorage when set.

## Environment variable overrides

| Variable | Maps to setting | Example |
|----------|-----------------|---------|
| `FORGE_TEMPORAL_MODE` | `forge.temporal.mode` | `managedLocal` |
| `FORGE_TEMPORAL_MANAGED_LOCAL_GRPC_PORT` | `forge.temporal.managedLocal.grpcPort` | `7233` |
| `FORGE_TEMPORAL_MANAGED_LOCAL_UI_PORT` | `forge.temporal.managedLocal.uiPort` | `8233` |
| `FORGE_TEMPORAL_MANAGED_LOCAL_PERSISTENCE_PATH` | `forge.temporal.managedLocal.persistencePath` | `/tmp/forge-temporal` |
| `FORGE_TEMPORAL_MANAGED_LOCAL_NAMESPACE` | `forge.temporal.managedLocal.namespace` | `forge-local` |
| `FORGE_TEMPORAL_MANAGED_LOCAL_TASK_QUEUE` | `forge.temporal.managedLocal.taskQueue` | `forge-workflows` |
| `FORGE_TEMPORAL_EXTERNAL_ADDRESS` | `forge.temporal.external.address` | `my-ns.a1b2c.tmprl.cloud:7233` |
| `FORGE_TEMPORAL_EXTERNAL_NAMESPACE` | `forge.temporal.external.namespace` | `my-ns.a1b2c` |
| `FORGE_TEMPORAL_EXTERNAL_TASK_QUEUE` | `forge.temporal.external.taskQueue` | `forge-workflows` |
| `FORGE_TEMPORAL_EXTERNAL_AUTH_MODE` | `forge.temporal.external.auth.mode` | `apiKey` |
| `FORGE_TEMPORAL_EXTERNAL_TLS_ENABLED` | `forge.temporal.external.tls.enabled` | `true` |
| `FORGE_TEMPORAL_EXTERNAL_TLS_SERVER_NAME` | `forge.temporal.external.tls.serverName` | _(empty)_ |
| `FORGE_TEMPORAL_EXTERNAL_API_KEY` | SecretStorage override | _(secret; not logged)_ |

## Mode-aware configuration resolution

The active value of `forge.temporal.mode` selects which key family is **required** vs **ignored**:

- **`managedLocal`:** `forge.temporal.managedLocal.*` keys apply. `forge.temporal.external.*` values and external secrets are ignored. If external keys are populated, Forge may emit an informational diagnostic that they have no effect in managed-local mode.
- **`external`:** `forge.temporal.external.*` keys and the external credential binding apply. `forge.temporal.managedLocal.*` values are ignored. If managed-local keys are populated, Forge may emit an informational diagnostic that they have no effect in external mode.

Forge does **not** auto-switch modes when connection fails. The user must change `forge.temporal.mode` explicitly.

### Configuration invalid diagnostics

When required settings or secrets for the active mode cannot be resolved, Forge reports **`configuration invalid`** (`.ai/business_logic/error_state.md`) with structured diagnostics before creating a workflow run:

| Condition | Diagnostic |
|-----------|------------|
| `mode` is `external` and `address` or `namespace` is empty | `path`: setting key; `message`: required field missing |
| `auth.mode` is `apiKey` and neither SecretStorage nor `FORGE_TEMPORAL_EXTERNAL_API_KEY` provides a key | `path`: `forge.temporal.external.apiKey`; `message`: API key not configured |
| `auth.mode` is `insecure` but address host is not loopback | `path`: `forge.temporal.external.address`; `message`: insecure mode allowed only for localhost |
| `tls.enabled` is `false` but `auth.mode` is not `insecure` | `path`: `forge.temporal.external.tls.enabled`; `message`: TLS required for this auth mode |
| gRPC connect, TLS handshake, namespace access, or auth rejected by server | `path`: `forge.temporal.external.address`; `message`: connection failed with remediation (no secret values) |

Diagnostics use the shape in `.ai/data/serialization.md` (`code`, `severity`, `path`, `message`).

## External auth modes (v1)

| Mode | Use case | TLS | Client credential |
|------|----------|-----|-------------------|
| `apiKey` | Temporal Cloud (primary), API-key-secured clusters | Required (`tls.enabled: true`) | API key via SecretStorage or `FORGE_TEMPORAL_EXTERNAL_API_KEY` |
| `tlsServer` | Self-hosted external Temporal with server TLS only | Required | None (server certificate validated by system CAs) |
| `insecure` | Local external dev cluster on loopback only | Disabled (`tls.enabled: false`) | None; Forge logs a security warning |

**Post-v1 (out of scope for #19):** mTLS client certificate authentication (`clientCertPair`). Reserved secret keys: `forge.temporal.external.clientCert`, `forge.temporal.external.clientKey`.

## Managed-local readiness gate

When `forge.temporal.mode` is `managedLocal`, Forge blocks workflow run creation until the window-scoped dev server reports **ready**. If startup fails, Forge reports `configuration invalid` (`.ai/business_logic/error_state.md`) with remediation steps and does **not** auto-fallback to external mode. The user may switch mode explicitly after fixing the environment.

Managed-local Temporal starts **lazily** on first workflow run or explicit readiness check in the window, not on every extension activation.

## External readiness gate

When `forge.temporal.mode` is `external`, Forge blocks workflow run creation until an external Temporal connection preflight reports **ready**. Preflight validates:

1. Required settings and credential binding for the configured `auth.mode`
2. gRPC reachability to `forge.temporal.external.address`
3. TLS handshake success when `tls.enabled` is `true`
4. Namespace access with configured credentials
5. Task queue registration probe (worker availability is fully defined in #20; v1 confirms the queue name is reachable or reports worker-unavailable as `unhealthy`, not `connect_failed`, when the server accepts the connection but no worker polls the queue)

If preflight fails, Forge reports `configuration invalid` or `connect_failed` health (`.ai/operations/observability.md`) with remediation steps and does **not** auto-fallback to managed-local mode.

External connection preflight runs **lazily** on first workflow run or explicit readiness check in the window, not on every extension activation.

## Single-user assumptions

Managed-local mode targets one developer on one machine. Forge runs at most **one** dev server per VS Code window (shared by multi-root folders in that window). There is **no** v1 hard cap on concurrent workflow runs; throughput limits follow local machine and Temporal dev server capacity.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
