---
diagram_id: monorepo-structure
name: Forge Monorepo Package Structure
description: Shows the organization of packages in the Forge monorepo
diagram_type: component
feature_id: [forge-monorepo]
actor_id: []
---

# Forge Monorepo Package Structure

```json
{
  "nodes": [
    {
      "id": "root",
      "type": "general-container",
      "position": { "x": 50, "y": 50 },
      "data": {
        "label": "Forge Monorepo",
        "classifier": "container",
        "isContainer": true,
        "spec_id": "monorepo"
      },
      "style": { "width": 700, "height": 400 }
    },
    {
      "id": "vscode-ext",
      "type": "general-box",
      "position": { "x": 50, "y": 100 },
      "data": {
        "label": "@forge/vscode-extension",
        "classifier": "box",
        "spec_id": "forge-studio-implementation"
      },
      "parentNode": "root",
      "extent": "parent"
    },
    {
      "id": "mcp-server",
      "type": "general-box",
      "position": { "x": 400, "y": 100 },
      "data": {
        "label": "@forge/mcp-server",
        "classifier": "box"
      },
      "parentNode": "root",
      "extent": "parent"
    },
    {
      "id": "ext-src",
      "type": "general-box",
      "position": { "x": 10, "y": 50 },
      "data": {
        "label": "Extension Host",
        "classifier": "box"
      },
      "parentNode": "vscode-ext"
    },
    {
      "id": "ext-webview",
      "type": "general-box",
      "position": { "x": 10, "y": 120 },
      "data": {
        "label": "Webview UI (React)",
        "classifier": "box"
      },
      "parentNode": "vscode-ext"
    },
    {
      "id": "ext-build",
      "type": "general-box",
      "position": { "x": 10, "y": 190 },
      "data": {
        "label": "Build (Webpack)",
        "classifier": "box",
        "spec_id": "webpack"
      },
      "parentNode": "vscode-ext"
    },
    {
      "id": "mcp-tools",
      "type": "general-box",
      "position": { "x": 10, "y": 50 },
      "data": {
        "label": "MCP Tools",
        "classifier": "box"
      },
      "parentNode": "mcp-server"
    },
    {
      "id": "mcp-impl",
      "type": "general-box",
      "position": { "x": 10, "y": 120 },
      "data": {
        "label": "Server Implementation",
        "classifier": "box"
      },
      "parentNode": "mcp-server"
    },
    {
      "id": "mcp-dist",
      "type": "general-box",
      "position": { "x": 10, "y": 190 },
      "data": {
        "label": "Dist (TypeScript)",
        "classifier": "box"
      },
      "parentNode": "mcp-server"
    }
  ],
  "edges": []
}
```
