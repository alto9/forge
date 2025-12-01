---
diagram_id: navigation-menu-structure
name: Navigation Menu Structure
description: Shows the reorganized Forge Studio navigation sidebar with INFORM section for foundational materials and DESIGN section for active design work
diagram_type: component
feature_id: [navigation-menu]
actor_id: []
---

# Navigation Menu Structure

```nomnoml
#direction: down
#padding: 10

[Navigation Sidebar]
[Navigation Sidebar] Contains -> [Dashboard Link]
[Navigation Sidebar] Contains -> [:INFORM: Section]
[Navigation Sidebar] Contains -> [:DESIGN: Section]

[:INFORM: Section] Header -> [":INFORM:" Text]
[:INFORM: Section] Contains -> [Actors Link]
[:INFORM: Section] Contains -> [Contexts Link]
[:INFORM: Section] Contains -> [Diagrams Link]
[:INFORM: Section] Contains -> [Specifications Link]

[:DESIGN: Section] Header -> [":DESIGN:" Text]
[:DESIGN: Section] Contains -> [Sessions Link]
[:DESIGN: Section] Contains -> [Features Link]

[Actors Link] State -> [Always Enabled]
[Contexts Link] State -> [Always Enabled]
[Diagrams Link] State -> [Always Enabled]
[Specifications Link] State -> [Always Enabled]
[Sessions Link] State -> [Always Enabled]
[Features Link] State -> [Session Dependent]
```
