# Forge Monorepo Structure

This document describes the monorepo structure and how to work with it.

## Structure

```
glam-monorepo/
├── packages/
│   ├── vscode-extension/     # VSCode Extension
│   │   ├── src/
│   │   │   ├── commands/     # Command implementations
│   │   │   ├── panels/       # Webview panels
│   │   │   ├── utils/        # Utility functions
│   │   │   └── extension.ts  # Entry point
│   │   ├── dist/            # Bundled extension (webpack output)
│   │   ├── webpack.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── mcp-server/           # MCP Server
│       ├── src/
│       │   ├── services/     # File management & prompt building
│       │   └── index.ts      # Server entry point
│       ├── dist/            # Compiled TypeScript output
│       ├── tsconfig.json
│       └── package.json
│
├── package.json              # Root workspace configuration
├── .nvmrc                   # Node version (v22.14.0)
├── README.md                # Main documentation
├── EXAMPLES.md              # File format examples
├── CONTRIBUTING.md          # Contribution guidelines
└── CHANGELOG.md             # Version history
```

## Workspace Configuration

This is an npm workspaces monorepo. The root `package.json` defines two workspaces:

- `packages/vscode-extension` - VSCode extension (name: `glam`)
- `packages/mcp-server` - MCP server (name: `@glam/mcp-server`)

## Development

### Initial Setup

```bash
# Install dependencies for all packages
npm install

# Build all packages
npm run build
```

### Working with Packages

**Build all packages:**
```bash
npm run build
```

**Build specific package:**
```bash
npm run build -w @glam/mcp-server
# or for vscode extension (note: different name)
cd packages/vscode-extension && npm run build
```

**Watch mode:**
```bash
# Watch all packages
npm run watch

# Watch specific package
npm run dev -w @glam/mcp-server
```

**Lint all packages:**
```bash
npm run lint
```

**Clean build artifacts:**
```bash
npm run clean
```

### VSCode Extension Development

```bash
# From root
cd packages/vscode-extension

# Build the extension
npm run build

# Package for distribution
npm run package  # Creates production build
vsce package --no-dependencies  # Creates .vsix file

# Or use the root script
npm run vscode:package  # (from root)
```

**Testing the extension:**
1. Open the `packages/vscode-extension` folder in VSCode
2. Press F5 to launch Extension Development Host
3. Test the commands in the new window

**Installing locally:**
```bash
code --install-extension packages/vscode-extension/glam-0.1.0.vsix
```

### MCP Server Development

```bash
# From root
npm run build -w @glam/mcp-server

# Watch mode for development
npm run dev -w @glam/mcp-server

# Test the server
cd packages/mcp-server
node dist/index.js
```

**Using with Claude Desktop:**

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "glam": {
      "command": "node",
      "args": ["/absolute/path/to/cursor-context-engineering/packages/mcp-server/dist/index.js"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

## Dependency Management

### Shared Dependencies

Common dev dependencies are defined in the root `package.json`:
- TypeScript
- ESLint
- Node type definitions

### Package-Specific Dependencies

Each package has its own dependencies:

**vscode-extension:**
- `@types/vscode` - VSCode API types
- `webpack` & `ts-loader` - Bundling
- `gray-matter` - Frontmatter parsing

**mcp-server:**
- `@modelcontextprotocol/sdk` - MCP SDK
- `gray-matter` - Frontmatter parsing
- `zod` - Schema validation
- `tsx` - Development runner

### Adding Dependencies

```bash
# Add to root (shared dev dependency)
npm install -D <package> -w root

# Add to specific package
npm install <package> -w @glam/mcp-server
npm install <package> -w packages/vscode-extension  # Note: different workspace name
```

## Build Process

### VSCode Extension

The extension uses **webpack** to bundle all dependencies:
1. TypeScript is compiled and bundled by webpack
2. All dependencies (including `gray-matter`) are bundled into `dist/extension.js`
3. The bundled file is ~201KB (minified)
4. No node_modules are included in the `.vsix` package

**Why webpack?**
- Bundles all dependencies for portability
- Reduces package size
- No runtime dependency resolution needed

### MCP Server

The MCP server uses **standard TypeScript compilation**:
1. TypeScript compiles `src/**/*.ts` to `dist/**/*.js`
2. Uses ES modules (`"type": "module"`)
3. Dependencies are resolved at runtime from `node_modules`

**Why not webpack?**
- MCP servers run in Node.js where dependencies are available
- ES modules are preferred for MCP servers
- Simpler debugging with source maps

## Version Management

Both packages share the same version number (0.1.0). When releasing:

1. Update version in root `package.json`
2. Update version in both package `package.json` files
3. Update `CHANGELOG.md`
4. Build and package both:
   ```bash
   npm run build
   npm run vscode:package
   ```

## Troubleshooting

### Extension won't load

**Error: "Cannot find module 'gray-matter'"**
- Solution: Rebuild with webpack: `npm run build -w packages/vscode-extension`
- Ensure you're using `--no-dependencies` flag when packaging

### MCP Server not found

**Error: "Command not found"**
- Solution: Ensure you've built the server: `npm run build -w @glam/mcp-server`
- Check the absolute path in your MCP configuration
- Verify `dist/index.js` has execute permissions: `chmod +x packages/mcp-server/dist/index.js`

### Workspace errors

**Error: "No workspaces found"**
- Check you're in the repository root
- Verify `package.json` has `"workspaces": ["packages/*"]`
- Run `npm install` to refresh workspace links

### Type errors

**Error: TypeScript compilation errors**
- Ensure Node types match: Both packages use `@types/node@^22.14.0`
- Run `npm install` to ensure dependencies are up to date
- Check TypeScript version: Should be `^5.0.0`

## CI/CD Considerations

When setting up CI/CD, ensure:

1. Node version matches `.nvmrc` (v22.14.0)
2. Run `npm install` from root to install all workspaces
3. Build all packages: `npm run build`
4. Test both packages independently
5. Package extension: `npm run vscode:package`
6. Publish extension to marketplace from `packages/vscode-extension/`
7. Publish MCP server to npm from `packages/mcp-server/`

## Future Additions

Potential future packages:
- `@glam/cli` - Command-line interface for Forge
- `@glam/core` - Shared core logic between packages
- `@glam/types` - Shared TypeScript types
- `@glam/docs` - Documentation site

When adding new packages:
1. Create folder in `packages/`
2. Add `package.json` with appropriate `name`
3. Add to workspaces in root `package.json` (automatic with `packages/*`)
4. Run `npm install` from root
5. Add build scripts if needed

