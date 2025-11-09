---
session_id: wysiwyg-editor-for-markdown
start_time: '2025-11-09T03:07:13.498Z'
status: awaiting_implementation
problem_statement: wysiwyg editor for markdown
changed_files:
  - ai/features/studio/editors/wysiwyg-markdown-editor.feature.md
  - ai/specs/studio/wysiwyg-editor-implementation.spec.md
  - ai/contexts/vscode/wysiwyg-markdown-editor-guidance.context.md
end_time: '2025-11-09T03:19:37.526Z'
command_file: .cursor/commands/create-stories-wysiwyg-editor-for-markdown.md
---
## Problem Statement

wysiwyg editor for markdown

## Goals

Implement a wysiwyg editor for markdown within Forge studio for easier editing.

## Approach

Add this editor to all places where markdown is displayed in text editors.

## Key Decisions

1. **TipTap as Editor Framework**: Selected TipTap editor framework over alternatives (Slate, Quill, Draft.js) because:
   - Built on ProseMirror (mature, battle-tested)
   - React-friendly with hooks API
   - Excellent TypeScript support
   - Built-in markdown support via extensions
   - Extensible architecture for future enhancements

2. **Dual-Mode Editing**: Implemented both WYSIWYG and source view modes:
   - WYSIWYG for visual editing (default for most users)
   - Source view for markdown purists and edge cases
   - Easy toggle between modes preserves all content

3. **Bidirectional Markdown Conversion**:
   - Use **turndown** library for HTML → Markdown (clean, reliable)
   - Use **marked** library for Markdown → HTML (GitHub Flavored Markdown support)
   - Custom turndown rules to preserve Gherkin blocks and special content

4. **Separation of Concerns**: WYSIWYG editor handles markdown content only:
   - Frontmatter remains in form fields (not editable in WYSIWYG)
   - Gherkin blocks remain in structured editor (not editable in WYSIWYG)
   - WYSIWYG only edits non-structured markdown sections

5. **Session-Aware Editing**: Read-only mode when no active session:
   - Toolbar hidden in read-only mode
   - Editor not editable without session
   - Consistent with existing Studio behavior

6. **Auto-Save with Debouncing**: 500ms debounce on save:
   - Prevents excessive file writes
   - Matches existing Studio auto-save behavior
   - Silent save (no UI confirmation)

7. **CRITICAL: Follow Nomnoml Diagram Pattern Exactly**:
   - **Read-only mode (no session)**: Content is RENDERED (not source), no toggle visible
   - **Edit mode (with session)**: Toggle between "Visual" and "Source" modes
   - This provides consistency across all Studio content types
   - Reference: Nomnoml diagrams in `index.tsx` lines 1556-1837
   - State pattern: `diagramViewMode: 'source' | 'rendered'`
   - Toggle visibility: Only when `!isReadOnly`

## Notes

### Implementation Approach

The WYSIWYG editor will be integrated into Forge Studio in phases:

**Phase 1**: Add to simple file types (specs, models, actors, contexts)
- These files have straightforward markdown (no Gherkin)
- Use MarkdownEditor component with TipTap
- Replace existing plain textarea editors

**Phase 2**: Integrate with feature files
- Feature files have both Gherkin and markdown
- Parse file: frontmatter + Gherkin blocks + markdown content
- Use GherkinEditor for Gherkin sections
- Use MarkdownEditor for other content
- Serialize back together on save

**Phase 3**: Polish and enhancement
- Add table editing support
- Add image upload capability (to project directory)
- Improve keyboard shortcuts
- Add undo/redo across sessions

**Phase 4**: Future possibilities
- Real-time collaboration via Y.js extension
- AI-assisted content generation
- Visual diagram editors for Nomnoml/Mermaid
- Cross-file references (clickable links to other Forge files)

### Technical Considerations

- **Performance**: TipTap performs well up to ~5,000 lines. For larger files, consider fallback to plain textarea.
- **Bundle Size**: TipTap + extensions add ~100KB to bundle. Use lazy loading to minimize initial load time.
- **Browser Compatibility**: TipTap requires modern browsers (ES2015+). Not an issue for VSCode webviews.
- **Theme Integration**: Use VSCode CSS variables for all styling to ensure seamless theme adaptation.

### Files Created

1. **Feature**: `ai/features/studio/editors/wysiwyg-markdown-editor.feature.md`
   - Comprehensive Gherkin scenarios for all WYSIWYG functionality
   - Covers toolbar actions, keyboard shortcuts, view toggle, read-only mode
   - Includes table editing, Gherkin preservation, auto-save

2. **Spec**: `ai/specs/studio/wysiwyg-editor-implementation.spec.md`
   - Technical implementation using TipTap framework
   - Component architecture and state management
   - Markdown conversion strategies
   - VSCode theme integration patterns
   - Testing strategy and performance considerations

3. **Context**: `ai/contexts/vscode/wysiwyg-markdown-editor-guidance.context.md`
   - Guidance for working with TipTap editor
   - Gherkin scenarios for when to use this context
   - Best practices for markdown conversion
   - Common gotchas and solutions
   - Performance optimization tips

### Next Steps

When this session is distilled into stories:

- Break implementation into minimal stories (< 30 min each)
- Start with core MarkdownEditor component
- Then add toolbar and formatting actions
- Then integrate with file editors
- Then add advanced features (tables, images)
- Each story should be independently testable and deployable
