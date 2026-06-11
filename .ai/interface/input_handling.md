# Input Handling

Forge workflow input handling accepts user intent without bypassing workflow validation or Temporal state.

## Inputs

- Workflow selection starts from discovered `.ai/workflows/*.json` definitions in the active repository context.
- **Repository folder selection (#25):** In multi-root workspaces, the user picks one workspace folder before catalog scan. Forge persists `forge.workflow.catalog.repositoryRoot` in `workspaceState` for the window and re-prompts when that folder is removed. Single-root workspaces skip the picker. **Forge: Select Workflow Repository Folder** lets the user change the active folder without reopening the catalog.
- **Catalog selection (#25):** Clicking a catalog row sets `forge.workflow.catalog.selectedWorkflowId` for the active `repositoryRoot`. Invalid definitions remain selectable for inspection; Start Run is blocked until pre-run validation passes.
- **Catalog refresh (#25):** Re-scan on panel open, on `.ai/workflows/` file changes under the selected folder, and when the user runs **Forge: Refresh Workflow Catalog**.
- **Graph open (#26):** **Forge: Open Workflow Graph** requires a catalog-selected workflow with pre-run validation passing (no `severity: error` diagnostics). Invalid selections show a notification: "Fix validation errors before opening the workflow graph."
- **Graph refresh (#26):** Re-fetch projection on panel open (run mode), every **2 seconds** while the graph webview is visible and the run is non-terminal with `recoveryState === synced`, on **Forge: Refresh Workflow Graph**, and when **Forge: Refresh workflow runs** completes for the displayed run.
- **Graph from run list (#26, #82):** Selecting **View graph** on a run list row opens the graph webview in run mode for that index entry's `workflow_id`, `repositoryRoot`, and Temporal IDs. The action requires a current `WorkflowRunIndexEntry`; recovery-blocked or orphaned rows show visible helper copy instead of opening stale run state.
- **Run inspector selection (#28):** Clicking a graph node or step list row in run mode sets the inspector's `selected_node_id` and loads `RunInspectorDetail` for that node. Definition mode selection loads definition-only detail (no envelopes or recovery actions).
- **Run inspector actions (#28):** **Cancel run**, **Refresh**, **Open in editor**, **Copy path**, **Copy diagnostic**, **Copy Cursor run ID**, and **Answer in question panel** follow enablement in `.ai/interface/presentation.md` **Recovery action catalog (v1)**. Actions require `recoveryState === synced` except **Refresh**, which may trigger projection fetch during recovery.
- **Start Run input:** captures the selected workflow, target repository or workspace, declared `run_inputs[]` values, and confirmed Temporal mode. Workflows with no required inputs use a fast path after validation and readiness gates pass.
- **Start Run validation:** disabled or blocked states explain definition errors, undeclared submitted input keys, missing or empty required inputs, non-string submitted input values, Temporal readiness failures, and worker readiness failures before Forge creates a durable Temporal run.
- **Start Run success (#83):** shows immediate catalog row copy ("Workflow run started."), keeps the catalog webview open and focused, refreshes the left-panel Workflow Runs view (#81), and leaves graph opening to the run row **View graph** action (#82). Forge does not show a VS Code success notification or auto-open the monitoring graph from the catalog start handler in v1.
- For `refine-issue`, required run input is `issue_ref` (see `.ai/business_logic/domain_model.md` **Run inputs**). Forge accepts a GitHub issue URL, `owner/repo#N`, a bare issue number when repository context can be inferred, or a GitHub Projects v2 project identifier plus issue number, then passes the normalized working parent issue to downstream activities after `normalize_issue_parentage`.
- **Human question input (#27):** collected only when the selected run has `recoveryState === synced`, a `waitingNodeId` on a `human_question` node, and a matching entry in `pendingHumanQuestions`. Submit is disabled otherwise (see **Run recovery surfaces** copy in `.ai/interface/presentation.md`).
- **Draft input:** textarea and field edits persist to `workspaceState` drafts per run and `question_id` until the operator submits or the question becomes stale.
- **Submit:** validates required fields, writes declared `artifact_targets` to disk, then sends Temporal workflow update `forge.human_answer.submit` (or node `resume_update` override). See `.ai/data/serialization.md` **Human answer submission**.
- **markdown_batch mode:** refine-issue `user_verification_batch` presents 3–5 numbered prompts per submit (blockers first), parsed from `user_questions.md`; answers append to `refinement.md` under the matching question headings.
- **Stale run guard:** when projection refresh shows `waitingNodeId` no longer matches the open question's `node_id`, discard draft and show "This question is no longer active for this run."
- Retry, cancel, continue, and inspect actions are available only when the current run state supports them.
- Inputs that affect GitHub, filesystem artifacts, Temporal, or Cursor SDK activity execution must be tied to a visible workflow step and validation path.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
