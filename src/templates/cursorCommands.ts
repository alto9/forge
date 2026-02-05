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
2. **Assesses issue complexity**: Examines the issue to determine if it's a simple fix or requires breakdown into sub-issues
3. **Determines issue type**: Identifies whether this is a bug report or feature request
4. **Loads appropriate template**: Reads the corresponding template file (bug_report.yml or feature_request.yml) to understand required fields
5. **Clarifies business value**: Ensures the business value is clearly spelled out and accurate
6. **Defines testing procedures**: Fills out testing procedures from a BAU (Business As Usual) perspective
7. **Defines success and failure**: Ensures clear definitions of success and failure criteria
8. **Updates the issue**: Saves refined content back to the GitHub issue
9. **Handles sub-issues if needed**: If the issue is complex, creates and refines sub-issues as part of the refinement process

## Issue Type Detection

**CRITICAL**: Before refining the issue, you MUST determine the issue type:

1. **Read the GitHub issue** using the GitHub MCP tools to get:
   - Issue labels (check for "bug" or "enhancement" labels)
   - Issue title (check for "[Bug]" or "[Feature]" prefixes)
   - Issue body structure

2. **Determine issue type**:
   - If the issue has a "bug" label OR title starts with "[Bug]" → **Bug Report**
   - If the issue has an "enhancement" label OR title starts with "[Feature]" → **Feature Request**

3. **Load the appropriate template**:
   - **Bug Report**: Read \`.github/ISSUE_TEMPLATE/bug_report.yml\`
   - **Feature Request**: Read \`.github/ISSUE_TEMPLATE/feature_request.yml\`

4. **Extract required fields** from the template file:
   - Parse the YAML structure to identify all form fields
   - Note which fields are marked as \`required: true\` in the validations
   - Map template field IDs to the sections that need to be refined
   - Use the template's field labels and descriptions to guide refinement

## Important Guidelines

- **Focus on business value**: Do NOT include technical implementation details
- **BAU perspective**: Testing procedures should be written from a business-as-usual perspective, not technical testing
- **Clear definitions**: Success and failure criteria must be unambiguous
- **Work with GitHub issues directly**: All changes are made to the GitHub issue, not local files
- **Use template fields**: Required fields are determined dynamically from the template file, not hardcoded
- **Template enforcement**: The rule enforces project-specific templates - fields come from the template files

## Issue Structure

The GitHub issue body structure depends on the issue type and is defined by the template file:

- **Bug Reports**: Fields from \`bug_report.yml\` (e.g., Bug Description, Steps to Reproduce, Expected Behavior, Actual Behavior, Version info, etc.)
- **Feature Requests**: Fields from \`feature_request.yml\` (e.g., Problem Statement, Proposed Solution, Alternatives Considered, Use Cases, Priority, etc.)

**Required fields** are determined by the template file's \`validations.required: true\` settings.

## Complexity Assessment and Sub-Issue Handling

**CRITICAL**: Before refining, you MUST assess the issue complexity:

1. **Examine the issue**: Read the issue content to understand its scope and complexity
2. **Determine if sub-issues are needed**:
   - **Simple fixes**: If the issue is straightforward and can be implemented as a single unit of work, refine the parent issue directly. Do NOT create sub-issues for simple fixes.
   - **Complex issues**: If the issue requires multiple independent, potentially shippable pieces of work, create sub-issues as part of the refinement process.

3. **Sub-issue creation criteria**: Only create sub-issues when:
   - The work can be logically broken into multiple independent, potentially shippable pieces
   - Each sub-issue represents a complete, working increment of value
   - The breakdown improves clarity and parallelization
   - Each sub-issue results in a working, testable state (no broken states between sub-issues)

4. **Refinement scope**:
   - **Parent issues**: Always refine the parent issue. If sub-issues are needed, create and refine them as part of refining the parent issue.
   - **Sub-issues**: Sub-issues are NEVER refined individually. They are only created and refined as part of refining their parent issue.

5. **Decision flow**:
   - Assess complexity → If simple → Refine parent issue only → Skip Scribe mode
   - Assess complexity → If complex → Refine parent issue AND create/refine sub-issues → Progress to Scribe mode

## Usage

1. Use the \`forge-refine\` command in Cursor
2. Provide the GitHub issue link: \`https://github.com/owner/repo/issues/123\`
3. The AI will:
   - Read the issue to assess its complexity
   - Determine issue type (bug or feature)
   - Load the appropriate template file
   - Extract required fields from the template
   - Help refine each required section of the issue
   - If complex, create and refine sub-issues as part of the refinement process
4. Review and save changes back to GitHub
5. **If simple fix**: Refinement is complete, skip Scribe mode
6. **If complex with sub-issues**: Once all required fields are complete for both parent and sub-issues, progress to Scribe mode

## Goal

The goal of Refinement mode is to get the original ticket in the most informed state possible, excluding technical implementation details. The business value must be clearly spelled out and accurate at the end of the refinement phase. Simple fixes are refined directly without sub-issues. Complex issues are refined along with their sub-issues, ensuring both parent and children are properly refined together. Sub-issues are never refined individually - they are only created and refined as part of refining their parent issue. The refinement process uses project-specific templates to ensure consistency and completeness.`;

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
 * Template for forge-commit.md Cursor command
 */
export const FORGE_COMMIT_TEMPLATE = `# Forge Commit

This command helps you properly commit code changes for the current branch with proper validation and commit message formatting, following project-specific contribution guidelines.

## Prerequisites

- You must be on a feature branch (not main/master/develop)
- You must have changes to commit (staged or unstaged)
- CONTRIBUTING.md and README.md files must be accessible in the repository root

## What This Command Does

1. **Read Contribution Guidelines**: Loads CONTRIBUTING.md and README.md to understand project-specific commit conventions
2. **Branch Validation**: Ensures you're not on a main branch (main/master/develop)
3. **Pre-commit Checks**: Runs all pre-commit hooks and validation
4. **Status Review**: Shows current git status with all changes
5. **Change Analysis**: Reviews all staged and unstaged changes
6. **Commit Message Generation**: Creates a clear, descriptive commit message following project-specific conventional commits format
7. **Commit Execution**: Commits the changes with the generated message
8. **Post-commit Validation**: Verifies the commit was successful

## Reading Contribution Guidelines

**CRITICAL**: Before creating any commit, you MUST read the project's contribution guidelines:

1. **Read CONTRIBUTING.md**:
   - Read the file at \`CONTRIBUTING.md\` in the repository root
   - Pay special attention to the "Commit Message Conventions" section
   - Note any project-specific commit types, scopes, or formatting requirements
   - Understand version bump implications for different commit types
   - Note any breaking change conventions

2. **Read README.md**:
   - Read the file at \`README.md\` in the repository root
   - Understand project structure and conventions
   - Note any project-specific guidelines or requirements
   - Understand the project's purpose and context

3. **Apply Guidelines**:
   - Use the commit message format specified in CONTRIBUTING.md
   - Follow project-specific type definitions and scopes
   - Respect version bump rules (if documented)
   - Follow any project-specific examples or patterns

## Commit Message Format

Uses Conventional Commits specification (as defined in CONTRIBUTING.md):

\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

**Standard Types** (verify against CONTRIBUTING.md for project-specific types):
- \`feat\`: New feature (typically increments minor version)
- \`fix\`: Bug fix (typically increments patch version)
- \`docs\`: Documentation changes (no version bump)
- \`style\`: Code style changes (no version bump)
- \`refactor\`: Code refactoring (no version bump)
- \`perf\`: Performance improvements (typically increments patch version)
- \`test\`: Adding or updating tests (no version bump)
- \`build\`: Build system changes (no version bump)
- \`ci\`: CI/CD changes (no version bump)
- \`chore\`: Maintenance tasks (no version bump)

**Subject Guidelines:**
- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period at the end
- Maximum 72 characters

**Body Guidelines:**
- Wrap at 72 characters
- Explain what and why, not how
- Separate from subject with blank line
- Use bullet points for multiple changes

**Breaking Changes:**
- Add \`!\` after type/scope: \`feat!: remove deprecated API\`
- OR include \`BREAKING CHANGE:\` in footer
- Breaking changes typically increment major version

## Workflow

### Step 1: Read Contribution Guidelines
- Read \`CONTRIBUTING.md\` file from repository root
- Read \`README.md\` file from repository root
- Extract commit message conventions and project-specific requirements
- Note any project-specific scopes, types, or formatting rules

### Step 2: Branch Safety Check
- Check current branch with \`git rev-parse --abbrev-ref HEAD\`
- If on main/master/develop, **STOP** and warn the user
- Only proceed on feature branches

### Step 3: Pre-commit Validation
- Run \`git status\` to see all changes
- Run \`npm run lint\` (or equivalent) if available
- Run \`npm run test\` (or equivalent) if available
- Run any pre-commit hooks configured in the repository
- If any checks fail, **STOP** and fix issues before committing

### Step 4: Stage Changes
- Review unstaged changes with \`git diff\`
- Review staged changes with \`git diff --cached\`
- Stage relevant files with \`git add\` as needed
- Confirm all intended changes are staged

### Step 5: Generate Commit Message
- Analyze the nature of changes (feat/fix/docs/etc.)
- Determine appropriate scope based on files changed (use project-specific scopes from CONTRIBUTING.md if documented)
- Generate clear, descriptive subject line following project conventions
- Add body if changes need explanation
- Follow Conventional Commits format as specified in CONTRIBUTING.md
- Include breaking change indicators if applicable

### Step 6: Commit Changes
- Execute \`git commit -m "message"\` with generated message (or use \`-m\` for subject and \`-m\` for body)
- Verify commit succeeded with \`git log -1\`
- Show commit hash and summary

### Step 7: Post-commit Verification
- Verify working directory is clean with \`git status\`
- Show recent commit with \`git log -1 --stat\`
- Confirm commit is ready to push

## Important Guidelines

- **Read Guidelines First**: ALWAYS read CONTRIBUTING.md and README.md before committing
- **Follow Project Conventions**: Use project-specific commit types, scopes, and formats from CONTRIBUTING.md
- **Branch Safety**: NEVER commit to main/master/develop branches
- **Pre-commit Hooks**: Always run pre-commit hooks before committing
- **Clear Messages**: Write clear, descriptive commit messages that explain the "why"
- **Atomic Commits**: Each commit should represent a single logical change
- **Test Before Commit**: All tests must pass before committing
- **Review Changes**: Always review what you're committing before executing
- **No Secrets**: Never commit sensitive information (API keys, passwords, etc.)
- **Version Awareness**: Understand how commit types affect version bumps (if documented in CONTRIBUTING.md)

## Special Cases

### Multiple Logical Changes
If changes represent multiple logical units:
- Create separate commits for each logical unit
- Run forge-commit multiple times with different staged files

### Large Commits
If commit is very large:
- Consider breaking into smaller, logical commits
- Use \`git add -p\` for interactive staging

### Fixing Previous Commit
If you need to fix the last commit:
- Use \`git commit --amend\` only if commit hasn't been pushed
- Run forge-commit again for a new commit if already pushed

### Breaking Changes
If your commit introduces a breaking change:
- Add \`!\` after type/scope: \`feat!: remove deprecated API\`
- OR include \`BREAKING CHANGE:\` in footer with explanation
- Follow project-specific breaking change conventions from CONTRIBUTING.md

### Skipping Hooks
**AVOID** skipping hooks with \`--no-verify\`:
- Only skip if absolutely necessary and you understand the implications
- Pre-commit hooks exist for a reason (linting, testing, security)

## Usage

1. Use the \`forge-commit\` command in Cursor
2. The AI will:
   - Read CONTRIBUTING.md and README.md to understand project conventions
   - Verify you're on a feature branch
   - Run pre-commit validation
   - Review all changes
   - Generate a proper commit message following project conventions
   - Commit the changes
   - Verify the commit succeeded
3. Review the commit details
4. Use \`forge-push\` when ready to push to remote

## Files to Exclude

Never commit these files/patterns:
- \`.env\`, \`.env.local\`, \`.env.*\` (environment variables)
- \`node_modules/\` (dependencies)
- \`dist/\`, \`build/\`, \`out/\` (build artifacts)
- \`*.log\` (log files)
- \`.DS_Store\` (macOS files)
- IDE-specific files not in \`.gitignore\`
- Credentials, keys, or sensitive data

## Goal

The goal of forge-commit is to ensure every commit is clean, properly validated, and follows project-specific contribution guidelines. By reading CONTRIBUTING.md and README.md, commits will align with the project's conventions, making the git history readable, consistent, and useful for the entire team.`;

/**
 * Template for forge-push.md Cursor command
 */
export const FORGE_PUSH_TEMPLATE = `# Forge Push

This command helps you safely push code to the remote repository with proper validation, handling common scenarios, and ensuring all pre-push hooks pass.

## Prerequisites

- You must be on a feature branch (not main/master/develop directly)
- You must have commits to push
- Pre-push hooks must be configured (if applicable)

## What This Command Does

1. **Branch Validation**: Ensures you're not force-pushing to protected branches
2. **Pre-push Hooks**: Runs all pre-push hooks and validation
3. **Remote Status Check**: Checks if remote branch exists and its status
4. **Rebase Check**: Determines if rebase is needed
5. **Push Execution**: Pushes commits to remote with proper flags
6. **Response Handling**: Interprets git push responses and takes appropriate action
7. **Post-push Verification**: Verifies push succeeded and remote is up to date

## Workflow

### Step 1: Branch Safety Check
- Check current branch with \`git rev-parse --abbrev-ref HEAD\`
- Identify if pushing to protected branches (main/master/develop)
- Warn if pushing to protected branch without PR workflow
- Verify branch name follows conventions

### Step 2: Pre-push Validation
- Run \`npm run lint\` (or equivalent) if available
- Run \`npm run test\` (or equivalent) if available
- Run \`npm run build\` (or equivalent) if available
- Run any pre-push hooks configured in the repository
- If any checks fail, **STOP** and fix issues before pushing

### Step 3: Fetch Remote Status
- Execute \`git fetch origin\` to get latest remote state
- Check if remote branch exists with \`git ls-remote --heads origin <branch>\`
- Compare local and remote branches

### Step 4: Handle Remote Branch State

#### Case A: Remote Branch Doesn't Exist (First Push)
- Use \`git push -u origin HEAD\` to create remote branch
- Set upstream tracking automatically

#### Case B: Remote Branch Exists and Is Behind
- Local is ahead of remote
- Use \`git push origin HEAD\` to push changes
- No rebase needed

#### Case C: Remote Branch Has Diverged
- Remote has commits local doesn't have
- Check divergence with \`git rev-list --left-right --count origin/<branch>...HEAD\`
- **Recommend rebase**: Run \`git pull --rebase origin <branch>\`
- After successful rebase, push with \`git push origin HEAD\`

#### Case D: Remote Branch Is Ahead
- Remote has commits local doesn't have
- **Require rebase**: Must run \`git pull --rebase origin <branch>\` first
- **DO NOT push** until local is up to date

### Step 5: Execute Push
- Use \`git push origin HEAD\` for normal push
- Use \`git push -u origin HEAD\` for first-time push
- Use \`git push --force-with-lease origin HEAD\` ONLY if user explicitly requests and:
  - Not pushing to main/master/develop
  - User understands the implications
  - Team workflow allows it

### Step 6: Handle Push Responses

#### Success Response
\`\`\`
To <repository>
   abc1234..def5678  feature-branch -> feature-branch
\`\`\`
- Push succeeded
- Show success message with commit range

#### Rejected - Non-fast-forward
\`\`\`
! [rejected]        feature-branch -> feature-branch (non-fast-forward)
error: failed to push some refs to '<repository>'
hint: Updates were rejected because the tip of your current branch is behind
\`\`\`
- Remote has diverged
- Run \`git pull --rebase origin <branch>\`
- Resolve any conflicts
- Run \`git push origin HEAD\` again

#### Rejected - Pre-push Hook Failed
\`\`\`
error: failed to push some refs to '<repository>'
To <repository>
 ! [remote rejected] feature-branch -> feature-branch (pre-receive hook declined)
\`\`\`
- Pre-push hook validation failed
- Review hook output for specific errors
- Fix issues locally
- Try pushing again

#### Protected Branch
\`\`\`
remote: error: GH006: Protected branch update failed
\`\`\`
- Branch is protected on remote
- Cannot push directly to protected branch
- Must use Pull Request workflow

### Step 7: Post-push Verification
- Run \`git status\` to verify working directory state
- Run \`git log origin/<branch>..HEAD\` to verify all commits pushed
- Should show no commits (empty output means everything is pushed)
- Show remote branch URL for creating PR if needed

## Important Guidelines

### Branch Protection
- **NEVER force push to main/master/develop**
- Force push only to feature branches and only when necessary
- Use \`--force-with-lease\` instead of \`--force\` (safer)
- Always verify remote state before force pushing

### Rebase Best Practices
- Always rebase when remote has diverged
- Use \`git pull --rebase origin <branch>\` not \`git pull\`
- Resolve conflicts carefully
- Test after rebasing before pushing
- Use \`git rebase --abort\` if rebase goes wrong

### Pre-push Hook Compliance
- **NEVER skip pre-push hooks** with \`--no-verify\`
- If hooks fail, fix the issues
- Pre-push hooks protect code quality and team standards
- Only skip in extreme emergencies with team approval

### Common Scenarios

#### Scenario 1: First Push to New Branch
\`\`\`bash
git push -u origin HEAD
\`\`\`

#### Scenario 2: Normal Push (Remote Is Behind)
\`\`\`bash
git push origin HEAD
\`\`\`

#### Scenario 3: Remote Has Diverged
\`\`\`bash
git fetch origin
git rebase origin/<branch>
# Resolve any conflicts
git push origin HEAD
\`\`\`

#### Scenario 4: Need to Force Push (Feature Branch Only)
\`\`\`bash
# After rewriting history (rebase, amend, etc.)
git push --force-with-lease origin HEAD
\`\`\`

#### Scenario 5: Protected Branch Push Rejected
- Don't push directly
- Create Pull Request instead
- Use GitHub/GitLab/Bitbucket UI

## Error Handling

### Network Errors
- Retry the push command
- Check internet connection
- Verify remote URL with \`git remote -v\`

### Authentication Errors
- Verify credentials are configured
- Use SSH keys or Personal Access Token
- Check \`git config --list\` for user.name and user.email

### Repository Access Errors
- Verify you have push access to the repository
- Check with repository administrator

## Usage

1. Use the \`forge-push\` command in Cursor
2. The AI will:
   - Verify you're on a feature branch
   - Run pre-push validation
   - Check remote branch status
   - Determine if rebase is needed
   - Execute the appropriate push command
   - Handle any errors or rejections
   - Verify push succeeded
3. Review the push results
4. Create Pull Request if pushing to feature branch

## Force Push Warning

**🚨 CRITICAL**: Force pushing is dangerous and should be avoided unless absolutely necessary.

**When force push is acceptable:**
- Feature branch you own and no one else is using
- After rebasing or amending commits
- With team agreement and communication

**When force push is NEVER acceptable:**
- Main/master/develop branches
- Shared feature branches with multiple developers
- Any branch with active Pull Requests from others
- Without understanding the consequences

**Always use \`--force-with-lease\` instead of \`--force\`**:
- \`--force-with-lease\` verifies remote hasn't changed since last fetch
- \`--force\` blindly overwrites remote (dangerous)

## Goal

The goal of forge-push is to safely push code to the remote repository following industry best practices, handling common scenarios intelligently, and protecting against common mistakes like force-pushing to protected branches or skipping important validation hooks.`;

/**
 * Template for forge-pullrequest.md Cursor command
 */
export const FORGE_PULLREQUEST_TEMPLATE = `# Forge Pull Request

This command helps you create a pull request for the current branch with conventional commit validation and GitHub integration.

## Prerequisites

- You must be on a feature branch (not main/master/develop)
- You must have commits to create a PR for
- The branch must be pushed to remote (use \`forge-push\` first if needed)
- GitHub repository must be configured

## What This Command Does

1. **Branch Validation**: Ensures you're on a feature branch (not main/master/develop)
2. **Conventional Commit Validation**: Validates all commits follow Conventional Commits specification
3. **Base Branch Detection**: Determines the appropriate base branch (main/master/develop)
4. **Commit Analysis**: Reviews commit messages to ensure they follow conventional format
5. **PR Creation**: Creates a pull request using GitHub MCP (preferred) or GH CLI (fallback)
6. **PR Details**: Generates PR title and description from commit messages
7. **Verification**: Confirms PR was created successfully

## Conventional Commit Validation

**CRITICAL**: All commits must follow Conventional Commits specification before creating a PR.

### Valid Commit Format

\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

### Required Types

- \`feat\`: New feature
- \`fix\`: Bug fix
- \`docs\`: Documentation changes
- \`style\`: Code style changes (formatting, missing semicolons, etc.)
- \`refactor\`: Code refactoring without changing functionality
- \`perf\`: Performance improvements
- \`test\`: Adding or updating tests
- \`build\`: Changes to build system or dependencies
- \`ci\`: Changes to CI/CD configuration
- \`chore\`: Other changes that don't modify src or test files

### Validation Rules

1. **Type is required**: First word must be a valid type
2. **Scope is optional**: Can be in parentheses after type
3. **Subject is required**: Must be present after type/scope
4. **Subject format**: 
   - Use imperative mood ("add" not "added" or "adds")
   - Don't capitalize first letter
   - No period at the end
   - Maximum 72 characters
5. **Body is optional**: Can provide additional context
6. **Footer is optional**: Can reference issues (e.g., "Closes #123")

### Invalid Commit Examples

❌ \`update readme\` - Missing type
❌ \`feat: Update README\` - Capitalized subject
❌ \`feat: update readme.\` - Period at end
❌ \`feat update readme\` - Missing colon
❌ \`feature: add new button\` - Invalid type (should be \`feat\`)

### Valid Commit Examples

✅ \`feat: add user authentication\`
✅ \`fix(api): resolve timeout issue\`
✅ \`docs: update installation guide\`
✅ \`refactor(utils): simplify error handling\`
✅ \`feat(auth): add login functionality\\n\\nImplements OAuth2 flow for user authentication\`

## Workflow

### Step 1: Branch Safety Check
- Check current branch with \`git rev-parse --abbrev-ref HEAD\`
- If on main/master/develop, **STOP** and warn the user
- Only proceed on feature branches

### Step 2: Verify Branch is Pushed
- Check if branch exists on remote with \`git ls-remote --heads origin <branch>\`
- If branch not on remote, prompt user to push first (use \`forge-push\`)
- **DO NOT** create PR for unpushed branches

### Step 3: Determine Base Branch
- Check default branch with \`git symbolic-ref refs/remotes/origin/HEAD\`
- Common defaults: \`main\`, \`master\`, \`develop\`
- Use detected default branch as base
- If detection fails, prompt user for base branch

### Step 4: Validate Conventional Commits
- Get commits between base and current branch: \`git log <base>..HEAD --oneline\`
- For each commit, validate the commit message format:
  - Extract commit message with \`git log -1 --format=%B <commit-sha>\`
  - Check if it matches conventional commit pattern
  - Validate type is in allowed list
  - Validate subject format (imperative, lowercase, no period, max 72 chars)
- **If any commit fails validation**: 
  - List all invalid commits
  - **STOP** and instruct user to fix commits (use \`git commit --amend\` or \`git rebase -i\`)
  - **DO NOT** create PR with invalid commits

### Step 5: Generate PR Details
- **Title**: Use the most recent commit's subject (or first commit if multiple)
- **Description**: 
  - List all commits with their types and subjects
  - Group by type (Features, Fixes, Docs, etc.)
  - Include any commit bodies if present
  - Format as markdown

### Step 6: Create Pull Request

#### Preferred: GitHub MCP
1. **Check for GitHub MCP**: Verify \`mcp_github_create_pull_request\` tool is available
2. **Get repository info**: Extract owner/repo from \`git remote get-url origin\`
3. **Call MCP tool**: Use \`mcp_github_create_pull_request\` with:
   - \`owner\`: Repository owner
   - \`repo\`: Repository name
   - \`head\`: Current branch name
   - \`base\`: Base branch (main/master/develop)
   - \`title\`: Generated PR title
   - \`body\`: Generated PR description
4. **Handle MCP response**: Extract PR URL and number from response

#### Fallback: GitHub CLI
1. **Check for GH CLI**: Verify \`gh\` command is available (\`gh --version\`)
2. **Authenticate check**: Verify \`gh auth status\` shows authenticated
3. **Create PR**: Execute \`gh pr create --base <base> --head <head> --title "<title>" --body "<body>"\`
4. **Parse output**: Extract PR URL from command output

#### Error Handling
- If MCP fails: Fall back to GH CLI
- If GH CLI fails: Show error and provide manual instructions
- If both fail: Provide manual PR creation steps

### Step 7: Post-Creation Verification
- Verify PR was created successfully
- Display PR URL and number
- Show PR details (title, base branch, head branch)
- Provide next steps (review, add reviewers, etc.)

## Important Guidelines

### Conventional Commit Enforcement
- **STRICT**: All commits MUST follow conventional commit format
- **No exceptions**: Invalid commits will block PR creation
- **Fix before PR**: Use \`git commit --amend\` or \`git rebase -i\` to fix commits
- **Validation is mandatory**: Cannot skip or bypass validation

### Branch Safety
- **NEVER create PR from main/master/develop**: Must be on feature branch
- **Push before PR**: Branch must exist on remote before creating PR
- **Base branch**: Always use main/master/develop as base, never feature branches

### GitHub Integration Priority
1. **First choice**: GitHub MCP (\`mcp_github_create_pull_request\`)
2. **Second choice**: GitHub CLI (\`gh pr create\`)
3. **Last resort**: Manual instructions for user

### PR Title and Description
- **Title**: Should be clear and descriptive, based on most significant commit
- **Description**: Should list all commits grouped by type
- **Format**: Use markdown for better readability
- **Context**: Include relevant information from commit bodies

## Usage

1. Use the \`forge-pullrequest\` command in Cursor
2. The AI will:
   - Verify you're on a feature branch
   - Check that branch is pushed to remote
   - Validate all commits follow conventional format
   - Determine the base branch
   - Generate PR title and description
   - Create PR using GitHub MCP (preferred) or GH CLI (fallback)
   - Verify PR was created successfully
3. Review the PR details
4. Add reviewers, labels, or make changes as needed

## Error Scenarios

### Invalid Commits Detected
\`\`\`
Error: Found commits that don't follow Conventional Commits:
- abc1234: update readme (missing type)
- def5678: feat: Add feature (capitalized subject)

Please fix these commits before creating a PR:
1. Use \`git commit --amend\` for the last commit
2. Use \`git rebase -i <base>\` to fix multiple commits
\`\`\`

### Branch Not Pushed
\`\`\`
Error: Branch 'feature/xyz' is not pushed to remote.

Please push the branch first:
1. Use \`forge-push\` command to push safely
2. Then run \`forge-pullrequest\` again
\`\`\`

### On Main Branch
\`\`\`
Error: Cannot create PR from main branch.

Please switch to a feature branch:
1. Create a feature branch: \`git checkout -b feature/your-feature\`
2. Push your changes: \`forge-push\`
3. Create PR: \`forge-pullrequest\`
\`\`\`

### GitHub MCP Not Available
\`\`\`
Warning: GitHub MCP not available, falling back to GitHub CLI.

Attempting to create PR with \`gh pr create\`...
\`\`\`

### Both MCP and CLI Unavailable
\`\`\`
Error: Neither GitHub MCP nor GitHub CLI is available.

Please create PR manually:
1. Go to: https://github.com/<owner>/<repo>/compare/<base>...<head>
2. Fill in PR title and description
3. Click "Create Pull Request"
\`\`\`

## Goal

The goal of forge-pullrequest is to create pull requests with proper conventional commit validation, ensuring all commits follow industry standards before creating a PR. This maintains clean git history and makes PRs easier to review and understand.`;

/**
 * Map of command paths to their templates
 */
export const COMMAND_TEMPLATES: Record<string, string> = {
  '.cursor/commands/forge-refine.md': FORGE_REFINE_TEMPLATE,
  '.cursor/commands/forge-build.md': FORGE_BUILD_TEMPLATE,
  '.cursor/commands/forge-scribe.md': FORGE_SCRIBE_TEMPLATE,
  '.cursor/commands/forge-commit.md': FORGE_COMMIT_TEMPLATE,
  '.cursor/commands/forge-push.md': FORGE_PUSH_TEMPLATE,
  '.cursor/commands/forge-pullrequest.md': FORGE_PULLREQUEST_TEMPLATE
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

