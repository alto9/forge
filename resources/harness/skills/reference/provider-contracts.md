# Provider Contracts Reference

Forge orchestration is **provider-neutral**. GitHub and GitLab may coexist in one superrepo (different submodules may use different remotes). Skills resolve the active provider per submodule and delegate to adapter skills.

## Shared vocabulary

| Term | GitHub | GitLab |
|------|--------|--------|
| **Issue** | GitHub Issue | GitLab Issue |
| **Change Request** | Pull Request (PR) | Merge Request (MR) |
| **Review** | PR review (approve / request changes / comment) | MR approval / unapproval / note thread |
| **Board** | GitHub Project (when `project.json` configures it) | GitLab board / issue board (when configured) |

Always use **Issue**, **Change Request**, **Review**, and **Board** in orchestration prose unless the adapter documents a provider-specific flag.

## Detection

Run **`detect-provider`** (**`.cursor/skills/provider/detect-provider/SKILL.md`**) with:

- **`repo-root`** or **`submodule-path`** for the owning product repository
- Optional **`remote-url`** override

Output (conceptual JSON line):

```json
{"provider":"github","owner":"acme","repo":"widget","remote":"origin","host":"github.com"}
```

```json
{"provider":"gitlab","owner":"acme","repo":"widget","remote":"origin","host":"gitlab.com"}
```

Orchestration skills **must not** assume `github.com` or hardcode `gh` / `glab`.

## Adapter skills

| Provider | Adapter skill | CLI (non-sandbox only) |
|----------|---------------|-------------------------|
| GitHub | **`.cursor/skills/provider/github/SKILL.md`** | `gh` |
| GitLab | **`.cursor/skills/provider/gitlab/SKILL.md`** | `glab` |

Adapters implement provider operations used by command skills:

| Operation | Used by |
|-----------|---------|
| Resolve Issue by ref | `/build`, `/refine`, `/intake` |
| Resolve Change Request by ref | `/review`, `/build-from-review` |
| Create / update Change Request | `/build`, `/ideate` (`.ai`-only CR) |
| Submit formal Review | `/review` |
| Fetch Change Request head for review worktree | `/review` |
| Link branch to Issue | `/build` |
| List / set Board status | `/build`, `/review`, `/plan-roadmap` |
| Resolve Issue parentage (parent vs sub-issue) | `/build`, `/refine` |
| Post retrospective comment | `/build`, `/review`, `retrospective` utility |

Command skills call adapters with **`provider:<operation>`** semantics documented in each adapter file. They **do not** embed `pull/<N>/head`, `gh pr create`, or `glab mr` flags directly.

## `project.json` provider fields

Typical fields (exact names may vary by product; read the repo schema):

| Field | Purpose |
|-------|---------|
| `name` | **`repoRef`** for worktree paths |
| `repository_url` or provider-specific URL | Remote identity; feeds **`detect-provider`** |
| `board` or `github_board` / `gitlab_board` | Board id for status updates (optional) |
| `doc_repo` | Documentation submodule name for post-build doc sync (optional) |

When a field is absent, skip the related orchestration step and report clearly.

## MCP vs CLI

Prefer provider MCP tools when configured and authenticated. Fall back to **`gh`** or **`glab`** via a **non-sandboxed** terminal per **`.cursor/rules/provider-cli-terminal.mdc`**.

## Multi-provider superrepos

When **`/ideate`** or **`/plan-roadmap`** touches multiple submodules:

1. Run **`detect-provider`** per affected **`repo-root`**.
2. Call the matching adapter for each Issue or Change Request operation.
3. Never assume all products share one host or one CLI.

## Error handling

- **Uninitialized submodule** — Stop and ask for `git submodule update --init <path>`.
- **Auth failure** — Report provider and suggest re-auth (`gh auth login`, `glab auth login`, or MCP auth).
- **Unsupported host** — Report detected host; do not guess API shapes.
