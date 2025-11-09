---
spec_id: wysiwyg-editor-implementation
name: WYSIWYG Markdown Editor Implementation
description: Technical specification for implementing a WYSIWYG markdown editor using TipTap
feature_id: [wysiwyg-markdown-editor]
context_id: [wysiwyg-markdown-editor-guidance, theme]
---

# WYSIWYG Markdown Editor Implementation

## Overview

This specification defines the technical implementation of a WYSIWYG (What You See Is What You Get) markdown editor for Forge Studio. The editor will allow developers to edit markdown content with rich text formatting while maintaining compatibility with the existing structured Gherkin editor and the markdown-based file system.

## Critical Pattern Requirement

**MUST follow the exact same pattern as Nomnoml diagrams:**

### Read-Only Mode (No Active Session)
- Content is RENDERED as formatted HTML/rich text
- NO toggle button visible
- NO source code visible
- NO toolbar visible
- Content is display-only (not editable)
- This matches Nomnoml diagrams which render as SVG (not source) in read-only mode

### Edit Mode (Active Session)
- Toggle button IS visible with "Visual" and "Source" options
- "Visual" mode: WYSIWYG editor with formatting toolbar
- "Source" mode: Plain textarea with raw markdown
- User can switch between modes at will
- This matches Nomnoml diagrams which show "Source" and "Render" toggle in edit mode

**Reference Implementation:**
- See `packages/vscode-extension/src/webview/studio/index.tsx` lines 1556-1837
- Nomnoml toggle: `diagramViewMode` state with 'source' | 'rendered'
- Toggle only visible when `!isReadOnly` (active session exists)

## Technology Stack

### TipTap Editor

We will use **TipTap** as the WYSIWYG editor framework:
- Built on ProseMirror (powerful editing foundation)
- React-friendly with hooks API
- Extensible architecture with plugins
- Markdown import/export built-in
- Keyboard shortcut support
- Collaborative editing capable (future)
- TypeScript support

### Installation

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header
```

## Architecture

### Component Structure

```nomnoml
#direction: down
#padding: 10

[FileEditor Component] -> [MarkdownEditor Component]
[MarkdownEditor Component] -> [TipTapEditor (WYSIWYG)]
[MarkdownEditor Component] -> [SourceEditor (Raw Markdown)]
[MarkdownEditor Component] contains -> [ToolbarComponent]
[MarkdownEditor Component] contains -> [ViewToggle]

[TipTapEditor (WYSIWYG)] -> [TipTap Extensions|
  StarterKit
  Link
  Image
  Table
  CodeBlock
  Blockquote]

[TipTapEditor (WYSIWYG)] markdown <-> [MarkdownConverter]
[SourceEditor (Raw Markdown)] markdown <-> [MarkdownConverter]
[MarkdownConverter] -> [FileSystem]

[GherkinEditor Component] gherkin -> [FileEditor Component]
[TipTapEditor (WYSIWYG)] content -> [FileEditor Component]
```

### State Management

```nomnoml
#direction: down
#padding: 10

[FileEditor State|
  content: string
  mode: 'wysiwyg' | 'source'
  readOnly: boolean]

[FileEditor State] -> [TipTapEditor]
[FileEditor State] -> [SourceEditor]
[FileEditor State] -> [AutoSave Hook]

[AutoSave Hook] debounce 500ms -> [Save to Extension]
[Save to Extension] -> [FileSystem]
[FileSystem] update -> [Session Tracking]
```

## Implementation Details

### TipTap Configuration

Create a `useTipTapEditor` hook:

```typescript
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';

export const useTipTapEditor = (
  content: string,
  onUpdate: (markdown: string) => void,
  readOnly: boolean
) => {
  return useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default, use lowlight version
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'forge-link',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'forge-image',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const markdown = editorToMarkdown(editor.getHTML());
      onUpdate(markdown);
    },
  });
};
```

### Markdown Conversion

Create bidirectional markdown converters:

```typescript
// Convert TipTap HTML to Markdown
export function editorToMarkdown(html: string): string {
  // Use turndown library for HTML to Markdown
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });
  
  // Add custom rules for preserving Gherkin blocks
  turndownService.addRule('gherkin-block', {
    filter: (node) => {
      return node.classList?.contains('gherkin-block');
    },
    replacement: (content, node) => {
      return '\n```gherkin\n' + node.textContent + '\n```\n';
    },
  });
  
  return turndownService.turndown(html);
}

// Convert Markdown to TipTap content
export function markdownToEditor(markdown: string): string {
  // Use marked library for Markdown to HTML
  const html = marked(markdown, {
    gfm: true,
    breaks: true,
  });
  
  return html;
}
```

### Toolbar Component

Create a formatting toolbar with VSCode theme integration:

```typescript
interface ToolbarProps {
  editor: Editor | null;
  readOnly: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ editor, readOnly }) => {
  if (!editor || readOnly) return null;

  return (
    <div className="editor-toolbar">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        icon={<BoldIcon />}
        tooltip="Bold (Cmd+B)"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        icon={<ItalicIcon />}
        tooltip="Italic (Cmd+I)"
      />
      <ToolbarDivider />
      <HeadingDropdown editor={editor} />
      <ToolbarDivider />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        icon={<BulletListIcon />}
        tooltip="Bullet List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        icon={<NumberedListIcon />}
        tooltip="Numbered List"
      />
      <ToolbarDivider />
      <LinkButton editor={editor} />
      <ImageButton editor={editor} />
      <ToolbarDivider />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        icon={<CodeBlockIcon />}
        tooltip="Code Block"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        icon={<InlineCodeIcon />}
        tooltip="Inline Code (Cmd+E)"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        icon={<BlockquoteIcon />}
        tooltip="Blockquote"
      />
      <ToolbarDivider />
      <TableButton editor={editor} />
    </div>
  );
};
```

### View Toggle Component

**IMPORTANT**: Follows the same pattern as Nomnoml diagram toggle.

- **Read-only mode (no session)**: NO toggle visible, content is RENDERED
- **Edit mode (with session)**: Toggle visible, switch between "Visual" (WYSIWYG) and "Source" (raw markdown)

```typescript
interface ViewToggleProps {
  mode: 'wysiwyg' | 'source';
  onModeChange: (mode: 'wysiwyg' | 'source') => void;
  readOnly: boolean; // Only show toggle when readOnly is false
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ mode, onModeChange, readOnly }) => {
  // Hide toggle in read-only mode (same as Nomnoml diagrams)
  if (readOnly) return null;

  return (
    <div className="view-toggle" style={{
      display: 'flex',
      gap: '4px',
      padding: '8px',
      borderBottom: '1px solid var(--vscode-panel-border)',
    }}>
      <button
        className={mode === 'wysiwyg' ? 'active' : ''}
        onClick={() => onModeChange('wysiwyg')}
        style={{
          padding: '6px 12px',
          background: mode === 'wysiwyg'
            ? 'var(--vscode-button-background)'
            : 'transparent',
          color: mode === 'wysiwyg'
            ? 'var(--vscode-button-foreground)'
            : 'var(--vscode-foreground)',
          border: '1px solid var(--vscode-panel-border)',
          cursor: 'pointer',
        }}
      >
        Visual
      </button>
      <button
        className={mode === 'source' ? 'active' : ''}
        onClick={() => onModeChange('source')}
        style={{
          padding: '6px 12px',
          background: mode === 'source'
            ? 'var(--vscode-button-background)'
            : 'transparent',
          color: mode === 'source'
            ? 'var(--vscode-button-foreground)'
            : 'var(--vscode-foreground)',
          border: '1px solid var(--vscode-panel-border)',
          cursor: 'pointer',
        }}
      >
        Source
      </button>
    </div>
  );
};
```

### Source Editor Component

Simple textarea for editing raw markdown:

```typescript
interface SourceEditorProps {
  content: string;
  onChange: (content: string) => void;
  readOnly: boolean;
}

export const SourceEditor: React.FC<SourceEditorProps> = ({
  content,
  onChange,
  readOnly,
}) => {
  return (
    <textarea
      className="source-editor"
      value={content}
      onChange={(e) => onChange(e.target.value)}
      readOnly={readOnly}
      spellCheck={false}
    />
  );
};
```

### Main MarkdownEditor Component

Compose all pieces following the Nomnoml pattern:

```typescript
interface MarkdownEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  readOnly: boolean;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  initialContent,
  onSave,
  readOnly,
}) => {
  // Default to 'wysiwyg' mode for editing, always render in read-only
  const [mode, setMode] = useState<'wysiwyg' | 'source'>('wysiwyg');
  const [content, setContent] = useState(initialContent);

  // Debounced save
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (content !== initialContent && !readOnly) {
        onSave(content);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [content, initialContent, onSave, readOnly]);

  // In read-only mode, TipTap is used only for RENDERING (not editing)
  const editor = useTipTapEditor(
    markdownToEditor(content),
    (markdown) => setContent(markdown),
    readOnly // When true, editor is display-only
  );

  return (
    <div className="markdown-editor">
      {/* Toggle only visible when editing (readOnly = false) */}
      {/* Same pattern as Nomnoml diagrams */}
      <ViewToggle 
        mode={mode} 
        onModeChange={setMode}
        readOnly={readOnly}
      />
      
      {readOnly ? (
        // READ-ONLY MODE: Always show rendered content (no toolbar, no source option)
        // This matches Nomnoml behavior where diagrams are always rendered in read-only
        <div className="editor-content rendered-only">
          <EditorContent editor={editor} className="editor-content" />
        </div>
      ) : (
        // EDIT MODE: Show toggle between Visual (WYSIWYG) and Source
        <>
          {mode === 'wysiwyg' ? (
            <>
              <Toolbar editor={editor} readOnly={readOnly} />
              <EditorContent editor={editor} className="editor-content" />
            </>
          ) : (
            <SourceEditor
              content={content}
              onChange={setContent}
              readOnly={readOnly}
            />
          )}
        </>
      )}
    </div>
  );
};
```

## Integration Points

### Feature Files

For feature files, integrate both Gherkin and Markdown editors:

```typescript
export const FeatureEditor: React.FC<FeatureEditorProps> = ({
  filePath,
  frontmatter,
  content,
  readOnly,
}) => {
  const { gherkinBlocks, otherContent } = parseFeatureContent(content);

  return (
    <div className="feature-editor">
      {/* Frontmatter editor */}
      <FrontmatterEditor frontmatter={frontmatter} readOnly={readOnly} />
      
      {/* Gherkin structured editor */}
      <GherkinEditor blocks={gherkinBlocks} readOnly={readOnly} />
      
      {/* WYSIWYG editor for other content */}
      <MarkdownEditor
        initialContent={otherContent}
        onSave={(markdown) => saveFeature(filePath, frontmatter, gherkinBlocks, markdown)}
        readOnly={readOnly}
      />
    </div>
  );
};
```

### Other File Types

For specs, models, actors, contexts - use WYSIWYG editor for all content except frontmatter:

```typescript
export const GenericFileEditor: React.FC<GenericFileEditorProps> = ({
  filePath,
  frontmatter,
  content,
  readOnly,
}) => {
  return (
    <div className="generic-file-editor">
      <FrontmatterEditor frontmatter={frontmatter} readOnly={readOnly} />
      <MarkdownEditor
        initialContent={content}
        onSave={(markdown) => saveFile(filePath, frontmatter, markdown)}
        readOnly={readOnly}
      />
    </div>
  );
};
```

## Styling

Use VSCode CSS variables for theming:

```css
.markdown-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
}

.editor-header {
  display: flex;
  justify-content: flex-end;
  padding: 8px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.editor-toolbar {
  display: flex;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid var(--vscode-panel-border);
  background: var(--vscode-sideBar-background);
}

.editor-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.editor-content .ProseMirror {
  outline: none;
  min-height: 100%;
}

.editor-content h1 {
  font-size: 2em;
  font-weight: bold;
  margin: 0.67em 0;
}

.editor-content h2 {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0.75em 0;
}

.editor-content code {
  background: var(--vscode-textCodeBlock-background);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: var(--vscode-editor-font-family);
}

.editor-content pre {
  background: var(--vscode-textCodeBlock-background);
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

.editor-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.editor-content table td,
.editor-content table th {
  border: 1px solid var(--vscode-panel-border);
  padding: 8px;
  text-align: left;
}

.editor-content table th {
  background: var(--vscode-sideBar-background);
  font-weight: bold;
}

.editor-content a {
  color: var(--vscode-textLink-foreground);
  text-decoration: none;
}

.editor-content a:hover {
  text-decoration: underline;
}

.editor-content blockquote {
  border-left: 4px solid var(--vscode-panel-border);
  padding-left: 16px;
  margin-left: 0;
  font-style: italic;
  color: var(--vscode-descriptionForeground);
}

.source-editor {
  flex: 1;
  width: 100%;
  padding: 16px;
  background: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
  border: none;
  outline: none;
  resize: none;
  font-family: var(--vscode-editor-font-family);
  font-size: var(--vscode-editor-font-size);
  line-height: 1.6;
}
```

## Keyboard Shortcuts

TipTap provides built-in keyboard shortcuts:

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl + B | Bold |
| Cmd/Ctrl + I | Italic |
| Cmd/Ctrl + K | Link |
| Cmd/Ctrl + E | Inline code |
| Cmd/Ctrl + Shift + E | Code block |
| Cmd/Ctrl + Shift + 7 | Ordered list |
| Cmd/Ctrl + Shift + 8 | Bullet list |
| Cmd/Ctrl + Shift + 9 | Blockquote |
| Cmd/Ctrl + Alt + 1-6 | Heading level |
| Tab (in list) | Increase indent |
| Shift + Tab (in list) | Decrease indent |

## Testing Strategy

### Unit Tests

Test individual components:
- Toolbar button actions
- Markdown conversion (markdown ↔ HTML)
- View toggle functionality
- Debounced save behavior

### Integration Tests

Test full editor flow:
- Load markdown → display in WYSIWYG → edit → save → verify markdown output
- Switch between visual and source modes → verify content preservation
- Apply formatting → verify markdown syntax
- Insert links, images, tables → verify markdown structure

### Manual Testing

- Open various file types in Studio
- Apply all formatting options
- Test keyboard shortcuts
- Test read-only mode when no session active
- Verify auto-save after edits
- Verify Gherkin blocks remain separate

## Performance Considerations

### Lazy Loading

Load TipTap only when editor is rendered:

```typescript
const TipTapEditor = lazy(() => import('./TipTapEditor'));
```

### Debounced Save

500ms debounce prevents excessive file writes:

```typescript
const debouncedSave = useMemo(
  () => debounce((content: string) => onSave(content), 500),
  [onSave]
);
```

### Efficient Re-renders

Use `React.memo` for toolbar buttons and editor components to prevent unnecessary re-renders.

## Migration Strategy

### Phase 1: Add WYSIWYG alongside existing editors

- Implement MarkdownEditor component
- Add to spec, model, actor, context editors
- Keep existing plain textarea as fallback

### Phase 2: Feature file integration

- Integrate with existing GherkinEditor
- Use WYSIWYG for non-Gherkin content
- Test combined editor experience

### Phase 3: Polish and refinement

- Add table editing
- Add image upload support
- Improve keyboard shortcuts
- Add undo/redo support

### Phase 4: Replace old editors

- Remove plain textarea editors
- Make WYSIWYG the default
- Update documentation

## Known Limitations

1. **Large Files**: TipTap may struggle with very large markdown files (> 10,000 lines)
2. **Complex Tables**: Advanced table features (merged cells) not supported in markdown
3. **Custom Markdown**: Non-standard markdown syntax may not render correctly
4. **Offline Usage**: No offline support for images (URLs only)
5. **Undo/Redo**: Limited to TipTap's internal history (not persistent across sessions)

## Future Enhancements

1. **Image Upload**: Support uploading images to project directory
2. **Mermaid/Nomnoml Diagrams**: Visual diagram editor
3. **Collaborative Editing**: Real-time collaboration via Y.js
4. **Spell Check**: Integrate spell checking
5. **Markdown Linting**: Show warnings for markdown issues
6. **Custom Extensions**: Create Forge-specific TipTap extensions
7. **Diff View**: Show markdown changes visually

## Dependencies

**Required npm packages:**
```json
{
  "@tiptap/react": "^2.1.0",
  "@tiptap/starter-kit": "^2.1.0",
  "@tiptap/extension-link": "^2.1.0",
  "@tiptap/extension-image": "^2.1.0",
  "@tiptap/extension-table": "^2.1.0",
  "@tiptap/extension-table-row": "^2.1.0",
  "@tiptap/extension-table-cell": "^2.1.0",
  "@tiptap/extension-table-header": "^2.1.0",
  "@tiptap/extension-code-block-lowlight": "^2.1.0",
  "lowlight": "^3.1.0",
  "turndown": "^7.1.2",
  "marked": "^11.0.0"
}
```

## References

- TipTap Documentation: https://tiptap.dev/
- ProseMirror Guide: https://prosemirror.net/docs/guide/
- Turndown (HTML to Markdown): https://github.com/mixmark-io/turndown
- Marked (Markdown to HTML): https://marked.js.org/

