# Error Handling

Forge handles workflow errors by preserving durable state, exposing the next safe action, and never advancing a workflow past unvalidated agent output.

## Handling Rules

- Definition and configuration errors fail before a run starts. Forge reports diagnostics with `severity: error` and does not create a durable workflow run until those errors are resolved. Warnings are reported but do not block run start.
- Activity failures are recorded by Temporal and follow the workflow's retry policy. Forge can present retry, cancel, and inspect actions, but Temporal owns retry state and recovery.
- Validation failures stop progression at the validation gate. The rejected output remains available for inspection, but downstream steps cannot consume it as accepted workflow state.
- Human input pauses are expected workflow states. Forge asks the user for the required information and resumes the run only through the workflow's declared Temporal signal or update.
- Restart and reconnect handling rebuilds Forge's visible run projection from Temporal state before allowing user actions against an in-flight run.
- **Basic recovery actions (v1):** after automatic or manual refresh, the user may **cancel** a non-terminal run (Temporal workflow terminate), **submit human-input answers** for runs in `human input required` state once projection is `synced`, and **dismiss** index entries in `orphaned` state. Activity retry, run restart from a node, and manual retry-policy controls are out of scope.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Retry and recovery policy
- Define the retry classes, timeout classes, and failure categories exposed by workflow JSON.
- Define which failed states allow user-approved retry, which require editing the workflow definition, and which require restarting a run.
