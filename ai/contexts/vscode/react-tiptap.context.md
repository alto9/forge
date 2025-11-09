---
context_id: react-tiptap
name: React and TipTap WYSIWYG Editor
category: vscode
description: Guidance for building WYSIWYG markdown editors using React and TipTap in VSCode webviews
---

# React and TipTap Context

## When to Use This Context

```gherkin
Scenario: Building WYSIWYG markdown editors in VSCode webviews
  Given a VSCode extension with webview support
  And a need for rich text editing with markdown output
  When implementing a markdown editor component
  Then use TipTap with React for WYSIWYG functionality
  And provide source/view mode toggle
  And support markdown import/export
```

## TipTap Overview

TipTap is a headless, framework-agnostic rich text editor built on ProseMirror. It provides:
- Extensible architecture with extensions
- Markdown import/export capabilities
- React integration via `@tiptap/react`
- Customizable toolbar and UI
- Real-time collaboration support (optional)

## Core Dependencies

```json
{
  "@tiptap/core": "^2.x.x",
  "@tiptap/react": "^2.x.x",
  "@tiptap/starter-kit": "^2.x.x",
  "@tiptap/extension-link": "^2.x.x",
  "@tiptap/extension-image": "^2.x.x",
  "@tiptap/extension-table": "^2.x.x",
  "@tiptap/extension-code-block-lowlight": "^2.x.x",
  "react": "^18.x.x",
  "react-dom": "^18.x.x"
}
```

## Basic Implementation Pattern

### Editor Component Structure

```typescript
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';

interface MarkdownEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  readOnly?: boolean;
}

function MarkdownEditor({ content, onChange, readOnly }: MarkdownEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: markdownToHtml(content), // Convert markdown to HTML
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      onChange(markdown);
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== htmlToMarkdown(editor.getHTML())) {
      editor.commands.setContent(markdownToHtml(content));
    }
  }, [content, editor]);

  return (
    <div className="markdown-editor">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
```

### Markdown Conversion

For markdown ↔ HTML conversion, use a library like `turndown` or implement custom logic:

```typescript
import TurndownService from 'turndown';
import { marked } from 'marked';

function htmlToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });
  return turndownService.turndown(html);
}

function markdownToHtml(markdown: string): string {
  return marked.parse(markdown);
}
```

### Toolbar Component

```typescript
function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="toolbar">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'active' : ''}
      >
        Bold
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'active' : ''}
      >
        Italic
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
      >
        H2
      </button>
      {/* Add more toolbar buttons */}
    </div>
  );
}
```

## VSCode Webview Integration

### Building for Webview

Use esbuild or webpack to bundle React components for webview:

```javascript
// esbuild.config.js
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/webview/editor/index.tsx'],
  bundle: true,
  outfile: 'media/editor/main.js',
  format: 'iife',
  platform: 'browser',
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
  },
});
```

### Webview HTML Template

```typescript
function getWebviewContent(scriptUri: vscode.Uri): string {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; }
        .ProseMirror { min-height: 200px; padding: 1rem; }
      </style>
    </head>
    <body>
      <div id="root"></div>
      <script src="${scriptUri}"></script>
    </body>
  </html>`;
}
```

## Best Practices

### 1. State Management
- Use controlled component pattern with `content` prop
- Debounce `onChange` calls to avoid excessive updates (500ms)
- Store content in parent component or extension state

### 2. Extensions
- Start with `StarterKit` for basic functionality
- Add extensions as needed (Link, Image, Table, CodeBlock)
- Configure extensions appropriately for your use case

### 3. Styling
- TipTap is headless - style the editor yourself
- Match VSCode theme colors using CSS variables
- Provide clear visual feedback for active formatting

### 4. Performance
- Memoize editor configuration
- Avoid recreating editor instance unnecessarily
- Use `useMemo` and `useCallback` for expensive operations

### 5. Accessibility
- Ensure keyboard navigation works
- Provide ARIA labels for toolbar buttons
- Support screen readers

## Common Patterns

### Read-Only Mode
```typescript
const editor = useEditor({
  editable: !readOnly,
  // ... other config
});
```

### Auto-Save
```typescript
const debouncedSave = useMemo(
  () => debounce((markdown: string) => {
    vscode.postMessage({ type: 'save', content: markdown });
  }, 500),
  []
);

const editor = useEditor({
  onUpdate: ({ editor }) => {
    const markdown = htmlToMarkdown(editor.getHTML());
    debouncedSave(markdown);
  },
});
```

### Source/View Toggle
```typescript
const [mode, setMode] = useState<'wysiwyg' | 'source'>('wysiwyg');

return mode === 'wysiwyg' ? (
  <MarkdownEditor content={content} onChange={setContent} />
) : (
  <textarea value={content} onChange={(e) => setContent(e.target.value)} />
);
```

## Troubleshooting

### Content Not Updating
- Ensure `useEffect` watches correct dependencies
- Check markdown conversion is bidirectional
- Verify `onUpdate` callback fires

### Styling Issues
- Import TipTap CSS if needed
- Check CSS specificity for custom styles
- Verify webview CSP allows inline styles

### Performance Issues
- Profile with React DevTools
- Debounce onChange callbacks
- Memoize expensive computations
- Consider virtualizing for very large documents

## References
- [TipTap Documentation](https://tiptap.dev/)
- [TipTap React Guide](https://tiptap.dev/installation/react)
- [VSCode Webview Guide](https://code.visualstudio.com/api/extension-guides/webview)

