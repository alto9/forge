# Refine Issue (Step 4: Refining)

This command invokes the Technical Writer agent to maintain development-ready GitHub issues.

## Input

- GitHub issue link (`https://.../issues/123`, `owner/repo#123`, or `123`)

## Workflow

1. Retrieve issue text from GitHub using available tools.
2. **skill: create-feature-branch {child} main** – Create parent branch: `create-feature-branch feature/issue-{parent-number} main`.
3. Consult SME Agents (Runtime, BusinessLogic, Data, Interface, Integration, Operations) for technical information and implementation guides.
4. Update issue based on the issue template; ensure all required details are included.
5. Create sub-issues on the parent ticket (always at least one).
6. **skill: create-feature-branch {child} {parent}** – For each sub-issue: `create-feature-branch feature/issue-{child-number} feature/issue-{parent-number}`. Sub-issues merge into the parent branch for a single PR to main.

## Goal

Refined tickets ready for development with no ambiguity.
