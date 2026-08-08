---
name: ideate
description: Large initiative decomposition — tmp workspace, contracts worktrees, SME tiered Q&A, .ai-only Change Requests, stories.md handoff to plan-roadmap.
disable-model-invocation: true
---

# Ideate (Large initiative decomposition)

Orchestration skill: turn one **large idea** into **timeless `.ai` contracts**, durable **`.ai/specs`**, structured **`stories.md`**, and **Planner-ready** backlog intent.

**Agents:** Product Owner (Phase A.5 gate), Architect (orchestration + SMEs), Marketing Manager (positioning input when go-to-market scope is in play), domain SMEs as Task agents (`business-logic-sme`, `data-sme`, …).

**Models:** Prefer a **high-reasoning parent** for this skill. PO / Architect / QA are Think (`inherit`); SMEs are **`model: fast`**. See **`.cursor/skills/reference/model-policy.md`**.

**Core method:** domain **SME Task agents** classify tier-User decisions into **`user_questions.md`**. **Tier-User blockers** use **AskQuestion** per **`.cursor/skills/reference/interactive-qa.md`**. **Tier-SME** → **`assumptions.md`**. **Tier TW** → **`## Open implementation decisions`** in mapped **`.ai`** child docs (consumed by **`/refine`**).

**Non-goals:** application code changes. **Product Owner Phase A.5** is required before Architect SME fan-out.

**Superrepo context:** harness lives at **`.cursor/`** (superrepo root). Product contracts live in each submodule **`.ai/`**. Active submodule checkouts stay on **`main`**. Ideation edits run in **contracts** worktrees under **`{worktreesRoot}/{repoRef}/contracts/`**.

**Tmp artifacts:** **`.cursor/.tmp/<session_slug>/`** is gitignored. **`ideation.md`**, **`po_evaluation.md`**, **`user_questions.md`**, **`assumptions.md`**, **`refinement.md`**, **`stories.md`**, SME reports stay **local-only** and **must not be committed**.

---

## Decision rubric

| Tier | Owner | Resolved via | Examples |
|------|-------|--------------|----------|
| **Product strategy** | Product Owner | Phase A.5 **`po_evaluation.md`** | Off-vision scope, weak differentiation, timing, competitor gap |
| **User** | Requestor | Phase A (cap 3) + Phase C AskQuestion | Scope, repo inclusion, build-vs-buy, trust model, cross-repo ownership |
| **SME** | Architect + SMEs | **`assumptions.md`** | Naming from conventions; facts from `.ai` and read-only peer code |
| **Defer to TW** | Technical Writer | **`## Open implementation decisions`** + **`/refine`** | Field shapes, env vars, timeouts, exhaustive test matrices |

---

## Flow overview

```
Phase A   Workspace prep              ideation.md + contracts worktrees
Phase A.5 PO strategic evaluation      po_evaluation.md  (blocking)
Phase B   SME question generation     tmp/<repoRef>/<domain>.md
Phase B.5 Architect triage             user_questions.md + assumptions.md
Phase C   User verification            refinement.md
Phase D   Contract drafting            .ai + .ai/specs in worktrees (.ai-only CR per repo) + stories.md
Phase E   Planner                      plan-roadmap utility
```

**Do not skip Phase A.5, B, or B.5.** Do not skip Phase C when **`user_questions.md`** has unresolved blockers.

---

## Phase A — Workspace prep

1. Create **`.cursor/.tmp/<session_slug>/`** with **`session.md`**, **`worktrees.md`**, **`ideation.md`** (initiative prompt, affected repos, domain hints, known decisions).
2. Per affected submodule:
   - **`detect-provider`**
   - **`worktree-workspace.sh create`** with **`--role contracts`**, **`--branch ai/<session_slug>`**
   - Record row in **`worktrees.md`**
3. Cap **pre-fan-out** AskQuestion at **three** (repo scope, initiative boundary, contradictory intent).

---

## Phase A.5 — Product Owner gate

**`.cursor/agents/product-owner.md`** writes **`po_evaluation.md`**.

Verdict: **`Proceed`**, **`ProceedWithConditions`**, **`Pivot`**, **`Defer`**, or **`Reject`**.

Only **`Proceed`** or user-accepted **`ProceedWithConditions`** allows Phase B.

---

## Phase B / B.5 — SME questions and triage

Architect fans out **real SME Task agents** (not `generalPurpose`):

```text
Task(subagent_type="business-logic-sme" | "data-sme" | "integration-sme" |
                 "interface-sme" | "operations-sme" | "runtime-sme" |
                 "schemas-sme")
```

Include `worktree_path`, `repoRef`, briefing, `tmp_dir`, and phase **B (questions only)** in each prompt. Parallelize independent domains.

SMEs write **`tmp/<repoRef>/<domain>.md`** with tiered sections. Phase B is question-only (minimal `.ai` edits).

Architect produces **`user_questions.md`** (cap **8** tier-User) and **`assumptions.md`**.

---

## Phase C — User verification

AskQuestion batches against **`user_questions.md`** only. Answers in **`refinement.md`**.

---

## Phase D — Contract drafting

1. Re-delegate SME Task agents (`*-sme`) with **`refinement.md`**, **`assumptions.md`**, worktree paths, phase **D (contracts)**.
2. Draft **`.ai/<domain>/`** in contracts worktrees; tier-TW backlog in **`## Open implementation decisions`**.
3. Architect updates **`.ai/specs/`** and **`knowledge_map.json`** when structure requires it.
4. **Marketing Manager** contributes positioning notes to **`ideation.md`** or tmp when GTM scope applies (no false market facts).
5. **Commit, push, open `.ai`-only Change Request** per affected repo via provider adapter (**`.ai` paths only**).
6. Record CR URLs in **`worktrees.md`** and **`ideation.md`** metadata.
7. Write **`stories.md`** for **`plan-roadmap`** (no tmp paths in tracker).

### Open implementation decisions (section contract)

```markdown
## Open implementation decisions

Implementation-level items not yet fully specified. `/refine` resolves these into timeless contract prose.

### {story-or-theme}
- {bullet}
```

---

## Phase E — Planner

Run **`plan-roadmap`** utility with path to **`stories.md`**.

---

## Cleanup

After CRs are opened (or on abort): **`worktree-workspace.sh remove --role contracts`** per repo unless user keeps worktrees for follow-up. Update **`worktrees.md`** status to **`cr-opened`** or **`removed`**.

## Goal

Timeless multi-repo contracts, local **`stories.md`**, and **`.ai`-only Change Requests** ready for merge before downstream **`/refine`** and **`/build-from-github`**.
