---
context_id: local-development
category: foundation
name: Local Development Procedures
description: Comprehensive guide for local development of the Forge monorepo
global: true
---

# Local Development Procedures

## When to Use This Context

Use this context when:
- Setting up the Forge development environment
- Understanding the build process
- Working with individual packages
- Troubleshooting development issues
- Contributing to Forge

## Prerequisites

```gherkin
Scenario: Verify development prerequisites
  Given you want to develop Forge locally
  When checking system requirements
  Then ensure Node.js 22.14.0+ is installed
  And ensure npm 10.0.0+ is installed
  And ensure Git is installed
  And ensure VSCode is installed (for extension development)

Scenario: Verify Node.js version
  Given you have Node.js installed
  When checking the version
  Then verify it is 22.14.0 or higher
  And use .nvmrc file if using nvm: `nvm use`
```

## Initial Setup

```gherkin
Scenario: Initial project setup
  Given you have cloned the repository
  When setting up the development environment
  Then run `npm install` from the root directory
  And this installs dependencies for all workspaces
  And run `npm run build` to build all packages
  And verify build artifacts are created in dist/ directories

Scenario: Workspace installation
  Given you are in the monorepo root
  When running npm install
  Then npm workspaces automatically links packages
  And shared dev dependencies are installed at root
  And package-specific dependencies are installed in each package
```

## Build Procedures

### Building All Packages

```gherkin
Scenario: Build all packages
  Given you are in the monorepo root
  When building all packages
  Then run `npm run build`
  And this builds both vscode-extension and mcp-server
  And build artifacts are created in each package's dist/ directory

Scenario: Build specific package
  Given you want to build a single package
  When building the vscode extension
  Then run `npm run build -w forge`
  And this builds only the vscode extension
  When building the MCP server
  Then run `npm run build -w @forge/mcp-server`
  And this builds only the MCP server
```

### Watch Mode Development

```gherkin
Scenario: Watch mode for vscode extension
  Given you are developing the vscode extension
  When you want automatic rebuilds on changes
  Then run `npm run watch -w forge`
  And this watches both TypeScript and webview changes
  And rebuilds automatically when files change
  And use F5 in VSCode to launch Extension Development Host

Scenario: Watch mode for MCP server
  Given you are developing the MCP server
  When you want automatic rebuilds on changes
  Then run `npm run dev -w @forge/mcp-server`
  And this uses tsx watch mode for auto-reload
  And changes are reflected immediately
```

## Package-Specific Development

### VSCode Extension Development

```gherkin
Scenario: Build vscode extension
  Given you are developing the vscode extension
  When building the extension
  Then webpack bundles the main extension code
  And esbuild bundles the React webview code
  And both outputs are in dist/ and media/studio/ directories
  And the extension entry point is dist/extension.js

Scenario: Test vscode extension
  Given you have built the extension
  When testing the extension
  Then open packages/vscode-extension in VSCode
  And press F5 to launch Extension Development Host
  And test commands in the new window
  And verify Forge Studio opens correctly
  And verify file operations work as expected

Scenario: Package vscode extension
  Given you have a completed extension
  When packaging for distribution
  Then run `npm run vscode:package` from root
  And this runs production build with webpack
  And builds webview with esbuild (minified)
  And creates .vsix file using @vscode/vsce
  And the output is forge-0.1.0.vsix

Scenario: Install extension locally
  Given you have packaged the extension
  When installing locally
  Then run `code --install-extension packages/vscode-extension/forge-0.1.0.vsix`
  And restart VSCode to activate the extension
  And verify commands are available in Command Palette
```

### MCP Server Development

```gherkin
Scenario: Build MCP server
  Given you are developing the MCP server
  When building the server
  Then TypeScript compiles src/ to dist/
  And uses ES modules (type: "module")
  And makes dist/index.js executable (chmod +x)
  And dependencies are resolved from node_modules at runtime

Scenario: Run MCP server directly
  Given you have built the MCP server
  When running the server directly
  Then execute `node packages/mcp-server/dist/index.js`
  And the server starts with stdio transport
  And responds to MCP tool calls via stdin/stdout

Scenario: Development mode with auto-reload
  Given you are actively developing the MCP server
  When you want automatic reloads
  Then run `npm run dev -w @forge/mcp-server`
  And tsx watches for file changes
  And automatically restarts the server on changes
  And you can test changes immediately
```

## Testing

```gherkin
Scenario: Run linting
  Given you want to check code quality
  When running linting
  Then run `npm run lint` from root (lints all packages)
  Or run `npm run lint -w <package>` for specific package
  And ESLint checks TypeScript and React code
  And fixes are suggested where applicable

Scenario: Run tests
  Given you have test files
  When running tests
  Then run `npm test -w forge` for extension tests
  And vitest runs unit tests
  And verify all tests pass before committing
```

## Cleanup

```gherkin
Scenario: Clean build artifacts
  Given you want to clean build outputs
  When cleaning artifacts
  Then run `npm run clean` from root
  And this removes dist/ directories
  And removes node_modules (optional)
  And prepares for fresh build
```

## Troubleshooting

### Common Issues

```gherkin
Scenario: Workspace not found error
  Given you see workspace errors
  When troubleshooting
  Then verify you are in the repository root
  And verify package.json has "workspaces": ["packages/*"]
  And run `npm install` to refresh workspace links

Scenario: TypeScript compilation errors
  Given you see TypeScript errors
  When troubleshooting
  Then verify Node types match (@types/node@^22.14.0)
  And run `npm install` to update dependencies
  And verify TypeScript version is ^5.0.0
  And check tsconfig.json is correct

Scenario: Extension won't load
  Given the extension fails to load
  When troubleshooting
  Then verify webpack build completed successfully
  And verify webview build completed successfully
  And check that dist/extension.js exists
  And verify media/studio/main.js exists
  And check VSCode Developer Console for errors

Scenario: MCP server not found
  Given MCP server can't be found
  When troubleshooting
  Then verify build completed: `npm run build -w @forge/mcp-server`
  And verify dist/index.js exists
  And verify execute permissions: `chmod +x packages/mcp-server/dist/index.js`
  And check absolute path in MCP configuration
```

## Best Practices

### Development Workflow

1. **Always build before testing**: Run `npm run build` after pulling changes
2. **Use watch mode**: Use `npm run watch` for active development
3. **Test in Extension Host**: Use F5 to test extension in isolated environment
4. **Lint before committing**: Run `npm run lint` to catch issues early
5. **Clean before builds**: Run `npm run clean` if experiencing strange build issues

### Code Organization

- **Package structure**: Each package is self-contained with its own dependencies
- **Shared dependencies**: Common dev dependencies at root level
- **TypeScript**: All packages use TypeScript with strict mode
- **ES modules**: MCP server uses ES modules, extension uses CommonJS

### Version Management

- Both packages share version number (0.1.0)
- Update version in all package.json files when releasing
- Update CHANGELOG.md with changes
- Build and package both before release

## File Structure

```
forge-monorepo/
├── packages/
│   ├── vscode-extension/     # VSCode Extension
│   │   ├── src/              # TypeScript source
│   │   ├── dist/             # Compiled extension (webpack)
│   │   ├── media/studio/     # Webview bundle (esbuild)
│   │   └── package.json
│   └── mcp-server/          # MCP Server
│       ├── src/              # TypeScript source
│       ├── dist/             # Compiled JavaScript
│       └── package.json
├── package.json             # Root workspace config
└── .nvmrc                   # Node version (22.14.0)
```

