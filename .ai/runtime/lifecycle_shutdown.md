# Lifecycle Shutdown

Shutdown preserves durable workflow state while stopping Forge-owned local resources safely.

## Shutdown Rules

- Forge stops or disconnects UI subscriptions and local run projections without treating shutdown as workflow failure.
- Forge-owned worker child processes are stopped gracefully when the extension is responsible for their lifecycle.
- Managed local Temporal processes are stopped according to the configured local mode policy, while their durable state remains available for recovery.
- External or Cloud Temporal connections are closed without attempting to stop the external service.
- In-flight workflow runs remain recoverable through Temporal after extension restart.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
