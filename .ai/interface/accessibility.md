# Accessibility

Workflow visualization must remain usable without relying on graph visuals alone.

## Accessibility Rules

- React Flow graph state has a corresponding textual run summary, ordered step list (`step_list` in `.ai/data/serialization.md` **Workflow graph model**), and detail panel.
- Graph nodes expose `status_label` as accessible name; `visual_state` changes are announced when the step list selection or active node changes.
- Pending human questions are reachable by keyboard in the Question panel (#27): each `prompts[]` field exposes its `label` as the accessible name; **Blocker** items include badge text in the name; **Submit answers** exposes busy state during Temporal update.
- Start Run input collection exposes each declared `run_inputs[]` label as the accessible name, required state in the description, and visible validation messages for missing or invalid values.
- Status colors for nodes, edges, validation, and retry state are paired with text or icons that do not require color perception.
- **Retrying** nodes include attempt counts in the accessible name (e.g. "Retrying 2 of 3").
- **Waiting** nodes distinguish "Waiting for input" vs "Waiting" in the status label.
- Retry, cancel, continue, and inspect actions expose disabled reasons when the current workflow state does not permit the action.
- Start Run disabled states expose the reason as visible text, not only a tooltip.
- Artifact and validation panels preserve heading structure and focus order as users move between graph, details, and question forms (#28).
- Run inspector detail panel sections expose `h3` headings for Summary, Activity, Retry, Validation, Artifacts, and Recovery actions; focus order follows section order top-to-bottom.
- Expandable validation diagnostics in the inspector include severity prefix ("Error", "Warning") in the accessible name.
- Truncated artifact previews include "Showing first 32 KiB" in the accessible description when the cap applies.
- Keyboard users can move focus between the step list sidebar and the React Flow canvas; selecting a step list item focuses the corresponding node.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
