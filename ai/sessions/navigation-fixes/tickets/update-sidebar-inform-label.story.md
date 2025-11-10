---
story_id: update-sidebar-inform-label
session_id: navigation-fixes
feature_id: []
spec_id: [navigation-menu-implementation]
model_id: []
status: completed
priority: high
estimated_minutes: 5
---

# Story: Update Sidebar Navigation Label from FOUNDATIONAL to INFORM

## Objective

Update the Forge Studio sidebar navigation to use "INFORM" instead of "FOUNDATIONAL" for the first section header, making the navigation menu clearer and better communicating that Actors, Contexts, and Sessions inform the design work.

## Context

As part of the navigation-fixes session, the team decided to rename the "FOUNDATIONAL" section to "INFORM" to better communicate its purpose. This section contains Actors, Contexts, and Sessions which are always accessible and provide information that informs design decisions. The name "INFORM" more clearly conveys this relationship compared to "FOUNDATIONAL".

## Implementation Steps

1. Open `packages/vscode-extension/src/webview/studio/components/Sidebar.tsx`
2. Update line 61: Change comment from "Sidebar component with FOUNDATIONAL and DESIGN sections" to "Sidebar component with INFORM and DESIGN sections"
3. Update line 104: Change comment from "/* Foundational Section */" to "/* Inform Section */"
4. Update line 106: Change `title="FOUNDATIONAL"` to `title="INFORM"`

## Files Affected

- `packages/vscode-extension/src/webview/studio/components/Sidebar.tsx` - Update section title and comments

## Acceptance Criteria

- [ ] The sidebar navigation displays "INFORM" as the section header (was "FOUNDATIONAL")
- [ ] The comment on line 61 refers to "INFORM and DESIGN sections"
- [ ] The comment on line 104 says "/* Inform Section */"
- [ ] The navigation menu is visually unchanged except for the label text
- [ ] All navigation items (Actors, Contexts, Sessions) still appear under the INFORM section
- [ ] The DESIGN section remains unchanged
- [ ] No TypeScript errors introduced
- [ ] The Forge Studio webview displays correctly with the new label

## Dependencies

None

## Notes

- This is a simple text change - no logic or styling changes required
- The variable name `foundationalItems` on line 68 can remain as-is for backward compatibility
- The change aligns with the architectural decision documented in `ai/specs/studio/navigation-menu-implementation.spec.md` and `ai/diagrams/studio/navigation-menu-structure.diagram.md`

