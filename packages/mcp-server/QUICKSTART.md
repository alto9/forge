# Forge MCP Server - Quick Start Guide

## What You Have

Your Forge MCP Server provides **four powerful tools**:

### 1. `get_forge_about`
- **Purpose:** Returns comprehensive overview of Forge workflow
- **Input:** None
- **Output:** Complete workflow documentation including session-driven approach, when to create Stories vs Tasks, and implementation guidance

### 2. `get_forge_schema`
- **Purpose:** Returns the complete schema specification for Forge file types
- **Input:** `schema_type` - one of: `session`, `feature`, `spec`, `model`, `actor`, `story`, `task`, `context`
- **Output:** Detailed schema with frontmatter fields, content structure, and linkage requirements

### 3. `get_forge_objects`
- **Purpose:** Lists supported spec objects with brief guidance
- **Input:** None
- **Output:** List of supported spec objects and their IDs for use with `get_forge_context`

### 4. `get_forge_context`
- **Purpose:** Returns guidance for technical objects or research prompts
- **Input:** `spec_object` - any technical concept (e.g., "AWS Lambda", "React Context API", "PostgreSQL indexes")
- **Output:** Guidance from library if available, or best-practice research prompt

## How to Start the MCP Server

### Step 1: Build the Server (if not already built)

```bash
# From monorepo root
npm install
npm run build -w @forge/mcp-server

# Or from mcp-server directory
cd packages/mcp-server
npm install
npm run build
```

### Step 2: Start the Server

You have three options:

#### Option A: Using Node directly (Recommended for local development)
```bash
node /absolute/path/to/cursor-context-engineering/packages/mcp-server/dist/index.js
```

#### Option B: Development mode (auto-reload)
```bash
cd packages/mcp-server
npm run dev
```

#### Option C: Using npx (if published to npm)
```bash
npx @forge/mcp-server
```

### Step 3: Configure Cursor

Add this to your `.cursor/mcp.json`:

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

**Important:** 
- Replace `/absolute/path/to/cursor-context-engineering` with your actual repository path
- Replace `/path/to/your/project` with your project root where you want to use Forge
- Use absolute paths in the `args` array

### Step 4: Restart Cursor

After updating the MCP configuration, restart Cursor completely (not just reload window).

### Step 5: Test It

Ask the Cursor agent:
```
Can you call get_forge_schema for the "feature" schema type?
```

You should see a detailed feature file schema returned.

## Tool Usage Examples

### Get Forge Workflow Overview
```javascript
{
  "name": "get_forge_about",
  "arguments": {}
}
```

### Get Schema for File Type
```javascript
{
  "name": "get_forge_schema",
  "arguments": {
    "schema_type": "feature"
  }
}
```

### List Supported Spec Objects
```javascript
{
  "name": "get_forge_objects",
  "arguments": {}
}
```

### Get Context Guidance
```javascript
{
  "name": "get_forge_context",
  "arguments": {
    "spec_object": "AWS CDK Stack"
  }
}
```

## Schema Content

Each schema provides:
- **File naming pattern** (e.g., `<feature-id>.feature.md`)
- **Location** (e.g., `ai/features/`)
- **Frontmatter fields** with data types and requirements
- **Content structure** guidelines
- **Linkage rules** showing relationships between file types

## Context Guidance

When you call `get_forge_context` with a technical object, it:
1. Checks the guidance library for existing context
2. Returns guidance if found
3. Otherwise returns a best-practice research prompt that guides the agent to:
   - Check project docs (`ai/docs/`)
   - Search codebase for implementations
   - Perform external research
   - Synthesize findings
   - Create context files for future use

## Troubleshooting

### Server won't start
- Ensure you've run `npm install` and `npm run build -w @forge/mcp-server`
- Check that Node.js version >= 22.14.0
- Verify `dist/index.js` exists and is executable

### Cursor doesn't see the tools
- Verify `.cursor/mcp.json` is in the project root
- Restart Cursor completely (not just reload window)
- Check Cursor's MCP connection status
- Verify absolute paths are correct

### Tools return errors
- Check the server logs (stderr output)
- Verify the tool arguments match the expected schema
- Ensure you're passing the correct parameter names
- Verify the `cwd` path points to a valid project directory

## Next Steps

Now that your MCP server is set up, you can:

1. Use `get_forge_about` to understand the Forge workflow
2. Use `get_forge_schema` when creating/validating Forge files
3. Use `get_forge_objects` to see available spec objects
4. Use `get_forge_context` when researching technical concepts

The server provides comprehensive Forge capabilities for AI-assisted development workflows.
