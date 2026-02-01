# Forge: AI Coding Agent Instructions

## Project Overview

**Forge** is a VSCode extension enabling context engineering for AI-assisted development. It helps teams use structured design sessions to define features, specs, actors, and contexts—then distills those sessions into minimal, actionable implementation stories (<30 minutes each).

**Key insight**: Forge is built *using* Forge itself, making this a meta-project demonstrating its own workflow.

## Architecture Essentials

### Core Components
- **VSCode Extension** (`src/extension.ts`): Command registration, tree view provider, webview panels
- **Commands**: `DistillSessionCommand` and `BuildStoryCommand` generate AI prompts from session files
- **ForgeStudioPanel**: React webview UI for managing Forge files (features, specs, actors)
- **ForgeStudioTreeProvider**: VSCode tree view showing nested folder structure
- **Utils**: File parsing, Gherkin extraction, YAML I/O, git integration

### Data Model (ai/ directory)
- **Sessions** (`ai/sessions/*.session.md`): Track design changes at scenario-level during active session
- **Features** (`ai/features/*.feature.md`): Gherkin-formatted user stories; *tracked* in sessions
- **Specs** (`ai/specs/*.spec.md`): Technical implementation with Mermaid diagrams; always editable, not tracked
- **Actors** (`ai/actors/*.actor.md`): System personas and responsibilities; always editable
- **Tickets** (`ai/tickets/<session-id>/*.story.md`): Generated implementation stories from distilled sessions

### Key File Patterns
- Session files: `*.session.md` with YAML frontmatter (session_id, status, changed_files)
- Feature/Spec files: Markdown with YAML headers + Gherkin code blocks (```gherkin)
- All Gherkin MUST use code blocks for parsing consistency

## Developer Workflows

### Build & Test
```bash
npm run build          # webpack + esbuild (extension + webviews)
npm run watch         # concurrent watch: webpack + esbuild webviews
npm run test          # vitest (globals, happy-dom environment)
npm run lint          # eslint src --ext ts,tsx
npm run package       # Create .vsix for distribution
```

### Key Development Tasks
1. **Adding a command**: Register in `package.json` contributes, implement in `src/commands/`
2. **UI changes**: Edit React components in `src/webview/studio/` or `src/webview/welcome/`
3. **Webview build**: Uses esbuild (IIFE format); runs separately from webpack
4. **Testing**: Use `vitest` with vscode mock in `src/test/__mocks__/vscode.ts`

## Critical Patterns & Conventions

### Gherkin Extraction & Parsing
- `GherkinParser.extractFromCodeBlocks()` requires triple-backtick fences: ` ```gherkin...``` `
- `GherkinParser.parseGherkin()` returns `ParsedGherkin` with scenarios and rules
- Scenario-level tracking: sessions only record *which* scenarios changed, not content

### File Structure & Nesting
- All `ai/` folders are nestable (features, specs, actors, etc.)
- `index.md` files in category folders define shared Background/Rules; never appear in tree views
- Use nesting to group related concepts and maximize context

### Session Workflow
1. **Phase 1** (Start): Create session file, capture problem statement
2. **Phase 2** (Design): Edit features (tracked), specs/diagrams (not tracked)
3. **Phase 3** (Distill): Generate stories from changed features + linked specs/contexts
4. **Phase 4** (Build): Generate implementation prompt for specific story

### Prompt Generation
- `PromptGenerator.generateDistillSessionPrompt()`: Analyzes changed feature scenarios, follows linkages to specs/contexts
- Outputs to `outputChannel` for copy/paste into AI agent
- Commands use URIs from context menu or quick-pick selection

### TypeScript Configuration
- `tsconfig.json` targets ES2022, CommonJS modules, strict mode
- Excludes webview code from main build (separate esbuild pipeline)
- Source maps enabled for debugging

## Testing Approach

- **Vitest** with `happy-dom` environment (no JSDOM overhead)
- Mock VSCode API via `src/test/__mocks__/vscode.ts` 
- Test files colocated: `**/*.test.ts` or `**/__tests__/**`
- Setup file: `src/test/setup.ts` (globalThis mocks)

## Common Integration Points

- **VSCode API**: Tree views, output channels, quick-pick, status bar
- **File System**: Direct fs operations for sessions, features; git integration via GitUtils
- **Webview Messaging**: Extension ↔ React UI via postMessage pattern
- **YAML/Markdown**: gray-matter for frontmatter parsing, marked for markdown

## When Modifying This Codebase

- **Session state**: Source of truth is filesystem; check `_loadActiveSessionFromDisk()` 
- **Feature changes**: Must update scenario-level tracking in `FeatureChangeEntry`
- **Webview**: Rebuild with `npm run build:webview` after changes
- **Commands**: Add to `package.json` before implementing
- **Gherkin changes**: Test with `GherkinParser` directly; verify code block extraction

---

**Meta note**: This extension follows Forge principles itself—check `ai/sessions/` for design docs, `ai/features/` for requirements, and `ai/specs/` for architecture details that may provide additional context for complex changes.
