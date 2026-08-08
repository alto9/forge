---
name: refine
description: Orchestrate issue refinement — tiered Q&A, contracts worktree, complete .ai and Issue specs; delegate to Technical Writer; no feature branches.
disable-model-invocation: true
---

# Refine

Orchestration contract for **Issue refinement**. Delegates execution to **Technical Writer** (**`.cursor/agents/technical-writer.md`**).

**Core method:** tier-User blockers in **`user_questions.md`** + **`refinement.md`**; AskQuestion per **`.cursor/skills/reference/interactive-qa.md`**; tier-SME in **`assumptions.md`**; tier-TW resolves **`## Open implementation decisions`** in **`.ai`** and completes Issue detail.

**No `feature/issue-*` branches.** **`.ai`** edits use a **contracts** worktree (`ai/refine-<repoRef>-<issue#>`) and land in a **`.ai`-only Change Request** when complete.

## Session ownership (this command)

- Mint **`session_slug`** (recommended: `refine-<repoRef>-<issue#>`). Create **`.cursor/.tmp/<session_slug>/`**. TW / Architect share this session for the run.
- Do **not** read `/ideate` or other command tmp folders. Load Issue and `.ai` from the tracker and repo (contracts worktree from `origin/main`).
- Before ending: **always** remove the contracts worktree with **`--session`**. Later humans use the Issue URL and any open `.ai` CR.
- Reference: **`.cursor/skills/reference/worktree-workspace.md`**.

---

## Input

- Issue reference (URL, `owner/repo#123`, or number with repo context)

---

## Decision rubric

| Tier | Owner | Resolved via |
|------|-------|--------------|
| **User** | Requestor | Phase C AskQuestion |
| **SME** | TW + Architect | **`assumptions.md`** |
| **TW work product** | Technical Writer | Phase D Issue + `.ai` updates |

---

## Flow overview

```
Phase A   Workspace prep              issue_context.md + contracts worktree
Phase B   Ground .ai/specs + questions
Phase B.5 Triage                      user_questions.md + assumptions.md
Phase C   User verification           refinement.md
Phase D   Issue + .ai completion      tracker + .ai in worktree (.ai-only CR)
Phase E   Teardown                    remove contracts worktree
```

---

## Phase A — Workspace prep

1. **`detect-provider`**; **`resolve_issue`**; **`resolve_issue_parentage`** when sub-issues exist.
2. Create **`.cursor/.tmp/<session_slug>/`** with **`session.md`**, **`worktrees.md`**, **`issue_context.md`**.
3. **`worktree-workspace.sh create`**:
   - **`--role contracts`**
   - **`--branch ai/refine-<repoRef>-<issue#>`** (or `ai/<session_slug>`)
   - **`--session <session_slug>`**
4. All **`.ai` reads/writes** use the contracts worktree path from this session.

---

## Phase B / B.5 / C

Mirror **`/ideate`** triage at Issue scope. TW loads milestone peer Issues via provider adapter when refinement needs sprint context.

Do not skip Phase C when blockers remain in **`user_questions.md`**.

---

## Phase D — Issue + `.ai` completion

Technical Writer:

1. Resolves **`## Open implementation decisions`** for Issue scope in mapped **`.ai`** child docs.
2. Updates Issue body (and sub-Issues on tracker only when splitting helps).
3. **`git add -A .ai`** in worktree; commit; push; **`.ai`-only Change Request** via provider adapter when diff non-empty.
4. Issue must stand alone: concrete steps, cited prerequisites, no discovery placeholders.
5. Put CR URL in chat summary and **`worktrees.md`**.

---

## Phase E — Teardown (mandatory)

```bash
worktree-workspace.sh remove \
  --superrepo "$SUPERREPO" \
  --repo-root "$REPO_ROOT" \
  --repo-ref "$REPO_REF" \
  --role contracts \
  --session "$SESSION_SLUG"
```

Run on success and on abort. Update manifest status.

---

## Commit message pattern

```text
docs(ai): refine issue #<N> contract updates
```

## Goal

Execution-ready Issue(s), optional **`.ai`-only Change Request**, no implementation branch, session worktree removed. Next command starts from remote Issue/CR only.
