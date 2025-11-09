import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { markdownToHtml, htmlToMarkdown } from '../utils/markdown';

interface MarkdownEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  readOnly: boolean;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  readOnly,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const debouncedOnChange = (markdown: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    const timer = setTimeout(() => {
      onChange(markdown);
    }, 500);
    setDebounceTimer(timer);
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
    ],
    content: markdownToHtml(content),
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (!isUpdating && !readOnly) {
        const html = editor.getHTML();
        const markdown = htmlToMarkdown(html);
        debouncedOnChange(markdown);
      }
    },
  });

  // Update editor content when prop changes (but avoid infinite loops)
  useEffect(() => {
    if (editor && !isUpdating) {
      const currentHtml = editor.getHTML();
      const newHtml = markdownToHtml(content);
      
      // Only update if content actually changed
      if (currentHtml !== newHtml) {
        setIsUpdating(true);
        editor.commands.setContent(newHtml);
        setIsUpdating(false);
      }
    }
  }, [content, editor, isUpdating]);

  // Update editable state when readOnly changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  const Toolbar = () => {
    if (readOnly) return null;

    const buttonStyle = (isActive: boolean) => ({
      padding: '6px 12px',
      background: isActive ? 'var(--vscode-button-background)' : 'transparent',
      color: isActive ? 'var(--vscode-button-foreground)' : 'var(--vscode-foreground)',
      border: '1px solid var(--vscode-panel-border)',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: isActive ? 600 : 400,
    });

    return (
      <div style={{
        display: 'flex',
        gap: 4,
        padding: 8,
        borderBottom: '1px solid var(--vscode-panel-border)',
        background: 'var(--vscode-sideBar-background)',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={buttonStyle(editor.isActive('bold'))}
          title="Bold (Cmd+B)"
          type="button"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={buttonStyle(editor.isActive('italic'))}
          title="Italic (Cmd+I)"
          type="button"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          style={buttonStyle(editor.isActive('strike'))}
          title="Strikethrough"
          type="button"
        >
          <s>S</s>
        </button>
        
        <div style={{ width: 1, background: 'var(--vscode-panel-border)', margin: '0 4px' }} />
        
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          style={buttonStyle(editor.isActive('heading', { level: 1 }))}
          title="Heading 1"
          type="button"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          style={buttonStyle(editor.isActive('heading', { level: 2 }))}
          title="Heading 2"
          type="button"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          style={buttonStyle(editor.isActive('heading', { level: 3 }))}
          title="Heading 3"
          type="button"
        >
          H3
        </button>
        
        <div style={{ width: 1, background: 'var(--vscode-panel-border)', margin: '0 4px' }} />
        
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={buttonStyle(editor.isActive('bulletList'))}
          title="Bullet List"
          type="button"
        >
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          style={buttonStyle(editor.isActive('orderedList'))}
          title="Numbered List"
          type="button"
        >
          1.
        </button>
        
        <div style={{ width: 1, background: 'var(--vscode-panel-border)', margin: '0 4px' }} />
        
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          style={buttonStyle(editor.isActive('code'))}
          title="Inline Code"
          type="button"
        >
          {'<>'}
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          style={buttonStyle(editor.isActive('codeBlock'))}
          title="Code Block"
          type="button"
        >
          {'{ }'}
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          style={buttonStyle(editor.isActive('blockquote'))}
          title="Blockquote"
          type="button"
        >
          "
        </button>
        
        <div style={{ width: 1, background: 'var(--vscode-panel-border)', margin: '0 4px' }} />
        
        <button
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          style={buttonStyle(editor.isActive('link'))}
          title="Insert Link (Cmd+K)"
          type="button"
        >
          🔗
        </button>
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--vscode-editor-background)',
      color: 'var(--vscode-editor-foreground)',
    }}>
      <Toolbar />
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: 16,
      }}>
        <style>{`
          .ProseMirror {
            outline: none;
            min-height: 100%;
          }
          .ProseMirror h1 {
            font-size: 2em;
            font-weight: bold;
            margin: 0.67em 0;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 0.3em;
          }
          .ProseMirror h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin: 0.75em 0;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 0.3em;
          }
          .ProseMirror h3 {
            font-size: 1.25em;
            font-weight: bold;
            margin: 0.83em 0;
          }
          .ProseMirror code {
            background: var(--vscode-textCodeBlock-background);
            color: var(--vscode-textCodeBlock-foreground);
            padding: 2px 4px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family, 'Menlo, Monaco, Courier New, monospace');
            font-size: 0.9em;
          }
          .ProseMirror pre {
            background: var(--vscode-textCodeBlock-background);
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 1em 0;
          }
          .ProseMirror pre code {
            background: none;
            padding: 0;
          }
          .ProseMirror blockquote {
            border-left: 4px solid var(--vscode-panel-border);
            padding-left: 16px;
            margin-left: 0;
            font-style: italic;
            color: var(--vscode-descriptionForeground);
          }
          .ProseMirror a {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
          }
          .ProseMirror a:hover {
            text-decoration: underline;
          }
          .ProseMirror ul, .ProseMirror ol {
            padding-left: 2em;
          }
          .ProseMirror li {
            margin: 0.25em 0;
          }
          .ProseMirror p {
            margin: 0.5em 0;
          }
          .ProseMirror img {
            max-width: 100%;
            height: auto;
          }
        `}</style>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

