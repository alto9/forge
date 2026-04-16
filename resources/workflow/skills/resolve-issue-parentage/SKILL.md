---
name: resolve-issue-parentage
description: [git_flow|github-issue] Resolve whether an issue is a sub-issue and which issue number owns the feature branch (feature/issue-{N}).
---

# Resolve Issue Parentage

Use this skill at the start of **`/build-from-github`** (or Engineer branch setup) before creating or checking out a branch. It calls GitHub’s sub-issue API and prints **one JSON object on stdout** for scripts and agents to consume.

Requires the GitHub CLI (`gh`).

## When to use

- **`/build-from-github`** / **Engineer**: first step for branch naming and linking.
- **`/refine-issue`** orchestration: normalize a sub-issue link to its **parent** before Technical Writer runs (listed under `command_assignments.refine-issue` and `agent_assignments.tech_writer` in `.forge/skill_registry.json`).
- Any time you need **`branch_owner_issue`**: the issue whose line of work uses **`feature/issue-{branch_owner_issue}`** (the **parent** when the input is a **sub-issue**; otherwise the input issue itself).

## Usage

`scripts/resolve-issue-parentage.sh <owner/repo> <issue-number>`

`scripts/resolve-issue-parentage.sh <issue-number>` (repo inferred from `gh` in a linked clone)

### Arguments

- **owner/repo** — `OWNER/REPO` or `HOST/OWNER/REPO` when not in a gh-linked clone.
- **issue-number** — Visible issue number or issue URL.

### Output (stdout)

Single JSON object, one line:

| Field | Type | Meaning |
|-------|------|--------|
| `input_issue` | number | Issue that was queried |
| `is_sub_issue` | boolean | `true` if this issue is a GitHub sub-issue of another |
| `parent_issue` | number or null | Parent issue number when `is_sub_issue`; else `null` |
| `branch_owner_issue` | number | Issue number that owns **`feature/issue-{branch_owner_issue}`** |
| `suggested_branch` | string | `feature/issue-{branch_owner_issue}` |

**404** from the parent endpoint (issue is not a sub-issue) is treated as **top-level**: `is_sub_issue` false, `branch_owner_issue` equals `input_issue`.

### Exit codes

- **0** — JSON printed successfully.
- **1** — Auth/network error, invalid arguments, or unreadable API response (stderr has details).

### Examples

```bash
scripts/resolve-issue-parentage.sh myorg/myrepo 121
scripts/resolve-issue-parentage.sh 121
```

### Requirements

- **GitHub CLI (`gh`)** authenticated for the repository.
- **Python 3** (for parsing JSON from a successful parent response).
