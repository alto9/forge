---
story_id: 009-remove-mcp-imports
session_id: migrate-mcp-server-functionality-to-cursor-command
feature_id:
  - cursor-commands-migration
spec_id:
  - monorepo-to-single-package
status: completed
---

# Remove MCP Server Imports and References

## Objective

Remove all import statements and code references to `@forge/mcp-server` from the extension codebase.

## Context

With MCP functionality moved to command templates, any code that imported from or referenced the MCP server package needs to be removed or updated.

## Files to Search and Modify

Use grep to find all references:
```bash
grep -r "@forge/mcp-server" src/
grep -r "mcp-server" src/
grep -r "get_forge_about" src/
grep -r "get_forge_schema" src/
```

## Implementation Steps

1. Search for all imports from `@forge/mcp-server`
2. Remove or update each import:
   - If used for MCP tool definitions: Remove entirely (functionality now in templates)
   - If used for types: Replace with local type definitions if needed
3. Remove any code that calls MCP tools
4. Remove any MCP server configuration or initialization code
5. Verify no references to MCP functionality remain in source

## Acceptance Criteria

- [ ] No imports from `@forge/mcp-server` in codebase
- [ ] No references to `get_forge_about`, `get_forge_schema`, or other MCP tools
- [ ] No MCP server initialization code
- [ ] Code compiles without errors
- [ ] All functionality preserved through command templates

## Estimated Time

20 minutes

## Dependencies

- Requires: 008-update-build-configuration

## Notes

Most MCP functionality is now handled by command templates created in the initialization process. The extension no longer needs to interact with MCP tools directly.

