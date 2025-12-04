# Forge MCP Server

A Model Context Protocol (MCP) server that provides Forge context engineering capabilities for agentic development workflows.

## Overview

The Forge MCP Server exposes two powerful tools that help agents understand and work with the Forge file format system:

### Tools

#### 1. `get_forge_about`

Returns comprehensive overview of Forge workflow including session-driven approach, when to create Stories vs Tasks, and implementation guidance.

**Parameters:** None

**Returns:** Complete workflow documentation including:
- Session-driven approach
- Linkage system
- When to create Stories vs Tasks
- Minimal story size guidance
- File structure and linkages
- Context building process

**Example use case:** When an agent needs to understand the Forge workflow or how to distill sessions into stories, it can call this tool for comprehensive guidance.

#### 2. `get_forge_schema`

Returns the complete schema specification for a Forge file type.

**Parameters:**
- `schema_type` (required): One of `session`, `feature`, `spec`, `model`, `actor`, `story`, `task`

**Returns:** Detailed schema documentation including:
- File format and naming conventions
- Frontmatter field specifications
- Content structure requirements
- Linkage requirements between different file types

**Example use case:** When an agent needs to create or validate a Forge file, it can call this tool to understand the exact format requirements.

## Installation

From the monorepo root:

```bash
npm install
npm run build
```

## Starting the MCP Server

### Method 1: Using npx (Recommended for Cursor)

Once built, you can run the server using:

```bash
npx @forge/mcp-server
```

**Note:** After building, the package is available via npm workspaces. If you haven't published to npm, use direct execution instead.

### Method 2: Direct execution

```bash
cd packages/mcp-server
npm run build
node dist/index.js
```

### Method 3: Development mode with auto-reload

```bash
cd packages/mcp-server
npm run dev
```

## Configuring Cursor to Use the MCP Server

To use this MCP server with Cursor, add it to your Cursor MCP configuration file (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "forge": {
      "command": "node",
      "args": [
        "/absolute/path/to/cursor-context-engineering/packages/mcp-server/dist/index.js"
      ],
      "cwd": "/path/to/your/project"
    }
  }
}
```

**Important:** Replace the paths with your actual project paths:
- Use absolute path to `dist/index.js` in the `args` array
- Set `cwd` to your project root where you want to use Forge

Alternatively, if you have published `@forge/mcp-server` to npm:

```json
{
  "mcpServers": {
    "forge": {
      "command": "npx",
      "args": [
        "@forge/mcp-server"
      ],
      "cwd": "/path/to/your/project"
    }
  }
}
```

After updating the configuration:
1. Restart Cursor completely
2. The Forge tools will be available to the AI agent
3. You can verify by asking the agent to call `get_forge_schema` with a schema type

## Tool Usage Examples

### Example 1: Getting the Feature Schema

When creating a new feature file, the agent can call:

```javascript
// Tool call
{
  "name": "get_forge_schema",
  "arguments": {
    "schema_type": "feature"
  }
}
```

The server returns the complete feature schema including frontmatter structure and Gherkin format requirements.

### Example 2: Understanding the Forge Workflow

When an agent needs to understand how to work with Forge, it can call:

```javascript
// Tool call
{
  "name": "get_forge_about",
  "arguments": {}
}
```

The server returns comprehensive workflow documentation including session management, file structure, and linkage system.

## Architecture

The Forge MCP Server is built with:
- **TypeScript** for type safety
- **MCP SDK** (@modelcontextprotocol/sdk) for protocol implementation
- **Stdio Transport** for process-based communication

The server is stateless and designed to be lightweight, responding only to tool call requests.

## Development

### Building

```bash
npm run build
```

### Watching for changes

```bash
npm run watch
```

### Running in development mode

```bash
npm run dev
```

### Linting

```bash
npm run lint
```

### Cleaning build artifacts

```bash
npm run clean
```

## Schema Specifications

The server provides schemas for seven Forge file types:

1. **Session** (`*.session.md`) - Design session tracking
2. **Feature** (`*.feature.md`) - Gherkin-based feature specifications
3. **Spec** (`*.spec.md`) - Technical specifications with diagram references
4. **Model** (`*.model.md`) - Data model definitions
5. **Actor** (`*.actor.md`) - Actor/persona definitions
6. **Story** (`*.story.md`) - Implementation stories (< 30 min each)
7. **Task** (`*.task.md`) - External/manual task definitions

Each schema includes:
- File naming conventions
- Frontmatter requirements
- Content structure
- Linkage rules to other file types

## Version

Current version: **0.1.0**

## License

See the root repository for license information.

## Contributing

This is part of the Cursor Context Engineering monorepo. See the main README for contribution guidelines.
