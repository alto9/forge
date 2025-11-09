---
story_id: add-markdown-conversion-utilities
session_id: wysiwyg-editor-for-markdown
feature_id: [wysiwyg-markdown-editor]
spec_id: [wysiwyg-editor-implementation]
model_id: []
status: completed
priority: high
estimated_minutes: 15
---

# Add Markdown Conversion Utilities

## Objective
Create utility functions to convert between markdown and HTML using turndown and marked libraries.

## Context
TipTap works with HTML internally, but Forge files are markdown. We need bidirectional conversion that preserves formatting.

## Implementation Steps
1. Create `packages/vscode-extension/src/webview/studio/utils/markdown.ts`
2. Implement `markdownToHtml(markdown: string): string`:
   - Use marked with GitHub Flavored Markdown
   - Configure: `gfm: true, breaks: true`
3. Implement `htmlToMarkdown(html: string): string`:
   - Use turndown
   - Configure: `headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-'`
4. Export both functions
5. Wire into MarkdownEditor component:
   - Load content: `markdownToHtml(content)`
   - Save content: `htmlToMarkdown(editor.getHTML())`

## Files Affected
- `packages/vscode-extension/src/webview/studio/utils/markdown.ts` - New utility file
- `packages/vscode-extension/src/webview/studio/components/MarkdownEditor.tsx` - Use utilities

## Acceptance Criteria
- [x] markdownToHtml() converts markdown to HTML correctly
- [x] htmlToMarkdown() converts HTML back to markdown correctly
- [x] Headings use # syntax
- [x] Code blocks use ``` syntax
- [x] Links use [text](url) syntax
- [x] MarkdownEditor uses conversion utilities

## Dependencies
- create-markdown-editor-component (Story 02)

