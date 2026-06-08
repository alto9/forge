# User Stories

Forge workflow users need a durable way to run staged AI delivery workflows from repo-owned definitions while keeping GitHub as delivery truth.

## Current Stories

- As a maintainer, I can define a workflow in `.ai/workflows/*.json` so the workflow graph, validators, artifacts, and human questions are versioned with the repository.
- As a maintainer, I can start a configured workflow without requiring Forge to hard-code that workflow's phases into application code.
- As a workflow operator, I can see where a run is paused, failed, retrying, waiting for a human answer, or complete.
- As a workflow operator, I can answer human questions inside Forge and have the run resume through Temporal.
- As a maintainer, I can trust that agent outputs are provisional until schema, artifact, and domain validators accept them.
- As an engineer, I can use `/refine-issue` as the first proving workflow while preserving the same model for future workflows.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
