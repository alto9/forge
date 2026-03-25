#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF' >&2
Usage: pull-milestones.sh [owner/repo] [--state open|closed|all] [--format json|markdown] [--compact]
  owner/repo: optional, defaults to current repo via gh repo view
  --state: open (default), closed, or all
  --format: json (default) or markdown
  --compact: JSON only; return fewer fields (number, title, state, html_url, open_issues, closed_issues, due_on)
EOF
}

state="open"
format="json"
compact="false"
owner_repo=""

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
    --compact)
      compact="true"
      ;;
    -*)
      usage
      exit 1
      ;;
    *)
      if [[ "$1" == *"/"* ]] && [[ -z "$owner_repo" ]]; then
        owner_repo="$1"
      else
        usage
        exit 1
      fi
      ;;
  esac
  shift
done

if [[ -z "$owner_repo" ]]; then
  if ! owner_repo="$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null)"; then
    echo "Error: unable to resolve owner/repo. Pass owner/repo explicitly or run inside a gh-linked repo." >&2
    exit 1
  fi
fi

endpoint="repos/$owner_repo/milestones"
if [[ "$state" != "open" ]]; then
  endpoint="$endpoint?state=$state"
fi

if ! raw_json="$(gh api "$endpoint" --paginate 2>&1)"; then
  echo "Error: $raw_json" >&2
  exit 1
fi

RAW_JSON="$raw_json" python3 - "$format" "$compact" <<'PY'
import json
import sys
from datetime import datetime
import os

raw = os.environ.get("RAW_JSON", "")
fmt = sys.argv[1]
compact = sys.argv[2] == "true"

try:
    data = json.loads(raw)
except Exception:
    print("Error: Invalid JSON from gh api", file=sys.stderr)
    sys.exit(1)

if not isinstance(data, list):
    data = []

if compact and fmt == "json":
    data = [
        {
            "number": m.get("number"),
            "title": m.get("title"),
            "state": m.get("state"),
            "html_url": m.get("html_url"),
            "open_issues": m.get("open_issues"),
            "closed_issues": m.get("closed_issues"),
            "due_on": m.get("due_on"),
        }
        for m in data
    ]

if fmt == "markdown":
    if not data:
        print("# Milestones\n\nNo milestones found.\n")
        sys.exit(0)
    print("# Milestones\n")
    print("| # | Title | State | Open | Closed | Due |")
    print("|---|-------|-------|------|--------|-----|")
    for m in data:
        due_on = m.get("due_on")
        due = "-"
        if due_on:
            try:
                due = datetime.fromisoformat(due_on.replace("Z", "+00:00")).date().isoformat()
            except Exception:
                due = str(due_on)
        title = str(m.get("title", "")).replace("|", "\\|")
        print(f"| {m.get('number', '')} | {title} | {m.get('state', '')} | {m.get('open_issues', 0)} | {m.get('closed_issues', 0)} | {due} |")
else:
    print(json.dumps(data, indent=2))
PY
