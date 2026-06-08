# Security

Forge workflow security protects credentials, limits execution authority, and validates generated output before trust.

## Security Rules

- Workflow JSON cannot contain secrets, Temporal credentials, GitHub tokens, Cursor credentials, or provider keys.
- External or Cloud Temporal credentials are resolved through configured secure bindings, not serialized workflow definitions.
- API keys live in VS Code SecretStorage (`forge.temporal.external.apiKey`) or the `FORGE_TEMPORAL_EXTERNAL_API_KEY` environment override. They are never written to workspace settings, workflow JSON, artifacts, or log output.
- Forge redacts secrets in Output channel logs, notifications, and diagnostics: no API keys, client certificates, private keys, or Authorization header values. Safe fields include address host:port, namespace, auth mode, TLS enabled flag, and probe outcome summaries.
- `insecure` external mode (plaintext gRPC) is permitted only for loopback addresses and emits an explicit security warning in the Output channel when selected.
- Cursor SDK access stays inside the active Cursor execution boundary and is not replaced by direct provider calls.
- Workflow definitions reference stable activity IDs, validators, agents, and skills. They do not grant arbitrary command execution authority.
- Agent output is untrusted until deterministic schema, artifact, and domain validators accept it.
- Artifacts and diagnostics shown in Forge UI must avoid leaking tokens, connection material, or private session state.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
