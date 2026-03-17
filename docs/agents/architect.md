# 2. Architecting (High Level Design)

The Architect Agent performs high-level analysis and delegates to SME (Subject Matter Expert) subagents. It retrieves vision, validates clarity, and invokes domain experts to make concise updates within their respective subject areas.

## Responsibilities

| Owns | Receives | Outputs |
|------|----------|---------|
| `.forge/knowledge_map.json` structure | User prompt, vision.json | Updated domain contracts; handoff to Planner with recap |

## Behavior Flow

```mermaid
flowchart TD
    subgraph Input
        A[User]
    end

    subgraph Architect["Architect Agent"]
        B[1. Retrieve vision.json and determine if adjustments should be made]
        C{2. Have enough clarity to prompt SME agents?}
        D[3. Examine user input to determine which SME subagents should be invoked (async)]
    end

    subgraph SME["SME Subagents"]
        E[Runtime Agent]
        F[BusinessLogic Agent]
        G[Data Agent]
        H[Interface Agent]
        I[Integration Agent]
        J[Operations Agent]
    end

    subgraph SME_Steps["Each SME: 1. Examine Prompt Input 2. Examine files within my respective subject area and make concise updates"]
        K[SME Updates]
    end

    A --> B
    B --> C
    C -->|No| L[Loop to user for clarification]
    L --> A
    C -->|Yes| D
    D --> E
    D --> F
    D --> G
    D --> H
    D --> I
    D --> J
    E --> K
    F --> K
    G --> K
    H --> K
    I --> K
    J --> K
```

## Flow Steps

1. **Retrieve vision.json** — Read `.forge/vision.json` and determine if any adjustments should be made.
2. **Clarity check** — Have enough clarity to prompt SME agents? If no, loop back to user for clarification.
3. **Examine user input** — Determine which SME subagents should be invoked (async).
4. **Each SME subagent**:
   - **1. Examine Prompt Input** — Parse the prompt for domain-relevant context.
   - **2. Examine files within my respective subject area and make concise updates** — Update `.forge/` domain documents only within scope.

## SME Subagents

| Subagent | Subject Area |
|----------|--------------|
| **Runtime Agent** | Configuration, startup/bootstrap, lifecycle/shutdown, execution model |
| **BusinessLogic Agent** | Domain model, user stories, error/state handling |
| **Data Agent** | Data model, persistence, serialization, consistency |
| **Interface Agent** | Input handling, presentation, interaction flow, accessibility |
| **Integration Agent** | API contracts, external systems, messaging, auth boundaries |
| **Operations Agent** | Build/packaging, deployment, observability, security |

## Handoff Contract

- **Inputs**: `.forge/vision.json`, `.forge/knowledge_map.json`, user prompt
- **Output**: Updated domain contracts; handoff to Planner with recap
- **Downstream**: SME subagents, Planner
