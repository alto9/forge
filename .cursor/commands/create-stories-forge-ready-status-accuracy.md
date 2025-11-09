# Create Stories and Tasks for Session: forge-ready-status-accuracy

This command will analyze the design session and create Stories (for code changes) and Tasks (for non-code work) based on the session's changed files and goals.

---

STEP 1: Call the get_forge_about MCP tool to understand the Forge workflow and distillation principles.

STEP 2: Retrieve the required schemas:
- get_forge_schema with schema_type "story"
- get_forge_schema with schema_type "task"

STEP 3: Review the design session:

**Session File**: /Users/derrick/Documents/Code/Alto9/oss/forge/ai/sessions/forge-ready-status-accuracy.session.md
**Session ID**: forge-ready-status-accuracy

**Session Content**:
```markdown
---
session_id: forge-ready-status-accuracy
start_time: '2025-11-09T17:54:41.621Z'
status: completed
problem_statement: forge-ready-status-accuracy
changed_files:
  - ai/features/studio/dashboard/overview.feature.md
  - ai/specs/studio/welcome-initialization.spec.md
  - ai/features/studio/welcome/welcome-screen.feature.md
end_time: '2025-11-09T18:04:59.334Z'
---
## Problem Statement

forge-ready-status-accuracy

## Goals

Have an accurate accounting of 'forge-ready' status in a multi-root workspace.

## Approach

Either update the project status intelligently or remove that field from the project selection in a multi-root workspace.

## Key Decisions

### Decision: Centralize Readiness Checking Logic

**Problem Identified**: Three separate implementations of `checkProjectReadiness` exist with inconsistent criteria:
1. `ProjectPicker.checkProjectReadiness()` - checks 7 folders (including LEGACY ai/models), but NOT Cursor commands
2. `extension.ts checkProjectReadiness()` - checks 6 folders correctly (without ai/models), and DOES check Cursor commands  
3. `WelcomePanel._checkProjectReadiness()` - checks folders and Cursor commands

**Impact**: ProjectPicker still checks for the legacy `ai/models` folder, causing it to mark projects as "Not Ready" even when they are actually ready (have all current required folders). When user selects the "Not Ready" project, extension.ts correctly identifies it as ready and opens Studio.

**Decision**: Create a single canonical implementation at `packages/vscode-extension/src/utils/projectReadiness.ts` that:
- Exports `REQUIRED_FOLDERS` constant (6 folders, excluding legacy ai/models)
- Exports `REQUIRED_COMMANDS` constant
- Exports `checkProjectReadiness()` function
- All components (ProjectPicker, extension.ts, WelcomePanel) MUST import and use this shared function

**Rationale**: Single source of truth ensures consistency across all readiness checks and accurate status display.

### Decision: Remove ai/models from Readiness Checks

**Status**: `ai/models` is a LEGACY folder and should NOT be checked. ProjectPicker's check for this folder is outdated and causes false "Not Ready" status.

### Decision: Update Documentation to Reflect Consistency Requirements

**Changes Made**:
1. Added scenario in `welcome-screen.feature.md` for consistent readiness checking
2. Added scenario to prevent status display inconsistency
3. Updated `welcome-initialization.spec.md` to document centralized approach
4. Updated `dashboard/overview.feature.md` to require accurate status display

## Notes

When I click on a project that says it is not forge-ready, it is corrected but the status doesn't get updated. The next time I open the project, it shows as not ready yet it opens anyway.

**Root Cause**: The ProjectPicker uses outdated readiness criteria that includes the legacy `ai/models` folder. Projects without `ai/models` (correctly structured modern projects) are marked "Not Ready" by ProjectPicker. However, when selected, extension.ts uses the correct criteria (without ai/models check) and properly identifies the project as ready, routing to Studio instead of Welcome screen.

Additionally, ProjectPicker doesn't check Cursor commands while extension.ts does, creating a second source of inconsistency.

**Solution**: Centralize all readiness checking logic in a shared utility module that all components import, using the correct criteria (6 folders excluding ai/models, plus Cursor commands validation).

```

**Changed Files During Session** (3 files):

### Feature: studio-dashboard
File: ai/features/studio/dashboard/overview.feature.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/features/studio/dashboard/overview.feature.md b/ai/features/studio/dashboard/overview.feature.md
index c17c0ae..2a1a74e 100644
--- a/ai/features/studio/dashboard/overview.feature.md
+++ b/ai/features/studio/dashboard/overview.feature.md
@@ -202,6 +202,8 @@ Feature: Open Forge Studio
     And I should see which projects are Forge-ready
     And I should see which projects are not yet initialized
     And I should be able to select any project
+    And the Forge-ready status shown must be accurate
+    And the status check must use the same criteria as the actual readiness check
 
   Scenario: Select Forge-ready project from multi-root workspace
     Given I have multiple workspace folders open
@@ -217,4 +219,15 @@ Feature: Open Forge Studio
     Then the welcome screen should appear
     And I should see the project path
     And I should see initialization options
+
+  Scenario: Consistent readiness checking across all entry points
+    Given I have multiple workspace folders open
+    When I execute "Forge: Open Forge Studio"
+    Then the readiness status shown in the project picker
+    And the readiness check performed after selection
+    And the readiness check in the welcome screen
+    Should all use the SAME readiness criteria
+    And should all check for the SAME required folders
+    And should all check for the SAME required Cursor commands
+    And the status displayed must accurately reflect whether the project will open Studio or Welcome screen
 ```
```

### Spec: welcome-initialization
File: ai/specs/studio/welcome-initialization.spec.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/specs/studio/welcome-initialization.spec.md b/ai/specs/studio/welcome-initialization.spec.md
index 38ed467..954194d 100644
--- a/ai/specs/studio/welcome-initialization.spec.md
+++ b/ai/specs/studio/welcome-initialization.spec.md
@@ -115,11 +115,12 @@ ai/
 ai/actors
 ai/contexts
 ai/features
-ai/models
 ai/sessions
 ai/specs
 ```
 
+**Note**: The `ai/models` folder is LEGACY and should NOT be checked. Some legacy implementations (like ProjectPicker) still check for this folder, causing inconsistent readiness status where projects show "Not Ready" when they actually are ready.
+
 ### Required Cursor Commands
 
 In addition to folders, a project is "Forge-ready" when ALL of the following Cursor command files exist AND have valid content:
@@ -129,6 +130,28 @@ In addition to folders, a project is "Forge-ready" when ALL of the following Cur
 .cursor/commands/forge-build.md
 ```
 
+### Centralized Readiness Checking
+
+**CRITICAL**: All code that checks project readiness MUST use a single, centralized implementation to ensure consistency.
+
+**Problem**: Multiple implementations with different criteria lead to:
+- Inaccurate status display in project picker
+- Projects showing "Not Ready" but opening Studio anyway
+- User confusion about actual project state
+
+**Solution**: Create a shared utility module that all components import:
+- `ProjectPicker` - uses shared check when displaying status
+- `extension.ts` command handler - uses shared check when routing
+- `WelcomePanel` - uses shared check when initializing
+
+**Shared Location**: `packages/vscode-extension/src/utils/projectReadiness.ts`
+
+**Implementation Requirements**:
+1. Single source of truth for required folders list
+2. Single source of truth for required commands list
+3. Single readiness check function used everywhere
+4. Consistent criteria across all entry points
+
 **Content Validation**:
 - Each Cursor command file must include a hash comment in the format: `<!-- forge-hash: SHA256_HASH -->`
 - The extension computes the hash of the file content (excluding the hash comment itself)
@@ -137,20 +160,32 @@ In addition to folders, a project is "Forge-ready" when ALL of the following Cur
 
 ### Detection Algorithm
 
+**Canonical Implementation Location**: `packages/vscode-extension/src/utils/projectReadiness.ts`
+
 ```typescript
-async function checkProjectReadiness(projectUri: Uri): Promise<boolean> {
-  const requiredFolders = [
-    'ai',
-    'ai/actors',
-    'ai/contexts',
-    'ai/features',
-    'ai/models',
-    'ai/sessions',
-    'ai/specs'
-  ];
-  
+// packages/vscode-extension/src/utils/projectReadiness.ts
+
+export const REQUIRED_FOLDERS = [
+  'ai',
+  'ai/actors',
+  'ai/contexts',
+  'ai/features',
+  'ai/sessions',
+  'ai/specs'
+];
+
+export const REQUIRED_COMMANDS = [
+  '.cursor/commands/forge-design.md',
+  '.cursor/commands/forge-build.md'
+];
+
+/**
+ * THE authoritative check for project readiness.
+ * All components MUST use this function.
+ */
+export async function checkProjectReadiness(projectUri: Uri): Promise<boolean> {
   // Check folders
-  for (const folder of requiredFolders) {
+  for (const folder of REQUIRED_FOLDERS) {
     const folderUri = Uri.joinPath(projectUri, folder);
     try {
       await workspace.fs.stat(folderUri);
@@ -162,12 +197,7 @@ async function checkProjectReadiness(projectUri: Uri): Promise<boolean> {
   }
   
   // Check Cursor commands
-  const requiredCommands = [
-    '.cursor/commands/forge-design.md',
-    '.cursor/commands/forge-build.md'
-  ];
-  
-  for (const commandPath of requiredCommands) {
+  for (const commandPath of REQUIRED_COMMANDS) {
     const commandUri = Uri.joinPath(projectUri, commandPath);
     try {
       const fileContent = await workspace.fs.readFile(commandUri);
@@ -190,6 +220,25 @@ async function checkProjectReadiness(projectUri: Uri): Promise<boolean> {
 }
 ```
 
+**Usage in Other Components**:
+
+```typescript
+// ProjectPicker.ts
+import { checkProjectReadiness } from './projectReadiness';
+
+const isReady = await checkProjectReadiness(folder.uri);
+
+// extension.ts
+import { checkProjectReadiness } from './utils/projectReadiness';
+
+const isReady = await checkProjectReadiness(project);
+
+// WelcomePanel.ts
+import { checkProjectReadiness } from '../utils/projectReadiness';
+
+const isReady = await checkProjectReadiness(this._projectUri);
+```
+
 ### Folder and Command Status Checking
 
 ```typescript
```

### Feature: welcome-screen
File: ai/features/studio/welcome/welcome-screen.feature.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/features/studio/welcome/welcome-screen.feature.md b/ai/features/studio/welcome/welcome-screen.feature.md
index cb0a09e..d84f509 100644
--- a/ai/features/studio/welcome/welcome-screen.feature.md
+++ b/ai/features/studio/welcome/welcome-screen.feature.md
@@ -57,7 +57,6 @@ Feature: Welcome Screen Display
       | ai/actors | Actor definitions and personas |
       | ai/contexts | Context guidance files |
       | ai/features | Feature definitions with Gherkin |
-      | ai/models | Data model definitions |
       | ai/sessions | Design session tracking |
       | ai/specs | Technical specifications |
     And I should see the following Cursor commands in the checklist:
@@ -82,7 +81,6 @@ Feature: Project Readiness Detection
       | ai/actors |
       | ai/contexts |
       | ai/features |
-      | ai/models |
       | ai/sessions |
       | ai/specs |
     And a project has all required Cursor commands:
@@ -148,6 +146,27 @@ Feature: Project Readiness Detection
     And compare against the expected template hash
     And report which files are valid or invalid
     And update project readiness status accordingly
+
+  Scenario: Consistent readiness checking across all components
+    Given I have a project with all required folders
+    And the project has valid Cursor command files
+    When ProjectPicker checks readiness for the multi-root picker
+    And extension.ts checks readiness after project selection
+    And WelcomePanel checks readiness when rendering
+    Then all three checks MUST return the same result
+    And all three checks MUST use the same readiness criteria
+    And all three checks MUST check for the same folders (excluding legacy ai/models)
+    And all three checks MUST check for the same Cursor commands
+    And the status shown in the picker MUST match the actual routing decision
+
+  Scenario: Prevent status display inconsistency in multi-root workspace
+    Given I have multiple workspace folders
+    And one folder shows "Not Ready" in the project picker
+    When I select that folder
+    Then if the welcome screen appears, the folder was correctly marked "Not Ready"
+    And if Studio opens directly, the folder status was INCORRECT
+    And this scenario should NEVER happen
+    And the picker status MUST accurately predict the routing decision
 ```
 
 ## Feature: Project Initialization
@@ -169,7 +188,6 @@ Feature: Project Initialization
       | ai/actors |
       | ai/contexts |
       | ai/features |
-      | ai/models |
       | ai/sessions |
       | ai/specs |
     And I should see a list of all Cursor commands that will be created:
@@ -201,7 +219,7 @@ Feature: Project Initialization
 
   Scenario: Initialize partially ready project
     Given a project has ai/ and ai/features
-    But is missing ai/actors, ai/contexts, ai/models, ai/sessions, ai/specs
+    But is missing ai/actors, ai/contexts, ai/sessions, ai/specs
     And is missing Cursor commands
     When I initialize the project
     Then only the missing folders should be created
```


**Note:** Git diffs show uncommitted changes only. Session did not track start commit.

## Global Contexts

The following contexts are marked as global and should inform all story generation:

### build-procedures (ai/contexts/foundation/build-procedures.context.md)

---
context_id: build-procedures
category: foundation
name: Build Procedures and Packaging
description: Comprehensive guide for building and packaging Forge packages
global: true
---

# Build Procedures and Packaging

## When to Use This Context

Use this context when:
- Building Forge packages for distribution
- Understanding the build process
- Packaging extensions for installation
- Troubleshooting build issues
- Preparing releases

## Build Architecture

```gherkin
Scenario: Understand build architecture
  Given you need to build Forge packages
  When understanding the build process
  Then vscode-extension uses webpack for bundling
  And vscode-extension uses esbuild for webview
  And mcp-server uses TypeScript compiler
  And each package has independent build configuration

Scenario: Build output locations
  Given you run a build
  When checking build outputs
  Then vscode-extension dist/ contains bundled extension.js
  And vscode-extension media/studio/ contains webview bundle
  And mcp-server dist/ contains compiled JavaScript
  And all outputs are optimized for production
```

## VSCode Extension Build Process

### Build Steps

```gherkin
Scenario: Build vscode extension
  Given you are building the extension
  When running the build process
  Then webpack compiles TypeScript to JavaScript
  And webpack bundles all dependencies into dist/extension.js
  And esbuild bundles React webview to media/studio/main.js
  And both outputs are optimized and minified
  And source maps are generated for debugging

Scenario: Production build
  Given you are creating a production build
  When packaging the extension
  Then webpack runs in production mode
  And esbuild minifies the webview bundle
  And source maps are hidden (hidden-source-map)
  And all dependencies are bundled
  And output size is minimized
```

### Build Configuration

- **Main Extension**: Webpack with ts-loader
- **Webview**: esbuild with React bundling
- **Output**: `dist/extension.js` (main), `media/studio/main.js` (webview)
- **Source Maps**: Generated for debugging
- **Dependencies**: All bundled (no node_modules needed)

### Packaging Process

```gherkin
Scenario: Package extension for distribution
  Given you have built the extension
  When packaging for distribution
  Then run `npm run vscode:package` from root
  And this executes production webpack build
  And builds webview with esbuild (minified)
  And runs @vscode/vsce package command
  And creates forge-0.1.0.vsix file
  And bundles are optimized for size

Scenario: Verify package contents
  Given you have created a .vsix file
  When verifying package contents
  Then verify dist/extension.js is included
  And verify media/studio/main.js is included
  And verify package.json metadata is correct
  And verify no node_modules are included
  And verify all dependencies are bundled
```

## MCP Server Build Process

### Build Steps

```gherkin
Scenario: Build MCP server
  Given you are building the MCP server
  When running the build process
  Then TypeScript compiler compiles src/ to dist/
  And uses ES modules (type: "module")
  And preserves directory structure
  And generates .d.ts type definitions
  And makes dist/index.js executable

Scenario: Development vs production build
  Given you are building the server
  When in development mode
  Then tsx watch mode auto-reloads on changes
  When in production mode
  Then TypeScript compiles to optimized JavaScript
  And no source maps needed (runtime dependencies)
```

### Build Configuration

- **Compiler**: TypeScript (tsc)
- **Module System**: ES modules (`"type": "module"`)
- **Output**: `dist/index.js` (executable)
- **Dependencies**: Resolved from node_modules at runtime
- **Executable**: `chmod +x` applied automatically

## Build Commands Reference

### Root Level Commands

```bash
# Build all packages
npm run build

# Watch all packages (if supported)
npm run watch

# Lint all packages
npm run lint

# Clean all build artifacts
npm run clean

# Package vscode extension
npm run vscode:package
```

### Package-Specific Commands

```bash
# VSCode Extension
npm run build -w forge              # Build extension
npm run watch -w forge              # Watch mode
npm run lint -w forge               # Lint
npm run clean -w forge              # Clean

# MCP Server
npm run build -w @forge/mcp-server # Build server
npm run dev -w @forge/mcp-server   # Dev mode (tsx watch)
npm run lint -w @forge/mcp-server  # Lint
npm run clean -w @forge/mcp-server # Clean
```

## Build Optimization

```gherkin
Scenario: Optimize build size
  Given you want to minimize bundle size
  When building the extension
  Then webpack tree-shakes unused code
  And esbuild minifies the webview bundle
  And dependencies are bundled efficiently
  And source maps are excluded from production

Scenario: Optimize build speed
  Given you want faster builds
  When developing locally
  Then use watch mode for incremental builds
  And use tsx for MCP server (faster than tsc)
  And cache node_modules between builds
  And only build packages you're modifying
```

## Troubleshooting Build Issues

```gherkin
Scenario: Build fails with module errors
  Given build fails with module errors
  When troubleshooting
  Then verify all dependencies are installed: `npm install`
  And check workspace links are correct
  And verify package.json dependencies match
  And try cleaning and rebuilding: `npm run clean && npm run build`

Scenario: Webview bundle not updating
  Given webview changes aren't reflected
  When troubleshooting
  Then verify esbuild build completed
  And check media/studio/main.js was updated
  And verify webview cache is cleared
  And reload webview panel in VSCode

Scenario: Extension bundle too large
  Given extension bundle is too large
  When optimizing
  Then check webpack bundle analyzer
  And verify unused dependencies are removed
  And check for duplicate dependencies
  And use production mode builds
```

## Release Process

```gherkin
Scenario: Prepare release build
  Given you are preparing a release
  When building for release
  Then update version in all package.json files
  Then run `npm run build` to build all packages
  Then run `npm run vscode:package` to create .vsix
  Then verify build artifacts are correct
  Then test extension installation
  Then test MCP server functionality
  Then update CHANGELOG.md
```

## Best Practices

### Build Quality

1. **Always test builds**: Verify builds work before committing
2. **Use production mode**: Test production builds before release
3. **Verify bundle sizes**: Check bundle sizes haven't grown unexpectedly
4. **Test installation**: Install .vsix locally to verify packaging
5. **Check dependencies**: Ensure all dependencies are correctly bundled

### Development Efficiency

1. **Use watch mode**: For active development, use watch mode
2. **Incremental builds**: Only rebuild what changed
3. **Fast feedback**: Use tsx for MCP server development
4. **Isolated testing**: Test extension in Extension Development Host

### Release Checklist

- [ ] Update version numbers
- [ ] Build all packages successfully
- [ ] Create .vsix package
- [ ] Test extension installation
- [ ] Test MCP server functionality
- [ ] Update CHANGELOG.md
- [ ] Verify all documentation is accurate
- [ ] Tag release in Git



---

### local-development (ai/contexts/foundation/local-development.context.md)

---
context_id: local-development
category: foundation
name: Local Development Procedures
description: Comprehensive guide for local development of the Forge monorepo
global: true
---

# Local Development Procedures

## When to Use This Context

Use this context when:
- Setting up the Forge development environment
- Understanding the build process
- Working with individual packages
- Troubleshooting development issues
- Contributing to Forge

## Prerequisites

```gherkin
Scenario: Verify development prerequisites
  Given you want to develop Forge locally
  When checking system requirements
  Then ensure Node.js 22.14.0+ is installed
  And ensure npm 10.0.0+ is installed
  And ensure Git is installed
  And ensure VSCode is installed (for extension development)

Scenario: Verify Node.js version
  Given you have Node.js installed
  When checking the version
  Then verify it is 22.14.0 or higher
  And use .nvmrc file if using nvm: `nvm use`
```

## Initial Setup

```gherkin
Scenario: Initial project setup
  Given you have cloned the repository
  When setting up the development environment
  Then run `npm install` from the root directory
  And this installs dependencies for all workspaces
  And run `npm run build` to build all packages
  And verify build artifacts are created in dist/ directories

Scenario: Workspace installation
  Given you are in the monorepo root
  When running npm install
  Then npm workspaces automatically links packages
  And shared dev dependencies are installed at root
  And package-specific dependencies are installed in each package
```

## Build Procedures

### Building All Packages

```gherkin
Scenario: Build all packages
  Given you are in the monorepo root
  When building all packages
  Then run `npm run build`
  And this builds both vscode-extension and mcp-server
  And build artifacts are created in each package's dist/ directory

Scenario: Build specific package
  Given you want to build a single package
  When building the vscode extension
  Then run `npm run build -w forge`
  And this builds only the vscode extension
  When building the MCP server
  Then run `npm run build -w @forge/mcp-server`
  And this builds only the MCP server
```

### Watch Mode Development

```gherkin
Scenario: Watch mode for vscode extension
  Given you are developing the vscode extension
  When you want automatic rebuilds on changes
  Then run `npm run watch -w forge`
  And this watches both TypeScript and webview changes
  And rebuilds automatically when files change
  And use F5 in VSCode to launch Extension Development Host

Scenario: Watch mode for MCP server
  Given you are developing the MCP server
  When you want automatic rebuilds on changes
  Then run `npm run dev -w @forge/mcp-server`
  And this uses tsx watch mode for auto-reload
  And changes are reflected immediately
```

## Package-Specific Development

### VSCode Extension Development

```gherkin
Scenario: Build vscode extension
  Given you are developing the vscode extension
  When building the extension
  Then webpack bundles the main extension code
  And esbuild bundles the React webview code
  And both outputs are in dist/ and media/studio/ directories
  And the extension entry point is dist/extension.js

Scenario: Test vscode extension
  Given you have built the extension
  When testing the extension
  Then open packages/vscode-extension in VSCode
  And press F5 to launch Extension Development Host
  And test commands in the new window
  And verify Forge Studio opens correctly
  And verify file operations work as expected

Scenario: Package vscode extension
  Given you have a completed extension
  When packaging for distribution
  Then run `npm run vscode:package` from root
  And this runs production build with webpack
  And builds webview with esbuild (minified)
  And creates .vsix file using @vscode/vsce
  And the output is forge-0.1.0.vsix

Scenario: Install extension locally
  Given you have packaged the extension
  When installing locally
  Then run `code --install-extension packages/vscode-extension/forge-0.1.0.vsix`
  And restart VSCode to activate the extension
  And verify commands are available in Command Palette
```

### MCP Server Development

```gherkin
Scenario: Build MCP server
  Given you are developing the MCP server
  When building the server
  Then TypeScript compiles src/ to dist/
  And uses ES modules (type: "module")
  And makes dist/index.js executable (chmod +x)
  And dependencies are resolved from node_modules at runtime

Scenario: Run MCP server directly
  Given you have built the MCP server
  When running the server directly
  Then execute `node packages/mcp-server/dist/index.js`
  And the server starts with stdio transport
  And responds to MCP tool calls via stdin/stdout

Scenario: Development mode with auto-reload
  Given you are actively developing the MCP server
  When you want automatic reloads
  Then run `npm run dev -w @forge/mcp-server`
  And tsx watches for file changes
  And automatically restarts the server on changes
  And you can test changes immediately
```

## Testing

```gherkin
Scenario: Run linting
  Given you want to check code quality
  When running linting
  Then run `npm run lint` from root (lints all packages)
  Or run `npm run lint -w <package>` for specific package
  And ESLint checks TypeScript and React code
  And fixes are suggested where applicable

Scenario: Run tests
  Given you have test files
  When running tests
  Then run `npm test -w forge` for extension tests
  And vitest runs unit tests
  And verify all tests pass before committing
```

## Cleanup

```gherkin
Scenario: Clean build artifacts
  Given you want to clean build outputs
  When cleaning artifacts
  Then run `npm run clean` from root
  And this removes dist/ directories
  And removes node_modules (optional)
  And prepares for fresh build
```

## Troubleshooting

### Common Issues

```gherkin
Scenario: Workspace not found error
  Given you see workspace errors
  When troubleshooting
  Then verify you are in the repository root
  And verify package.json has "workspaces": ["packages/*"]
  And run `npm install` to refresh workspace links

Scenario: TypeScript compilation errors
  Given you see TypeScript errors
  When troubleshooting
  Then verify Node types match (@types/node@^22.14.0)
  And run `npm install` to update dependencies
  And verify TypeScript version is ^5.0.0
  And check tsconfig.json is correct

Scenario: Extension won't load
  Given the extension fails to load
  When troubleshooting
  Then verify webpack build completed successfully
  And verify webview build completed successfully
  And check that dist/extension.js exists
  And verify media/studio/main.js exists
  And check VSCode Developer Console for errors

Scenario: MCP server not found
  Given MCP server can't be found
  When troubleshooting
  Then verify build completed: `npm run build -w @forge/mcp-server`
  And verify dist/index.js exists
  And verify execute permissions: `chmod +x packages/mcp-server/dist/index.js`
  And check absolute path in MCP configuration
```

## Best Practices

### Development Workflow

1. **Always build before testing**: Run `npm run build` after pulling changes
2. **Use watch mode**: Use `npm run watch` for active development
3. **Test in Extension Host**: Use F5 to test extension in isolated environment
4. **Lint before committing**: Run `npm run lint` to catch issues early
5. **Clean before builds**: Run `npm run clean` if experiencing strange build issues

### Code Organization

- **Package structure**: Each package is self-contained with its own dependencies
- **Shared dependencies**: Common dev dependencies at root level
- **TypeScript**: All packages use TypeScript with strict mode
- **ES modules**: MCP server uses ES modules, extension uses CommonJS

### Version Management

- Both packages share version number (0.1.0)
- Update version in all package.json files when releasing
- Update CHANGELOG.md with changes
- Build and package both before release

## File Structure

```
forge-monorepo/
├── packages/
│   ├── vscode-extension/     # VSCode Extension
│   │   ├── src/              # TypeScript source
│   │   ├── dist/             # Compiled extension (webpack)
│   │   ├── media/studio/     # Webview bundle (esbuild)
│   │   └── package.json
│   └── mcp-server/          # MCP Server
│       ├── src/              # TypeScript source
│       ├── dist/             # Compiled JavaScript
│       └── package.json
├── package.json             # Root workspace config
└── .nvmrc                   # Node version (22.14.0)
```



---

Use the guidance above when creating stories and tasks. These foundational contexts ensure consistency across all implementation work.

STEP 5: Review changed files and follow context guidance

For each changed file listed above:
1. Review the git diff (if available) to understand exactly what changed
2. If no git diff is available, read the file directly to understand its content
3. Identify any context_id references in the file's frontmatter
4. Read any referenced context files and execute their Gherkin scenarios (GIVEN/WHEN/THEN)

STEP 6: Analyze and break down into Stories and Tasks

Based on the session and the git diffs (or file contents) of changed files:

**IMPORTANT:** Use the git diffs shown above to understand EXACTLY what changed in each file. The diffs show:
- Lines that were added (prefixed with +)
- Lines that were removed (prefixed with -)
- Context around the changes
- Whether files are new, modified, or deleted

If git diffs are not available, read the files directly to understand their current state and determine what needs to be implemented.

This precise change information should guide your story creation - focus on implementing these specific changes.

**Create Stories** (*.story.md) in ai/tickets/forge-ready-status-accuracy/ for:
- Code changes and implementations
- New features or feature modifications
- Technical debt improvements
- Refactoring work

**Create Tasks** (*.task.md) in ai/tickets/forge-ready-status-accuracy/ for:
- Manual configuration in external systems
- Documentation updates outside code
- Third-party service setup
- Manual testing or verification steps

**Critical Requirements:**

1. **Keep Stories MINIMAL** - Each story should take < 30 minutes to implement
2. **Break Down Large Changes** - If a change is complex, create multiple small stories
3. **Use Proper Linkages** - Link stories/tasks to feature_id, spec_id, and model_id from changed files
4. **Link to Session** - ALL stories and tasks MUST include session_id: "forge-ready-status-accuracy" in their frontmatter
5. **Be Specific** - Include exact file paths, clear objectives, and acceptance criteria
6. **Add Context** - Each story should have enough information to be implemented independently
7. **Order Matters** - Set dependencies and order stories logically
8. **Follow Schemas** - All files must adhere to schemas from Step 2

STEP 7: Verify completeness and create files

Ensure that:
- Every changed file is accounted for in at least one story or task
- All stories have clear acceptance criteria
- Dependencies between stories are identified
- The collection of stories fully implements the session goals
- Stories are small enough to be completed quickly
- ALL stories and tasks link back to session_id: "forge-ready-status-accuracy"

Now create all the story and task files in ai/tickets/forge-ready-status-accuracy/ following the schemas and requirements above.
