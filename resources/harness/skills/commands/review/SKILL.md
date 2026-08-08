---
name: review
description: QA formal Change Request review (approve/request-changes/comment); optional board self-heal; retrospective on CR. Does not merge.
disable-model-invocation: true
---

# Review

Invoke **Quality Assurance** (**`.cursor/agents/quality-assurance.md`**) for formal **Review** of a Change Request.

**QA submits a formal Review only.** QA **does not merge**.

---

## Input

- Change Request URL or reference

---

## Workflow

### 1. Parse and load CR

**`detect-provider`** → **`resolve_change_request`**, linked Issues, CI status.

### 2. Review worktree (when local inspection needed)

1. Read **`.cursor/.tmp/build-from-github-issue-*/worktrees.md`** when linked to build session.
2. If no manifest, create **`.cursor/.tmp/review-cr-<N>/worktrees.md`**.
3. Adapter **`fetch_change_request_head_ref`**
4. **`worktree-workspace.sh create --role review --branch <adapter-ref>`**
5. Read-only inspection from **`<wt-path>`** unless workflow explicitly converts to build.
6. Remove review worktree after formal Review submitted (or on abort).

Skip worktree creation for pure remote diff review.

### 3. QA assessment

- Load diff, linked Issues, **`.ai`** when relevant
- Verify against acceptance criteria and Issue inline requirements
- Line comments optional supplements
- Security-focused diff review
- Local test/lint when useful; state limitation when not run

### 4. Submit formal Review (mandatory)

**`submit_review`** via provider adapter with verdict:

- **APPROVE**
- **REQUEST_CHANGES** (blocking)
- **COMMENT**

Must appear on CR **Reviews** tab / approval UI, not merely a conversation comment.

On **REQUEST_CHANGES**, include build worktree path from manifest when known; else recommend **`/build-from-review`**.

### 5. Board self-heal (optional)

When board configured and all sub-issues closed, set parent **`In Review`** if **`/build-from-github`** missed it (idempotent).

### 6. Retrospective

**`retrospective`** utility in **`cr`** mode on the Change Request.

---

## Hard rules

- **Do not merge**
- **Do not** substitute conversation comments for formal Review
- Provider CLI in **non-sandboxed** terminal only

## Goal

Submitted Review with actionable feedback; human merges after approval.
