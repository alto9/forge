---
diagram_id: session-status-workflow
title: Session Status Workflow and State Transitions
---

# Diagram: Session Status Workflow

## Description
Visual representation of the session lifecycle, showing status transitions, triggers, and available actions at each stage.

## Diagram

```nomnoml
#title: Forge Session Lifecycle
#direction: right
#spacing: 100
#padding: 20

[<start>Start Session]

[<state>DESIGN|
  status: "design"
  --
  Active session
  Edit features/specs/diagrams
  Track changes in real-time
  Scenario-level tracking
  --
  Actions:
  • Edit design docs
  • Track changes
  • End session
]

[<state>SCRIBE|
  status: "scribe"
  --
  Design complete
  Review changes
  Ready for distillation
  --
  Actions:
  • Review changed files
  • Review scenarios
  • Run forge-scribe
]

[<state>DEVELOPMENT|
  status: "development"
  --
  Tickets created
  Implementation in progress
  Track ticket completion
  --
  Actions:
  • Work on stories
  • Mark stories complete
  • Mark session complete
]

[<state>COMPLETED|
  status: "completed"
  --
  All work finished
  Session archived
  Read-only
  --
  Actions:
  • View only
]

[<end>End]

[Start Session] -> [DESIGN]

[DESIGN] User clicks\n"End Design Session" -> [SCRIBE]

[SCRIBE] User runs\nforge-scribe command\nTickets created -> [DEVELOPMENT]

[DEVELOPMENT] User clicks\n"Mark Complete"\nAll tickets done -> [COMPLETED]

[COMPLETED] -> [End]

[<note>Transitions are one-way\nCannot move backwards\nEach transition requires validation]

[<note>Visual Indicators\nDESIGN: Blue badge\nSCRIBE: Orange badge\nDEVELOPMENT: Purple badge\nCOMPLETED: Green badge]
```

