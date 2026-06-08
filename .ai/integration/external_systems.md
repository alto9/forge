# External Systems

Forge workflow execution integrates with Temporal, Cursor SDK, GitHub, and the local repository workspace.

## Temporal

Forge supports both managed local Temporal and external or Cloud Temporal endpoint modes. Managed local mode may start a local Temporal dev server for single-user workflows. External or Cloud mode connects to a configured endpoint and namespace.

Temporal owns durable workflow state, retries, waits, timers, and recovery. Forge does not implement a competing durable workflow engine.

## Cursor SDK

Cursor SDK performs bounded agent activity work. Forge activity contracts constrain the requested work, capture the SDK run identity, and validate structured outputs before continuing.

## GitHub

GitHub remains authoritative for issues, milestones, project fields, pull requests, and delivery records. Workflow activities use GitHub APIs when a workflow needs to read or update delivery state.

## Workspace Files

Forge reads `.ai/workflows/*.json`, `.ai` contracts, referenced agent files, referenced skills, and generated artifacts from the selected workspace context. Workflow definitions must resolve paths predictably within that context.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
