---
diagram_id: wysiwyg-component-structure
name: WYSIWYG Editor Component Structure
description: Shows the component hierarchy and integration of TipTap editor with markdown conversion
diagram_type: component
feature_id: [wysiwyg-markdown-editor]
spec_id: [wysiwyg-editor-implementation]
actor_id: []
---

# WYSIWYG Editor Component Structure

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

## Notes

This diagram shows how the WYSIWYG markdown editor component integrates with TipTap extensions and provides both visual and source editing modes with markdown conversion.

