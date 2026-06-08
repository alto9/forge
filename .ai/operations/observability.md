# Observability

Forge observability makes workflow health, validation state, and recovery actions visible without exposing secrets.

## Observable Signals

- Workflow definition discovery and validation status.
- Temporal connection health, namespace, task queue readiness, and worker availability.
- Workflow run state, current node, pending timers, pending human questions, retry state, and cancellation state.
- Cursor SDK activity status, run identifiers, failure summaries, and artifact references.
- Validator outcomes for schema, artifact, and domain checks.
- GitHub activity failures and rate or auth blockers.
- Recovery actions after extension restart, worker restart, or Temporal reconnect.

## Managed-local Temporal health states

Forge exposes these named health states for the window-scoped managed-local dev server:

| State | Meaning | User-visible surfaces |
|-------|---------|----------------------|
| `idle` | Mode is managed local; server not yet requested | Status bar: "Temporal: idle" |
| `starting` | Dev server child process launching | Output channel logs; status bar: "Temporal: starting…" |
| `ready` | gRPC reachable on configured port and namespace ready | Notification: "Forge Temporal ready"; status bar: "Temporal: ready" |
| `unhealthy` | Process running but health probe failed | Output channel warning; status bar: "Temporal: unhealthy" |
| `start_failed` | Could not start (port conflict, missing asset, permission) | Notification (error) with remediation; status bar: "Temporal: failed"; workflow runs blocked |
| `stopped` | Supervised process exited after graceful shutdown | Status bar: "Temporal: stopped" |

Diagnostic log lines in the Forge Output channel use prefix `[forge.temporal.local]` and include `windowId`, `grpcPort`, `persistencePath` (redacted if user-overridden to a sensitive path), and `exitCode` on failure. Secrets and credential material are never logged.

Worker health states are defined in #20 refinement.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Health and diagnostics (remaining)
- Define worker health state names and log redaction rules for Cursor SDK and GitHub activity diagnostics (#20).
- Define user-visible recovery states for in-flight run reconnection (#21).
