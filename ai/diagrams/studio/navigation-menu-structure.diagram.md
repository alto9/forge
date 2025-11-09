---
diagram_id: navigation-menu-structure
name: Navigation Menu Structure
description: Shows the organization of the Forge Studio navigation sidebar with foundational and design sections
diagram_type: component
feature_id: [navigation-menu]
spec_id: [navigation-menu-implementation]
actor_id: []
---

# Navigation Menu Structure

```nomnoml
#direction: down
#padding: 10

[Navigation Sidebar]
[Navigation Sidebar] Contains -> [Dashboard Link]
[Navigation Sidebar] Contains -> [Foundational Section]
[Navigation Sidebar] Contains -> [Design Section]

[Foundational Section] Header -> ["FOUNDATIONAL" Text]
[Foundational Section] Contains -> [Actors Link]
[Foundational Section] Contains -> [Contexts Link]
[Foundational Section] Contains -> [Sessions Link]

[Design Section] Header -> ["DESIGN" Text]
[Design Section] Contains -> [Features Link]
[Design Section] Contains -> [Diagrams Link]
[Design Section] Contains -> [Specs Link]

[Actors Link] State -> [Always Enabled]
[Contexts Link] State -> [Always Enabled]
[Sessions Link] State -> [Always Enabled]
[Features Link] State -> [Session Dependent]
[Diagrams Link] State -> [Session Dependent]
[Specs Link] State -> [Session Dependent]
```

## Notes

This diagram shows how the navigation menu is structured with two main sections: Foundational (always accessible) and Design (requires active session).

