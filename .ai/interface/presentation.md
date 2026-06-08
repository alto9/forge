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

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Workflow visual states
- Define node and edge visual states for idle, active, waiting, validating, retrying, failed, cancelled, completed, and skipped states.
- Define UI copy for workflow start, pending human questions, validation failure, retry approval, cancellation, and external Temporal connectivity (#19).
