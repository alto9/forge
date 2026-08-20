# Forge by Alto9

Forge is Alto9’s harness for running a software team in Cursor: named roles, real SDLC rituals, and a human who still approves the work.

The Agent can draft the brief, groom the ticket, open the pull request, and write the launch note. You decide whether that apply-set is the one you meant. Forge turns that loop into a practice: Product Owner, Project Manager, Architect, Engineer, QA, Security, Release, and Marketing as specialists you invoke; slash-command events for the columns from Grooming through launch; GitHub or GitLab as the board that wins when memory drifts.

A command calls the roles, they propose, and nothing is written until you approve the hand-off. Between rituals you can still ask; `/forge.help` only reads, so start there when the map goes fuzzy.

The workshop course teaches the same path in three passes: how software gets made, how the rituals run, then a playbook per role. Command Palette → **Forge: Open Forge Course** opens it in a browser tab.

## Forge Studio

**Forge Studio** (`alto9.forge-studio`) is the VS Code / Cursor extension in this repository. Teammates install Forge by installing Studio: on startup it clones the [Forge Cursor plugin](https://github.com/alto9/forge-cursor-plugin) into `~/.cursor/plugins/local/forge-cursor`, and **Forge: Sync Cursor Plugin** does the same clone-or-pull on demand. After a clone or update, reload the window so Cursor loads the agents, commands, skills, and harness rule.

Git must be on `PATH`. A folder already at the install path that is not a git clone is left alone, so a local symlink for plugin development is safe.

## Quick start

1. Install the extension from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=alto9.forge-studio) or [Open VSX](https://open-vsx.org/extension/alto9.forge-studio).
2. Open Cursor. The first launch clones the plugin; accept **Reload Window** when prompted.
3. Command Palette → **Forge: Open Forge Course** to walk the workshops, then `/forge.help` in Agent chat to confirm the plugin loaded.

Command Palette → **Forge: Sync Cursor Plugin** runs the clone-or-pull again whenever you want a current checkout.

## Settings

| Setting | Default | Purpose |
|---|---|---|
| `forge.cursorPlugin.repoUrl` | `https://github.com/alto9/forge-cursor-plugin.git` | Remote cloned into `~/.cursor/plugins/local/forge-cursor` |
| `forge.cursorPlugin.autoUpdate` | `true` | Clone or fast-forward on startup |

## Development

```bash
npm ci
npm run build
npm test
bash scripts/verify-packaging.sh
```

Requires Node 22+ (see `.nvmrc`). Press F5 to launch the Extension Development Host.

## Release

Publishing is manual via **Actions → Cut Release**. See [RELEASE.md](RELEASE.md).

## Links

- [GitHub](https://github.com/alto9/forge)
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=alto9.forge-studio)
- [Open VSX](https://open-vsx.org/extension/alto9.forge-studio)
- [Forge Cursor plugin](https://github.com/alto9/forge-cursor-plugin)
- [Alto9](https://alto9.com)
