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
| `entry_node_id` | yes | `node_id` of the first node executed after a run starts. |
| `nodes` | yes | Non-empty array of graph nodes (see below). |
| `artifacts` | no | Declared artifact outputs the workflow may produce or inspect. |
| `retry_policies` | no | Named retry policy classes referenced by nodes. |
| `timeout_policies` | no | Named timeout policy classes referenced by nodes. |
| `metadata` | no | Repo-local tags (`owner`, `milestone`, `tags`, `deprecated`, etc.) with string, number, boolean, or null values. |

### Graph nodes

Each node requires `node_id`, `type`, and `name`. Optional `description`, `transitions`, `retry_policy`, `timeout_policy`, and `artifact_ids` apply per type.

| `type` | Additional required fields | Purpose |
|--------|---------------------------|---------|
| `activity` | `activity_id` and (`agent_path` or `skill_path`) | Bounded non-deterministic work (Cursor SDK agent or skill). |
| `validation` | `validators` (min 1) | Deterministic gate before progression. |
| `human_question` | `question_id` | Pause for user input resumed through Temporal. |
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

Pre-run validation returns an aggregate suitable for discovery (#30) and run-start gates:

| Field | Description |
|-------|-------------|
| `valid` | `true` when no diagnostic has `severity: error`. |
| `diagnostics` | Ordered array of diagnostic objects. |
| `workflow_id` | Present when parsed from the definition. |
| `path` | Repo-relative path to the definition file. |

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
