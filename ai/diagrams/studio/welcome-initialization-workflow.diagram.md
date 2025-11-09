---
diagram_id: welcome-initialization-workflow
name: Welcome Panel Initialization Workflow
description: Shows the sequence of steps during Forge project initialization
diagram_type: sequence
feature_id: [welcome-screen]
spec_id: [welcome-initialization]
actor_id: []
---

# Welcome Panel Initialization Workflow

```nomnoml
#direction: down
#padding: 10
#.sequence: fill=#fff visual=sender

[User] -> [Webview|Click "Initialize Forge Project"]
[Webview] -> [Webview|Show confirmation dialog]
[Webview] -> [Webview|Display folders to be created]
[User] -> [Webview|Click "Confirm"]
[Webview] -> [WelcomePanel|initializeProject message]
[WelcomePanel] -> [WelcomePanel|Get list of missing folders]

[WelcomePanel] -> [<frame>For each missing folder]
[<frame>For each missing folder] -> [FileSystem|createDirectory(folderUri)]
[FileSystem] -> [WelcomePanel|success/error]
[WelcomePanel] -> [Webview|progress update]

[WelcomePanel] -> [WelcomePanel|Verify all folders created]
[WelcomePanel] -> [Webview|initialization complete]
[WelcomePanel] -> [ForgeStudio|Open Studio]
[ForgeStudio] -> [User|Dashboard loads]
```

## Notes

This sequence diagram illustrates the step-by-step process when a user initializes a Forge project through the welcome screen, including confirmation, folder creation, and transition to the studio.

