# Authorization

Forge workflow authorization follows the authority of each external system.

## Authorization Boundaries

- GitHub access uses the user's authenticated IDE or configured GitHub credentials and is scoped to the repository, organization, project, and operations required by the workflow.
- Temporal external or Cloud mode uses configured endpoint credentials and namespace access. Managed local mode is limited to the user's local development context.
- External Temporal **API keys** are stored in VS Code SecretStorage under `forge.temporal.external.apiKey`, set via **Forge: Set Temporal API Key**, or supplied through `FORGE_TEMPORAL_EXTERNAL_API_KEY` for automation. Settings and workflow JSON never contain API key values.
- External mode authorization is limited to the namespace and task queue configured for the window. Forge does not escalate namespace access beyond the supplied credentials.
- Post-v1 mTLS client certificates will use separate SecretStorage keys; v1 does not accept certificate material in settings or workflow definitions.
- Cursor SDK activity access uses the active Cursor execution context and must not expose broader model or provider credentials through workflow JSON.
- Cursor SDK **API keys** are stored in VS Code SecretStorage under `forge.cursor.apiKey`, set via **Forge: Set Cursor API Key**, or supplied through `CURSOR_API_KEY` for worker automation. Settings and workflow JSON never contain API key values.
- Workflow definitions may reference agents, skills, validators, and artifacts, but those references do not grant filesystem, network, or GitHub authority by themselves.
- Sensitive connection material, tokens, and session details are operational secrets and are not serialized into workflow definitions or accepted artifacts.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
