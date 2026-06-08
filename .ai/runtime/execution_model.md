# Execution Model

Forge workflow execution is Temporal-backed and data-defined.

## Execution Rules

- A workflow run starts from a validated `.ai/workflows/*.json` definition.
- Temporal workflow code owns deterministic orchestration, durable state, waits, timers, retries, and recovery.
- Activities perform non-deterministic work such as Cursor SDK agent runs, GitHub API calls, filesystem reads or writes, and validation checks.
- Agent activities are bounded by workflow definition inputs and Cursor SDK integration contracts.
- Human question points suspend the workflow until Forge sends the declared Temporal signal or update.
- Validation gates run before downstream steps consume agent output or produced artifacts.
- Forge UI state is a projection of Temporal run state plus validated artifacts and local display metadata.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Retry and timeout classes
- Define the retry policy class names, timeout class names, cancellation behavior, and default mappings supported in workflow JSON.
- Define how workflow runs expose user-approved retry, automatic retry, cancellation, and recovery actions.
