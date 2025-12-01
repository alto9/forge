---
diagram_id: forge-studio-components
name: Forge Studio Component Architecture
description: Shows the relationship between VSCode extension host components and webview UI components
diagram_type: component
feature_id: [forge-studio]
actor_id: []
---

# Forge Studio Component Architecture

```json
{
  "nodes": [
    {
      "id": "ext-host",
      "type": "general-container",
      "position": { "x": 50, "y": 50 },
      "data": {
        "label": "VSCode Extension Host",
        "classifier": "container",
        "isContainer": true,
        "spec_id": "forge-studio-implementation"
      },
      "style": { "width": 350, "height": 300 }
    },
    {
      "id": "webview-area",
      "type": "general-container",
      "position": { "x": 450, "y": 50 },
      "data": {
        "label": "Webview UI (Sandboxed)",
        "classifier": "container",
        "isContainer": true
      },
      "style": { "width": 350, "height": 300 }
    },
    {
      "id": "forge-panel",
      "type": "general-box",
      "position": { "x": 20, "y": 60 },
      "data": {
        "label": "ForgeStudioPanel.ts",
        "classifier": "box",
        "spec_id": "forge-studio-implementation"
      },
      "parentNode": "ext-host",
      "extent": "parent"
    },
    {
      "id": "welcome-panel",
      "type": "general-box",
      "position": { "x": 20, "y": 140 },
      "data": {
        "label": "WelcomePanel.ts",
        "classifier": "box",
        "spec_id": "welcome-initialization"
      },
      "parentNode": "ext-host",
      "extent": "parent"
    },
    {
      "id": "file-parser",
      "type": "general-box",
      "position": { "x": 20, "y": 220 },
      "data": {
        "label": "FileParser Utils",
        "classifier": "box"
      },
      "parentNode": "ext-host",
      "extent": "parent"
    },
    {
      "id": "studio-ui",
      "type": "general-box",
      "position": { "x": 20, "y": 60 },
      "data": {
        "label": "Studio UI (index.tsx)",
        "classifier": "box",
        "spec_id": "forge-studio-implementation"
      },
      "parentNode": "webview-area",
      "extent": "parent"
    },
    {
      "id": "welcome-ui",
      "type": "general-box",
      "position": { "x": 20, "y": 140 },
      "data": {
        "label": "Welcome UI",
        "classifier": "box",
        "spec_id": "welcome-initialization"
      },
      "parentNode": "webview-area",
      "extent": "parent"
    },
    {
      "id": "diagram-editor",
      "type": "general-box",
      "position": { "x": 20, "y": 220 },
      "data": {
        "label": "Diagram Editor",
        "classifier": "box",
        "spec_id": "react-flow-diagram-implementation"
      },
      "parentNode": "webview-area",
      "extent": "parent"
    },
    {
      "id": "filesystem",
      "type": "general-box",
      "position": { "x": 50, "y": 400 },
      "data": {
        "label": "ai/ Directory (File System)",
        "classifier": "box"
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "forge-panel",
      "target": "studio-ui",
      "label": "postMessage",
      "animated": true
    },
    {
      "id": "e2",
      "source": "welcome-panel",
      "target": "welcome-ui",
      "label": "postMessage",
      "animated": true
    },
    {
      "id": "e3",
      "source": "forge-panel",
      "target": "filesystem",
      "label": "File I/O"
    },
    {
      "id": "e4",
      "source": "welcome-panel",
      "target": "filesystem",
      "label": "File I/O"
    }
  ]
}
```
