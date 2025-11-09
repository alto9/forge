---
story_id: integrate-with-spec-editor-and-move-diagrams
session_id: wysiwyg-editor-for-markdown
feature_id: [wysiwyg-markdown-editor]
spec_id: [wysiwyg-editor-implementation]
model_id: []
status: completed
priority: high
estimated_minutes: 30
---

# Integrate MarkdownEditor with Spec Files and Move Diagrams to Top

## Objective
Replace the textarea in Spec file editor with MarkdownEditor AND render Nomnoml diagrams at the top of the file view.

## Context
Spec files have frontmatter, markdown body, and embedded Nomnoml diagrams. The diagrams should be extracted and rendered at the top, while the remaining markdown content uses the WYSIWYG editor.

## Implementation Steps
1. Open `packages/vscode-extension/src/webview/studio/index.tsx`
2. Find the Spec file editor section
3. Create utility to parse spec files:
   - Extract frontmatter (YAML)
   - Extract Nomnoml code blocks (```nomnoml)
   - Extract remaining markdown content
4. Render spec editor in order:
   - Frontmatter form (top)
   - Nomnoml diagrams rendered (below frontmatter)
   - MarkdownEditor for remaining content (below diagrams)
5. Replace markdown textarea with:
   ```tsx
   <MarkdownEditor
     content={specMarkdown}
     onChange={(markdown) => updateSpecBody(markdown)}
     readOnly={!activeSession}
   />
   ```
6. On save, reconstruct file: frontmatter + diagrams + markdown
7. Test with existing spec files

## Files Affected
- `packages/vscode-extension/src/webview/studio/index.tsx` - Update spec editor layout
- `packages/vscode-extension/src/webview/studio/utils/specParser.ts` - New parser utility (optional)

## Acceptance Criteria
- [x] Spec files parse correctly
- [x] Nomnoml diagrams render at top (after frontmatter)
- [x] Markdown body uses WYSIWYG editor
- [x] Read-only mode works correctly (diagrams + rendered markdown)
- [x] Edit mode shows toolbar for markdown
- [x] Diagrams remain in source on save
- [x] File structure preserved on save

## Implementation Notes
- Read-only mode: Diagrams rendered at top, markdown content in MarkdownEditor (read-only)
- Edit mode: 
  - Diagrams section with Source/Render toggle (existing behavior)
  - Markdown section with WYSIWYG editor below diagrams
- Used existing `extractNomnomlBlocks()` function to separate diagram/text content
- onChange handlers reconstruct full content by joining diagrams + markdown
- Build successful: webview bundle 681.9kb

## Dependencies
- integrate-with-actor-editor (Story 05)

