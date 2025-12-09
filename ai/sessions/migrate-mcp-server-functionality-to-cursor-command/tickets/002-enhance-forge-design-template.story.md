---
story_id: 002-enhance-forge-design-template
session_id: migrate-mcp-server-functionality-to-cursor-command
feature_id:
  - cursor-commands-migration
spec_id:
  - forge-design-enhanced
  - cursor-commands-management
status: completed
---

# Enhance /forge-design Template with Embedded Schemas

## Objective

Update the existing `FORGE_DESIGN_TEMPLATE` to embed all four document schemas (Actor, Feature, Spec, Diagram) directly in the command file, eliminating the need for `get_forge_schema` MCP calls.

## Context

The enhanced `/forge-design` command will be self-contained with complete schema information, allowing AI agents to create properly formatted Forge documentation files without external MCP dependencies.

## Files to Modify

- `packages/vscode-extension/src/templates/cursorCommands.ts`

## Implementation Steps

1. Update `FORGE_DESIGN_TEMPLATE` constant in `cursorCommands.ts`
2. Add "Document Schemas" section with all 4 schemas:
   - Actor Schema (*.actor.md) with frontmatter, structure, and example
   - Feature Schema (*.feature.md) with frontmatter, Gherkin format, and example
   - Spec Schema (*.spec.md) with frontmatter, structure, and example
   - Diagram Schema (*.diagram.md) with frontmatter, React Flow JSON, and example
3. Remove "Calls MCP Tools" from "What This Command Does" section
4. Update first bullet to: "Provides complete schema information"
5. Add note to constraints: "No MCP tools needed: All schemas embedded"
6. Keep existing file type guidance and constraints

## Acceptance Criteria

- [ ] All 4 schemas embedded with complete examples
- [ ] Each schema includes: purpose, naming, location, frontmatter, structure
- [ ] MCP tool references removed from template
- [ ] "What This Command Does" updated to reflect self-contained design
- [ ] Template remains clear and well-organized
- [ ] Schema content matches original MCP server schemas

## Estimated Time

30 minutes

## Dependencies

None - can be implemented in parallel with 001

## Notes

Total added content is approximately 2,900 tokens, which is less than 3% of typical AI context windows. The self-contained benefit outweighs the minor token cost.

