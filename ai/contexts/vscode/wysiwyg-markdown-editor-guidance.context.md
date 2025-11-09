---
context_id: wysiwyg-markdown-editor-guidance
category: vscode
---

# WYSIWYG Markdown Editor Guidance

## Overview

This context provides guidance for implementing and working with WYSIWYG (What You See Is What You Get) markdown editors in VSCode webview applications, specifically using the TipTap editor framework.

## When to Use This Context

```gherkin
Scenario: Implementing rich text editing
  Given you are building a markdown editor in a VSCode webview
  When users need to edit markdown without knowing syntax
  Then use this context for WYSIWYG editor implementation
  And follow the TipTap integration patterns

Scenario: Converting between markdown and rich text
  Given you need to convert markdown to/from rich text
  When working with TipTap or similar WYSIWYG editors
  Then use this context for conversion strategies
  And handle edge cases like code blocks and tables

Scenario: Preserving structured content in WYSIWYG
  Given you have structured content like Gherkin blocks
  When implementing WYSIWYG editing alongside structured editors
  Then use this context for content separation patterns
  And ensure structured content is not corrupted
```

## Guidance

### Critical Pattern: Match Nomnoml Diagram Behavior

**MUST follow the exact same pattern as Nomnoml diagrams in Forge Studio:**

#### Read-Only Mode (No Active Session)
- Content is **RENDERED** as formatted HTML/rich text (not shown as source)
- **NO** toggle button visible
- **NO** source code visible
- **NO** toolbar visible
- Content is display-only (not editable)
- User sees a message to start a session to edit

**Why**: This matches Nomnoml diagrams which render as SVG (not source code) in read-only mode, providing consistency across all Studio content types.

#### Edit Mode (Active Session)
- Toggle button **IS VISIBLE** with "Visual" and "Source" options
- "Visual" mode: WYSIWYG editor with formatting toolbar
- "Source" mode: Plain textarea with raw markdown
- User can switch between modes freely while editing

**Why**: This matches Nomnoml diagrams which show "Source" and "Render" toggle in edit mode.

**Reference Implementation:**
```typescript
// From packages/vscode-extension/src/webview/studio/index.tsx
const [diagramViewMode, setDiagramViewMode] = useState<'source' | 'rendered'>('source');
const isReadOnly = !activeSession;

// Toggle only visible when NOT read-only
{category === 'specs' && !isReadOnly && (
  <div className="view-toggle">
    <button onClick={() => setDiagramViewMode('source')}>Source</button>
    <button onClick={() => setDiagramViewMode('rendered')}>Render</button>
  </div>
)}

// In read-only mode, always show rendered
{isReadOnly ? (
  <NomnomlRenderer source={content} />
) : (
  // Show toggle and appropriate view
)}
```

Apply this exact pattern to markdown editing.

### TipTap Overview

**TipTap** is the recommended WYSIWYG editor for VSCode webview applications because:
- Built on ProseMirror (battle-tested editing foundation)
- React-friendly with hooks API
- Highly extensible with plugins/extensions
- Built-in markdown support via extensions
- Keyboard shortcut system
- TypeScript support
- Good performance with reasonable file sizes

### Core Architecture Pattern

Use a three-layer architecture:

1. **Editor Layer**: TipTap editor with extensions
2. **Conversion Layer**: Markdown ↔ HTML conversion
3. **Persistence Layer**: File system with auto-save

```typescript
// Editor instantiation
const editor = useEditor({
  extensions: [StarterKit, Link, Image, Table],
  content: initialHTML,
  editable: !readOnly,
  onUpdate: ({ editor }) => {
    const html = editor.getHTML();
    const markdown = htmlToMarkdown(html);
    debouncedSave(markdown);
  },
});
```

### Markdown Conversion

Use **turndown** for HTML → Markdown:
```typescript
import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',        // Use # syntax
  codeBlockStyle: 'fenced',   // Use ``` syntax
  bulletListMarker: '-',      // Use - for bullets
});

const markdown = turndownService.turndown(html);
```

Use **marked** for Markdown → HTML:
```typescript
import { marked } from 'marked';

const html = marked(markdown, {
  gfm: true,    // GitHub Flavored Markdown
  breaks: true, // Line breaks become <br>
});
```

### Extension Selection

**Essential Extensions:**
- `@tiptap/starter-kit` - Basic formatting (bold, italic, lists, headings)
- `@tiptap/extension-link` - Link support
- `@tiptap/extension-image` - Image support

**Optional Extensions:**
- `@tiptap/extension-table` - Table editing
- `@tiptap/extension-code-block-lowlight` - Syntax highlighted code blocks
- `@tiptap/extension-placeholder` - Placeholder text
- `@tiptap/extension-character-count` - Character/word count
- `@tiptap/extension-collaboration` - Real-time collaboration (future)

### Keyboard Shortcuts

TipTap provides standard shortcuts:
- `Cmd/Ctrl + B` - Bold
- `Cmd/Ctrl + I` - Italic
- `Cmd/Ctrl + K` - Link
- `Cmd/Ctrl + Shift + 8` - Bullet list
- `Cmd/Ctrl + Shift + 7` - Numbered list
- `Cmd/Ctrl + Alt + 0` - Paragraph
- `Cmd/Ctrl + Alt + 1-6` - Heading levels

Customize shortcuts via extension configuration:
```typescript
StarterKit.configure({
  heading: {
    levels: [1, 2, 3],
  },
  code: {
    HTMLAttributes: {
      class: 'inline-code',
    },
  },
})
```

### Read-Only Mode Pattern

**CRITICAL**: In read-only mode, content must be RENDERED (not shown as source).

```typescript
const editor = useEditor({
  extensions: [...],
  content: initialHTML,
  editable: !readOnly,  // Control via prop
});

// Component structure follows Nomnoml pattern
return (
  <div className="markdown-editor">
    {/* Toggle ONLY visible when NOT read-only */}
    {!readOnly && (
      <ViewToggle mode={mode} onModeChange={setMode} />
    )}
    
    {readOnly ? (
      // READ-ONLY: Always render content, no toggle, no toolbar
      <div className="rendered-content">
        <EditorContent editor={editor} />
      </div>
    ) : (
      // EDIT MODE: Show toolbar and toggle between visual/source
      <>
        {mode === 'visual' ? (
          <>
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
          </>
        ) : (
          <SourceEditor content={markdown} onChange={setMarkdown} />
        )}
      </>
    )}
  </div>
);
```

In read-only mode:
- **DO render** content as formatted HTML
- **DO NOT show** toggle button
- **DO NOT show** toolbar
- **DO NOT show** source code
- **DO allow** text selection and copy
- **DO show** message to start session to edit

### Auto-Save Pattern

Use debounced saves to prevent excessive file writes:
```typescript
const [content, setContent] = useState(initialContent);

const debouncedSave = useMemo(
  () => debounce((markdown: string) => {
    onSave(markdown);
  }, 500),
  [onSave]
);

useEffect(() => {
  if (content !== initialContent) {
    debouncedSave(content);
  }
}, [content, initialContent, debouncedSave]);
```

### Preserving Structured Content

When combining WYSIWYG with structured editors (like Gherkin):

1. **Parse file into sections**:
   - Frontmatter (YAML)
   - Structured blocks (Gherkin)
   - Markdown content (everything else)

2. **Edit sections separately**:
   - Frontmatter → Form fields
   - Gherkin → Structured editor
   - Markdown → WYSIWYG editor

3. **Serialize back together**:
   ```typescript
   const fullContent = [
     stringifyFrontmatter(frontmatter),
     serializeGherkin(gherkinBlocks),
     markdown,
   ].join('\n\n');
   ```

4. **Use custom turndown rules** to preserve special blocks:
   ```typescript
   turndownService.addRule('gherkin-block', {
     filter: (node) => node.classList?.contains('gherkin-block'),
     replacement: (content) => '\n```gherkin\n' + content + '\n```\n',
   });
   ```

### VSCode Theme Integration

Use VSCode CSS variables for consistent theming:

```css
.ProseMirror {
  background: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
  font-family: var(--vscode-editor-font-family);
}

.ProseMirror code {
  background: var(--vscode-textCodeBlock-background);
  color: var(--vscode-textCodeBlock-foreground);
}

.ProseMirror a {
  color: var(--vscode-textLink-foreground);
}

.ProseMirror h1, .ProseMirror h2 {
  color: var(--vscode-editor-foreground);
  border-bottom: 1px solid var(--vscode-panel-border);
}
```

This ensures the editor automatically adapts to theme changes.

### Toolbar Implementation

Create a toolbar with VSCode-styled buttons:

```typescript
interface ToolbarButtonProps {
  onClick: () => void;
  active: boolean;
  icon: React.ReactNode;
  tooltip: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  active,
  icon,
  tooltip,
}) => (
  <button
    onClick={onClick}
    className={`toolbar-button ${active ? 'active' : ''}`}
    title={tooltip}
    style={{
      background: active
        ? 'var(--vscode-button-background)'
        : 'transparent',
      color: active
        ? 'var(--vscode-button-foreground)'
        : 'var(--vscode-foreground)',
      border: '1px solid var(--vscode-panel-border)',
    }}
  >
    {icon}
  </button>
);
```

### Dialog Patterns

For inserting links, images, tables - use VSCode-style dialogs:

```typescript
const LinkDialog: React.FC<LinkDialogProps> = ({ onConfirm, onCancel }) => {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');

  return (
    <div className="dialog-overlay">
      <div className="dialog" style={{
        background: 'var(--vscode-editorWidget-background)',
        border: '1px solid var(--vscode-editorWidget-border)',
      }}>
        <h3>Insert Link</h3>
        <input
          type="text"
          placeholder="Link text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            background: 'var(--vscode-input-background)',
            color: 'var(--vscode-input-foreground)',
            border: '1px solid var(--vscode-input-border)',
          }}
        />
        <input
          type="url"
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            background: 'var(--vscode-input-background)',
            color: 'var(--vscode-input-foreground)',
            border: '1px solid var(--vscode-input-border)',
          }}
        />
        <div className="dialog-actions">
          <button onClick={() => onConfirm(text, url)}>Insert</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
```

### Source View Toggle

Provide a way to toggle between WYSIWYG and raw markdown:

```typescript
const [mode, setMode] = useState<'wysiwyg' | 'source'>('wysiwyg');

return (
  <div>
    <div className="view-toggle">
      <button
        className={mode === 'wysiwyg' ? 'active' : ''}
        onClick={() => setMode('wysiwyg')}
      >
        Visual
      </button>
      <button
        className={mode === 'source' ? 'active' : ''}
        onClick={() => setMode('source')}
      >
        Source
      </button>
    </div>
    
    {mode === 'wysiwyg' ? (
      <EditorContent editor={editor} />
    ) : (
      <textarea
        value={markdown}
        onChange={(e) => {
          setMarkdown(e.target.value);
          editor?.commands.setContent(markdownToHtml(e.target.value));
        }}
      />
    )}
  </div>
);
```

### Performance Considerations

**Lazy Load TipTap:**
```typescript
const TipTapEditor = lazy(() => import('./TipTapEditor'));

<Suspense fallback={<div>Loading editor...</div>}>
  <TipTapEditor {...props} />
</Suspense>
```

**Memoize Components:**
```typescript
const Toolbar = React.memo(ToolbarComponent);
const ToolbarButton = React.memo(ToolbarButtonComponent);
```

**Debounce Updates:**
```typescript
const debouncedOnUpdate = useMemo(
  () => debounce(onUpdate, 300),
  [onUpdate]
);
```

**Limit Document Size:**
- TipTap performs well up to ~5,000 lines
- Beyond that, consider chunking or lazy loading
- Or fall back to plain textarea for very large files

### Common Gotchas

1. **Nested Lists**: TipTap requires proper nesting. Use Tab/Shift+Tab for indent/outdent.

2. **Code Block Language**: Store language as data attribute, preserve in conversion:
   ```typescript
   turndownService.addRule('code-block', {
     filter: 'pre',
     replacement: (content, node) => {
       const lang = node.getAttribute('data-language') || '';
       return '\n```' + lang + '\n' + content + '\n```\n';
     },
   });
   ```

3. **Image Paths**: Use relative paths for project images, absolute URLs for external:
   ```typescript
   Image.configure({
     inline: true,
     allowBase64: false,
     HTMLAttributes: {
       class: 'editor-image',
     },
   })
   ```

4. **Table Serialization**: Ensure proper markdown table syntax:
   ```markdown
   | Header 1 | Header 2 |
   | -------- | -------- |
   | Cell 1   | Cell 2   |
   ```

5. **Frontmatter Preservation**: Never pass frontmatter through TipTap - handle separately.

### Testing Strategy

**Unit Tests:**
- Test markdown ↔ HTML conversion
- Test toolbar button actions
- Test keyboard shortcuts

**Integration Tests:**
- Load markdown → edit → save → verify output
- Toggle between visual/source modes
- Apply formatting → check markdown syntax

**Manual Tests:**
- Test with real Forge files
- Verify theme integration
- Test read-only mode
- Verify auto-save behavior

## Best Practices

1. **Always Separate Frontmatter**: Parse frontmatter before passing content to TipTap
2. **Use Custom Rules**: Add turndown rules for project-specific markdown patterns
3. **Debounce Saves**: Prevent excessive file writes with 500ms debounce
4. **Theme Consistency**: Use VSCode CSS variables for all styling
5. **Keyboard First**: Ensure all actions have keyboard shortcuts
6. **Read-Only Support**: Always respect session-aware editing constraints
7. **Graceful Degradation**: Fall back to plain textarea if TipTap fails to load

## References

- TipTap Documentation: https://tiptap.dev/
- ProseMirror Guide: https://prosemirror.net/docs/guide/
- Turndown GitHub: https://github.com/mixmark-io/turndown
- Marked Documentation: https://marked.js.org/
- VSCode Webview Theming: https://code.visualstudio.com/api/extension-guides/webview#theming-webview-content

## Examples

See the following Forge files for implementation examples:
- `ai/features/studio/editors/wysiwyg-markdown-editor.feature.md` - Feature definition
- `ai/specs/studio/wysiwyg-editor-implementation.spec.md` - Technical specification
- Implementation in: `packages/vscode-extension/src/webview/studio/components/MarkdownEditor.tsx`

## Notes

TipTap is actively maintained and has a growing ecosystem of extensions. Consider creating custom Forge-specific extensions for:
- Nomnoml diagram blocks
- Mermaid diagram blocks
- Cross-file references (linking to other Forge files)
- AI-assisted content generation

