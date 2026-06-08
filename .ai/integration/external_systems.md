# External Systems

Forge workflow execution integrates with Temporal, Cursor SDK, GitHub, and the local repository workspace.

## Temporal

Forge supports both managed local Temporal and external or Cloud Temporal endpoint modes.

**Managed local:** Forge supervises one npm-bundled Temporal dev server child process per VS Code window. The server starts lazily from extension-shipped Node dependencies; users do not install the Temporal CLI. Connection uses `forge.temporal.managedLocal.grpcPort` (default `7233`) and namespace `forge.temporal.managedLocal.namespace` (default `forge-local`). Startup failure blocks workflow runs without auto-fallback to external mode.

**External or Cloud:** Forge connects to a user-configured gRPC endpoint and namespace. Settings live under `forge.temporal.external.*` (`.ai/runtime/configuration.md`). Credentials are bound through VS Code SecretStorage or environment overrides; workflow JSON never carries connection secrets.

- **Temporal Cloud:** Address uses the Cloud gRPC endpoint (`host:port` from the Namespace UI). Namespace uses `namespace.accountId`. Auth mode `apiKey` with TLS enabled is the primary v1 path.
- **Self-hosted external:** Address and namespace are operator-supplied. Auth mode `tlsServer` for TLS-only clusters, or `insecure` for loopback plaintext dev clusters only.
- **Connection validation:** Preflight runs lazily before workflow runs; failures block run creation without switching to managed-local mode.
- **Workers:** Forge supervises one out-of-host worker child process per VS Code window in both modes. The worker and extension host use the same resolved Temporal settings for the window (`.ai/runtime/configuration.md`). Workers poll the configured task queue; the extension host does not execute activity code.

Temporal owns durable workflow state, retries, waits, timers, and recovery. Forge does not implement a competing durable workflow engine.

## Cursor SDK

Cursor SDK performs bounded agent activity work. Forge activity contracts constrain the requested work, capture the SDK run identity, and validate structured outputs before continuing.

## GitHub

GitHub remains authoritative for issues, milestones, project fields, pull requests, and delivery records. Workflow activities use GitHub APIs when a workflow needs to read or update delivery state.

## Workspace Files

Forge reads `.ai/workflows/*.json`, `.ai` contracts, referenced agent files, referenced skills, and generated artifacts from the selected workspace context. Workflow definitions must resolve paths predictably within that context.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
