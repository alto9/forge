<!-- forge-hash: 9af0be7af542d205f1212ac75799d7721d96ca622793dd29945f1c613693e74e -->

# Forge Refine

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

## Issue Structure

The GitHub issue body should contain the following sections:

```markdown
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
```

## Usage

1. Use the `forge-refine` command in Cursor
2. Provide the GitHub issue link: `https://github.com/owner/repo/issues/123`
3. The AI will help refine each section of the issue
4. Review and save changes back to GitHub
5. Once all required fields are complete, progress to Scribe mode

## Goal

The goal of Refinement mode is to get the original ticket in the most informed state possible, excluding technical implementation details. The business value must be clearly spelled out and accurate at the end of the refinement phase.