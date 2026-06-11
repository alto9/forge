# Data Model

Forge workflow data separates repo-owned definitions, Temporal-owned durable execution state, and Forge-owned local projections.

## Entities

- WorkflowDefinition: a JSON document under `.ai/workflows/*.json` that declares graph structure, run inputs, activity bindings, validators, artifacts, retry policy classes, and human input points.
- WorkflowRunInputDefinition: a top-level `run_inputs[]` declaration on a workflow definition. Each entry has an `input_id`, `type`, `label`, optional `description`, optional `required`, and optional `validation_hint`. v1 supports `type: "string"` only; future input types require additive workflow schema, renderer, and validation changes.
- WorkflowRunProjection: Forge's local view of a Temporal workflow execution. It includes run identity, selected definition, current visible state, active node, per-node graph overlay fields (`activeNodeId`, `completedNodeIds`, `failedNodeId`, `skippedNodeIds`, `waitingNodeId`, `validatingNodeId`, `retrying`, `cancelled`), validation summaries, artifact index, pending human questions, and `recoveryState` (see `.ai/operations/observability.md` **Run recovery states**). Graph webview serialization: `.ai/data/serialization.md` **Workflow graph model**.
- WorkflowRunStartInput: the submitted map of declared `run_inputs[].input_id` to string values used to create one Temporal workflow run. Optional inputs may be omitted. Required input validation happens before Temporal start; accepted values are passed to Temporal start and then to workflow activities according to the workflow definition. Secrets must not be submitted as run inputs.
- WorkflowRunIndexEntry: a window-scoped pointer from Forge local storage to a Temporal execution. Fields: `namespace`, Temporal `workflowId`, `runId`, `taskQueue`, definition `workflow_id`, `repositoryRoot`, `mode` at start (`managedLocal` | `external`), optional redacted `startInputSummary` for display, `startedAt`, `completedAt` (when terminal), `lastSyncedAt`, `recoveryState`, and `terminal` (boolean). `startInputSummary` is display-only and must be derived from accepted inputs after redaction; it is not a source of truth for reruns or recovery. Index key: `{namespace}:{workflowId}:{runId}` within `{extensionGlobalStorage}/temporal/{windowId}/run-index.json`.
- ActivityInvocation: a bounded unit of non-deterministic work. Agent invocations include Cursor SDK run identifiers and typed output envelopes.
- ValidationResult: deterministic acceptance or rejection for an activity output, artifact, or domain exit criterion. Runtime validation nodes emit aggregates per `.ai/data/serialization.md` **Runtime validation result** and `.ai/schemas/validation-result.schema.json`. Fields include `valid`, `node_id`, `workflow_run_id`, optional `source_activity_node_id`, `validated_at`, ordered `diagnostics`, and `validator_outcomes[]` (per-validator `passed`, `blocking`, `validator_id`, `type`, optional `target`).
- HumanQuestion: a workflow-defined pause point identified by `question_id` on a `human_question` node. Forge resolves prompt text from declared `artifact_ids` (when present), else node `description` or `name`. The operator submits answers through Temporal workflow update `forge.human_answer.submit` (or node override `resume_update`). See `.ai/data/serialization.md` **Pending human question** and **Human answer submission**.
- PendingHumanQuestion: the active question Forge presents for a non-terminal run when `waitingNodeId` references a `human_question` node and `recoveryState === synced`. Carries prompts, `input_mode`, artifact write targets, and batch policy for the question panel (#27).
- ArtifactRecord: a pointer to a generated or inspected artifact, its producing activity, validation status, and storage location.
- RunInspectorDetail: serialized detail-panel payload for a selected graph node in run or definition mode. Built from `WorkflowDefinition`, optional `WorkflowRunProjection`, and on-disk artifact content with redaction and preview limits. See `.ai/data/serialization.md` **Run inspector detail**.

Temporal owns the durable event history for workflow execution. Forge projections and artifact indexes are support data for display, restart recovery, and user actions; they are not a replacement execution ledger.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
