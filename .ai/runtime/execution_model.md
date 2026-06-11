# Execution Model

Forge workflow execution is Temporal-backed and data-defined.

## Execution Rules

- A workflow run starts from a validated `.ai/workflows/*.json` definition.
- Run start validates declared `run_inputs[]` and runtime readiness before Temporal creates durable execution history.
- Temporal workflow code owns deterministic orchestration, durable state, waits, timers, retries, and recovery.
- Activities perform non-deterministic work such as Cursor SDK agent runs, GitHub API calls, filesystem reads or writes, and validation checks.
- Agent activities are bounded by workflow definition inputs and Cursor SDK integration contracts (`.ai/integration/api_contracts.md`).
- Human question points suspend the workflow until Forge sends the declared Temporal signal or update.
- Validation gates run before downstream steps consume agent output or produced artifacts. Each `validation` node invokes a deterministic worker activity that evaluates declared validators and returns a `ValidationResult` aggregate (`.ai/data/serialization.md`). The workflow orchestrator advances only when `valid=true`.
- Forge UI state is a projection of Temporal run state plus validated artifacts and local display metadata.

## Run start orchestration

The extension host owns run-start coordination up to the Temporal start call. Worker code owns workflow and activity execution after Temporal accepts the run.

The start-orchestration boundary is the successful Temporal start result. Run-index persistence and detailed diagnostic presentation consume that result but are separate responsibilities.

1. Resolve the selected repository root and workflow definition.
2. Run pre-run validation for schema, graph, bindings, duplicate IDs, unsupported versions, and declared artifacts.
3. Collect and validate submitted values for the selected definition's `run_inputs[]`.
4. Resolve active Temporal mode and run the connection readiness gate.
5. Start or attach to the supervised worker and confirm it polls the configured task queue.
6. Call Temporal start with the serialized workflow run start payload.

If steps 1-5 fail, Forge reports a pre-run diagnostic and does not create a Temporal run. If step 6 fails before Temporal returns identity, Forge reports a failed start through the existing Temporal diagnostic path and does not create a local run-index entry. When step 6 succeeds, the returned Temporal identity is handed to the run-index persistence path and success feedback path.

### Downstream after accepted start

After Temporal accepts the run, Forge appends the run index entry from returned Temporal identifiers, notifies the left-panel Workflow Runs view to refresh, shows Start Run success feedback, and lets the user open run-mode graph visualization from the new run row. Those post-start persistence and presentation details are downstream of the start-orchestration boundary.

### Run start identity and repeat starts

Each accepted Start Run submission creates a distinct Temporal run unless the same catalog row and submitted input payload are already in a local start request in flight. While a start request is in flight, Forge disables the matching Start Run action and presents "Starting workflow run..." instead of issuing another Temporal start.

Temporal `workflowId` uses the selected workflow definition ID plus a generated unique suffix suitable for the active namespace. The returned `(namespace, workflowId, runId)` tuple is the authoritative identity recorded in `WorkflowRunIndexEntry`.

After Temporal start succeeds, Forge appends the run index entry before notifying views. If index write fails after Temporal accepted the run, Forge reports a post-start recovery diagnostic and includes the Temporal identity when available. It does not retry by issuing a second start automatically.

After the index entry is written, Forge refreshes the left-panel run list immediately. Run graph projection may wait for the normal recovery and refresh cadence unless the user opens the graph from the new row.

Before the first projection reaches `synced`, cancellation is available only when Forge has a recorded run index entry with Temporal identity. If recovery is pending or identity is unavailable, cancel actions are disabled with the standard recovery helper copy.

## Cursor SDK agent activities

- Each agent activity node maps to one Temporal activity function on the window-scoped worker.
- The worker invokes `@cursor/sdk` with local runtime and workspace `cwd` (`.ai/integration/api_contracts.md`).
- Activity heartbeats include `cursor_run_id` for observability while the SDK run is in flight.
- Temporal activity cancellation propagates to `run.cancel()` when supported. Cancelled activities are not re-run; late SDK output is discarded.

## Retry and timeout policy classes

Workflow JSON declares named policies under `retry_policies` and `timeout_policies`. Activity nodes reference them by `policy_id`. When a node omits `retry_policy`, the workflow-level default **`agent_standard`** applies. When a node omits `timeout_policy`, **`agent_default`** applies.

### Retry policy catalog (v1)

| `policy_id` | Purpose | Maximum attempts | Backoff | Non-retryable when |
|-------------|---------|------------------|---------|-------------------|
| `none` | Fail fast | 1 | — | Always |
| `agent_standard` | Default Cursor SDK activities | 3 | Exponential 1s–30s | `failure_class=cancelled`, validation rejection, `retryable=false` |
| `agent_startup` | Transient SDK startup errors | 5 | Exponential 1s–10s | `failure_class=execution`, `retryable=false`, cancelled |
| `integration_transient` | Reserved for GitHub/filesystem activities | 3 | Exponential 2s–60s | Not used by Cursor SDK activities in v1 |

Worker maps `retryable` from the SDK response envelope before Temporal schedules the next attempt.

### Timeout policy catalog (v1)

| `policy_id` | Start-to-close | Schedule-to-close |
|-------------|----------------|-------------------|
| `agent_short` | 5 minutes | 10 minutes |
| `agent_default` | 30 minutes | 45 minutes |
| `agent_long` | 2 hours | 2 hours 15 minutes |

### Cancellation and user actions (v1)

| Action | Behavior |
|--------|----------|
| Workflow cancel (user) | Temporal workflow terminate; in-flight SDK activities receive cancel propagation |
| Activity cancel (Temporal) | Worker attempts SDK `run.cancel()`; no re-run after cancel |
| User-approved activity retry | Out of scope v1 — automatic Temporal retries only (`.ai/business_logic/error_handling.md`) |
| Run restart from node | Out of scope v1 |

## Primary code pointers (optional)

- Add stable code directories or modules here when known.

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Run start orchestration

Resolved for v1. Start orchestration covers repository and workflow resolution, pre-run validation, run input validation, Temporal readiness, worker readiness, in-flight duplicate guarding, and the Temporal start call. Post-start run-index persistence and detailed diagnostics consume the accepted start result through the downstream paths described above.
