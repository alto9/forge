# Agent Flow and Responsibility Delegation

This document describes the intended flow of responsibility among Forge agents. Flow: **Market Input → Vision → Knowledge → Roadmap → Implementation → Review**.

## Six-Step Model

| Step | Phase | Agent | Key Actions |
|------|-------|-------|-------------|
| 1 | Product Owner | Product Owner | Retrieve vision.json and project.json; determine adjustments; hand off to Architect |
| 2 | Architecting | Architect | Retrieve vision; clarity check; invoke SME subagents (async); Planner recap |
| 3 | Planning | Planner | pull-milestones; pull-milestone-issues; determine GitHub changes |
| 4 | Refining | Technical Writer | Retrieve issue; create-feature-branch parent; consult SME; update issue; create sub-issues; create-feature-branch child from parent |
| 5 | Building | Engineer | Perform code changes; validate (unit-test, integration-test, lint-test); scan security; commit; push; create-pr |
| 6 | Reviewing | Quality Assurance | Retrieve PR; checkout; review accuracy; check vulnerabilities; add review to PR |

## Commands and Flows

Five canonical commands orchestrate the agent flows:

| Command | Input | Output |
|---------|-------|--------|
| `/architect-this {string}` | User prompt | Updated `.forge` documents |
| `/plan-roadmap` | `.forge/vision.json`, `.forge/knowledge_map.json` | Synced GitHub milestones/issues |
| `/refine-issue {link}` | GitHub issue link | Refined tickets ready for development |
| `/build-from-github` | GitHub issue link | GitHub pull request |
| `/review-pr {link}` | GitHub PR link | PR with review (human performs merge) |

---

## Product Intake Prompt

Structured input that kicks off the market → features flow. Use when new market need, user feedback, or strategic direction arrives.

**Template:**
```
[Market / User / Strategic Input]
- Source: [e.g., user research, competitor analysis, support tickets, stakeholder request]
- Signal: [what we learned or what changed]
- Implication: [how this affects what we should build]
- Urgency: [now / next quarter / backlog]
```

**Flow:**
1. User provides Product Intake Prompt (or pastes market research content)
2. Product Owner ingests, researches if needed, updates `vision.json`
3. Architect receives prompt; updates knowledge map and domain contracts if technical scope changed
4. Planner receives recap; creates/updates milestones if roadmap impact
5. Downstream: Technical Writer → Engineer → Quality Assurance as usual

---

## 1. Architecting Flow (`/architect-this`)

When Product Intake is provided, Product Owner runs first. When technical direction is provided directly, Architect runs first.

```
User ──► Architect Agent ──► [Clarity check]
                                    │
                    ┌───────────────┴───────────────┐
                    │ No clarity                    │ Yes
                    ▼                               ▼
              Loop to user              Examine input for SME subagents
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    ▼                          ▼                          ▼
              Runtime Agent            BusinessLogic Agent           Data Agent
              Interface Agent          Integration Agent           Operations Agent
                    │                          │                          │
                    └──────────────────────────┼──────────────────────────┘
                                               │
                                               ▼
                                    Invoke Planner with recap
```

**Steps:**
1. Architect retrieves `vision.json` and determines if adjustments are needed.
2. **Clarity check:** Have enough clarity to prompt SME agents? If no, loop back to user.
3. Examine user input to determine which SME subagents to invoke (async).
4. Each SME: examine prompt input; examine files in domain; make concise updates.
5. Invoke Planner subagent with recap of changes made.

---

## 2. Planning Flow (`/plan-roadmap`)

```
User ──► command: /plan-roadmap ──► agent: Planner
                                            │
                                            ▼
                              skill: pull-milestones [owner/repo]
                                            │
                                            ▼
                    For each milestone returned, retrieve issues for the milestone
                                            │
                                            ▼
                              skill: pull-milestone-issues <milestone-id>
                                            │
                                            ▼
                    Create/update milestones and issues via GitHub MCP or gh CLI
```

**Steps:**
1. **pull-milestones** – Retrieve all milestones from GitHub. Resolve owner/repo from `gh repo view` or pass explicitly.
2. **For each milestone** – Run **pull-milestone-issues** with the milestone number to retrieve issues.
3. **Create/update via GitHub** – Use GitHub MCP or `gh` CLI to create milestones, create issues, and assign issues to milestones. Do not update past or in-flight tickets.

---

## 3. Refining Flow (`/refine-issue`)

```
User (Github Issue Link) ──► Technical Writer Agent
                                    │
                                    ▼
                    Retrieve issue text from GitHub
                                    │
                                    ▼
                    create-feature-branch parent from main
                                    │
                                    ▼
              Consult SME Agents for technical info and implementation guides
                                    │
                                    ▼
                    Update issue based on template
                                    │
                                    ▼
                    Create sub-issues on parent (always at least one)
                                    │
                                    ▼
                    create-feature-branch each sub-issue from parent
```

**Steps:**
1. Retrieve issue text from GitHub (use available tools).
2. Create parent branch from main: `create-feature-branch feature/issue-{parent-number} main`.
3. Consult SME Agents (runtime, business_logic, data, interface, integration, operations) for technical information and implementation guides.
4. Update the issue based on the issue template; ensure all required details are included.
5. Create sub-issues on the parent ticket (always at least one).
6. Create sub-issue branches from the parent branch: `create-feature-branch feature/issue-{child-number} feature/issue-{parent-number}`. Sub-issues merge into the parent branch for a single PR to main.

---

## 4. Building Flow (`/build-from-github`)

```
User (Github Issue Link) ──► Engineer Agent
                                    │
                                    ▼
                         Retrieve sub-issue details
                         Checkout branch (create from parent if missing)
                                    │
                                    ▼
                         Implement code changes
                         unit-test, integration-test, lint-test
                                    │
                                    ▼
                         Scan for security vulnerabilities
                                    │
                                    ▼
                         commit, push-branch
                         Create GitHub PR (use available tools)
```

**Steps:**
1. Engineer: retrieve sub-issue details; ensure branch exists and checkout (create from parent branch if missing).
2. Engineer: implement code changes; validate with unit-test, integration-test, lint-test.
3. Engineer: scan changeset for security vulnerabilities.
4. Engineer: commit, push-branch; create GitHub pull request (use available tools). When creating the PR, use `.github/pull_request_template.md` if present, otherwise a standard fallback template.

---

## 5. Reviewing Flow (`/review-pr`)

```
User (Github PR Link) ──► Quality Assurance Agent
                                    │
                                    ▼
                         Retrieve PR details
                         Checkout PR source branch
                         Review for correctness and security
                                    │
                                    ▼
                         Add review comments to PR
                         (Human performs merge)
```

**Steps:**
1. Quality Assurance: retrieve PR details; checkout PR source branch.
2. Quality Assurance: examine changes for correctness and security.
3. Quality Assurance: add review comments to the PR to aid manual human approval. Do not merge; a human will perform the merge.

---

## Hierarchy

```
Market Input / Product Intake
         │
         ▼
   Product Owner (vision.json)
         │
         ▼
   Architect ──────────────────────────────────────┐
         │  knowledge_map + domain contracts       │
         │  Delegates to: runtime, business_logic,  │
         │  data, interface, integration, ops       │
         │                                         │
         ▼                                         │
   Planner (GitHub milestones) ◄───────────────────┘
         │
         ▼
   Technical Writer (sub-issues)
         │
         ▼
   Engineer → Quality Assurance
```

## Domain Subagents: Subject Matter Experts

Each domain subagent owns its contracts and performs updates:

| Subagent | Owns | Responsibilities |
|----------|------|-------------------|
| **runtime** | `.forge/runtime/` | Configuration, startup, lifecycle, execution model |
| **business_logic** | `.forge/business_logic/` | Domain model, user stories, error handling |
| **data** | `.forge/data/` | Data model, persistence, serialization, consistency |
| **interface** | `.forge/interface/` | Input handling, presentation, interaction flow |
| **integration** | `.forge/integration/` | API contracts, external systems, messaging |
| **operations** | `.forge/operations/` | Build, deployment, observability, security |

Domain subagents are **invoked by the Architect** when work falls in their scope. They perform the actual file updates and contract maintenance.

## Knowledge Map

`.forge/knowledge_map.json` defines the structure of domain contracts. Use it to:

- Map domains to their primary docs and children
- Determine which subagent to invoke for a given file or topic
- Understand the boundaries between domains

## When to Invoke Which Agent

| Prompt concerns | Invoke |
|------------------|--------|
| Product vision, strategy, market | Product Owner |
| Cross-domain architecture, technical direction, routing | Architect |
| Architect prompt touching runtime/config/lifecycle | Architect → runtime |
| Architect prompt touching data/persistence/schema | Architect → data |
| Architect prompt touching domain rules, user stories | Architect → business_logic |
| Architect prompt touching UI, inputs, presentation | Architect → interface |
| Architect prompt touching APIs, external systems | Architect → integration |
| Architect prompt touching build, deploy, security | Architect → operations |
| Milestones, roadmap sequencing | Planner |
| Ticket decomposition | Technical Writer |
| Implementation, tests | Engineer |
| Code review, security review | Quality Assurance |
