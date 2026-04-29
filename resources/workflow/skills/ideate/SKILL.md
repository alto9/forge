---
name: ideate
description: Forge Ideation — decompose a large initiative into product compartments (vision/project), technical compartments (Architect / knowledge_map), and a roadmap sketch before plan-roadmap.
disable-model-invocation: true
---

# Ideate (Initiative decomposition)

This skill orchestrates **Ideation**: turning one **large idea** into compartments that match Forge—**product** (`vision.json`, `project.json`), **technical** (`knowledge_map.json` + domain contracts via Architect), and **delivery** (GitHub milestones/issues via Planner **after** `/plan-roadmap`).

See **`resources/workflow/agents/AGENT_FLOW.md`** (Ideation section, Product Intake template) and **`resources/workflow/agents/forge-help.md`**.

**All agents correct `.forge` when it is wrong**; stewards are **Product Owner** (intent JSON) and **Architect** (knowledge map shape). Prefer minimal edits and current-state contracts.

## Input

- Free-form **initiative narrative**, or structured intake including themes, non-goals, success signals, and optional **contract mapping hints** (which domains move).

## Flow (enforce order in chat)

1. **Decompose in chat (no repo writes yet)** — Produce a short artifact: initiative name, 2–5 **themes**, **non-goals**, **success signals**, and which **`.forge/<domain>/`** areas likely change. One-question-at-a-time if the user is still fuzzy.
2. **Product Owner** — Update **`.forge/vision.json`** and **`.forge/project.json`** to match validated product compartments.
3. **Architect** — Invoke **`/architect-this`** (or delegate to `@architect`) with the same initiative context; align **`knowledge_map.json`** and impacted domain contracts.
4. **Roadmap sketch (optional, chat-only)** — Propose milestone titles, order, and trace lines (“touches: `business_logic/domain_model.md`, …”) **before** GitHub edits.
5. **Planner** — User runs **`/plan-roadmap`** to create/update GitHub milestones and planner-level issues. If planning reveals **wrong `.forge` facts**, patch them (any agent) before contradicting GitHub.

## Goal

Coherent initiative breakdown with `.forge` and chat aligned, ready for **`/plan-roadmap`** and downstream **Technical Writer** → **Engineer** → **Quality Assurance**.
