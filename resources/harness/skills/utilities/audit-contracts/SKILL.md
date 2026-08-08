---
name: audit-contracts
description: Read-only pass — report contradictions across .ai and optionally tracker milestones; no edits unless user switches workflow.
disable-model-invocation: true
---

# Audit Contracts (read-only)

**Non-destructive** audit. **Do not edit `.ai` or tracker Issues** while executing this checklist unless the user explicitly switches to another workflow.

## Input

- Optional scope note (e.g. "focus on integration contracts").
- Optional **`repo-root`** (defaults to user-indicated product submodule).

## Flow

1. Load **`.ai/vision.json`**, **`.ai/project.json`**, **`.ai/knowledge_map.json`**, mapped **`.ai/specs/`**, and domain **`index.md`** files referenced by the map.
2. Build a **contradiction matrix** in chat:
   - vision ↔ project (naming, audience, links)
   - vision market strategy ↔ PO readiness (flag missing primary competitor before `/ideate`)
   - project metadata ↔ verifiable remotes and board config
   - knowledge_map paths ↔ files on disk
   - domain index summaries ↔ child docs
   - specs ↔ domain contracts
   - **Optional (integration scope)** — declared cross-system contracts ↔ **peer submodule code** read-only when map or user names another product
3. **Optional — tracker** — Run **`detect-provider`**, then adapter **`list_milestones`** / **`list_milestone_issues`**. Compare milestone titles to `.ai` themes at a glance; flag mismatches (tracker is schedule truth; `.ai` is intent truth).
4. Output **findings only**: severity (blocker / polish), suggested **next skill** (`/ideate`, `@architect`, `plan-roadmap`, Product Owner pass). **Zero required diffs** from this pass.

## Goal

Actionable audit report with no mandatory file changes.
