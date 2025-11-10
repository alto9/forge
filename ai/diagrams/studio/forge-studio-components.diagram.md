---
diagram_id: forge-studio-components
name: Forge Studio Component Architecture
description: Shows the relationship between VSCode extension host components and webview UI components
diagram_type: component
feature_id: [forge-studio]
spec_id: [forge-studio-implementation]
actor_id: []
---

# Forge Studio Component Architecture

```nomnoml
#direction: down
#padding: 10

[VSCode Extension Host] WebviewPanel -> [ForgeStudioPanel.ts]
[VSCode Extension Host] WebviewPanel -> [WelcomePanel.ts]

[ForgeStudioPanel.ts] HTML + React -> [Webview UI - index.tsx]
[WelcomePanel.ts] HTML + React -> [Welcome UI - welcome/index.tsx]

[Webview UI - index.tsx] postMessage <-> [ForgeStudioPanel.ts]
[Welcome UI - welcome/index.tsx] postMessage <-> [WelcomePanel.ts]

[ForgeStudioPanel.ts] File System -> [ai/ directory]
[WelcomePanel.ts] File System -> [ai/ directory]

[ForgeStudioPanel.ts] -> [FileParser|File I/O]
[ForgeStudioPanel.ts] -> [PromptGenerator|Prompt Generation]

[Webview UI - index.tsx] Components -> [Dashboard, Sessions, BrowserPage, SessionPanel]
[Welcome UI - welcome/index.tsx] Components -> [StatusIndicator, FolderChecklist, ActionButtons]
```
