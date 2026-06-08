# Configuration

Forge workflow configuration selects how workflow definitions are discovered and how Temporal execution is reached.

## Configuration Model

- Workflow definitions are discovered from `.ai/workflows/*.json` in the selected repository context.
- Runtime mode distinguishes managed local Temporal from external or Cloud Temporal endpoints.
- Managed local mode configures local Temporal process startup, persistence location, worker process supervision, and workspace scoping for single-user workflows.
- External or Cloud mode configures Temporal endpoint, namespace, task queue, credential binding, and worker connectivity.
- Workflow configuration references stable activity IDs, validators, agent paths, skill paths, and artifact locations declared by workflow JSON.
- Exact setting names remain implementation detail until refined, but configuration must not require embedding secrets in workflow definition files.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Temporal configuration keys
- Define the concrete VS Code configuration keys or workspace settings for Temporal mode, endpoint, namespace, task queue, credential binding, local persistence path, and worker supervision.
- Define precedence between workspace settings, user settings, environment variables, and workflow definition defaults.
