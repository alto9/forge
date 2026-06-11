# Persistence Abstractions

Forge uses persistence according to ownership boundaries.

## Persistence Responsibilities

- Repository files own workflow definitions and related `.ai` contracts. Definitions are read from `.ai/workflows/*.json`.
- Temporal owns durable workflow histories, retry records, waits, timers, and recovery state.
- Managed local Temporal mode may use Temporal dev-server persistence with SQLite for single-user workflow execution.
- External or Cloud Temporal mode uses the configured Temporal endpoint, namespace, and credentials as the durable execution store.
- Forge local storage caches a **window-scoped run index** at `{extensionGlobalStorage}/temporal/{windowId}/run-index.json`, derived run projections, selected workspace context, artifact indexes, redacted start-input display summaries, and UI preferences. The run index records Temporal `(namespace, workflowId, runId)` pointers for runs started in that VS Code window; projections are derived from Temporal and can be rebuilt from the index after reconnect.
- Forge writes a run index entry only after Temporal accepts a start and returns durable identity. The append happens before Workflow Runs view notification, graph open enablement, cancellation enablement, or local success treatment that depends on recovery. A start that is blocked before Temporal accepts, or fails without a returned `workflowId` and `runId`, does not create an index entry.
- The run index entry persists the accepted Temporal identity plus the minimum local context needed to recover and act on the run: `namespace`, `workflowId`, `runId`, `taskQueue`, definition `workflow_id`, `repositoryRoot`, active Temporal `mode`, `startedAt`, `recoveryState`, and `terminal`. Optional redacted `startInputSummary` is display support only; recovery, graph, list, cancel, and diagnostics consumers must use Temporal identity and not depend on full submitted inputs.
- If index persistence fails after Temporal accepted the run, Forge treats the Temporal run as created and the local index as missing. Forge must not issue a second Temporal start automatically. It reports a post-start recovery diagnostic with redacted Temporal identity when available and explains that list, graph, cancel, and run recovery actions are unavailable until the run is indexed or recovered.
- **Completed run retention:** terminal index entries remain for **30 days** from `completedAt` or until the user dismisses them. Forge caps **100** completed entries per window; when over cap, the oldest completed entry by `completedAt` is purged on index load. Non-terminal entries are never auto-purged.
- GitHub owns issues, milestones, project fields, and delivery records. Forge does not persist a duplicate backlog.
- **Human answer drafts (#27):** in-progress operator answers for a pending `human_question` wait are cached in VS Code `workspaceState` per window, keyed by run index identity and `question_id`. Drafts are ephemeral support data; Temporal run state and submitted artifact files are authoritative after submit.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
