# Forge MCP Server + VSCode Extension Integration

## Summary of Changes

The Forge VSCode extension has been updated to leverage the MCP server tools for schema validation and research guidance. The extension now generates prompts that **instruct the AI agent** to use the MCP tools.

## Updated Prompt Generators

### 1. New Decision Prompt (`generateNewDecisionPrompt`)

**Before:** Provided hardcoded decision format
**After:** Instructs AI to call `get_glam_schema` with 'decision' to get the proper format

**Workflow:**
1. STEP 1: Call `get_glam_schema` with schema_type "decision"
2. STEP 2: Review the user's input (what's changing, why, proposed change, options)
3. STEP 3: Create decision document adhering to the retrieved schema

**Result:** Ensures decisions always follow the correct ADR format

---

### 2. Distill Decision Prompt (`generateDistillDecisionPrompt`)

**Before:** Provided hardcoded feature/spec formats
**After:** Instructs AI to call `get_glam_schema` for both 'feature' and 'spec'

**Workflow:**
1. STEP 1: Call `get_glam_schema` for "feature" and "spec"
2. STEP 2: Review the decision content
3. STEP 3: Analyze and determine required features/specs
4. STEP 4: Create/update features and specs adhering to retrieved schemas

**Key Points:**
- Features must use Gherkin format (GIVEN/WHEN/THEN)
- Specs must include Nomnoml diagrams where appropriate
- Both must maintain bidirectional references
- Updates represent the NEW DESIRED STATE, not just changes

---

### 3. Convert to Tasks Prompt (`generateConvertToTasksPrompt`)

**Before:** Basic task generation with fixed format
**After:** Comprehensive multi-step workflow using both MCP tools

**Workflow:**

#### STEP 1: Get Schema
Call `get_glam_schema` with schema_type "task"

#### STEP 2: Review Decision & Related Files
- Read decision content
- Include all related features (with full content)
- Include all related specs (with full content)
- Include all related contexts (with full content)

#### STEP 3: Follow Context Instructions
- Extract all `context_id` references from features and specs
- Read each referenced context file
- Follow the GIVEN/WHEN/THEN rules in each context
- Execute required documentation reads, tool uses, or research

#### STEP 4: Research Technical Objects
- Identify all technical objects being created/modified/integrated
- For EACH object, call `get_glam_context` with the spec_object
- Execute the returned research prompt
- Gather complete information about implementation patterns

**Examples of technical objects:**
- AWS services (Lambda, DynamoDB, S3)
- Framework components (React components, Express middleware)
- Infrastructure (Docker, Kubernetes, Terraform)
- Database objects (schemas, tables, indexes)
- API integrations (Stripe, Auth0, external APIs)

#### STEP 5: Create Implementation Tasks
Using all gathered information, create comprehensive task files that:
- Follow the task schema exactly
- Include decision_id, feature_ids, spec_ids, context_ids
- Have status, order, and dependencies
- Contain COMPLETE implementation instructions
- List all affected files
- Provide clear acceptance criteria
- Include specific technical details from research

**Critical:** Each task is a **prompt for an AI agent**, so it must be comprehensive, accurate, and actionable with all necessary context.

---

## How Context Engineering Works

### The Three-Phase Workflow

```
┌─────────────┐
│  DECISION   │  User creates ADR describing what/why/how
│   (ADR)     │  Uses: get_glam_schema('decision')
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  DISTILL    │  AI analyzes decision and updates features/specs
│ FEATURES &  │  Uses: get_glam_schema('feature')
│   SPECS     │        get_glam_schema('spec')
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  CONVERT    │  AI generates detailed implementation tasks
│  TO TASKS   │  Uses: get_glam_schema('task')
│             │        get_glam_context(technical_object) [multiple calls]
│             │        Follows context file instructions
└─────────────┘
```

### Context Linkage System

```
Context Files (ai/contexts/)
     ↓ referenced by
Specs (ai/specs/)
     ↓ linked to
Features (ai/features/)
     ↓ derived from
Decision (ai/decisions/)
     ↓ broken into
Tasks (ai/tasks/)
```

**Context files** provide just-in-time guidance using GIVEN/WHEN/THEN rules:
- Point to documentation
- Specify tools to use
- Define research strategies

**The MCP `get_glam_context` tool** generates research prompts for technical objects, ensuring tasks have complete implementation context.

---

## File Locations

### Updated Files
- `packages/vscode-extension/src/utils/PromptGenerator.ts` - All three prompt generators updated
- `packages/mcp-server/src/index.ts` - Two MCP tools implemented

### New VSIX Package
- `packages/vscode-extension/glam-0.1.0.vsix` - Ready to install

### MCP Server Scripts
- `packages/mcp-server/run-glam-mcp.sh` - Wrapper to ensure correct Node version
- `packages/mcp-server/test-mcp.sh` - Test script to verify server works

---

## Installation & Testing

### Install VSCode Extension
```bash
# In your test project, install the VSIX
code --install-extension /home/danderson/code/alto9/opensource/cursor-context-engineering/packages/vscode-extension/glam-0.1.0.vsix
```

### Configure MCP Server
In your test project's `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "glam": {
      "command": "/home/danderson/code/alto9/opensource/cursor-context-engineering/packages/mcp-server/run-glam-mcp.sh",
      "args": [],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Test the Integration
1. Restart Cursor completely
2. Open command palette: `Forge: New Decision`
3. Fill out the form
4. Copy the generated prompt
5. Paste into AI chat - it should call `get_glam_schema` automatically
6. Verify the AI uses the schema to format the decision

---

## Benefits

### Schema Consistency
- All Forge files adhere to exact schemas
- Schemas are centralized and versioned
- No more format drift between files

### Research-Driven Tasks
- Tasks include comprehensive technical context
- AI researches each technical object before writing instructions
- Results in higher-quality, more accurate task prompts

### Context Engineering
- Context files provide just-in-time guidance
- Prevents context window overload
- Enables scalable knowledge management

### Agentic Workflow
- Each task is a complete prompt ready for AI execution
- Tasks include all necessary information
- Reduces back-and-forth during implementation

---

## Next Steps

1. **Test the full workflow** with a real decision
2. **Create context files** for common technical objects in your project
3. **Refine task generation** based on actual AI execution results
4. **Consider auto-execution** of tasks using Cursor CLI (when stable)

---

## Philosophy

Forge is about **methodical context engineering**:
- Capture intent (Decision)
- Define desired state (Features & Specs)
- Generate actionable instructions (Tasks)
- Provide just-in-time guidance (Contexts)
- Research technical details (get_glam_context)
- Ensure format consistency (get_glam_schema)

The result: **High-quality, comprehensive task prompts that AI agents can execute with minimal clarification.**

