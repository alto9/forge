#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF' >&2
Usage: gh-project-set-status.sh <github_board_url> <owner/repo> <issue-number> <status-name>

Sets the GitHub Projects v2 "Status" field for an issue. Adds the issue to the project if missing.
Requires: gh (with project scope), jq

Board URL must look like:
  https://github.com/orgs/ORG/projects/N
  https://github.com/users/USER/projects/N
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

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required but not installed." >&2
  exit 1
fi

if [[ $# -ne 4 ]]; then
  usage
  exit 1
fi

board_url="$1"
owner_repo="$2"
issue_num="$3"
want_status="$4"

parse_board_url() {
  local url="$1"
  if [[ "$url" =~ github\.com/orgs/([^/]+)/projects/([0-9]+) ]]; then
    proj_owner="${BASH_REMATCH[1]}"
    proj_num="${BASH_REMATCH[2]}"
    return 0
  fi
  if [[ "$url" =~ github\.com/users/([^/]+)/projects/([0-9]+) ]]; then
    proj_owner="${BASH_REMATCH[1]}"
    proj_num="${BASH_REMATCH[2]}"
    return 0
  fi
  echo "Error: unsupported github_board URL. Use .../orgs/NAME/projects/N or .../users/NAME/projects/N" >&2
  return 1
}

parse_board_url "$board_url" || exit 1

if [[ ! "$issue_num" =~ ^[0-9]+$ ]]; then
  echo "Error: issue-number must be numeric (got: $issue_num)" >&2
  exit 1
fi

IFS='/' read -r o r <<<"$owner_repo"
if [[ -z "$o" || -z "$r" ]]; then
  echo "Error: owner/repo must be OWNER/REPO" >&2
  exit 1
fi

issue_url="https://github.com/${o}/${r}/issues/${issue_num}"

project_json="$(gh project view "$proj_num" --owner "$proj_owner" --format json)"
project_id="$(echo "$project_json" | jq -r '.id // empty')"
if [[ -z "$project_id" || "$project_id" == "null" ]]; then
  echo "Error: could not resolve project id from gh project view." >&2
  exit 1
fi

fields_json="$(gh project field-list "$proj_num" --owner "$proj_owner" --format json -L 100)"

field_block="$(echo "$fields_json" | jq -c '
  (if type == "array" then . else .fields end) as $f
  | ($f | map(select((.name | ascii_downcase) == "status") and (.options != null) and ((.options | length) > 0)) | first)
    // ($f | map(select(.options != null and (.options | length) > 0)) | first)
')"

if [[ -z "$field_block" || "$field_block" == "null" ]]; then
  echo "Error: could not find a Status (or single-select) field on the project." >&2
  exit 1
fi

field_id="$(echo "$field_block" | jq -r '.id')"
option_id="$(echo "$field_block" | jq -r --arg s "$want_status" '
  .options // [] | map(select((.name | ascii_downcase) == ($s | ascii_downcase))) | first | .id // empty
')"

if [[ -z "$option_id" || "$option_id" == "null" ]]; then
  echo "Error: no Status option matching \"$want_status\" (case-insensitive)." >&2
  echo "Available options:" >&2
  echo "$field_block" | jq -r '.options[]?.name' >&2 || true
  exit 1
fi

find_item_id() {
  local json="$1"
  echo "$json" | jq -r --argjson n "$issue_num" '
    ((if type == "array" then . else .items end) // []) as $items
    | $items[]
    | select(
        .content != null
        and ((.content.type == "Issue") or (.content.type == "issue"))
        and (.content.number == $n)
      )
    | .id
  ' | head -n 1
}

items_json="$(gh project item-list "$proj_num" --owner "$proj_owner" --format json -L 500)"
item_id="$(find_item_id "$items_json")"

if [[ -z "$item_id" || "$item_id" == "null" ]]; then
  gh project item-add "$proj_num" --owner "$proj_owner" --url "$issue_url" --format json >/dev/null
  items_json="$(gh project item-list "$proj_num" --owner "$proj_owner" --format json -L 500)"
  item_id="$(find_item_id "$items_json")"
  if [[ -z "$item_id" || "$item_id" == "null" ]]; then
    echo "Error: could not locate project item for issue #${issue_num} after add." >&2
    exit 1
  fi
fi

gh project item-edit \
  --id "$item_id" \
  --project-id "$project_id" \
  --field-id "$field_id" \
  --single-select-option-id "$option_id"

echo "Project status updated to \"$want_status\" for issue #${issue_num}."
