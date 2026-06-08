# Presentation

Forge Studio presents workflows as both definitions and live runs.

## Workflow Visualization

React Flow is the visualization layer for workflow definitions and run state. Definition views show nodes, transitions, validators, human input points, activities, and artifact outputs. Run views overlay Temporal-backed state such as active step, completed steps, failed steps, retries, waits, validation failures, and pending human questions.

## Run Inspector

The run inspector presents the selected node, activity details, validation outcomes, artifact references, Cursor SDK run identity, retry state, and available user actions. Human question panels use the workflow definition to describe required input and submit answers through Temporal.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.

## Managed-local Temporal surfaces

Managed-local Temporal startup and health use three v1 surfaces (full cockpit run visualization is out of scope for #18):

1. **Forge Output channel** (`Forge Temporal`) — chronological supervisor logs with `[forge.temporal.local]` prefix.
2. **VS Code notifications** — information notification when state becomes `ready`; error notification on `start_failed` including remediation steps (port conflict, missing packaged asset, permission denied).
3. **Status bar item** — left-aligned `$(pulse) Temporal: {state}` reflecting health states in `.ai/operations/observability.md` **Managed-local Temporal health states**.

Status bar tooltips include gRPC port, namespace, and persistence path (user-overridden paths may show basename only).

## UI copy (managed-local Temporal)

| Event | Notification / status copy |
|-------|---------------------------|
| Ready | "Forge Temporal ready — managed local dev server is accepting workflow runs." |
| Start failed (port) | "Forge could not start Temporal — port {port} is in use. Change `forge.temporal.managedLocal.grpcPort` or stop the conflicting process." |
| Start failed (asset) | "Forge could not start Temporal — dev server assets are missing from the extension package. Reinstall Forge Studio." |
| Start failed (permission) | "Forge could not start Temporal — cannot write persistence data to {path}. Check permissions or set `forge.temporal.managedLocal.persistencePath`." |
| Workflow blocked | "Workflow runs are blocked until Temporal is ready. See Forge Temporal output for details." |

## External Temporal surfaces

External-mode startup and health use the same three v1 surfaces as managed local:

1. **Forge Output channel** (`Forge Temporal`) — chronological connection logs with `[forge.temporal.external]` prefix.
2. **Notifications** — information on `ready`; error on `connect_failed` with remediation.
3. **Status bar item** — left-aligned `$(pulse) Temporal: {state}` reflecting **External Temporal health states** in `.ai/operations/observability.md`.

## UI copy (external Temporal)

| Situation | Copy |
|-----------|------|
| Ready | "Forge Temporal ready — connected to {namespace} at {address}." |
| Connect failed (auth) | "Forge could not connect to Temporal — authentication failed. Run **Forge: Set Temporal API Key** or check `forge.temporal.external.auth.mode`." |
| Connect failed (TLS) | "Forge could not connect to Temporal — TLS handshake failed at {address}. Verify `forge.temporal.external.tls.enabled` and cluster certificates." |
| Connect failed (address) | "Forge could not connect to Temporal — {address} is unreachable. Check `forge.temporal.external.address` and network access." |
| Connect failed (missing config) | "Forge Temporal configuration is incomplete — {field} is required for external mode. See Forge Temporal output." |
| Insecure mode warning | "Forge Temporal is using insecure (plaintext) gRPC to {address}. Use only for local development." |
| Workflow blocked | "Workflow runs are blocked until Temporal is ready. See Forge Temporal output for details." |
| Mode mismatch hint | "Setting {key} has no effect while `forge.temporal.mode` is {activeMode}." |

## Worker supervision surfaces

Worker health uses the same three v1 surfaces as Temporal connection health:

1. **Forge Output channel** (`Forge Temporal`) — supervisor logs with `[forge.temporal.worker]` prefix.
2. **VS Code notifications** — error notification on worker `start_failed` with remediation (missing packaged asset, permission denied, repeated crash).
3. **Status bar item** — worker segment reflecting **Worker health states** in `.ai/operations/observability.md` (compound with Temporal connection state).

## UI copy (worker supervision)

| Event | Notification / status copy |
|-------|---------------------------|
| Worker ready | _(optional information notification on first ready in session)_ |
| Start failed (asset) | "Forge could not start the workflow worker — worker assets are missing from the extension package. Reinstall Forge Studio." |
| Start failed (crash) | "Forge workflow worker stopped unexpectedly. See Forge Temporal output. Workflow runs are blocked until the worker is healthy." |
| Worker blocked run | "Workflow runs are blocked until the Forge worker is ready. See Forge Temporal output for details." |
| Extension upgrade restart | "Forge updated the workflow worker for this window." _(Output channel info; no blocking notification)_ |

## Run recovery surfaces

Run recovery (#21) uses the Forge Temporal Output channel and a minimal run list (full cockpit graph out of scope):

1. **Forge Output channel** (`Forge Temporal`) — recovery scan logs with `[forge.temporal.recovery]` prefix.
2. **Command palette** — **Forge: Refresh workflow runs** for manual re-scan.
3. **Run list** — per-run recovery badge, cancel, dismiss orphaned, and human-input panel when `synced`.

## UI copy (run recovery)

| Event | Copy |
|-------|------|
| Automatic recovery start | "Recovering workflow runs for this window…" _(Output channel info)_ |
| Recovery complete | "Recovered {count} workflow run(s)." _(Output channel info when count > 0)_ |
| Refresh failed | "Could not refresh run {workflowId}/{runId} — {reason}. Try **Forge: Refresh workflow runs**." |
| Orphaned run | "This run is no longer in Temporal. You can dismiss it from the run list." |
| Cancel confirm | "Cancel workflow run {workflowId}/{runId}? This terminates execution in Temporal." |
| Actions blocked | "Run actions are unavailable until recovery finishes. See Forge Temporal output." |
| Human input blocked | "Submit answers after the run finishes recovering." |

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Workflow visual states
- Define node and edge visual states for idle, active, waiting, validating, retrying, failed, cancelled, completed, and skipped states.
- Define UI copy for workflow start, pending human questions, validation failure, retry approval, and cancellation (cockpit run visualization; out of scope for #19 external connectivity).
