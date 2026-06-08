# Presentation

Forge Studio presents workflows as both definitions and live runs.

## Workflow Visualization

React Flow is the visualization layer for workflow definitions and run state. Definition views show nodes, transitions, validators, human input points, activities, and artifact outputs. Run views overlay Temporal-backed state such as active step, completed steps, failed steps, retries, waits, validation failures, and pending human questions.

## Run Inspector

The run inspector presents the selected node, activity details, validation outcomes, artifact references, Cursor SDK run identity, retry state, and available user actions. Human question panels use the workflow definition to describe required input and submit answers through Temporal.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Workflow visual states
- Define node and edge visual states for idle, active, waiting, validating, retrying, failed, cancelled, completed, and skipped states.
- Define UI copy for workflow start, pending human questions, validation failure, retry approval, cancellation, external Temporal connectivity, and local Temporal startup.
