# Persistence Abstractions

Forge uses persistence according to ownership boundaries.

## Persistence Responsibilities

- Repository files own workflow definitions and related `.ai` contracts. Definitions are read from `.ai/workflows/*.json`.
- Temporal owns durable workflow histories, retry records, waits, timers, and recovery state.
- Managed local Temporal mode may use Temporal dev-server persistence with SQLite for single-user workflow execution.
- External or Cloud Temporal mode uses the configured Temporal endpoint, namespace, and credentials as the durable execution store.
- Forge local storage caches a **window-scoped run index** at `{extensionGlobalStorage}/temporal/{windowId}/run-index.json`, derived run projections, selected workspace context, artifact indexes, redacted start-input display summaries, and UI preferences. The run index records Temporal `(namespace, workflowId, runId)` pointers for runs started in that VS Code window; projections are derived from Temporal and can be rebuilt from the index after reconnect.
- **Completed run retention:** terminal index entries remain for **30 days** from `completedAt` or until the user dismisses them. Forge caps **100** completed entries per window; when over cap, the oldest completed entry by `completedAt` is purged on index load. Non-terminal entries are never auto-purged.
- GitHub owns issues, milestones, project fields, and delivery records. Forge does not persist a duplicate backlog.
- **Human answer drafts (#27):** in-progress operator answers for a pending `human_question` wait are cached in VS Code `workspaceState` per window, keyed by run index identity and `question_id`. Drafts are ephemeral support data; Temporal run state and submitted artifact files are authoritative after submit.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
