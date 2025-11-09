---
story_id: update-forge-command-templates
session_id: organize-sessions-data
feature_id: []
spec_id: [cursor-commands-management]
status: pending
priority: medium
estimated_minutes: 15
---

## Objective

Update both `forge-design.md` and `forge-build.md` command templates to clearly distinguish between design session work (updating AI documentation) and implementation work (writing code).

## Context

The command templates need to be updated to:
- **forge-design**: Emphasize work within design sessions - updating AI documentation only, calling `get_forge_about`, working in `ai/` folder only
- **forge-build**: Clarify it's for implementing stories - writing actual code, tests, following documented design

The spec had these templates confused, so both need to be corrected.

## Implementation Steps

1. Locate templates in `packages/vscode-extension/src/templates/cursorCommands.ts`
2. Update FORGE_DESIGN_TEMPLATE:
   - Update "What This Command Does" to 5 numbered items with bold headers
   - Add "Important Constraints" section with 6 constraints
   - Update "Usage" section to 6 numbered steps
   - Emphasize: design sessions, AI folder only, no implementation code, track changes, proper formats
3. Update FORGE_BUILD_TEMPLATE:
   - Update "What This Command Does" to 7 numbered items with bold headers
   - Add "Important Guidelines" section with 5 guidelines
   - Update "Usage" section to 6 numbered steps
   - Emphasize: implementing stories, writing code and tests, following documented design
4. Update spec documentation to match corrected templates
5. Verify templates include proper escaping for template literals

## Files Affected

- `packages/vscode-extension/src/templates/cursorCommands.ts` - Update both templates
- `ai/specs/extension/cursor-commands-management.spec.md` - Fix mislabeled sections

## Acceptance Criteria

### forge-design Template:
- [ ] Purpose states: "Guides AI agents when working within Forge design sessions to update documentation"
- [ ] "What This Command Does" has 5 numbered items with bold headers
- [ ] "Important Constraints" section exists with 6 bullet points
- [ ] Constraints emphasize: Forge session, AI folder only, no implementation code, track changes, proper formats, call MCP tools
- [ ] "Usage" section has 6 numbered steps
- [ ] Template includes call to `get_forge_about` MCP tool
- [ ] Closing statement mentions "documentation updates"

### forge-build Template:
- [ ] Purpose states: "Helps you implement a Forge story by analyzing both the codebase and AI documentation"
- [ ] "What This Command Does" has 7 numbered items with bold headers
- [ ] "Important Guidelines" section exists with 5 bullet points
- [ ] Guidelines emphasize: follow the story, use AI docs as reference, match patterns, write tests, stay focused
- [ ] "Usage" section has 6 numbered steps
- [ ] Template includes call to `get_forge_about` MCP tool
- [ ] Closing statement mentions "implementation"

### Spec Documentation:
- [ ] forge-design section correctly describes design session work
- [ ] forge-build section correctly describes implementation work
- [ ] Template code examples match actual templates

## Dependencies

None

