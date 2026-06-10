# Startup Bootstrap

On activation, Forge prepares workflow capability without starting arbitrary workflow work.

## Startup Responsibilities

- Detect the active repository context and discover `.ai/workflows/*.json` definitions.
- Run pre-run validation (`.ai/business_logic/domain_model.md` pre-run scope) via shared workflow modules so discovery can report catalog health and run-start gates can block invalid definitions.
- Make declared `run_inputs[]` available to catalog and Start Run surfaces so required inputs can be collected before Temporal start.
- Resolve configured Temporal mode (`forge.temporal.mode`) and connection readiness for the current VS Code window.
- In managed local mode, start or attach to the **window-scoped** npm-bundled Temporal dev server only when workflow capability needs it (first workflow run or explicit readiness check). Do not start a dev server per workspace folder in multi-root windows.
- In external mode, run connection preflight (settings, SecretStorage credential binding, gRPC/TLS/auth probe) lazily on first workflow run or explicit readiness check. Do not connect on every activation.
- Publish managed-local startup progress to the Forge Output channel, status bar health item, and notifications per `.ai/interface/presentation.md` **Managed-local Temporal surfaces**.
- Publish external connection progress to the same surfaces per `.ai/interface/presentation.md` **External Temporal surfaces**.
- If managed-local startup fails, block workflow run creation, surface remediation steps, and do not auto-fallback to external mode.
- If external preflight fails, block workflow run creation, surface remediation steps, and do not auto-fallback to managed-local mode.
- Start or attach to worker supervision outside the VS Code extension host when workflow execution is enabled. Worker start is **lazy**: same trigger as Temporal readiness (first workflow run or explicit readiness check). Forge supervises one worker child process per VS Code window, shared across multi-root folders. The worker starts only after Temporal connection health is `ready`. Extension host runs the Temporal client; the worker polls the configured task queue and executes workflow and activity code. v1 has no direct extension↔worker RPC; coordination is through Temporal APIs only.
- After Temporal connection and supervised worker both reach `ready`, run **automatic recovery** once per window session: load `{extensionGlobalStorage}/temporal/{windowId}/run-index.json`, refresh projections for all **non-terminal** entries from Temporal, and set `recoveryState` per `.ai/operations/observability.md`. Do not trust stale cached projections without a Temporal query.
- Purge expired completed index entries (30-day retention, 100-entry cap) on index load before recovery scan.
- Register a **Forge: Refresh workflow runs** command for manual re-scan of all indexed runs (non-terminal and completed within retention).

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
