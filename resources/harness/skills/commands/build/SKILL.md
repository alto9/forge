---
name: build
description: Build from Issue — branch setup, board In Progress, Engineer implements in build worktree, validation, Change Request, CI-gated board In Review.
disable-model-invocation: true
---

# Build

Drive **implementation from an Issue**: branch setup → **build worktree** → **Board `In Progress`** → implement → validate → commit/push → **Change Request** → **CI-gated Board `In Review`** → optional retrospective.

Invoke **Engineer** (**`.cursor/agents/engineer.md`**). Branch creation happens here, not during **`/refine`**.

---

## Input

- Issue link or reference

---

## Workflow

### 1. Parse and validate Issue

**`detect-provider`** → **`resolve_issue`**.

### 2. Resolve branch owner (mandatory)

**`resolve_issue_parentage`** → JSON:

- **`branch_owner_issue`** — owns integration branch
- **`input_issue`** — scope to implement
- **`suggested_branch`** — `feature/issue-{branch_owner_issue}`

Sub-issues **do not** get separate git branches.

### 3. Build worktree

1. Resolve **`repo-root`**, **`repoRef`**, superrepo root.
2. Create **`.cursor/.tmp/build-issue-{branch_owner_issue}/`** with **`session.md`**, **`worktrees.md`**.
3. **`worktree-workspace.sh create`**:
   - **`--role build`**
   - **`--branch feature/issue-{branch_owner_issue}`**
   - Reuse existing build worktree when manifest marks it **`active`** (refresh from origin).
4. **Rebase on `main`** (mandatory after branch exists):

```bash
git -C <wt-path> fetch origin main
git -C <wt-path> rebase origin/main
```

Resolve conflicts before continuing. Coordinate before force-with-lease push.

5. Active submodule checkout stays on **`main`**.

### 4. Board — start (`In Progress`)

When **`project.json`** configures a board, **`set_board_status`** via provider adapter:

| Situation | Issues to set In Progress |
|-----------|---------------------------|
| Sub-issue build | parent **and** sub-issue |
| Standalone issue | input issue only |
| Parent with subs, building parent | parent only |

Skip when board not configured.

### 5. Implementation (Engineer)

Inside **`<wt-path>`**:

- Implement **`input_issue`** scope
- Read peer submodules for cross-system contracts (constitution read-first rule)
- Run project validation (tests/lint/build); all must pass before commit
- Security scan on diff
- Conventional commit; push branch
- **`link_branch_to_issue`** when branch is new

### 6. Change Request

- If open CR exists for head branch, update title/body for current scope
- Else **`create_change_request`** via adapter
- Record CR URL in **`worktrees.md`**

### 7. Board — `In Review` (CI-gated)

Set parent to **`In Review`** only when **all** hold:

- Open CR with head **`feature/issue-{branch_owner_issue}`**
- Required CI checks passing (adapter or CI poll)
- Sub-issue completeness: no sub-issues **or** all sub-issues closed

Sub-issue builds: set sub-issue **`Done`**, parent **`In Review`** when parent-complete rules satisfied.

### 8. Optional doc sync

When **`project.json`** has **`doc_repo`** and parent scope is complete, sync documentation repo per product convention.

### 9. Retrospective

**`retrospective`** utility in **`issue`** mode on **`input_issue`**.

### 10. Worktree cleanup

Remove build worktree unless immediate re-review handoff needs it. Update manifest.

---

## Provider rules

- **Never** hardcode `gh` or `pull/N/head` in this skill's execution path
- **`detect-provider`** then **`provider/github`** or **`provider/gitlab`**
- CLI only in **non-sandboxed** terminal

## Goal

Change Request ready for **`/review`**, validation green, board updated when configured, build worktree documented.
