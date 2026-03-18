# 4. Technical Writer (Ticket Refining Subagent)

The Technical Writer Agent maintains development-ready GitHub issues. It retrieves issue text, creates feature branches, consults SME Agents for technical guidance, updates the issue per template, and creates sub-issues with their branches.

## Responsibilities

| Owns | Receives | Outputs |
|------|----------|---------|
| Issue refinement, sub-issue creation | GitHub issue link, vision, knowledge_map context | Sub-issues and feature branches; handoff to Build |

## Behavior Flow

```mermaid
flowchart TD
    subgraph Input
        A[User]
    end

    subgraph Technical Writer["Technical Writer Agent"]
        B[1. Retrieve issue text from GitHub]
        C[skill: create-feature-branch {child} main]
        D[2. Consult SME Agents for technical information and implementation guides]
        E[3. Update issue based on issue template, ensure all required details included]
        F[4. Create Sub-Issues on the Issue]
        G[skill: create-feature-branch {child} {parent}]
    end

    subgraph SME["SME Agents"]
        H[Runtime Agent]
        I[BusinessLogic Agent]
        J[Data Agent]
        K[Interface Agent]
        L[Integration Agent]
        M[Operations Agent]
    end

    A --> B
    B --> C
    C --> D
    D --> H
    D --> I
    D --> J
    D --> K
    D --> L
    D --> M
    D --> E
    E --> F
    F --> G
```

## Flow Steps

1. **Retrieve issue text from GitHub** — Use available tools (GitHub MCP, gh CLI) to fetch the issue content.
2. **skill: create-feature-branch {child} main** — Create parent branch from main: `create-feature-branch feature/issue-{parent-number} main`.
3. **Consult SME Agents** — Invoke Runtime, BusinessLogic, Data, Interface, Integration, Operations for technical information and implementation guides.
4. **Update issue based on issue template** — Ensure all required details are included per the project's issue template.
5. **Create Sub-Issues on the Issue** — Create sub-issues on the parent ticket (always at least one).
6. **skill: create-feature-branch {child} {parent}** — For each sub-issue, create branch from parent: `create-feature-branch feature/issue-{child-number} feature/issue-{parent-number}`.

## Handoff Contract

- **Inputs**: Planner ticket, vision, knowledge_map context
- **Output**: Sub-issues and feature branches suitable for Build execution
- **Downstream**: Build Agent
