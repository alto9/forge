---
name: worktree-workspace
description: Create, list, or remove disposable worktrees under the central .worktrees layout; records paths for session manifests.
disable-model-invocation: true
---

# Worktree Workspace Utility

Manage disposable Git worktrees for Forge workflows. Full reference: **`.cursor/skills/reference/worktree-workspace.md`**.

## Script

**`.cursor/skills/utilities/worktree-workspace/scripts/worktree-workspace.sh`**

```bash
# List all registered worktree directories
worktree-workspace.sh list --superrepo "$SUPERREPO"

# Create contracts worktree
worktree-workspace.sh create \
  --superrepo "$SUPERREPO" \
  --repo-root "$REPO_ROOT" \
  --repo-ref "$REPO_REF" \
  --role contracts \
  --branch "ai/${SESSION_SLUG}" \
  --base origin/main \
  --session "$SESSION_SLUG"

# Remove build worktree
worktree-workspace.sh create ...  # see reference for build/review variants
worktree-workspace.sh remove \
  --superrepo "$SUPERREPO" \
  --repo-root "$REPO_ROOT" \
  --repo-ref "$REPO_REF" \
  --role build
```

## `worktreesRoot` resolution

1. Read **`.cursor/forge/manifest.json`** key **`worktreesPath`** when present (relative paths resolve from superrepo root).
2. Else **`{superrepo}/.worktrees`**.

## Session manifest

After create, append a row to **`.cursor/.tmp/<session>/worktrees.md`**:

```markdown
| repoRef | role | branch/ref | wt-path | cr-url | status |
```

Set **`session.md`** with `repoRef`, Issue refs, and provider id from **`detect-provider`**.

## Roles

| Role | Typical branch |
|------|----------------|
| `contracts` | `ai/<session-slug>` |
| `build` | `feature/issue-<N>` |
| `review` | adapter-resolved CR head |

## Rules

- Active submodule checkout stays on **`main`**.
- One path per **`{repoRef}/{role}`** in the central layout; remove before recreate unless reusing an active session manifest says otherwise.
- Review worktrees are read-only unless converting to build per **`/build-from-review`**.

## Goal

Predictable worktree paths every orchestration skill can share without editing the user's active checkout.
