# Messaging Async

Temporal is the asynchronous coordination layer for Forge workflow runs.

## Async Flow

- Forge starts a workflow run through a Temporal client after validating the selected workflow definition and runtime configuration.
- Temporal schedules activities, persists workflow history, applies retry policy, waits for timers, and records recovery state.
- Worker processes execute workflow and activity code outside the VS Code extension host. The extension host uses the Temporal client only; v1 coordination between commands and worker execution is through Temporal (start workflow, signal, query, task queue polling), not a direct IPC message bus.
- Human question pauses are represented as Temporal waits and resumed through declared signals or updates.
- Forge subscribes to or polls run state to build the UI projection shown in Forge Studio.
- Activity output validation happens before workflow continuation. Failed validation leaves the run at a visible blocked state.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
