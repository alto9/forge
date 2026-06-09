# Index

This document defines Forge Studio workflow discovery, graph visualization, run inspection, and human question interaction.

## Scope

- Discover repo-owned workflow definitions from `.ai/workflows/*.json` and present catalog health in Forge Studio (#25).
- Present workflow definitions and run state with React Flow plus accessible textual summaries (#26+).
- Show Temporal-backed run state, validation outcomes, artifacts, and available actions.
- Collect human answers only for declared workflow pause points.
- Keep `/refine-issue` visible as a proving workflow without one-off UI semantics.

## Primary code pointers (optional)

- `src/commands/WorkflowCatalogCommand.ts` — catalog open, refresh, repository folder selection.
- `src/commands/WorkflowGraphCommand.ts` — graph open and refresh (#26).
- `src/webview/workflows/` — workflow catalog and graph webview.
- `src/workflows/discoverWorkflowDefinitions.ts` — discovery scan and pre-run validation index.
- `src/workflows/buildWorkflowGraphModel.ts` — workflow graph model builder (#26).
- Keep entries concise and remove stale pointers.
