# Data Model

Forge workflow data separates repo-owned definitions, Temporal-owned durable execution state, and Forge-owned local projections.

## Entities

- WorkflowDefinition: a JSON document under `.ai/workflows/*.json` that declares graph structure, activity bindings, validators, artifacts, retry policy classes, and human input points.
- WorkflowRunProjection: Forge's local view of a Temporal workflow execution. It includes run identity, selected definition, current visible state, active node, validation summaries, artifact index, and pending human questions.
- ActivityInvocation: a bounded unit of non-deterministic work. Agent invocations include Cursor SDK run identifiers and typed output envelopes.
- ValidationResult: deterministic acceptance or rejection for an activity output, artifact, or domain exit criterion.
- HumanQuestion: a workflow-defined prompt for user input, including the expected answer shape and the Temporal signal or update used to resume.
- ArtifactRecord: a pointer to a generated or inspected artifact, its producing activity, validation status, and storage location.

Temporal owns the durable event history for workflow execution. Forge projections and artifact indexes are support data for display, restart recovery, and user actions; they are not a replacement execution ledger.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
