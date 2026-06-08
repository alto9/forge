# Domain Model

Forge models workflow automation as a repo-owned control plane for durable agent work. Workflow definitions live in `.ai/workflows/*.json` and describe the graph, activities, validators, artifacts, and human interaction points for a workflow. `/refine-issue` is the proving workflow, but Forge treats it as one configured workflow among many rather than a special case embedded in UI or runtime code.

## Core Concepts

- A workflow definition is the declarative contract for a repeatable Forge workflow. It names stable steps, transitions, required artifacts, validators, human questions, and integration bindings.
- A workflow run is one execution of a workflow definition for a selected workspace, repository, and delivery target. Temporal owns durable execution state, waits, retries, and recovery for each run.
- An activity is bounded non-deterministic work performed outside the deterministic Temporal workflow function. Agent activities call the Cursor SDK and return typed outputs for validation.
- A validator is deterministic logic that accepts or rejects agent outputs before the workflow advances. Validation covers schema shape, declared artifacts, and domain-specific exit criteria.
- A human question is a workflow pause point. Forge presents the question, captures the answer, and resumes the Temporal run through a signal or update.
- GitHub remains the system of record for issues, milestones, project state, and delivery records. Forge may read or mutate GitHub through explicit workflow activities, but it does not create a parallel backlog store.

## Workflow Ownership

Forge owns discovery, validation, visualization, and execution coordination for workflow definitions. The repository that contains `.ai/workflows/*.json` owns the workflow policy text and artifacts referenced by those definitions.

Workflow definitions reference stable activity identifiers, agent paths, skill paths, artifact declarations, and validators. They do not embed arbitrary shell commands or unbounded prompt bodies as execution authority.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Workflow definition model
- Specify the canonical workflow definition fields, including workflow identity, versioning, graph nodes, transitions, activities, validators, human question points, artifact declarations, and supported metadata.
- Define the stable validator ID catalog for schema validation, artifact validation, and domain exit-criteria validation.
- Define how `/refine-issue` maps into the generic workflow model without reserving bespoke runtime concepts for that workflow.
