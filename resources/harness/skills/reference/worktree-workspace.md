# Worktree Workspace Reference

Use this reference whenever a Forge workflow needs to read, edit, validate, or review a product repository without changing the user's active checkout. Product submodule checkouts stay on `main`, while contracts, builds, and reviews run in disposable worktrees under the superrepo.

## Roles and paths

Create worktrees per owning Git repository, not at the superproject root unless the work truly belongs to the superproject.

| Role | Branch or ref | Path pattern | Owner workflows |
|------|---------------|--------------|-----------------|
| `contracts` | `ai/<session-slug>` | `{worktreesRoot}/{repoRef}/contracts/` | `/ideate`, `/refine` |
| `build` | `feature/issue-<branch_owner_issue>` | `{worktreesRoot}/{repoRef}/build/` | `/build`, `/build-from-review` |
| `review` | Change Request head ref | `{worktreesRoot}/{repoRef}/review/` | `/review` |

**`worktreesRoot`** resolves from **`.cursor/forge/manifest.json`** key **`worktreesPath`** when present; otherwise **`{superrepo}/.worktrees`**.

**`repo-root`** is the Git repository that owns the files being worked on (usually a submodule path from `.gitmodules`).

**Helper script:** **`.cursor/skills/utilities/worktree-workspace/scripts/worktree-workspace.sh`** implements `create`, `remove`, and `list` for this layout.

## Lifecycle

1. Resolve `repo-root`, `repoRef`, branch/ref, role, and session slug before touching files.
2. Create the worktree at **`{worktreesRoot}/{repoRef}/{role}/`** via the helper script or equivalent `git worktree` commands.
3. Record the worktree in **`.cursor/.tmp/<session_slug>/worktrees.md`** before handoff to another phase.
4. Run filesystem reads, edits, validation, git commands, and local tooling from `<wt-path>` or with `git -C <wt-path>`.
5. Leave the active submodule checkout on `main`. Do not switch it just to satisfy the workflow.
6. Remove disposable worktrees after the Change Request / review / handoff step completes, or on abort.

Use `--force` only when Git refuses to remove a known disposable worktree. Never force-remove a path unless it matches the current session manifest or this reference's path pattern.

## Session manifest

Each orchestrated session keeps local-only handoff notes under **`.cursor/.tmp/<session_slug>/`**. These files are gitignored and must not be linked or pasted into Issues, Change Request bodies, or Review comments.

Required files for orchestrated sessions:

```text
.cursor/.tmp/<session_slug>/
  session.md
  worktrees.md
```

**`session.md`** records human-readable context: `repoRef`, remote `owner/repo`, `input_issue`, `branch_owner_issue`, Change Request URL, provider id, and explicit user constraints.

**`worktrees.md`** records one row per worktree:

```markdown
| repoRef | role | branch/ref | wt-path | cr-url | status |
|---------|------|------------|---------|--------|--------|
| kube9-web | build | feature/issue-123 | /abs/.worktrees/kube9-web/build | https://... | active |
```

Status values: `active`, `cr-opened`, `review-submitted`, `removed`, or `aborted`.

## Create patterns

**Contracts** (new branch):

```bash
worktree-workspace.sh create \
  --superrepo "$SUPERREPO" \
  --repo-root "$REPO_ROOT" \
  --repo-ref "$REPO_REF" \
  --role contracts \
  --branch "ai/${SESSION_SLUG}" \
  --base origin/main \
  --session "$SESSION_SLUG"
```

**Build** (existing branch):

```bash
worktree-workspace.sh create \
  --superrepo "$SUPERREPO" \
  --repo-root "$REPO_ROOT" \
  --repo-ref "$REPO_REF" \
  --role build \
  --branch "feature/issue-${BRANCH_OWNER_ISSUE}"
```

**Build** (new branch):

```bash
worktree-workspace.sh create \
  --superrepo "$SUPERREPO" \
  --repo-root "$REPO_ROOT" \
  --repo-ref "$REPO_REF" \
  --role build \
  --branch "feature/issue-${BRANCH_OWNER_ISSUE}" \
  --base origin/main
```

**Review** — resolve the Change Request head ref via the provider adapter (**`provider/github`** or **`provider/gitlab`**), then:

```bash
worktree-workspace.sh create \
  --superrepo "$SUPERREPO" \
  --repo-root "$REPO_ROOT" \
  --repo-ref "$REPO_REF" \
  --role review \
  --branch "<provider-resolved-head-ref>"
```

Do **not** hardcode `pull/<N>/head` in orchestration skills; the provider adapter returns the fetch ref for the Change Request head.

## Reuse rules

- Reuse one `build` worktree per `feature/issue-<branch_owner_issue>` branch and repo. Refresh with `git -C <wt-path> fetch origin` and rebase or pull as the workflow requires.
- Do not reuse a `review` worktree for edits. It is read-only inspection unless a workflow explicitly converts the session to build work.
- If the manifest names a worktree but the path is gone, create a new worktree and update the manifest instead of failing the workflow.

## Cleanup checklist

Before ending an orchestrated session:

```bash
worktree-workspace.sh remove \
  --superrepo "$SUPERREPO" \
  --repo-root "$REPO_ROOT" \
  --repo-ref "$REPO_REF" \
  --role <role>
```

Keep a build worktree only when the next explicit handoff needs it. If kept, mark it `active` in `worktrees.md` and include the branch and Change Request URL in the user-facing summary.
