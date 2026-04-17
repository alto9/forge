---
name: gh-project-set-status
description: [git_flow|github-project] Set a GitHub Projects (v2) Status field for an issue using gh project
---

# GitHub Project item status

Sets the **Status** single-select field for an issue on a project board. Adds the issue to the project first if it is not already present.

Requires `gh` with **`project`** scope (`gh auth refresh -s project` if `gh project` commands fail with auth errors).

The script sets **`GH_PAGER=cat`** and **`GH_NO_UPDATE_NOTIFIER=1`** so stdout stays JSON-only for `jq` parsing.

## Usage

```
scripts/gh-project-set-status.sh <github_board_url> <owner/repo> <issue-number> <status-name>
```

- **github_board_url**: from `.forge/project.json` → `github_board` (e.g. `https://github.com/orgs/acme/projects/3`).
- **owner/repo**: repository containing the issue.
- **issue-number**: GitHub issue number.
- **status-name**: must match a **Status** column option label (e.g. `In Progress`, `In Review`) — comparison is case-insensitive.

Resolves project and field IDs via `gh project view`, `gh project field-list`, `gh project item-list`, then runs `gh project item-edit`.

After **Forge: Setup project for Cursor**, the runnable script lives at **`<workspace>/.cursor/skills/gh-project-set-status/scripts/gh-project-set-status.sh`** (paths in `.forge/skill_registry.json` are workspace-relative). Skills under `~/.cursor/skills` are separate unless you copy them into the project.

## Troubleshooting

If the script fails with JSON or `jq` errors:

1. Run **`gh --version`** and capture it when reporting issues.
2. Run the same calls your environment uses, e.g. **`gh project field-list <N> --owner <org> --format json`** (and `gh project view`, `gh project item-list`) and confirm the top-level value is a **JSON object or array**, not bare `true`/`false` or stderr mixed into stdout.
3. Run **`gh auth refresh -s project`** if you see auth or permission errors.
4. Confirm **`github_board`** in `.forge/project.json` is a Projects v2 URL (`.../orgs/.../projects/N` or `.../users/.../projects/N`), not the repository issues list.
