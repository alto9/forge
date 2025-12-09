---
diagram_id: monorepo-migration
name: Monorepo to Single Package Migration
description: Visual representation of the repository structure transformation from monorepo to single VSCode extension package
type: infrastructure
spec_id:
  - monorepo-to-single-package
feature_id:
  - cursor-commands-migration
---

# Monorepo to Single Package Migration

This diagram illustrates the structural transformation of the Forge repository from a monorepo with multiple packages to a single VSCode extension package.

```json
{
  "nodes": [
    {
      "id": "before-root",
      "type": "group",
      "position": { "x": 50, "y": 50 },
      "data": { 
        "label": "BEFORE: Monorepo Structure"
      },
      "style": {
        "width": 400,
        "height": 500,
        "backgroundColor": "rgba(255, 200, 200, 0.1)",
        "border": "2px solid #ff6b6b"
      }
    },
    {
      "id": "before-packages",
      "type": "default",
      "position": { "x": 100, "y": 120 },
      "data": { 
        "label": "📁 packages/",
        "description": "Workspace root with multiple packages"
      },
      "parentNode": "before-root"
    },
    {
      "id": "before-vscode",
      "type": "default",
      "position": { "x": 120, "y": 200 },
      "data": { 
        "label": "📦 vscode-extension/",
        "description": "VSCode extension package"
      },
      "parentNode": "before-root"
    },
    {
      "id": "before-mcp",
      "type": "default",
      "position": { "x": 120, "y": 280 },
      "data": { 
        "label": "📦 mcp-server/",
        "description": "MCP server package"
      },
      "parentNode": "before-root",
      "style": {
        "backgroundColor": "#ffe0e0",
        "border": "2px dashed #ff6b6b"
      }
    },
    {
      "id": "before-root-pkg",
      "type": "default",
      "position": { "x": 100, "y": 360 },
      "data": { 
        "label": "📄 package.json",
        "description": "Workspace configuration"
      },
      "parentNode": "before-root"
    },
    {
      "id": "before-ci-ext",
      "type": "default",
      "position": { "x": 100, "y": 420 },
      "data": { 
        "label": "⚙️ release-extension.yml"
      },
      "parentNode": "before-root"
    },
    {
      "id": "before-ci-mcp",
      "type": "default",
      "position": { "x": 100, "y": 470 },
      "data": { 
        "label": "⚙️ release-mcp.yml"
      },
      "parentNode": "before-root",
      "style": {
        "backgroundColor": "#ffe0e0",
        "border": "2px dashed #ff6b6b"
      }
    },
    {
      "id": "after-root",
      "type": "group",
      "position": { "x": 550, "y": 50 },
      "data": { 
        "label": "AFTER: Single Package Structure"
      },
      "style": {
        "width": 400,
        "height": 500,
        "backgroundColor": "rgba(200, 255, 200, 0.1)",
        "border": "2px solid #51cf66"
      }
    },
    {
      "id": "after-src",
      "type": "default",
      "position": { "x": 600, "y": 120 },
      "data": { 
        "label": "📁 src/",
        "description": "Source code at root level"
      },
      "parentNode": "after-root",
      "style": {
        "backgroundColor": "#e0ffe0",
        "border": "2px solid #51cf66"
      }
    },
    {
      "id": "after-dist",
      "type": "default",
      "position": { "x": 600, "y": 180 },
      "data": { 
        "label": "📁 dist/",
        "description": "Build output"
      },
      "parentNode": "after-root"
    },
    {
      "id": "after-cursor",
      "type": "default",
      "position": { "x": 600, "y": 240 },
      "data": { 
        "label": "📁 .cursor/commands/",
        "description": "Native Cursor commands"
      },
      "parentNode": "after-root",
      "style": {
        "backgroundColor": "#e0ffe0",
        "border": "2px solid #51cf66"
      }
    },
    {
      "id": "after-pkg",
      "type": "default",
      "position": { "x": 600, "y": 300 },
      "data": { 
        "label": "📄 package.json",
        "description": "Single package configuration"
      },
      "parentNode": "after-root",
      "style": {
        "backgroundColor": "#e0ffe0",
        "border": "2px solid #51cf66"
      }
    },
    {
      "id": "after-webpack",
      "type": "default",
      "position": { "x": 600, "y": 360 },
      "data": { 
        "label": "📄 webpack.config.js",
        "description": "Build configuration"
      },
      "parentNode": "after-root"
    },
    {
      "id": "after-ci",
      "type": "default",
      "position": { "x": 600, "y": 420 },
      "data": { 
        "label": "⚙️ release.yml",
        "description": "Single release workflow"
      },
      "parentNode": "after-root",
      "style": {
        "backgroundColor": "#e0ffe0",
        "border": "2px solid #51cf66"
      }
    },
    {
      "id": "migration-arrow",
      "type": "default",
      "position": { "x": 460, "y": 280 },
      "data": { 
        "label": "🔄 MIGRATION",
        "description": "v2.0.0 Breaking Change"
      },
      "style": {
        "backgroundColor": "#fff3bf",
        "border": "2px solid #ffd43b",
        "fontSize": "16px",
        "fontWeight": "bold"
      }
    },
    {
      "id": "legend",
      "type": "group",
      "position": { "x": 50, "y": 580 },
      "data": { 
        "label": "Legend"
      },
      "style": {
        "width": 900,
        "height": 120,
        "backgroundColor": "rgba(200, 200, 255, 0.1)",
        "border": "2px solid #748ffc"
      }
    },
    {
      "id": "legend-removed",
      "type": "default",
      "position": { "x": 100, "y": 620 },
      "data": { 
        "label": "🗑️ Removed",
        "description": "Deleted in migration"
      },
      "parentNode": "legend",
      "style": {
        "backgroundColor": "#ffe0e0",
        "border": "2px dashed #ff6b6b"
      }
    },
    {
      "id": "legend-new",
      "type": "default",
      "position": { "x": 300, "y": 620 },
      "data": { 
        "label": "✨ New/Updated",
        "description": "Created or modified"
      },
      "parentNode": "legend",
      "style": {
        "backgroundColor": "#e0ffe0",
        "border": "2px solid #51cf66"
      }
    },
    {
      "id": "legend-breaking",
      "type": "default",
      "position": { "x": 500, "y": 620 },
      "data": { 
        "label": "⚠️ Breaking Change",
        "description": "Major version (v2.0.0)"
      },
      "parentNode": "legend",
      "style": {
        "backgroundColor": "#fff3bf",
        "border": "2px solid #ffd43b"
      }
    },
    {
      "id": "legend-cursor",
      "type": "default",
      "position": { "x": 720, "y": 620 },
      "data": { 
        "label": "📝 Cursor Commands",
        "description": "Replace MCP tools"
      },
      "parentNode": "legend",
      "style": {
        "backgroundColor": "#e0f2ff",
        "border": "2px solid #339af0"
      }
    }
  ],
  "edges": [
    {
      "id": "e-before-to-after",
      "source": "before-root",
      "target": "migration-arrow",
      "type": "straight",
      "animated": false,
      "style": { "stroke": "#ffd43b", "strokeWidth": 3 }
    },
    {
      "id": "e-migration-to-after",
      "source": "migration-arrow",
      "target": "after-root",
      "type": "straight",
      "animated": false,
      "style": { "stroke": "#ffd43b", "strokeWidth": 3 }
    },
    {
      "id": "e-vscode-to-src",
      "source": "before-vscode",
      "target": "after-src",
      "type": "smoothstep",
      "animated": true,
      "label": "Move to root",
      "style": { "stroke": "#51cf66", "strokeWidth": 2 }
    },
    {
      "id": "e-mcp-deleted",
      "source": "before-mcp",
      "target": "after-cursor",
      "type": "smoothstep",
      "animated": true,
      "label": "Replaced by commands",
      "style": { "stroke": "#339af0", "strokeWidth": 2, "strokeDasharray": "5,5" }
    }
  ]
}
```

## Key Transformation Points

### 1. Package Structure Simplification
- **Before**: Monorepo with `packages/vscode-extension/` and `packages/mcp-server/`
- **After**: Single package with `src/` at root level
- **Impact**: Simpler dependency management, faster builds

### 2. MCP Server Removal
- **Before**: Separate MCP server package requiring user configuration
- **After**: Native Cursor commands in `.cursor/commands/` directory
- **Impact**: No external configuration needed, immediate functionality

### 3. Build & Release Simplification
- **Before**: Two separate CI/CD workflows for extension and MCP server
- **After**: Single release workflow for VSCode extension only
- **Impact**: Simpler release process, fewer points of failure

### 4. Configuration Consolidation
- **Before**: Multiple `package.json` files with workspace dependencies
- **After**: Single `package.json` with direct dependencies
- **Impact**: Clearer dependency tree, easier version management

## Migration Benefits

1. **Reduced Complexity**: Single package easier to understand and maintain
2. **Faster Development**: No workspace coordination or inter-package dependencies
3. **Better User Experience**: Commands work immediately without MCP configuration
4. **Simplified Testing**: Single package to test and validate
5. **Cleaner Repository**: Fewer files, clearer structure

## Breaking Change Notice

This migration is released as **v2.0.0** due to the breaking changes:
- MCP server tools removed
- Users must remove MCP configuration
- Repository structure completely changed
- Migration guide provided for existing users

