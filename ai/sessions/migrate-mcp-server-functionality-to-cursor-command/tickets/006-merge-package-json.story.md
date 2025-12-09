---
story_id: 006-merge-package-json
session_id: migrate-mcp-server-functionality-to-cursor-command
feature_id:
  - cursor-commands-migration
spec_id:
  - monorepo-to-single-package
status: completed
---

# Merge package.json to Single Package

## Objective

Create a unified root `package.json` that represents the VSCode extension as a single package, removing all workspace configuration.

## Context

The current root `package.json` has workspace configuration. We need to merge it with the extension's `package.json` to create a single-package configuration at v2.0.0.

## Files to Modify

- `package.json` (root)
- Delete: `package-extension.json` (after merge)

## Implementation Steps

1. Read current root `package.json` and `package-extension.json`
2. Create new `package.json` with:
   ```json
   {
     "name": "forge",
     "displayName": "Forge",
     "version": "2.0.0",
     "description": "Context engineering for AI-assisted development",
     "publisher": "alto9",
     "engines": {
       "vscode": "^1.80.0",
       "node": ">=22.14.0"
     },
     "categories": ["Other"],
     "activationEvents": ["onStartupFinished"],
     "main": "./dist/extension.js",
     "contributes": { /* from extension package.json */ },
     "scripts": {
       "vscode:prepublish": "npm run build",
       "build": "webpack --mode production",
       "watch": "webpack --mode development --watch",
       "package": "vsce package",
       "publish": "vsce publish"
     },
     "devDependencies": { /* merged from both */ },
     "dependencies": { /* from extension only */ }
   }
   ```
3. Remove `workspaces` field (no longer needed)
4. Remove any MCP-related dependencies
5. Delete `package-extension.json`

## Acceptance Criteria

- [ ] Single `package.json` at root with v2.0.0
- [ ] No `workspaces` field present
- [ ] All VSCode extension metadata preserved
- [ ] Scripts use correct paths (no workspace references)
- [ ] Dependencies consolidated (no duplicates)
- [ ] `package-extension.json` deleted
- [ ] MCP dependencies removed

## Estimated Time

20 minutes

## Dependencies

- Requires: 005-move-extension-to-root

## Notes

This is a critical step. Verify the merged package.json carefully before proceeding. The version must be 2.0.0 to indicate breaking changes.

