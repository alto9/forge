---
session_id: migrate-from-mermaid-to-nomnoml
start_time: '2025-11-09T00:21:25.141Z'
status: awaiting_implementation
problem_statement: migrate from mermaid to nomnoml
changed_files:
  - ai/specs/extension/cursor-commands-management.spec.md
  - ai/specs/package/monorepo.spec.md
  - ai/specs/build/webpack.spec.md
  - ai/specs/studio/forge-studio-implementation.spec.md
  - ai/specs/studio/welcome-initialization.spec.md
  - ai/features/studio/specs/spec-editing.feature.md
  - ai/features/studio/specs/spec-detail-view.feature.md
  - ai/features/studio/specs/spec-creation.feature.md
end_time: '2025-11-09T00:32:53.770Z'
command_file: .cursor/commands/create-stories-migrate-from-mermaid-to-nomnoml.md
---
## Problem Statement

migrate from mermaid to nomnoml

## Goals

Mermaid is too hard to work with, we need a diagram library that is smaller, and easier to read and modify.

## Approach

We would like to switch to nomnoml. Spec profiles in the studio should be updated to render all nomnoml diagrams locally. In 'view only' mode we would see a diagram render only. In a design session we would see the diagram source and the render, and the developer could switch between them with a 2 button toggle. Upgrade all instructions that reference mermaid or specs if they require it.

## Key Decisions

Decided to use nomnoml over graphviz, mermaid, and other options.

## Notes

We will need to migrate our existing specs with this change.
