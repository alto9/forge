# Forge Studio

Forge Studio is a **Visual Studio Code** / **Cursor** extension that configures a **git superrepo** for AI-assisted development: submodules, a central worktrees folder, and a project-local agent harness under `.cursor/`.

Product contracts stay in each submodule’s **`.ai/`** tree. Forge does not invent a consumer `.forge/` root.

## Overview

- **Initialize Superrepo** – Pick a root, edit `.gitmodules` entries, set `{superrepo}/.worktrees`, then install the harness into `{superrepo}/.cursor/`.
- **Update Harness** – Replace managed harness files from the VSIX bundle using `.cursor/forge/manifest.json`.
- **Open Superrepo Config** – Re-open the same configuration UI after init.

Harness source of truth ships in this repo at `resources/harness/` and is copied into the superrepo on init/update.

## Quick start

1. Install the extension (Marketplace or VSIX).
2. Open your superrepo folder in VS Code or Cursor.
3. Command Palette → **Forge: Initialize Superrepo**.
4. Confirm or add submodules (remote, name, path, branch). GitHub and GitLab remotes can coexist.
5. Confirm the worktrees path (default `.worktrees`).
6. Click **Initialize Super-Repo**. Progress runs: Submodules → Worktrees → Configuration → Harness.

After init you have:

```text
{superrepo}/
  .gitmodules
  .worktrees/                 # gitignored disposable worktrees
  .cursor/
    forge/manifest.json       # Forge version + managed paths
    agents/                   # Architect, PO, Planner, …
    skills/commands/          # /ideate, /intake, /refine, /build, …
    skills/provider/          # GitHub + GitLab adapters
    skills/utilities/         # setup-submodule, worktrees, …
    rules/                    # constitution, persona, CLI rules
    .tmp/                     # session state (gitignored)
```

Each product submodule keeps its own `.ai/` (`vision.json`, `project.json`, `knowledge_map.json`, domains). Use the **SetupSubmodule** skill when a submodule is missing that structure.

## Human-callable skills

Invoke with `/<skill-name>` in Agent chat after the harness is installed:

| Skill | Purpose |
|-------|---------|
| `/ideate` | Large initiative: PO + Architect (+ SMEs) + Marketing Manager; session under `.cursor/.tmp/` |
| `/intake` | Small feature/defect → single issue; inline Q&A; no tmp folder |
| `/refine` | Technical Writer refines an issue; contracts worktree; no feature branches |
| `/build` | Implement from ticket in a build worktree; Engineer |
| `/build-from-review` | Second pass from Change Request review comments |
| `/review` | Quality Assurance formal review (no merge) |

Supporting utilities include `/plan-roadmap`, `/audit-contracts`, worktree helpers, and provider adapters (GitHub `gh` / GitLab `glab`).

### Models

Agent frontmatter sets `model: inherit` (Think/Standard roles) or `model: fast` (domain SMEs). Policy: `resources/harness/skills/reference/model-policy.md` (installed to `.cursor/skills/reference/model-policy.md`). Architect must invoke SMEs as `Task(subagent_type="*-sme")`, not `generalPurpose`.

## Worktrees

All disposable trees live under the configured worktrees root (default `{superrepo}/.worktrees`):

```text
.worktrees/{repoRef}/contracts-{session}/
.worktrees/{repoRef}/build-issue-{N}/
.worktrees/{repoRef}/pr-{N}-review/
```

Active submodule checkouts stay on `main`. Session manifests live in `.cursor/.tmp/<session>/`.

## Development

```bash
npm ci
npm run build
npm test
bash scripts/verify-packaging.sh
```

Requires Node 22+ (see `.nvmrc`).

## Release

Publishing is manual via **Actions → Cut Release**. See [RELEASE.md](RELEASE.md).

Use a breaking conventional commit (`feat!: …`) when shipping Forge v4 so semantic-release cuts a major version.

## Links

- [GitHub](https://github.com/alto9/forge)
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=alto9.forge-studio)
- [Open VSX](https://open-vsx.org/extension/alto9/forge-studio)
