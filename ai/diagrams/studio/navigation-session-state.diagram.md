---
diagram_id: navigation-session-state
name: Navigation Session State Management
description: Shows how session state affects the enabled/disabled state of navigation items
diagram_type: state
feature_id: [navigation-menu]
actor_id: []
---

# Navigation Session State Management

```nomnoml
#direction: right
#padding: 10

[App State] activeSession -> [null | ActiveSession]

[<choice>Check Session State]
[App State] -> [<choice>Check Session State]

[<choice>Check Session State] No Session -> [Features/Diagrams/Specs Disabled]
[<choice>Check Session State] Active Session -> [All Items Enabled]

[Features/Diagrams/Specs Disabled] Visual -> [Lock Icon|Reduced Opacity|Tooltip]
[All Items Enabled] Visual -> [Full Opacity|No Lock Icon|Active State]
```
