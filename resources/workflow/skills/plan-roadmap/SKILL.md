---
name: plan-roadmap
description: Forge Step 3 — Planner aligns GitHub milestones and issues with the validated roadmap using pull-milestones and pull-milestone-issues skills.
disable-model-invocation: true
---

# Plan Roadmap (Step 3: Planning / Low Level Design)

This skill invokes the Planner Agent. User → agent: Planner → pull-milestones → pull-milestone-issues → determine GitHub changes.

GitHub is the single source of truth. Before performing any planning action, the Planner pulls milestones and issues from GitHub to understand current state.

## Input

- `.forge/vision.json`, `.forge/knowledge_map.json`, Architect recap

## Planner Agent Flow

1. **skill: pull-milestones {owner/repo}** – Retrieve all milestones from GitHub. Resolve owner/repo from `gh repo view` or pass explicitly.
2. **For each milestone returned** – Retrieve issues for the milestone.
3. **skill: pull-milestone-issues {projectId}** – Run with the milestone number to get issues.
4. **Determine which changes should be made in GitHub** – Add or adjust milestones or milestone issues via GitHub MCP or `gh` CLI. Do not update past or in-flight tickets.

## Goal

Synchronized GitHub milestones and issues reflecting the validated roadmap.
