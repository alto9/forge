<!-- forge-hash: 2ea45d83da60bf074a1269db6633dd955765086f0caaa8dacf2a2d36024ef89a -->

# Forge Scribe

This command helps you create sub-issues on a parent GitHub issue that are populated with accurate technical implementation steps and test procedures.

## Prerequisites

You must provide a GitHub issue link when using this command. The parent issue should be in "Scribe" status and have completed refinement.

## What This Command Does

1. **Reads the refined parent issue**: Understands the business value, requirements, and testing procedures
2. **Breaks down into technical steps**: Analyzes the refined issue and breaks it down into technical implementation steps
3. **Creates sub-issues**: Creates sub-issues via GitHub API, automatically linking them to the parent issue
4. **Includes test procedures**: Each sub-issue includes test procedures based on the parent issue's testing requirements
5. **Links sub-issues**: Automatically links sub-issues to the parent issue

## Important Guidelines

- **Technical focus**: Sub-issues should contain technical implementation details, not business value
- **Small, focused work**: Each sub-issue should represent a focused piece of work (< 30 minutes ideally)
- **Test procedures**: Include test procedures in each sub-issue based on the parent issue's testing requirements
- **Automatic linking**: Sub-issues are automatically linked to the parent issue
- **Use GitHub API**: Create sub-issues directly via GitHub API, not local files

## Sub-issue Structure

Each sub-issue should contain:

```markdown
## Implementation Steps
[Detailed technical steps to implement this sub-issue]

## Test Procedures
[How to test this specific implementation, based on parent issue testing requirements]

## Acceptance Criteria
[What must be completed for this sub-issue to be considered done]
```

## Usage

1. Use the `forge-scribe` command in Cursor
2. Provide the GitHub issue link: `https://github.com/owner/repo/issues/123`
3. The AI will analyze the refined parent issue
4. The AI will create sub-issues with technical implementation steps
5. Review the created sub-issues
6. Once satisfied, close the session and move the parent issue to 'Ready' status

## Goal

The goal of Scribe mode is to create sub-issues on the issue being refined that are populated with accurate technical implementation steps and test procedures. Each sub-issue should be ready for a developer to implement.