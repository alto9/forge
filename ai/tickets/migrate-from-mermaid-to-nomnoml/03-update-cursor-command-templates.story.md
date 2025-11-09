---
story_id: update-cursor-command-templates
session_id: migrate-from-mermaid-to-nomnoml
feature_id: []
spec_id: [cursor-commands-management]
status: pending
priority: high
estimated_minutes: 10
---

## Objective

Update the cursor command templates to reference nomnoml instead of mermaid in their instructions and descriptions.

## Context

The cursor command templates (used for design sessions and story building) still reference mermaid diagrams. These need to be updated to reference nomnoml so generated prompts guide AI agents correctly.

## Implementation Steps

1. Open `packages/vscode-extension/src/templates/cursorCommands.ts`
2. Find all references to "Mermaid" (case-insensitive)
3. Replace with "Nomnoml"
4. Update line 28: "Specs use Mermaid diagrams" → "Specs use Nomnoml diagrams"
5. Update line 60: "technical implementation details with Mermaid diagrams" → "technical implementation details with Nomnoml diagrams"

## Files Affected

- `packages/vscode-extension/src/templates/cursorCommands.ts` - Update text references

## Acceptance Criteria

- [ ] All references to "Mermaid" are replaced with "Nomnoml"
- [ ] Command templates guide agents to use nomnoml syntax
- [ ] No references to mermaid remain in command templates
- [ ] Generated commands include correct diagram format

## Dependencies

None

