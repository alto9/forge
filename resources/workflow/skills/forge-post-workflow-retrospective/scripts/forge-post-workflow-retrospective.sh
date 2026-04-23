#!/usr/bin/env bash
set -euo pipefail

export GH_PAGER=cat
export GH_NO_UPDATE_NOTIFIER=1

usage() {
  cat <<'EOF' >&2
Usage: forge-post-workflow-retrospective.sh issue <owner/repo> <issue-number> <body-file>
       forge-post-workflow-retrospective.sh issue <issue-number> <body-file>
       forge-post-workflow-retrospective.sh pr <owner/repo> <pr-number> <body-file>
       forge-post-workflow-retrospective.sh pr <pr-number> <body-file>

Posts a Forge workflow retrospective comment on a GitHub issue or on a PR conversation thread.
body-file must exist and be non-empty (Markdown recommended).

Requires: gh with repo scope.
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

mode="${1:-}"
shift || true

if [[ "$mode" != "issue" ]] && [[ "$mode" != "pr" ]]; then
  echo "Error: first argument must be 'issue' or 'pr'." >&2
  usage
  exit 1
fi

owner_repo=""
num=""
body_file=""

# issue <owner/repo> <issue#> <file>  OR  issue <issue#> <file>
# pr    <owner/repo> <pr#> <file>     OR  pr    <pr#> <file>
if [[ $# -eq 3 ]]; then
  owner_repo="$1"
  num="$2"
  body_file="$3"
elif [[ $# -eq 2 ]]; then
  if ! owner_repo="$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null)"; then
    echo "Error: unable to resolve owner/repo. Run from a clone or pass owner/repo explicitly." >&2
    usage
    exit 1
  fi
  num="$1"
  body_file="$2"
else
  usage
  exit 1
fi

if [[ "$owner_repo" != *"/"* ]]; then
  echo "Error: owner/repo must contain a slash (e.g. org/repo)." >&2
  exit 1
fi

if [[ ! -f "$body_file" ]]; then
  echo "Error: body file not found: $body_file" >&2
  exit 1
fi

if ! [[ -s "$body_file" ]]; then
  echo "Error: body file is empty: $body_file" >&2
  exit 1
fi

if [[ "$mode" == "issue" ]]; then
  gh issue comment "$num" --repo "$owner_repo" --body-file "$body_file"
else
  gh pr comment "$num" --repo "$owner_repo" --body-file "$body_file"
fi
