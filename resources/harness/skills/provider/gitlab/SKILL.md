---
name: gitlab
description: GitLab adapter for Issues, Merge Requests, Reviews, boards, and branch linking. Use after detect-provider returns gitlab.
---

# GitLab Provider Adapter

Implement provider operations for **GitLab** repositories. Call **`detect-provider`** first. Run **`glab`** only from a **non-sandboxed** terminal per **`.cursor/rules/provider-cli-terminal.mdc`**, or use GitLab MCP when available.

## Identity

Input context includes **`owner`** (group path), **`repo`**, **`repo_root`**, **`host`** from detection JSON.

Project path: **`group/subgroup/repo`** as returned by detection (preserve nested groups).

## Operations

### `resolve_issue`

**Input:** Issue IID or URL.

```bash
glab issue view <IID> --output json
```

Map to shared Issue shape (number, title, body, state).

### `resolve_issue_parentage`

**Input:** Issue IID.

GitLab may use issue links, epic relations, or workflow conventions. Determine **`branch_owner_issue`**, **`input_issue`**, **`suggested_branch`** = `feature/issue-{branch_owner_issue}`.

Emit one JSON line matching the GitHub adapter contract:

```json
{"branch_owner_issue":123,"input_issue":456,"suggested_branch":"feature/issue-123"}
```

Document linkage method in the adapter response when ambiguous.

### `resolve_change_request`

**Input:** MR IID or URL.

```bash
glab mr view <IID> --output json
```

### `fetch_change_request_head_ref`

**Input:** Merge Request IID.

Return branch name or commit SHA for `git fetch` + worktree add. **Command skills must call this adapter** instead of assuming GitHub-style pull refs.

Example:

```bash
glab mr view <IID> --output json | jq -r '.source_branch'
```

Then `git fetch origin <source_branch>`.

### `create_change_request`

**Input:** source branch, target branch (`main`), title, description.

```bash
glab mr create --source-branch <branch> --target-branch main --title "..." --description "..."
```

For **`.ai`-only** contract MRs, scope commit to `.ai` paths only.

### `link_branch_to_issue`

**Input:** Issue IID, branch name.

Create branch, push, open MR with `Closes #<IID>` or project-standard closing pattern in description.

### `submit_review`

**Input:** MR IID, verdict, body.

Use **`glab mr approve`**, **`glab mr revoke`**, or note APIs as appropriate. Formal review must be visible on the MR (approval state or structured note per project policy).

Map shared verdicts:

| Shared | GitLab |
|--------|--------|
| APPROVE | approve |
| REQUEST_CHANGES | unapprove + comment (or project equivalent) |
| COMMENT | comment only |

### `set_board_status`

**Input:** Issue IID, status label or board column, board config from **`project.json`**.

Skip when board is not configured.

### `list_milestones` / `list_milestone_issues`

For **`plan-roadmap`** utility.

### `post_comment`

**Input:** Issue or MR IID, body, target.

## `project.json` fields

Read **`gitlab_board`**, **`repository_url`**, or generic **`board`** when present. Exact schema varies by product; read the repo's JSON schema.

## Error handling

- **`glab: not found`** — instruct install or use MCP.
- **Self-managed GitLab** — honor **`host`** from detection (`GLAB_HOST` / `glab config`).
- **Missing scopes** — report token scopes needed for MR and issue APIs.

## Non-goals

- Do not merge MRs from QA `/review` workflow.
- Do not force-push without explicit user approval.
