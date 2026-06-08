# Input Handling

Forge workflow input handling accepts user intent without bypassing workflow validation or Temporal state.

## Inputs

- Workflow selection starts from discovered `.ai/workflows/*.json` definitions in the active repository context.
- Run start input captures the selected workflow, target repository or workspace, required parameters, and confirmed Temporal mode.
- Human question input is collected only when a workflow run is waiting for a declared question. The answer is submitted through the workflow's declared Temporal signal or update.
- Retry, cancel, continue, and inspect actions are available only when the current run state supports them.
- Inputs that affect GitHub, filesystem artifacts, Temporal, or Cursor SDK activity execution must be tied to a visible workflow step and validation path.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
