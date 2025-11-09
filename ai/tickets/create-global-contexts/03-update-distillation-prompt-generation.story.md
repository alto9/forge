---
story_id: update-distillation-prompt-generation
session_id: create-global-contexts
feature_id: [studio-sessions]
spec_id: [cursor-commands-management]
model_id: []
context_id: [node, vsce]
status: pending
priority: high
estimated_minutes: 25
---

# Update generateDistillSessionPrompt to Include Global Contexts

## Objective

Modify the `generateDistillSessionPrompt()` method in `PromptGenerator` to scan for and include global contexts in the distillation prompt, ensuring foundational guidance is always available during story generation.

## Context

When generating distillation prompts, we need to automatically include any contexts marked with `global: true`. These global contexts appear after the changed files section and before the main distillation steps, providing foundational guidance for all story generation.

## Implementation Steps

1. Open `packages/vscode-extension/src/utils/PromptGenerator.ts`
2. Locate the `generateDistillSessionPrompt()` method
3. After gathering changed files and diffs, add global context inclusion:
   - Call `this.findGlobalContexts(workspaceFolder.uri.fsPath)`
   - Check if any global contexts were found
4. If global contexts exist (length > 0):
   - Add a new section to the prompt: `## Global Contexts`
   - Add explanatory text: "The following contexts are marked as global and should inform all story generation:"
   - For each global context:
     - Add heading with contextId and relative file path: `### ${contextId} (${relativePath})`
     - Include the full content of the context file
     - Add separator: `---`
   - Add closing guidance: "Use the guidance above when creating stories and tasks. These foundational contexts ensure consistency across all implementation work."
5. Position this section AFTER changed files but BEFORE STEP 4 (context guidance)
6. Update the step numbering: Global contexts become STEP 3, and subsequent steps shift accordingly
7. If no global contexts found, omit the section entirely

## Files Affected

- `packages/vscode-extension/src/utils/PromptGenerator.ts` - Modify generateDistillSessionPrompt method

## Acceptance Criteria

- [ ] generateDistillSessionPrompt calls findGlobalContexts
- [ ] Global contexts section added when contexts are found
- [ ] Section includes clear heading and explanatory text
- [ ] Each context displays contextId and relative file path
- [ ] Full content of each global context is included
- [ ] Contexts separated with --- divider
- [ ] Closing guidance text included
- [ ] Section positioned after changed files, before distillation steps
- [ ] Step numbers updated to reflect new section
- [ ] Section omitted when no global contexts found
- [ ] Relative paths calculated correctly from workspace root

## Dependencies

- Story: implement-findglobalcontexts-method (must be completed first)

