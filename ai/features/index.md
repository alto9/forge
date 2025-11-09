---
folder_id: forge-core
name: Forge Core Features
description: Core user-facing workflows for Forge context engineering
---

# Forge Core Features

## Background

```gherkin
Background: Forge Context Engineering System
  Given a developer working on a software project
  And they need to manage context engineering for AI-assisted development
  And they want to convert design decisions into actionable implementation stories
  When they use Forge
  Then they should have a session-driven workflow
  And they should be able to organize features, specs, models, and contexts
  And they should be able to generate command files that create minimal implementation stories
```

## Rules

```gherkin
Rule: Session-Driven Workflow
  Given a developer using Forge
  When they start a design session
  Then all file changes should be tracked
  And they should be able to create a command file that generates stories and tasks
  And stories should be minimal and focused (< 30 minutes implementation)

Rule: Nestable Organization
  Given any folder in the ai/ structure
  When organizing related concepts
  Then folders should be nestable
  And index.md files should provide shared context
  And linkages between files should be maintained

Rule: Minimal Story Size
  Given a design session with multiple changes
  When creating implementation stories from a session
  Then each story should be minimal and focused
  And complex changes should be broken into multiple stories
  And each story should have clear acceptance criteria
```
