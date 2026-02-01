// packages/vscode-extension/src/templates/cursorCommands.ts

/**
 * Template for forge-refine.md Cursor command
 */
export const FORGE_REFINE_TEMPLATE = `# Forge Refine

This command helps you refine GitHub issues to ensure they are in the most informed state possible, excluding technical implementation details.

## Prerequisites

You must provide a GitHub issue link when using this command. The issue should be in "Refinement" status on the project board.

## What This Command Does

1. **Reads the GitHub issue**: Understands the current state of the issue
2. **Clarifies business value**: Ensures the business value is clearly spelled out and accurate
3. **Defines testing procedures**: Fills out testing procedures from a BAU (Business As Usual) perspective
4. **Defines success and failure**: Ensures clear definitions of success and failure criteria
5. **Updates the issue**: Saves refined content back to the GitHub issue

## Important Guidelines

- **Focus on business value**: Do NOT include technical implementation details
- **BAU perspective**: Testing procedures should be written from a business-as-usual perspective, not technical testing
- **Clear definitions**: Success and failure criteria must be unambiguous
- **Work with GitHub issues directly**: All changes are made to the GitHub issue, not local files
- **Required fields**: The following fields must be filled out before progressing to Scribe mode:
  - Problem Statement
  - Business Value
  - Testing Procedures (BAU perspective)
  - Definition of Success
  - Definition of Failure

## When to Progress to Scribe Mode

**CRITICAL**: Before progressing to Scribe mode, evaluate whether sub-issues are needed:

- **If only 1 sub-issue would be created**: **DO NOT** create a sub-issue. Instead, refine the parent issue with implementation details and skip Scribe mode entirely. There is no need for a single sub-issue - the parent issue can be implemented directly.
- **Only create sub-issues if it makes sense**: Sub-issues should only be created when:
  - The work can be logically broken into multiple independent, potentially shippable pieces
  - Each sub-issue represents a complete, working increment of value
  - The breakdown improves clarity and parallelization
- **Each sub-issue must be 'potentially shippable'**: 
  - No broken state in between sub-issues
  - Each sub-issue should result in a working, testable state
  - The system should be functional after each sub-issue is completed
  - Avoid creating sub-issues that leave the system in an incomplete or broken state

**Decision Flow**:
1. After refining the issue, assess if it needs to be broken down
2. If breakdown would result in only 1 sub-issue → Skip Scribe mode, refine parent issue with implementation details
3. If breakdown would result in 2+ sub-issues that are each potentially shippable → Progress to Scribe mode
4. If breakdown would result in sub-issues that leave the system broken → Don't create sub-issues, refine parent issue instead

## Issue Structure

The GitHub issue body should contain the following sections:

\`\`\`markdown
### Problem Statement
[What problem does this feature solve?]

### Business Value
[What is the business value of this feature?]

### Testing Procedures
[How should this be tested from a BAU perspective?]

### Definition of Success
[What defines success for this feature?]

### Definition of Failure
[What defines failure for this feature?]
\`\`\`

## Usage

1. Use the \`forge-refine\` command in Cursor
2. Provide the GitHub issue link: \`https://github.com/owner/repo/issues/123\`
3. The AI will help refine each section of the issue
4. Review and save changes back to GitHub
5. Evaluate whether sub-issues are needed:
   - If only 1 sub-issue would be created → Skip Scribe mode, refine parent issue with implementation details
   - If 2+ potentially shippable sub-issues make sense → Progress to Scribe mode
   - If sub-issues would leave system broken → Don't create sub-issues, refine parent issue instead

## Goal

The goal of Refinement mode is to get the original ticket in the most informed state possible, excluding technical implementation details. The business value must be clearly spelled out and accurate at the end of the refinement phase.`;

/**
 * Template for forge-build.md Cursor command
 */
export const FORGE_BUILD_TEMPLATE = `# Forge Build

This command helps you implement a GitHub sub-issue by analyzing the codebase, issue content, parent issue context, and ensuring all tests pass.

## Prerequisites

You must provide a GitHub issue link when using this command. The issue should be a sub-issue ready for implementation.

## Workflow

### Step 1: Receive Issue Link
- Accept a GitHub issue link (e.g., \`https://github.com/owner/repo/issues/123\`)
- Parse the link to extract owner, repo, and issue number

### Step 2: Read Parent Issue
- **CRITICAL**: Read the parent issue of the sub-issue that was passed to it
- Use GitHub API to fetch the parent issue: \`GET /repos/{owner}/{repo}/issues/{issue_number}/parent\`
- If the issue doesn't have a parent (404), treat it as a standalone issue
- Understand the parent issue context to ensure the sub-issue implementation aligns with the overall goal

### Step 3: Branch Validation
- **CRITICAL**: Check that the user is NOT on a main branch (main, master, develop, etc.)
- Use \`git rev-parse --abbrev-ref HEAD\` to get the current branch name
- If on a main branch, **STOP** and instruct the user to create a feature branch first
- Prefer feature branch naming: \`feature/issue-{number}\` or \`feature/{issue-title-slug}\`
- Example: \`git checkout -b feature/issue-123\` or \`git checkout -b feature/add-user-authentication\`

### Step 4: Read Sub-Issue Content
- Fetch the sub-issue content (title, body, labels, etc.)
- Parse the issue body to extract:
  - **Implementation Steps**: Detailed technical steps to implement
  - **Test Procedures**: How to test this specific implementation
  - **Acceptance Criteria**: What must be completed for this sub-issue to be considered done

### Step 5: Analyze Development Environment
- **Analyze package.json**: Review \`package.json\` scripts for:
  - \`lint\`, \`test\`, \`validate\`, \`build\`, \`dev\`, \`start\` scripts
  - Dependencies and devDependencies
  - Test frameworks and tools
- **Analyze GitHub Actions**: Review \`.github/workflows/\` for:
  - CI/CD test and lint scripts
  - Build and validation procedures
  - Test execution patterns
- **Analyze documentation**: Check for:
  - README.md for local development setup
  - CONTRIBUTING.md for development guidelines
  - Any setup or development documentation

### Step 6: Implement Changes
- Perform the implementation steps outlined in the ticket
- Follow existing codebase patterns and conventions
- Write clean, maintainable code that matches the project's style

### Step 7: Update Automated Testing
- Update any automated testing required based on the changes made
- Create or update unit tests based on the test procedures in the issue
- Ensure test coverage for new functionality
- Update integration tests if needed

### Step 8: Validate After Each Change
- **CRITICAL**: After each significant change, run local validation:
  - Execute \`npm run lint\` (or equivalent) - **must pass**
  - Execute \`npm run test\` (or equivalent) - **must pass**
  - Execute \`npm run build\` (if applicable) - **must pass**
  - Execute any validation scripts found in package.json
- If any check fails, **fix the issues before proceeding**
- Do not mark the issue as complete until ALL checks pass

### Step 9: Mark Issue Complete
- Once all implementation is done and ALL tests pass:
  - Update the GitHub issue status to 'closed'
  - Optionally add a comment summarizing what was implemented

## Important Guidelines

- **Branch Safety**: NEVER work on main/master/develop branches - always use a feature branch
- **Parent Context**: Always read and understand the parent issue to ensure alignment
- **Test After Each Change**: Run lint/test/build after each significant change, not just at the end
- **Follow the Issue**: Implement exactly what the issue describes - don't add extra features
- **Match Patterns**: Follow the codebase's existing architecture and conventions
- **All Checks Must Pass**: The task is not considered complete until ALL tests, lint, and validation checks pass
- **Use Plan Mode**: When using in Cursor, use Plan mode to review the implementation plan before executing

## Usage

1. Use the \`forge-build\` command in Cursor
2. Provide the GitHub issue link: \`https://github.com/owner/repo/issues/123\`
3. The AI will:
   - Read the parent issue (if applicable)
   - Check the current branch (must be a feature branch)
   - Read the sub-issue content
   - Analyze package.json and GitHub Actions
   - Implement the changes
   - Update tests
   - Run validation after each change
   - Mark the issue as complete when all checks pass

## Testing Requirements

- **Analyze GitHub Actions**: Check \`.github/workflows/\` for CI/CD test and lint scripts
- **Analyze package.json**: Check \`package.json\` for \`lint\`, \`test\`, \`validate\`, \`build\` scripts
- **Run checks incrementally**: Execute lint/test/build after each significant change
- **All must pass**: The task is not considered complete until all tests, lint, and build checks pass
- **Local development**: Ensure local testing procedures from documentation are followed

The implementation will be consistent with your codebase patterns, aligned with the parent issue context, and all validation checks will pass.`;

/**
 * Template for forge-scribe.md Cursor command
 */
export const FORGE_SCRIBE_TEMPLATE = `# Forge Scribe

**🚨 CRITICAL RESTRICTION: This command ONLY interacts with GitHub issues via the GitHub API. It does NOT read, write, modify, or delete ANY code files or any files in the codebase.**

This command validates and manages GitHub sub-issues to ensure they form a coherent, complete, and logical breakdown of the parent issue.

## Prerequisites

You must provide a GitHub issue link when using this command. The parent issue should be in "Scribe" status and have completed refinement.

## What This Command Does (AND DOES NOT DO)

### ✅ What This Command DOES:
1. **Reads the parent GitHub issue**: Fetches and understands the refined parent issue content
2. **Reads existing sub-issues**: Fetches all existing sub-issues linked to the parent issue
3. **Validates coherence**: Reviews ALL sub-issues together to ensure they are coherent, complete, and logical as a group
4. **Validates completeness**: Ensures all implementation steps from the parent issue are properly reflected across sub-issues
5. **Creates/updates/deletes sub-issues ONLY**: Uses GitHub API to create, update, or delete GitHub sub-issues
6. **Links sub-issues**: Automatically links sub-issues to the parent issue via GitHub API

### ❌ What This Command DOES NOT DO:
- **NO code file operations**: Do NOT read, write, modify, or delete ANY code files (no .ts, .js, .tsx, .jsx, .py, .java, etc.)
- **NO file system operations**: Do NOT read, write, modify, or delete ANY files in the codebase
- **NO code analysis**: Do NOT analyze code structure, patterns, or implementation details
- **NO manual task issues**: Do NOT create issues for manual tasks like testing, documentation, or configuration
- **NO separate testing issues**: Testing belongs in the Test Procedures and Acceptance Criteria sections of product change issues, not as separate issues
- **NO implementation planning**: Do NOT plan code changes or create implementation plans - only plan sub-issue creation/updates

## Critical Rules

### Rule 1: ONLY GitHub API Operations
- **ONLY use GitHub API**: Create, update, or delete GitHub issues via GitHub API
- **NO file operations**: Do NOT read, write, or modify ANY files in the codebase
- **NO code reading**: Do NOT read code files to understand implementation - work only from issue content
- **When in Plan mode**: Plan ONLY GitHub sub-issue operations (create/update/delete), NOT code changes

### Rule 2: Only Product Changes
- **Every sub-issue MUST relate to a product change** (code implementation, feature addition, bug fix, etc.)
- **NEVER create issues for**: Manual testing, documentation updates, configuration changes, or any non-code work
- **Testing goes INSIDE issues**: Include test procedures and acceptance criteria within each product change issue

### Rule 3: Coherence as a Group
- **Read ALL existing sub-issues first**: Fetch and review all current sub-issues before making changes
- **Validate coherence**: Ensure all sub-issues work together as a complete, logical set
- **Validate completeness**: All implementation steps from the parent issue must be reflected across sub-issues
- **Check dependencies**: Identify and document dependencies between sub-issues
- **Verify no gaps**: Make sure nothing is missing and nothing is redundant
- **Validate logic**: Ensure the breakdown makes logical sense and sub-issues can be implemented independently

### Rule 4: Small, Focused Work
- Each sub-issue should represent a focused piece of work (< 30 minutes ideally)
- Break large changes into multiple small, independent sub-issues where possible
- Each sub-issue should be implementable independently (or with clear dependencies)

## Sub-issue Structure

Each sub-issue MUST contain:

\`\`\`markdown
## Implementation Steps
[Detailed technical steps to implement this product change]

## Test Procedures
[How to test this specific implementation - include validation steps here]

## Acceptance Criteria
[What must be completed for this sub-issue to be considered done - include validation requirements]
\`\`\`

**Note**: Test Procedures and Acceptance Criteria are where validation/testing goes. Do NOT create separate issues for testing.

## Workflow

1. **Fetch parent issue**: Read the GitHub issue content (title, body, labels, etc.)
2. **Fetch existing sub-issues**: Read all existing sub-issues linked to the parent issue
3. **Validate current state**: Review existing sub-issues to check:
   - Are they coherent as a group?
   - Do they cover all implementation steps from the parent issue?
   - Are there gaps or redundancies?
   - Do they form a logical breakdown?
4. **Plan sub-issue operations**: Determine what sub-issues need to be:
   - Created (if missing)
   - Updated (if incomplete or incorrect)
   - Deleted (if redundant or incorrect)
5. **Execute GitHub API operations**: Create/update/delete sub-issues via GitHub API ONLY
   - **CRITICAL**: When creating a sub-issue, you MUST link it to the parent issue using GitHub's native sub-issues API
   - The linkage happens automatically via the API - no need to add "Parent issue: #X" text to the body
   - GitHub's API maintains the parent-child relationship natively
6. **Validate final state**: Review all sub-issues together to ensure coherence and completeness

## Usage

1. Use the \`forge-scribe\` command in Cursor
2. Provide the GitHub issue link: \`https://github.com/owner/repo/issues/123\`
3. The AI will:
   - Fetch the parent issue and all existing sub-issues
   - Validate coherence, completeness, and logic
   - Create/update/delete sub-issues via GitHub API ONLY
   - NO code files will be read or modified
4. Review the sub-issues and verify they work together as a group
5. Once satisfied, close the session and move the parent issue to 'Ready' status

## Plan Mode Behavior

When running in Plan mode:
- **Plan ONLY**: GitHub sub-issue operations (create X sub-issues, update Y sub-issues, delete Z sub-issues)
- **DO NOT plan**: Code changes, file modifications, or implementation steps
- **Focus on**: Validation, coherence checking, and sub-issue management

## Goal

The goal of Scribe mode is to validate and manage GitHub sub-issues so they form a coherent, complete, and logical breakdown of the parent issue. This is a planning/validation phase - implementation happens later using forge-build.`;

/**
 * Map of command paths to their templates
 */
export const COMMAND_TEMPLATES: Record<string, string> = {
  '.cursor/commands/forge-refine.md': FORGE_REFINE_TEMPLATE,
  '.cursor/commands/forge-build.md': FORGE_BUILD_TEMPLATE,
  '.cursor/commands/forge-scribe.md': FORGE_SCRIBE_TEMPLATE
};

/**
 * Get all command paths that Forge manages
 */
export function getManagedCommandPaths(): string[] {
  return Object.keys(COMMAND_TEMPLATES);
}

/**
 * Get the template content for a specific command path
 */
export function getCommandTemplate(commandPath: string): string | undefined {
  return COMMAND_TEMPLATES[commandPath];
}

