---
story_id: add-vscode-theme-styling
session_id: wysiwyg-editor-for-markdown
feature_id: [wysiwyg-markdown-editor]
spec_id: [wysiwyg-editor-implementation]
model_id: []
status: completed
priority: medium
estimated_minutes: 20
---

# Add VSCode Theme Styling

## Objective
Style the MarkdownEditor with VSCode CSS variables for seamless theme integration.

## Context
All Studio components must use VSCode theme variables to adapt to dark/light/high-contrast themes automatically.

## Implementation Steps
1. Add CSS to studio stylesheet
2. Style `.markdown-editor`:
   - Background: `var(--vscode-editor-background)`
   - Color: `var(--vscode-editor-foreground)`
3. Style `.editor-toolbar`:
   - Background: `var(--vscode-sideBar-background)`
   - Border: `var(--vscode-panel-border)`
4. Style toolbar buttons:
   - Active state: `var(--vscode-button-background)`, `var(--vscode-button-foreground)`
   - Inactive: transparent with `var(--vscode-foreground)`
5. Style editor content:
   - Headings, code, links, blockquotes with theme variables
   - Code blocks: `var(--vscode-textCodeBlock-background)`
   - Links: `var(--vscode-textLink-foreground)`

## Files Affected
- `packages/vscode-extension/media/studio/studio.css` - Add editor styles

## Acceptance Criteria
- [x] Editor adapts to dark theme
- [x] Editor adapts to light theme
- [x] All colors use VSCode theme variables
- [x] Toolbar buttons have proper hover/active states
- [x] Content rendering matches VSCode styling

## Implementation Notes
All VSCode theme styling was implemented inline in Story 02 using VSCode CSS variables:
- Container: `var(--vscode-editor-background)`, `var(--vscode-editor-foreground)`
- Toolbar: `var(--vscode-sideBar-background)`, `var(--vscode-panel-border)`
- Buttons: `var(--vscode-button-background)`, `var(--vscode-button-foreground)`
- Content: `var(--vscode-textCodeBlock-background)`, `var(--vscode-textLink-foreground)`, etc.
- All styles adapt automatically to theme changes

## Dependencies
- create-markdown-editor-component (Story 02)

