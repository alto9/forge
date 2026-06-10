# Serialization

Workflow serialization is explicit and validator-driven.

## Workflow Definition Serialization

Workflow definitions are JSON files under `.ai/workflows/*.json`. They use a schema mapped in `.ai/schemas/workflow.schema.json` and reference stable identifiers for activities, validators, agents, skills, artifacts, retry policy classes, and human input points.

Workflow JSON is declarative. It must not rely on arbitrary shell command strings or large free-form prompts as the authority for execution.

## Activity Output Serialization

Cursor SDK activity outputs are wrapped in typed envelopes before validation. The envelope records the activity identifier, Cursor run identity, declared output type, artifact references, structured payload, and status needed by deterministic validators.

Downstream workflow steps consume only accepted envelopes and artifacts. Rejected envelopes remain inspectable but do not become accepted workflow state.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.

## Workflow definition fields

Workflow definitions are JSON objects validated by `.ai/schemas/workflow.schema.json` plus domain rules in `.ai/data/consistency.md` and `.ai/business_logic/domain_model.md`.

### Top-level definition

| Field | Required | Description |
|-------|----------|-------------|
| `schema_version` | yes | Contract version for the workflow JSON shape. Current value: `1.0.0`. Unsupported values are reported before runs start. |
| `workflow_id` | yes | Stable kebab-case identifier unique within the repository. Must equal the filename stem: `.ai/workflows/<workflow_id>.json`. |
| `name` | yes | Human-readable workflow title for Studio and CLI lists. |
| `version` | yes | Semver (`MAJOR.MINOR.PATCH`) for the workflow definition content. |
| `description` | no | Short summary of workflow purpose. |
| `run_inputs` | no | Workflow-definition-level input declarations Forge collects before Temporal run creation. See **Run input declarations**. |
| `entry_node_id` | yes | `node_id` of the first node executed after a run starts. |
| `nodes` | yes | Non-empty array of graph nodes (see below). |
| `artifacts` | no | Declared artifact outputs the workflow may produce or inspect. |
| `retry_policies` | no | Named retry policy classes referenced by nodes. |
| `timeout_policies` | no | Named timeout policy classes referenced by nodes. |
| `metadata` | no | Repo-local tags (`owner`, `milestone`, `tags`, `deprecated`, etc.) with string, number, boolean, or null values. |

### Run input declarations

`run_inputs[]` is an optional top-level array. When omitted or empty, Start Run uses the no-parameters path after definition validation and readiness checks pass. When present, Forge collects and validates submitted values before it calls Temporal start.

| Field | Required | Description |
|-------|----------|-------------|
| `input_id` | yes | Stable key used in the start payload and activity inputs. Must be unique within the workflow definition. |
| `type` | yes | v1 supports `string`. Future types require additive schema changes and matching UI rendering. |
| `label` | yes | Human-readable label shown by Start Run input collection. |
| `description` | no | Helper text for the input prompt. |
| `required` | no | When `true`, empty submitted values block run creation. Default is `false`. |
| `validation_hint` | no | Workflow-specific hint used for display or custom validation diagnostics. It is not executable code. |

Submitted run input values serialize as a JSON object whose keys match declared `input_id` values and whose values are strings. Forge rejects undeclared keys and missing required values before creating a durable Temporal run.

### Graph nodes

Each node requires `node_id`, `type`, and `name`. Optional `description`, `transitions`, `retry_policy`, `timeout_policy`, and `artifact_ids` apply per type.

| `type` | Additional required fields | Purpose |
|--------|---------------------------|---------|
| `activity` | `activity_id` and (`agent_path` or `skill_path`) | Bounded non-deterministic work (Cursor SDK agent or skill). |
| `validation` | `validators` (min 1) | Deterministic gate before progression. |
| `human_question` | `question_id` | Pause for user input resumed through Temporal workflow update (default `forge.human_answer.submit`). Optional `input_mode` (`single_text`, `markdown_batch`, `form_fields` reserved) and `resume_update` override. Optional `artifact_ids` supply prompt sources and answer write targets. |
| `wait` | — | Durable wait/timer step. |
| `decision` | `transitions` (min 1) | Branching with optional `condition` on each transition. |
| `terminal` | — | End state; may omit outgoing transitions. |

Transitions are node-local: `transitions[]` with required `to_node_id` and optional `condition` string. There is no top-level `edges` array.

### Validators (on validation nodes)

| Field | Required | Description |
|-------|----------|-------------|
| `validator_id` | yes | Stable ID from the catalog in `.ai/business_logic/domain_model.md`. |
| `type` | yes | `schema`, `artifact`, or `domain`. |
| `target` | no | Path, schema ref, artifact ID, or domain criterion the validator inspects. |

### Artifacts (workflow-level declarations)

| Field | Required | Description |
|-------|----------|-------------|
| `artifact_id` | yes | Stable ID referenced by nodes. |
| `path` | yes | Repo-relative path or glob for the artifact. |
| `description` | no | Human-readable artifact purpose. |

### Policy references

`retry_policies` and `timeout_policies` entries require `policy_id` and optional `description`. Nodes reference policies by `policy_id` string. Concrete retry/timeout semantics and v1 catalog: `.ai/runtime/execution_model.md`. Default when a node omits `retry_policy`: `agent_standard`; default when a node omits `timeout_policy`: `agent_default`.

## Versioning and migration

- `version` uses semver. Breaking changes to required fields, node semantics, or graph invariants increment **MAJOR**. Additive nodes, artifacts, validators, or optional metadata increment **MINOR**. Documentation or metadata-only edits increment **PATCH**.
- `schema_version` tracks the JSON contract shape. When Forge ships a new major workflow schema, runners report `forge.workflow.unsupported_version` for definitions whose `schema_version` major is not supported.
- Forge does not auto-migrate workflow files. Authors edit `.ai/workflows/*.json` explicitly when contract changes require it.

## Invalid definition reporting

Diagnostics returned to discovery, pre-run gates, commands, and Studio use a stable object shape.

### Diagnostic

| Field | Description |
|-------|-------------|
| `code` | Machine-readable code (e.g. `schema.required`, `graph.unreachable_node`, `binding.missing_agent_path`). |
| `severity` | `error` or `warning`. |
| `path` | JSON Pointer into the definition file (or repo-relative path for cross-file rules such as duplicate IDs). |
| `message` | Human-readable explanation. |
| `validator_id` | Validator or rule ID that produced the diagnostic (from `.ai/business_logic/domain_model.md`). |

### Severity rules

- `severity: error` — run start is blocked until the definition is fixed.
- `severity: warning` — visible in discovery and validation results; does **not** block run start.

### Validation result (aggregate)

Pre-run validation returns an aggregate suitable for discovery (#25) and run-start gates:

| Field | Description |
|-------|-------------|
| `valid` | `true` when no diagnostic has `severity: error`. |
| `diagnostics` | Ordered array of diagnostic objects. |
| `workflow_id` | Present when parsed from the definition. |
| `path` | Repo-relative path to the definition file. |

### Workflow catalog entry (#25)

Discovery exposes one catalog entry per scanned definition file:

| Field | Required | Description |
|-------|----------|-------------|
| `workflow_id` | yes | Stable ID from the definition (or filename stem when parse fails). |
| `name` | yes | Human-readable title; falls back to `workflow_id` when missing. |
| `version` | no | Semver from definition when parse succeeds. |
| `description` | no | Short summary from definition. |
| `schema_version` | no | Contract version from definition when parse succeeds. |
| `path` | yes | Repo-relative path to `.ai/workflows/<workflow_id>.json`. |
| `repositoryRoot` | yes | Absolute path to the selected workspace folder root. |
| `validation` | yes | Pre-run aggregate: `valid`, `diagnostics`, `errorCount`, `warningCount`. |
| `run_inputs` | no | Declared run input descriptors needed to render Start Run input collection. |

Studio sorting, badges, and copy: `.ai/interface/presentation.md` **Workflow discovery catalog**.

## Workflow run start payload

The extension host sends this payload to the Temporal start boundary after workflow-definition validation, run-input validation, Temporal readiness, and worker readiness all pass.

| Field | Required | Description |
|-------|----------|-------------|
| `workflow_id` | yes | Selected workflow definition ID. |
| `definition_version` | yes | Selected workflow definition `version`. |
| `repositoryRoot` | yes | Absolute workspace folder root selected for this run. |
| `run_inputs` | yes | Object of submitted run input values keyed by declared `input_id`; empty object when no inputs are declared or submitted. |
| `started_by` | no | Local actor label when available; never a credential or token. |
| `started_at` | yes | ISO-8601 UTC timestamp from the extension host. |

For `/refine-issue`, `run_inputs.issue_ref` carries either a GitHub issue URL or a GitHub Projects v2 project identifier plus issue number encoded by the implementation contract resolved in `/refine-issue`.

## Workflow graph model (#26)

Serialized payload from the extension host to the graph webview. Built by `buildWorkflowGraphModel(definition, projection?)`. Visual states and copy: `.ai/interface/presentation.md` **Workflow Visualization (#26)**.

### Workflow graph model (root)

| Field | Required | Description |
|-------|----------|-------------|
| `workflow_id` | yes | Stable workflow identifier |
| `workflow_name` | yes | Human-readable title from definition |
| `mode` | yes | `definition` or `run` |
| `nodes` | yes | Non-empty array of graph nodes (see below) |
| `edges` | yes | Array of directed edges (see below) |
| `run_summary` | when `mode=run` | Short textual status for header and screen readers |
| `step_list` | yes | Ordered `{ node_id, name, visual_state, status_label }` for sidebar accessibility |
| `recoveryState` | when `mode=run` | From `WorkflowRunProjection` (`.ai/operations/observability.md`) |
| `temporal_ids` | when `mode=run` | `{ workflowId, runId, namespace }` for header copy |

### Graph node

| Field | Required | Description |
|-------|----------|-------------|
| `node_id` | yes | Workflow graph node ID |
| `type` | yes | Definition node type (`activity`, `validation`, etc.) |
| `name` | yes | Human-readable node name |
| `visual_state` | yes | `pending`, `active`, `completed`, `failed`, `cancelled`, `waiting`, `validating`, `retrying`, `skipped` |
| `status_label` | yes | Accessible label matching presentation copy table |
| `position` | yes | `{ x, y }` layout coordinates |
| `retry_attempt` | when `visual_state=retrying` | Current attempt (1-based) |
| `retry_max` | when `visual_state=retrying` | Maximum attempts from retry policy |
| `detail` | no | Secondary line (e.g. question_id, timer label, validation summary) |

### Graph edge

| Field | Required | Description |
|-------|----------|-------------|
| `edge_id` | yes | Stable ID: `{from_node_id}->{to_node_id}` |
| `from_node_id` | yes | Source node |
| `to_node_id` | yes | Target node |
| `visual_state` | yes | `idle`, `traversed`, `active`, `untaken` |
| `condition` | no | Transition condition label from definition |

### Run projection fields used for graph overlay

`WorkflowRunProjection` supplies graph overlay inputs (full entity: `.ai/data/data_model.md`):

| Field | Description |
|-------|-------------|
| `activeNodeId` | Current orchestration node → `active` visual state |
| `completedNodeIds` | History of finished nodes → `completed` |
| `failedNodeId` | Terminal failure node, if any → `failed` |
| `skippedNodeIds` | Branch nodes not taken → `skipped` |
| `waitingNodeId` | Paused `human_question` or active `wait` node → `waiting` |
| `validatingNodeId` | In-flight validation node → `validating` |
| `retrying` | `{ node_id, attempt, max }` when an activity automatic retry is in progress |
| `cancelled` | Boolean; when true, active node → `cancelled` |
| `recoveryState` | Gates live polling and banner copy |

The extension derives edge `traversed`, `active`, and `untaken` states from completed history and the active node.

### Runtime validation result (aggregate)

Each `validation` node produces one aggregate after all declared validators run. Machine validation: `.ai/schemas/validation-result.schema.json`.

| Field | Required | Description |
|-------|----------|-------------|
| `valid` | yes | `true` when every blocking validator passed. |
| `node_id` | yes | Validation node that executed. |
| `workflow_run_id` | yes | Temporal run identifier. |
| `source_activity_node_id` | no | Upstream activity node whose envelope or artifacts are validated. |
| `validated_at` | yes | ISO-8601 UTC timestamp when the gate completed. |
| `diagnostics` | yes | Ordered diagnostic objects (failures and advisory items). |
| `validator_outcomes` | yes | Per-validator pass/fail summary (see below). |

#### `validator_outcomes[]`

| Field | Required | Description |
|-------|----------|-------------|
| `validator_id` | yes | Catalog or `local.*` ID from the validation node. |
| `type` | yes | `schema`, `artifact`, or `domain`. |
| `target` | no | Path, schema ref, artifact ID, or domain criterion inspected. |
| `passed` | yes | `true` when this validator succeeded. |
| `blocking` | yes | `true` for v1 runtime validators; failure prevents progression. |
| `diagnostics` | no | Validator-specific diagnostic objects when `passed` is false. |

#### Blocking vs advisory at runtime (v1)

- Every validator on a runtime `validation` node is **blocking** in v1. A failed validator sets `valid=false` and the workflow orchestrator does not follow outgoing transitions.
- **Advisory** outcomes appear only in pre-run aggregates (`severity: warning`) or as non-blocking `diagnostics` inside an otherwise **accepted** activity envelope (`severity: warning` or `info` on envelope fields). Advisory envelope diagnostics do not bypass a failed validation node.
- Validation failures do **not** schedule Temporal activity retries. Retry eligibility: `.ai/business_logic/error_handling.md`.

#### Artifact checks at runtime

| Validator | Checks |
|-----------|--------|
| `forge.artifact.exists` | Resolves workflow artifact `path` (literal or glob) against the run workspace; at least one match must exist. |
| `forge.artifact.integrity` | For each matching `artifact_refs[]` entry with `path` and `sha256`, computes SHA-256 of on-disk content and compares to declared hash (lowercase hex). |
| `forge.artifact.schema` | Reads artifact file content and validates against JSON Schema at `target` or envelope `validation_inputs.schema_ref`. |

## Cursor SDK envelopes

Request and response **boundary** fields (v1): `.ai/integration/api_contracts.md`.

Machine validation: `.ai/schemas/activity-envelope.schema.json`.

### Versioning

| Field | Rule |
|-------|------|
| `envelope_version` | Semver (`MAJOR.MINOR.PATCH`). v1 value: `"1.0.0"`. |
| MAJOR mismatch | Validation fails with `forge.envelope.unsupported_version`; envelope is inspectable but not accepted workflow state. |
| MINOR/PATCH | Additive fields only; consumers ignore unknown optional fields. |

Forge does not auto-migrate stored envelope JSON. Workers emit the supported version; validators reject unsupported majors.

### Request envelope extensions (v1)

In addition to boundary fields in `.ai/integration/api_contracts.md`:

| Field | Required | Description |
|-------|----------|-------------|
| `output_type` | yes | Declared structured output shape: `json`, `markdown`, or `text`. Validators use this with `structured_payload` in the response. |

### Response envelope (full v1)

Extends boundary fields in `.ai/integration/api_contracts.md`.

| Field | Required | Description |
|-------|----------|-------------|
| `envelope_version` | yes | `"1.0.0"` |
| `activity_id` | yes | Echo from request |
| `node_id` | yes | Workflow graph node |
| `workflow_run_id` | yes | Temporal run identifier |
| `cursor_agent_id` | yes | SDK agent ID |
| `cursor_run_id` | yes | SDK run ID after `send()` |
| `agent_path` | one of | Echo from request when present |
| `skill_path` | one of | Echo from request when present |
| `output_type` | yes | Echo from request (`json`, `markdown`, `text`) |
| `status` | yes | `finished`, `error`, or `cancelled` |
| `failure_class` | when not success | `startup`, `execution`, or `cancelled` |
| `retryable` | yes | From SDK `isRetryable` / policy mapping |
| `structured_payload` | when success | Inline structured output (see size limits) |
| `artifact_refs` | no | Pointers to repo artifacts (see below) |
| `follow_up_questions` | no | Provisional user questions (see below) |
| `diagnostics` | no | Ordered diagnostic objects |
| `validation_inputs` | no | Hints for downstream validators (#24): schema refs, artifact IDs, domain criterion IDs |

#### `structured_payload`

| `output_type` | Shape |
|---------------|-------|
| `json` | JSON object or array (not a string wrapper) |
| `markdown` | String containing markdown |
| `text` | Plain string |

When `status` is not `finished`, `structured_payload` is omitted. Raw SDK transcripts are never stored in the envelope.

#### `artifact_refs`

Each entry references one produced or updated artifact. Content is not embedded.

| Field | Required | Description |
|-------|----------|-------------|
| `artifact_id` | yes | Matches a workflow-level `artifacts[].artifact_id` when declared |
| `path` | yes | Repo-relative path from workspace root |
| `size_bytes` | yes | File size in bytes at write time |
| `sha256` | yes | Lowercase hex SHA-256 of file content |
| `media_type` | no | MIME hint (e.g. `text/markdown`, `application/json`) |

Activities must emit `artifact_refs` for any output file whose size exceeds the inline payload cap or when the workflow node declares `artifact_ids`.

#### `follow_up_questions`

Provisional tier-User suggestions from the agent activity. Durable user pauses remain `human_question` workflow nodes and Temporal signals.

| Field | Required | Description |
|-------|----------|-------------|
| `question_id` | yes | Stable ID within the envelope (kebab-case) |
| `prompt` | yes | Question text for the operator |
| `severity` | no | `blocker` or `non-blocker`; default `non-blocker` |
| `domain` | no | Contract domain hint (e.g. `integration`, `data`) |

When a declared artifact such as `user_questions.md` exists for the activity, that artifact is **authoritative** over `follow_up_questions` for triage and Phase C flows.

#### `diagnostics`

| Field | Required | Description |
|-------|----------|-------------|
| `code` | yes | Machine-readable code (e.g. `sdk.startup`, `forge.envelope.size_exceeded`) |
| `message` | yes | Human-readable explanation; no secrets |
| `severity` | yes | `error`, `warning`, or `info` |
| `path` | no | JSON Pointer into `structured_payload` or repo-relative path |
| `source` | no | `sdk`, `worker`, or `validator` |

#### `validation_inputs`

Optional hints consumed by validation nodes (#24). Does not bypass validators.

| Field | Description |
|-------|-------------|
| `schema_ref` | Repo-relative JSON Schema path |
| `artifact_ids` | Artifact IDs to check |
| `domain_criteria` | Domain validator IDs or local criterion names |

### Temporal history size limits

| Limit | Value | On exceed |
|-------|-------|-----------|
| Inline `structured_payload` | 64 KiB UTF-8 | Worker moves content to artifact file and returns `artifact_refs` only |
| Total serialized response envelope | 256 KiB UTF-8 JSON | Worker returns `status=error`, `failure_class=execution`, diagnostic `forge.envelope.size_exceeded`; activity may retry per policy |

Assistant message text, tool payloads, API keys, and full SDK event streams are never written to the envelope or Temporal activity result.

## Pending human question (#27)

Each non-terminal run with `waitingNodeId` on a `human_question` node exposes zero or one active pending question on `WorkflowRunProjection.pendingHumanQuestions[]` (v1: at most one entry).

| Field | Required | Description |
|-------|----------|-------------|
| `question_id` | yes | Stable ID from the workflow node |
| `node_id` | yes | Graph node that is waiting |
| `node_name` | yes | Human-readable node name from definition |
| `title` | yes | Panel header title (node `name`) |
| `input_mode` | yes | `single_text`, `markdown_batch`, or `form_fields` (reserved; not implemented in v1) |
| `prompts` | yes | Ordered `{ field_id, label, required, blocker? }` items to render |
| `artifact_targets` | no | `{ artifact_id, path }` pairs the extension writes on successful submit |
| `batch_policy` | when `markdown_batch` | `{ max_per_submit: 3..5, blockers_first: true }` |

### Prompt resolution (v1)

1. When the node declares `artifact_ids`, parse prompt text from matching artifact files on disk (repo-relative paths from workflow `artifacts[]`). For refine-issue `user_verification_batch`, read `user_questions.md` numbered items; preserve **blocker** tags in `prompts[].blocker`.
2. When no artifact prompts resolve, use node `description` as a single `single_text` prompt (`field_id`: `answer`).
3. When `description` is empty, use `name` plus `question_id` as the label.

`follow_up_questions` on activity envelopes do not populate `pendingHumanQuestions`; only declared `human_question` waits do.

## Human answer submission (#27)

Forge resumes a paused run through a Temporal **workflow update** (v1 default). Node-level override: `resume_update` on the `human_question` node; default handler name: `forge.human_answer.submit`.

### Update payload

| Field | Required | Description |
|-------|----------|-------------|
| `envelope_version` | yes | `"1.0.0"` |
| `question_id` | yes | Must match active pending question |
| `node_id` | yes | Must match `waitingNodeId` |
| `workflow_run_id` | yes | Temporal run identifier for correlation |
| `answers` | yes | Map of `field_id` → string (UTF-8). Empty strings fail required-field validation |
| `submitted_at` | yes | ISO-8601 UTC timestamp from extension host |

### Submit sequence (extension host)

1. Validate `recoveryState === synced` and `waitingNodeId === node_id`.
2. Validate required `prompts` have non-empty `answers[field_id]`.
3. Write `artifact_targets` to disk when declared (e.g. append refine-issue batch answers to `refinement.md`).
4. Call Temporal client `workflow.update(resume_update, payload)`.
5. On acceptance, clear draft from `workspaceState` and refresh projection.

Rejected updates return a validation error to the panel; the run remains waiting and drafts are preserved.

### Draft answer persistence

Drafts are stored in `workspaceState` under `forge.workflow.humanAnswerDraft.{indexKey}.{question_id}` where `indexKey` is `{namespace}:{workflowId}:{runId}`. Drafts survive panel close within the same VS Code window session. Drafts are cleared on successful submit, run terminal, `waitingNodeId` mismatch, orphaned dismissal, or window close. Drafts do not sync across windows or machines in v1.

## Run inspector detail (#28)

Serialized payload from the extension host to the graph webview detail panel. Built by `buildRunInspectorDetail(definition, projection?, selectedNodeId, repositoryRoot)`. Presentation copy and action enablement: `.ai/interface/presentation.md` **Run Inspector (#28)**.

### Run inspector detail (root)

| Field | Required | Description |
|-------|----------|-------------|
| `mode` | yes | `definition` or `run` (mirrors graph `mode`) |
| `selected_node_id` | yes | Workflow graph node ID under inspection |
| `recoveryState` | when `mode=run` | From `WorkflowRunProjection` |
| `summary` | yes | `{ node_id, type, name, status_label, detail? }` from graph model |
| `activity` | no | Activity envelope summary when node is `activity` and run data exists |
| `retry` | no | `{ attempt, max, in_progress }` when retrying or showing last retry context |
| `validation` | no | Validation summary for `validation` nodes or linked upstream gate |
| `artifacts` | no | Array of artifact preview entries (see below) |
| `recovery_actions` | when `mode=run` | Enabled/disabled action descriptors for the panel footer |
| `empty_state` | no | Copy when no node selected (webview initial state) |

### Activity summary

Subset of activity response envelope fields safe for UI display (no `structured_payload`).

| Field | Description |
|-------|-------------|
| `activity_id` | Declared activity identifier |
| `cursor_agent_id` | SDK agent ID |
| `cursor_run_id` | SDK run ID |
| `status` | `finished`, `error`, or `cancelled` |
| `failure_class` | When not success: `startup`, `execution`, or `cancelled` |
| `retryable` | Whether automatic retry may apply |
| `output_type` | `json`, `markdown`, or `text` |
| `diagnostics` | Redacted activity diagnostics (same shape as envelope `diagnostics`) |

### Validation summary (inspector)

Maps from `WorkflowRunProjection.validationSummaries[]` for the selected `validation` node, or from the validation gate that failed the selected activity's output.

| Field | Description |
|-------|-------------|
| `valid` | Aggregate pass/fail |
| `validated_at` | ISO-8601 UTC |
| `validator_outcomes` | `{ validator_id, type, target, passed, blocking }[]` |
| `diagnostics` | Redacted diagnostic list for expandable detail |

### Artifact preview entry

| Field | Required | Description |
|-------|----------|-------------|
| `artifact_id` | yes | Workflow artifact ID |
| `path` | yes | Repo-relative path (literal file or glob match entry) |
| `size_bytes` | yes | File size at read time |
| `sha256_prefix` | yes | First 8 lowercase hex chars of SHA-256 |
| `media_type` | no | MIME hint when known |
| `preview_mode` | yes | `inline`, `truncated`, `metadata_only`, or `glob_list` |
| `preview_text` | when inline/truncated | Redacted UTF-8 preview (max 32 KiB before truncation flag) |
| `truncated` | when preview_text present | `true` when file exceeds 32 KiB cap |
| `glob_matches` | when `preview_mode=glob_list` | Up to 20 repo-relative paths; `overflow_count` when more exist |

Preview content is read from disk at `repositoryRoot`; never from inline envelope bodies.

### Recovery action descriptor

| Field | Required | Description |
|-------|----------|-------------|
| `action_id` | yes | `cancel_run`, `refresh`, `open_in_editor`, `copy_path`, `copy_diagnostic`, `copy_cursor_run_id`, `open_question_panel` |
| `label` | yes | Button or link text |
| `enabled` | yes | Whether the action is interactive |
| `disabled_reason` | when not enabled | Visible helper copy |

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Run start input serialization
- Define the exact TypeScript shape for `WorkflowRunInputDefinition`, `WorkflowRunStartInput`, and the Temporal start payload.
- Decide whether `WorkflowRunIndexEntry.startInputSummary` stores a non-secret display label for accepted input values, such as the normalized `/refine-issue` issue reference, or whether all row copy is derived on demand.
- Specify diagnostics for invalid input declarations, missing required submitted values, and undeclared submitted input keys.
- Define how `/refine-issue` input normalization artifacts, if any, are represented after a run starts.

