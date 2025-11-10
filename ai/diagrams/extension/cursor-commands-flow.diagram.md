---
diagram_id: cursor-commands-flow
name: Cursor Commands Management Flow
description: Shows the flow of command template loading, validation, and generation
diagram_type: flow
feature_id: []
spec_id: [cursor-commands-management]
actor_id: []
---

# Cursor Commands Management Flow

```nomnoml
#direction: down
#padding: 10
#fontSize: 12

[Extension Activation] -> [Load Command Templates]
[Load Command Templates] -> [Templates Stored in Memory|<success>]

[Check Project Readiness] -> [Read Command Files]
[Read Command Files] -> [Validate Hash]
[Validate Hash] -> [<choice>Hash Valid?]
[<choice>Hash Valid?] Yes -> [File is Valid|<success>]
[<choice>Hash Valid?] No -> [File is Invalid/Outdated|<error>]

[Initialize Project] -> [Generate Commands]
[Generate Commands] -> [Compute Hash]
[Compute Hash] -> [Embed Hash Comment]
[Embed Hash Comment] -> [Write File to Project]
```
