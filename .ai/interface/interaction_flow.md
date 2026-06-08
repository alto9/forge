# Interaction Flow

Forge workflow interaction moves from discovery to validated execution without hiding pauses or failures.

## Flow

1. Forge discovers workflow definitions from `.ai/workflows/*.json` and shows catalog health.
2. The user selects a workflow and reviews its graph, required inputs, Temporal mode, validators, and expected artifacts.
3. Forge starts the run through Temporal after preflight validation succeeds.
4. The run view updates from Temporal-backed state and highlights the active node in React Flow.
5. Cursor SDK activities run as bounded workflow activities and return provisional envelopes.
6. Deterministic validators accept or reject outputs before downstream steps proceed.
7. Human question steps pause the run, present required questions, and resume through Temporal signals or updates after the user answers.
8. Completion presents validated artifacts and any GitHub delivery state that the workflow intentionally created or updated.

`/refine-issue` follows this generic flow as the first proving workflow.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
