---
diagram_id: wysiwyg-state-management
name: WYSIWYG Editor State Management
description: Shows the state flow and auto-save mechanism for the WYSIWYG editor
diagram_type: state
feature_id: [wysiwyg-markdown-editor]
actor_id: []
---

# WYSIWYG Editor State Management

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
