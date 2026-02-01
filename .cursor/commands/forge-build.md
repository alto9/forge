<!-- forge-hash: 809cc75ec6d1e1bf499c8e34bb47d9a4e039abea99c67fb4739bc24012fdb2cf -->

# Forge Build

This command helps you implement a GitHub issue by analyzing the codebase, issue content, and ensuring all tests pass.

## Prerequisites

You must provide a GitHub issue link when using this command. The issue should be a sub-issue ready for implementation.

## What This Command Does

1. **Reads the GitHub issue**: Understands what needs to be implemented from the issue content
2. **Analyzes the existing codebase**: Understands current implementation patterns and structure
3. **Analyzes GitHub Actions**: Reviews GitHub Actions workflows for lint/test/validation scripts
4. **Analyzes package scripts**: Reviews package.json scripts for lint/test/validation commands
5. **Implements the changes**: Writes actual code as described in the issue
6. **Writes tests**: Creates unit tests based on the test procedures in the issue
7. **Runs validation**: Executes lint, test, and validation scripts before considering the task complete
8. **Marks issue as complete**: Updates the GitHub issue status to 'closed' when all work is done and tests pass

## Important Guidelines

- **Follow the issue**: Implement exactly what the issue describes
- **Review test procedures**: Pay special attention to the "Testing Procedures" section in the issue
- **Match existing patterns**: Follow the codebase's existing architecture and conventions
- **Run all checks**: Before marking complete, ensure:
  - All lint checks pass (`npm run lint` or equivalent)
  - All tests pass (`npm run test` or equivalent)
  - All validation scripts pass (`npm run validate` or equivalent)
- **Use Plan mode**: When using in Cursor, use Plan mode to review the implementation plan before executing
- **Stay focused**: If the issue is too large, suggest breaking it into smaller sub-issues
- **Mark as complete**: Update the GitHub issue status to 'closed' when all work is done and all checks pass

## Usage

1. Use the `forge-build` command in Cursor
2. Provide the GitHub issue link: `https://github.com/owner/repo/issues/123`
3. Use **Plan mode** in Cursor to review the implementation plan before executing
4. The AI will analyze the issue and codebase
5. The AI will implement the changes with tests
6. The AI will run lint/test/validation scripts
7. Review and commit the implementation
8. Mark the issue as complete in GitHub

## Testing Requirements

- **Analyze GitHub Actions**: Check `.github/workflows/` for CI/CD test and lint scripts
- **Analyze package.json**: Check `package.json` for `lint`, `test`, `validate` scripts
- **Run all checks**: Execute all relevant lint/test/validation commands before completion
- **All must pass**: The task is not considered complete until all tests and lint checks pass

The implementation will be consistent with your codebase patterns and all validation checks will pass.