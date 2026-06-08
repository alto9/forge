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

## External Temporal health states

Forge exposes these named health states when `forge.temporal.mode` is `external`:

| State | Meaning | User-visible surfaces |
|-------|---------|----------------------|
| `idle` | External mode selected; connection not yet requested | Status bar: "Temporal: idle" |
| `connecting` | Resolving settings, loading credentials, gRPC/TLS handshake in progress | Output channel logs; status bar: "Temporal: connecting…" |
| `ready` | Preflight succeeded: reachable endpoint, namespace access, auth accepted | Notification: "Forge Temporal ready"; status bar: "Temporal: ready" |
| `unhealthy` | Connected but repeated health probe failed, or task queue has no polling worker (#20) | Output channel warning; status bar: "Temporal: unhealthy" |
| `connect_failed` | Address unreachable, TLS failure, auth rejected, or missing required config/secret | Notification (error) with remediation; status bar: "Temporal: failed"; workflow runs blocked |
| `disconnected` | Previously ready connection lost | Output channel warning; status bar: "Temporal: disconnected" |

Diagnostic log lines for external mode use prefix `[forge.temporal.external]` and include `address` (host:port only), `namespace`, `authMode`, `tlsEnabled`, and probe error codes. API keys, certificates, and Authorization material are never logged.

Worker health states are defined in #20 refinement.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Health and diagnostics (remaining)
- Define worker health state names and log redaction rules for Cursor SDK and GitHub activity diagnostics (#20).
- Define user-visible recovery states for in-flight run reconnection (#21).
