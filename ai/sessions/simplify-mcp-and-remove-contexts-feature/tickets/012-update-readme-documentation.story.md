---
story_id: update-readme-documentation
session_id: simplify-mcp-and-remove-contexts-feature
feature_id: []
spec_id: []
diagram_id: []
status: completed
priority: medium
estimated_minutes: 25
---

## Objective
Update README files and documentation to remove context references and update file structure descriptions.

## Context
The repository README and package READMEs document the Forge workflow, file structure, and MCP tools. These need to be updated to reflect the removal of contexts. Since the software hasn't been released yet, we simply update documentation to show the correct current state.

## Implementation Steps
1. Update main `README.md` in repository root
2. Update `packages/mcp-server/README.md`
3. Update `packages/vscode-extension/README.md`
4. Remove context_id from schema examples
5. Remove `get_forge_context` and `get_forge_objects` from MCP tools list
6. Update file structure diagrams to show 4 document types
7. Update linkage system descriptions
8. Remove context creation/editing instructions
9. Verify all documentation is consistent

## Files Affected
- `README.md` - Update workflow and file structure
- `packages/mcp-server/README.md` - Remove context tool documentation
- `packages/vscode-extension/README.md` - Update feature descriptions
- Any other documentation files mentioning contexts

## Acceptance Criteria
- [x] Main README no longer references contexts
- [x] MCP server README lists only remaining tools
- [x] Extension README doesn't mention context management features
- [x] File structure examples show 4 document types
- [x] Schema examples don't include context_id fields
- [x] All documentation is consistent and accurate

## Dependencies
- Depends on: 011-update-get-forge-about

