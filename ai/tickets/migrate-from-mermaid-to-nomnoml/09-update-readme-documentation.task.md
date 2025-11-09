---
task_id: update-readme-documentation
session_id: migrate-from-mermaid-to-nomnoml
type: documentation
status: pending
priority: low
---

## Description

Update the README.md files in the repository to reference nomnoml instead of mermaid as the diagramming standard for Forge specs.

## Reason

The README files provide documentation and examples for users. They should reflect the current standard of using nomnoml for diagrams, not the old mermaid format.

## Steps

1. Open `packages/vscode-extension/README.md`
2. Search for any references to "mermaid" (case-insensitive)
3. Replace with "nomnoml" where appropriate
4. Update any example code blocks showing diagram syntax
5. Open root `README.md`
6. Repeat search and replace for mermaid references
7. Check `EXAMPLES.md` for any diagram examples
8. Update examples to use nomnoml syntax
9. Review all changes for accuracy
10. Commit documentation updates

## Resources

- Text editor
- Git CLI
- Nomnoml documentation for syntax examples

## Completion Criteria

- [ ] All mermaid references in README files updated to nomnoml
- [ ] Example diagrams use valid nomnoml syntax
- [ ] Documentation accurately reflects current Forge standards
- [ ] Changes committed to repository

