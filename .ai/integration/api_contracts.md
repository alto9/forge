# Api Contracts

Forge workflow APIs are boundary contracts between the extension, Temporal workers, Cursor SDK agent activities, validators, and GitHub.

## Cursor SDK Boundary

Cursor SDK (`@cursor/sdk`, TypeScript) is the boundary for bounded agent activities. The supervised Temporal worker invokes the SDK; the extension host does not execute agent activities directly.

Workflow activities pass a constrained **request envelope** to the worker adapter, which calls `Agent.create` + `agent.send` + `run.wait()` (durable pattern with run identity and cancellation support). The worker returns a **response envelope** to Temporal history. Validators consume the response envelope in a later step (#24); Forge does not treat raw model output as accepted workflow state.

### Runtime and credentials (v1)

| Aspect | Contract |
|--------|----------|
| Package | `@cursor/sdk` in the worker bundle |
| Runtime | **Local only** — `local: { cwd }` where `cwd` is the absolute path to the run-selected workspace root |
| Setting sources | `local.settingSources: []` (inline config only; no ambient project/user settings load) |
| API key | Resolved from VS Code SecretStorage (`forge.cursor.apiKey`) or `CURSOR_API_KEY` env override; never in workflow JSON |
| Cloud agents | Deferred — not selectable per activity node in v1 |

### Invocation flow

1. Temporal schedules a Cursor SDK agent activity on the window-scoped worker task queue.
2. Worker resolves `agent_path` or `skill_path` from the workflow node binding and builds the SDK prompt from the request envelope `inputs` plus binding metadata.
3. Worker creates a local agent, sends the prompt, optionally streams events for heartbeats (SDK run ID only in heartbeat payload), and awaits terminal `RunResult`.
4. Worker maps SDK outcome to the response envelope (`failure_class`, `retryable`, diagnostics).
5. On Temporal activity cancellation, worker calls `run.cancel()` when `run.supports("cancel")`. Cancelled activities are **not** re-run. Late SDK completion after cancel is logged and discarded; it is not written to workflow state.
6. Response envelope is returned to Temporal; validation nodes (#23 envelope shape, #24 gates) run in subsequent workflow steps.

### Failure taxonomy

| Class | SDK signal | `failure_class` | Typical retry |
|-------|------------|-----------------|---------------|
| Startup | Thrown `CursorAgentError` before run executes | `startup` | When `err.isRetryable === true` and policy allows |
| Execution | `result.status === "error"` after run started | `execution` | When policy allows and not cancelled |
| Cancelled | Temporal cancel or successful `run.cancel()` | `cancelled` | Never |

### Request envelope (v1)

Serialized JSON passed from workflow orchestration to the worker activity. Stored in Temporal activity input (not workflow definition JSON).

| Field | Required | Description |
|-------|----------|-------------|
| `envelope_version` | yes | `"1.0.0"` |
| `activity_id` | yes | Stable ID from workflow node |
| `node_id` | yes | Workflow graph node |
| `workflow_run_id` | yes | Temporal run identifier for correlation |
| `agent_path` | one of | Repo-relative path to agent markdown |
| `skill_path` | one of | Repo-relative path to skill `SKILL.md` |
| `prompt` | yes | Bounded instruction text composed by orchestration from workflow context |
| `inputs` | yes | JSON object of workflow-supplied parameters (issue refs, paths, etc.) |
| `model` | no | SDK model override; default server resolution when omitted |
| `artifact_ids` | no | Declared workflow artifact IDs the activity may produce |
| `output_type` | yes | Declared structured output: `json`, `markdown`, or `text` |

### Response envelope (boundary v1)

Minimal fields returned from worker to Temporal. Full property catalog, versioning rules, artifact reference serialization, and Temporal size limits: `.ai/data/serialization.md`. JSON Schema: `.ai/schemas/activity-envelope.schema.json`.

| Field | Required | Description |
|-------|----------|-------------|
| `envelope_version` | yes | `"1.0.0"` |
| `activity_id` | yes | Echo from request |
| `node_id` | yes | Workflow graph node |
| `workflow_run_id` | yes | Temporal run identifier |
| `cursor_agent_id` | yes | SDK agent ID |
| `cursor_run_id` | yes | SDK run ID after `send()` |
| `output_type` | yes | Echo from request |
| `status` | yes | `finished`, `error`, or `cancelled` |
| `failure_class` | when not success | `startup`, `execution`, or `cancelled` |
| `retryable` | yes | From SDK `isRetryable` / policy mapping |
| `structured_payload` | when success | Inline output per `output_type`; see size limits in serialization doc |
| `artifact_refs` | no | `{ artifact_id, path, size_bytes, sha256 }` pointers; no embedded content |
| `follow_up_questions` | no | Provisional `{ question_id, prompt, severity?, domain? }`; durable pauses use `human_question` nodes |
| `diagnostics` | no | `{ code, message, severity, path?, source? }` — no secrets or raw transcripts |
| `validation_inputs` | no | Optional hints for #24 validators (`schema_ref`, `artifact_ids`, `domain_criteria`) |

### Activity diagnostics and logging

Worker and extension forward activity diagnostics to the Forge Output channel with prefix `[forge.activity.cursor]`. v1 logs **metadata only**: `activity_id`, `cursor_run_id`, `status`, `failure_class`, `retryable`, and `artifact_refs` paths. Assistant text, tool payloads, and credential material are never logged.

Redaction rules: replace values matching API keys, `Authorization` headers, certificate material, and environment variables whose names contain `KEY`, `TOKEN`, or `SECRET` with `[REDACTED]`.

## Temporal Boundary

The Forge extension starts or connects to workflow runs through a Temporal client. Workers execute workflow and activity code outside the VS Code extension host. Human answers resume waiting workflows through declared Temporal workflow updates (v1 default) or signals when a node overrides `resume_update`.

### Workflow start (v1)

| Aspect | Contract |
|--------|----------|
| Caller | VS Code extension host Temporal client |
| Preconditions | Workflow definition validation has no errors; declared run inputs validate; Temporal connection and supervised worker are `ready` |
| Workflow type | Resolved from the selected Forge workflow definition and worker registry, not arbitrary user text |
| Task queue | Active mode task queue from `forge.temporal.managedLocal.taskQueue` or `forge.temporal.external.taskQueue` |
| Payload | `.ai/data/serialization.md` **Workflow run start payload** |
| Identity | Temporal `workflowId` and `runId` returned by start become the run index identity |
| Post-start | Extension appends the run index entry, refreshes the left-panel run list, and leaves graph opening to the run row action |

Submitted run input validation happens before Temporal readiness and start. Validation failures use the pre-run diagnostic shape with `validator_id: "forge.workflow.run_input"` and do not call Temporal or create a `WorkflowRunIndexEntry`.

Temporal start failures are surfaced as start feedback and diagnostics. They do not create a `WorkflowRunIndexEntry` unless Temporal returns a durable run identity.

The accepted start result is the only cross-boundary authority for post-start persistence. Forge combines returned `workflowId` and `runId` with the active namespace, active task queue, selected workflow definition ID, selected repository root, active Temporal mode, and start timestamp to append the `WorkflowRunIndexEntry`. Downstream list, graph, recovery, cancel, human-answer, and diagnostic consumers address the run through that persisted identity.

### Workflow start identity and diagnostics

The worker registry maps a selected `workflow_id` to a known Temporal workflow type. v1 ships only registry entries owned by Forge; arbitrary workflow type names from workflow JSON are not accepted as start authority.

Temporal `workflowId` is generated from the selected `workflow_id` plus a unique suffix for the active namespace. Forge treats repeated accepted Start Run submissions as distinct runs, while the extension UI guards duplicate in-flight submissions for the same selected workflow and submitted payload.

Task queue comes from the active Temporal mode configuration. Workflow-definition-level task queue override is out of scope for v1 and must be added through a future additive contract before use.

Temporal start errors are converted into redacted diagnostics with `code`, `severity`, `message`, and optional `source: "temporal"`. Raw server payloads, connection strings containing credentials, headers, and tokens are never shown in issue artifacts, workflow JSON, or UI diagnostics.

### Human answer update (v1)

| Aspect | Contract |
|--------|----------|
| Handler name | `forge.human_answer.submit` (default); override per `human_question` node via `resume_update` |
| Caller | VS Code extension host Temporal client |
| Payload | `.ai/data/serialization.md` **Human answer submission** |
| Validation | Worker handler rejects mismatched `question_id`, `node_id`, or empty required answers; run stays waiting |
| Idempotency | Duplicate submit with identical payload is accepted as no-op when the wait already cleared |
| Artifact writes | Extension writes declared artifact files **before** sending the update; update payload carries answer map only |

Signals remain supported for future workflow definitions that declare a signal name instead of an update handler. v1 Forge Studio and the refine-issue proving workflow use the update contract above.

## GitHub Boundary

GitHub APIs remain the boundary for issue, milestone, project, pull request, and planning state. Workflow definitions can reference GitHub activities, but GitHub remains the source of truth for delivery records.

### `/refine-issue` issue input

`/refine-issue` accepts GitHub issue context through its declared run input, not workflow-specific UI metadata. v1 accepts a full GitHub issue URL, `owner/repo#N`, a bare issue number when `{owner}/{repo}` can be inferred from the selected repository remote, or a GitHub Projects v2 project identifier plus issue number. GitHub lookup and parentage normalization happen through explicit workflow activity or skill boundaries before workspace prep; workflow JSON does not carry GitHub tokens.

The command-entry adapter parses legacy shorthand into the declared `run_inputs.issue_ref` value before the generic Start Run path. The project identifier form is a structured value that includes the Projects v2 project identity and the issue number. Implementations may serialize it as a compact string for `run_inputs.issue_ref`, but must parse it into `{ project, issue_number }` before GitHub lookup. The project identifier is used to resolve and verify issue context and may be retained in `issue_context.md` for board hygiene; the normalized working issue URL remains the primary downstream reference.

Diagnostics for this boundary use the standard diagnostic shape:

| Code | When |
|------|------|
| `github.issue_url_unresolved` | The supplied issue URL cannot be parsed or fetched. |
| `github.issue_number_missing` | The shorthand or project identifier form does not include a usable issue number. |
| `github.repository_inference_failed` | A bare issue number was supplied but the selected repository remote cannot resolve `{owner}/{repo}`. |
| `github.project_unavailable` | The project identifier cannot be accessed with the available GitHub authority. |
| `github.parentage_lookup_failed` | Parent/sub-issue normalization cannot determine the working parent. |

## Primary code pointers (optional)

- Add stable code directories or modules here when known.

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Temporal workflow start

Resolved for v1 in **Workflow start identity and diagnostics**. Future task queue override behavior requires an additive contract before workflow definitions can request a non-default task queue.

### GitHub issue normalization

Resolved for v1 in **`/refine-issue` issue input**. Command-entry migration and legacy shorthand compatibility parse into declared `run_inputs.issue_ref`; workflow JSON metadata is descriptive only.

### GitHub activity contracts

`/refine-issue` GitHub boundaries reuse script skills and `gh` / GitHub MCP from the Technical Writer loop. Workflow JSON references skills by path; activities do not embed raw REST URLs in definition files.

| Activity / skill | GitHub surface | Purpose in `/refine-issue` |
|------------------|----------------|----------------------------|
| `forge.github.resolve_issue_parentage` → `resolve-issue-parentage` | REST sub-issues parent endpoint (`GET .../issues/{n}/parent`) | Normalize sub-issue input to working parent |
| Technical Writer activities | Issue read (`gh issue view`, MCP), issue edit (`gh issue edit`, MCP) | Refine parent and sub-issue bodies |
| `pull-milestone-issues` | Issues API filtered by milestone | Milestone peer context in Phase B |
| `link-subissue-to-issue` | REST sub-issues link | Attach created sub-issues to parent |
| `gh-project-set-status` | Projects v2 item status | Phase E board hygiene when `github_board` is configured |

Future workflows declare the same pattern: stable `activity_id` plus resolvable `skill_path` or agent binding, with GitHub operations implemented in skill scripts or agent tooling—not in workflow JSON prose.
