---
story_id: update-mcp-server-diagram-schema
session_id: react-flow-for-diagrams
feature_id: [react-flow-diagram-editor]
spec_id: [react-flow-diagram-implementation]
status: completed
priority: high
estimated_minutes: 15
---

# Update MCP Server Diagram Schema

## Objective
Update the Forge MCP server to replace all nomnoml references with react-flow JSON format in the diagram schema and related documentation.

## Context
The MCP server provides schema information and guidance to AI agents. It currently describes diagrams as using nomnoml format, but we've replaced nomnoml with react-flow JSON format. The MCP server needs to be updated to reflect this change.

## Implementation Steps
1. In `packages/mcp-server/src/index.ts`:
   - Update `getForgeAbout()` method:
     - Change line 277: `├── diagrams/              # Visual architecture with Nomnoml (nestable)` to `├── diagrams/              # Visual architecture with react-flow JSON (nestable)`
     - Change line 320: `- **Nomnoml Format**: Use nomnoml syntax for clean, maintainable diagrams` to `- **React-Flow JSON Format**: Use JSON format with react-flow for visual diagram editing`
     - Change line 427: `- Use nomnoml syntax for clean, maintainable diagrams` to `- Use react-flow JSON format stored in markdown code blocks`
   - Update `getForgeSchema('diagram')` method:
     - Change line 1315: `- **Format**: Frontmatter + Single Nomnoml Diagram` to `- **Format**: Frontmatter + JSON Diagram Data`
     - Change line 1329: `Diagram files contain a SINGLE nomnoml diagram that visualizes system architecture, flows, or relationships.` to `Diagram files contain JSON diagram data stored in a markdown code block that visualizes system architecture, flows, or relationships.`
     - Replace lines 1331-1341 (nomnoml example) with JSON format example:
       ```json
       {
         "nodes": [
           { "id": "user", "type": "default", "position": { "x": 0, "y": 0 }, "data": { "label": "User" } },
           { "id": "api", "type": "aws-apigateway", "position": { "x": 200, "y": 0 }, "data": { "label": "API Gateway" } }
         ],
         "edges": [
           { "id": "e1", "source": "user", "target": "api" }
         ]
       }
       ```
     - Update section title from "Single Nomnoml Diagram" to "JSON Diagram Format"
     - Update description to explain JSON format in markdown code blocks
2. In `packages/mcp-server/src/services/PromptBuilder.ts`:
   - Update line 103: Change `nomnoml diagrams where appropriate` to `diagram references where appropriate (diagrams are created separately as diagram files)`
3. In `packages/mcp-server/README.md`:
   - Update line 202: Change `Nomnoml diagrams` to `react-flow diagrams`

## Files Affected
- `packages/mcp-server/src/index.ts` - Update getForgeAbout() and getForgeSchema('diagram')
- `packages/mcp-server/src/services/PromptBuilder.ts` - Update diagram reference
- `packages/mcp-server/README.md` - Update documentation

## Acceptance Criteria
- [ ] All nomnoml references in getForgeAbout() are replaced with react-flow JSON format
- [ ] Diagram schema describes JSON format instead of nomnoml
- [ ] Diagram schema includes JSON example instead of nomnoml example
- [ ] PromptBuilder no longer mentions nomnoml diagrams
- [ ] README.md is updated
- [ ] MCP server builds without errors
- [ ] Schema output correctly describes react-flow JSON format

## Dependencies
- None (can be done in parallel with other stories)

