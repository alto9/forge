#!/usr/bin/env bash
set -euo pipefail

if ! project_root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  echo "Error: not a git repository." >&2
  exit 1
fi

branch="$(git -C "$project_root" rev-parse --abbrev-ref HEAD)"
if [[ "$branch" == "main" || "$branch" == "master" || "$branch" == "develop" ]]; then
  echo "Error: cannot push main branch directly." >&2
  exit 1
fi

git -C "$project_root" fetch origin

if [[ -n "$(git -C "$project_root" ls-remote --heads origin "$branch")" ]]; then
  git -C "$project_root" push origin HEAD
else
  git -C "$project_root" push -u origin HEAD
fi

echo "Pushed successfully."
