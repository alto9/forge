#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF' >&2
Usage: pull-milestone-issues.sh <milestone-id> [owner/repo] [--state open|closed|all] [--format json|markdown] [--include-prs] [--compact]
  milestone-id: required, milestone number from pull-milestones
  owner/repo: optional, defaults to current repo via gh repo view
  --state: open (default), closed, or all
  --format: json (default) or markdown
  --include-prs: include pull requests (default: issues only)
  --compact: JSON only; return fewer fields (number, title, body, state, html_url, assignees, labels, created_at)
EOF
}

state="open"
format="json"
issues_only="true"
compact="false"
owner_repo=""
milestone_id=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --state)
      shift
      [[ $# -gt 0 ]] || { usage; exit 1; }
      state="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
      if [[ "$state" != "open" && "$state" != "closed" && "$state" != "all" ]]; then
        usage
        exit 1
      fi
      ;;
    --format)
      shift
      [[ $# -gt 0 ]] || { usage; exit 1; }
      format="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
      if [[ "$format" != "json" && "$format" != "markdown" ]]; then
        usage
        exit 1
      fi
      ;;
    --include-prs)
      issues_only="false"
      ;;
    --compact)
      compact="true"
      ;;
    -*)
      usage
      exit 1
      ;;
    *)
      if [[ "$1" =~ ^[0-9]+$ ]] && [[ -z "$milestone_id" ]]; then
        milestone_id="$1"
      elif [[ "$1" == *"/"* ]] && [[ -z "$owner_repo" ]]; then
        owner_repo="$1"
      else
        usage
        exit 1
      fi
      ;;
  esac
  shift
done

if [[ -z "$milestone_id" ]]; then
  usage
  exit 1
fi

if [[ -z "$owner_repo" ]]; then
  if ! owner_repo="$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null)"; then
    echo "Error: unable to resolve owner/repo. Pass owner/repo explicitly or run inside a gh-linked repo." >&2
    exit 1
  fi
fi

endpoint="repos/$owner_repo/issues?milestone=$milestone_id"
if [[ "$state" != "all" ]]; then
  endpoint="$endpoint&state=$state"
fi

set +e
raw_json="$(gh api "$endpoint" --paginate 2>&1)"
status=$?
set -e
if [[ $status -ne 0 ]]; then
  if [[ "$raw_json" == *"422"* || "$raw_json" == *"Validation Failed"* ]]; then
    echo "Error: Milestone $milestone_id not found in $owner_repo. Run pull-milestones first to list valid milestone numbers." >&2
    exit 1
  fi
  echo "Error: $raw_json" >&2
  exit 1
fi

RAW_JSON="$raw_json" python3 - "$format" "$issues_only" "$compact" <<'PY'
import json
import sys
import os

raw = os.environ.get("RAW_JSON", "")
fmt = sys.argv[1]
issues_only = sys.argv[2] == "true"
compact = sys.argv[3] == "true"

try:
    data = json.loads(raw)
except Exception:
    print("Error: Invalid JSON from gh api", file=sys.stderr)
    sys.exit(1)

if not isinstance(data, list):
    data = []

if issues_only:
    data = [i for i in data if not i.get("pull_request")]

if compact and fmt == "json":
    compacted = []
    for i in data:
        compacted.append(
            {
                "number": i.get("number"),
                "title": i.get("title"),
                "body": i.get("body"),
                "state": i.get("state"),
                "html_url": i.get("html_url"),
                "assignees": [a.get("login") for a in i.get("assignees", []) if a.get("login")],
                "labels": [
                    (l if isinstance(l, str) else l.get("name"))
                    for l in i.get("labels", [])
                    if (l if isinstance(l, str) else l.get("name"))
                ],
                "created_at": i.get("created_at"),
            }
        )
    data = compacted

if fmt == "markdown":
    if not data:
        print("# Milestone Issues\n\nNo issues found.\n")
        sys.exit(0)
    print("# Milestone Issues\n")
    print("| # | Title | State | Assignees |")
    print("|---|-------|-------|-----------|")
    for i in data:
        title = str(i.get("title", "")).replace("|", "\\|")
        assignees = i.get("assignees", [])
        if assignees and isinstance(assignees[0], dict):
            assignee_text = ", ".join([a.get("login", "") for a in assignees if a.get("login")]) or "-"
        else:
            assignee_text = ", ".join([a for a in assignees if a]) or "-"
        print(f"| {i.get('number', '')} | {title} | {i.get('state', '')} | {assignee_text} |")
else:
    print(json.dumps(data, indent=2))
PY
