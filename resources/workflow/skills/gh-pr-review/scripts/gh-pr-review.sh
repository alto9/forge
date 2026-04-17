#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF' >&2
Usage: gh-pr-review.sh <owner/repo> <pr-number> <approve|request-changes|comment> <body>
       gh-pr-review.sh <pr-number> <approve|request-changes|comment> <body>

Submits a GitHub PR review (approve, request changes, or comment) with a required body.
EOF
}

if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is required but not installed." >&2
  exit 1
fi

owner_repo=""
pr=""
action=""
body=""

if [[ $# -eq 4 ]]; then
  owner_repo="$1"
  pr="$2"
  action="$3"
  body="$4"
elif [[ $# -eq 3 ]]; then
  if ! owner_repo="$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null)"; then
    echo "Error: unable to resolve owner/repo. Pass owner/repo as first argument or run inside a gh-linked clone." >&2
    exit 1
  fi
  pr="$1"
  action="$2"
  body="$3"
else
  usage
  exit 1
fi

if [[ -z "$body" ]]; then
  echo "Error: review body must be non-empty." >&2
  exit 1
fi

case "$action" in
  approve) gh_flag=(--approve) ;;
  request-changes) gh_flag=(--request-changes) ;;
  comment) gh_flag=(--comment) ;;
  *)
    echo "Error: action must be approve, request-changes, or comment (got: $action)" >&2
    exit 1
    ;;
esac

if [[ $# -eq 4 ]]; then
  gh pr review "$pr" -R "$owner_repo" "${gh_flag[@]}" -b "$body"
else
  gh pr review "$pr" "${gh_flag[@]}" -b "$body"
fi

echo "Review submitted."
