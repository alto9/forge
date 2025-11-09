# Create Stories and Tasks for Session: migrate-from-mermaid-to-nomnoml

This command will analyze the design session and create Stories (for code changes) and Tasks (for non-code work) based on the session's changed files and goals.

---

STEP 1: Call the get_forge_about MCP tool to understand the Forge workflow and distillation principles.

STEP 2: Retrieve the required schemas:
- get_forge_schema with schema_type "story"
- get_forge_schema with schema_type "task"

STEP 3: Review the design session:

**Session File**: /Users/derrick/Documents/Code/Alto9/oss/cursor-context-engineering/ai/sessions/migrate-from-mermaid-to-nomnoml.session.md
**Session ID**: migrate-from-mermaid-to-nomnoml

**Session Content**:
```markdown
---
session_id: migrate-from-mermaid-to-nomnoml
start_time: '2025-11-09T00:21:25.141Z'
status: completed
problem_statement: migrate from mermaid to nomnoml
changed_files:
  - ai/specs/extension/cursor-commands-management.spec.md
  - ai/specs/package/monorepo.spec.md
  - ai/specs/build/webpack.spec.md
  - ai/specs/studio/forge-studio-implementation.spec.md
  - ai/specs/studio/welcome-initialization.spec.md
  - ai/features/studio/specs/spec-editing.feature.md
  - ai/features/studio/specs/spec-detail-view.feature.md
  - ai/features/studio/specs/spec-creation.feature.md
end_time: '2025-11-09T00:32:53.770Z'
---
## Problem Statement

migrate from mermaid to nomnoml

## Goals

Mermaid is too hard to work with, we need a diagram library that is smaller, and easier to read and modify.

## Approach

We would like to switch to nomnoml. Spec profiles in the studio should be updated to render all nomnoml diagrams locally. In 'view only' mode we would see a diagram render only. In a design session we would see the diagram source and the render, and the developer could switch between them with a 2 button toggle. Upgrade all instructions that reference mermaid or specs if they require it.

## Key Decisions

Decided to use nomnoml over graphviz, mermaid, and other options.

## Notes

We will need to migrate our existing specs with this change.

```

**Changed Files During Session** (8 files):

### Spec: cursor-commands-management
File: ai/specs/extension/cursor-commands-management.spec.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/specs/extension/cursor-commands-management.spec.md b/ai/specs/extension/cursor-commands-management.spec.md
index bc3b640..6e42a79 100644
--- a/ai/specs/extension/cursor-commands-management.spec.md
+++ b/ai/specs/extension/cursor-commands-management.spec.md
@@ -19,25 +19,24 @@ Forge distributes Cursor command files (`.cursor/commands/*.md`) as part of proj
 
 ## Architecture
 
-```mermaid
-graph TD
-    A[Extension Activation] --> B[Load Command Templates]
-    B --> C[Templates Stored in Memory]
-    
-    D[Check Project Readiness] --> E[Read Command Files]
-    E --> F[Validate Hash]
-    F --> G{Hash Valid?}
-    G -->|Yes| H[File is Valid]
-    G -->|No| I[File is Invalid/Outdated]
-    
-    J[Initialize Project] --> K[Generate Commands]
-    K --> L[Compute Hash]
-    L --> M[Embed Hash Comment]
-    M --> N[Write File to Project]
-    
-    style C fill:#90EE90
-    style H fill:#90EE90
-    style I fill:#FFB6C1
+```nomnoml
+#direction: down
+#padding: 10
+#fontSize: 12
+
+[Extension Activation] -> [Load Command Templates]
+[Load Command Templates] -> [Templates Stored in Memory|<success>]
+
+[Check Project Readiness] -> [Read Command Files]
+[Read Command Files] -> [Validate Hash]
+[Validate Hash] -> [<choice>Hash Valid?]
+[<choice>Hash Valid?] Yes -> [File is Valid|<success>]
+[<choice>Hash Valid?] No -> [File is Invalid/Outdated|<error>]
+
+[Initialize Project] -> [Generate Commands]
+[Generate Commands] -> [Compute Hash]
+[Compute Hash] -> [Embed Hash Comment]
+[Embed Hash Comment] -> [Write File to Project]
 ```
 
 ## Command Files
@@ -54,7 +53,7 @@ graph TD
 - Only modifies files in the `ai/` folder (features, specs, models, actors, contexts)
 - Reads AI documentation for context
 - Tracks all changes in the active session's `changed_files` array
-- Ensures proper formatting (Gherkin in features, Mermaid in specs)
+- Ensures proper formatting (Gherkin in features, Nomnoml in specs)
 
 **Template Content**:
 
@@ -81,7 +80,7 @@ You must have an active design session before making changes to AI documentation
 - **Only modify AI documentation files**: Work exclusively within the `ai/` folder
 - **Do NOT modify implementation code**: This command is for updating features, specs, models, actors, and contexts only
 - **Track all changes**: Ensure changed files are tracked in the active session's `changed_files` array
-- **Use proper formats**: Features use Gherkin in code blocks, Specs use Mermaid diagrams
+- **Use proper formats**: Features use Gherkin in code blocks, Specs use Nomnoml diagrams
 - **Call MCP tools**: Always start by calling `get_forge_about` to understand the current Forge workflow
 
 ## Usage
@@ -129,7 +128,7 @@ You must provide a story file (*.story.md) when running this command.
 3. **Analyzes the existing codebase**: Understands current implementation patterns and structure
 4. **Reads AI documentation**: Understands intended behavior from linked files:
    - Features (expected behavior with Gherkin scenarios)
-   - Specs (technical implementation details with Mermaid diagrams)
+   - Specs (technical implementation details with Nomnoml diagrams)
    - Models (data structures)
    - Contexts (technology-specific guidance)
 5. **Implements the changes**: Writes actual code as described in the story
@@ -196,7 +195,7 @@ You must have an active design session before making changes to AI documentation
 - **Only modify AI documentation files**: Work exclusively within the \`ai/\` folder
 - **Do NOT modify implementation code**: This command is for updating features, specs, models, actors, and contexts only
 - **Track all changes**: Ensure changed files are tracked in the active session's \`changed_files\` array
-- **Use proper formats**: Features use Gherkin in code blocks, Specs use Mermaid diagrams
+- **Use proper formats**: Features use Gherkin in code blocks, Specs use Nomnoml diagrams
 - **Call MCP tools**: Always start by calling \`get_forge_about\` to understand the current Forge workflow
 
 ## Usage
@@ -228,7 +227,7 @@ You must provide a story file (*.story.md) when running this command.
 3. **Analyzes the existing codebase**: Understands current implementation patterns and structure
 4. **Reads AI documentation**: Understands intended behavior from linked files:
    - Features (expected behavior with Gherkin scenarios)
-   - Specs (technical implementation details with Mermaid diagrams)
+   - Specs (technical implementation details with Nomnoml diagrams)
    - Models (data structures)
    - Contexts (technology-specific guidance)
 5. **Implements the changes**: Writes actual code as described in the story
```

### Spec: monorepo
File: ai/specs/package/monorepo.spec.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/specs/package/monorepo.spec.md b/ai/specs/package/monorepo.spec.md
index 58325a2..cc165ed 100644
--- a/ai/specs/package/monorepo.spec.md
+++ b/ai/specs/package/monorepo.spec.md
@@ -10,18 +10,20 @@ context_id: [node]
 
 ## Architecture
 
-```mermaid
-graph TD
-    A[Root Package] --> B[VSCode Extension]
-    A --> C[MCP Server]
-    
-    B --> D[Extension Source]
-    B --> E[Webview Components]
-    B --> F[Build Artifacts]
-    
-    C --> G[MCP Tools]
-    C --> H[Server Implementation]
-    C --> I[Dist Package]
+```nomnoml
+#direction: down
+#padding: 10
+
+[Root Package] -> [VSCode Extension]
+[Root Package] -> [MCP Server]
+
+[VSCode Extension] -> [Extension Source]
+[VSCode Extension] -> [Webview Components]
+[VSCode Extension] -> [Build Artifacts]
+
+[MCP Server] -> [MCP Tools]
+[MCP Server] -> [Server Implementation]
+[MCP Server] -> [Dist Package]
 ```
 
 ## Implementation Details
```

### Spec: webpack
File: ai/specs/build/webpack.spec.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/specs/build/webpack.spec.md b/ai/specs/build/webpack.spec.md
index 8286cac..ab97912 100644
--- a/ai/specs/build/webpack.spec.md
+++ b/ai/specs/build/webpack.spec.md
@@ -10,16 +10,18 @@ context_id: [node, vsce]
 
 ## Architecture
 
-```mermaid
-graph TD
-    A[TypeScript Source] --> B[Webpack Loader]
-    B --> C[TypeScript Compiler]
-    C --> D[JavaScript Bundle]
-    D --> E[Extension Entry Point]
-    
-    F[Webview Source] --> G[esbuild]
-    G --> H[React Bundle]
-    H --> I[Webview Assets]
+```nomnoml
+#direction: down
+#padding: 10
+
+[TypeScript Source] -> [Webpack Loader]
+[Webpack Loader] -> [TypeScript Compiler]
+[TypeScript Compiler] -> [JavaScript Bundle]
+[JavaScript Bundle] -> [Extension Entry Point]
+
+[Webview Source] -> [esbuild]
+[esbuild] -> [React Bundle]
+[React Bundle] -> [Webview Assets]
 ```
 
 ## Implementation Details
```

### Spec: forge-studio-implementation
File: ai/specs/studio/forge-studio-implementation.spec.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/specs/studio/forge-studio-implementation.spec.md b/ai/specs/studio/forge-studio-implementation.spec.md
index 43469b1..4713dda 100644
--- a/ai/specs/studio/forge-studio-implementation.spec.md
+++ b/ai/specs/studio/forge-studio-implementation.spec.md
@@ -16,37 +16,44 @@ Forge Studio is a React-based webview application embedded in VSCode that provid
 
 ### High-Level Flow
 
-```mermaid
-graph TD
-    A[User: Forge Open Studio] -->|Command| B[extension.ts]
-    B --> C[ProjectPicker.pickProject]
-    C --> D{Check Project Readiness}
-    D -->|Not Ready| E[WelcomePanel]
-    D -->|Ready| F[ForgeStudioPanel]
-    E -->|Initialize| G[Create Folders]
-    G -->|Success| F
-    E -->|Manual Open| F
-    F --> H[Dashboard/Sessions/Files]
+```nomnoml
+#direction: down
+#padding: 10
+
+[User: Forge Open Studio] Command -> [extension.ts]
+[extension.ts] -> [ProjectPicker.pickProject]
+[ProjectPicker.pickProject] -> [<choice>Check Project Readiness]
+[<choice>Check Project Readiness] Not Ready -> [WelcomePanel]
+[<choice>Check Project Readiness] Ready -> [ForgeStudioPanel]
+[WelcomePanel] Initialize -> [Create Folders]
+[Create Folders] Success -> [ForgeStudioPanel]
+[WelcomePanel] Manual Open -> [ForgeStudioPanel]
+[ForgeStudioPanel] -> [Dashboard/Sessions/Files]
 ```
 
 ### Components
 
-```mermaid
-graph TD
-    A[VSCode Extension Host] -->|WebviewPanel| B[ForgeStudioPanel.ts]
-    A -->|WebviewPanel| B2[WelcomePanel.ts]
-    B -->|HTML + React| C[Webview UI - index.tsx]
-    B2 -->|HTML + React| C2[Welcome UI - welcome/index.tsx]
-    C -->|postMessage| B
-    B -->|postMessage| C
-    C2 -->|postMessage| B2
-    B2 -->|postMessage| C2
-    B -->|File System| D[ai/ directory]
-    B2 -->|File System| D
-    B -->|FileParser| E[File I/O]
-    B -->|PromptGenerator| F[Prompt Generation]
-    C -->|Components| G[Dashboard, Sessions, BrowserPage, SessionPanel]
-    C2 -->|Components| G2[StatusIndicator, FolderChecklist, ActionButtons]
+```nomnoml
+#direction: down
+#padding: 10
+
+[VSCode Extension Host] WebviewPanel -> [ForgeStudioPanel.ts]
+[VSCode Extension Host] WebviewPanel -> [WelcomePanel.ts]
+
+[ForgeStudioPanel.ts] HTML + React -> [Webview UI - index.tsx]
+[WelcomePanel.ts] HTML + React -> [Welcome UI - welcome/index.tsx]
+
+[Webview UI - index.tsx] postMessage <-> [ForgeStudioPanel.ts]
+[Welcome UI - welcome/index.tsx] postMessage <-> [WelcomePanel.ts]
+
+[ForgeStudioPanel.ts] File System -> [ai/ directory]
+[WelcomePanel.ts] File System -> [ai/ directory]
+
+[ForgeStudioPanel.ts] -> [FileParser|File I/O]
+[ForgeStudioPanel.ts] -> [PromptGenerator|Prompt Generation]
+
+[Webview UI - index.tsx] Components -> [Dashboard, Sessions, BrowserPage, SessionPanel]
+[Welcome UI - welcome/index.tsx] Components -> [StatusIndicator, FolderChecklist, ActionButtons]
 ```
 
 ### Extension Host (ForgeStudioPanel.ts)
@@ -301,7 +308,7 @@ category: ''
 Each category gets appropriate markdown template:
 
 - **Features**: Overview, Gherkin behavior block, Notes
-- **Specs**: Overview, Mermaid architecture, Implementation Details, Notes
+- **Specs**: Overview, Nomnoml architecture, Implementation Details, Notes
 - **Models**: Overview, Properties table, Relationships, Validation Rules, Notes
 - **Actors**: Overview, Responsibilities, Interactions, Notes
 - **Contexts**: Overview, Gherkin usage block, Guidance, Notes
@@ -557,6 +564,6 @@ Produces `forge-{version}.vsix` file that can be installed in VSCode.
 6. Global search
 7. Git integration (commit from Studio)
 8. Collaborative sessions (multiple users)
-9. Real-time preview of Mermaid diagrams
+9. Real-time preview of Nomnoml diagrams
 10. Story/Task management in Studio
```

### Spec: welcome-initialization
File: ai/specs/studio/welcome-initialization.spec.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/specs/studio/welcome-initialization.spec.md b/ai/specs/studio/welcome-initialization.spec.md
index 811f162..38ed467 100644
--- a/ai/specs/studio/welcome-initialization.spec.md
+++ b/ai/specs/studio/welcome-initialization.spec.md
@@ -16,23 +16,24 @@ The Welcome Screen is a webview panel that appears when a user opens Forge on a
 
 ### Component Structure
 
-```mermaid
-graph TD
-    A[extension.ts] -->|forge.openStudio command| B[ProjectPicker]
-    B -->|returns projectUri| C{Check Readiness}
-    C -->|Not Ready| D[WelcomePanel]
-    C -->|Ready| E[ForgeStudioPanel]
-    D -->|initialize| F[Create Folders]
-    F -->|success| E
-    D -->|manual open| E
-    
-    D --> G[Welcome Webview UI]
-    G -->|postMessage| D
-    D -->|postMessage| G
-    
-    D --> H[File System]
-    H -->|check folders| C
-    H -->|create folders| F
+```nomnoml
+#direction: down
+#padding: 10
+
+[extension.ts] forge.openStudio command -> [ProjectPicker]
+[ProjectPicker] returns projectUri -> [<choice>Check Readiness]
+[<choice>Check Readiness] Not Ready -> [WelcomePanel]
+[<choice>Check Readiness] Ready -> [ForgeStudioPanel]
+[WelcomePanel] initialize -> [Create Folders]
+[Create Folders] success -> [ForgeStudioPanel]
+[WelcomePanel] manual open -> [ForgeStudioPanel]
+
+[WelcomePanel] -> [Welcome Webview UI]
+[Welcome Webview UI] postMessage <-> [WelcomePanel]
+
+[WelcomePanel] -> [File System]
+[File System] check folders -> [<choice>Check Readiness]
+[File System] create folders -> [Create Folders]
 ```
 
 ### Components
@@ -357,7 +358,7 @@ You must have an active design session before making changes to AI documentation
 
 Run this command when you want to design or modify:
 - Features (with Gherkin scenarios)
-- Technical specifications (with Mermaid diagrams)  
+- Technical specifications (with Nomnoml diagrams)  
 - Data models
 - Actor definitions
 - Context guidance
@@ -396,31 +397,27 @@ The implementation will be consistent with your documented design and existing c
 
 ### Workflow
 
-```mermaid
-sequenceDiagram
-    participant User
-    participant Webview
-    participant WelcomePanel
-    participant FileSystem
-    participant ForgeStudio
-
-    User->>Webview: Click "Initialize Forge Project"
-    Webview->>Webview: Show confirmation dialog
-    Webview->>Webview: Display folders to be created
-    User->>Webview: Click "Confirm"
-    Webview->>WelcomePanel: initializeProject message
-    WelcomePanel->>WelcomePanel: Get list of missing folders
-    
-    loop For each missing folder
-        WelcomePanel->>FileSystem: createDirectory(folderUri)
-        FileSystem-->>WelcomePanel: success/error
-        WelcomePanel->>Webview: progress update
-    end
-    
-    WelcomePanel->>WelcomePanel: Verify all folders created
-    WelcomePanel->>Webview: initialization complete
-    WelcomePanel->>ForgeStudio: Open Studio
-    ForgeStudio-->>User: Dashboard loads
+```nomnoml
+#direction: down
+#padding: 10
+#.sequence: fill=#fff visual=sender
+
+[User] -> [Webview|Click "Initialize Forge Project"]
+[Webview] -> [Webview|Show confirmation dialog]
+[Webview] -> [Webview|Display folders to be created]
+[User] -> [Webview|Click "Confirm"]
+[Webview] -> [WelcomePanel|initializeProject message]
+[WelcomePanel] -> [WelcomePanel|Get list of missing folders]
+
+[WelcomePanel] -> [<frame>For each missing folder]
+[<frame>For each missing folder] -> [FileSystem|createDirectory(folderUri)]
+[FileSystem] -> [WelcomePanel|success/error]
+[WelcomePanel] -> [Webview|progress update]
+
+[WelcomePanel] -> [WelcomePanel|Verify all folders created]
+[WelcomePanel] -> [Webview|initialization complete]
+[WelcomePanel] -> [ForgeStudio|Open Studio]
+[ForgeStudio] -> [User|Dashboard loads]
 ```
 
 ### Implementation
```

### Feature: spec-editing
File: ai/features/studio/specs/spec-editing.feature.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/features/studio/specs/spec-editing.feature.md b/ai/features/studio/specs/spec-editing.feature.md
index 89e2fd8..cf1fec8 100644
--- a/ai/features/studio/specs/spec-editing.feature.md
+++ b/ai/features/studio/specs/spec-editing.feature.md
@@ -64,14 +64,14 @@ Feature: Spec Content Editing
     And I should be able to edit the Notes section
     And I should be able to add new sections if needed
 
-  Scenario: Edit Mermaid diagrams
+  Scenario: Edit Nomnoml diagrams
     Given I am editing a spec
-    When I want to modify Mermaid diagrams
+    When I want to modify Nomnoml diagrams
     Then I should be able to edit existing diagrams
     And I should be able to add new diagrams
     And I should be able to delete diagrams
-    And I should see syntax highlighting for Mermaid
-    And I should be able to validate Mermaid syntax
+    And I should see syntax highlighting for Nomnoml
+    And I should be able to validate Nomnoml syntax
     And I should see a preview of the rendered diagram
 
   Scenario: Use markdown formatting
```

### Feature: spec-detail-view
File: ai/features/studio/specs/spec-detail-view.feature.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/features/studio/specs/spec-detail-view.feature.md b/ai/features/studio/specs/spec-detail-view.feature.md
index 827d765..1854a60 100644
--- a/ai/features/studio/specs/spec-detail-view.feature.md
+++ b/ai/features/studio/specs/spec-detail-view.feature.md
@@ -24,7 +24,7 @@ Feature: View Spec Details
     And I should see the linked feature IDs
     And I should see the linked model IDs
     And I should see the linked context IDs
-    And I should see the Mermaid diagrams
+    And I should see the Nomnoml diagrams
     And I should see the implementation details
     And I should see any additional notes or documentation
 
@@ -57,7 +57,7 @@ Feature: Spec Detail Actions
     When I want to edit the spec
     Then I should be able to click "Edit" button
     And I should be able to modify spec fields
-    And I should be able to edit Mermaid diagrams
+    And I should be able to edit Nomnoml diagrams
     And I should be able to edit implementation details
     And I should be able to save changes
     And I should see a success message
```

### Feature: spec-creation
File: ai/features/studio/specs/spec-creation.feature.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/features/studio/specs/spec-creation.feature.md b/ai/features/studio/specs/spec-creation.feature.md
index fad5029..fe672d9 100644
--- a/ai/features/studio/specs/spec-creation.feature.md
+++ b/ai/features/studio/specs/spec-creation.feature.md
@@ -97,20 +97,20 @@ Feature: Spec Template
     Then it should have proper frontmatter with spec_id, feature_id, model_id, context_id
     And it should have template content with sections for:
       - Overview
-      - Architecture (with Mermaid diagrams)
+      - Architecture (with Nomnoml diagrams)
       - Implementation Details
       - Notes
     And the template should include helpful placeholder text
     And I should be able to edit all sections
 
-  Scenario: Mermaid diagram template
+  Scenario: Nomnoml diagram template
     Given I am creating a new spec
     When the spec template is applied
-    Then it should include a Mermaid diagram template with:
-      - Basic graph structure
+    Then it should include a Nomnoml diagram template with:
+      - Basic structure
       - Placeholder components
       - Example relationships
-    And the Mermaid should be in proper code blocks
+    And the Nomnoml should be in proper code blocks
     And I should be able to edit the diagram
-    And I should see syntax highlighting for Mermaid
+    And I should see syntax highlighting for Nomnoml
 ```
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

**Create Stories** (*.story.md) in ai/tickets/migrate-from-mermaid-to-nomnoml/ for:
- Code changes and implementations
- New features or feature modifications
- Technical debt improvements
- Refactoring work

**Create Tasks** (*.task.md) in ai/tickets/migrate-from-mermaid-to-nomnoml/ for:
- Manual configuration in external systems
- Documentation updates outside code
- Third-party service setup
- Manual testing or verification steps

**Critical Requirements:**

1. **Keep Stories MINIMAL** - Each story should take < 30 minutes to implement
2. **Break Down Large Changes** - If a change is complex, create multiple small stories
3. **Use Proper Linkages** - Link stories/tasks to feature_id, spec_id, and model_id from changed files
4. **Link to Session** - ALL stories and tasks MUST include session_id: "migrate-from-mermaid-to-nomnoml" in their frontmatter
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
- ALL stories and tasks link back to session_id: "migrate-from-mermaid-to-nomnoml"

Now create all the story and task files in ai/tickets/migrate-from-mermaid-to-nomnoml/ following the schemas and requirements above.
