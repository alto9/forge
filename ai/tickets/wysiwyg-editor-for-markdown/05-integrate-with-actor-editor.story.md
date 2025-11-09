---
story_id: integrate-with-actor-editor
session_id: wysiwyg-editor-for-markdown
feature_id: [wysiwyg-markdown-editor]
spec_id: [wysiwyg-editor-implementation]
model_id: []
status: completed
priority: high
estimated_minutes: 25
---

# Integrate MarkdownEditor with Actor Files

## Objective
Replace the plain textarea in Actor file editor with the MarkdownEditor component for the main body content.

## Context
Actor files have frontmatter (form fields) and markdown body. Replace the body textarea with WYSIWYG editor while keeping frontmatter as form fields.

## Implementation Steps
1. Open `packages/vscode-extension/src/webview/studio/index.tsx`
2. Find the Actor file editor section
3. Import MarkdownEditor component
4. Replace the textarea for actor body content with:
   ```tsx
   <MarkdownEditor
     content={actorBody}
     onChange={(markdown) => updateActorBody(markdown)}
     readOnly={!activeSession}
   />
   ```
5. Ensure frontmatter remains in form fields (not in editor)
6. On save, reconstruct file: frontmatter + body
7. Test with existing actor files

## Files Affected
- `packages/vscode-extension/src/webview/studio/index.tsx` - Replace actor textarea

## Acceptance Criteria
- [x] Actor files open with WYSIWYG editor for body
- [x] Frontmatter editor (form) still works
- [x] Read-only mode shows rendered content (toolbar hidden)
- [x] Edit mode shows toolbar and allows editing
- [x] Auto-save updates actor file correctly (500ms debounce)
- [x] File format preserved (frontmatter + body)

## Implementation Notes
- Replaced textarea at lines 1840-1850 with MarkdownEditor component
- MarkdownEditor automatically handles read-only mode based on activeSession
- Existing updateContent function works seamlessly with MarkdownEditor's onChange
- Build successful: webview bundle is 681.6kb (TipTap added ~100KB)

## Dependencies
- add-markdown-conversion-utilities (Story 03)
- add-vscode-theme-styling (Story 04)

