# Contributing to Forge

Forge Studio is the VS Code / Cursor extension that installs [alto9/forge-cursor-plugin](https://github.com/alto9/forge-cursor-plugin) into `~/.cursor/plugins/local/forge-cursor`.

Harness, agents, commands, and skills live in that plugin repo. Change them there.

## Getting started

1. Fork and clone `https://github.com/alto9/forge`
2. `npm ci` (Node 22+)
3. `npm run build`
4. Press F5 in VS Code/Cursor to launch the Extension Development Host
5. Open a pull request against `main`

## Useful commands

```bash
npm run build
npm test
npm run lint
bash scripts/verify-packaging.sh
```

## Layout

```text
src/
  extension.ts
  commands/SyncCursorPluginCommand.ts
  commands/OpenCourseCommand.ts
  course/                   # loopback static server for the plugin workshop
  plugin/                   # clone or pull into ~/.cursor/plugins/local
```

## Release

See [RELEASE.md](RELEASE.md). Merging to `main` runs CI only. Ship with **Actions → Cut Release**.
