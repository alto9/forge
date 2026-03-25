#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: create-feature-branch.sh <branch-name> [root-branch]" >&2
}

if [[ $# -lt 1 ]] || [[ -z "${1:-}" ]]; then
  usage
  exit 1
fi

branch_name="$1"
root_branch="${2:-main}"

if ! project_root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  echo "Error: not a git repository." >&2
  exit 1
fi

cd "$project_root"
git checkout "$root_branch"
git pull
git checkout -b "$branch_name"
echo "$branch_name"
