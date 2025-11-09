# Create Stories and Tasks for Session: organize-sessions-data

This command will analyze the design session and create Stories (for code changes) and Tasks (for non-code work) based on the session's changed files and goals.

---

STEP 1: Call the get_forge_about MCP tool to understand the Forge workflow and distillation principles.

STEP 2: Retrieve the required schemas:
- get_forge_schema with schema_type "story"
- get_forge_schema with schema_type "task"

STEP 3: Review the design session:

**Session File**: /Users/derrick/Documents/Code/Alto9/oss/cursor-context-engineering/ai/sessions/organize-sessions-data.session.md
**Session ID**: organize-sessions-data

**Session Content**:
```markdown
---
session_id: organize-sessions-data
start_time: '2025-11-08T23:36:00.296Z'
status: completed
problem_statement: Sessions do not provide enough visibility into the changes made within.
changed_files:
  - ai/features/studio/sessions/session-management.feature.md
  - ai/specs/extension/cursor-commands-management.spec.md
end_time: '2025-11-08T23:54:05.892Z'
---
## Problem Statement

Sessions do not provide enough visibility into the changes made within.

## Goals

Provide visibility into the specific files changed on the Session view in Forge Studio.

## Approach

Increase functionality of the sessions page by showing the exact files changed during the session. Also add paging functionality to the sessions view, and make sure they are sorted appropriately. The 'active session' view does not need to change. The sessions list could have a reduced list view, and an expanded focused view (if you click on it, you see the details of the session, including all session fields and changed files.

## Key Decisions

We also need to adjust the injected 'forge-build' cursor command file. I tried using it and it does not re-inforce the behavior. That command should absolutely prompt the agent to call the 'get_forge_about' mcp tool and it should be very aware to only edit files in the AI folder and it should be familiar with the concept of a Forge design session.

## Notes

None

```

**Changed Files During Session** (2 files):

### Feature: studio-sessions
File: ai/features/studio/sessions/session-management.feature.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/features/studio/sessions/session-management.feature.md b/ai/features/studio/sessions/session-management.feature.md
index 345e22f..1153217 100644
--- a/ai/features/studio/sessions/session-management.feature.md
+++ b/ai/features/studio/sessions/session-management.feature.md
@@ -26,6 +26,69 @@ Feature: Session Management in Studio
     And I should see session IDs, problem statements, and metadata
     And I should see file change counts for each session
 
+  Scenario: Sessions list view with pagination
+    Given I have more than 10 completed sessions
+    When I navigate to the Sessions section
+    Then I should see sessions in a paginated list
+    And the list should show 10 sessions per page by default
+    And I should see pagination controls (Previous, Next, Page Numbers)
+    And I should be able to navigate between pages
+    And the current page should be highlighted
+    And pagination state should be preserved when navigating away and back
+
+  Scenario: Sessions list sorting options
+    Given I have multiple sessions
+    When I view the Sessions list
+    Then I should see a sort dropdown with options:
+      | Sort By Start Time (Newest First) |
+      | Sort By Start Time (Oldest First) |
+      | Sort By Status |
+      | Sort By Session ID |
+    And the default sort should be "Newest First"
+    And when I change the sort option, the list should update immediately
+    And the sort preference should be preserved in the session
+
+  Scenario: Reduced list view for sessions
+    Given I am viewing the Sessions list
+    When I see a session in the list
+    Then each session should display in a compact card format with:
+      | Session ID |
+      | Problem Statement (truncated to 80 characters) |
+      | Status Badge (active/completed/awaiting_implementation) |
+      | Start Time |
+      | File Change Count |
+      | Command Status (if applicable) |
+    And the card should be clickable to view full details
+    And the card should have hover effects to indicate interactivity
+
+  Scenario: Expanded detail view for a session
+    Given I am viewing a session in the list
+    When I click on a session card
+    Then the view should expand to show full session details:
+      | Session ID |
+      | Full Problem Statement |
+      | Status |
+      | Start Time |
+      | End Time (if completed) |
+      | Goals (full content) |
+      | Approach (full content) |
+      | Key Decisions (full content) |
+      | Notes (full content) |
+      | Complete list of changed files with paths |
+      | Command file path (if created) |
+    And I should see a "Close Details" or collapse button
+    And clicking outside the detail view should collapse it back to list view
+
+  Scenario: View changed files in session detail
+    Given I have expanded a session's detail view
+    When I view the changed files section
+    Then I should see a complete list of all files changed during the session
+    And each file should display its full relative path from project root
+    And files should be grouped by type (features, specs, models, actors, contexts)
+    And each file type group should show a count
+    And I should be able to click on a file path to open that file
+    And if a file no longer exists, it should be indicated with a visual marker
+
   Scenario: Start a new session from Studio
     Given I do not have an active session
     When I navigate to the Sessions page
```

### Spec: cursor-commands-management
File: ai/specs/extension/cursor-commands-management.spec.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/specs/extension/cursor-commands-management.spec.md b/ai/specs/extension/cursor-commands-management.spec.md
index d4372b4..29a71e6 100644
--- a/ai/specs/extension/cursor-commands-management.spec.md
+++ b/ai/specs/extension/cursor-commands-management.spec.md
@@ -85,15 +85,17 @@ The AI will ensure you're in an active session and help structure your changes p
 
 ### forge-build.md
 
-**Purpose**: Guides AI agents when implementing stories from tickets.
+**Purpose**: Guides AI agents when working within Forge design sessions to update documentation.
 
 **Location**: `.cursor/commands/forge-build.md`
 
 **Responsibilities**:
-- Analyzes existing codebase
-- Reads AI documentation for context (features, specs, models)
-- Implements changes described in story
-- Ensures consistency between code and documentation
+- Calls `get_forge_about` MCP tool to understand Forge workflow
+- Ensures agent is working within an active design session
+- Only modifies files in the `ai/` folder (features, specs, models, actors, contexts)
+- Reads AI documentation for context
+- Tracks all changes in the active session's `changed_files` array
+- Ensures proper formatting (Gherkin in features, Mermaid in specs)
 
 **Template Content**:
 
@@ -108,22 +110,35 @@ You must provide a story file (*.story.md) when running this command.
 
 ## What This Command Does
 
-1. Analyzes the existing codebase to understand current implementation
-2. Reads the AI folder to understand intended behavior from linked files:
+1. **Calls MCP Tools**: Uses `get_forge_about` to understand the Forge workflow and session-driven approach
+2. **Analyzes the existing codebase**: Understands current implementation patterns and structure
+3. **Reads AI documentation**: Understands intended behavior from linked files:
    - Features (expected behavior)
    - Specs (technical implementation details)
    - Models (data structures)
    - Contexts (technology-specific guidance)
-3. Implements the changes described in the story
-4. Ensures implementation matches the documented design
+4. **Implements the changes**: Described in the story with proper testing
+5. **Ensures consistency**: Implementation matches the documented design
+
+## Important Constraints
+
+- **This is a Forge design session**: You are working within a structured design workflow
+- **Only modify AI documentation files**: Work exclusively within the `ai/` folder
+- **Do NOT modify implementation code**: This command is for updating features, specs, models, actors, and contexts only
+- **Track all changes**: Ensure changed files are tracked in the active session's `changed_files` array
+- **Use proper formats**: Features use Gherkin in code blocks, Specs use Mermaid diagrams
+- **Call MCP tools**: Always start by calling `get_forge_about` to understand the current Forge workflow
 
 ## Usage
 
 1. Select a story file from ai/tickets/
 2. Run this command
-3. The AI will analyze context and implement the story
+3. The AI will call `get_forge_about` MCP tool
+4. The AI will analyze AI documentation context
+5. The AI will update documentation in the ai/ folder
+6. All changes will be tracked in the active design session
 
-The implementation will be consistent with your documented design and existing codebase patterns.
+The documentation updates will be consistent with your existing design patterns and the Forge workflow.
 ```
 
 ## Template Storage
@@ -182,22 +197,35 @@ You must provide a story file (*.story.md) when running this command.
 
 ## What This Command Does
 
-1. Analyzes the existing codebase to understand current implementation
-2. Reads the AI folder to understand intended behavior from linked files:
+1. **Calls MCP Tools**: Uses \`get_forge_about\` to understand the Forge workflow and session-driven approach
+2. **Analyzes the existing codebase**: Understands current implementation patterns and structure
+3. **Reads AI documentation**: Understands intended behavior from linked files:
    - Features (expected behavior)
    - Specs (technical implementation details)
    - Models (data structures)
    - Contexts (technology-specific guidance)
-3. Implements the changes described in the story
-4. Ensures implementation matches the documented design
+4. **Implements the changes**: Described in the story with proper testing
+5. **Ensures consistency**: Implementation matches the documented design
+
+## Important Constraints
+
+- **This is a Forge design session**: You are working within a structured design workflow
+- **Only modify AI documentation files**: Work exclusively within the \`ai/\` folder
+- **Do NOT modify implementation code**: This command is for updating features, specs, models, actors, and contexts only
+- **Track all changes**: Ensure changed files are tracked in the active session's \`changed_files\` array
+- **Use proper formats**: Features use Gherkin in code blocks, Specs use Mermaid diagrams
+- **Call MCP tools**: Always start by calling \`get_forge_about\` to understand the current Forge workflow
 
 ## Usage
 
 1. Select a story file from ai/tickets/
 2. Run this command
-3. The AI will analyze context and implement the story
+3. The AI will call \`get_forge_about\` MCP tool
+4. The AI will analyze AI documentation context
+5. The AI will update documentation in the ai/ folder
+6. All changes will be tracked in the active design session
 
-The implementation will be consistent with your documented design and existing codebase patterns.`;
+The documentation updates will be consistent with your existing design patterns and the Forge workflow.`;
 
 /**
  * Map of command paths to their templates
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

**Create Stories** (*.story.md) in ai/tickets/organize-sessions-data/ for:
- Code changes and implementations
- New features or feature modifications
- Technical debt improvements
- Refactoring work

**Create Tasks** (*.task.md) in ai/tickets/organize-sessions-data/ for:
- Manual configuration in external systems
- Documentation updates outside code
- Third-party service setup
- Manual testing or verification steps

**Critical Requirements:**

1. **Keep Stories MINIMAL** - Each story should take < 30 minutes to implement
2. **Break Down Large Changes** - If a change is complex, create multiple small stories
3. **Use Proper Linkages** - Link stories/tasks to feature_id, spec_id, and model_id from changed files
4. **Link to Session** - ALL stories and tasks MUST include session_id: "organize-sessions-data" in their frontmatter
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
- ALL stories and tasks link back to session_id: "organize-sessions-data"

Now create all the story and task files in ai/tickets/organize-sessions-data/ following the schemas and requirements above.
