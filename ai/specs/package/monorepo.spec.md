---
spec_id: monorepo
name: Monorepo Package Management
description: Technical implementation for managing multiple packages in the Forge monorepo
feature_id: [forge-monorepo]
context_id: [node]
---

# Monorepo Package Management

## Architecture

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

## Implementation Details

### Workspace Configuration
- **Root**: `forge-monorepo` with workspaces
- **Packages**: `packages/*` workspace pattern
- **Dependencies**: Shared dev dependencies at root
- **Scripts**: Workspace-aware build and test scripts

### Package Structure
```
forge-monorepo/
├── packages/
│   ├── vscode-extension/
│   │   ├── src/
│   │   ├── dist/
│   │   ├── package.json
│   │   └── webpack.config.js
│   └── mcp-server/
│       ├── src/
│       ├── dist/
│       ├── package.json
│       └── tsconfig.json
├── package.json
└── node_modules/
```

### Build Process
1. **Root Build**: `npm run build` builds all workspaces
2. **Individual Build**: `npm run build -w @forge/vscode-extension`
3. **Watch Mode**: `npm run watch` for development
4. **Clean**: `npm run clean` removes all build artifacts

## Technical Requirements

### Node.js Requirements
- **Node.js**: >=22.14.0
- **npm**: >=10.0.0
- **TypeScript**: ^5.0.0

### Shared Dependencies
- **TypeScript**: ^5.0.0
- **ESLint**: ^8.0.0
- **@types/node**: ^22.14.0
- **@typescript-eslint/parser**: ^6.0.0

### Package-Specific Dependencies
- **VSCode Extension**: React, Webpack, esbuild
- **MCP Server**: @modelcontextprotocol/sdk, Zod

## Best Practices

### Workspace Management
- Use workspace-specific scripts
- Share common dependencies at root
- Maintain consistent TypeScript configuration
- Handle build dependencies properly

### Development Workflow
- Use watch mode for development
- Build packages individually when needed
- Clean build artifacts regularly
- Maintain consistent package versions
