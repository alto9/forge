# Interaction Flow

Forge workflow interaction moves from discovery to validated execution without hiding pauses or failures.

## Flow

1. Forge discovers workflow definitions from `.ai/workflows/*.json` and shows catalog health.
2. The user selects a workflow and reviews its graph, required inputs, Temporal mode, validators, and expected artifacts.
3. Forge starts the run through Temporal after preflight validation succeeds.
4. The run view updates from Temporal-backed state and highlights the active node in React Flow.
5. The operator selects nodes in the graph step list or canvas to inspect activity output, validation diagnostics, artifact previews, retry state, and recovery actions in the **run inspector** detail panel (#28).
6. Cursor SDK activities run as bounded workflow activities and return provisional envelopes.
7. Deterministic validators accept or reject outputs before downstream steps proceed.
8. Human question steps pause the run. Forge shows the **Question panel** (#27) with prompts resolved from declared artifacts or node metadata. The operator may edit draft answers, submit when `recoveryState === synced`, and the extension writes artifact targets then sends workflow update `forge.human_answer.submit`. Temporal unblocks the wait; projection refresh shows the run advancing. refine-issue loops Phase C until tier-User blockers resolve (`check_user_blockers`). The run inspector links to the question panel but does not duplicate answer forms.
9. Completion presents validated artifacts and any GitHub delivery state that the workflow intentionally created or updated.

`/refine-issue` follows this generic flow as the first proving workflow.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
