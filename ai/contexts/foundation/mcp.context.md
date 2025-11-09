---
context_id: mcp
category: foundation
name: Model Context Protocol (MCP) Guidance
description: Guidance for implementing and using MCP server capabilities in Forge
---

# Model Context Protocol (MCP) Context

## When to Use This Context

Use this context when:
- Implementing MCP server functionality
- Creating MCP tools for Forge capabilities
- Integrating with AI assistants like Claude Desktop and Cursor
- Exposing Forge functionality via MCP protocol

## MCP Server Implementation

```gherkin
Scenario: Implement MCP server tools
  Given you are building Forge MCP server capabilities
  When implementing MCP tools
  Then use @modelcontextprotocol/sdk for protocol implementation
  And implement proper tool schemas with Zod validation
  And handle tool calls with appropriate error handling
  And return structured responses in expected format

Scenario: Expose Forge capabilities via MCP
  Given you have Forge context engineering capabilities
  When exposing them via MCP
  Then implement get_forge_about tool for workflow overview
  And implement get_forge_schema tool for file format schemas
  And implement get_forge_context tool for technical guidance
  And implement get_forge_objects tool for supported spec objects
```

## Technical Implementation

### MCP Server Structure
- **Package**: `@forge/mcp-server`
- **Entry Point**: `dist/index.js`
- **Dependencies**: `@modelcontextprotocol/sdk`, `gray-matter`, `zod`
- **Tools**: 4 main tools for Forge capabilities

### Tool Implementation
1. **get_forge_about**: Returns comprehensive workflow overview
2. **get_forge_schema**: Returns schema for specific file types
3. **get_forge_context**: Returns guidance for technical objects
4. **get_forge_objects**: Lists supported spec objects

### Error Handling
- Validate input parameters with Zod schemas
- Handle file system errors gracefully
- Return structured error responses
- Log errors for debugging

## Best Practices

### Tool Design
- Keep tools focused and specific
- Use clear, descriptive tool names
- Implement proper parameter validation
- Return consistent response formats

### Integration
- Follow MCP protocol specifications
- Handle async operations properly
- Implement proper error boundaries
- Provide clear documentation

### Performance
- Cache frequently accessed data
- Optimize file system operations
- Handle large files efficiently
- Implement proper resource cleanup
