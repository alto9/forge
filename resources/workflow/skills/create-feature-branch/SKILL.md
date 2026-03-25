---
name: create-feature-branch
description: [git_flow|branch-create] Create a feature branch from the root branch
---

# Create Feature Branch

Use the provided script to create a new branch from the specified root branch.

## Usage

Run the script: `scripts/create-feature-branch.sh <branch-name> [root-branch]`

Default root branch is `main`.

- **Refine (parent issue):** `feature/issue-{parent-number}` from `main` only. Refine does **not** create branches for sub-issues.
- **Build or forge-setup-issue:** `feature/issue-{N}` from `main` when implementing the top-level issue, or from `feature/issue-{parent}` when implementing a **sub-issue** so work stacks on the parent branch.

When present, check CONTRIBUTING.md for project-specific branching conventions (e.g. `feature/issue-N`, `fix/scope`).
