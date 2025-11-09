# Create Stories and Tasks for Session: project-init

This command will analyze the design session and create Stories (for code changes) and Tasks (for non-code work) based on the session's changed files and goals.

---

STEP 1: Call the get_forge_about MCP tool to understand the Forge workflow and distillation principles.

STEP 2: Retrieve the required schemas:
- get_forge_schema with schema_type "story"
- get_forge_schema with schema_type "task"

STEP 3: Review the design session:

**Session File**: /Users/derrick/Documents/Code/Alto9/oss/cursor-context-engineering/ai/sessions/project-init.session.md
**Session ID**: project-init

**Session Content**:
```markdown
---
session_id: project-init
start_time: '2025-10-31T13:35:24.161Z'
end_time: '2025-11-02T21:47:37.831Z'
status: completed
problem_statement: project-init
changed_files:
  - ai/models/forge-schemas/context.model.md
  - ai/contexts/foundation/local-development.context.md
  - ai/contexts/foundation/build-procedures.context.md
  - ai/features/studio/dashboard/overview.feature.md
  - ai/features/studio/welcome/welcome-screen.feature.md
  - ai/specs/studio/welcome-initialization.spec.md
  - ai/specs/studio/forge-studio-implementation.spec.md
start_commit: 4f18aa6ad7331fcca2c17c98ca5fd81c2123c92f
---
## Problem Statement

project-init

## Goals

Make onboarding super simple by having a welcome screen walk the user through folder creation before attmepting to open the Forge Studio.

## Approach

Check if all the required folders exist on load and if they don't all exist, consider the project 'not ready' and show a welcome screen with an option on it to Configure the project.

## Key Decisions

None

## Notes

None

```

**Changed Files During Session** (7 files):

### Model: context
File: ai/models/forge-schemas/context.model.md

**Git Diff** (changes since session start (4f18aa6)):
```diff
diff --git a/ai/models/forge-schemas/context.model.md b/ai/models/forge-schemas/context.model.md
index 32f555c..9fb836f 100644
--- a/ai/models/forge-schemas/context.model.md
+++ b/ai/models/forge-schemas/context.model.md
@@ -1,32 +1,137 @@
 ---
 model_id: context
-type: ''
+name: Context Model
+type: guidance
+description: Data structure for context guidance files in Forge
 related_models: []
 ---
-Required frontmatter:
+
+# Context Model
+
+## Properties
+
+| Property | Type | Required | Description |
+|----------|------|----------|-------------|
+| context_id | string | Yes | Unique identifier (kebab-case, must match filename) |
+| category | string | Yes | Category: technical, business, process, tool |
+| name | string | No | Optional human-readable name |
+| description | string | No | Optional brief description |
+| instructions | string | No | Markdown content providing context and guidance |
+| background | array | No | Shared Gherkin steps for all scenarios |
+| rules | array | No | Business rules containing Example scenarios |
+| scenarios | array | No | Standalone Gherkin scenarios |
+
+## File Format
+
+Context files are stored in `ai/contexts/` with naming convention: `{context-id}.context.md`
+
+### Frontmatter Properties
+
+```yaml
+---
+context_id: kebab-case-id  # Must match filename without .context.md
+category: technical  # technical, business, process, tool
+name: Optional Name  # Optional human-readable name
+description: Optional Description  # Optional brief description
+---
+```
+
+### Content Structure
+
+Context files consist of two main sections:
+
+1. **Instructions Section** (Markdown)
+   - Free-form markdown content
+   - Provides context and guidance
+   - Can include headings, lists, links, code blocks, etc.
+
+2. **Gherkin Section** (Code blocks)
+   - Full Gherkin support with Background, Rules, and Scenarios
+   - Wrapped in \`\`\`gherkin code blocks
+
+## Gherkin Structure
+
+### Background
+Background contains Gherkin steps that provide shared context for all scenarios:
+
+```gherkin
+Background:
+  Given shared context step
+  And another shared step
 ```
-context_id: kebab-string
-name: string
-description: string
+
+### Rules
+Rules are business rules that contain Example scenarios:
+
+```gherkin
+Rule: Rule Title
+  Example: Example scenario
+    Given a precondition
+    When an action occurs
+    Then an expectation is met
 ```
 
-# context-name
+### Scenarios
+Standalone scenarios that are not nested within Rules:
 
 ```gherkin
-Feature: feature-name
+Scenario: Scenario name
+  Given a precondition
+  When an action occurs
+  Then an expectation is met
+  And they observe a secondary expectation
+```
+
+## Example File Structure
+
+```markdown
+---
+context_id: typescript-guidance
+category: technical
+name: TypeScript Guidance
+description: Best practices for TypeScript development
+---
+
+# TypeScript Guidance
 
-Rule: <rule text>
+## Instructions
 
-<tab>Scenario: <scenario name>
-  Given <scenario details>
-  When <actor perform action>
-  Then <actor observe expectation>
-  And they <actor observe secondary expectation>
+This context provides guidance for TypeScript development in the project.
 
-<tab>Scenario: <scenario name>
-  Given <scenario details>
-  When <actor perform action>
-  Then <actor observe expectation>
-  And they <actor observe secondary expectation>
+Key principles:
+- Use strict mode
+- Prefer interfaces over types for object shapes
+- Use readonly for immutable data
+
+## Gherkin Scenarios
+
+```gherkin
+Background:
+  Given we are writing TypeScript code
+
+Rule: Type Safety
+  Example: Using strict types
+    Given a function parameter needs typing
+    When implementing the function
+    Then use explicit type annotations
+    And avoid using 'any' type
+
+Scenario: Using interfaces
+  Given we need to define an object shape
+  When creating the type definition
+  Then use an interface instead of a type alias
 ```
+```
+
+## Relationships
+
+- **Many-to-Many**: Context → Specs (referenced by spec_id)
+- **Many-to-Many**: Context → Stories (referenced by story_id)
+- **Many-to-Many**: Context → Features (referenced by feature_id)
+
+## Validation Rules
 
+1. **context_id**: Must be unique across all contexts
+2. **category**: Must be one of: technical, business, process, tool
+3. **Gherkin**: All gherkin blocks must be valid Gherkin syntax
+4. **Instructions**: Markdown content is optional but recommended
```

### Context: local-development
File: ai/contexts/foundation/local-development.context.md

**Git Diff** (changes since session start (4f18aa6)):
```diff
diff --git a/ai/contexts/foundation/local-development.context.md b/ai/contexts/foundation/local-development.context.md
new file mode 100644
index 0000000..2b17cf6
--- /dev/null
+++ b/ai/contexts/foundation/local-development.context.md
@@ -0,0 +1,273 @@
+---
+context_id: local-development
+category: foundation
+name: Local Development Procedures
+description: Comprehensive guide for local development of the Forge monorepo
+---
+
+# Local Development Procedures
+
+## When to Use This Context
+
+Use this context when:
+- Setting up the Forge development environment
+- Understanding the build process
+- Working with individual packages
+- Troubleshooting development issues
+- Contributing to Forge
+
+## Prerequisites
+
+```gherkin
+Scenario: Verify development prerequisites
+  Given you want to develop Forge locally
+  When checking system requirements
+  Then ensure Node.js 22.14.0+ is installed
+  And ensure npm 10.0.0+ is installed
+  And ensure Git is installed
+  And ensure VSCode is installed (for extension development)
+
+Scenario: Verify Node.js version
+  Given you have Node.js installed
+  When checking the version
+  Then verify it is 22.14.0 or higher
+  And use .nvmrc file if using nvm: `nvm use`
+```
+
+## Initial Setup
+
+```gherkin
+Scenario: Initial project setup
+  Given you have cloned the repository
+  When setting up the development environment
+  Then run `npm install` from the root directory
+  And this installs dependencies for all workspaces
+  And run `npm run build` to build all packages
+  And verify build artifacts are created in dist/ directories
+
+Scenario: Workspace installation
+  Given you are in the monorepo root
+  When running npm install
+  Then npm workspaces automatically links packages
+  And shared dev dependencies are installed at root
+  And package-specific dependencies are installed in each package
+```
+
+## Build Procedures
+
+### Building All Packages
+
+```gherkin
+Scenario: Build all packages
+  Given you are in the monorepo root
+  When building all packages
+  Then run `npm run build`
+  And this builds both vscode-extension and mcp-server
+  And build artifacts are created in each package's dist/ directory
+
+Scenario: Build specific package
+  Given you want to build a single package
+  When building the vscode extension
+  Then run `npm run build -w forge`
+  And this builds only the vscode extension
+  When building the MCP server
+  Then run `npm run build -w @forge/mcp-server`
+  And this builds only the MCP server
+```
+
+### Watch Mode Development
+
+```gherkin
+Scenario: Watch mode for vscode extension
+  Given you are developing the vscode extension
+  When you want automatic rebuilds on changes
+  Then run `npm run watch -w forge`
+  And this watches both TypeScript and webview changes
+  And rebuilds automatically when files change
+  And use F5 in VSCode to launch Extension Development Host
+
+Scenario: Watch mode for MCP server
+  Given you are developing the MCP server
+  When you want automatic rebuilds on changes
+  Then run `npm run dev -w @forge/mcp-server`
+  And this uses tsx watch mode for auto-reload
+  And changes are reflected immediately
+```
+
+## Package-Specific Development
+
+### VSCode Extension Development
+
+```gherkin
+Scenario: Build vscode extension
+  Given you are developing the vscode extension
+  When building the extension
+  Then webpack bundles the main extension code
+  And esbuild bundles the React webview code
+  And both outputs are in dist/ and media/studio/ directories
+  And the extension entry point is dist/extension.js
+
+Scenario: Test vscode extension
+  Given you have built the extension
+  When testing the extension
+  Then open packages/vscode-extension in VSCode
+  And press F5 to launch Extension Development Host
+  And test commands in the new window
+  And verify Forge Studio opens correctly
+  And verify file operations work as expected
+
+Scenario: Package vscode extension
+  Given you have a completed extension
+  When packaging for distribution
+  Then run `npm run vscode:package` from root
+  And this runs production build with webpack
+  And builds webview with esbuild (minified)
+  And creates .vsix file using @vscode/vsce
+  And the output is forge-0.1.0.vsix
+
+Scenario: Install extension locally
+  Given you have packaged the extension
+  When installing locally
+  Then run `code --install-extension packages/vscode-extension/forge-0.1.0.vsix`
+  And restart VSCode to activate the extension
+  And verify commands are available in Command Palette
+```
+
+### MCP Server Development
+
+```gherkin
+Scenario: Build MCP server
+  Given you are developing the MCP server
+  When building the server
+  Then TypeScript compiles src/ to dist/
+  And uses ES modules (type: "module")
+  And makes dist/index.js executable (chmod +x)
+  And dependencies are resolved from node_modules at runtime
+
+Scenario: Run MCP server directly
+  Given you have built the MCP server
+  When running the server directly
+  Then execute `node packages/mcp-server/dist/index.js`
+  And the server starts with stdio transport
+  And responds to MCP tool calls via stdin/stdout
+
+Scenario: Development mode with auto-reload
+  Given you are actively developing the MCP server
+  When you want automatic reloads
+  Then run `npm run dev -w @forge/mcp-server`
+  And tsx watches for file changes
+  And automatically restarts the server on changes
+  And you can test changes immediately
+```
+
+## Testing
+
+```gherkin
+Scenario: Run linting
+  Given you want to check code quality
+  When running linting
+  Then run `npm run lint` from root (lints all packages)
+  Or run `npm run lint -w <package>` for specific package
+  And ESLint checks TypeScript and React code
+  And fixes are suggested where applicable
+
+Scenario: Run tests
+  Given you have test files
+  When running tests
+  Then run `npm test -w forge` for extension tests
+  And vitest runs unit tests
+  And verify all tests pass before committing
+```
+
+## Cleanup
+
+```gherkin
+Scenario: Clean build artifacts
+  Given you want to clean build outputs
+  When cleaning artifacts
+  Then run `npm run clean` from root
+  And this removes dist/ directories
+  And removes node_modules (optional)
+  And prepares for fresh build
+```
+
+## Troubleshooting
+
+### Common Issues
+
+```gherkin
+Scenario: Workspace not found error
+  Given you see workspace errors
+  When troubleshooting
+  Then verify you are in the repository root
+  And verify package.json has "workspaces": ["packages/*"]
+  And run `npm install` to refresh workspace links
+
+Scenario: TypeScript compilation errors
+  Given you see TypeScript errors
+  When troubleshooting
+  Then verify Node types match (@types/node@^22.14.0)
+  And run `npm install` to update dependencies
+  And verify TypeScript version is ^5.0.0
+  And check tsconfig.json is correct
+
+Scenario: Extension won't load
+  Given the extension fails to load
+  When troubleshooting
+  Then verify webpack build completed successfully
+  And verify webview build completed successfully
+  And check that dist/extension.js exists
+  And verify media/studio/main.js exists
+  And check VSCode Developer Console for errors
+
+Scenario: MCP server not found
+  Given MCP server can't be found
+  When troubleshooting
+  Then verify build completed: `npm run build -w @forge/mcp-server`
+  And verify dist/index.js exists
+  And verify execute permissions: `chmod +x packages/mcp-server/dist/index.js`
+  And check absolute path in MCP configuration
+```
+
+## Best Practices
+
+### Development Workflow
+
+1. **Always build before testing**: Run `npm run build` after pulling changes
+2. **Use watch mode**: Use `npm run watch` for active development
+3. **Test in Extension Host**: Use F5 to test extension in isolated environment
+4. **Lint before committing**: Run `npm run lint` to catch issues early
+5. **Clean before builds**: Run `npm run clean` if experiencing strange build issues
+
+### Code Organization
+
+- **Package structure**: Each package is self-contained with its own dependencies
+- **Shared dependencies**: Common dev dependencies at root level
+- **TypeScript**: All packages use TypeScript with strict mode
+- **ES modules**: MCP server uses ES modules, extension uses CommonJS
+
+### Version Management
+
+- Both packages share version number (0.1.0)
+- Update version in all package.json files when releasing
+- Update CHANGELOG.md with changes
+- Build and package both before release
+
+## File Structure
+
+```
+forge-monorepo/
+├── packages/
+│   ├── vscode-extension/     # VSCode Extension
+│   │   ├── src/              # TypeScript source
+│   │   ├── dist/             # Compiled extension (webpack)
+│   │   ├── media/studio/     # Webview bundle (esbuild)
+│   │   └── package.json
+│   └── mcp-server/          # MCP Server
+│       ├── src/              # TypeScript source
+│       ├── dist/             # Compiled JavaScript
+│       └── package.json
+├── package.json             # Root workspace config
+└── .nvmrc                   # Node version (22.14.0)
+```
+
```

### Context: build-procedures
File: ai/contexts/foundation/build-procedures.context.md

**Git Diff** (changes since session start (4f18aa6)):
```diff
diff --git a/ai/contexts/foundation/build-procedures.context.md b/ai/contexts/foundation/build-procedures.context.md
new file mode 100644
index 0000000..ec3534e
--- /dev/null
+++ b/ai/contexts/foundation/build-procedures.context.md
@@ -0,0 +1,252 @@
+---
+context_id: build-procedures
+category: foundation
+name: Build Procedures and Packaging
+description: Comprehensive guide for building and packaging Forge packages
+---
+
+# Build Procedures and Packaging
+
+## When to Use This Context
+
+Use this context when:
+- Building Forge packages for distribution
+- Understanding the build process
+- Packaging extensions for installation
+- Troubleshooting build issues
+- Preparing releases
+
+## Build Architecture
+
+```gherkin
+Scenario: Understand build architecture
+  Given you need to build Forge packages
+  When understanding the build process
+  Then vscode-extension uses webpack for bundling
+  And vscode-extension uses esbuild for webview
+  And mcp-server uses TypeScript compiler
+  And each package has independent build configuration
+
+Scenario: Build output locations
+  Given you run a build
+  When checking build outputs
+  Then vscode-extension dist/ contains bundled extension.js
+  And vscode-extension media/studio/ contains webview bundle
+  And mcp-server dist/ contains compiled JavaScript
+  And all outputs are optimized for production
+```
+
+## VSCode Extension Build Process
+
+### Build Steps
+
+```gherkin
+Scenario: Build vscode extension
+  Given you are building the extension
+  When running the build process
+  Then webpack compiles TypeScript to JavaScript
+  And webpack bundles all dependencies into dist/extension.js
+  And esbuild bundles React webview to media/studio/main.js
+  And both outputs are optimized and minified
+  And source maps are generated for debugging
+
+Scenario: Production build
+  Given you are creating a production build
+  When packaging the extension
+  Then webpack runs in production mode
+  And esbuild minifies the webview bundle
+  And source maps are hidden (hidden-source-map)
+  And all dependencies are bundled
+  And output size is minimized
+```
+
+### Build Configuration
+
+- **Main Extension**: Webpack with ts-loader
+- **Webview**: esbuild with React bundling
+- **Output**: `dist/extension.js` (main), `media/studio/main.js` (webview)
+- **Source Maps**: Generated for debugging
+- **Dependencies**: All bundled (no node_modules needed)
+
+### Packaging Process
+
+```gherkin
+Scenario: Package extension for distribution
+  Given you have built the extension
+  When packaging for distribution
+  Then run `npm run vscode:package` from root
+  And this executes production webpack build
+  And builds webview with esbuild (minified)
+  And runs @vscode/vsce package command
+  And creates forge-0.1.0.vsix file
+  And bundles are optimized for size
+
+Scenario: Verify package contents
+  Given you have created a .vsix file
+  When verifying package contents
+  Then verify dist/extension.js is included
+  And verify media/studio/main.js is included
+  And verify package.json metadata is correct
+  And verify no node_modules are included
+  And verify all dependencies are bundled
+```
+
+## MCP Server Build Process
+
+### Build Steps
+
+```gherkin
+Scenario: Build MCP server
+  Given you are building the MCP server
+  When running the build process
+  Then TypeScript compiler compiles src/ to dist/
+  And uses ES modules (type: "module")
+  And preserves directory structure
+  And generates .d.ts type definitions
+  And makes dist/index.js executable
+
+Scenario: Development vs production build
+  Given you are building the server
+  When in development mode
+  Then tsx watch mode auto-reloads on changes
+  When in production mode
+  Then TypeScript compiles to optimized JavaScript
+  And no source maps needed (runtime dependencies)
+```
+
+### Build Configuration
+
+- **Compiler**: TypeScript (tsc)
+- **Module System**: ES modules (`"type": "module"`)
+- **Output**: `dist/index.js` (executable)
+- **Dependencies**: Resolved from node_modules at runtime
+- **Executable**: `chmod +x` applied automatically
+
+## Build Commands Reference
+
+### Root Level Commands
+
+```bash
+# Build all packages
+npm run build
+
+# Watch all packages (if supported)
+npm run watch
+
+# Lint all packages
+npm run lint
+
+# Clean all build artifacts
+npm run clean
+
+# Package vscode extension
+npm run vscode:package
+```
+
+### Package-Specific Commands
+
+```bash
+# VSCode Extension
+npm run build -w forge              # Build extension
+npm run watch -w forge              # Watch mode
+npm run lint -w forge               # Lint
+npm run clean -w forge              # Clean
+
+# MCP Server
+npm run build -w @forge/mcp-server # Build server
+npm run dev -w @forge/mcp-server   # Dev mode (tsx watch)
+npm run lint -w @forge/mcp-server  # Lint
+npm run clean -w @forge/mcp-server # Clean
+```
+
+## Build Optimization
+
+```gherkin
+Scenario: Optimize build size
+  Given you want to minimize bundle size
+  When building the extension
+  Then webpack tree-shakes unused code
+  And esbuild minifies the webview bundle
+  And dependencies are bundled efficiently
+  And source maps are excluded from production
+
+Scenario: Optimize build speed
+  Given you want faster builds
+  When developing locally
+  Then use watch mode for incremental builds
+  And use tsx for MCP server (faster than tsc)
+  And cache node_modules between builds
+  And only build packages you're modifying
+```
+
+## Troubleshooting Build Issues
+
+```gherkin
+Scenario: Build fails with module errors
+  Given build fails with module errors
+  When troubleshooting
+  Then verify all dependencies are installed: `npm install`
+  And check workspace links are correct
+  And verify package.json dependencies match
+  And try cleaning and rebuilding: `npm run clean && npm run build`
+
+Scenario: Webview bundle not updating
+  Given webview changes aren't reflected
+  When troubleshooting
+  Then verify esbuild build completed
+  And check media/studio/main.js was updated
+  And verify webview cache is cleared
+  And reload webview panel in VSCode
+
+Scenario: Extension bundle too large
+  Given extension bundle is too large
+  When optimizing
+  Then check webpack bundle analyzer
+  And verify unused dependencies are removed
+  And check for duplicate dependencies
+  And use production mode builds
+```
+
+## Release Process
+
+```gherkin
+Scenario: Prepare release build
+  Given you are preparing a release
+  When building for release
+  Then update version in all package.json files
+  Then run `npm run build` to build all packages
+  Then run `npm run vscode:package` to create .vsix
+  Then verify build artifacts are correct
+  Then test extension installation
+  Then test MCP server functionality
+  Then update CHANGELOG.md
+```
+
+## Best Practices
+
+### Build Quality
+
+1. **Always test builds**: Verify builds work before committing
+2. **Use production mode**: Test production builds before release
+3. **Verify bundle sizes**: Check bundle sizes haven't grown unexpectedly
+4. **Test installation**: Install .vsix locally to verify packaging
+5. **Check dependencies**: Ensure all dependencies are correctly bundled
+
+### Development Efficiency
+
+1. **Use watch mode**: For active development, use watch mode
+2. **Incremental builds**: Only rebuild what changed
+3. **Fast feedback**: Use tsx for MCP server development
+4. **Isolated testing**: Test extension in Extension Development Host
+
+### Release Checklist
+
+- [ ] Update version numbers
+- [ ] Build all packages successfully
+- [ ] Create .vsix package
+- [ ] Test extension installation
+- [ ] Test MCP server functionality
+- [ ] Update CHANGELOG.md
+- [ ] Verify all documentation is accurate
+- [ ] Tag release in Git
+
```

### Feature: studio-dashboard
File: ai/features/studio/dashboard/overview.feature.md

**Git Diff** (changes since session start (4f18aa6)):
```diff

diff --git a/ai/features/studio/dashboard/overview.feature.md b/ai/features/studio/dashboard/overview.feature.md
index 42f5279..c17c0ae 100644
--- a/ai/features/studio/dashboard/overview.feature.md
+++ b/ai/features/studio/dashboard/overview.feature.md
@@ -171,22 +171,50 @@ Feature: Open Forge Studio
     When I open the command palette (Cmd/Ctrl+Shift+P)
     And I type "Forge: Open Forge Studio"
     And I press Enter
-    Then Forge Studio should open in a new webview panel
-    And I should be prompted to select a project if multiple workspaces exist
-    And the dashboard should load with current project data
+    Then I should be prompted to select a project if multiple workspaces exist
+    And if the project is Forge-ready, Studio should open directly
+    And if the project is not Forge-ready, the welcome screen should appear
 
-  Scenario: Open Studio with single workspace
+  Scenario: Open Studio with single Forge-ready workspace
     Given I have one workspace open in VSCode
+    And the workspace has the required ai/ folder structure
     When I execute "Forge: Open Forge Studio"
     Then Studio should open immediately without prompting
     And it should use the current workspace as the project
     And the dashboard should display
+    And the left sidebar should collapse
 
-  Scenario: Open Studio with multiple workspaces
+  Scenario: Open Studio with single non-ready workspace
+    Given I have one workspace open in VSCode
+    And the workspace does not have the required ai/ folder structure
+    When I execute "Forge: Open Forge Studio"
+    Then the welcome screen should appear
+    And I should see the project readiness status
+    And I should see options to initialize the project
+    And the left sidebar should collapse
+
+  Scenario: Open Studio with multiple workspaces - show all projects
     Given I have multiple workspace folders open
+    And some folders have ai/ directories and some do not
     When I execute "Forge: Open Forge Studio"
     Then I should see a quick pick menu
-    And I should see all workspace folders listed
-    And I should be able to select the project to use
-    And Studio should open with the selected project
+    And I should see ALL workspace folders listed
+    And I should see which projects are Forge-ready
+    And I should see which projects are not yet initialized
+    And I should be able to select any project
+
+  Scenario: Select Forge-ready project from multi-root workspace
+    Given I have multiple workspace folders open
+    When I execute "Forge: Open Forge Studio"
+    And I select a project that has the required folder structure
+    Then Forge Studio should open directly
+    And the dashboard should load with the selected project data
+
+  Scenario: Select non-ready project from multi-root workspace
+    Given I have multiple workspace folders open
+    When I execute "Forge: Open Forge Studio"
+    And I select a project that lacks the required folder structure
+    Then the welcome screen should appear
+    And I should see the project path
+    And I should see initialization options
 ```

```

### Feature: welcome-screen
File: ai/features/studio/welcome/welcome-screen.feature.md

**Git Status:** New file (not previously tracked)

### Spec: welcome-initialization
File: ai/specs/studio/welcome-initialization.spec.md

**Git Status:** New file (not previously tracked)

### Spec: forge-studio-implementation
File: ai/specs/studio/forge-studio-implementation.spec.md

**Git Diff** (changes since session start (4f18aa6)):
```diff

diff --git a/ai/specs/studio/forge-studio-implementation.spec.md b/ai/specs/studio/forge-studio-implementation.spec.md
index 0baf70c..02a852a 100644
--- a/ai/specs/studio/forge-studio-implementation.spec.md
+++ b/ai/specs/studio/forge-studio-implementation.spec.md
@@ -15,18 +15,39 @@ Forge Studio is a React-based webview application embedded in VSCode that provid
 
 ## Architecture
 
+### High-Level Flow
+
+```mermaid
+graph TD
+    A[User: Forge Open Studio] -->|Command| B[extension.ts]
+    B --> C[ProjectPicker.pickProject]
+    C --> D{Check Project Readiness}
+    D -->|Not Ready| E[WelcomePanel]
+    D -->|Ready| F[ForgeStudioPanel]
+    E -->|Initialize| G[Create Folders]
+    G -->|Success| F
+    E -->|Manual Open| F
+    F --> H[Dashboard/Sessions/Files]
+```
+
 ### Components
 
 ```mermaid
 graph TD
     A[VSCode Extension Host] -->|WebviewPanel| B[ForgeStudioPanel.ts]
+    A -->|WebviewPanel| B2[WelcomePanel.ts]
     B -->|HTML + React| C[Webview UI - index.tsx]
+    B2 -->|HTML + React| C2[Welcome UI - welcome/index.tsx]
     C -->|postMessage| B
     B -->|postMessage| C
+    C2 -->|postMessage| B2
+    B2 -->|postMessage| C2
     B -->|File System| D[ai/ directory]
+    B2 -->|File System| D
     B -->|FileParser| E[File I/O]
     B -->|PromptGenerator| F[Prompt Generation]
     C -->|Components| G[Dashboard, Sessions, BrowserPage, SessionPanel]
+    C2 -->|Components| G2[StatusIndicator, FolderChecklist, ActionButtons]
 ```
 
 ### Extension Host (ForgeStudioPanel.ts)
@@ -121,6 +142,79 @@ Communication between webview and extension uses `postMessage` with typed messag
 | `fileCreated` | `{ success: boolean }` | File creation result |
 | `structureChanged` | - | Trigger UI refresh |
 
+## Project Entry Point and Welcome Screen
+
+### Entry Flow
+
+When a user executes the `Forge: Open Forge Studio` command:
+
+1. **Project Selection** (via `ProjectPicker.pickProject()`)
+   - Single workspace: Uses that workspace automatically
+   - Multi-root workspace: Shows quick pick with ALL workspace folders (not just ones with ai/)
+   - Each folder shown with indication of whether it's "Forge Ready"
+
+2. **Project Readiness Check**
+   - Checks if all required folders exist:
+     - `ai/`
+     - `ai/actors`
+     - `ai/contexts`
+     - `ai/features`
+     - `ai/models`
+     - `ai/sessions`
+     - `ai/specs`
+
+3. **Panel Decision**
+   - If project is **Forge Ready**: Open `ForgeStudioPanel` directly
+   - If project is **Not Ready**: Open `WelcomePanel` first
+
+### Welcome Screen (WelcomePanel)
+
+The Welcome Screen is a separate webview panel that appears for non-ready projects.
+
+**Purpose**:
+- Show project readiness status
+- Display checklist of required vs missing folders
+- Provide one-click initialization
+- Automatically transition to Studio after setup
+
+**Key Features**:
+- **Status Indicator**: Visual ready/not-ready status with color coding
+- **Folder Checklist**: Shows all 7 required folders with exist/missing indicators
+- **Initialization Button**: "Initialize Forge Project" for non-ready projects
+- **Studio Button**: "Open Forge Studio" for ready projects
+- **Confirmation Dialog**: Shows which folders will be created before initialization
+
+**Initialization Process**:
+1. User clicks "Initialize Forge Project"
+2. Confirmation dialog shows list of folders to be created
+3. User confirms
+4. Extension creates each missing folder sequentially
+5. Progress updates shown in real-time
+6. On success, automatically opens ForgeStudioPanel
+7. On error, shows error message and remains on welcome screen
+
+**See Also**: `ai/specs/studio/welcome-initialization.spec.md` for detailed welcome screen implementation.
+
+### Multi-Root Workspace Behavior
+
+**Previous Behavior**:
+- Filtered workspace folders to only show ones with `ai/` directory
+- Precluded starting Forge in a new project without manual setup
+
+**New Behavior**:
+- Shows ALL workspace folders in quick pick
+- Indicates which are "Forge Ready" and which are not
+- Allows selection of any project
+- If non-ready project selected, shows welcome screen
+- Removes manual setup barrier
+
+### Sidebar Management
+
+Both WelcomePanel and ForgeStudioPanel collapse the left sidebar when opened:
+- Uses `vscode.commands.executeCommand('workbench.action.closeSidebar')`
+- Provides more screen space for the webview
+- Consistent with immersive panel experience
+
 ## Session Management
 
 ### Active Session Detection

```


**Note:** Git diffs show changes from session start commit (4f18aa6) to current state.

STEP 4: Review changed files and follow context guidance

For each changed file listed above:
1. Review the git diff (if available) to understand exactly what changed
2. If no git diff is available, read the file directly to understand its content
3. Identify any context_id references in the file's frontmatter
4. Read any referenced context files and execute their Gherkin scenarios (GIVEN/WHEN/THEN)

STEP 5: Analyze and break down into Stories and Tasks

Based on the session and the git diffs (or file contents) of changed files:

**IMPORTANT:** Use the git diffs shown above to understand EXACTLY what changed in each file. The diffs show:
- Lines that were added (prefixed with +)
- Lines that were removed (prefixed with -)
- Context around the changes
- Whether files are new, modified, or deleted

If git diffs are not available, read the files directly to understand their current state and determine what needs to be implemented.

This precise change information should guide your story creation - focus on implementing these specific changes.

**Create Stories** (*.story.md) in ai/tickets/project-init/ for:
- Code changes and implementations
- New features or feature modifications
- Technical debt improvements
- Refactoring work

**Create Tasks** (*.task.md) in ai/tickets/project-init/ for:
- Manual configuration in external systems
- Documentation updates outside code
- Third-party service setup
- Manual testing or verification steps

**Critical Requirements:**

1. **Keep Stories MINIMAL** - Each story should take < 30 minutes to implement
2. **Break Down Large Changes** - If a change is complex, create multiple small stories
3. **Use Proper Linkages** - Link stories/tasks to feature_id, spec_id, and model_id from changed files
4. **Link to Session** - ALL stories and tasks MUST include session_id: "project-init" in their frontmatter
5. **Be Specific** - Include exact file paths, clear objectives, and acceptance criteria
6. **Add Context** - Each story should have enough information to be implemented independently
7. **Order Matters** - Set dependencies and order stories logically
8. **Follow Schemas** - All files must adhere to schemas from Step 2

STEP 6: Verify completeness and create files

Ensure that:
- Every changed file is accounted for in at least one story or task
- All stories have clear acceptance criteria
- Dependencies between stories are identified
- The collection of stories fully implements the session goals
- Stories are small enough to be completed quickly
- ALL stories and tasks link back to session_id: "project-init"

Now create all the story and task files in ai/tickets/project-init/ following the schemas and requirements above.
