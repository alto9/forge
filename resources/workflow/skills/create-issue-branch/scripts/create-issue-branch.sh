#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF' >&2
Usage: create-issue-branch.sh <owner/repo> <branch-name> <issue-number> <root-branch>
       create-issue-branch.sh <branch-name> <issue-number> [root-branch]
  owner/repo: four-argument form, for use outside a gh-linked clone (HOST/OWNER/REPO or OWNER/REPO)
  root-branch: remote base (use main when branching from main).
  Two- and three-argument forms resolve the repo from the current directory (gh repo view).
EOF
}

if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

owner_repo=""
branch_name=""
issue_number=""
root_branch="main"

case $# in
  2)
    branch_name="$1"
    issue_number="$2"
    if ! owner_repo="$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null)"; then
      echo "Error: unable to resolve owner/repo. Pass four arguments: create-issue-branch.sh <owner/repo> <branch-name> <issue-number> <root-branch>" >&2
      exit 1
    fi
    ;;
  3)
    branch_name="$1"
    issue_number="$2"
    root_branch="$3"
    if ! owner_repo="$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null)"; then
      echo "Error: unable to resolve owner/repo. Pass four arguments with owner/repo first." >&2
      exit 1
    fi
    ;;
  4)
    owner_repo="$1"
    branch_name="$2"
    issue_number="$3"
    root_branch="$4"
    ;;
  *)
    usage
    exit 1
    ;;
esac

if [[ -z "$owner_repo" ]] || [[ -z "$branch_name" ]] || [[ -z "$issue_number" ]] || [[ -z "$root_branch" ]]; then
  usage
  exit 1
fi

if [[ "$owner_repo" != *"/"* ]]; then
  echo "Error: owner/repo must contain a slash (e.g. org/repo)." >&2
  exit 1
fi

checkout_args=()
if cwd_repo="$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null)"; then
  o_r_lc="$(printf '%s' "$owner_repo" | tr '[:upper:]' '[:lower:]')"
  cwd_lc="$(printf '%s' "$cwd_repo" | tr '[:upper:]' '[:lower:]')"
  if [[ "$cwd_lc" == "$o_r_lc" ]]; then
    checkout_args=(--checkout)
  fi
fi

if ((${#checkout_args[@]} > 0)); then
  gh issue develop "$issue_number" \
    --name "$branch_name" \
    --base "$root_branch" \
    --repo "$owner_repo" \
    --checkout
else
  gh issue develop "$issue_number" \
    --name "$branch_name" \
    --base "$root_branch" \
    --repo "$owner_repo"
fi

echo "$branch_name"
