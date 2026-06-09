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
| Run starting (placeholder until run index exists) | "Start a workflow run to see live progress." _(disabled in #26 if run-start not yet shipped; graph stays in definition mode)_ |
| Recovery banner (`recovery_pending`) | "Recovering run state…" |
| Recovery banner (`refresh_failed`) | "Could not refresh run state. Try **Forge: Refresh Workflow Graph**." |
| Recovery banner (`unreachable`) | "Waiting for Temporal…" |
| Validation failed node detail | "Validation failed — see diagnostics in run inspector (#28)." |
| Retry detail | "Automatic retry {attempt} of {max}" |
| Pending human question | "Waiting for your answers — continue in the question panel (#27)." |
| Graph empty / no selection | "Select a workflow in the catalog, then open the graph." |

## Run Inspector

The run inspector presents the selected node, activity details, validation outcomes, artifact references, Cursor SDK run identity, retry state, and available user actions. Human question panels use the workflow definition to describe required input and submit answers through Temporal.

## Workflow discovery catalog (#25)

Forge Studio exposes repo-owned workflow definitions through a read-only catalog before run visualization or execution controls.

### Surfaces (v1)

1. **Command palette** — **Forge: Open Workflow Catalog** opens the catalog webview panel.
2. **Command palette** — **Forge: Refresh Workflow Catalog** re-scans the selected repository folder.
3. **Command palette** — **Forge: Select Workflow Repository Folder** changes the active folder in multi-root workspaces.
4. **Catalog webview** — flat list of discovered definitions with validation badges, metadata, and selection highlight.

Run start, graph preview, and Temporal controls are out of scope for the catalog v1 surface (#25). Selected workflow identity is persisted for downstream cockpit milestones.

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
- Invalid rows (any pre-run diagnostic with `severity: error`) remain selectable for inspection. A disabled **Start run** affordance (or equivalent placeholder control) shows tooltip: "Fix validation errors before starting a run."
- Valid rows show the same placeholder control enabled with tooltip: "Run start ships in a later milestone." (#25 does not invoke Temporal.)

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
- `src/workflows/discoverWorkflowDefinitions.ts` — scan, validate, and build catalog entries.
- `src/workflows/buildWorkflowGraphModel.ts` — definition + run projection → graph model (#26).
- `src/workflows/types.ts` — `WorkflowGraphModel`, node/edge visual state types (#26).

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

_(Workflow graph visual states and cockpit graph UI copy resolved in **Workflow Visualization (#26)** above.)_
