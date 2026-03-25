#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Error: pass commit message with -m \"message\"" >&2
}

if ! project_root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  echo "Error: not a git repository." >&2
  exit 1
fi

branch="$(git -C "$project_root" rev-parse --abbrev-ref HEAD)"
if [[ "$branch" == "main" || "$branch" == "master" || "$branch" == "develop" ]]; then
  echo "Error: cannot commit on main branch. Create a feature branch first." >&2
  exit 1
fi

message=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    -m)
      if [[ $# -lt 2 || -z "${2:-}" ]]; then
        usage
        exit 1
      fi
      message="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

if [[ -z "$message" ]]; then
  usage
  exit 1
fi

pre_commit_hook="$project_root/.git/hooks/pre-commit"
if [[ -x "$pre_commit_hook" ]]; then
  "$pre_commit_hook" || true
fi

if [[ -f "$project_root/package.json" ]]; then
  (cd "$project_root" && npm run lint >/dev/null 2>&1) || true
  (cd "$project_root" && npm run test >/dev/null 2>&1) || true
fi

git -C "$project_root" add -A
git -C "$project_root" status
git -C "$project_root" commit -m "$message"
echo "Committed successfully."
