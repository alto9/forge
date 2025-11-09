# Create Stories and Tasks for Session: wysiwyg-editor-for-markdown

This command will analyze the design session and create Stories (for code changes) and Tasks (for non-code work) based on the session's changed files and goals.

---

STEP 1: Call the get_forge_about MCP tool to understand the Forge workflow and distillation principles.

STEP 2: Retrieve the required schemas:
- get_forge_schema with schema_type "story"
- get_forge_schema with schema_type "task"

STEP 3: Review the design session:

**Session File**: /Users/derrick/Documents/Code/Alto9/oss/forge/ai/sessions/wysiwyg-editor-for-markdown.session.md
**Session ID**: wysiwyg-editor-for-markdown

**Session Content**:
```markdown
---
session_id: wysiwyg-editor-for-markdown
start_time: '2025-11-09T03:07:13.498Z'
status: completed
problem_statement: wysiwyg editor for markdown
changed_files:
  - ai/features/studio/editors/wysiwyg-markdown-editor.feature.md
  - ai/specs/studio/wysiwyg-editor-implementation.spec.md
  - ai/contexts/vscode/wysiwyg-markdown-editor-guidance.context.md
end_time: '2025-11-09T03:19:37.526Z'
---
## Problem Statement

wysiwyg editor for markdown

## Goals

Implement a wysiwyg editor for markdown within Forge studio for easier editing.

## Approach

Add this editor to all places where markdown is displayed in text editors.

## Key Decisions

1. **TipTap as Editor Framework**: Selected TipTap editor framework over alternatives (Slate, Quill, Draft.js) because:
   - Built on ProseMirror (mature, battle-tested)
   - React-friendly with hooks API
   - Excellent TypeScript support
   - Built-in markdown support via extensions
   - Extensible architecture for future enhancements

2. **Dual-Mode Editing**: Implemented both WYSIWYG and source view modes:
   - WYSIWYG for visual editing (default for most users)
   - Source view for markdown purists and edge cases
   - Easy toggle between modes preserves all content

3. **Bidirectional Markdown Conversion**:
   - Use **turndown** library for HTML → Markdown (clean, reliable)
   - Use **marked** library for Markdown → HTML (GitHub Flavored Markdown support)
   - Custom turndown rules to preserve Gherkin blocks and special content

4. **Separation of Concerns**: WYSIWYG editor handles markdown content only:
   - Frontmatter remains in form fields (not editable in WYSIWYG)
   - Gherkin blocks remain in structured editor (not editable in WYSIWYG)
   - WYSIWYG only edits non-structured markdown sections

5. **Session-Aware Editing**: Read-only mode when no active session:
   - Toolbar hidden in read-only mode
   - Editor not editable without session
   - Consistent with existing Studio behavior

6. **Auto-Save with Debouncing**: 500ms debounce on save:
   - Prevents excessive file writes
   - Matches existing Studio auto-save behavior
   - Silent save (no UI confirmation)

7. **CRITICAL: Follow Nomnoml Diagram Pattern Exactly**:
   - **Read-only mode (no session)**: Content is RENDERED (not source), no toggle visible
   - **Edit mode (with session)**: Toggle between "Visual" and "Source" modes
   - This provides consistency across all Studio content types
   - Reference: Nomnoml diagrams in `index.tsx` lines 1556-1837
   - State pattern: `diagramViewMode: 'source' | 'rendered'`
   - Toggle visibility: Only when `!isReadOnly`

## Notes

### Implementation Approach

The WYSIWYG editor will be integrated into Forge Studio in phases:

**Phase 1**: Add to simple file types (specs, models, actors, contexts)
- These files have straightforward markdown (no Gherkin)
- Use MarkdownEditor component with TipTap
- Replace existing plain textarea editors

**Phase 2**: Integrate with feature files
- Feature files have both Gherkin and markdown
- Parse file: frontmatter + Gherkin blocks + markdown content
- Use GherkinEditor for Gherkin sections
- Use MarkdownEditor for other content
- Serialize back together on save

**Phase 3**: Polish and enhancement
- Add table editing support
- Add image upload capability (to project directory)
- Improve keyboard shortcuts
- Add undo/redo across sessions

**Phase 4**: Future possibilities
- Real-time collaboration via Y.js extension
- AI-assisted content generation
- Visual diagram editors for Nomnoml/Mermaid
- Cross-file references (clickable links to other Forge files)

### Technical Considerations

- **Performance**: TipTap performs well up to ~5,000 lines. For larger files, consider fallback to plain textarea.
- **Bundle Size**: TipTap + extensions add ~100KB to bundle. Use lazy loading to minimize initial load time.
- **Browser Compatibility**: TipTap requires modern browsers (ES2015+). Not an issue for VSCode webviews.
- **Theme Integration**: Use VSCode CSS variables for all styling to ensure seamless theme adaptation.

### Files Created

1. **Feature**: `ai/features/studio/editors/wysiwyg-markdown-editor.feature.md`
   - Comprehensive Gherkin scenarios for all WYSIWYG functionality
   - Covers toolbar actions, keyboard shortcuts, view toggle, read-only mode
   - Includes table editing, Gherkin preservation, auto-save

2. **Spec**: `ai/specs/studio/wysiwyg-editor-implementation.spec.md`
   - Technical implementation using TipTap framework
   - Component architecture and state management
   - Markdown conversion strategies
   - VSCode theme integration patterns
   - Testing strategy and performance considerations

3. **Context**: `ai/contexts/vscode/wysiwyg-markdown-editor-guidance.context.md`
   - Guidance for working with TipTap editor
   - Gherkin scenarios for when to use this context
   - Best practices for markdown conversion
   - Common gotchas and solutions
   - Performance optimization tips

### Next Steps

When this session is distilled into stories:

- Break implementation into minimal stories (< 30 min each)
- Start with core MarkdownEditor component
- Then add toolbar and formatting actions
- Then integrate with file editors
- Then add advanced features (tables, images)
- Each story should be independently testable and deployable

```

**Changed Files During Session** (3 files):

### Feature: wysiwyg-markdown-editor
File: ai/features/studio/editors/wysiwyg-markdown-editor.feature.md

**Git Status:** New file (not previously tracked)

### Spec: wysiwyg-editor-implementation
File: ai/specs/studio/wysiwyg-editor-implementation.spec.md

**Git Status:** New file (not previously tracked)

### Context: wysiwyg-markdown-editor-guidance
File: ai/contexts/vscode/wysiwyg-markdown-editor-guidance.context.md

**Git Status:** New file (not previously tracked)


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

**Create Stories** (*.story.md) in ai/tickets/wysiwyg-editor-for-markdown/ for:
- Code changes and implementations
- New features or feature modifications
- Technical debt improvements
- Refactoring work

**Create Tasks** (*.task.md) in ai/tickets/wysiwyg-editor-for-markdown/ for:
- Manual configuration in external systems
- Documentation updates outside code
- Third-party service setup
- Manual testing or verification steps

**Critical Requirements:**

1. **Keep Stories MINIMAL** - Each story should take < 30 minutes to implement
2. **Break Down Large Changes** - If a change is complex, create multiple small stories
3. **Use Proper Linkages** - Link stories/tasks to feature_id, spec_id, and model_id from changed files
4. **Link to Session** - ALL stories and tasks MUST include session_id: "wysiwyg-editor-for-markdown" in their frontmatter
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
- ALL stories and tasks link back to session_id: "wysiwyg-editor-for-markdown"

Now create all the story and task files in ai/tickets/wysiwyg-editor-for-markdown/ following the schemas and requirements above.
