# Deployment Environments

Forge workflow execution supports local IDE use and externally managed Temporal environments.

## Supported Modes

- **Managed local** mode runs the Forge extension, Forge Studio UI, worker supervision (#20), and one **window-scoped** Temporal dev server per VS Code window for single-user workflow runs. The dev server is started from npm-bundled assets via a supervised child Node process; no separate Temporal CLI install is required.
- **External** or Cloud Temporal mode connects Forge and workers to a configured Temporal endpoint and namespace (#19).
- Both modes use the same repo-owned workflow definition model under `.ai/workflows/*.json`.
- Workers run outside the VS Code extension host in both modes.
- Mode selection changes connection and supervision behavior, not workflow definition semantics.

## Managed-local lifecycle

- **Scope:** one dev server instance per VS Code window, shared across multi-root workspace folders in that window.
- **Start:** lazy on first workflow run or explicit readiness check when `forge.temporal.mode` is `managedLocal`.
- **Persistence:** dev server data directory defaults to `{extensionGlobalStorage}/temporal/{windowId}/` (overridable via `forge.temporal.managedLocal.persistencePath`). Data survives extension restart for #21 recovery.
- **Stop:** Forge gracefully stops the supervised dev server child process on window close or extension deactivate. Persistence files remain unless the user clears the data directory.
- **Failure:** startup errors block workflow runs with remediation guidance; Forge does not auto-fallback to external mode.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
