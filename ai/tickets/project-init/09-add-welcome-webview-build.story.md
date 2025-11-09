---
story_id: add-welcome-webview-build
session_id: project-init
feature_id: [welcome-screen]
spec_id: [welcome-initialization]
model_id: []
context_id: [local-development, build-procedures]
status: completed
priority: high
estimated_minutes: 20
---

# Add Welcome Webview Build Configuration

## Objective

Add esbuild configuration to bundle the welcome screen webview React code into a separate output file for the WelcomePanel to load.

## Context

The welcome screen is a separate webview from Forge Studio and should have its own bundle. This keeps the welcome screen lightweight and allows independent updates.

## Implementation Steps

1. Update `packages/vscode-extension/build-webview.js` script
2. Add second esbuild invocation for welcome webview
3. Set entryPoint: `src/webview/welcome/index.tsx`
4. Set outfile: `media/welcome/main.js`
5. Use same build options as studio (bundle, minify, iife)
6. Update `.vscodeignore` to include `media/welcome/`
7. Update WelcomePanel._getWebviewContent() to load from media/welcome/main.js
8. Test build produces correct output

## Files Affected

- `packages/vscode-extension/build-webview.js` - Add welcome build
- `packages/vscode-extension/.vscodeignore` - Include welcome media
- `packages/vscode-extension/src/panels/WelcomePanel.ts` - Update script src path

## Acceptance Criteria

- [x] build:webview script builds both studio and welcome bundles
- [x] Welcome bundle output to media/welcome/main.js
- [x] Bundle is minified for production
- [x] .vscodeignore includes media/welcome/ directory (by default, not ignored)
- [x] WelcomePanel loads script from correct path
- [x] Build succeeds: npm run build
- [x] Both watch and production builds work
- [x] Bundle size is reasonable (145KB < 200KB)

## Dependencies

- create-welcome-webview-ui

