# Api Contracts

Forge workflow APIs are boundary contracts between the extension, Temporal workers, Cursor SDK agent activities, validators, and GitHub.

## Cursor SDK Boundary

Cursor SDK is the boundary for bounded agent activities. Workflow activities pass a constrained request to the Cursor SDK, receive an activity output envelope, and hand that envelope to deterministic validators before the workflow proceeds.

Forge does not treat raw model output as accepted workflow state. The Cursor SDK response becomes usable only after schema, artifact, and domain validation accept the envelope.

## Temporal Boundary

The Forge extension starts or connects to workflow runs through a Temporal client. Workers execute workflow and activity code outside the VS Code extension host. Human answers resume waiting workflows through declared Temporal signals or updates.

## GitHub Boundary

GitHub APIs remain the boundary for issue, milestone, project, pull request, and planning state. Workflow definitions can reference GitHub activities, but GitHub remains the source of truth for delivery records.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.

## Open implementation decisions

Implementation-level items not yet fully specified. `/refine-issue` resolves these into timeless contract prose and removes or collapses bullets when done.

### Cursor SDK activity envelope
- Define the exact request and response envelope properties for bounded Cursor SDK activities.
- Define how Cursor SDK run IDs, cancellation state, logs, artifacts, and validation diagnostics are exposed to Temporal and Forge UI.

### GitHub activity contracts

`/refine-issue` GitHub boundaries reuse script skills and `gh` / GitHub MCP from the Technical Writer loop. Workflow JSON references skills by path; activities do not embed raw REST URLs in definition files.

| Activity / skill | GitHub surface | Purpose in `/refine-issue` |
|------------------|----------------|----------------------------|
| `forge.github.resolve_issue_parentage` → `resolve-issue-parentage` | REST sub-issues parent endpoint (`GET .../issues/{n}/parent`) | Normalize sub-issue input to working parent |
| Technical Writer activities | Issue read (`gh issue view`, MCP), issue edit (`gh issue edit`, MCP) | Refine parent and sub-issue bodies |
| `pull-milestone-issues` | Issues API filtered by milestone | Milestone peer context in Phase B |
| `link-subissue-to-issue` | REST sub-issues link | Attach created sub-issues to parent |
| `gh-project-set-status` | Projects v2 item status | Phase E board hygiene when `github_board` is configured |

Future workflows declare the same pattern: stable `activity_id` plus resolvable `skill_path` or agent binding, with GitHub operations implemented in skill scripts or agent tooling—not in workflow JSON prose.
