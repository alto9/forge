# Index

This document defines Forge workflow data ownership, serialization, projection, and validation boundaries.

## Scope

- Keep workflow definitions in repo-owned `.ai/workflows/<workflow_id>.json` (one file per workflow; filename stem equals `workflow_id`).
- Validate definitions structurally (`.ai/schemas/workflow.schema.json`) and against domain rules before runs start (see `.ai/data/serialization.md` and `.ai/business_logic/domain_model.md` pre-run scope).
- Expose a discovery index for runners and Studio. Each **catalog entry** includes: `workflow_id`, `name`, `version`, optional `description`, `schema_version`, repo-relative `path`, absolute `repositoryRoot`, and a pre-run **validation aggregate** (`valid`, ordered `diagnostics`, `errorCount`, `warningCount`) per `.ai/data/serialization.md`.
- Keep durable execution history in Temporal.
- Treat Forge run projections and artifact indexes as derived support data.
- Validate serialized agent outputs before downstream workflow steps consume them.

## Primary code pointers (optional)

- `src/workflows/discoverWorkflowDefinitions.ts` — builds the catalog entry array from workspace folder roots.
- Keep entries concise and remove stale pointers.
