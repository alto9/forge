# Error State

Workflow runs expose failures as workflow state, not as hidden agent transcript details. Temporal remains authoritative for run lifecycle and retry history, while Forge presents derived state that users can inspect and act on.

## Workflow Error States

- Definition invalid: a workflow JSON file fails schema validation, graph invariants, or references unknown activities, validators, agents, skills, artifacts, or transitions. Diagnostics use the shape in `.ai/data/serialization.md` (`code`, `severity`, `path`, `message`, `validator_id`).
- Configuration invalid: Forge cannot resolve a required Temporal mode, endpoint, namespace, worker setting, repository path, or credential binding.
- Activity failed: a bounded Cursor SDK activity or other integration activity failed before producing a valid output envelope.
- Validation failed: an activity produced output, but schema, artifact, or domain validation rejected it.
- Human input required: the workflow is intentionally paused until a user answers one or more questions.
- External dependency unavailable: Temporal, GitHub, the Cursor SDK boundary, or required local process supervision is unavailable.
- Recovery pending: Forge restarted or reconnected and is rebuilding its local projection from Temporal run state.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
