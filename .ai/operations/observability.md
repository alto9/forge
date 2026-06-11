# Observability

Forge observability makes workflow health, validation state, and recovery actions visible without exposing secrets.

## Observable Signals

- Workflow definition discovery and validation status.
- Temporal connection health, namespace, task queue readiness, and worker availability.
- Workflow run state, current node, pending timers, pending human questions, retry state, and cancellation state.
- Cursor SDK activity status, run identifiers, failure summaries, and artifact references.
- Validator outcomes for schema, artifact, and domain checks (`ValidationResult` aggregates on `WorkflowRunProjection.validationSummaries`).
- GitHub activity failures and rate or auth blockers.
- Recovery actions after extension restart, worker restart, or Temporal reconnect.
- Workflow start attempts, blocked starts, successful starts, and failed starts without exposing run input values or credentials.

## Managed-local Temporal health states

Forge exposes these named health states for the window-scoped managed-local dev server:

| State | Meaning | User-visible surfaces |
|-------|---------|----------------------|
| `idle` | Mode is managed local; server not yet requested | Status bar: "Temporal: idle" |
| `starting` | Dev server child process launching | Output channel logs; status bar: "Temporal: starting…" |
| `ready` | gRPC reachable on configured port and namespace ready | Notification: "Forge Temporal ready"; status bar: "Temporal: ready" |
| `unhealthy` | Process running but health probe failed | Output channel warning; status bar: "Temporal: unhealthy" |
| `start_failed` | Could not start (port conflict, missing asset, permission) | Notification (error) with remediation; status bar: "Temporal: failed"; workflow runs blocked |
| `stopped` | Supervised process exited after graceful shutdown | Status bar: "Temporal: stopped" |

Diagnostic log lines in the Forge Output channel use prefix `[forge.temporal.local]` and include `windowId`, `grpcPort`, `persistencePath` (redacted if user-overridden to a sensitive path), and `exitCode` on failure. Secrets and credential material are never logged.

## External Temporal health states

Forge exposes these named health states when `forge.temporal.mode` is `external`:

| State | Meaning | User-visible surfaces |
|-------|---------|----------------------|
| `idle` | External mode selected; connection not yet requested | Status bar: "Temporal: idle" |
| `connecting` | Resolving settings, loading credentials, gRPC/TLS handshake in progress | Output channel logs; status bar: "Temporal: connecting…" |
| `ready` | Preflight succeeded: reachable endpoint, namespace access, auth accepted | Notification: "Forge Temporal ready"; status bar: "Temporal: ready" |
| `unhealthy` | Connected but repeated health probe failed, or task queue has no polling worker | Output channel warning; status bar: "Temporal: unhealthy" |
| `connect_failed` | Address unreachable, TLS failure, auth rejected, or missing required config/secret | Notification (error) with remediation; status bar: "Temporal: failed"; workflow runs blocked |
| `disconnected` | Previously ready connection lost | Output channel warning; status bar: "Temporal: disconnected" |

Diagnostic log lines for external mode use prefix `[forge.temporal.external]` and include `address` (host:port only), `namespace`, `authMode`, `tlsEnabled`, and probe error codes. API keys, certificates, and Authorization material are never logged.

## Worker health states

Forge exposes these named health states for the **window-scoped** out-of-host Temporal worker supervised by the extension:

| State | Meaning | User-visible surfaces |
|-------|---------|----------------------|
| `idle` | Temporal connection not yet `ready`, or worker not yet requested | Status bar worker segment omitted or "Worker: idle" when shown |
| `starting` | Worker child process launching | Output channel logs; status bar: "Worker: starting…" |
| `ready` | Process alive and task queue poll confirmed for configured queue | Notification optional on first ready in session; status bar: "Worker: ready" |
| `unhealthy` | Process running but task queue probe failed or repeated heartbeat miss | Output channel warning; status bar: "Worker: unhealthy" |
| `start_failed` | Could not spawn worker (missing packaged asset, permission, repeated crash) | Notification (error) with remediation; status bar: "Worker: failed"; workflow runs blocked |
| `restarting` | Supervised restart after crash or extension version change | Output channel info; status bar: "Worker: restarting…" |
| `stopped` | Graceful shutdown after window close or extension deactivate | Status bar: "Worker: stopped" |

When Temporal connection health is not `ready`, worker health is reported as `idle` regardless of process state. External-mode preflight treats "server reachable but no worker polling" as Temporal `unhealthy` until the supervised worker reaches `ready`.

Diagnostic log lines for the worker use prefix `[forge.temporal.worker]` and include `windowId`, `taskQueue`, `namespace`, `mode`, `extensionVersion`, `pid`, and `exitCode` on failure. API keys, client certificates, private keys, and Authorization material are never logged.

Status bar v1 may show a compound label such as `Temporal: ready · Worker: ready` or separate segments; both connection and worker must be `ready` before workflow run creation proceeds.

## Run recovery states

Forge exposes these named states on each `WorkflowRunProjection` and `WorkflowRunIndexEntry` during restart recovery (#21):

| State | Meaning | User-visible surfaces |
|-------|---------|----------------------|
| `synced` | Projection matches latest Temporal describe/query | Run list shows current node and status; human-input and cancel actions allowed |
| `recovery_pending` | Indexed run awaiting readiness or refresh in progress | Run list badge "Recovering…"; user actions blocked |
| `refresh_failed` | Temporal reachable but describe/query failed (permission, transient error) | Output channel warning; run list "Refresh failed"; manual refresh offered |
| `orphaned` | Temporal reports run not found for indexed identity | Run list "Stale"; dismiss action available |
| `unreachable` | Temporal or worker not yet `ready`; cannot refresh | Run list "Waiting for Temporal…"; automatic retry when readiness gate passes |

### Mode-specific recovery guarantees

| Aspect | managedLocal | external |
|--------|--------------|----------|
| Durable history | Window-scoped SQLite under `{extensionGlobalStorage}/temporal/{windowId}/` | Remote Temporal namespace |
| Survives extension restart | Yes when persistence directory intact | Yes; independent of Forge local files |
| Recovery requires | Same mode, namespace, persistence path; dev server and worker `ready` | Same mode, address, namespace, credentials; worker `ready` |
| Unrecoverable when | User deletes or corrupts persistence directory | Wrong endpoint/namespace/credentials, or remote retention expired |

Automatic recovery runs **once per window session** when Temporal connection and supervised worker both first reach `ready` after restart. Manual **Forge: Refresh workflow runs** re-scans all index entries within retention.

Diagnostic log lines for recovery use prefix `[forge.temporal.recovery]` and include `windowId`, `namespace`, `workflowId`, `runId`, `recoveryState`, and error codes. Secrets are never logged.

## Workflow start diagnostics

Workflow start feedback uses existing Forge Temporal output, notifications, status, and run-list surfaces.

| Event | User-visible surface | Log metadata |
|-------|----------------------|--------------|
| Start requested | Optional Output channel info | `workflow_id`, `repositoryRoot`, declared input key names only |
| Start blocked by definition validation | Catalog disabled reason/helper text and notification when command-driven | diagnostic `code`, `path`, `severity`; no submitted values |
| Start blocked by run input validation | Inline catalog input validation and notification when command-driven | diagnostic `code`, `path`, `severity`, declared input key names only; no submitted values |
| Start blocked by readiness | Notification and status bar health state | Temporal and worker health states |
| Start succeeded | Notification or catalog feedback plus Workflow Runs refresh | `workflow_id`, `namespace`, `workflowId`, `runId`, `taskQueue` |
| Start failed before run identity | Error notification and Output channel diagnostic | redacted Temporal or validation error code |
| Start accepted, index write failed | Error notification and Output channel recovery diagnostic | `workflow_id`, `namespace`, `workflowId`, `runId`, `taskQueue`, local write error code; no submitted input values |

### Blocked versus failed starts

Blocked starts are failures before the Temporal start call. They include invalid or unresolved workflow definitions, invalid submitted `run_inputs[]`, Temporal configuration or readiness failures, worker readiness failures, and duplicate in-flight start suppression. Blocked starts do not create Temporal history and do not create or mutate a `WorkflowRunIndexEntry`.

Failed starts are failures from the Temporal start call before Temporal returns `(namespace, workflowId, runId)`. They reuse the Forge Temporal error notification and Output channel diagnostic path, include redacted Temporal error classification when available, and do not create or mutate a `WorkflowRunIndexEntry`.

### Start diagnostic copy

| Situation | User-facing copy |
|-----------|------------------|
| Definition invalid | "Fix validation errors before starting a run." |
| Required input missing or invalid | "Complete required inputs before starting this workflow." |
| Temporal not ready | "Workflow runs are blocked until Temporal is ready. See Forge Temporal output for details." |
| Worker not ready | "Workflow runs are blocked until the Forge worker is ready. See Forge Temporal output for details." |
| Duplicate matching start in flight | "Starting workflow run…" |
| Temporal start failed before identity | "Could not start workflow run — {reason}." |

`{reason}` is a redacted, user-actionable summary. It may include Temporal error class, namespace, task queue, or remediation hint, but it must not include submitted input values, API keys, certificates, authorization headers, raw Temporal payloads, or full stack traces.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.

## Cursor SDK activity diagnostics

Worker-executed Cursor SDK activities log to the Forge Output channel with prefix `[forge.activity.cursor]`.

### Logged fields (v1)

`activity_id`, `node_id`, `cursor_agent_id`, `cursor_run_id`, `status`, `failure_class`, `retryable`, and `artifact_refs` paths (when present).

### Excluded from logs

Assistant message text, tool call payloads, `structured_payload` body, `follow_up_questions` prompt text, full SDK event streams, API keys, `Authorization` headers, certificate or private-key material, and environment variable values for names containing `KEY`, `TOKEN`, or `SECRET`.

### Redaction

Replace excluded or sensitive values with `[REDACTED]`. Request envelope `inputs` are not logged at info level; log only key names when debug diagnostics are explicitly enabled in a future operator mode.

Envelope field definitions: `.ai/integration/api_contracts.md`. GitHub activity log rules remain in a future integration milestone.

## Validation gate diagnostics (cockpit projection)

Forge projects runtime validation outcomes onto `WorkflowRunProjection` without exposing artifact file bodies or full envelope payloads.

### `validationSummaries[]` (per validation node)

| Field | Description |
|-------|-------------|
| `node_id` | Validation node identifier |
| `node_name` | Human-readable name from workflow definition |
| `valid` | Aggregate pass/fail |
| `validated_at` | ISO-8601 UTC from `ValidationResult` |
| `source_activity_node_id` | Upstream activity when present |
| `validator_outcomes` | Array of `{ validator_id, type, target, passed, blocking }` |
| `diagnostics` | Redacted diagnostic list (`code`, `severity`, `message`, `path`, `validator_id`) |

### Run inspector behavior (v1)

- Failed validation nodes show status **Validation failed** with expandable redacted diagnostics.
- Passed validation nodes show **Validated** with validator ID list; no artifact content inline.
- When `forge.artifact.integrity` fails, surface expected vs actual hash prefix (first 8 hex chars) only; full paths are repo-relative, not absolute.
- Activity nodes show envelope summary metadata only; `structured_payload` is never rendered in the inspector.
- Artifact previews follow `.ai/interface/presentation.md` **Artifact preview (v1)**: 32 KiB UTF-8 inline cap, metadata-only binary, glob list cap of 20 paths.

### UI redaction (run inspector)

All user-visible diagnostic messages and artifact preview text pass a redaction pass before render:

- Replace values matching API keys, `Authorization` headers, certificate material, and environment variables whose names contain `KEY`, `TOKEN`, or `SECRET` with `[REDACTED]` (same rules as **Cursor SDK activity diagnostics** above).
- Do not display raw SDK transcripts, tool payloads, or full envelope JSON in the inspector.
- `validationSummaries[].diagnostics` are redacted when the projection is built; the inspector displays them without additional mutation except preview-file reads (which also pass redaction).

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Health and diagnostics (remaining)
- Define log redaction rules for GitHub activity diagnostics inside worker-executed activities.

_(Run input key-name logging, blocked and failed start copy, and post-acceptance run identity metadata are resolved in **Workflow start diagnostics**: declared input key names and Temporal identity metadata may appear in logs; submitted values remain excluded. Run inspector artifact preview limits, recovery action catalog, and UI redaction rules resolved in **Run inspector behavior (v1)** and **UI redaction (run inspector)** above.)_
