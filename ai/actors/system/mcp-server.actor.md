---
actor_id: mcp-server
name: MCP Server
type: system
description: The Model Context Protocol server that provides Forge workflow tools and guidance to AI agents
---

# MCP Server Actor

## Profile
The MCP Server is a Node.js application that implements the Model Context Protocol (MCP) to provide tools and guidance for Forge workflows. It serves as the knowledge base for Forge's session-driven context engineering approach.

## Capabilities
- Provide comprehensive Forge workflow documentation
- Serve file format schemas for all Forge document types
- Deliver technical guidance for common spec objects
- List available guidance objects
- Run as a persistent MCP server process

## Responsibilities
- **Workflow Guidance**: Provide comprehensive documentation of Forge workflows
- **Schema Management**: Maintain and serve schemas for all file types
- **Context Library**: Store and serve guidance for technical objects
- **Tool Interface**: Expose MCP tools for AI agent consumption

## Tools Provided

### get_forge_about
Returns comprehensive overview of Forge workflow including:
- Session-driven approach philosophy
- **THE LINKAGE SYSTEM** - The foundation of Forge's power for systematic context gathering
- File structure (sessions, features, diagrams, specs, models, actors, contexts, tickets)
- Complete workflow (Phase 1-4: Start Session, Design, Distill, Build)
- Stories vs Tasks guidance
- Distillation principles (minimal story size, proper linkages)
- 6-phase systematic context gathering process using linkages
- Context Building Checklist for complete context discovery
- Best practices

### get_forge_schema
Returns schema for specified file type:
- `session`: Session file format and tracking
- `feature`: Feature definitions with Gherkin
- `diagram`: Visual architecture with Nomnoml
- `spec`: Technical specifications and contracts
- `model`: Data model definitions
- `actor`: Actor profiles and responsibilities
- `story`: Implementation stories
- `task`: Non-code tasks
- `context`: Technical guidance

### get_forge_context
Returns guidance for technical objects:
- Searches guidance library for requested spec object
- Returns specific guidance if found
- Returns research prompt if not found
- Examples: AWS Lambda, React components, PostgreSQL indexes

### get_forge_objects
Lists all available spec objects in guidance library:
- Returns object IDs with brief descriptions
- Helps agents discover available guidance

## Implementation

### Technology Stack
- **Runtime**: Node.js (v22+)
- **Protocol**: Model Context Protocol (MCP) SDK
- **Transport**: StdioServerTransport
- **Language**: TypeScript

### File Structure
```
packages/mcp-server/
├── src/
│   ├── index.ts              # Main server implementation
│   ├── services/
│   │   ├── ForgeFileManager.ts   # File operations
│   │   └── PromptBuilder.ts      # Prompt generation
│   └── guidance/
│       └── *.spec.md         # Guidance library
├── dist/                     # Compiled JavaScript
└── package.json
```

### Deployment
- Runs as standalone Node.js process
- Configured in Cursor MCP settings
- Communicates via stdio transport
- Auto-starts when Cursor launches

## Integration Points

### With AI Agent
- Agent calls MCP tools during prompt execution
- Server responds with structured text content
- Agent uses information to execute Forge workflows correctly

### With Cursor IDE
- Cursor manages MCP server lifecycle
- Cursor routes tool calls to server
- Cursor provides stdio transport

### With VSCode Extension
- Extension generates prompts that include MCP tool calls
- No direct integration (prompts are copy/pasted)
- Indirect coordination through prompt structure

## Constraints
- Read-only operations (no file modifications)
- No direct workspace access
- No state persistence (stateless per request)
- Relies on file system for guidance library

## Success Criteria
- Tools respond quickly (< 100ms)
- Schemas are accurate and complete
- Workflow guidance is comprehensive
- Guidance library is well-organized
- Server runs reliably without crashes

