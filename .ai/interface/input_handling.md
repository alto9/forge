# Input Handling

Forge workflow input handling accepts user intent without bypassing workflow validation or Temporal state.

## Inputs

- Workflow selection starts from discovered `.ai/workflows/*.json` definitions in the active repository context.
- **Repository folder selection (#25):** In multi-root workspaces, the user picks one workspace folder before catalog scan. Forge persists `forge.workflow.catalog.repositoryRoot` in `workspaceState` for the window and re-prompts when that folder is removed. Single-root workspaces skip the picker. **Forge: Select Workflow Repository Folder** lets the user change the active folder without reopening the catalog.
- **Catalog selection (#25):** Clicking a catalog row sets `forge.workflow.catalog.selectedWorkflowId` for the active `repositoryRoot`. Invalid definitions remain selectable for inspection; run start is blocked until pre-run validation passes (placeholder control only in #25).
- **Catalog refresh (#25):** Re-scan on panel open, on `.ai/workflows/` file changes under the selected folder, and when the user runs **Forge: Refresh Workflow Catalog**.
- **Graph open (#26):** **Forge: Open Workflow Graph** requires a catalog-selected workflow with pre-run validation passing (no `severity: error` diagnostics). Invalid selections show a notification: "Fix validation errors before opening the workflow graph."
- **Graph refresh (#26):** Re-fetch projection on panel open (run mode), every **2 seconds** while the graph webview is visible and the run is non-terminal with `recoveryState === synced`, on **Forge: Refresh Workflow Graph**, and when **Forge: Refresh workflow runs** completes for the displayed run.
- **Graph from run list (#26):** Selecting **View graph** (or equivalent) on a run list row opens the graph webview in run mode for that index entry's `workflow_id`, `repositoryRoot`, and Temporal IDs.
- Run start input captures the selected workflow, target repository or workspace, required parameters, and confirmed Temporal mode.
- For `refine-issue`, required run input is `issue_ref` (see `.ai/business_logic/domain_model.md` **Run inputs**). Forge passes the normalized working parent issue to downstream activities after `normalize_issue_parentage`.
- Human question input is collected only when a workflow run is waiting for a declared question. The answer is submitted through the workflow's declared Temporal signal or update.
- Retry, cancel, continue, and inspect actions are available only when the current run state supports them.
- Inputs that affect GitHub, filesystem artifacts, Temporal, or Cursor SDK activity execution must be tied to a visible workflow step and validation path.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
