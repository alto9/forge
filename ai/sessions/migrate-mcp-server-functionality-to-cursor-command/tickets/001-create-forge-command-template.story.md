---
story_id: 001-create-forge-command-template
session_id: migrate-mcp-server-functionality-to-cursor-command
feature_id:
  - cursor-commands-migration
spec_id:
  - forge-command
  - cursor-commands-management
status: completed
---

# Create /forge Command Template

## Objective

Create the new `/forge` command template constant that replaces the `get_forge_about` MCP tool, containing complete Forge workflow documentation.

## Context

The `/forge` command will be a foundational Cursor command that provides comprehensive guidance about Forge's workflow, session-driven approach, and context engineering principles. This command will be used alongside other Forge commands (e.g., `/forge /forge-design`).

## Files to Modify

- `packages/vscode-extension/src/templates/cursorCommands.ts`

## Implementation Steps

1. Add new constant `FORGE_COMMAND_TEMPLATE` to `cursorCommands.ts`
2. Include all 7 sections specified in `forge-command.spec.md`:
   - Section 1: What is Forge?
   - Section 2: The Forge Workflow (4 phases)
   - Section 3: File Types and Structure
   - Section 4: Key Principles
   - Section 5: When to Create Stories vs Tasks
   - Section 6: The Linkage System
   - Section 7: Session Status Management
3. Ensure content matches what `get_forge_about` MCP tool provided
4. Use proper markdown formatting with code blocks for examples

## Acceptance Criteria

- [ ] `FORGE_COMMAND_TEMPLATE` constant created with complete content
- [ ] All 7 sections included with proper formatting
- [ ] Template includes workflow phases, file types, and principles
- [ ] Content is clear, comprehensive, and actionable
- [ ] No references to MCP tools in the template content
- [ ] Template ready to be added to `COMMAND_TEMPLATES` map

## Estimated Time

25 minutes

## Dependencies

None - can be implemented immediately

## Notes

This is foundational work that other command template stories will build upon. The content should be self-contained and provide complete context without requiring external MCP calls.

