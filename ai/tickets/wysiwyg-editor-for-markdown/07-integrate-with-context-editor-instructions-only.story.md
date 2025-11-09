---
story_id: integrate-with-context-editor-instructions-only
session_id: wysiwyg-editor-for-markdown
feature_id: [wysiwyg-markdown-editor]
spec_id: [wysiwyg-editor-implementation]
model_id: []
status: completed
priority: high
estimated_minutes: 30
---

# Integrate MarkdownEditor with Context Files (Instructions Section Only)

## Objective
Add WYSIWYG editor to Context files for the "Instructions" section, while keeping Gherkin scenarios rendered as they are now.

## Context
Context files have frontmatter, Instructions section (markdown), and Gherkin scenarios (code blocks). Only the Instructions section should use WYSIWYG; scenarios remain rendered as-is.

## Implementation Steps
1. Open `packages/vscode-extension/src/webview/studio/index.tsx`
2. Find the Context file editor section
3. Create utility to parse context files:
   - Extract frontmatter (YAML)
   - Extract Instructions section (markdown before first Gherkin block)
   - Extract Gherkin scenario blocks (```gherkin)
4. Render context editor in order:
   - Frontmatter form (top)
   - MarkdownEditor for Instructions section
   - Rendered Gherkin scenarios (existing rendering)
5. Replace instructions textarea with:
   ```tsx
   <MarkdownEditor
     content={instructionsMarkdown}
     onChange={(markdown) => updateInstructions(markdown)}
     readOnly={!activeSession}
   />
   ```
6. Keep Gherkin scenarios read-only and rendered
7. On save, reconstruct file: frontmatter + instructions + scenarios
8. Test with existing context files

## Files Affected
- `packages/vscode-extension/src/webview/studio/index.tsx` - Update context editor
- `packages/vscode-extension/src/webview/studio/utils/contextParser.ts` - New parser utility (optional)

## Acceptance Criteria
- [x] Context files parse correctly
- [x] Instructions section uses WYSIWYG editor
- [x] Gherkin scenarios render as before (no editor)
- [x] Read-only mode works for instructions (toolbar hidden)
- [x] Edit mode shows toolbar for instructions
- [x] Scenarios preserved on save
- [x] File structure maintained

## Implementation Notes
- Replaced Instructions textarea (lines 1703-1710) with MarkdownEditor component
- Instructions section (parsedContext.instructions) already separated from Gherkin
- Gherkin sections (Background, Rules, Scenarios) remain unchanged with existing components
- MarkdownEditor handles read-only mode automatically based on activeSession
- onChange updates parsedContext.instructions directly
- Build successful: webview bundle 681.8kb

## Dependencies
- integrate-with-spec-editor-and-move-diagrams (Story 06)

