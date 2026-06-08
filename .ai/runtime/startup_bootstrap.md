# Startup Bootstrap

On activation, Forge prepares workflow capability without starting arbitrary workflow work.

## Startup Responsibilities

- Detect the active repository context and discover `.ai/workflows/*.json` definitions.
- Validate workflow definition structure enough to show catalog health and prevent invalid starts.
- Resolve configured Temporal mode and connection readiness.
- In managed local mode, prepare or start the local Temporal service only when workflow capability needs it.
- Start or attach to worker supervision outside the VS Code extension host when workflow execution is enabled.
- Rebuild visible projections for in-flight runs by reconnecting to Temporal rather than trusting stale local UI state.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
