# Contributing to Forge

Forge Studio is the VS Code / Cursor extension that ships the superrepo harness under `resources/harness/`.

## Getting started

1. Fork and clone `https://github.com/alto9/forge`
2. `npm ci` (Node 22+)
3. `npm run build`
4. Press F5 in VS Code/Cursor to launch the Extension Development Host
5. Open a pull request against `main`

## Useful commands

```bash
npm run build          # extension + superrepo webview
npm test               # vitest
npm run lint
bash scripts/verify-packaging.sh
```

## Layout

```text
src/
  extension.ts
  commands/                 # Initialize Superrepo, Update Harness, Open Config
  git/                      # .gitmodules parse/apply, provider detect
  harness/                  # install + manifest
  worktrees/                # ensure .worktrees + gitignore
  superrepo/                # apply pipeline
  webview/superrepo/        # init UI
resources/harness/          # agents, skills, rules copied into consumer .cursor/
```

## Harness changes

Edit files under `resources/harness/`. Consumers pick them up via **Forge: Initialize Superrepo** or **Forge: Update Harness**. Do not hand-edit installed copies in a superrepo as the source of truth.

## Release

See [RELEASE.md](RELEASE.md). Merging to `main` runs CI only. Ship with **Actions → Cut Release**. Use `feat!:` for the Forge v4 major.
