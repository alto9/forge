---
name: architect-this
description: Forge Step 2 — run Architect to align vision with .forge knowledge-map and domain contracts. Use for architectural direction or after Product Intake updates to vision.
disable-model-invocation: true
---

# Architect This (Step 2: Architecting / High Level Design)

This skill invokes the Architect Agent. User → Architect Agent → clarity check → knowledge-map and contract updates → Planner recap.

When market need, user feedback, or strategic direction arrives, use the **Product Intake Prompt** format (see AGENT_FLOW.md). In that case, Product Owner runs first to update `vision.json`, then Architect receives the prompt.

## Input

- Free-form string describing the architectural change or direction, or a Product Intake Prompt

## Architect Agent Flow

1. Retrieve `vision.json` and determine if any adjustments should be made.
2. **Clarity check:** Have enough clarity to update contracts? If no, loop back to user for clarification.
3. Use `.forge/knowledge_map.json` to identify impacted domain contract files.
4. Update impacted domain contract files directly under `.forge/<domain>/`.
5. Invoke Planner with recap of changes made.

## Goal

Successful update of `.forge` documents aligned with vision and domain contracts.
