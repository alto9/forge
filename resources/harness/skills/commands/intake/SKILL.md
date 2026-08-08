---
name: intake
description: Small-scope intake — PO, Architect, TW inline Q&A; output refined content on a single Issue; no tmp folder.
disable-model-invocation: true
---

# Intake (Small scope)

Lightweight orchestration for **one feature or fix** that does not need full **`/ideate`** decomposition. Creates or updates **a single Issue** with enough context for **`/refine`** or direct **`/build`** when already clear.

**Agents:** Product Owner (scope and vision fit), Architect (contract pointers and repo ownership), Technical Writer (Issue structure and acceptance criteria).

**No tmp folder.** Use inline AskQuestion per **`.cursor/skills/reference/interactive-qa.md`**. Decisions land directly on the **Issue body** (and optional Issue comments), not **`.cursor/.tmp/`**.

---

## When to use intake vs ideate

| Signal | Use |
|--------|-----|
| Single repo, bounded scope, no new capability map | **`/intake`** |
| Multi-repo initiative, new specs, SME fan-out, stories.md | **`/ideate`** |
| User explicitly says "small" or "one ticket" | **`/intake`** |

---

## Input

- User description of the work (problem, desired outcome, constraints)
- Optional existing Issue URL/number to update instead of create

---

## Flow

```
1. PO — vision/project fit, scope boundary (inline Q&A if needed)
2. Architect — resolve repo-root, repoRef, affected .ai domains (read-only)
3. TW — draft Issue sections on tracker (create or update)
4. Handoff — /refine when contracts need completion; /build when execution-ready
```

---

## Step 1 — Product Owner

- Read **`.ai/vision.json`** and **`.ai/project.json`** for the target repo.
- Confirm the ask fits product direction. Ask **one or two** scope questions when ambiguous.
- Do **not** edit vision/project unless user confirms a factual correction.

---

## Step 2 — Architect

- Confirm **`repo-root`** and **`repoRef`**.
- Skim **`knowledge_map.json`** and relevant domain indices.
- List **contract citations** TW should embed in the Issue (distilled facts, not bare `.ai` links as the only requirement).
- Flag if **`/ideate`** is more appropriate (cross-repo, new capability boundary).

---

## Step 3 — Technical Writer

- **`detect-provider`** for **`repo-root`**
- Create or update **one Issue** via provider adapter with mandatory sections:
  - **Summary**
  - **User story** (when applicable)
  - **Scope / non-goals**
  - **Implementation outline** (high level)
  - **How to test locally** (placeholders OK with TODO when unknown)
  - **Acceptance criteria**
  - **Provenance** (which `.ai` docs informed the ticket)
- Use inline AskQuestion for tier-User blockers; update Issue body as answers arrive.
- **Do not** create **`feature/issue-*`** branches.
- **Do not** create contracts worktrees unless user explicitly requests `.ai` edits in the same session (then use **`/refine`** instead).

---

## Output

- **Single Issue URL** with self-contained body
- Chat summary: recommended next command (`/refine` or `/build`)

---

## Anti-patterns

- Creating **`.cursor/.tmp/`** session folders for intake
- Splitting into multiple Issues without user approval
- Deferring entire requirements to "see `.ai/...`" without distilled facts in the body
- Opening `.ai`-only Change Requests during intake (use **`/refine`** for contract PRs)

## Goal

One execution-oriented Issue with PO/Architect alignment and no local tmp artifact tree.
