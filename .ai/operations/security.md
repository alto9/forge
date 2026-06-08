# Security

Forge workflow security protects credentials, limits execution authority, and validates generated output before trust.

## Security Rules

- Workflow JSON cannot contain secrets, Temporal credentials, GitHub tokens, Cursor credentials, or provider keys.
- External or Cloud Temporal credentials are resolved through configured secure bindings, not serialized workflow definitions.
- Cursor SDK access stays inside the active Cursor execution boundary and is not replaced by direct provider calls.
- Workflow definitions reference stable activity IDs, validators, agents, and skills. They do not grant arbitrary command execution authority.
- Agent output is untrusted until deterministic schema, artifact, and domain validators accept it.
- Artifacts and diagnostics shown in Forge UI must avoid leaking tokens, connection material, or private session state.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
