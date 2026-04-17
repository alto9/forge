#!/usr/bin/env bash
set -euo pipefail

export GH_PAGER=cat
export GH_NO_UPDATE_NOTIFIER=1

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

json_debug_fail() {
  local reason="$1"
  local raw="${2:-}"
  echo "Error: $reason" >&2
  if command -v gh >/dev/null 2>&1; then
    echo "gh version: $(gh --version 2>&1 | head -n 1)" >&2
  fi
  echo "Raw stdout (first 400 bytes):" >&2
  if [[ -n "$raw" ]]; then
    printf '%s' "$raw" | head -c 400 >&2
    echo >&2
  else
    echo "(empty)" >&2
  fi
  echo "Tip: run the same gh command with --format json locally; try: gh auth refresh -s project" >&2
  exit 1
}

# Require jq parseable JSON whose top-level type is object or array (not boolean/string/null alone).
require_json_container() {
  local label="$1"
  local raw="$2"
  if [[ -z "${raw//[$'\t\r\n ']/}" ]]; then
    json_debug_fail "$label: empty response from gh" "$raw"
  fi
  if ! echo "$raw" | jq -e 'type == "object" or type == "array"' >/dev/null 2>&1; then
    json_debug_fail "$label: expected JSON object or array at top level (got non-object/array or invalid JSON)" "$raw"
  fi
}

normalize_fields_array() {
  echo "$1" | jq -c '
    if type == "array" then .
    elif type == "object" and (.fields | type == "array") then .fields
    elif type == "object" and (.fields | type == "object") and (.fields.nodes | type == "array") then .fields.nodes
    else empty
    end
  '
}

normalize_items_array() {
  echo "$1" | jq -c '
    if type == "array" then .
    elif type == "object" and (.items | type == "array") then .items
    elif type == "object" and (.items | type == "object") and (.items.nodes | type == "array") then .items.nodes
    else empty
    end
  '
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
require_json_container "gh project view" "$project_json"
if ! echo "$project_json" | jq -e 'type == "object" and (.id | type == "string")' >/dev/null 2>&1; then
  json_debug_fail "gh project view: expected object with string .id" "$project_json"
fi
project_id="$(echo "$project_json" | jq -r '.id')"

fields_json="$(gh project field-list "$proj_num" --owner "$proj_owner" --format json -L 100)"
require_json_container "gh project field-list" "$fields_json"
fields_array_json="$(normalize_fields_array "$fields_json")"
if [[ -z "$fields_array_json" || "$fields_array_json" == "null" ]]; then
  json_debug_fail "gh project field-list: could not normalize to a fields array (expected top-level array, .fields array, or .fields.nodes array)" "$fields_json"
fi
if ! echo "$fields_array_json" | jq -e 'type == "array"' >/dev/null 2>&1; then
  json_debug_fail "gh project field-list: internal normalize did not produce an array" "$fields_json"
fi

field_block="$(echo "$fields_array_json" | jq -c '
  (map(select((.name | ascii_downcase) == "status") and (.options != null) and ((.options | length) > 0)) | first)
  // (map(select(.options != null and (.options | length) > 0)) | first)
')"

if [[ -z "$field_block" || "$field_block" == "null" ]]; then
  echo "Error: could not find a Status (or single-select) field on the project." >&2
  exit 1
fi

if ! echo "$field_block" | jq -e 'type == "object" and (.id | type == "string")' >/dev/null 2>&1; then
  json_debug_fail "resolved field block is not an object with string .id (gh field-list shape may have changed)" "$field_block"
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
    .[]
    | select(
        .content != null
        and ((.content.type == "Issue") or (.content.type == "issue"))
        and (.content.number == $n)
      )
    | .id
  ' | head -n 1
}

items_json="$(gh project item-list "$proj_num" --owner "$proj_owner" --format json -L 500)"
require_json_container "gh project item-list" "$items_json"
items_array_json="$(normalize_items_array "$items_json")"
if [[ -z "$items_array_json" ]]; then
  json_debug_fail "gh project item-list: could not normalize to an items array" "$items_json"
fi
if ! echo "$items_array_json" | jq -e 'type == "array"' >/dev/null 2>&1; then
  json_debug_fail "gh project item-list: internal normalize did not produce an array" "$items_json"
fi

item_id="$(find_item_id "$items_array_json")"

if [[ -z "$item_id" || "$item_id" == "null" ]]; then
  gh project item-add "$proj_num" --owner "$proj_owner" --url "$issue_url" --format json >/dev/null
  items_json="$(gh project item-list "$proj_num" --owner "$proj_owner" --format json -L 500)"
  require_json_container "gh project item-list (after item-add)" "$items_json"
  items_array_json="$(normalize_items_array "$items_json")"
  if [[ -z "$items_array_json" ]] || ! echo "$items_array_json" | jq -e 'type == "array"' >/dev/null 2>&1; then
    json_debug_fail "gh project item-list after add: could not normalize to an items array" "$items_json"
  fi
  item_id="$(find_item_id "$items_array_json")"
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
