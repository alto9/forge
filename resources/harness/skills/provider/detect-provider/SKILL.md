---
name: detect-provider
description: Resolve git hosting provider (github or gitlab) from a submodule remote URL or repo-root; emits JSON for adapter dispatch.
---

# Detect Provider

Resolve which **provider adapter** to use for a product repository. Orchestration skills call this before any Issue, Change Request, Review, or Board operation.

## Input

- **`repo-root`** — Path to the owning Git repository (submodule root).
- Optional **`remote`** — Git remote name (default: `origin`).

## Output

Print **one JSON line** to stdout:

```json
{"provider":"github","owner":"acme","repo":"widget","remote":"origin","host":"github.com","repo_root":"/abs/path/to/repo"}
```

Supported **`provider`** values: **`github`**, **`gitlab`**.

## Algorithm

1. `git -C <repo-root> remote get-url <remote>`
2. Parse host and path:
   - `git@github.com:owner/repo.git` → github
   - `https://github.com/owner/repo.git` → github
   - `git@gitlab.com:group/repo.git` → gitlab
   - `https://gitlab.com/group/repo.git` → gitlab
   - Self-managed GitLab hosts match `gitlab` when host is not `github.com`
3. Normalize **`owner/repo`** (GitLab may use nested groups; preserve full path with slashes).
4. If host is unrecognized, exit non-zero with a clear message.

## Dispatch

| `provider` | Next skill |
|------------|------------|
| `github` | **`.cursor/skills/provider/github/SKILL.md`** |
| `gitlab` | **`.cursor/skills/provider/gitlab/SKILL.md`** |

Command skills **must not** call `gh` or `glab` until **`detect-provider`** selects the adapter.

## Examples

```bash
# From superrepo root
git -C kube9/kube9-web remote get-url origin
# → feed repo-root kube9/kube9-web
```

When multiple submodules are in scope (ideation, plan-roadmap), run detection **per repo-root**.
