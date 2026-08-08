---
name: review
description: QA formal Change Request review (approve/request-changes/comment); optional board self-heal; retrospective on CR. Does not merge.
disable-model-invocation: true
---

# Review

Invoke **Quality Assurance** (**`.cursor/agents/quality-assurance.md`**) for formal **Review** of a Change Request.

**QA submits a formal Review only.** QA **does not merge**.

## Session ownership (this command)

- Mint **`session_slug`** (recommended: `review-cr-<N>`). When using a local checkout, create **`.cursor/.tmp/<session_slug>/`**.
- **Do not** read prior `/build-from-github` or `/build-from-review` tmp folders on this or another workstation.
- Default: create a session-scoped **review** worktree from the CR head via provider adapter; remove it after formal Review (or abort).
- Remote-only review (no worktree) only when the operator **explicitly** skips local checkout. Still no prior-tmp dependency.
- Handoff after REQUEST_CHANGES is the **CR URL** (recommend `/build-from-review`), not a local path from another session.
- Reference: **`.cursor/skills/reference/worktree-workspace.md`**.

---

## Input

- Change Request URL or reference

---

## Workflow

### 1. Parse and load CR

**`detect-provider`** → **`resolve_change_request`**, linked Issues, CI status.

### 2. Review worktree (default when local inspection needed)

1. Create **`.cursor/.tmp/<session_slug>/`** with **`session.md`**, **`worktrees.md`**.
2. Adapter **`fetch_change_request_head_ref`**
3. **`worktree-workspace.sh create --role review --branch <adapter-ref> --session <session_slug>`**
4. Read-only inspection from **`<wt-path>`**.
5. After formal Review (or abort): **`worktree-workspace.sh remove --role review --session <session_slug>`**.

Skip steps 1–5 only when the operator explicitly requests remote-only review.

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

On **REQUEST_CHANGES**, recommend **`/build-from-review`** with the CR URL. Do not require another session’s worktree path.

### 5. Board self-heal (optional)

When board configured and all sub-issues closed, set parent **`In Review`** if **`/build-from-github`** missed it (idempotent).

### 6. Retrospective

**`retrospective`** utility in **`cr`** mode on the Change Request.

### 7. Teardown

If a review worktree was created this session, remove it before ending (even if step 2 already did).

---

## Hard rules

- **Do not merge**
- **Do not** substitute conversation comments for formal Review
- Provider CLI in **non-sandboxed** terminal only

## Goal

Submitted Review with actionable feedback; session review worktree removed; human merges after approval.
