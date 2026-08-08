#!/usr/bin/env bash
# Forge worktree helper — central .worktrees layout under the superrepo.
# Paths are session-scoped so different humans/workstations do not collide.
# Usage:
#   worktree-workspace.sh list [--superrepo PATH]
#   worktree-workspace.sh create --superrepo PATH --repo-root PATH --repo-ref REF \
#       --role contracts|build|review --branch BRANCH --session SLUG [--base REF]
#   worktree-workspace.sh remove --superrepo PATH --repo-root PATH --repo-ref REF \
#       --role contracts|build|review --session SLUG [--force]
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  worktree-workspace.sh list [--superrepo PATH]

  worktree-workspace.sh create \
    --superrepo PATH --repo-root PATH --repo-ref REF \
    --role contracts|build|review --branch BRANCH --session SLUG [--base REF]

  worktree-workspace.sh remove \
    --superrepo PATH --repo-root PATH --repo-ref REF \
    --role contracts|build|review --session SLUG [--force]

Environment:
  FORGE_SUPERREPO  Default superrepo root when --superrepo is omitted.

Roles:
  contracts  Branch-backed .ai work (ai/<session-slug> or ai/refine-...)
  build      feature/issue-<N> implementation worktree
  review     Detached Change Request head for read-only inspection

Worktree path pattern:
  {worktreesRoot}/{repoRef}/{role}-{session}/

worktreesRoot resolves from .cursor/forge/manifest.json key worktreesPath,
else {superrepo}/.worktrees

--session is required for create and remove (top-level command session slug).
EOF
}

die() { echo "worktree-workspace.sh: $*" >&2; exit 1; }

sanitize_session() {
  local s="$1"
  [[ -n "$s" ]] || die "session slug must be non-empty"
  # Keep path-safe: alnum, dash, underscore, dot
  if [[ ! "$s" =~ ^[A-Za-z0-9._-]+$ ]]; then
    die "invalid session slug (use letters, numbers, . _ - only): $s"
  fi
  echo "$s"
}

resolve_superrepo() {
  local sr="${FORGE_SUPERREPO:-}"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --superrepo) sr="$2"; shift 2 ;;
      *) break ;;
    esac
  done
  if [[ -z "$sr" ]]; then
    die "missing superrepo root (set FORGE_SUPERREPO or pass --superrepo)"
  fi
  if [[ ! -d "$sr" ]]; then
    die "superrepo not found: $sr"
  fi
  (cd "$sr" && pwd)
}

resolve_worktrees_root() {
  local superrepo="$1"
  local manifest="${superrepo}/.cursor/forge/manifest.json"
  if [[ -f "$manifest" ]]; then
    if command -v jq >/dev/null 2>&1; then
      local custom
      custom="$(jq -r '.worktreesPath // empty' "$manifest" 2>/dev/null || true)"
      if [[ -n "$custom" && "$custom" != "null" ]]; then
        if [[ "$custom" != /* ]]; then
          echo "${superrepo}/${custom}"
        else
          echo "$custom"
        fi
        return
      fi
    else
      local line
      line="$(grep -E '"worktreesPath"' "$manifest" 2>/dev/null | head -1 || true)"
      if [[ -n "$line" ]]; then
        local val
        val="$(echo "$line" | sed -E 's/.*"worktreesPath"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/')"
        if [[ -n "$val" && "$val" != "$line" ]]; then
          if [[ "$val" != /* ]]; then
            echo "${superrepo}/${val}"
          else
            echo "$val"
          fi
          return
        fi
      fi
    fi
  fi
  echo "${superrepo}/.worktrees"
}

role_slug() {
  case "$1" in
    contracts|build|review) echo "$1" ;;
    *) die "invalid role: $1 (expected contracts, build, or review)" ;;
  esac
}

wt_path_for() {
  local worktrees_root="$1" repo_ref="$2" role="$3" session="$4"
  echo "${worktrees_root}/${repo_ref}/$(role_slug "$role")-${session}"
}

cmd_list() {
  local superrepo
  superrepo="$(resolve_superrepo "$@")"
  local worktrees_root
  worktrees_root="$(resolve_worktrees_root "$superrepo")"
  echo "superrepo: ${superrepo}"
  echo "worktreesRoot: ${worktrees_root}"
  if [[ ! -d "$worktrees_root" ]]; then
    echo "(no worktrees directory yet)"
    return 0
  fi
  find "$worktrees_root" -mindepth 2 -maxdepth 2 -type d | sort | while read -r d; do
    echo "$d"
  done
  if command -v git >/dev/null 2>&1; then
    echo "--- git worktree list (from submodules under superrepo) ---"
    if [[ -f "${superrepo}/.gitmodules" ]]; then
      git config -f "${superrepo}/.gitmodules" --get-regexp path 2>/dev/null | awk '{print $2}' | while read -r subpath; do
        local rr="${superrepo}/${subpath}"
        if [[ -d "${rr}/.git" || -f "${rr}/.git" ]]; then
          echo "# ${subpath}"
          git -C "$rr" worktree list 2>/dev/null || true
        fi
      done
    fi
  fi
}

cmd_create() {
  local superrepo="" repo_root="" repo_ref="" role="" branch="" base="" session=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --superrepo) superrepo="$2"; shift 2 ;;
      --repo-root) repo_root="$2"; shift 2 ;;
      --repo-ref) repo_ref="$2"; shift 2 ;;
      --role) role="$2"; shift 2 ;;
      --branch) branch="$2"; shift 2 ;;
      --base) base="$2"; shift 2 ;;
      --session) session="$2"; shift 2 ;;
      *) die "unknown create arg: $1" ;;
    esac
  done
  [[ -n "$superrepo" ]] || superrepo="$(resolve_superrepo)"
  [[ -n "$repo_root" ]] || die "create requires --repo-root"
  [[ -n "$repo_ref" ]] || die "create requires --repo-ref"
  [[ -n "$role" ]] || die "create requires --role"
  [[ -n "$branch" ]] || die "create requires --branch"
  [[ -n "$session" ]] || die "create requires --session"

  session="$(sanitize_session "$session")"
  repo_root="$(cd "$repo_root" && pwd)"
  superrepo="$(cd "$superrepo" && pwd)"
  role="$(role_slug "$role")"

  local worktrees_root wt_path
  worktrees_root="$(resolve_worktrees_root "$superrepo")"
  wt_path="$(wt_path_for "$worktrees_root" "$repo_ref" "$role" "$session")"

  mkdir -p "$(dirname "$wt_path")"
  if [[ -e "$wt_path" ]]; then
    die "worktree path already exists: $wt_path"
  fi

  if [[ "$role" == "review" ]]; then
    git -C "$repo_root" fetch origin "$branch"
    git -C "$repo_root" worktree add "$wt_path" FETCH_HEAD
  elif git -C "$repo_root" show-ref --verify --quiet "refs/heads/${branch}"; then
    git -C "$repo_root" fetch origin "$branch" 2>/dev/null || true
    git -C "$repo_root" worktree add "$wt_path" "$branch"
  else
    base="${base:-origin/main}"
    git -C "$repo_root" fetch origin "${base#origin/}" 2>/dev/null || git -C "$repo_root" fetch origin main
    git -C "$repo_root" worktree add -b "$branch" "$wt_path" "$base"
  fi

  echo "created: ${wt_path}"
  echo "branch: ${branch}"
  echo "repo-root: ${repo_root}"
  echo "repo-ref: ${repo_ref}"
  echo "role: ${role}"
  echo "session: ${session}"
}

cmd_remove() {
  local superrepo="" repo_root="" repo_ref="" role="" session="" force=0
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --superrepo) superrepo="$2"; shift 2 ;;
      --repo-root) repo_root="$2"; shift 2 ;;
      --repo-ref) repo_ref="$2"; shift 2 ;;
      --role) role="$2"; shift 2 ;;
      --session) session="$2"; shift 2 ;;
      --force) force=1; shift ;;
      *) die "unknown remove arg: $1" ;;
    esac
  done
  [[ -n "$superrepo" ]] || superrepo="$(resolve_superrepo)"
  [[ -n "$repo_root" ]] || die "remove requires --repo-root"
  [[ -n "$repo_ref" ]] || die "remove requires --repo-ref"
  [[ -n "$role" ]] || die "remove requires --role"
  [[ -n "$session" ]] || die "remove requires --session"

  session="$(sanitize_session "$session")"
  repo_root="$(cd "$repo_root" && pwd)"
  superrepo="$(cd "$superrepo" && pwd)"
  role="$(role_slug "$role")"

  local worktrees_root wt_path
  worktrees_root="$(resolve_worktrees_root "$superrepo")"
  wt_path="$(wt_path_for "$worktrees_root" "$repo_ref" "$role" "$session")"

  if [[ ! -d "$wt_path" ]]; then
    echo "worktree path not found (already removed?): $wt_path"
    exit 0
  fi

  if [[ "$force" -eq 1 ]]; then
    git -C "$repo_root" worktree remove --force "$wt_path"
  else
    git -C "$repo_root" worktree remove "$wt_path"
  fi
  echo "removed: ${wt_path}"
}

main() {
  [[ $# -ge 1 ]] || { usage; exit 1; }
  local cmd="$1"; shift
  case "$cmd" in
    list) cmd_list "$@" ;;
    create) cmd_create "$@" ;;
    remove) cmd_remove "$@" ;;
    -h|--help|help) usage ;;
    *) die "unknown command: $cmd" ;;
  esac
}

main "$@"
