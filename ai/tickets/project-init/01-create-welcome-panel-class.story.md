---
story_id: create-welcome-panel-class
session_id: project-init
feature_id: [welcome-screen]
spec_id: [welcome-initialization, forge-studio-implementation]
model_id: []
context_id: [theme, vsce]
status: pending
priority: high
estimated_minutes: 25
---

# Create WelcomePanel Extension Class

## Objective

Create the `WelcomePanel.ts` class that manages the welcome screen webview panel, including basic panel setup, lifecycle management, and message passing infrastructure.

## Context

The Welcome Screen is a new entry point for projects that are not yet "Forge-ready". This story creates the core extension host class that will manage the webview panel, similar to `ForgeStudioPanel.ts` but specifically for welcome/initialization flow.

## Implementation Steps

1. Create `packages/vscode-extension/src/panels/WelcomePanel.ts`
2. Implement static `render()` factory method that creates/reveals panel
3. Add private constructor that initializes webview panel
4. Set up webview options (enable scripts, local resource roots)
5. Generate HTML content method `_getWebviewContent()` with CSP
6. Add basic message passing infrastructure (`_setWebviewMessageListener`)
7. Implement panel disposal and cleanup
8. Add sidebar collapse on panel creation

## Files Affected

- `packages/vscode-extension/src/panels/WelcomePanel.ts` - Create new file

## Acceptance Criteria

- [ ] WelcomePanel class created with singleton pattern
- [ ] Static render() method creates or reveals panel
- [ ] Webview HTML generated with proper CSP and nonce
- [ ] Message listener infrastructure in place
- [ ] Panel disposes cleanly on close
- [ ] Left sidebar collapses when panel opens
- [ ] Class structure matches ForgeStudioPanel pattern

## Dependencies

None

