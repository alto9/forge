---
actor_id: cursor-ide
name: Cursor IDE
type: system
description: The Cursor IDE that hosts the AI agent and provides the development environment
---

# Cursor IDE Actor

## Profile
Cursor is an AI-first code editor (fork of VSCode) that hosts AI agents and provides an integrated development environment. It serves as the runtime environment for both the Forge VSCode extension and the AI agent that executes Forge prompts.

## Capabilities
- Host VSCode extensions (including Forge)
- Run AI agent with integrated chat interface
- Manage MCP server connections and lifecycle
- Execute Cursor commands from `.cursor/commands/` directory
- Provide file system access to agents
- Display inline diffs and code changes
- Support agent tool calling (MCP)

## Responsibilities
- **Extension Hosting**: Run Forge VSCode extension
- **Agent Runtime**: Host AI agent with MCP tool access
- **MCP Management**: Start, configure, and route calls to MCP servers
- **Command Execution**: Execute commands from `.cursor/commands/` folder
- **File System**: Provide workspace file access to agents
- **UI Integration**: Display agent chat, diffs, and changes

## Characteristics
- **Base**: Fork of VSCode with AI-first features
- **Architecture**: Electron-based with extension host
- **Agent**: Integrated Claude or similar LLM
- **Protocol Support**: MCP for tool calling
- **Command System**: Custom command execution from markdown files

## Integration Points

### With Developer (Human Actor)
- Provides chat interface for interacting with agent
- Displays prompts from Forge output panel for copy/paste
- Shows file diffs and changes made by agent
- Executes Cursor commands on demand

### With AI Agent (System Actor)
- Hosts the agent runtime
- Routes MCP tool calls to appropriate servers
- Provides file system access
- Displays agent responses and changes

### With VSCode/Forge Extension (System Actor)
- Hosts the Forge extension
- Executes extension commands
- Provides webview for Forge Studio
- Displays Forge output panel

### With MCP Server (System Actor)
- Manages MCP server lifecycle (start/stop)
- Routes tool calls from agent to server
- Configured via `~/.cursor/mcp-settings.json`
- Uses stdio transport for communication

## Cursor Commands

Forge installs three commands in `.cursor/commands/`:

### forge-design.md
Guides agents during design sessions to create/modify features, diagrams, specs, models

### forge-build.md
Guides agents to implement stories with full context from linked files

### forge-sync.md
Guides agents to synchronize AI documentation with actual codebase

## MCP Configuration

Cursor must be configured to use Forge MCP server:

```json
{
  "mcpServers": {
    "forge": {
      "command": "node",
      "args": ["/path/to/forge/packages/mcp-server/dist/index.js"]
    }
  }
}
```

## Workflow Support

### Design Sessions
1. Developer runs Forge command → extension generates prompt
2. Developer copies prompt to Cursor chat
3. Agent executes prompt with MCP tool calls
4. Agent creates/modifies files
5. Cursor displays changes for review

### Implementation
1. Developer runs Build Story command → extension generates prompt
2. Developer copies prompt to Cursor chat
3. Agent reads story and linked docs
4. Agent implements changes
5. Cursor shows diffs for review

### Synchronization
1. Developer runs forge-sync command in Cursor
2. Agent analyzes codebase deeply
3. Agent compares with AI docs
4. Agent updates AI docs to match code
5. Cursor shows changes for review

## Constraints
- Requires MCP server configuration
- Agent needs access to workspace files
- Commands executed manually (not automated)
- Developer must review all changes

## Success Criteria
- MCP server connects reliably
- Agent can call Forge MCP tools
- Commands execute without errors
- File changes display properly
- Developer maintains control over changes

