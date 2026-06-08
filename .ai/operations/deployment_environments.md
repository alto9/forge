# Deployment Environments

Forge workflow execution supports local IDE use and externally managed Temporal environments.

## Supported Modes

- Managed local mode runs the Forge extension, Forge Studio UI, worker supervision, and a local Temporal dev server for a single-user repository workflow.
- External or Cloud Temporal mode connects Forge and workers to a configured Temporal endpoint and namespace.
- Both modes use the same repo-owned workflow definition model under `.ai/workflows/*.json`.
- Workers run outside the VS Code extension host in both modes.
- Mode selection changes connection and supervision behavior, not workflow definition semantics.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
