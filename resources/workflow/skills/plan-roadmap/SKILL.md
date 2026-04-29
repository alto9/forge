---
name: plan-roadmap
description: Forge Step 3 — Planner aligns GitHub milestones and issues with the validated roadmap using pull-milestones and pull-milestone-issues skills. Run after vision/contracts (or after /ideate + /architect-this).
disable-model-invocation: true
---

# Plan Roadmap (Step 3: Planning / Delivery packaging)

This skill invokes the Planner Agent. User → agent: Planner → pull-milestones → pull-milestone-issues → determine GitHub changes.

GitHub is the single source of truth for the **roadmap**. Before performing any planning action, the Planner pulls milestones and issues from GitHub to understand current state.

**All agents correct `.forge` when wrong.** If planning exposes false `project.json` fields, domain contracts, or other `.forge` metadata, patch **before** writing contradictory milestones or issues.

## Input

- `.forge/vision.json`, `.forge/project.json`, `.forge/knowledge_map.json`, Architect recap (or equivalent from **`/ideate`**)

## Planner Agent Flow

1. **skill: pull-milestones {owner/repo}** – Retrieve milestones from GitHub. Resolve owner/repo from `.forge/project.json` → `github_url`, `gh repo view`, or pass explicitly.
2. **For each milestone** you need to inspect – Run **pull-milestone-issues** with the GitHub **milestone id** (numeric id from the milestones API / `pull-milestones` output), **not** a Projects "project" id.
3. **skill: pull-milestone-issues `<milestone-id>` [owner/repo]** – List issues for that milestone.
4. **Determine which changes should be made in GitHub** – Add or adjust milestones and planner-level issues via GitHub MCP or `gh` CLI. Do not destabilize past or in-flight work without explicit user intent.

## Goal

Synchronized GitHub milestones and issues reflecting the validated roadmap and `.forge` intent.
