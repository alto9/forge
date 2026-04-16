#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF' >&2
Usage: resolve-issue-parentage.sh <owner/repo> <issue-number>
       resolve-issue-parentage.sh <issue-number>

Resolves whether an issue is a GitHub sub-issue and which issue owns the feature branch.

Prints a single JSON object on stdout:
  input_issue, is_sub_issue, parent_issue (null or number), branch_owner_issue, suggested_branch

  owner/repo: GitHub repository (HOST/OWNER/REPO or OWNER/REPO); required when not in a gh-linked clone
  issue-number: issue number or issue URL
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

if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is required but not installed." >&2
  exit 1
fi

owner_repo_path=""
gh_hostname=""
issue_ref=""

if [[ $# -eq 1 ]]; then
  issue_ref="$1"
  if ! owner_repo_path="$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null)"; then
    echo "Error: unable to resolve owner/repo. Run from a clone or pass: resolve-issue-parentage.sh <owner/repo> <issue-number>" >&2
    exit 1
  fi
  repo_url="$(gh repo view --json url -q '.url' 2>/dev/null || true)"
  if [[ "$repo_url" =~ ^https?://([^/]+)/ ]]; then
    detected_host="${BASH_REMATCH[1]}"
    if [[ "$detected_host" != "github.com" ]]; then
      gh_hostname="$detected_host"
    fi
  fi
elif [[ $# -eq 2 ]]; then
  parse_owner_repo "$1"
  issue_ref="$2"
else
  usage
  exit 1
fi

if [[ "$owner_repo_path" != *"/"* ]]; then
  echo "Error: owner/repo must contain a slash (e.g. org/repo)." >&2
  exit 1
fi

issue_num="$(normalize_issue_number "$issue_ref")"

gh_api_opts=(
  -H "Accept: application/vnd.github+json"
  -H "X-GitHub-Api-Version: 2026-03-10"
)

if [[ -n "${gh_hostname:-}" ]]; then
  gh_api_opts+=(--hostname "$gh_hostname")
fi

tmp_err="$(mktemp)"
trap 'rm -f "$tmp_err"' EXIT

set +e
parent_json="$(
  gh api \
    "${gh_api_opts[@]}" \
    "repos/$owner_repo_path/issues/$issue_num/parent" \
    2>"$tmp_err"
)"
api_ec=$?
set -e

emit_top_level() {
  printf '{"input_issue":%s,"is_sub_issue":false,"parent_issue":null,"branch_owner_issue":%s,"suggested_branch":"feature/issue-%s"}\n' \
    "$issue_num" "$issue_num" "$issue_num"
}

if [[ $api_ec -eq 0 ]]; then
  if ! parent_num="$(python3 -c "import json,sys; print(json.load(sys.stdin)['number'])" <<<"$parent_json" 2>/dev/null)"; then
    echo "Error: unable to parse parent issue number from API response for #$issue_num in $owner_repo_path." >&2
    exit 1
  fi
  if [[ -z "$parent_num" ]]; then
    echo "Error: parent response missing number for issue #$issue_num in $owner_repo_path." >&2
    exit 1
  fi
  printf '{"input_issue":%s,"is_sub_issue":true,"parent_issue":%s,"branch_owner_issue":%s,"suggested_branch":"feature/issue-%s"}\n' \
    "$issue_num" "$parent_num" "$parent_num" "$parent_num"
  exit 0
fi

if grep -qiE '404|not found' "$tmp_err"; then
  emit_top_level
  exit 0
fi

cat "$tmp_err" >&2
exit 1
