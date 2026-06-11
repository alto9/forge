# Presentation

Forge Studio presents workflows as both definitions and live runs.

## Workflow Visualization (#26)

React Flow (`@xyflow/react`) is the visualization layer for workflow definitions and run state. Definition views show nodes, transitions, validators, human input points, activities, and artifact outputs. Run views overlay Temporal-backed `WorkflowRunProjection` state such as active step, completed steps, failed steps, retries, waits, validation failures, and pending human questions.

### Surfaces (v1)

1. **Command palette** — **Forge: Open Workflow Graph** opens the graph webview for the catalog-selected workflow (see `.ai/interface/input_handling.md`).
2. **Command palette** — **Forge: Refresh Workflow Graph** re-fetches the current projection when a run is active, or reloads the definition when in definition-only mode.
3. **Run list** — opening a run from the minimal run list (`.ai/interface/presentation.md` **Run recovery surfaces**) opens the graph webview in run mode for that indexed execution.
4. **Graph webview** — React Flow canvas plus an ordered textual step list sidebar (accessibility companion per `.ai/interface/accessibility.md`).

Visual graph editing, recovery action implementation, and human question forms are out of scope for #26 (#27, #28, and recovery controls ship in sibling cockpit issues).

### Definition vs run mode

| Mode | When | Data source |
|------|------|-------------|
| **Definition** | No indexed non-terminal run for the selected `workflow_id` + `repositoryRoot`, or user opens graph before run start | Parsed `WorkflowDefinition` from `.ai/workflows/*.json` |
| **Run** | User opens graph from run list, or a non-terminal indexed run exists for the selected workflow | `WorkflowRunProjection` refreshed from Temporal (see **Refresh cadence**) merged onto the definition graph |

Run mode takes precedence when both apply. All nodes use visual state **Pending** and all edges **Idle** in definition mode.

### Layout and edges

- **Layout** — Auto-layout top-to-bottom (entry node at top) with `@dagrejs/dagre` (or equivalent). Positions are computed when the graph model is built; users do not drag-to-save layout in v1.
- **Edges** — One directed edge per `transitions[]` entry on the source node (`from_node_id` → `to_node_id`). Optional `condition` text appears on edge labels for `decision` nodes.
- **Node chrome** — Node shape or icon distinguishes `activity`, `validation`, `human_question`, `wait`, `decision`, and `terminal` types from the workflow definition.

### Node visual states

Each graph node carries a `visual_state` and human-readable `status_label`. Status colors pair with text and icons (never color-only).

| `visual_state` | Applies when | `status_label` (default) | Notes |
|----------------|--------------|--------------------------|-------|
| `pending` | Definition mode, or run has not reached the node | **Pending** | Default idle state |
| `active` | Node is the current orchestration step | **Active** | Pulse or focus ring on canvas |
| `completed` | Node finished successfully in the run history | **Completed** | |
| `failed` | Activity returned terminal failure, or validation node aggregate `valid=false` | **Failed** | Validation failures do not retry automatically |
| `cancelled` | Run cancelled while this node was active or pending | **Cancelled** | |
| `waiting` | `human_question` pause awaiting answers | **Waiting for input** | Detail panel names `question_id` |
| `waiting` | `wait` node timer or durable wait in progress | **Waiting** | Detail panel may show timer label when available |
| `validating` | `validation` node activity in flight | **Validating** | |
| `retrying` | Temporal is scheduling or running an automatic activity retry | **Retrying ({attempt}/{max})** | `max` from retry policy catalog (`.ai/runtime/execution_model.md`); only on `activity` nodes |
| `skipped` | `decision` branch not taken in completed history | **Skipped** | Muted styling; still listed in step list |

### Edge visual states

| `visual_state` | Applies when |
|----------------|--------------|
| `idle` | Definition mode, or edge not yet traversed in the run |
| `traversed` | Run history includes this transition |
| `active` | Edge from the last completed node to the current `active` node |
| `untaken` | Outgoing edge from a `decision` node whose branch was not chosen (pairs with downstream `skipped` nodes) |

### Refresh cadence and data source

- **Authority** — Temporal workflow history and queries are authoritative. Forge builds `WorkflowRunProjection` locally and derives graph node/edge states (`.ai/data/consistency.md`).
- **Poll interval** — **2 seconds** while the graph webview is visible, the run is non-terminal, and `recoveryState === synced`.
- **Pause** — Stop polling when the webview panel is not visible (resume on reveal).
- **Immediate refresh** — On **Forge: Refresh Workflow Graph**, **Forge: Refresh workflow runs**, and when `recoveryState` transitions to `synced`.
- **Non-synced recovery** — When `recoveryState` is not `synced`, show the recovery banner copy from `.ai/operations/observability.md` **Run recovery states**; do not show live **Active**, **Retrying**, or **Validating** animation from stale cached projections.

Serialized webview payload: `.ai/data/serialization.md` **Workflow graph model**.

### UI copy (cockpit graph)

| Situation | Copy |
|-----------|------|
| Definition mode header | "Definition — {workflow name}" |
| Run mode header | "Run — {workflow name} ({workflowId}/{runId})" |
| Run starting before graph open | "Start a workflow run to see live progress." |
| Recovery banner (`recovery_pending`) | "Recovering run state…" |
| Recovery banner (`refresh_failed`) | "Could not refresh run state. Try **Forge: Refresh Workflow Graph**." |
| Recovery banner (`unreachable`) | "Waiting for Temporal…" |
| Validation failed node detail | "Validation failed — see diagnostics in run inspector (#28)." |
| Retry detail | "Automatic retry {attempt} of {max}" |
| Pending human question | "Waiting for your answers — continue in the question panel (#27)." |
| Graph empty / no selection | "Select a workflow in the catalog, then open the graph." |

## Run Inspector (#28)

The run inspector is the **node detail panel** in the graph webview when `mode=run` and the operator selects a node from the canvas or step list. It presents activity summaries, validation outcomes, artifact references with bounded previews, Cursor SDK run identity, retry and failure state, and contextual recovery actions. Human question UI ships in the **Question panel** section below (#27); the run inspector links to it but does not duplicate answer forms.

### Surfaces (v1)

1. **Graph webview detail panel** — primary inspector surface; visible when a run-mode graph is open and a node is selected.
2. **Step list selection** — selecting a row in the accessibility step list updates the same detail panel and focuses the corresponding canvas node.
3. **Definition mode** — selecting a node shows definition metadata only (type, description, declared validators, declared artifact IDs); no live envelopes, validation summaries, or recovery actions.

Serialized payload: `.ai/data/serialization.md` **Run inspector detail**.

### Detail panel sections (run mode)

Sections appear in this order when data exists; omit empty sections.

| Section | When shown | Content |
|---------|------------|---------|
| **Summary** | Always | Node `name`, `type`, `status_label`, optional one-line `detail` from graph model |
| **Activity** | `activity` node with envelope summary | `activity_id`, `cursor_agent_id`, `cursor_run_id`, `status`, `failure_class`, `retryable`, `output_type` |
| **Retry** | `visual_state=retrying` or terminal activity failure with retry history | "Automatic retry {attempt} of {max}" or last failure diagnostic |
| **Validation** | `validation` node or upstream validation summary for selected node | Pass: **Validated** + validator ID list. Fail: **Validation failed** + expandable redacted diagnostics |
| **Artifacts** | Node declares `artifact_ids` or envelope includes `artifact_refs` | List with preview, metadata, and actions (see **Artifact preview**) |
| **Recovery actions** | Run mode | Contextual buttons/links (see **Recovery action catalog**) |

When `recoveryState !== synced`, show the recovery banner from **Workflow Visualization (#26)** and disable recovery actions except **Refresh** (which re-triggers projection fetch).

### Artifact preview (v1)

| Condition | Display |
|-----------|---------|
| Text, markdown, or JSON (`media_type` hint or extension) | Syntax-highlighted preview up to **32 KiB UTF-8** |
| File size > 32 KiB | Truncated preview + banner: "Showing first 32 KiB — open in editor for full file." |
| Binary or unknown type | Metadata only: `artifact_id`, repo-relative `path`, `size_bytes`, first 8 hex chars of `sha256` |
| Glob artifact path | Up to **20** matching repo-relative paths; overflow: "+ {n} more — open in editor." |

Never render raw activity envelope `structured_payload` in the panel; read file content from disk via `artifact_refs` only. Apply UI redaction (`.ai/operations/observability.md` **UI redaction (run inspector)**) before rendering previews.

### Recovery action catalog (v1)

Actions appear in the detail panel footer when enabled; disabled actions show visible helper text (not tooltip-only).

| Action | Enabled when | Notes |
|--------|--------------|-------|
| **Cancel run** | Non-terminal run, `recoveryState === synced` | Confirm copy from **Run recovery surfaces** |
| **Refresh** | Run mode | Same as **Forge: Refresh Workflow Graph** for the displayed run |
| **Open in editor** | Resolvable `artifact_refs[].path` for selected node | `vscode.open` on repo-relative path |
| **Copy path** | Artifact ref present | Clipboard repo-relative path |
| **Copy diagnostic** | Activity or validation diagnostic visible | Clipboard `{code}: {message}` |
| **Copy Cursor run ID** | Activity envelope summary includes `cursor_run_id` | Clipboard run ID |
| **Answer in question panel** | `human_question` node, `visual_state=waiting`, synced | Opens question panel (#27) |

Out of scope v1: manual activity retry, restart from node, dismiss orphaned (run list only), automated remediation.

### UI copy (run inspector)

| Situation | Copy |
|-----------|------|
| No node selected | "Select a step to inspect activity output, validation, and artifacts." |
| Definition mode node | "Definition — select a run to inspect live activity and validation results." |
| Activity success | "Activity finished" |
| Activity failed | "Activity failed — {failure_class}" |
| Validation passed | "Validated" |
| Validation failed header | "Validation failed" |
| Empty artifacts | "No artifacts for this step." |
| Integrity mismatch | "Hash mismatch — expected {expectedPrefix}…, got {actualPrefix}…" |
| Actions blocked (recovery) | "Run actions are unavailable until recovery finishes." |
| Waiting human question link | "Answer in question panel" |

### Polling

Detail content refreshes with the graph webview poll (**2 seconds** while visible, non-terminal, `recoveryState === synced`). Node selection is preserved across refreshes when the node still exists.

### Accessibility (run inspector)

- Detail panel sections use heading structure (`h3` section titles) and preserve focus order when switching step list items.
- Expandable validation diagnostics use `aria-expanded`; diagnostic list items include severity prefix in accessible name.
- Recovery actions expose disabled reasons as visible helper text per `.ai/interface/accessibility.md`.
- Artifact previews expose truncated state in accessible description when the 32 KiB cap applies.

## Human question panel (#27)

Forge Studio collects operator answers when a run waits on a `human_question` node and resumes the Temporal run through workflow update `forge.human_answer.submit`.

### Surfaces (v1)

1. **Command palette** — **Forge: Open Question Panel** opens the panel for the selected run (or prompts run selection when none selected).
2. **Run list** — badge **Needs input** on rows with `pendingHumanQuestions` while `recoveryState === synced`; click opens the panel for that run.
3. **Graph waiting node** — detail link "Answer in question panel" when `visual_state === waiting` on a `human_question` node.
4. **Question panel webview** — `src/webview/questions/` bundle; shows title, ordered prompts, validation messages, draft fields, and **Submit answers** primary action.

### Panel layout

- **Header** — `{workflow_name} — {node_name} ({question_id})`.
- **Prompt list** — one control per `prompts[]` entry: multiline textarea for `single_text` and `markdown_batch`; `blocker` items show a **Blocker** badge.
- **Batch footer** (`markdown_batch`) — "Showing {n} of {total} questions" when more items remain in the artifact source.
- **Actions** — **Submit answers** (primary), **Discard draft** (secondary, clears `workspaceState` draft only).

### Validation and submit copy

| Situation | Copy |
|-----------|------|
| Required field empty | "Answer required for: {label}" |
| Submit blocked (recovery) | "Submit answers after the run finishes recovering." |
| Submit success | "Answers submitted — run resuming." |
| Update rejected | "Could not submit answers — {reason}. Try again." |
| Stale question | "This question is no longer active for this run." |
| Run terminal while open | "This run has finished — question panel closed." |
| No pending question | "No questions are waiting for this run." |

### Polling

Refresh `pendingHumanQuestions` every **2 seconds** while the panel is visible, the run is non-terminal, and `recoveryState === synced`. Pause polling when the panel is hidden.

### Accessibility (question panel)

- Each prompt exposes `label` as the accessible name; **Blocker** badge text is included in the name.
- **Submit answers** exposes `aria-busy` while the Temporal update is in flight.
- Focus order: header → prompts top-to-bottom → primary action → secondary action.
- Disabled submit exposes the recovery or stale reason as visible helper text, not tooltip-only.

## Workflow discovery catalog (#25)

Forge Studio exposes repo-owned workflow definitions through a read-only catalog before run visualization or execution controls.

### Surfaces (v1)

1. **Command palette** — **Forge: Open Workflow Catalog** opens the catalog webview panel.
2. **Command palette** — **Forge: Refresh Workflow Catalog** re-scans the selected repository folder.
3. **Command palette** — **Forge: Select Workflow Repository Folder** changes the active folder in multi-root workspaces.
4. **Catalog webview** — flat list of discovered definitions with validation badges, metadata, and selection highlight.

Run start is available from valid catalog rows. Graph preview remains a separate cockpit surface; selected workflow identity is persisted for downstream graph and run-start flows.

### List layout and sorting

- **Flat list** — no section grouping in v1. Optional `metadata.tags` or `metadata.milestone` values may appear as secondary text on a row; they do not create group headers.
- **Sort order** — valid definitions first, then invalid. Within each group, sort by `name` ascending (case-insensitive locale). Tie-break on `workflow_id` ascending.
- **Row fields** — primary: `name`; secondary: `workflow_id`, semver `version`; optional truncated `description`; validation badge; repo-relative `path` on expand or detail affordance.

### Validation badges and summary copy

Pre-run validation uses the aggregate shape in `.ai/data/serialization.md` **Validation result (aggregate)**. Catalog rows derive badge state from `valid` and diagnostic counts.

| State | Badge label | Row summary (when collapsed) |
|-------|-------------|--------------------------------|
| Valid, no warnings | **Valid** | _(no extra summary)_ |
| Valid with warnings | **Valid with warnings** | "{warningCount} warning(s) — run can start" |
| Invalid | **Invalid** | "{errorCount} error(s){, {warningCount} warning(s)} — fix before run" |

Expand or open detail to show ordered diagnostics (`code`, `message`, `path`, `severity`, `validator_id`). Do not inline full JSON definition bodies in the list.

| Diagnostic severity in detail | Prefix copy |
|------------------------------|-------------|
| `error` | "Error" |
| `warning` | "Warning" |

Example invalid summary: "3 errors, 1 warning — fix before run". Example warning-only summary: "2 warnings — run can start".

### Selection affordances

- Clicking a row selects it (`aria-selected="true"`, visible focus ring).
- Selection persists in `workspaceState` as `forge.workflow.catalog.selectedWorkflowId` scoped to the active `repositoryRoot`.
- Invalid rows (any pre-run diagnostic with `severity: error`) remain selectable for inspection. A disabled **Start run** affordance shows visible helper text: "Fix validation errors before starting a run."
- Valid rows show an enabled **Start run** affordance. When the definition declares required `run_inputs[]`, the action opens input collection before Temporal start. When no required inputs exist, the action follows the no-parameters fast path.

### Start Run (v1)

The catalog row Start Run affordance is the first workflow-definition execution surface. It does not auto-open the monitoring graph after success.

| Situation | Copy / behavior |
|-----------|-----------------|
| Required input missing | "Complete required inputs before starting this workflow." |
| Definition invalid | "Fix validation errors before starting a run." |
| Temporal not ready | "Workflow runs are blocked until Temporal is ready. See Forge Temporal output for details." |
| Worker not ready | "Workflow runs are blocked until the Forge worker is ready. See Forge Temporal output for details." |
| Start in progress | "Starting workflow run…" |
| Start succeeded | "Workflow run started." Refresh the Workflow Runs view. |
| Start failed before run creation | "Could not start workflow run — {reason}." |

After success, the left-panel Workflow Runs view refreshes and the new row exposes **View graph**. Users open the graph from that row when they want to monitor the run.

Blocked starts keep the user on the catalog row and do not add a Workflow Runs entry. Definition and input blockers show row-level helper or validation copy; readiness blockers use the existing Forge Temporal notification, status bar, and Output channel health surfaces. Failed starts after readiness passes but before Temporal returns identity use the same catalog failure copy and Forge Temporal Output channel diagnostic path, with `{reason}` redacted per `.ai/operations/observability.md` **Start diagnostic copy**.

### Start Run input collection (v1)

The catalog row owns the first input collection surface. When a valid workflow declares required `run_inputs[]`, selecting **Start run** expands an inline form for that catalog row before Temporal readiness checks start. Optional inputs may appear in the same form when rendered, but v1 only requires collecting required string inputs.

Each input control uses the declaration `label` as the visible and accessible label, `description` as helper copy, and `validation_hint` as non-executable guidance. Required inputs are marked as required in visible text and accessibility metadata. Keyboard order is row summary, diagnostics/detail controls, input controls in declaration order, **Start run**, then secondary row actions.

Workflows with no required inputs use the no-parameters fast path: selecting **Start run** begins readiness checks immediately without a confirmation step. The start payload still contains `run_inputs: {}`.

While a matching start request is in flight for the selected workflow and submitted payload, the row disables the Start Run action and shows "Starting workflow run...". A different submitted payload can be started only after the current request resolves.

### Multi-root and missing `.ai` empty states

| Condition | Copy |
|-----------|------|
| Multi-root, first open | VS Code quick pick: "Select the repository folder for workflow definitions" (same pattern as Forge Roadmap). |
| No workspace folder open | "Open a workspace folder to discover workflow definitions." |
| Selected folder has no `.ai/workflows/` directory | "No workflow definitions found. Add JSON files under `.ai/workflows/` in this repository." |
| Directory exists but no `*.json` files | "No workflow definitions found in `.ai/workflows/`." |
| Saved folder removed from workspace | Re-prompt with quick pick on next catalog open. |

Persist the chosen folder per window in `workspaceState` key `forge.workflow.catalog.repositoryRoot`. Single-root workspaces auto-select the sole folder without a prompt.

### Accessibility (catalog)

- List rows expose `name`, validation badge text, and `workflow_id` as accessible names without relying on badge color alone.
- Diagnostic detail panels preserve heading structure and keyboard focus order when expanding a row.
- Disabled run affordance exposes the tooltip reason through `aria-disabled` and visible helper text.

## Primary code pointers (optional)

- `src/commands/WorkflowCatalogCommand.ts` — catalog open, refresh, and folder-selection commands.
- `src/commands/WorkflowGraphCommand.ts` — open and refresh graph webview (#26).
- `src/webview/workflows/` — catalog and graph webview UI (#25, #26).
- `src/webview/questions/` — human question panel webview (#27).
- `src/commands/QuestionPanelCommand.ts` — open question panel, draft/submit orchestration (#27).
- `src/workflows/resolvePendingHumanQuestions.ts` — artifact prompt resolution and projection fields (#27).
- `src/temporal/humanAnswerSubmit.ts` — Temporal update client wrapper (#27).
- `src/workflows/discoverWorkflowDefinitions.ts` — scan, validate, and build catalog entries.
- `src/workflows/buildWorkflowGraphModel.ts` — definition + run projection → graph model (#26).
- `src/workflows/buildRunInspectorDetail.ts` — selected node + projection → inspector payload (#28).
- `src/workflows/types.ts` — `WorkflowGraphModel`, `RunInspectorDetail`, node/edge visual state types (#26, #28).

## Managed-local Temporal surfaces

Managed-local Temporal startup and health use three v1 surfaces (full cockpit run visualization is out of scope for #18):

1. **Forge Output channel** (`Forge Temporal`) — chronological supervisor logs with `[forge.temporal.local]` prefix.
2. **VS Code notifications** — information notification when state becomes `ready`; error notification on `start_failed` including remediation steps (port conflict, missing packaged asset, permission denied).
3. **Status bar item** — left-aligned `$(pulse) Temporal: {state}` reflecting health states in `.ai/operations/observability.md` **Managed-local Temporal health states**.

Status bar tooltips include gRPC port, namespace, and persistence path (user-overridden paths may show basename only).

## UI copy (managed-local Temporal)

| Event | Notification / status copy |
|-------|---------------------------|
| Ready | "Forge Temporal ready — managed local dev server is accepting workflow runs." |
| Start failed (port) | "Forge could not start Temporal — port {port} is in use. Change `forge.temporal.managedLocal.grpcPort` or stop the conflicting process." |
| Start failed (asset) | "Forge could not start Temporal — dev server assets are missing from the extension package. Reinstall Forge Studio." |
| Start failed (permission) | "Forge could not start Temporal — cannot write persistence data to {path}. Check permissions or set `forge.temporal.managedLocal.persistencePath`." |
| Workflow blocked | "Workflow runs are blocked until Temporal is ready. See Forge Temporal output for details." |

## External Temporal surfaces

External-mode startup and health use the same three v1 surfaces as managed local:

1. **Forge Output channel** (`Forge Temporal`) — chronological connection logs with `[forge.temporal.external]` prefix.
2. **Notifications** — information on `ready`; error on `connect_failed` with remediation.
3. **Status bar item** — left-aligned `$(pulse) Temporal: {state}` reflecting **External Temporal health states** in `.ai/operations/observability.md`.

## UI copy (external Temporal)

| Situation | Copy |
|-----------|------|
| Ready | "Forge Temporal ready — connected to {namespace} at {address}." |
| Connect failed (auth) | "Forge could not connect to Temporal — authentication failed. Run **Forge: Set Temporal API Key** or check `forge.temporal.external.auth.mode`." |
| Connect failed (TLS) | "Forge could not connect to Temporal — TLS handshake failed at {address}. Verify `forge.temporal.external.tls.enabled` and cluster certificates." |
| Connect failed (address) | "Forge could not connect to Temporal — {address} is unreachable. Check `forge.temporal.external.address` and network access." |
| Connect failed (missing config) | "Forge Temporal configuration is incomplete — {field} is required for external mode. See Forge Temporal output." |
| Insecure mode warning | "Forge Temporal is using insecure (plaintext) gRPC to {address}. Use only for local development." |
| Workflow blocked | "Workflow runs are blocked until Temporal is ready. See Forge Temporal output for details." |
| Mode mismatch hint | "Setting {key} has no effect while `forge.temporal.mode` is {activeMode}." |

## Worker supervision surfaces

Worker health uses the same three v1 surfaces as Temporal connection health:

1. **Forge Output channel** (`Forge Temporal`) — supervisor logs with `[forge.temporal.worker]` prefix.
2. **VS Code notifications** — error notification on worker `start_failed` with remediation (missing packaged asset, permission denied, repeated crash).
3. **Status bar item** — worker segment reflecting **Worker health states** in `.ai/operations/observability.md` (compound with Temporal connection state).

## UI copy (worker supervision)

| Event | Notification / status copy |
|-------|---------------------------|
| Worker ready | _(optional information notification on first ready in session)_ |
| Start failed (asset) | "Forge could not start the workflow worker — worker assets are missing from the extension package. Reinstall Forge Studio." |
| Start failed (crash) | "Forge workflow worker stopped unexpectedly. See Forge Temporal output. Workflow runs are blocked until the worker is healthy." |
| Worker blocked run | "Workflow runs are blocked until the Forge worker is ready. See Forge Temporal output for details." |
| Extension upgrade restart | "Forge updated the workflow worker for this window." _(Output channel info; no blocking notification)_ |

## Run recovery surfaces

Run recovery (#21) uses the Forge Temporal Output channel and a minimal run list (full cockpit graph out of scope):

1. **Forge Output channel** (`Forge Temporal`) — recovery scan logs with `[forge.temporal.recovery]` prefix.
2. **Command palette** — **Forge: Refresh workflow runs** for manual re-scan.
3. **Run list** — per-run recovery badge, cancel, dismiss orphaned, and human-input panel when `synced`.

### Workflow Runs refresh after Start Run (#81)

After Temporal accepts a Start Run request and Forge appends the `WorkflowRunIndexEntry`, the extension immediately notifies the left-panel **Workflow Runs** tree to refresh. The refresh is local to the run index and projection cache; it does not issue a second Temporal start and does not auto-open the graph monitor.

| Situation | Run list behavior |
|-----------|-------------------|
| No indexed runs before success | Replace the empty tree with the newly appended run row. |
| Existing indexed runs before success | Insert the new row according to normal run-list ordering, newest `startedAt` first. |
| New row before projection sync | Show the existing `recovery_pending` badge copy "Recovering…" and block run-scoped actions. |
| Projection sync succeeds | Update the row to the synced badge, current status, and allowed actions from recovery-state rules. |
| Projection refresh fails or Temporal is not ready | Keep the row visible with `refresh_failed` or `unreachable` recovery copy and expose manual refresh where allowed. |

Blocked starts and failed starts that do not return Temporal identity do not append a run-index entry and do not add a Workflow Runs row. If run-index persistence fails after Temporal accepted the start, Forge reports the post-start recovery diagnostic and leaves the run list unchanged because there is no indexed entry to display.

### View graph from Workflow Runs rows (#82)

Every row backed by a persisted `WorkflowRunIndexEntry` exposes **View graph** as a run-list action. Selecting it opens the existing graph webview in run mode using that row's `workflow_id`, `repositoryRoot`, `namespace`, `workflowId`, and `runId`; it does not depend on the catalog-selected workflow and does not create a second Temporal start.

New rows produced by a successful Start Run expose the same action after the Workflow Runs view refreshes. Forge keeps the Start Run success feedback in place and leaves graph opening to this row action.

| Row condition | View graph behavior |
|---------------|---------------------|
| Indexed row with `recoveryState === synced` | Open run-mode graph and refresh projection through the normal graph refresh cadence. |
| Indexed row with `recoveryState` of `recovery_pending`, `refresh_failed`, or `unreachable` | Keep the row visible and block graph opening with visible recovery helper copy from **Run recovery states**. |
| Indexed row with `recoveryState === orphaned` | Do not open graph; show stale/orphaned copy and keep dismiss recovery action available. |
| Row action invoked without a current index entry | Show "The selected workflow run is no longer indexed." and do not open a graph panel. |

## UI copy (run recovery)

| Event | Copy |
|-------|------|
| Automatic recovery start | "Recovering workflow runs for this window…" _(Output channel info)_ |
| Recovery complete | "Recovered {count} workflow run(s)." _(Output channel info when count > 0)_ |
| Refresh failed | "Could not refresh run {workflowId}/{runId} — {reason}. Try **Forge: Refresh workflow runs**." |
| Orphaned run | "This run is no longer in Temporal. You can dismiss it from the run list." |
| Cancel confirm | "Cancel workflow run {workflowId}/{runId}? This terminates execution in Temporal." |
| Actions blocked | "Run actions are unavailable until recovery finishes. See Forge Temporal output." |
| Human input blocked | "Submit answers after the run finishes recovering." |

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Start Run UX

Resolved for v1. Required workflow inputs are collected through the inline catalog row form described in **Start Run input collection (v1)**. Disabled reasons, validation message placement, success copy, no-parameters fast path behavior, accessible labels, keyboard order, Workflow Runs refresh behavior after accepted start, and **View graph** availability from refreshed run rows are defined in **Workflow discovery catalog (#25)**, **Start Run input collection (v1)**, **Workflow Runs refresh after Start Run (#81)**, and **View graph from Workflow Runs rows (#82)**.

_(Workflow graph visual states and cockpit graph UI copy resolved in **Workflow Visualization (#26)** above.)_

_(Human question panel surfaces, draft behavior, staleness copy, and submit flow resolved in **Human question panel (#27)** above.)_

_(Run inspector surfaces, artifact preview limits, recovery action catalog, UI copy, and redaction rules resolved in **Run Inspector (#28)** above.)_
