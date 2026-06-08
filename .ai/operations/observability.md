# Observability

Forge observability makes workflow health, validation state, and recovery actions visible without exposing secrets.

## Observable Signals

- Workflow definition discovery and validation status.
- Temporal connection health, namespace, task queue readiness, and worker availability.
- Workflow run state, current node, pending timers, pending human questions, retry state, and cancellation state.
- Cursor SDK activity status, run identifiers, failure summaries, and artifact references.
- Validator outcomes for schema, artifact, and domain checks.
- GitHub activity failures and rate or auth blockers.
- Recovery actions after extension restart, worker restart, or Temporal reconnect.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Health and diagnostics
- Define the concrete health-check names, diagnostic event fields, log redaction rules, and user-visible recovery states for workflow execution.
