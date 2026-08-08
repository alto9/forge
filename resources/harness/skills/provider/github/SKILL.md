---
name: github
description: GitHub adapter for Issues, Pull Requests, Reviews, Projects board, and branch linking. Use after detect-provider returns github.
---

# GitHub Provider Adapter

Implement provider operations for **GitHub** repositories. Call **`detect-provider`** first. Run **`gh`** only from a **non-sandboxed** terminal per **`.cursor/rules/provider-cli-terminal.mdc`**, or use GitHub MCP when available.

## Identity

Input context includes **`owner`**, **`repo`**, **`repo_root`** from detection JSON.

Full slug: **`owner/repo`** (use `-R owner/repo` with `gh` when cwd is not the repo).

## Operations

### `resolve_issue`

**Input:** Issue number or URL.

```bash
gh issue view <N> -R owner/repo --json number,title,body,state,labels,parent
```

Return normalized Issue fields for orchestration.

### `resolve_issue_parentage`

**Input:** Issue number.

Determine **`branch_owner_issue`** (parent when input is a sub-issue; else input issue), **`input_issue`**, **`suggested_branch`** = `feature/issue-{branch_owner_issue}`.

Use GitHub sub-issue APIs or **`gh api`** when parent linkage is required. Emit one JSON line:

```json
{"branch_owner_issue":123,"input_issue":456,"suggested_branch":"feature/issue-123"}
```

### `resolve_change_request`

**Input:** PR number or URL.

```bash
gh pr view <N> -R owner/repo --json number,title,body,headRefName,baseRefName,state,url
```

### `fetch_change_request_head_ref`

**Input:** Change Request number.

Return a **fetch ref** suitable for `git fetch` + worktree add. Preferred approach:

```bash
gh pr checkout <N> --detach   # inspect only; orchestration uses worktree script
```

For review worktrees, adapter returns **`refs/pull/<N>/head`** or the branch name when the PR is from the same repo. **Command skills must call this adapter** instead of hardcoding `pull/<N>/head`.

### `create_change_request`

**Input:** head branch, base (`main`), title, body.

```bash
gh pr create --head <branch> --base main --title "..." --body "..."
```

For **`.ai`-only** contract PRs from ideation/refine, scope commit to `.ai` paths only.

### `link_branch_to_issue`

**Input:** Issue number, branch name.

```bash
gh issue develop <issue> --name <branch> --base main
```

Fallback: create branch locally, push, mention Issue in PR body.

### `submit_review`

**Input:** PR number, event (`APPROVE` | `REQUEST_CHANGES` | `COMMENT`), body.

Prefer GitHub MCP **`pull_request_review_write`**. Fallback:

```bash
gh pr review <N> --approve|--request-changes|--comment --body "..."
```

Must produce a record on the PR **Reviews** tab, not merely `gh pr comment`.

### `set_board_status`

**Input:** Issue number, status string (e.g. `In Progress`, `In Review`, `Done`), board id from **`project.json`**.

Use project automation scripts or **`gh project item-edit`** when configured. Skip when board id is absent.

### `list_milestones` / `list_milestone_issues`

Wrappers for roadmap planning (`plan-roadmap` utility). Return JSON for Planner gap analysis.

### `post_comment`

**Input:** Issue or PR number, body, target (`issue` | `pr`).

For workflow retrospectives and handoff notes on the tracker (never paste `.cursor/.tmp` paths).

## Board field names

Read **`.ai/project.json`** for **`github_board`** (project number or node id). Status strings must match the project's configured options.

## Error handling

- **`gh: not found`** — instruct install or use MCP.
- **403 / auth** — `gh auth status`, suggest `gh auth refresh -s project` when Projects scope is missing.
- **Fork PR** — Issue may live in base repo; use base **`owner/repo`** for parentage and board updates.

## Non-goals

- Do not merge PRs from QA `/review` workflow.
- Do not force-push without explicit user approval.
