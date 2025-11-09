---
story_id: add-unit-tests-prompt-inclusion
session_id: create-global-contexts
feature_id: [studio-sessions]
spec_id: [cursor-commands-management]
model_id: []
context_id: [local-development, build-procedures]
status: completed
priority: medium
estimated_minutes: 30
---

# Add Unit Tests for Global Context Inclusion in Prompts

## Objective

Create comprehensive unit tests for the global context inclusion feature in `generateDistillSessionPrompt()` to ensure global contexts are correctly formatted and positioned in the generated prompt.

## Context

The distillation prompt generation must correctly include global contexts when they exist, format them properly, and omit the section when no global contexts are found. This needs thorough testing to ensure the prompt structure is correct.

## Implementation Steps

1. Update test file: `packages/vscode-extension/src/utils/PromptGenerator.test.ts`
2. Set up test fixtures:
   - Mock session file with changed files
   - Mock global context files with realistic content
   - Mock workspace with contexts directory
3. Test cases to implement:
   - **Test: includes global contexts section when contexts exist**
     - Given session with global contexts in workspace
     - Should include "## Global Contexts" section in prompt
   - **Test: omits global contexts section when none exist**
     - Given session with no global contexts
     - Should not include "## Global Contexts" section
   - **Test: formats global contexts correctly**
     - Given global contexts found
     - Should format each with heading, full content, and separator
   - **Test: includes relative file paths in headings**
     - Given global contexts
     - Should show relative paths like "ai/contexts/foundation/build-procedures.context.md"
   - **Test: includes full context content**
     - Given global contexts
     - Should include complete frontmatter and Gherkin content
   - **Test: positions global contexts after changed files**
     - Given prompt with changed files and global contexts
     - Should place global contexts section after changed files
   - **Test: positions global contexts before distillation steps**
     - Given prompt with global contexts
     - Should place global contexts before STEP 4 (context guidance)
   - **Test: includes guidance text**
     - Given global contexts section
     - Should include explanatory text and closing guidance
4. Mock findGlobalContexts method for predictable testing
5. Verify prompt structure and formatting
6. Ensure tests run successfully with `npm test -w forge`

## Files Affected

- `packages/vscode-extension/src/utils/PromptGenerator.test.ts` - Update test file

## Acceptance Criteria

- [ ] Test cases implemented and passing
- [ ] Tests verify section included when global contexts exist
- [ ] Tests verify section omitted when no global contexts
- [ ] Tests verify correct formatting of contexts
- [ ] Tests verify relative file paths shown correctly
- [ ] Tests verify full content included
- [ ] Tests verify correct positioning in prompt
- [ ] Tests verify guidance text present
- [ ] Mock findGlobalContexts for predictable testing
- [ ] Tests run with `npm test -w forge`
- [ ] All tests pass

## Dependencies

- Story: implement-findglobalcontexts-method (must be completed first)
- Story: update-distillation-prompt-generation (must be completed first)

