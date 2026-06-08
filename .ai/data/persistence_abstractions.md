# Persistence Abstractions

Forge uses persistence according to ownership boundaries.

## Persistence Responsibilities

- Repository files own workflow definitions and related `.ai` contracts. Definitions are read from `.ai/workflows/*.json`.
- Temporal owns durable workflow histories, retry records, waits, timers, and recovery state.
- Managed local Temporal mode may use Temporal dev-server persistence with SQLite for single-user workflow execution.
- External or Cloud Temporal mode uses the configured Temporal endpoint, namespace, and credentials as the durable execution store.
- Forge local storage may cache run projections, selected workspace context, artifact indexes, and UI preferences. Cached projections are derived from Temporal and can be rebuilt.
- GitHub owns issues, milestones, project fields, and delivery records. Forge does not persist a duplicate backlog.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
