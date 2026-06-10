# Messaging Async

Temporal is the asynchronous coordination layer for Forge workflow runs.

## Async Flow

- Forge starts a workflow run through a Temporal client after validating the selected workflow definition, declared run inputs, runtime configuration, Temporal readiness, and worker readiness.
- Successful start returns Temporal identifiers. Forge writes the window-scoped run index entry, refreshes the left-panel run list, and lets the user open the graph from that run row; v1 does not auto-open the monitor after start.
- Temporal schedules activities, persists workflow history, applies retry policy, waits for timers, and records recovery state.
- Worker processes execute workflow and activity code outside the VS Code extension host. The extension host uses the Temporal client only; v1 coordination between commands and worker execution is through Temporal (start workflow, signal, query, task queue polling), not a direct IPC message bus.
- Human question pauses are represented as Temporal workflow waits. v1 resumes through workflow update `forge.human_answer.submit` (see `.ai/integration/api_contracts.md` **Human answer update**). The extension writes declared artifact answers locally, then sends the update; the worker validates payload shape before unblocking the wait.
- Forge polls or queries run state every **2 seconds** while the question panel webview is visible and the run is non-terminal with `recoveryState === synced`, matching graph run overlay cadence.
- Forge subscribes to or polls run state to build the UI projection shown in Forge Studio.
- Activity output validation happens before workflow continuation. Failed validation leaves the run at a visible blocked state.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
