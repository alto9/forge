#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF' >&2
Usage: link-subissue-to-issue.sh [--replace-parent|-r] <owner/repo> <parent-issue-number> <child-issue-number>
       link-subissue-to-issue.sh [--replace-parent|-r] <parent-issue-number> <child-issue-number>
  owner/repo: GitHub repository (HOST/OWNER/REPO or OWNER/REPO); required when not in a gh-linked clone
  parent-issue-number: parent issue number or URL
  child-issue-number: child issue number or URL
  --replace-parent, -r: replace existing parent relationship when child already has a parent
EOF
}

normalize_issue_number() {
  local issue_ref="$1"

  if [[ "$issue_ref" =~ ^[0-9]+$ ]]; then
    echo "$issue_ref"
    return 0
  fi

  if [[ "$issue_ref" =~ /issues/([0-9]+)([/?#].*)?$ ]]; then
    echo "${BASH_REMATCH[1]}"
    return 0
  fi

  echo "Error: invalid issue reference '$issue_ref'. Expected issue number or issue URL." >&2
  return 1
}

parse_owner_repo() {
  local repo_ref="$1"
  local p1=""
  local p2=""
  local p3=""
  local p4=""
  IFS='/' read -r p1 p2 p3 p4 <<<"$repo_ref"

  if [[ -n "$p4" ]]; then
    echo "Error: owner/repo must be OWNER/REPO or HOST/OWNER/REPO." >&2
    return 1
  fi

  if [[ -n "$p3" ]]; then
    gh_hostname="$p1"
    owner_repo_path="$p2/$p3"
  elif [[ -n "$p2" ]]; then
    owner_repo_path="$p1/$p2"
  else
    echo "Error: owner/repo must be OWNER/REPO or HOST/OWNER/REPO." >&2
    return 1
  fi

  return 0
}

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is required but not installed." >&2
  exit 1
fi

replace_parent="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    -r|--replace-parent)
      replace_parent="true"
      shift
      ;;
    *)
      break
      ;;
  esac
done

owner_repo_path=""
gh_hostname=""
parent_issue_ref=""
child_issue_ref=""

if [[ $# -eq 2 ]]; then
  parent_issue_ref="$1"
  child_issue_ref="$2"
  if ! owner_repo_path="$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null)"; then
    echo "Error: unable to resolve owner/repo. Run from a clone or pass: link-subissue-to-issue.sh <owner/repo> <parent-issue-number> <child-issue-number>" >&2
    exit 1
  fi
  repo_url="$(gh repo view --json url -q '.url' 2>/dev/null || true)"
  if [[ "$repo_url" =~ ^https?://([^/]+)/ ]]; then
    detected_host="${BASH_REMATCH[1]}"
    if [[ "$detected_host" != "github.com" ]]; then
      gh_hostname="$detected_host"
    fi
  fi
elif [[ $# -eq 3 ]]; then
  parse_owner_repo "$1"
  parent_issue_ref="$2"
  child_issue_ref="$3"
else
  usage
  exit 1
fi

parent_issue_number="$(normalize_issue_number "$parent_issue_ref")"
child_issue_number="$(normalize_issue_number "$child_issue_ref")"

if [[ "$parent_issue_number" == "$child_issue_number" ]]; then
  echo "Error: parent and child issue cannot be the same issue." >&2
  exit 1
fi

gh_api_opts=(
  -H "Accept: application/vnd.github+json"
  -H "X-GitHub-Api-Version: 2026-03-10"
)

if [[ -n "$gh_hostname" ]]; then
  gh_api_opts+=(--hostname "$gh_hostname")
fi

if ! child_issue_id="$(
  gh api \
    "${gh_api_opts[@]}" \
    "repos/$owner_repo_path/issues/$child_issue_number" \
    --jq '.id'
)"; then
  echo "Error: unable to fetch child issue id for #$child_issue_number in $owner_repo_path." >&2
  exit 1
fi

if [[ -z "$child_issue_id" || "$child_issue_id" == "null" ]]; then
  echo "Error: child issue id is empty for #$child_issue_number in $owner_repo_path." >&2
  exit 1
fi

post_args=(
  "${gh_api_opts[@]}"
  --method POST
  "repos/$owner_repo_path/issues/$parent_issue_number/sub_issues"
  -F "sub_issue_id=$child_issue_id"
)

if [[ "$replace_parent" == "true" ]]; then
  post_args+=(-F "replace_parent=true")
fi

gh api "${post_args[@]}" >/dev/null

repo_display="$owner_repo_path"
if [[ -n "$gh_hostname" ]]; then
  repo_display="$gh_hostname/$owner_repo_path"
fi

echo "Linked sub-issue #$child_issue_number to parent #$parent_issue_number in $repo_display."
