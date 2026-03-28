# 3. Planning (Low Level Design)

The Planner Agent manages the GitHub roadmap. It pulls current state from GitHub, then determines which changes should be made—adding or adjusting milestones or milestone issues. GitHub is the single source of truth.

## Responsibilities

| Owns | Receives | Outputs |
|------|----------|---------|
| GitHub milestones, dates, project board | `vision.json`, `knowledge_map.json`, Architect recap | GitHub milestones and issues; handoff to Refine |

## Behavior Flow

```mermaid
flowchart TD
    subgraph Input
        A[User]
    end

    subgraph Planner["agent: Planner"]
        B[skill: pull-milestones {owner/repo}]
        C[For each milestone returned, retrieve issues for the milestone]
        D[skill: pull-milestone-issues {milestone-id}]
        E[Determine which changes should be made in GitHub, adding/adjusting milestones or milestone issues]
    end

    subgraph Output
        F[GitHub milestones and issues]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
```

## Flow Steps

1. **skill: pull-milestones {owner/repo}** — Run the `pull-milestones` skill to retrieve all milestones from GitHub. Resolve owner/repo from `gh repo view` or pass explicitly.
2. **For each milestone returned** — Iterate over the milestones.
3. **skill: pull-milestone-issues {milestone-id}** — Run `pull-milestone-issues` with the milestone number to retrieve issues for that milestone.
4. **Determine which changes should be made in GitHub** — Add or adjust milestones or milestone issues via GitHub MCP or `gh` CLI. Do not update past or in-flight tickets.

## Skill Resolution

Resolve skill execution details from `.forge/skill_registry.json` (`agent_assignments.planner` and `skills[]` entries).

## Handoff Contract

- **Inputs**: `.forge/vision.json`, `.forge/knowledge_map.json`, Architect recap
- **Output**: GitHub milestones and issues with sequenced delivery
- **Downstream**: Refine (decomposes Planner tickets into actionable sub-issues)
