---
story_id: install-tiptap-dependencies
session_id: wysiwyg-editor-for-markdown
feature_id: [wysiwyg-markdown-editor]
spec_id: [wysiwyg-editor-implementation]
model_id: []
status: completed
priority: high
estimated_minutes: 10
---

# Install TipTap Dependencies

## Objective
Install TipTap editor framework and markdown conversion libraries.

## Context
We need TipTap (React WYSIWYG editor) and conversion libraries (turndown, marked) to enable rich text editing in Actor, Spec, and Context files.

## Implementation Steps
1. Navigate to `packages/vscode-extension/`
2. Install packages:
   ```bash
   npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image turndown marked
   ```
3. Install type definitions:
   ```bash
   npm install -D @types/turndown
   ```
4. Verify package.json updated correctly

## Files Affected
- `packages/vscode-extension/package.json` - Add dependencies

## Acceptance Criteria
- [x] All packages installed successfully
- [x] No dependency conflicts
- [x] `npm install` runs without errors

## Dependencies
None

