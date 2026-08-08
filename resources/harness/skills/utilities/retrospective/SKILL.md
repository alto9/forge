---
name: retrospective
description: Post concise workflow retrospective comment on Issue or Change Request after build or review sessions.
disable-model-invocation: true
---

# Retrospective Utility

Post a short **workflow retrospective** comment on the tracker after **`/build`**, **`/build-from-review`**, or **`/review`** completes. Captures what worked or failed in skills, board updates, worktree flow, and provider calls.

## Modes

| Mode | Target | When |
|------|--------|------|
| `issue` | Issue conversation | After **`/build`** opens or updates a Change Request |
| `cr` | Change Request conversation | After **`/review`** submits formal Review |

## Input

- **`mode`** — `issue` or `cr`
- **`repo-root`**
- Issue number or Change Request number/URL
- Optional session slug (read **`.cursor/.tmp/<session>/session.md`** for context)

## Workflow

1. **`detect-provider`** for **`repo-root`**
2. Draft retrospective (3-8 sentences):
   - Branch / worktree path used
   - Validation run (pass/fail summary)
   - Board status changes (if any)
   - Provider friction (auth, missing board config)
   - Obvious next step (re-review, merge human gate, fix CI)
3. **`post_comment`** via provider adapter
4. Do **not** paste **`.cursor/.tmp`** file paths or absolute worktree paths into the comment unless the team explicitly wants internal paths (default: omit).

## Template

```markdown
## Workflow retrospective

**Session:** {short description}

- **Worktree:** {repoRef}/{role} used; active checkout unchanged on main
- **Validation:** {test/lint/build summary}
- **Board:** {status changes or "not configured"}
- **Notes:** {skills or provider issues}

**Next:** {e.g. QA re-review, human merge, fix failing check}
```

## Goal

Lightweight process memory on the Issue or Change Request without replacing formal QA Review bodies.
