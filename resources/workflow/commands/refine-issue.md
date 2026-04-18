# Refine Issue (Step 4: Refining)

This command is the **orchestration contract** for Step 4. It delegates execution behavior to the **Technical Writer** agent (**`@technical-writer`** in chat; agent markdown at **`~/.cursor/agents/technical-writer.md`** after **Forge: Initialize Cursor Agents**), which is the source of truth for refinement policy and operating steps. Extension source: `resources/workflow/agents/technical-writer.md`.

## Input

- GitHub issue reference (`https://.../issues/123`, `owner/repo#123`, or `123`)

## Command responsibilities (orchestration only)

1. Normalize and validate the input issue reference.
2. Resolve repository context (`owner/repo`) and target base branch (`main` unless repo conventions differ).
3. **Normalize to parent issue when the input is a sub-issue** — Before delegating to Technical Writer, determine whether the normalized issue is a GitHub **sub-issue** of another issue. Run the **`resolve-issue-parentage`** skill from `.forge/skill_registry.json` (`command_assignments.refine-issue` / `agent_assignments.tech_writer`), or equivalently `gh api repos/{owner}/{repo}/issues/{issue_number}/parent` ([sub-issues REST API](https://docs.github.com/rest/issues/sub-issues)): on **200**, read the parent issue’s `number` and treat that as the **working issue** for refinement; on **404**, the input issue is top-level and remains the working issue. Technical Writer always refines this **working (parent) issue** and may add or update **sub-issues** under it — never refine only a child in isolation when a parent exists.
4. Invoke the **`@technical-writer`** agent with the normalized context for the **working issue** (parent).
5. Verify required outputs were produced.

## Delegation contract (to Technical Writer / `@technical-writer`)

Pass the following execution context to the agent:

- `issue_ref` (normalized **parent** issue number + repo context after step 3)
- `base_branch` (default `main`; informational for issue text only — refinement does **not** create git branches)
- `allow_subissues` (`true`)
- `original_issue_ref` (optional) — the pre-normalization issue number if it differed from the working parent (so the agent can note redirect in the summary)

Expected behavior and detailed workflow are defined in **`~/.cursor/agents/technical-writer.md`** (after global Cursor agent init) and in the extension at **`resources/workflow/agents/technical-writer.md`**.

## Required outputs

- **Parent (working) issue** refined into development-ready form.
- Optional sub-issues created or updated when helpful (**no** git branches in this phase).
- Short handoff summary with changes made and any upstream blockers (include if input was redirected from a sub-issue to the parent).
- Ticket structure requirements come from **`.github/ISSUE_TEMPLATE/`** when the repo defines templates; otherwise from **`technical-writer.md`** (paths above), including:
  - `Mandatory ticket format (parent issues)`
  - `Mandatory ticket format (sub-issues)`

## Precedence rule

If this command file and **`technical-writer.md`** conflict:

- `refine-issue.md` governs invocation contract and output checks.
- `technical-writer.md` governs execution behavior and refinement rules.
