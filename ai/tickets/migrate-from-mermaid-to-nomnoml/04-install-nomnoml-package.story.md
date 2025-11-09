---
story_id: install-nomnoml-package
session_id: migrate-from-mermaid-to-nomnoml
feature_id: [spec-detail-view]
spec_id: [forge-studio-implementation]
status: pending
priority: high
estimated_minutes: 5
---

## Objective

Add nomnoml as a dependency to the vscode-extension package to enable diagram rendering in the Studio webview.

## Context

To render nomnoml diagrams in the Forge Studio, we need to install the nomnoml library as a dependency. This will be used in the webview to convert nomnoml syntax to SVG diagrams.

## Implementation Steps

1. Navigate to `packages/vscode-extension/`
2. Run `npm install nomnoml --save`
3. Verify the dependency is added to package.json under "dependencies"
4. Run `npm install` from root to update lockfile
5. Rebuild the extension to verify no issues

## Files Affected

- `packages/vscode-extension/package.json` - Add nomnoml dependency
- `package-lock.json` - Update lockfile

## Acceptance Criteria

- [ ] nomnoml is listed in vscode-extension package.json dependencies
- [ ] Package installs without errors
- [ ] Extension builds successfully with new dependency
- [ ] nomnoml can be imported in webview code

## Dependencies

None

