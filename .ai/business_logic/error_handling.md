# Error Handling

Forge handles workflow errors by preserving durable state, exposing the next safe action, and never advancing a workflow past unvalidated agent output.

## Handling Rules

- Definition and configuration errors fail before a run starts. Forge reports the invalid contract or missing binding and does not create a durable workflow run until the problem is resolved.
- Activity failures are recorded by Temporal and follow the workflow's retry policy. Forge can present retry, cancel, and inspect actions, but Temporal owns retry state and recovery.
- Validation failures stop progression at the validation gate. The rejected output remains available for inspection, but downstream steps cannot consume it as accepted workflow state.
- Human input pauses are expected workflow states. Forge asks the user for the required information and resumes the run only through the workflow's declared Temporal signal or update.
- Restart and reconnect handling rebuilds Forge's visible run projection from Temporal state before allowing user actions against an in-flight run.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Retry and recovery policy
- Define the retry classes, timeout classes, and failure categories exposed by workflow JSON.
- Define which failed states allow user-approved retry, which require editing the workflow definition, and which require restarting a run.
