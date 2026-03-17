# Architect This (Step 2: Architecting / High Level Design)

This command invokes the Architect Agent. User → Architect Agent → clarity check → SME subagents (async) → Planner recap.

When market need, user feedback, or strategic direction arrives, use the **Product Intake Prompt** format (see AGENT_FLOW.md). In that case, Product Owner (Visionary) runs first to update `vision.json`, then Architect receives the prompt.

## Input

- Free-form string describing the architectural change or direction, or a Product Intake Prompt

## Architect Agent Flow

1. Retrieve `vision.json` and determine if any adjustments should be made.
2. **Clarity check:** Have enough clarity to prompt SME agents? If no, loop back to user for clarification.
3. Examine user input to determine which SME subagents to invoke (async): Runtime, BusinessLogic, Data, Interface, Integration, Operations.
4. Each SME: (a) Examine Prompt Input, (b) Examine files within my respective subject area and make concise updates.
5. Invoke Planner subagent with recap of changes made.

## Goal

Successful update of `.forge` documents aligned with vision and domain contracts.
