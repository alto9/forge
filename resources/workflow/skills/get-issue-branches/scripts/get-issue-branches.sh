#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF' >&2
Usage: get-issue-branches.sh <owner/repo> <issue-number>
       get-issue-branches.sh <issue-number>
  owner/repo: GitHub repository (HOST/OWNER/REPO or OWNER/REPO); required when not in a gh-linked clone
  issue-number: issue number or URL, as accepted by gh issue develop --list
EOF
}

if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

owner_repo=""
issue_number=""

if [[ $# -eq 1 ]]; then
  issue_number="$1"
  if ! owner_repo="$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null)"; then
    echo "Error: unable to resolve owner/repo. Run from a clone or pass: get-issue-branches.sh <owner/repo> <issue-number>" >&2
    exit 1
  fi
elif [[ $# -eq 2 ]]; then
  owner_repo="$1"
  issue_number="$2"
  if [[ "$owner_repo" != *"/"* ]]; then
    echo "Error: owner/repo must contain a slash (e.g. org/repo)." >&2
    usage
    exit 1
  fi
else
  usage
  exit 1
fi

if [[ -z "$issue_number" ]]; then
  usage
  exit 1
fi

echo "Linked development branches for ${owner_repo}#${issue_number}:"

set +e
output="$(gh issue develop --list "$issue_number" --repo "$owner_repo" 2>&1)"
gh_ec=$?
set -e

if [[ "$gh_ec" -ne 0 ]]; then
  printf '%s\n' "$output" >&2
  exit "$gh_ec"
fi

if [[ -z "${output//[$'\t\r\n ']/}" ]]; then
  echo "(none)"
  exit 0
fi

printf '%s\n' "$output"
