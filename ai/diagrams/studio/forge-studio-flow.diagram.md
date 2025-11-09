---
diagram_id: forge-studio-flow
name: Forge Studio High-Level Flow
description: Shows the entry flow from command execution through project readiness check to panel initialization
diagram_type: flow
feature_id: [forge-studio]
spec_id: [forge-studio-implementation]
actor_id: []
---

# Forge Studio High-Level Flow

```nomnoml
#direction: down
#padding: 10

[User: Forge Open Studio] Command -> [extension.ts]
[extension.ts] -> [ProjectPicker.pickProject]
[ProjectPicker.pickProject] -> [<choice>Check Project Readiness]
[<choice>Check Project Readiness] Not Ready -> [WelcomePanel]
[<choice>Check Project Readiness] Ready -> [ForgeStudioPanel]
[WelcomePanel] Initialize -> [Create Folders]
[Create Folders] Success -> [ForgeStudioPanel]
[WelcomePanel] Manual Open -> [ForgeStudioPanel]
[ForgeStudioPanel] -> [Dashboard/Sessions/Files]
```

## Notes

This diagram shows how the Forge Studio command execution flows through project readiness checking, potentially showing a welcome screen for uninitialized projects, and eventually opening the main Studio panel.

