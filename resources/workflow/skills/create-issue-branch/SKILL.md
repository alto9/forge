---
name: create-issue-branch
description: [git_flow|branch-create] Create an issue branch from the specified root branch
---

# Create Issue Branch

Use the provided script to create a branch linked to a GitHub issue (`gh issue develop`). Requires the GitHub CLI (`gh`).

## Alto9 / Forge policy (sub-issues)

Run **`resolve-issue-parentage`** first (see **`resources/workflow/commands/build-from-github.md`**). Use **`branch_owner_issue`** and **`suggested_branch`** from its JSON output — never create **`feature/issue-{child}`** for a sub-issue.

For **sub-issues**, do **not** pass the **child** issue number to this skill. Create or link **`suggested_branch`** with issue number **`branch_owner_issue`** only. See **`resources/workflow/commands/build-from-github.md`** and **`resources/workflow/agents/engineer.md`**. **Technical Writer** / refinement does **not** call this skill; branches are created in the **build** phase only.

## Usage

**From a skill install or any directory** (explicit repo):

`scripts/create-issue-branch.sh <owner/repo> <branch-name> <issue-number> <root-branch>`

Example: `scripts/create-issue-branch.sh myorg/myrepo feature/issue-42 42 main`

**From a gh-linked clone** (repo inferred):

- `scripts/create-issue-branch.sh <branch-name> <issue-number>` — base branch `main`
- `scripts/create-issue-branch.sh <branch-name> <issue-number> <root-branch>`

### Arguments

- **owner/repo** — Four-argument form only; same shape as `gh --repo`.
- **branch-name** — Name for the new branch.
- **issue-number** — Issue number or URL, as accepted by `gh issue develop`.
- **root-branch** — Remote branch to branch from (e.g. `main` or a parent feature branch).

When present, check CONTRIBUTING.md for project-specific branching conventions (e.g. `feature/issue-N`, `fix/scope`).

### Checkout

If the current directory is a clone of the same `owner/repo`, the script passes `--checkout` so the new branch is checked out locally. Otherwise the branch is still created and linked on GitHub.

### Output

The script prints the new branch name on stdout.
