# Consistency

Forge keeps workflow consistency by deriving local views from authoritative sources and validating every boundary crossing.

## Consistency Rules

- Workflow definitions are valid only when their JSON schema, referenced activities, validators, agents, skills, artifact declarations, and graph transitions resolve.
- Temporal run state is the source of truth for execution progress, retry history, waits, timers, and recovery.
- Forge run projections are eventually refreshed from Temporal and must tolerate extension restart or worker reconnection.
- Cursor SDK activity outputs are not accepted until deterministic validation succeeds.
- GitHub issue and project state is read or mutated through explicit workflow activities. Forge does not infer delivery truth from local workflow projection state.
- Human answers are recorded through the declared Temporal signal or update so the durable run history captures the continuation decision.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
