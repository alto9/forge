# Create Stories and Tasks for Session: create-global-contexts

This command will analyze the design session and create Stories (for code changes) and Tasks (for non-code work) based on the session's changed files and goals.

---

STEP 1: Call the get_forge_about MCP tool to understand the Forge workflow and distillation principles.

STEP 2: Retrieve the required schemas:
- get_forge_schema with schema_type "story"
- get_forge_schema with schema_type "task"

STEP 3: Review the design session:

**Session File**: /Users/derrick/Documents/Code/Alto9/oss/cursor-context-engineering/ai/sessions/create-global-contexts.session.md
**Session ID**: create-global-contexts

**Session Content**:
```markdown
---
session_id: create-global-contexts
start_time: '2025-11-08T22:33:15.210Z'
status: completed
problem_statement: create global contexts
changed_files:
  - ai/models/forge-schemas/context.model.md
  - ai/features/studio/sessions/session-management.feature.md
  - ai/specs/extension/cursor-commands-management.spec.md
  - ai/models/forge-schemas/session.model.md
end_time: '2025-11-08T22:57:42.333Z'
---
## Problem Statement

create global contexts

## Goals

Make certain context objects Global so that they are always included in the story generation prompt.

## Approach

Add a global property to context document frontmatter.

## Key Decisions



## Notes



```

**Changed Files During Session** (4 files):

### context.model.md
File: ai/models/forge-schemas/context.model.md
(Could not read file: Error: ENOENT: no such file or directory, open '/Users/derrick/Documents/Code/Alto9/oss/cursor-context-engineering/ai/models/forge-schemas/context.model.md')

### Feature: studio-sessions
File: ai/features/studio/sessions/session-management.feature.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/features/studio/sessions/session-management.feature.md b/ai/features/studio/sessions/session-management.feature.md
index f6e0f1d..345e22f 100644
--- a/ai/features/studio/sessions/session-management.feature.md
+++ b/ai/features/studio/sessions/session-management.feature.md
@@ -212,4 +212,28 @@ Feature: Create Stories Command from Session
     And the agent should create task files for non-code work
     And all stories and tasks should link to session_id
     And all files should be placed in ai/tickets/{session-id}/
+
+  Scenario: Include global contexts in distillation prompt
+    Given I am creating a stories command for a session
+    When the system generates the distillation prompt
+    Then it should scan ai/contexts/ recursively for files with global: true
+    And it should read the full content of each global context
+    And it should include a "Global Contexts" section in the prompt
+    And each global context's full markdown and Gherkin content should be included
+    And this ensures foundational guidance is always available during story generation
+
+  Scenario: Global contexts appear before story generation steps
+    Given a distillation prompt is being generated
+    When global contexts are found
+    Then they should appear in the prompt before the main distillation steps
+    And they should be clearly labeled as "Global Contexts"
+    And they should include the context_id and file path for reference
+    And their full content should be displayed for the agent to use
+
+  Scenario: No global contexts available
+    Given I am creating a stories command
+    When no contexts have global: true in their frontmatter
+    Then the "Global Contexts" section should be omitted from the prompt
+    And the distillation should proceed normally
+    And contexts can still be included via spec_id linkages
 ```
```

### Spec: cursor-commands-management
File: ai/specs/extension/cursor-commands-management.spec.md

**Git Diff** (changes uncommitted):
```diff
diff --git a/ai/specs/extension/cursor-commands-management.spec.md b/ai/specs/extension/cursor-commands-management.spec.md
index e7b0b2b..d4372b4 100644
--- a/ai/specs/extension/cursor-commands-management.spec.md
+++ b/ai/specs/extension/cursor-commands-management.spec.md
@@ -3,7 +3,6 @@ spec_id: cursor-commands-management
 name: Cursor Commands Management and Distribution
 description: Technical specification for managing, validating, and distributing Cursor command files as part of Forge initialization
 feature_id: [welcome-screen]
-model_id: []
 context_id: [vsce]
 ---
 
@@ -636,12 +635,156 @@ If a template change is breaking (changes command behavior):
 - No caching of file contents
 - Minimal memory footprint
 
+## Session Distillation Prompt Generation
+
+### Overview
+
+When a completed session is ready to be distilled into stories and tasks, the system generates a comprehensive prompt that guides the AI agent through the distillation process. This prompt is written to `.cursor/commands/create-stories-{session-id}.md` and includes all necessary context for story generation.
+
+### Distillation Prompt Structure
+
+The generated prompt follows this structure:
+
+1. **STEP 0**: Call MCP tools to get Forge schemas
+2. **STEP 1**: Read session file and understand the problem
+3. **STEP 2**: Review changed files with git diffs
+4. **STEP 3**: Include global contexts (if any)
+5. **STEP 4**: Follow context guidance from linked specs
+6. **STEP 5**: Analyze and create Stories/Tasks
+7. **STEP 6**: Verify completeness
+
+### Global Contexts
+
+**Purpose**: Global contexts provide foundational guidance that should be available for ALL story generation, regardless of specific feature or spec linkages.
+
+**Discovery Process**:
+```typescript
+// Scan ai/contexts/ recursively for files with global: true
+async function findGlobalContexts(workspaceRoot: string): Promise<ContextFile[]> {
+  const contextsDir = path.join(workspaceRoot, 'ai', 'contexts');
+  const globalContexts: ContextFile[] = [];
+  
+  // Recursively scan all .context.md files
+  const contextFiles = await recursiveScan(contextsDir, '.context.md');
+  
+  for (const filePath of contextFiles) {
+    const content = await readFile(filePath);
+    const parsed = parseFrontmatter(content);
+    
+    // Check if global property is true
+    if (parsed.frontmatter.global === true) {
+      globalContexts.push({
+        contextId: parsed.frontmatter.context_id,
+        filePath: filePath,
+        content: content  // Full markdown + Gherkin content
+      });
+    }
+  }
+  
+  return globalContexts;
+}
+```
+
+**Inclusion in Prompt**:
+
+When global contexts are found, they are included in the distillation prompt:
+
+```markdown
+## Global Contexts
+
+The following contexts are marked as global and should inform all story generation:
+
+### build-procedures (ai/contexts/foundation/build-procedures.context.md)
+
+[FULL CONTENT OF build-procedures.context.md]
+
+### local-development (ai/contexts/foundation/local-development.context.md)
+
+[FULL CONTENT OF local-development.context.md]
+
+---
+
+Use the guidance above when creating stories and tasks. These foundational contexts ensure consistency across all implementation work.
+```
+
+**Placement**: Global contexts appear after the changed files section and before the main distillation steps, ensuring the agent has foundational guidance before analyzing specific changes.
+
+**When to Mark as Global**:
+- Build procedures and packaging
+- Local development standards
+- Core architecture patterns
+- Universal coding standards
+- Critical technical constraints
+
+**When NOT to Mark as Global**:
+- Technology-specific guidance (AWS Lambda, React patterns)
+- Feature-specific contexts
+- Optional or situational guidance
+
+### PromptGenerator Implementation
+
+The `PromptGenerator.generateDistillSessionPrompt()` method:
+
+1. Reads the session file
+2. Gathers git diffs for changed files
+3. **Scans for global contexts** (new)
+4. **Includes global context content** (new)
+5. Lists changed files with diffs
+6. Provides step-by-step distillation instructions
+7. Links to relevant features, specs, and models
+
+```typescript
+// packages/vscode-extension/src/utils/PromptGenerator.ts
+
+static async generateDistillSessionPrompt(sessionUri: vscode.Uri): Promise<string> {
+  // ... existing session and changed files logic ...
+  
+  // NEW: Find and include global contexts
+  const globalContexts = await this.findGlobalContexts(workspaceFolder.uri.fsPath);
+  
+  if (globalContexts.length > 0) {
+    prompt += `\n## Global Contexts\n\n`;
+    prompt += `The following contexts are marked as global and should inform all story generation:\n\n`;
+    
+    for (const context of globalContexts) {
+      const relativePath = path.relative(workspaceFolder.uri.fsPath, context.filePath);
+      prompt += `### ${context.contextId} (${relativePath})\n\n`;
+      prompt += context.content + '\n\n';
+      prompt += `---\n\n`;
+    }
+    
+    prompt += `Use the guidance above when creating stories and tasks. These foundational contexts ensure consistency across all implementation work.\n\n`;
+  }
+  
+  // ... continue with distillation steps ...
+}
+```
+
+### Benefits of Global Contexts
+
+1. **Consistent Guidance**: Ensures foundational standards are always applied
+2. **Reduced Errors**: Critical information never missed in story generation
+3. **Better Stories**: Stories include proper build, test, and deployment considerations
+4. **Developer Experience**: Less rework from missing foundational requirements
+
+### Example Use Cases
+
+**Example 1: Build Procedures Always Included**
+- Session changes add a new API endpoint
+- Global context `build-procedures` ensures story includes build steps
+- Global context `local-development` ensures testing guidance is provided
+- Stories automatically reference proper build and test procedures
+
+**Example 2: Technology-Specific vs Global**
+- `build-procedures` → Global (always needed)
+- `aws-lambda-patterns` → Not global (only needed for Lambda stories)
+- `aws-lambda-patterns` linked via spec_id when relevant
+
 ## Future Enhancements
 
 ### Additional Commands
 
 **Possible Future Commands**:
-- `forge-distill.md` - Guide for distilling sessions
 - `forge-review.md` - Guide for reviewing changes
 - `forge-migrate.md` - Guide for migrating projects
```

### session.model.md
File: ai/models/forge-schemas/session.model.md
(Could not read file: Error: ENOENT: no such file or directory, open '/Users/derrick/Documents/Code/Alto9/oss/cursor-context-engineering/ai/models/forge-schemas/session.model.md')


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

**Create Stories** (*.story.md) in ai/tickets/create-global-contexts/ for:
- Code changes and implementations
- New features or feature modifications
- Technical debt improvements
- Refactoring work

**Create Tasks** (*.task.md) in ai/tickets/create-global-contexts/ for:
- Manual configuration in external systems
- Documentation updates outside code
- Third-party service setup
- Manual testing or verification steps

**Critical Requirements:**

1. **Keep Stories MINIMAL** - Each story should take < 30 minutes to implement
2. **Break Down Large Changes** - If a change is complex, create multiple small stories
3. **Use Proper Linkages** - Link stories/tasks to feature_id, spec_id, and model_id from changed files
4. **Link to Session** - ALL stories and tasks MUST include session_id: "create-global-contexts" in their frontmatter
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
- ALL stories and tasks link back to session_id: "create-global-contexts"

Now create all the story and task files in ai/tickets/create-global-contexts/ following the schemas and requirements above.
