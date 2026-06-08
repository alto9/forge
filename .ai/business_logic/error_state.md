# Error State

Workflow runs expose failures as workflow state, not as hidden agent transcript details. Temporal remains authoritative for run lifecycle and retry history, while Forge presents derived state that users can inspect and act on.

## Workflow Error States

- Definition invalid: a workflow JSON file fails schema validation, graph invariants, or references unknown activities, validators, agents, skills, artifacts, or transitions. Diagnostics use the shape in `.ai/data/serialization.md` (`code`, `severity`, `path`, `message`, `validator_id`).
- Configuration invalid: Forge cannot resolve a required Temporal mode, endpoint, namespace, worker setting, repository path, or credential binding. In managed-local mode, `start_failed` dev server startup (port conflict, missing npm-bundled asset, persistence permission error) is configuration invalid until the user fixes the environment or switches mode explicitly; Forge does not auto-fallback to external mode. In external mode, missing required settings, missing API key when `auth.mode` is `apiKey`, TLS/auth rejection, or unreachable address is configuration invalid until the user fixes settings or credentials; Forge does not auto-fallback to managed-local mode.
- Activity failed: a bounded Cursor SDK activity or other integration activity failed before producing a valid output envelope.
- Validation failed: a runtime validation node rejected an activity envelope, artifact, or domain exit criterion. Temporal run remains durable at the validation node; outgoing transitions are not taken. The rejected envelope and artifact paths remain available for inspection in run projection. Automatic Temporal retry does not apply; user-approved validation retry is out of scope v1.
- Human input required: the workflow is intentionally paused until a user answers one or more questions.
- External dependency unavailable: Temporal, GitHub, the Cursor SDK boundary, or required local process supervision is unavailable.
- Recovery pending: Forge restarted or reconnected and is rebuilding its local projection from Temporal run state.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
