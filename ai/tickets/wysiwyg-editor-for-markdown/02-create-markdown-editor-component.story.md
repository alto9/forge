---
story_id: create-markdown-editor-component
session_id: wysiwyg-editor-for-markdown
feature_id: [wysiwyg-markdown-editor]
spec_id: [wysiwyg-editor-implementation]
model_id: []
status: completed
priority: high
estimated_minutes: 30
---

# Create MarkdownEditor Component with TipTap

## Objective
Create a reusable MarkdownEditor component with TipTap, formatting toolbar, and session-aware editing.

## Context
This component will be used in Actor, Spec, and Context editors. It should follow the Nomnoml pattern: rendered in read-only mode, editable with toolbar when session is active.

## Implementation Steps
1. Create `packages/vscode-extension/src/webview/studio/components/MarkdownEditor.tsx`
2. Initialize TipTap with extensions: StarterKit, Link, Image
3. Create formatting toolbar with buttons:
   - Bold, Italic, Strikethrough
   - Headings (H1, H2, H3)
   - Lists (bullet, numbered)
   - Code (inline, block)
   - Blockquote
   - Link
4. Implement props:
   - `content: string` - Initial markdown
   - `onChange: (markdown: string) => void` - Change handler
   - `readOnly: boolean` - Session-aware editing
5. Follow Nomnoml pattern:
   - Read-only: show rendered content only
   - Edit mode: show toolbar + editor
6. Add 500ms debounced onChange to prevent excessive updates

## Files Affected
- `packages/vscode-extension/src/webview/studio/components/MarkdownEditor.tsx` - New component

## Acceptance Criteria
- [x] Component renders with TipTap editor
- [x] Toolbar shows all formatting buttons
- [x] Buttons apply correct formatting
- [x] Read-only mode hides toolbar and makes content non-editable
- [x] Edit mode shows toolbar and allows editing
- [x] onChange fires after 500ms debounce

## Dependencies
- install-tiptap-dependencies (Story 01)

