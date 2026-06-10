# Error Handling

Forge handles workflow errors by preserving durable state, exposing the next safe action, and never advancing a workflow past unvalidated agent output.

## Handling Rules

- Definition, run input, and configuration errors fail before a run starts. Forge reports diagnostics with `severity: error` and does not create a durable workflow run until those errors are resolved. Warnings are reported but do not block run start.
- Activity failures are recorded by Temporal and follow the workflow's retry policy. Forge can present retry, cancel, and inspect actions, but Temporal owns retry state and recovery. The **run inspector** detail panel (#28) exposes inspect affordances and contextual recovery actions per `.ai/interface/presentation.md` **Recovery action catalog (v1)**.
- Validation failures stop progression at the validation gate. The rejected output remains available for inspection, but downstream steps cannot consume it as accepted workflow state. The workflow orchestrator records a runtime `ValidationResult` aggregate (`.ai/data/serialization.md`) with `valid=false` and per-validator `validator_outcomes`. Validation gate execution is deterministic and does not consume Temporal activity retry budget.
- Human input pauses are expected workflow states. Forge asks the user for the required information and resumes the run only through the workflow's declared Temporal signal or update.
- Restart and reconnect handling rebuilds Forge's visible run projection from Temporal state before allowing user actions against an in-flight run.
- **Basic recovery actions (v1):** after automatic or manual refresh, the user may **cancel** a non-terminal run (Temporal workflow terminate), **submit human-input answers** for runs in `human input required` state once projection is `synced`, and **dismiss** index entries in `orphaned` state. Activity retry, run restart from a node, and manual retry-policy controls are out of scope.

## Cursor SDK activity failures

| `failure_class` | Meaning | Automatic retry | User action (v1) |
|-----------------|---------|-----------------|------------------|
| `startup` | `CursorAgentError` before SDK run executed | Per `retry_policy` when `retryable=true` | Cancel run; inspect Output channel metadata |
| `execution` | SDK run started then failed (`status=error`) | Per `retry_policy` when `retryable=true` | Cancel run; inspect diagnostics |
| `cancelled` | User or Temporal cancelled activity | Never | None — activity not re-run |

After cancellation commits in Temporal, Forge does not re-run the activity even if the SDK run completes late. Late output is discarded.

## Retry eligibility by state

| Failed state | Automatic Temporal retry | User-approved retry | Requires definition edit | Requires new run |
|--------------|-------------------------|---------------------|-------------------------|------------------|
| Activity `startup` / `execution` with retryable error | Yes, per node `retry_policy` | Out of scope v1 | No | No |
| Activity `cancelled` | No | No | No | No |
| Validation failed | No — blocked at gate | Out of scope v1 | Possibly (validator/target) | Possibly |
| Run input invalid (pre-run) | N/A — run not created | N/A | No, unless declaration is wrong | N/A after fix |
| Configuration invalid (pre-run) | N/A — run not created | N/A | Yes | N/A after fix |

Policy class names and timeout mappings: `.ai/runtime/execution_model.md`.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
