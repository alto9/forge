# Build Packaging

Forge packaging must carry the extension UI, workflow schema contracts, worker runtime assets, and managed-local Temporal support without making external Temporal users install a different extension.

## Packaging Rules

- The extension package includes Forge Studio surfaces needed to discover, inspect, start, and monitor workflows.
- Workflow schema files under `.ai/schemas/` are treated as contract assets for repository workflow definitions.
- Worker code and process-launch assets are packaged or resolved in a way that keeps workflow execution outside the VS Code extension host.
- Managed local Temporal support is available for single-user workflows while preserving external or Cloud Temporal mode.
- Packaging does not bundle user workflow definitions; those remain repo-owned `.ai/workflows/*.json` files.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Workflow runtime packaging
- Define which worker assets, Temporal local binaries or launch helpers, schema files, and React Flow bundles are included in the extension package.
- Define CI checks that validate workflow schema assets and worker packaging before release.
