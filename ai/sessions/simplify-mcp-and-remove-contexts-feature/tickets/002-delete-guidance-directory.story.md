---
story_id: delete-guidance-directory
session_id: simplify-mcp-and-remove-contexts-feature
feature_id: []
spec_id: []
diagram_id: []
status: completed
priority: high
estimated_minutes: 10
---

## Objective
Delete the `packages/mcp-server/src/guidance/` directory and all `.spec.md` guidance files within it.

## Context
The guidance system stored technical guidance files that were loaded by `get_forge_context`. Since that tool is being removed, this entire directory and its contents are obsolete.

## Implementation Steps
1. Verify `packages/mcp-server/src/guidance/` directory exists
2. Delete the entire `guidance/` directory
3. Remove any imports referencing files in this directory
4. Update package.json scripts if they reference guidance files
5. Run tests to verify no broken imports remain

## Files Affected
- `packages/mcp-server/src/guidance/` - Delete entire directory
- Any files importing from `guidance/` - Remove imports

## Acceptance Criteria
- [x] `packages/mcp-server/src/guidance/` directory no longer exists
- [x] No import statements reference the guidance directory
- [x] MCP server builds without errors
- [x] All tests pass

## Dependencies
- Depends on: 001-remove-mcp-context-tools (tools should be removed before deleting their data)

