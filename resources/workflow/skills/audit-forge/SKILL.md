---
name: audit-forge
description: Read-only pass — report contradictions across .forge (vision, project, knowledge_map, domain indices) and optionally GitHub milestone titles.
disable-model-invocation: true
---

# Audit Forge (read-only)

This skill defines a **non-destructive** audit. **Do not edit `.forge` or GitHub** while executing this checklist unless the user explicitly switches to another workflow.

## Input

- Optional scope note (e.g. “focus on integration contracts” or “before initiative X”).
- Optional **`owner/repo`** if comparing to GitHub milestones (resolve from `.forge/project.json` → `github_url` or `gh repo view`).

## Flow

1. Load **`.forge/vision.json`**, **`.forge/project.json`**, **`.forge/knowledge_map.json`**, and skim **domain `index.md`** files referenced by the map.
2. Build a **contradiction matrix** in chat:
   - vision ↔ project (naming, audience, links)
   - project metadata ↔ reality (e.g. `github_url`, `github_board` if verifiable)
   - knowledge_map paths ↔ files that exist on disk
   - domain index summaries ↔ child docs (orphan or stale pointers)
3. **Optional — GitHub** — Run **`pull-milestones`** (and **`pull-milestone-issues`** per milestone **id** when needed) from `.forge/skill_registry.json`. Compare milestone titles/descriptions to `.forge` themes **at a glance**; flag mismatches (GitHub is roadmap truth; `.forge` is intent truth—both should be explainable together).
4. Output **findings only**: severity (blocker / polish), suggested **next skill** (`/architect-this`, `/plan-roadmap`, Product Owner pass), no file patches in this skill.

## Goal

Actionable audit report with **zero** required diffs from this step.
