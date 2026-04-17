---
name: gh-project-set-status
description: [git_flow|github-project] Set a GitHub Projects (v2) Status field for an issue using gh project
---

# GitHub Project item status

Sets the **Status** single-select field for an issue on a project board. Adds the issue to the project first if it is not already present.

Requires `gh` with **`project`** scope (`gh auth refresh -s project` if `gh project` commands fail with auth errors).

## Usage

```
scripts/gh-project-set-status.sh <github_board_url> <owner/repo> <issue-number> <status-name>
```

- **github_board_url**: from `.forge/project.json` → `github_board` (e.g. `https://github.com/orgs/acme/projects/3`).
- **owner/repo**: repository containing the issue.
- **issue-number**: GitHub issue number.
- **status-name**: must match a **Status** column option label (e.g. `In Progress`, `In Review`) — comparison is case-insensitive.

Resolves project and field IDs via `gh project view`, `gh project field-list`, `gh project item-list`, then runs `gh project item-edit`.
