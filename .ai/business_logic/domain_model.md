# Domain Model

Forge models workflow automation as a repo-owned control plane for durable agent work. Workflow definitions live in `.ai/workflows/*.json` and describe the graph, activities, validators, artifacts, and human interaction points for a workflow. `/refine-issue` is the proving workflow, but Forge treats it as one configured workflow among many rather than a special case embedded in UI or runtime code.

## Core Concepts

- A workflow definition is the declarative contract for a repeatable Forge workflow. It names stable steps, transitions, required artifacts, validators, human questions, and integration bindings.
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
| `forge.artifact.exists` | artifact | Declared artifact `path` exists or matches at validation time. |
| `forge.artifact.schema` | schema | Artifact content matches a referenced JSON Schema. |
| `forge.domain.exit_criteria` | domain | Workflow-specific exit criteria (generic runtime hook). |
| `local.forge.refine_issue.exit_criteria` | domain | `/refine-issue` refinement complete per mapping section below. |

Repositories may add `local.<repo>.<name>` validator IDs for workflow-specific domain checks. Forge-built validators use the `forge.*` prefix.

### Pre-run vs runtime validation scope

| Phase | When | Validator IDs |
|-------|------|---------------|
| Pre-run (definition) | Before a workflow run is created | `forge.workflow.schema`, `forge.workflow.graph`, `forge.workflow.binding`, `forge.workflow.duplicate_id`, `forge.workflow.unsupported_version`, `forge.artifact.declared` |
| Runtime (validation nodes) | After an activity produces output during a run | `forge.artifact.exists`, `forge.artifact.schema`, `forge.domain.exit_criteria`, plus any `local.*` validators declared on validation nodes |

Pre-run validation also enforces that each file path `.ai/workflows/<workflow_id>.json` has a filename stem equal to `workflow_id` (reported under `forge.workflow.binding`).

Binding checks at pre-run include: `entry_node_id` and all `to_node_id` values resolve; activity nodes declare `activity_id` and exactly one resolvable `agent_path` or `skill_path`; node `validator_id` values match the catalog or `local.*` pattern; `retry_policy` and `timeout_policy` references match declared policies; node `artifact_ids` reference workflow-level artifacts.

### `/refine-issue` mapping

Canonical definition: `.ai/workflows/refine-issue.json` (`workflow_id`: `refine-issue`). `/refine-issue` uses the same node types as any workflow; Forge does not reserve bespoke node types or runtime hooks for it.

#### Run inputs

| Field | Required | Description |
|-------|----------|-------------|
| `issue_ref` | yes | GitHub issue reference: full URL (`https://github.com/{owner}/{repo}/issues/{N}`), qualified shorthand (`{owner}/{repo}#{N}`), or issue number alone (`{N}`) when the active workspace resolves `owner/repo` from its GitHub remote. |

The orchestrator normalizes `issue_ref` to a working parent issue before Phase A workspace prep.

#### Phase to node mapping

| Refine phase | Workflow node (`node_id`) | Node type | Primary artifacts |
|--------------|---------------------------|-----------|-------------------|
| Parentage normalization (pre-A) | `normalize_issue_parentage` | `activity` | — |
| A — Workspace prep | `workspace_prep` | `activity` | `issue_context` |
| B — Ground contracts | `ground_contracts` | `activity` | `issue_context`, optional `domain_report` |
| B.5 — Triage | `triage_questions` | `activity` | `user_questions`, `assumptions` |
| B.5 — Triage gate | `validate_triage_artifacts` | `validation` | declares `user_questions`, `assumptions` |
| C — User verification | `user_verification_batch` | `human_question` | `refinement`, `user_questions` |
| C — Blocker loop | `check_user_blockers` | `decision` | loops to `user_verification_batch` while `blockers_open` |
| D — Issue + `.ai` completion | `complete_refinement` | `activity` | `refinement` |
| D — Exit gate | `validate_exit_criteria` | `validation` | `local.forge.refine_issue.exit_criteria` |
| D — Commit `.ai` | `commit_ai_contracts` | `activity` | — |
| E — Handoff | `handoff` | `activity` | — |
| Complete | `terminal_complete` | `terminal` | — |

Tmp artifact paths use session slug `refine-{repoRef}-{issueNumber}` under `.cursor/.tmp/` at the workspace root. Glob declarations in the workflow JSON use `.cursor/.tmp/refine-*/` so discovery and validators match any target repoRef.

#### Human question steps

Phase C is one declared `human_question` node (`question_id`: `user_verification_batch`). The workflow presents tier-User items from `user_questions.md` in batches of 3–5 (blockers first), records answers in `refinement.md`, and uses `check_user_blockers` to loop until every **blocker** is Answered, Deferred with explicit acceptance, or Superseded.

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
