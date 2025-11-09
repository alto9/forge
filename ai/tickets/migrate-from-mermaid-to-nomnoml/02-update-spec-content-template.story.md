---
story_id: update-spec-content-template
session_id: migrate-from-mermaid-to-nomnoml
feature_id: [spec-creation]
spec_id: [forge-studio-implementation]
status: pending
priority: high
estimated_minutes: 10
---

## Objective

Update the spec content template in ForgeStudioPanel.ts to use nomnoml diagram syntax instead of mermaid when creating new spec files.

## Context

The session has migrated all existing specs to use nomnoml, but the template used when creating new specs still generates mermaid syntax. This needs to be updated so new specs use nomnoml by default.

## Implementation Steps

1. Open `packages/vscode-extension/src/panels/ForgeStudioPanel.ts`
2. Locate the `_getContentTemplate` method around line 1327
3. Find the 'specs' case that contains the mermaid template (lines 1334-1337)
4. Replace the mermaid diagram template with nomnoml template:
   - Change ` ```mermaid ` to ` ```nomnoml `
   - Replace `graph TD` with nomnoml structure
   - Update example from `A[Component A] --> B[Component B]` to nomnoml syntax

## Files Affected

- `packages/vscode-extension/src/panels/ForgeStudioPanel.ts` - Update spec template

## Acceptance Criteria

- [ ] Spec template uses ` ```nomnoml ` instead of ` ```mermaid `
- [ ] Example diagram uses valid nomnoml syntax
- [ ] Template includes nomnoml directives (#direction, #padding)
- [ ] Creating a new spec in Studio generates nomnoml diagram

## Dependencies

None

