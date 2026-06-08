# Execution Model

Forge workflow execution is Temporal-backed and data-defined.

## Execution Rules

- A workflow run starts from a validated `.ai/workflows/*.json` definition.
- Temporal workflow code owns deterministic orchestration, durable state, waits, timers, retries, and recovery.
- Activities perform non-deterministic work such as Cursor SDK agent runs, GitHub API calls, filesystem reads or writes, and validation checks.
- Agent activities are bounded by workflow definition inputs and Cursor SDK integration contracts (`.ai/integration/api_contracts.md`).
- Human question points suspend the workflow until Forge sends the declared Temporal signal or update.
- Validation gates run before downstream steps consume agent output or produced artifacts.
- Forge UI state is a projection of Temporal run state plus validated artifacts and local display metadata.

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
