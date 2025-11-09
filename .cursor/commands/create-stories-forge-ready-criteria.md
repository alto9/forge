# Create Stories and Tasks for Session: forge-ready-criteria

This command will analyze the design session and create Stories (for code changes) and Tasks (for non-code work) based on the session's changed files and goals.

---

STEP 1: Call the get_forge_about MCP tool to understand the Forge workflow and distillation principles.

STEP 2: Retrieve the required schemas:
- get_forge_schema with schema_type "story"
- get_forge_schema with schema_type "task"

STEP 3: Review the design session:

**Session File**: /home/danderson/code/alto9/opensource/cursor-context-engineering/ai/sessions/forge-ready-criteria.session.md
**Session ID**: forge-ready-criteria

**Session Content**:
```markdown
---
session_id: forge-ready-criteria
start_time: '2025-11-06T15:06:09.427Z'
status: completed
problem_statement: forge-ready-criteria
changed_files:
  - ai/features/studio/welcome/welcome-screen.feature.md
  - ai/specs/studio/welcome-initialization.spec.md
  - ai/specs/extension/cursor-commands-management.spec.md
end_time: '2025-11-06T15:30:11.139Z'
---
## Problem Statement

forge-ready-criteria

## Goals

To ensure that cursor commands exist within the project that is being used within Cursor/VSCode and that those commands are accurate.

## Approach

Add these files as part of the existing Forge Ready logic.

## Key Decisions



## Notes



```

**Changed Files During Session** (3 files):

### Feature: welcome-screen
File: ai/features/studio/welcome/welcome-screen.feature.md

**Git Status:** No changes detected (file may have been reverted or changes are identical to HEAD)

### Spec: welcome-initialization
File: ai/specs/studio/welcome-initialization.spec.md

**Git Status:** No changes detected (file may have been reverted or changes are identical to HEAD)

### Spec: cursor-commands-management
File: ai/specs/extension/cursor-commands-management.spec.md

**Git Status:** No changes detected (file may have been reverted or changes are identical to HEAD)


**Note:** Git diffs show uncommitted changes only. Session did not track start commit.

STEP 4: Review changed files and follow context guidance

For each changed file listed above:
1. Review the git diff (if available) to understand exactly what changed
2. If no git diff is available, read the file directly to understand its content
3. Identify any context_id references in the file's frontmatter
4. Read any referenced context files and execute their Gherkin scenarios (GIVEN/WHEN/THEN)

STEP 5: Analyze and break down into Stories and Tasks

Based on the session and the git diffs (or file contents) of changed files:

**IMPORTANT:** Use the git diffs shown above to understand EXACTLY what changed in each file. The diffs show:
- Lines that were added (prefixed with +)
- Lines that were removed (prefixed with -)
- Context around the changes
- Whether files are new, modified, or deleted

If git diffs are not available, read the files directly to understand their current state and determine what needs to be implemented.

This precise change information should guide your story creation - focus on implementing these specific changes.

**Create Stories** (*.story.md) in ai/tickets/forge-ready-criteria/ for:
- Code changes and implementations
- New features or feature modifications
- Technical debt improvements
- Refactoring work

**Create Tasks** (*.task.md) in ai/tickets/forge-ready-criteria/ for:
- Manual configuration in external systems
- Documentation updates outside code
- Third-party service setup
- Manual testing or verification steps

**Critical Requirements:**

1. **Keep Stories MINIMAL** - Each story should take < 30 minutes to implement
2. **Break Down Large Changes** - If a change is complex, create multiple small stories
3. **Use Proper Linkages** - Link stories/tasks to feature_id, spec_id, and model_id from changed files
4. **Link to Session** - ALL stories and tasks MUST include session_id: "forge-ready-criteria" in their frontmatter
5. **Be Specific** - Include exact file paths, clear objectives, and acceptance criteria
6. **Add Context** - Each story should have enough information to be implemented independently
7. **Order Matters** - Set dependencies and order stories logically
8. **Follow Schemas** - All files must adhere to schemas from Step 2

STEP 6: Verify completeness and create files

Ensure that:
- Every changed file is accounted for in at least one story or task
- All stories have clear acceptance criteria
- Dependencies between stories are identified
- The collection of stories fully implements the session goals
- Stories are small enough to be completed quickly
- ALL stories and tasks link back to session_id: "forge-ready-criteria"

Now create all the story and task files in ai/tickets/forge-ready-criteria/ following the schemas and requirements above.
