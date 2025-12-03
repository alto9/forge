---
story_id: remove-mcp-context-tools
session_id: simplify-mcp-and-remove-contexts-feature
feature_id: []
spec_id: []
diagram_id: []
status: pending
priority: high
estimated_minutes: 20
---

## Objective
Remove the `get_forge_context` and `get_forge_objects` MCP tools from the server implementation.

## Context
These tools are no longer needed as specs and diagrams now provide all technical guidance. Removing them simplifies the MCP server and eliminates the contexts feature's entry points.

## Implementation Steps
1. Locate the MCP tool registration in `packages/mcp-server/src/index.ts` (or equivalent)
2. Remove `get_forge_context` tool definition and handler
3. Remove `get_forge_objects` tool definition and handler
4. Remove any imports related to these tools
5. Run tests to verify removal doesn't break other tools

## Files Affected
- `packages/mcp-server/src/index.ts` - Remove tool registrations
- `packages/mcp-server/src/tools/` - Remove tool implementation files (if separate)

## Acceptance Criteria
- [ ] `get_forge_context` tool is no longer registered or callable
- [ ] `get_forge_objects` tool is no longer registered or callable
- [ ] MCP server starts without errors
- [ ] Remaining tools (`get_forge_about`, `get_forge_schema`) still work correctly
- [ ] All existing tests pass

## Dependencies
None - this is the first story in the sequence

