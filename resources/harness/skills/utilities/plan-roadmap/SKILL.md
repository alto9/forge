---
name: plan-roadmap
description: Planner aligns milestones and Issues with validated roadmap using provider adapters; optional stories.md from .cursor/.tmp after ideate.
disable-model-invocation: true
---

# Plan Roadmap

**Planner-owned** utility. The provider tracker (GitHub or GitLab) is the single source of truth for the **roadmap**. Run after vision/contracts stabilize or after **`/ideate`** (optional local **`stories.md`**).

Invoke **`.cursor/agents/planner.md`** for role policy and mandatory Issue format.

## Input

- **`.ai/vision.json`**, **`.ai/project.json`**, **`.ai/knowledge_map.json`**, relevant **`.ai/specs/*.spec.md`**
- Optional **`stories.md`** path under **`.cursor/.tmp/<session>/`**
- Optional Architect recap from chat

## Provider resolution

1. **`detect-provider`** for each affected **`repo-root`**
2. Call **`list_milestones`** and **`list_milestone_issues`** on the matching adapter (**`provider/github`** or **`provider/gitlab`**)

Do **not** hardcode `gh` milestone commands in this skill body; delegate to adapters.

## Operating loop

1. **Load context** — Read `.ai` sources and optional **`stories.md`**. Parse `### Milestone:` headings and **`Story:`** lines per **`repoRef`** section. Never paste **`.cursor/.tmp/`** paths into tracker Issues.
2. **Resolve repository** — `owner/repo` or GitLab project path from **`project.json`** and detection JSON.
3. **Read current tracker state** — Milestones and Issues via provider adapter.
4. **Gap analysis** — Compare tracker to product intent, specs, contracts, and **`stories.md`** when supplied.
5. **Interview** — One focused question at a time when sequencing is unclear; offer a default recommendation.
6. **Prepare self-contained Issue bodies** — Embed known behavior from specs and contracts. **Provenance** lists sources after facts are stated in the body.
7. **Patch specs when planning reveals gaps** — Update **`.ai/specs`** Introduction / Functional sections when appropriate; structural gaps go to Architect.
8. **Write to tracker** — Create or update milestones and **top-level** Issues via provider adapter. Do not destabilize closed milestones without explicit user intent.
9. **Hand off to Technical Writer** — Planner-level Issues stay sharp enough for **`/refine`**; not so sparse that refinement has nothing to do.

## Multi-repo superrepos

When **`stories.md`** lists several **`repoRef`** blocks, repeat the loop per submodule: detect provider, load that repo's `.ai`, write Issues in that remote project.

## Contract freshness preflight

When **`stories.md`** came from **`/ideate`**, read sibling **`worktrees.md`** or open **`.ai`-only Change Request URLs. Prefer merged **`main`** for final Issue bodies. If contract CRs are still open, read their diffs via provider adapter before writing contradictory Issues.

## Goal

Synchronized milestones and Issues reflecting validated roadmap and `.ai` intent.
