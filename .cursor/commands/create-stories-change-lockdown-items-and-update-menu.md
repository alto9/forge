# Create Stories and Tasks for Session: change-lockdown-items-and-update-menu

This command will analyze the design session and create Stories (for code changes) and Tasks (for non-code work) based on the session's changed files and goals.

---

STEP 1: Call the get_forge_about MCP tool to understand the Forge workflow and distillation principles.

STEP 2: Retrieve the required schemas:
- get_forge_schema with schema_type "story"
- get_forge_schema with schema_type "task"

STEP 3: Review the design session:

**Session File**: /Users/derrick/Documents/Code/Alto9/oss/forge/ai/sessions/change-lockdown-items-and-update-menu.session.md
**Session ID**: change-lockdown-items-and-update-menu

**Session Content**:
```markdown
---
session_id: change-lockdown-items-and-update-menu
start_time: '2025-11-09T16:18:35.402Z'
status: completed
problem_statement: change lockdown items and update menu
changed_files:
  - ai/features/studio/flexible-editing-permissions.feature.md
  - ai/features/studio/organized-menu-structure.feature.md
  - ai/specs/studio/editing-permissions-implementation.spec.md
  - ai/specs/studio/menu-structure-implementation.spec.md
  - ai/features/studio/actors/actor-editing.feature.md
  - ai/features/studio/contexts/context-editing.feature.md
  - ai/features/studio/forge-studio.feature.md
  - ai/features/studio/sessions/session-management.feature.md
  - ai/specs/studio/forge-studio-implementation.spec.md
  - ai/features/studio/navigation-menu.feature.md
  - ai/specs/studio/navigation-menu-implementation.spec.md
  - ai/features/studio/actors/actor-creation.feature.md
  - ai/features/studio/contexts/context-creation.feature.md
end_time: '2025-11-09T16:37:47.642Z'
---
## Problem Statement

change lockdown items and update menu

## Goals

permit develoeprs to update certain non feature-changing items outside of the context of a design session. This promotes developers defining these items initially and then generating features and specs within design sessions.

## Approach

allow editing of actors and contexts outside of a design session. they can be edited at all times. Features and specs are still locked behind a design session. Also update the menu on the left to show clear separation between 1 section that has Actors, Contexts, and Sessions, then a separate section with Features and Specifications.

## Key Decisions

1. **Foundational vs Design Files**: Actors and Contexts are classified as "foundational" files that developers define before starting design work. They provide vocabulary and guidance but are not design decisions themselves.

2. **Session Tracking Scope**: Only Features and Specs are tracked in session changed_files arrays. Actors and Contexts are explicitly excluded from session tracking to reinforce their foundational nature.

3. **File Watcher Pattern**: Updated file watcher pattern from `ai/**/*.{feature.md,spec.md,model.md,context.md,actor.md}` to only `ai/**/*.{feature.md,spec.md}` to match the new tracking policy.

4. **Menu Organization**: Two-section navigation menu:
   - "FOUNDATIONAL" section: Actors, Contexts, Sessions (always accessible)
   - "DESIGN" section: Features, Specs (requires active session)

5. **Visual Indicators**: Session-locked items (Features/Specs) show lock icons and disabled styling when no session is active, with helpful tooltips explaining the requirement.

6. **Session-Required View**: When users navigate to Features or Specs without a session, they see an explanatory view with a prominent "Start New Session" button rather than just disabled UI.

## Notes

### Changes Summary

**Updated Features:**
1. `actor-creation.feature.md` - Removed session requirement for creating actors
2. `actor-editing.feature.md` - Removed session requirement for editing actors
3. `context-creation.feature.md` - Removed session requirement for creating contexts
4. `context-editing.feature.md` - Removed session requirement for editing contexts
5. `forge-studio.feature.md` - Updated file management scenarios to distinguish between foundational and session-locked files
6. `session-management.feature.md` - Updated file tracking scenarios to only track Features and Specs
7. `navigation-menu.feature.md` - NEW: Complete feature definition for the two-section navigation menu

**Updated Specs:**
1. `forge-studio-implementation.spec.md` - Updated session-aware operations and file change tracking sections
2. `navigation-menu-implementation.spec.md` - NEW: Complete technical specification for navigation menu reorganization

### Implementation Impact

**Extension Host Changes Required:**
- Update file watcher pattern to only monitor `ai/**/*.{feature.md,spec.md}`
- Modify session-aware checks to allow Actor/Context operations without active session
- Update session file tracking logic to exclude Actor/Context changes

**Webview UI Changes Required:**
- Reorganize Sidebar component with two sections (Foundational and Design)
- Add session-dependent disabled state for Features and Specs navigation items
- Implement SessionRequiredView component for locked views
- Add lock icons and tooltips to navigation items
- Update BrowserPage components to check session requirements only for Features and Specs

**User Experience Benefits:**
- Clear visual communication of what requires sessions vs what doesn't
- Developers can set up foundational elements (Actors, Contexts) before starting design work
- Reduces friction for preparatory work while maintaining design discipline for actual feature work
- Better aligns with natural workflow: define vocabulary → start session → design features

### Migration Considerations

This is a breaking change in behavior but should be mostly positive:
- Existing Actor/Context files remain valid
- No data migration needed
- Users gain more flexibility, no features are removed
- Session files may have fewer tracked files going forward (only Features/Specs)



```

**Changed Files During Session** (13 files):

### flexible-editing-permissions.feature.md
File: ai/features/studio/flexible-editing-permissions.feature.md
(Could not read file: Error: ENOENT: no such file or directory, open '/Users/derrick/Documents/Code/Alto9/oss/forge/ai/features/studio/flexible-editing-permissions.feature.md')

### organized-menu-structure.feature.md
File: ai/features/studio/organized-menu-structure.feature.md
(Could not read file: Error: ENOENT: no such file or directory, open '/Users/derrick/Documents/Code/Alto9/oss/forge/ai/features/studio/organized-menu-structure.feature.md')

### editing-permissions-implementation.spec.md
File: ai/specs/studio/editing-permissions-implementation.spec.md
(Could not read file: Error: ENOENT: no such file or directory, open '/Users/derrick/Documents/Code/Alto9/oss/forge/ai/specs/studio/editing-permissions-implementation.spec.md')

### menu-structure-implementation.spec.md
File: ai/specs/studio/menu-structure-implementation.spec.md
(Could not read file: Error: ENOENT: no such file or directory, open '/Users/derrick/Documents/Code/Alto9/oss/forge/ai/specs/studio/menu-structure-implementation.spec.md')

### Feature: actor-editing
File: ai/features/studio/actors/actor-editing.feature.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/features/studio/actors/actor-editing.feature.md b/ai/features/studio/actors/actor-editing.feature.md
index 76560bd..59aab35 100644
--- a/ai/features/studio/actors/actor-editing.feature.md
+++ b/ai/features/studio/actors/actor-editing.feature.md
@@ -17,9 +17,8 @@ Feature: Edit Actor Information
   I want to edit existing actors
   So that I can keep actor information up to date
 
-  Scenario: Edit actor with active session
-    Given I have an active design session
-    And I am viewing an actor
+  Scenario: Edit actor at any time
+    Given I am viewing an actor
     When I want to edit the actor
     Then I should be able to click "Edit" button
     And I should be able to modify the actor ID
@@ -31,10 +30,19 @@ Feature: Edit Actor Information
 
   Scenario: Edit actor without active session
     Given I do not have an active session
-    When I try to edit an actor
-    Then I should see that editing is disabled
-    And I should see a message that an active session is required
-    And I should be able to start a session from this prompt
+    And I am viewing an actor
+    When I edit and save the actor
+    Then the changes should be saved successfully
+    And the actor file should be updated on disk
+    And I should not be prompted to start a session
+    
+  Scenario: Edit actor with active session
+    Given I have an active design session
+    And I am viewing an actor
+    When I edit and save the actor
+    Then the changes should be saved successfully
+    And the actor file should NOT be tracked in the session's changed_files
+    And actors are considered foundational and not session-tracked
 
   Scenario: Cancel editing
     Given I am editing an actor
```

### Feature: context-editing
File: ai/features/studio/contexts/context-editing.feature.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/features/studio/contexts/context-editing.feature.md b/ai/features/studio/contexts/context-editing.feature.md
index 4f3e405..3e883c1 100644
--- a/ai/features/studio/contexts/context-editing.feature.md
+++ b/ai/features/studio/contexts/context-editing.feature.md
@@ -17,9 +17,8 @@ Feature: Edit Context Information
   I want to edit existing contexts
   So that I can keep context information up to date
 
-  Scenario: Edit context with active session
-    Given I have an active design session
-    And I am viewing a context
+  Scenario: Edit context at any time
+    Given I am viewing a context
     When I want to edit the context
     Then I should be able to click "Edit" button
     And I should be able to modify the context ID
@@ -32,10 +31,19 @@ Feature: Edit Context Information
 
   Scenario: Edit context without active session
     Given I do not have an active session
-    When I try to edit a context
-    Then I should see that editing is disabled
-    And I should see a message that an active session is required
-    And I should be able to start a session from this prompt
+    And I am viewing a context
+    When I edit and save the context
+    Then the changes should be saved successfully
+    And the context file should be updated on disk
+    And I should not be prompted to start a session
+    
+  Scenario: Edit context with active session
+    Given I have an active design session
+    And I am viewing a context
+    When I edit and save the context
+    Then the changes should be saved successfully
+    And the context file should NOT be tracked in the session's changed_files
+    And contexts are considered foundational and not session-tracked
 
   Scenario: Cancel editing
     Given I am editing a context
```

### Feature: forge-studio
File: ai/features/studio/forge-studio.feature.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/features/studio/forge-studio.feature.md b/ai/features/studio/forge-studio.feature.md
index d1a89b2..1a4942f 100644
--- a/ai/features/studio/forge-studio.feature.md
+++ b/ai/features/studio/forge-studio.feature.md
@@ -96,23 +96,40 @@ Feature: File Management in Studio
   I want to create and manage Forge files through Studio
   So that I can organize my context engineering work
 
-  Scenario: Session-aware file creation
+  Scenario: Session-aware file creation for Features and Specs
     Given I have an active design session
-    When I want to create a new Forge file
-    Then I should be able to create files in any category
+    When I want to create a new Feature or Spec file
+    Then I should be able to create the file
     And I should be prompted for a title
     And the file should be created with kebab-case naming
     And the file should have proper frontmatter template
     And the file should have category-appropriate content template
     And the file change should be tracked in the session
 
-  Scenario: Prevent editing without session
+  Scenario: Create Actors and Contexts without session
     Given I do not have an active session
-    When I try to create or edit Forge files
-    Then I should see a read-only indicator
+    When I want to create a new Actor or Context file
+    Then I should be able to create the file
+    And I should be prompted for a title
+    And the file should be created with kebab-case naming
+    And the file should have proper frontmatter template
+    And the file should have category-appropriate content template
+    And the file change should NOT be tracked in any session
+    
+  Scenario: Prevent Feature and Spec editing without session
+    Given I do not have an active session
+    When I try to create or edit Features or Specs
+    Then I should see a read-only indicator for Features and Specs
     And I should see a message to start a session first
-    And file creation buttons should not be available
-    And file editing should be disabled
+    And Feature and Spec creation buttons should not be available
+    And Feature and Spec editing should be disabled
+    
+  Scenario: Actors and Contexts always editable
+    Given I do not have an active session
+    When I view Actors or Contexts
+    Then I should be able to create, edit, and save Actors at any time
+    And I should be able to create, edit, and save Contexts at any time
+    And these files are foundational and do not require sessions
 
   Scenario: Navigate folder structure
     Given I have a nested folder structure
```

### Feature: studio-sessions
File: ai/features/studio/sessions/session-management.feature.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/features/studio/sessions/session-management.feature.md b/ai/features/studio/sessions/session-management.feature.md
index 1153217..b87a70f 100644
--- a/ai/features/studio/sessions/session-management.feature.md
+++ b/ai/features/studio/sessions/session-management.feature.md
@@ -101,12 +101,14 @@ Feature: Session Management in Studio
     And the session should record the start time and start commit (if git repo)
     And I should see the active session indicator appear
 
-  Scenario: Start session without active session
+  Scenario: Working without active session
     Given I do not have any active sessions
     When I am on any Forge Studio page
-    Then file creation and editing should be disabled
-    And I should see read-only indicators
-    And I should see messages prompting me to start a session
+    Then Features and Specs creation and editing should be disabled
+    And I should see read-only indicators for Features and Specs
+    And I should see messages prompting me to start a session for Features and Specs
+    But Actors and Contexts should remain fully editable
+    And Sessions should be viewable and startable
 
   Scenario: Only one active session at a time
     Given I have an active design session
@@ -165,17 +167,26 @@ Feature: Automatic File Change Tracking
   I want files I change to be automatically tracked
   So that I don't have to manually maintain the list
 
-  Scenario: Track file changes in ai directory
+  Scenario: Track feature and spec changes only
     Given I have an active design session
-    When I create or modify a file in the ai directory
+    When I create or modify a Feature or Spec file
     Then the file path should be automatically added to changed_files
     And the session file should be updated on disk
     And the session panel should show the updated file count
     And session files themselves should not be tracked
+    
+  Scenario: Do not track Actor and Context changes
+    Given I have an active design session
+    When I create or modify an Actor or Context file
+    Then the file path should NOT be added to changed_files
+    And the session file should not be updated
+    And the session panel should not show these changes
+    And Actors and Contexts are foundational and not session-tracked
 
   Scenario: File watcher lifecycle
     Given I start a new session
-    Then a file watcher should be created for ai/**/*.{feature.md,spec.md,model.md,context.md}
+    Then a file watcher should be created for ai/**/*.{feature.md,spec.md}
+    And the watcher should only track Features and Specs
     And when I stop the session, the file watcher should be disposed
     And no more changes should be tracked after session ends
 ```
```

### Spec: forge-studio-implementation
File: ai/specs/studio/forge-studio-implementation.spec.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/specs/studio/forge-studio-implementation.spec.md b/ai/specs/studio/forge-studio-implementation.spec.md
index 4713dda..aa86294 100644
--- a/ai/specs/studio/forge-studio-implementation.spec.md
+++ b/ai/specs/studio/forge-studio-implementation.spec.md
@@ -249,19 +249,33 @@ The session panel is a persistent right-side panel that:
 ### File Change Tracking
 
 When a session is active:
-1. File watcher monitors: `ai/**/*.{feature.md,spec.md,model.md,context.md,actor.md}`
-2. On file create/change, add relative path to `session.changedFiles[]`
-3. Exclude `*.session.md` files from tracking
-4. Update session file on disk
-5. Notify webview to update UI
+1. File watcher monitors: `ai/**/*.{feature.md,spec.md}`
+2. Only Features and Specs are tracked in sessions
+3. On Feature or Spec file create/change, add relative path to `session.changedFiles[]`
+4. Actors and Contexts are NOT tracked (they are foundational, not session-specific)
+5. Exclude `*.session.md` files from tracking
+6. Update session file on disk
+7. Notify webview to update UI
+
+**Rationale**: Actors and Contexts are foundational definitions that developers create before starting design work. They provide the vocabulary and guidance for design sessions but are not part of the design changes themselves.
 
 ## File Management
 
 ### Session-Aware Operations
 
-All file creation and editing operations require an active session:
-- Without active session: UI shows read-only mode
-- With active session: Full CRUD operations enabled
+File creation and editing operations have different requirements based on file type:
+
+**Always Editable (No Session Required):**
+- Actors: Can be created, edited, and saved at any time
+- Contexts: Can be created, edited, and saved at any time
+- Sessions: Can be viewed, created, and managed at any time
+- These are considered foundational files that developers define before starting design sessions
+
+**Session-Locked (Active Session Required):**
+- Features: Require active session for creation and editing
+- Specs: Require active session for creation and editing
+- Without active session: UI shows read-only mode for Features and Specs
+- With active session: Full CRUD operations enabled for Features and Specs
 
 ### File Creation Flow
```

### Feature: navigation-menu
File: ai/features/studio/navigation-menu.feature.md

**Git Status:** New file (not previously tracked)

### Spec: navigation-menu-implementation
File: ai/specs/studio/navigation-menu-implementation.spec.md

**Git Status:** New file (not previously tracked)

### Feature: actor-creation
File: ai/features/studio/actors/actor-creation.feature.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/features/studio/actors/actor-creation.feature.md b/ai/features/studio/actors/actor-creation.feature.md
index 97f0c08..18633d2 100644
--- a/ai/features/studio/actors/actor-creation.feature.md
+++ b/ai/features/studio/actors/actor-creation.feature.md
@@ -13,9 +13,8 @@ context_id:
   - vsce
 ---
 ```gherkin
-Scenario: Create actor with active session
-  Given I have an active design session
-  And I am in the Actors section
+Scenario: Create actor at any time
+  Given I am in the Actors section
   When I want to create a new actor
   Then I should be able to click "New Actor" button
   And I should be prompted for actor name
@@ -24,27 +23,40 @@ Scenario: Create actor with active session
   And I should be able to save the actor
   And the actor should be created with proper template
   And I should be taken to edit the new actor
-  Given this is a test
+  And no active session is required
 ```
 
 ```gherkin
 Scenario: Create actor without active session
   Given I do not have an active session
-  When I try to create a new actor
-  Then I should see that creation is disabled
-  And I should see a message to start a session first
-  And I should be able to start a session from this prompt
+  And I am in the Actors section
+  When I create a new actor
+  Then the actor should be created successfully
+  And the actor file should be saved on disk
+  And the actor should NOT be tracked in any session
+  And actors are foundational and do not require sessions
+```
+
+```gherkin
+Scenario: Create actor with active session
+  Given I have an active design session
+  And I am in the Actors section
+  When I create a new actor
+  Then the actor should be created successfully
+  And the actor file should be saved on disk
+  And the actor should NOT be tracked in the session's changed_files
+  And actors are foundational and not session-tracked
 ```
 
 ```gherkin
 Scenario: Create actor in specific folder
-  Given I have an active session
-  And I have selected a subfolder in the actors list
+  Given I have selected a subfolder in the actors list
   When I want to create a new actor
   Then I should be able to click "New Actor" button
   And the new actor should be created in the selected folder
   And I should be prompted for actor details
   And the actor should be saved in the correct location
+  And no active session is required
 ```
 
 ```gherkin
```

### Feature: context-creation
File: ai/features/studio/contexts/context-creation.feature.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/features/studio/contexts/context-creation.feature.md b/ai/features/studio/contexts/context-creation.feature.md
index da2e707..90a5553 100644
--- a/ai/features/studio/contexts/context-creation.feature.md
+++ b/ai/features/studio/contexts/context-creation.feature.md
@@ -17,9 +17,8 @@ Feature: Create New Context
   I want to create new contexts for my system
   So that I can provide technical guidance for specific areas
 
-  Scenario: Create context with active session
-    Given I have an active design session
-    And I am in the Contexts section
+  Scenario: Create context at any time
+    Given I am in the Contexts section
     When I want to create a new context
     Then I should be able to click "New Context" button
     And I should be prompted for context name
@@ -28,22 +27,34 @@ Feature: Create New Context
     And I should be able to save the context
     And the context should be created with proper template
     And I should be taken to edit the new context
+    And no active session is required
 
   Scenario: Create context without active session
     Given I do not have an active session
-    When I try to create a new context
-    Then I should see that creation is disabled
-    And I should see a message to start a session first
-    And I should be able to start a session from this prompt
+    And I am in the Contexts section
+    When I create a new context
+    Then the context should be created successfully
+    And the context file should be saved on disk
+    And the context should NOT be tracked in any session
+    And contexts are foundational and do not require sessions
+
+  Scenario: Create context with active session
+    Given I have an active design session
+    And I am in the Contexts section
+    When I create a new context
+    Then the context should be created successfully
+    And the context file should be saved on disk
+    And the context should NOT be tracked in the session's changed_files
+    And contexts are foundational and not session-tracked
 
   Scenario: Create context in specific folder
-    Given I have an active session
-    And I have selected a subfolder in the contexts list
+    Given I have selected a subfolder in the contexts list
     When I want to create a new context
     Then I should be able to click "New Context" button
     And the new context should be created in the selected folder
     And I should be prompted for context details
     And the context should be saved in the correct location
+    And no active session is required
 ```
 
 ## Feature: Context Creation Form
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

**Create Stories** (*.story.md) in ai/tickets/change-lockdown-items-and-update-menu/ for:
- Code changes and implementations
- New features or feature modifications
- Technical debt improvements
- Refactoring work

**Create Tasks** (*.task.md) in ai/tickets/change-lockdown-items-and-update-menu/ for:
- Manual configuration in external systems
- Documentation updates outside code
- Third-party service setup
- Manual testing or verification steps

**Critical Requirements:**

1. **Keep Stories MINIMAL** - Each story should take < 30 minutes to implement
2. **Break Down Large Changes** - If a change is complex, create multiple small stories
3. **Use Proper Linkages** - Link stories/tasks to feature_id, spec_id, and model_id from changed files
4. **Link to Session** - ALL stories and tasks MUST include session_id: "change-lockdown-items-and-update-menu" in their frontmatter
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
- ALL stories and tasks link back to session_id: "change-lockdown-items-and-update-menu"

Now create all the story and task files in ai/tickets/change-lockdown-items-and-update-menu/ following the schemas and requirements above.
