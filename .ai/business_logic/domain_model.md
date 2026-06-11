# Domain Model

Forge models workflow automation as a repo-owned control plane for durable agent work. Workflow definitions live in `.ai/workflows/*.json` and describe the graph, activities, validators, artifacts, and human interaction points for a workflow. `/refine-issue` is the proving workflow, but Forge treats it as one configured workflow among many rather than a special case embedded in UI or runtime code.

## Core Concepts

- A workflow definition is the declarative contract for a repeatable Forge workflow. It names stable steps, transitions, required artifacts, validators, human questions, and integration bindings.
- A run input is a workflow-definition-level value Forge collects before creating a Temporal run. Run inputs are declared generically on the workflow definition and are validated before run creation.
- A workflow run is one execution of a workflow definition for a selected workspace, repository, and delivery target. Temporal owns durable execution state, waits, retries, and recovery for each run.
- An activity is bounded non-deterministic work performed outside the deterministic Temporal workflow function. Agent activities call the Cursor SDK and return typed outputs for validation.
- A validator is deterministic logic that accepts or rejects agent outputs before the workflow advances. Validation covers schema shape, declared artifacts, and domain-specific exit criteria.
- A human question is a workflow pause point. Forge presents the question, captures the answer, and resumes the Temporal run through a signal or update.
- GitHub remains the system of record for issues, milestones, project state, and delivery records. Forge may read or mutate GitHub through explicit workflow activities, but it does not create a parallel backlog store.

## Workflow Ownership

Forge owns discovery, validation, visualization, and execution coordination for workflow definitions. The repository that contains `.ai/workflows/*.json` owns the workflow policy text and artifacts referenced by those definitions.

Workflow definitions reference stable activity identifiers, agent paths, skill paths, artifact declarations, and validators. They do not embed arbitrary shell commands or unbounded prompt bodies as execution authority.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.

## Workflow definition model

Canonical field names, node types, and versioning are specified in `.ai/data/serialization.md` and `.ai/schemas/workflow.schema.json`. Each repository owns workflow policy under `.ai/workflows/<workflow_id>.json`.

### Graph invariants (domain rules)

- `entry_node_id` must match a `node_id` in `nodes`.
- Every `to_node_id` in `transitions` must reference an existing node.
- At least one `terminal` node must be reachable from `entry_node_id`.
- Orphan nodes (not reachable from entry) produce `forge.workflow.orphan_node` warnings.
- Duplicate `workflow_id` values across files produce `forge.workflow.duplicate_id` errors.

### Validator ID catalog

| `validator_id` | `type` | Purpose |
|----------------|--------|---------|
| `forge.workflow.schema` | schema | JSON Schema validation against `.ai/schemas/workflow.schema.json`. |
| `forge.workflow.graph` | domain | Graph invariants (entry, transitions, terminal reachability). |
| `forge.workflow.binding` | domain | `activity_id`, `agent_path`, `skill_path`, and policy references resolve. |
| `forge.workflow.duplicate_id` | domain | `workflow_id` unique across discovered files. |
| `forge.workflow.unsupported_version` | domain | `schema_version` or definition `version` major not supported by the runner. |
| `forge.artifact.declared` | artifact | Node `artifact_ids` reference declared workflow artifacts. |
| `forge.artifact.exists` | artifact | Declared artifact `path` (including globs) resolves to at least one existing file at validation time. |
| `forge.artifact.integrity` | artifact | On-disk file at `artifact_refs[].path` matches declared `sha256` when the preceding activity envelope includes both fields. |
| `forge.artifact.schema` | schema | Artifact content matches a referenced JSON Schema. |
| `forge.envelope.schema` | schema | Activity response envelope matches `.ai/schemas/activity-envelope.schema.json`. |
| `forge.envelope.unsupported_version` | domain | `envelope_version` MAJOR is supported by the runner. |
| `forge.envelope.size` | domain | Serialized response envelope within Temporal size limits. |
| `forge.domain.exit_criteria` | domain | Workflow-specific exit criteria (generic runtime hook). |
| `local.forge.refine_issue.exit_criteria` | domain | `/refine-issue` refinement complete per mapping section below. |

Repositories may add `local.<repo>.<name>` validator IDs for workflow-specific domain checks. Forge-built validators use the `forge.*` prefix.

### Pre-run vs runtime validation scope

| Phase | When | Validator IDs |
|-------|------|---------------|
| Pre-run (definition and start input) | Before a workflow run is created | `forge.workflow.schema`, `forge.workflow.graph`, `forge.workflow.binding`, `forge.workflow.duplicate_id`, `forge.workflow.unsupported_version`, `forge.artifact.declared` |
| Runtime (validation nodes) | After an activity produces output during a run | `forge.envelope.schema`, `forge.envelope.unsupported_version`, `forge.envelope.size`, `forge.artifact.exists`, `forge.artifact.integrity`, `forge.artifact.schema`, `forge.domain.exit_criteria`, plus any `local.*` validators declared on validation nodes |

Pre-run validation also enforces that each file path `.ai/workflows/<workflow_id>.json` has a filename stem equal to `workflow_id` (reported under `forge.workflow.binding`).

Binding checks at pre-run include: `entry_node_id` and all `to_node_id` values resolve; activity nodes declare `activity_id` and exactly one resolvable `agent_path` or `skill_path`; node `validator_id` values match the catalog or `local.*` pattern; `retry_policy` and `timeout_policy` references match declared policies; node `artifact_ids` reference workflow-level artifacts.

Run-start checks also validate that every required `run_inputs[]` declaration has a non-empty submitted value and that no submitted input key falls outside the selected workflow definition's declared inputs. Missing or invalid run input values fail before Temporal creates a durable run.

### `/refine-issue` mapping

Canonical definition: `.ai/workflows/refine-issue.json` (`workflow_id`: `refine-issue`). `/refine-issue` uses the same node types as any workflow; Forge does not reserve bespoke node types or runtime hooks for it.

#### Run inputs

| Field | Required | Description |
|-------|----------|-------------|
| `issue_ref` | yes | GitHub issue reference declared as a workflow run input. Accepted forms are a full issue URL (`https://github.com/{owner}/{repo}/issues/{N}`) or a GitHub Projects v2 project identifier plus issue number. Existing shorthand forms may remain descriptive metadata until `/refine-issue` resolves compatibility behavior. |

The orchestrator normalizes `issue_ref` to a working parent issue before Phase A workspace prep.

#### Phase to node mapping

| Refine phase | Workflow node (`node_id`) | Node type | Primary artifacts |
|--------------|---------------------------|-----------|-------------------|
| Parentage normalization (pre-A) | `normalize_issue_parentage` | `activity` | — |
| A — Workspace prep | `workspace_prep` | `activity` | `issue_context` |
| B — Ground contracts | `ground_contracts` | `activity` | `issue_context`, optional `domain_report` |
| B.5 — Triage | `triage_questions` | `activity` | `user_questions`, `assumptions` |
| B.5 — Triage gate | `validate_triage_artifacts` | `validation` | `forge.artifact.exists` on `user_questions`, `assumptions` |
| C — User verification | `user_verification_batch` | `human_question` | `refinement`, `user_questions` |
| C — Blocker loop | `check_user_blockers` | `decision` | loops to `user_verification_batch` while `blockers_open` |
| D — Issue + `.ai` completion | `complete_refinement` | `activity` | `refinement` |
| D — Exit gate | `validate_exit_criteria` | `validation` | `local.forge.refine_issue.exit_criteria` |
| D — Commit `.ai` | `commit_ai_contracts` | `activity` | — |
| E — Handoff | `handoff` | `activity` | — |
| Complete | `terminal_complete` | `terminal` | — |

Tmp artifact paths use session slug `refine-{repoRef}-{issueNumber}` under `.cursor/.tmp/` at the workspace root. Glob declarations in the workflow JSON use `.cursor/.tmp/refine-*/` so discovery and validators match any target repoRef.

#### Human question steps

Phase C is one declared `human_question` node (`question_id`: `user_verification_batch`, `input_mode`: `markdown_batch`). Forge resolves prompts from the `user_questions` artifact, presents tier-User items in batches of 3–5 (blockers first) in the Question panel (#27), writes answers to `refinement.md` on submit, sends `forge.human_answer.submit`, and uses `check_user_blockers` to loop until every **blocker** is Answered, Deferred with explicit acceptance, or Superseded.

#### Generic human_question rules (all workflows)

- Only one active pending question per run in v1 (`pendingHumanQuestions` length ≤ 1).
- Submit is blocked until `recoveryState === synced` (`.ai/data/consistency.md`).
- Artifact-backed prompts are authoritative over node `description` when `artifact_ids` resolve on disk.
- `form_fields` `input_mode` is reserved; workflows needing structured fields use `single_text` or `markdown_batch` in v1.

#### Exit criteria (`local.forge.refine_issue.exit_criteria`)

Runtime validation (not pre-run) passes when all are true:

- Working parent issue body satisfies mandatory ticket format (parent and any sub-issues created).
- No unanswered tier-User **blocker** remains in `user_questions.md` / `refinement.md`.
- In-scope `## Open implementation decisions` bullets for the working issue are resolved in `.ai` at the worktree.
- Completed `.ai` edits are committed and pushed to `main` from the disposable worktree when the run included `.ai` changes.

#### Activity identifiers

| `activity_id` | Binding |
|---------------|---------|
| `forge.github.resolve_issue_parentage` | `resources/workflow/skills/resolve-issue-parentage/SKILL.md` |
| `forge.refine.workspace_prep` | `resources/workflow/agents/technical-writer.md` |
| `forge.refine.ground_contracts` | `resources/workflow/agents/technical-writer.md` |
| `forge.refine.triage_questions` | `resources/workflow/agents/technical-writer.md` |
| `forge.refine.complete_refinement` | `resources/workflow/agents/technical-writer.md` |
| `forge.refine.commit_ai_contracts` | `resources/workflow/agents/technical-writer.md` |
| `forge.refine.handoff` | `resources/workflow/agents/technical-writer.md` |

#### `/refine-issue` validation gate order (v1)

Implementation wires runtime validation in this order:

1. **`validate_triage_artifacts`** — after `triage_questions`: `forge.artifact.exists` for `user_questions` and `assumptions`.
2. **`validate_exit_criteria`** — after `complete_refinement`: `local.forge.refine_issue.exit_criteria`.
3. **Envelope gates** — after Cursor SDK `activity` nodes when #23 envelope mapper is available: `forge.envelope.schema`, `forge.envelope.unsupported_version`, `forge.envelope.size`. Skill-only activities (e.g. `resolve_issue_parentage`) do not emit envelopes and skip envelope gates.

### Runtime validation classes (blocking vs advisory)

| Class | When | Behavior on failure |
|-------|------|---------------------|
| **Blocking** | All validators on runtime `validation` nodes (v1 default) | Workflow does not advance; run state becomes `validation failed`; rejected output remains inspectable |
| **Advisory** | Pre-run diagnostics with `severity: warning` only | Recorded in discovery and pre-run aggregate; does **not** block run start |

Individual validator entries may declare `blocking: false` in a future workflow schema MINOR. v1 treats every runtime catalog validator as blocking.

### Run start lifecycle labels

Forge uses the following high-level lifecycle labels around workflow start and execution:

| Label | Meaning |
|-------|---------|
| `start_requested` | The user submitted Start Run and Forge is running pre-start gates. No durable Temporal run exists yet. |
| `blocked_before_creation` | Definition, submitted input, configuration, Temporal readiness, or worker readiness checks failed before Temporal start. No durable Temporal run exists. |
| `run_created` | Temporal accepted start and returned run identity. Forge records a run index entry when possible. |
| `waiting_for_input` | A created run is paused on a `human_question` node and awaits operator answers. |
| `validation_failed` | A runtime validation node rejected output or artifacts. The Temporal run remains durable at the failed gate. |
| `cancelled` | The user or runtime cancelled/terminated a created run through Temporal. |
| `terminal` | The Temporal run reached completed, failed, cancelled, or terminated final state. |

Start failures before `run_created` map to existing error-state categories: definition invalid, run input invalid, configuration invalid, or external dependency unavailable. Forge does not create a separate non-Temporal run state for pre-creation failures.

Duplicate Start Run clicks for the same selected workflow and submitted input payload are guarded while `start_requested` is in flight. Separate accepted submissions after the in-flight request resolves may create distinct Temporal runs.

### `/refine-issue` input normalization boundary

`/refine-issue` declares `issue_ref` as a required workflow run input. v1 accepted forms are a full GitHub issue URL or a GitHub Projects v2 project identifier plus issue number. Parentage normalization resolves the working parent issue before Phase A workspace prep and records the normalized parent in `issue_context.md`.

Legacy descriptive shorthand such as `metadata.run_input_issue_ref` may remain in workflow metadata only as documentation until #77 migrates command wiring. Runtime start uses declared `run_inputs[]` as the authoritative contract.

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Run start lifecycle

Resolved for v1. Labels, duplicate start handling, and failure mapping are defined in **Run start lifecycle labels**.

### Refine issue input normalization

Resolved for the issue #75 contract boundary. `/refine-issue` uses required `run_inputs.issue_ref`; parentage normalization happens before Phase A; metadata shorthand remains descriptive only until #77 handles migration compatibility.
