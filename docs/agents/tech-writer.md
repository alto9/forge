# 4. Technical Writer (Ticket Refining Subagent)

The Technical Writer Agent maintains development-ready GitHub issues. It retrieves issue text, creates the **parent** feature branch (push and link via `gh issue develop` or equivalent), consults SME Agents, updates the issue per template, and creates sub-issues on GitHub when useful—without creating a git branch per sub-issue. Sub-issue branches are created by build-from-github or the Engineer when work starts.

## Responsibilities

| Owns | Receives | Outputs |
|------|----------|---------|
| Issue refinement, sub-issues on GitHub (no sub-issue branches), parent branch + link | GitHub issue link, vision, knowledge_map context | Parent branch pushed and linked; refined tickets; handoff to Engineer |

## Behavior Flow

```mermaid
flowchart TD
    subgraph Input
        A[User]
    end

    subgraph TechnicalWriterAgent["Technical Writer Agent"]
        B[1. Retrieve issue text from GitHub]
        C[Create parent branch and link via gh issue develop]
        D[2. Consult SME Agents]
        E[3. Update issue per template]
        F[4. Create sub-issues on GitHub when useful]
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
```

## Flow Steps

1. **Retrieve issue text from GitHub** — Use available tools (GitHub MCP, gh CLI) to fetch the issue content.
2. **Create parent branch and link** — Use `gh issue develop <parent-issue-number> --name feature/issue-{parent-number} --base main` when available; otherwise `create-feature-branch feature/issue-{parent-number} main` and link via push + MCP/gh. Push to `origin` so the branch is visible.
3. **Consult SME Agents** — Invoke Runtime, BusinessLogic, Data, Interface, Integration, Operations for technical information and implementation guides.
4. **Update issue based on issue template** — Ensure all required details are included per the project's issue template.
5. **Create sub-issues when useful** — Create child issues on GitHub when a breakdown helps (including a single sub-issue). Do not create branches for sub-issues; build-from-github or the Engineer creates `feature/issue-{child}` when implementing.

## Handoff Contract

- **Inputs**: Planner ticket, vision, knowledge_map context
- **Output**: Parent branch pushed and linked; refined parent and sub-issues on GitHub (no sub-issue branches); child branches created by build-from-github or Engineer when work starts
- **Downstream**: Engineer Agent
