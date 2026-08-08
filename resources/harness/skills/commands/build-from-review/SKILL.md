---
name: build-from-review
description: Engineer applies Change Request review feedback on existing branch; re-validate, push, optional parent In Review when CI and ticket complete.
disable-model-invocation: true
---

# Build from Review

**Engineer** second pass: apply **Review** feedback on an existing Change Request branch while preserving original Issue intent.

---

## Input

- Change Request URL or reference (PR or MR)

---

## Workflow

### 1. Parse Change Request

**`detect-provider`** → **`resolve_change_request`**.

Load Reviews, review comments, and conversation threads requesting changes.

### 2. Resolve branch owner

From linked Issues / closing keywords → **`resolve_issue_parentage`**.

Expected build branch: **`feature/issue-{branch_owner_issue}`**.

If CR head branch differs, continue only when CR is source of truth; report mismatch before board updates.

### 3. Build worktree

1. Prefer **`.cursor/.tmp/build-from-github-issue-{branch_owner_issue}/worktrees.md`** when present.
2. If active build worktree exists, refresh:

```bash
git -C <wt-path> fetch origin
git -C <wt-path> pull --rebase
```

3. Else **`worktree-workspace.sh create --role build --branch <cr-head-branch>`**.
4. Do not checkout CR branch in user's active submodule checkout.

### 4. Engineer handoff

Inside **`<wt-path>`**:

- Address Review feedback; preserve Issue acceptance scope
- Run validation; all must pass before commit
- Security scan
- Commit and push
- Update **`worktrees.md`**

### 5. Board — parent `In Review` (optional)

When board configured, apply same **parent ticket complete** rules as **`/build-from-github`** after push and green required CI.

Do not set sub-issues **`Done`** here (that remains **`/build-from-github`**).

### 6. Worktree handoff

Keep build worktree **`active`** when re-review is imminent; else **`worktree-workspace.sh remove --role build`**.

---

## Provider rules

Use adapter **`fetch_change_request_head_ref`** only through **`provider/github`** or **`provider/gitlab`**, not hardcoded fetch refs.

## Goal

Updated Change Request ready for QA re-review; board repaired when configured and completion criteria met.
