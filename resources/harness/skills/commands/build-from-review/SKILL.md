---
name: build-from-review
description: Engineer applies Change Request review feedback on existing branch; re-validate, push, optional parent In Review when CI and ticket complete.
disable-model-invocation: true
---

# Build from Review

**Engineer** second pass: apply **Review** feedback on an existing Change Request branch while preserving original Issue intent.

## Session ownership (this command)

- Mint **`session_slug`** (recommended: `build-from-review-cr-<N>`). Create **`.cursor/.tmp/<session_slug>/`**.
- **Do not** read `.tmp` from a prior `/build-from-github` or `/review` on this or another workstation.
- Create a **new** session-scoped build worktree from the CR head / `feature/issue-{N}` via provider + **`origin`**.
- Before ending: **always** remove that build worktree. Next `/review` starts from the CR URL.
- Reference: **`.cursor/skills/reference/worktree-workspace.md`**.

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

1. Create **`.cursor/.tmp/<session_slug>/`** with **`session.md`**, **`worktrees.md`**.
2. Resolve head branch from the CR (remote). Fetch as needed.
3. **`worktree-workspace.sh create --role build --branch <cr-head-or-feature-branch> --session <session_slug>`**.
4. Refresh from origin inside the new tree:

```bash
git -C <wt-path> fetch origin
git -C <wt-path> pull --rebase
```

5. Do not checkout the CR branch in the user's active submodule checkout.

### 4. Engineer handoff

Inside **`<wt-path>`** from this session:

- Address Review feedback; preserve Issue acceptance scope
- Run validation; all must pass before commit
- Security scan
- Commit and push
- Update **`worktrees.md`**

### 5. Board — parent `In Review` (optional)

When board configured, apply same **parent ticket complete** rules as **`/build-from-github`** after push and green required CI.

Do not set sub-issues **`Done`** here (that remains **`/build-from-github`**).

### 6. Teardown (mandatory)

```bash
worktree-workspace.sh remove \
  --superrepo "$SUPERREPO" \
  --repo-root "$REPO_ROOT" \
  --repo-ref "$REPO_REF" \
  --role build \
  --session "$SESSION_SLUG"
```

Always remove on success and on abort.

---

## Provider rules

Use adapter **`fetch_change_request_head_ref`** only through **`provider/github`** or **`provider/gitlab`**, not hardcoded fetch refs.

## Goal

Updated Change Request ready for QA re-review; session build worktree removed; board repaired when configured.
