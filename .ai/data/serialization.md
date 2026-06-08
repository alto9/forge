# Serialization

Workflow serialization is explicit and validator-driven.

## Workflow Definition Serialization

Workflow definitions are JSON files under `.ai/workflows/*.json`. They use a schema mapped in `.ai/schemas/workflow.schema.json` and reference stable identifiers for activities, validators, agents, skills, artifacts, retry policy classes, and human input points.

Workflow JSON is declarative. It must not rely on arbitrary shell command strings or large free-form prompts as the authority for execution.

## Activity Output Serialization

Cursor SDK activity outputs are wrapped in typed envelopes before validation. The envelope records the activity identifier, Cursor run identity, declared output type, artifact references, structured payload, and status needed by deterministic validators.

Downstream workflow steps consume only accepted envelopes and artifacts. Rejected envelopes remain inspectable but do not become accepted workflow state.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Workflow JSON fields
- Specify the exact JSON field names and required properties for definitions, graph nodes, edges, activities, validators, human question points, artifact declarations, retry policy classes, and metadata.
- Specify versioning and migration behavior for workflow definition files.

### Cursor SDK output envelopes
- Specify the exact envelope properties for activity ID, Cursor run ID, agent or skill source, status, structured payload, artifacts, validation inputs, and diagnostic messages.
