---
task_id: mark-build-contexts-as-global
session_id: create-global-contexts
type: documentation
status: completed
priority: medium
---

# Mark Build and Development Contexts as Global

## Description

Update the `build-procedures.context.md` and `local-development.context.md` files to mark them as global contexts by adding `global: true` to their frontmatter. These foundational contexts should be included in all story generation to ensure proper build and development guidance.

## Reason

Build procedures and local development standards are foundational guidance that should be available for ALL story generation, regardless of specific feature or spec linkages. This ensures stories always include proper build steps, testing guidance, and development standards.

## Steps

1. Open `ai/contexts/foundation/build-procedures.context.md`
2. Add `global: true` to the frontmatter
3. Verify the file is still valid markdown with proper YAML frontmatter
4. Open `ai/contexts/foundation/local-development.context.md`
5. Add `global: true` to the frontmatter
6. Verify the file is still valid markdown with proper YAML frontmatter
7. Test by running a distillation command and verifying these contexts appear

## Example Frontmatter

```yaml
---
context_id: build-procedures
category: foundation
name: Build Procedures and Packaging
description: Comprehensive guide for building and packaging Forge packages
global: true
---
```

## Resources

- File: `ai/contexts/foundation/build-procedures.context.md`
- File: `ai/contexts/foundation/local-development.context.md`
- Spec: `ai/specs/extension/cursor-commands-management.spec.md` (for guidance on when to mark as global)

## Completion Criteria

- [ ] build-procedures.context.md has global: true in frontmatter
- [ ] local-development.context.md has global: true in frontmatter
- [ ] Both files have valid YAML frontmatter
- [ ] Files are properly formatted markdown
- [ ] Tested that contexts appear in distillation prompts

