# Authorization

Forge workflow authorization follows the authority of each external system.

## Authorization Boundaries

- GitHub access uses the user's authenticated IDE or configured GitHub credentials and is scoped to the repository, organization, project, and operations required by the workflow.
- Temporal external or Cloud mode uses configured endpoint credentials and namespace access. Managed local mode is limited to the user's local development context.
- Cursor SDK activity access uses the active Cursor execution context and must not expose broader model or provider credentials through workflow JSON.
- Workflow definitions may reference agents, skills, validators, and artifacts, but those references do not grant filesystem, network, or GitHub authority by themselves.
- Sensitive connection material, tokens, and session details are operational secrets and are not serialized into workflow definitions or accepted artifacts.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
