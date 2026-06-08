# Index

This document defines Forge workflow data ownership, serialization, projection, and validation boundaries.

## Scope

- Keep workflow definitions in repo-owned `.ai/workflows/<workflow_id>.json` (one file per workflow; filename stem equals `workflow_id`).
- Validate definitions structurally (`.ai/schemas/workflow.schema.json`) and against domain rules before runs start (see `.ai/data/serialization.md` and `.ai/business_logic/domain_model.md` pre-run scope).
- Expose a discovery index for runners and Studio: `workflow_id`, `name`, `version`, `description`, `schema_version`, and repo-relative `path` for each file under `.ai/workflows/`.
- Keep durable execution history in Temporal.
- Treat Forge run projections and artifact indexes as derived support data.
- Validate serialized agent outputs before downstream workflow steps consume them.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
- Keep entries concise and remove stale pointers.
