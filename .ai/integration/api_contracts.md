# Api Contracts

Forge workflow APIs are boundary contracts between the extension, Temporal workers, Cursor SDK agent activities, validators, and GitHub.

## Cursor SDK Boundary

Cursor SDK is the boundary for bounded agent activities. Workflow activities pass a constrained request to the Cursor SDK, receive an activity output envelope, and hand that envelope to deterministic validators before the workflow proceeds.

Forge does not treat raw model output as accepted workflow state. The Cursor SDK response becomes usable only after schema, artifact, and domain validation accept the envelope.

## Temporal Boundary

The Forge extension starts or connects to workflow runs through a Temporal client. Workers execute workflow and activity code outside the VS Code extension host. Human answers resume waiting workflows through declared Temporal signals or updates.

## GitHub Boundary

GitHub APIs remain the boundary for issue, milestone, project, pull request, and planning state. Workflow definitions can reference GitHub activities, but GitHub remains the source of truth for delivery records.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Cursor SDK activity envelope
- Define the exact request and response envelope properties for bounded Cursor SDK activities.
- Define how Cursor SDK run IDs, cancellation state, logs, artifacts, and validation diagnostics are exposed to Temporal and Forge UI.

### GitHub activity contracts
- Define the concrete GitHub REST or GraphQL operations used by the `/refine-issue` workflow while keeping them reusable for future workflow definitions.
