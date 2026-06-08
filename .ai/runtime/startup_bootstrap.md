# Startup Bootstrap

On activation, Forge prepares workflow capability without starting arbitrary workflow work.

## Startup Responsibilities

- Detect the active repository context and discover `.ai/workflows/*.json` definitions.
- Run pre-run validation (`.ai/business_logic/domain_model.md` pre-run scope) via shared workflow modules so discovery can report catalog health and run-start gates can block invalid definitions.
- Resolve configured Temporal mode (`forge.temporal.mode`) and connection readiness for the current VS Code window.
- In managed local mode, start or attach to the **window-scoped** npm-bundled Temporal dev server only when workflow capability needs it (first workflow run or explicit readiness check). Do not start a dev server per workspace folder in multi-root windows.
- In external mode, run connection preflight (settings, SecretStorage credential binding, gRPC/TLS/auth probe) lazily on first workflow run or explicit readiness check. Do not connect on every activation.
- Publish managed-local startup progress to the Forge Output channel, status bar health item, and notifications per `.ai/interface/presentation.md` **Managed-local Temporal surfaces**.
- Publish external connection progress to the same surfaces per `.ai/interface/presentation.md` **External Temporal surfaces**.
- If managed-local startup fails, block workflow run creation, surface remediation steps, and do not auto-fallback to external mode.
- If external preflight fails, block workflow run creation, surface remediation steps, and do not auto-fallback to managed-local mode.
- Start or attach to worker supervision outside the VS Code extension host when workflow execution is enabled (#20).
- Rebuild visible projections for in-flight runs by reconnecting to Temporal rather than trusting stale local UI state (#21).

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
