# Consistency

Forge keeps workflow consistency by deriving local views from authoritative sources and validating every boundary crossing.

## Consistency Rules

- Workflow definitions are valid only when their JSON schema (`schema_version` + `.ai/schemas/workflow.schema.json`), graph invariants (entry node, transition targets, terminal reachability), referenced activities, validators, agents, skills, artifact declarations, and policy references resolve at pre-run.
- Pre-run validation runs before Temporal creates a durable run. Any diagnostic with `severity: error` blocks run start; warnings do not block.
- Pre-run checks exclude artifact existence on disk and workflow-specific exit criteria; those run at validation nodes during execution.
- Discovery scans workspace roots for `.ai/workflows/*.json` and indexes definitions by `workflow_id`. Duplicate IDs across files are errors.
- Filename stem must equal `workflow_id` for each definition file.
- Temporal run state is the source of truth for execution progress, retry history, waits, timers, and recovery.
- Forge run projections are eventually refreshed from Temporal and must tolerate extension restart or worker reconnection.
- Cursor SDK activity outputs are not accepted until deterministic validation succeeds.
- GitHub issue and project state is read or mutated through explicit workflow activities. Forge does not infer delivery truth from local workflow projection state.
- Human answers are recorded through the declared Temporal signal or update so the durable run history captures the continuation decision.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
