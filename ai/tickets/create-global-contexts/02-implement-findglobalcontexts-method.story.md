---
story_id: implement-findglobalcontexts-method
session_id: create-global-contexts
feature_id: [studio-sessions]
spec_id: [cursor-commands-management]
model_id: []
context_id: [node, vsce]
status: pending
priority: high
estimated_minutes: 25
---

# Implement findGlobalContexts Method in PromptGenerator

## Objective

Add a `findGlobalContexts()` static method to the `PromptGenerator` class that recursively scans the `ai/contexts/` directory for context files with `global: true` in their frontmatter.

## Context

The distillation prompt generation needs to discover and include global contexts automatically. This method will scan all `.context.md` files recursively and return those marked as global with their full content.

## Implementation Steps

1. Open `packages/vscode-extension/src/utils/PromptGenerator.ts`
2. Add a new static method `findGlobalContexts(workspaceRoot: string)` that:
   - Takes workspace root path as parameter
   - Returns `Promise<ContextFile[]>` where ContextFile has: `{ contextId: string, filePath: string, content: string }`
3. Implement recursive directory scanning:
   - Start with `ai/contexts/` directory
   - Use VSCode's `workspace.fs.readDirectory()` for filesystem operations
   - Recursively scan all subdirectories
   - Filter for files matching `*.context.md` pattern
4. For each context file found:
   - Read the file content using `FileParser.readFile()`
   - Parse frontmatter using `FileParser.parseFrontmatter()`
   - Check if `frontmatter.global === true`
   - If global, add to results array with contextId, filePath, and full content
5. Return array of global contexts
6. Handle errors gracefully (missing directories, read errors)

## Files Affected

- `packages/vscode-extension/src/utils/PromptGenerator.ts` - Add findGlobalContexts method

## Acceptance Criteria

- [ ] findGlobalContexts method added to PromptGenerator class
- [ ] Method recursively scans ai/contexts/ directory
- [ ] Filters for files with .context.md extension
- [ ] Parses frontmatter and checks for global: true
- [ ] Returns array with contextId, filePath, and full content
- [ ] Handles missing directories gracefully (returns empty array)
- [ ] Handles file read errors gracefully
- [ ] Uses async/await for all filesystem operations
- [ ] Uses VSCode workspace.fs API for filesystem access
- [ ] TypeScript types are properly defined

## Dependencies

None

