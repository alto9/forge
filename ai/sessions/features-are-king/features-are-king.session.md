---
session_id: features-are-king
start_time: '2025-11-11T14:10:47.267Z'
status: development
problem_statement: We need to refine and clarify the Design Session workflow.
changed_files:
  - ai/features/studio/sessions/session-management.feature.md
  - ai/features/studio/sessions/scenario-level-tracking.feature.md
  - ai/specs/studio/session-change-tracking.spec.md
  - ai/features/studio/sessions/session-visual-indicators.feature.md
end_time: '2025-11-11T14:33:37.108Z'
---
## Problem Statement

We need to refine and clarify the Design Session workflow.

## Goals

Make sure that code changes are driven from features, and informed by specs, diagrams, actors, and contexts.

## Approach

Unlock Diagrams and Specs so that they can be edited outside of a design session. They are informative, not directive. Features are directive and typically analagous to code changes to support the feature, the code change is informed by the supporting documentation. Features will be unchanged here.

Update Design Sessions to ONLY track modified/added/deleted scenarios. The session profile should show a diff of scenarios so that we can easily see what has been affected by the session. Remove the git diff functionality, and just track the features and scenarios that are changed during the session. We will need a file watcher to do this, so that if the agent modifies these files, the changes still show in the studio. But we should only have to watch ai/features for changes during a session.

## Key Decisions

- Unlock Diagrams and Specs, no design session relation

## Notes


