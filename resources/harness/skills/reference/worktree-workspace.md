# Worktree Workspace Reference

Use this reference whenever a top-level Forge **command** needs to read, edit, validate, or review a product repository without changing the user's active checkout. Product submodule checkouts stay on `main`. Disposable worktrees live under the superrepo’s configured worktrees root.

## Multi-human / multi-workstation contract

Isolation applies to **top-level commands** (`/ideate`, `/intake`, `/refine`, `/build-from-github`, `/build-from-review`, `/review`):

1. **Command owns the session** — Mint `{session_slug}` at start. When the command uses tmp, create `.cursor/.tmp/{session_slug}/` with `session.md` and `worktrees.md`.
2. **In-run sharing OK** — Nested agents and utilities share **this** session’s tmp and worktrees for the duration of the command.
3. **No cross-command local dependency** — Do not read another top-level command’s `.tmp`. Resolve state from Issue / Change Request / `origin`.
4. **Mandatory worktree teardown** — Before the command ends (success or abort), remove every worktree this command created.
5. **Remote handoff** — The next human or command continues from tracker URLs and branches, not leftover local trees.

`/intake` creates neither tmp nor worktrees.

## Roles and paths

| Role | Branch or ref | Path pattern | Owner commands |
|------|---------------|--------------|----------------|
| `contracts` | `ai/<session-slug>` | `{worktreesRoot}/{repoRef}/contracts-{session}/` | `/ideate`, `/refine` |
| `build` | `feature/issue-<branch_owner_issue>` | `{worktreesRoot}/{repoRef}/build-{session}/` | `/build-from-github`, `/build-from-review` |
| `review` | Change Request head ref | `{worktreesRoot}/{repoRef}/review-{session}/` | `/review` |

**`worktreesRoot`** resolves from **`.cursor/forge/manifest.json`** key **`worktreesPath`** when present; otherwise **`{superrepo}/.worktrees`**.

**`repo-root`** is the Git repository that owns the files (usually a submodule path from `.gitmodules`).

**Helper script:** **`.cursor/skills/utilities/worktree-workspace/scripts/worktree-workspace.sh`** (`create`, `remove`, `list`). **`--session` is required** for create and remove.

## Lifecycle

1. Resolve `repo-root`, `repoRef`, branch/ref, role, and **session slug** before touching files.
2. Create the worktree at **`{worktreesRoot}/{repoRef}/{role}-{session}/`**.
3. Record the worktree in **`.cursor/.tmp/<session_slug>/worktrees.md`**.
4. Run reads, edits, validation, and git from `<wt-path>` or `git -C <wt-path>`.
5. Leave the active submodule checkout on `main`.
6. Remove disposable worktrees before the top-level command ends (success or abort).

Use `--force` only when Git refuses to remove a known disposable worktree for **this** session. Never force-remove a path that is not in the current session manifest.

## Session manifest

```text
.cursor/.tmp/<session_slug>/
  session.md
  worktrees.md
```

Gitignored. Do not paste tmp paths into Issues, Change Request bodies, or Review comments as the durable handoff.

**`session.md`:** `repoRef`, remote `owner/repo`, `input_issue`, `branch_owner_issue`, Change Request URL, provider id, user constraints.

**`worktrees.md`:**

```markdown
| repoRef | role | branch/ref | wt-path | cr-url | status |
|---------|------|------------|---------|--------|--------|
| kube9-web | build | feature/issue-123 | /abs/.worktrees/kube9-web/build-build-issue-123 | https://... | active |
```

Status values: `active`, `cr-opened`, `review-submitted`, `removed`, or `aborted`.

## Create patterns

Always pass **`--session`**.

**Contracts:**

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
  --branch "feature/issue-${BRANCH_OWNER_ISSUE}" \
  --session "$SESSION_SLUG"
```

**Build** (new branch):

```bash
worktree-workspace.sh create \
  --superrepo "$SUPERREPO" \
  --repo-root "$REPO_ROOT" \
  --repo-ref "$REPO_REF" \
  --role build \
  --branch "feature/issue-${BRANCH_OWNER_ISSUE}" \
  --base origin/main \
  --session "$SESSION_SLUG"
```

**Review** — resolve head ref via provider adapter, then:

```bash
worktree-workspace.sh create \
  --superrepo "$SUPERREPO" \
  --repo-root "$REPO_ROOT" \
  --repo-ref "$REPO_REF" \
  --role review \
  --branch "<provider-resolved-head-ref>" \
  --session "$SESSION_SLUG"
```

Do **not** hardcode `pull/<N>/head` in orchestration skills.

## Same-session vs cross-command

- **Same top-level command run:** reuse the worktrees already recorded in this session’s `worktrees.md`.
- **Different command or different human:** create a new session and new worktrees from remote state. Never require another command’s `.tmp`.

## Cleanup

Before ending a top-level command:

```bash
worktree-workspace.sh remove \
  --superrepo "$SUPERREPO" \
  --repo-root "$REPO_ROOT" \
  --repo-ref "$REPO_REF" \
  --role <role> \
  --session "$SESSION_SLUG"
```

Update `worktrees.md` status to `removed` (or `aborted`). Durable handoff is the remote Issue / Change Request / branch only.
