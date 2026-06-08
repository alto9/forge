# Lifecycle Shutdown

Shutdown preserves durable workflow state while stopping Forge-owned local resources safely.

## Shutdown Rules

- Forge stops or disconnects UI subscriptions and local run projections without treating shutdown as workflow failure.
- Forge-owned worker child processes are stopped gracefully when the extension is responsible for their lifecycle. On crash, Forge attempts supervised restart with exponential backoff (cap 30s) until `start_failed`. When the packaged extension version differs from `worker-manifest.json`, Forge stops and restarts the worker on the next readiness check so in-flight Temporal runs remain durable while worker code updates.
- Managed local Temporal dev server child processes are stopped gracefully when the VS Code **window** closes or the extension deactivates. Persistence under `{extensionGlobalStorage}/temporal/{windowId}/` remains for #21 recovery; Forge does not delete persistence files on shutdown.
- External or Cloud Temporal connections are closed without attempting to stop the external service.
- In-flight workflow runs remain recoverable through Temporal after extension restart.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
