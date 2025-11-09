---
diagram_id: monorepo-structure
name: Forge Monorepo Package Structure
description: Shows the organization of packages in the Forge monorepo
diagram_type: component
feature_id: [forge-monorepo]
spec_id: [monorepo]
actor_id: []
---

# Forge Monorepo Package Structure

```nomnoml
#direction: down
#padding: 10

[Root Package] -> [VSCode Extension]
[Root Package] -> [MCP Server]

[VSCode Extension] -> [Extension Source]
[VSCode Extension] -> [Webview Components]
[VSCode Extension] -> [Build Artifacts]

[MCP Server] -> [MCP Tools]
[MCP Server] -> [Server Implementation]
[MCP Server] -> [Dist Package]
```

## Notes

This diagram shows the structure of the Forge monorepo with two main packages: the VSCode extension and the MCP server.

