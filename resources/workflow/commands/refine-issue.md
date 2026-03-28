# Refine Issue (Step 4: Refining)

This command is the **orchestration contract** for Step 4. It delegates execution behavior to the **Technical Writer** agent (`agents/tech-writer.md`), which is the source of truth for refinement policy and operating steps.

## Input

- GitHub issue reference (`https://.../issues/123`, `owner/repo#123`, or `123`)

## Command responsibilities (orchestration only)

1. Normalize and validate the input issue reference.
2. Resolve repository context (`owner/repo`) and target base branch (`main` unless repo conventions differ).
3. Invoke the `tech-writer` agent with the normalized context.
4. Verify required outputs were produced.

## Delegation contract (to `tech-writer`)

Pass the following execution context to the agent:

- `issue_ref` (normalized issue number + repo context)
- `base_branch` (default `main`)
- `allow_subissues` (`true`)
- `link_parent_branch` (`true`)

Expected behavior and detailed workflow are defined in `agents/tech-writer.md`.

## Required outputs

- Parent issue refined into development-ready form.
- Parent branch `feature/issue-{parent-number}` pushed and linked to the parent issue.
- Optional sub-issues created when helpful, with **no** sub-issue branches.
- Short handoff summary with changes made and any upstream blockers.
- Ticket structure requirements come from `agents/tech-writer.md`:
  - `Mandatory ticket format (parent issues)`
  - `Mandatory ticket format (sub-issues)`

## Precedence rule

If this command file and `agents/tech-writer.md` conflict:

- `refine-issue.md` governs invocation contract and output checks.
- `tech-writer.md` governs execution behavior and refinement rules.
