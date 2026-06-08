# Accessibility

Workflow visualization must remain usable without relying on graph visuals alone.

## Accessibility Rules

- React Flow graph state has a corresponding textual run summary, ordered step list, and detail panel.
- Pending human questions are reachable by keyboard and expose clear labels, validation messages, and submission state.
- Status colors for nodes, edges, validation, and retry state are paired with text or icons that do not require color perception.
- Retry, cancel, continue, and inspect actions expose disabled reasons when the current workflow state does not permit the action.
- Artifact and validation panels preserve heading structure and focus order as users move between graph, details, and question forms.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
