---
name: worktree-workspace
description: Create, list, or remove disposable worktrees under the central .worktrees layout; session-scoped paths for multi-human command runs.
disable-model-invocation: true
---

# Worktree Workspace Utility

Manage disposable Git worktrees for top-level Forge commands. Full reference: **`.cursor/skills/reference/worktree-workspace.md`**.

## Script

**`.cursor/skills/utilities/worktree-workspace/scripts/worktree-workspace.sh`**

```bash
worktree-workspace.sh list --superrepo "$SUPERREPO"

worktree-workspace.sh create \
  --superrepo "$SUPERREPO" \
  --repo-root "$REPO_ROOT" \
  --repo-ref "$REPO_REF" \
  --role contracts|build|review \
  --branch "$BRANCH" \
  --session "$SESSION_SLUG" \
  [--base origin/main]

worktree-workspace.sh remove \
  --superrepo "$SUPERREPO" \
  --repo-root "$REPO_ROOT" \
  --repo-ref "$REPO_REF" \
  --role contracts|build|review \
  --session "$SESSION_SLUG" \
  [--force]
```

**`--session` is required** for create and remove.

## Path pattern

```text
{worktreesRoot}/{repoRef}/{role}-{session}/
```

## `worktreesRoot` resolution

1. **`.cursor/forge/manifest.json`** → **`worktreesPath`** (relative paths from superrepo root).
2. Else **`{superrepo}/.worktrees`**.

## Session manifest

After create, append a row to **`.cursor/.tmp/<session>/worktrees.md`**. Nested agents in the same top-level command share this session. Do not read another command’s tmp.

## Rules

- Active submodule checkout stays on **`main`**.
- Top-level commands must remove every worktree they created before ending.
- Cross-command / cross-human handoff is via Issue, Change Request, and branch on the remote only.
