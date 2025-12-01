---
diagram_id: welcome-component-structure
name: Welcome Panel Component Structure
description: Shows how the welcome screen integrates with project picker and studio initialization
diagram_type: component
feature_id: [welcome-screen]
actor_id: []
---

# Welcome Panel Component Structure

```nomnoml
#direction: down
#padding: 10

[extension.ts] forge.openStudio command -> [ProjectPicker]
[ProjectPicker] returns projectUri -> [<choice>Check Readiness]
[<choice>Check Readiness] Not Ready -> [WelcomePanel]
[<choice>Check Readiness] Ready -> [ForgeStudioPanel]
[WelcomePanel] initialize -> [Create Folders]
[Create Folders] success -> [ForgeStudioPanel]
[WelcomePanel] manual open -> [ForgeStudioPanel]

[WelcomePanel] -> [Welcome Webview UI]
[Welcome Webview UI] postMessage <-> [WelcomePanel]

[WelcomePanel] -> [File System]
[File System] check folders -> [<choice>Check Readiness]
[File System] create folders -> [Create Folders]
```
