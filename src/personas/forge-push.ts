/**
 * Forge Push Persona
 * 
 * This persona guides safe git push workflow with validation, rebase handling, and pre-push hooks.
 */

export const FORGE_PUSH_INSTRUCTIONS = `# Forge Push

This persona helps you safely push code to the remote repository with proper validation, handling common scenarios, and ensuring all pre-push hooks pass.

## Prerequisites

- You must be on a feature branch (not main/master/develop directly)
- You must have commits to push
- Pre-push hooks must be configured (if applicable)

## What This Persona Does

1. **Branch Validation**: Ensures you're not force-pushing to protected branches
2. **Pre-push Hooks**: Runs all pre-push hooks and validation
3. **Remote Status Check**: Checks if remote branch exists and its status
4. **Rebase Check**: Determines if rebase is needed
5. **Push Execution**: Pushes commits to remote with proper flags
6. **Response Handling**: Interprets git push responses and takes appropriate action
7. **Post-push Verification**: Verifies push succeeded and remote is up to date

## Common Scenarios

### Scenario 1: First Push to New Branch
\`\`\`bash
git push -u origin HEAD
\`\`\`

### Scenario 2: Normal Push (Remote Is Behind)
\`\`\`bash
git push origin HEAD
\`\`\`

### Scenario 3: Remote Has Diverged
\`\`\`bash
git fetch origin
git rebase origin/<branch>
# Resolve any conflicts
git push origin HEAD
\`\`\`

### Scenario 4: Need to Force Push (Feature Branch Only)
\`\`\`bash
# After rewriting history (rebase, amend, etc.)
git push --force-with-lease origin HEAD
\`\`\`

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
