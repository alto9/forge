---
story_id: create-context-model-schema
session_id: create-global-contexts
feature_id: [studio-sessions]
spec_id: [cursor-commands-management]
model_id: []
context_id: []
status: pending
priority: high
estimated_minutes: 20
---

# Create Context Model Schema with Global Property

## Objective

Create the `context.model.md` file in `ai/models/forge-schemas/` that documents the context model schema, including the new `global` property for marking contexts that should be included in all story generation prompts.

## Context

During the design session, the context model was enhanced to support a `global` property. When a context has `global: true` in its frontmatter, it should be automatically included in all distillation prompts to provide foundational guidance for story generation.

## Implementation Steps

1. Create `ai/models/forge-schemas/context.model.md`
2. Add proper frontmatter with model_id: "context"
3. Document the context model schema with all properties:
   - `context_id` (required, string) - Unique identifier
   - `category` (required, string) - Category (foundation, vscode, etc.)
   - `name` (required, string) - Display name
   - `description` (required, string) - Description of the context
   - `global` (optional, boolean) - Mark context as global (default: false)
4. Document the Gherkin structure format for context files
5. Include example context file structure
6. Add validation rules
7. Document when to use `global: true` vs `global: false`

## Files Affected

- `ai/models/forge-schemas/context.model.md` - Create new file

## Acceptance Criteria

- [ ] context.model.md file created with proper structure
- [ ] All properties documented with types and descriptions
- [ ] global property clearly documented with usage guidance
- [ ] Examples show both global and non-global contexts
- [ ] Validation rules are documented
- [ ] File structure follows model schema pattern
- [ ] Gherkin structure documentation is clear

## Dependencies

None

