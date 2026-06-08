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

`retry_policies` and `timeout_policies` entries require `policy_id` and optional `description`. Nodes reference policies by `policy_id` string. Concrete retry/timeout semantics are runtime concerns outside this milestone.

## Versioning and migration

- `version` uses semver. Breaking changes to required fields, node semantics, or graph invariants increment **MAJOR**. Additive nodes, artifacts, validators, or optional metadata increment **MINOR**. Documentation or metadata-only edits increment **PATCH**.
- `schema_version` tracks the JSON contract shape. When Forge ships a new major workflow schema, runners report `forge.workflow.unsupported_version` for definitions whose `schema_version` major is not supported.
- Forge does not auto-migrate workflow files. Authors edit `.ai/workflows/*.json` explicitly when contract changes require it.

## Invalid definition reporting (contract shape)

Diagnostics returned to CLI, commands, and Studio discovery use a stable object shape (validation implementation is issue #16):

| Field | Description |
|-------|-------------|
| `code` | Machine-readable code (e.g. `schema.required`, `graph.unreachable_node`). |
| `severity` | `error` blocks runs; `warning` is visible but non-blocking when warnings are enabled. |
| `path` | JSON Pointer into the definition file. |
| `message` | Human-readable explanation. |
| `validator_id` | Validator or rule ID that produced the diagnostic. |

## Open implementation decisions

### Cursor SDK output envelopes
- Specify the exact envelope properties for activity ID, Cursor run ID, agent or skill source, status, structured payload, artifacts, validation inputs, and diagnostic messages.
