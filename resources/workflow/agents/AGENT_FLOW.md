# Agent Flow and Responsibility Delegation

This document describes the intended flow of responsibility among Forge agents. Flow: **Market Input → Vision → Knowledge → Roadmap → Implementation → Review**.

## Six-Step Model

| Step | Phase | Agent | Key Actions |
|------|-------|-------|-------------|
| 1 | Product Owner | Product Owner | Retrieve `vision.json` and `project.json`, determine adjustments, hand off to Architect |
| 2 | Architecting | Architect | Retrieve vision and knowledge map, perform clarity check, update `.forge` contracts by domain, hand off recap to Planner |
| 3 | Planning | Planner | pull-milestones, pull-milestone-issues, determine GitHub changes |
| 4 | Refining | Technical Writer | Retrieve issue, create parent branch and link, read `.forge` contracts, update issue, create sub-issues when useful (no sub-issue branches) |
| 5 | Building | Engineer | Branch setup by build-from-github or Engineer for issue being built; perform code changes; run repo-inferred validation (tests/lint/build as applicable) before commit; scan security; commit; push; create-pr |
| 6 | Reviewing | Quality Assurance | Retrieve PR; checkout; review accuracy; check vulnerabilities; add review to PR |

## `.forge` Edit/Read Boundaries

- **May edit `.forge`:** Product Owner and Architect.
- **Read-only for `.forge`:** Planner, Technical Writer, Engineer, Quality Assurance.
- Product Owner owns product intent (`.forge/vision.json`, `.forge/project.json`).
- Architect owns technical contract shape and content under `.forge/knowledge_map.json` and mapped domain docs.
- Downstream agents consume those contracts and escalate contract changes back to Architect instead of editing `.forge` directly.

## Commands and Flows

Six canonical commands orchestrate the agent flows:

| Command | Input | Output |
|---------|-------|--------|
| `/architect-this {string}` | User prompt | Updated `.forge` documents |
| `/plan-roadmap` | `.forge/vision.json`, `.forge/knowledge_map.json` | Synced GitHub milestones/issues |
| `/refine-issue {link}` | GitHub issue link | Refined tickets ready for development |
| `/build-from-github` | GitHub issue link | GitHub pull request |
| `/build-from-pr-review {link}` | GitHub PR link | Updated PR branch with feedback addressed |
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
1. User provides Product Intake Prompt (or pastes market research content).
2. Product Owner ingests and updates `vision.json`.
3. Architect receives prompt; updates knowledge map and domain contracts when technical scope changes.
4. Planner receives recap and creates/updates milestones if roadmap impact exists.
5. Downstream: Technical Writer → Engineer → Quality Assurance.

---

## 1. Architecting Flow (`/architect-this`)

When Product Intake is provided, Product Owner runs first. When technical direction is provided directly, Architect runs first.

```
User ──► Architect Agent ──► [Clarity check]
                                    │
                    ┌───────────────┴───────────────┐
                    │ No clarity                    │ Yes
                    ▼                               ▼
              Loop to user      Update knowledge map + mapped domain contracts
                                               │
                                               ▼
                                    Invoke Planner with recap
```

**Steps:**
1. Architect retrieves `vision.json` and `.forge/knowledge_map.json`.
2. **Clarity check:** if direction is unclear, loop to user for clarification.
3. Update `.forge/knowledge_map.json` shape only when required.
4. Update domain contract files listed in `.forge/knowledge_map.json` for impacted domains.
5. Hand off recap to Planner.

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
                    Create parent branch (linked to issue via gh issue develop)
                                    │
                                    ▼
                    Read `.forge` domain contracts as context
                                    │
                                    ▼
                    Update issue based on template
                                    │
                                    ▼
                    Create sub-issues on GitHub when useful (no branch per sub-issue)
```

**Steps:**
1. Retrieve issue text from GitHub (use available tools).
2. Create parent branch and link: `gh issue develop <parent-issue-number> --name feature/issue-{parent-number} --base main` when available; otherwise `create-issue-branch` (pass `<owner/repo>` when not in a clone) + push + link via MCP/gh.
3. Read relevant `.forge` contracts from `.forge/knowledge_map.json` for technical context. Escalate contract changes to Architect.
4. Update the issue based on the issue template; ensure all required details are included.
5. Create sub-issues on GitHub when useful (including a single sub-issue when appropriate). Do not create branches for sub-issues; build-from-github or Engineer creates them when work starts.

---

## 4. Building Flow (`/build-from-github`)

```
User (Github Issue Link) ──► Branch setup (ensure correct branch)
                                    │
                    Check current; if not, use linked/existing or create per CONTRIBUTING (gh issue develop for linking)
                                    │
                                    ▼
                         Branch setup: ensure feature/issue-{N} for issue in link
                         (create from main or parent; push and link if needed)
                         Then: Engineer retrieves issue details, implements, validates
                                    │
                                    ▼
                         Implement code changes
                                    │
                                    ▼
                         repo-inferred validation (all must pass before commit)
                                    │
                                    ▼
                         Scan for security vulnerabilities
                                    │
                                    ▼
                         commit, push-branch
                         Create GitHub PR (use available tools)
```

**Steps:**
1. Branch setup (build-from-github or Engineer): ensure correct `feature/issue-{N}` for the issue—check current; if not, use linked/existing or create from `main` (top-level) or `feature/issue-{parent}` (sub-issue). Push and link via `gh issue develop` when needed.
2. Engineer: retrieve issue details; implement code changes for the issue scope.
3. Engineer: run repository-inferred validation commands (tests/lint/build as applicable); **do not** commit or open a PR until every check passes (fix or stop and report).
4. Engineer: scan changeset for security vulnerabilities.
5. Engineer: commit, push-branch; create GitHub pull request (use available tools). When creating the PR, use `.github/pull_request_template.md` if present, otherwise a standard fallback template.

---

## 5. Build from PR Review Flow (`/build-from-pr-review`)

```
User (Github PR Link) ──► Retrieve PR + review feedback
                                    │
                                    ▼
                        Resolve original issue context
                        Verify current branch matches PR head
                        (fetch + checkout PR branch if needed)
                                    │
                                    ▼
                         Engineer applies review feedback
                         while preserving issue intent
                                    │
                                    ▼
                         repo-inferred validation
                         (all must pass before commit)
                                    │
                                    ▼
                         Security scan, commit, push PR branch
```

**Steps:**
1. Retrieve PR details, source branch, and review feedback (reviews/comments) using available tools.
2. Resolve original issue context for scope integrity.
3. Verify branch context and checkout PR source branch if not already on it.
4. Engineer applies requested feedback, runs all required validations, scans security, and pushes updates to the same PR branch.

---

## 6. Reviewing Flow (`/review-pr`)

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
   Product Owner (vision + project)
         │
         ▼
   Architect (knowledge_map + domain contracts)
         │
         ▼
   Planner (GitHub milestones)
         │
         ▼
   Technical Writer (tickets + parent branch)
         │
         ▼
   Engineer → Quality Assurance
```

## Knowledge Map

`.forge/knowledge_map.json` defines the structure of domain contracts. Use it to:

- Map domains to their primary docs and children.
- Determine which contract files are relevant for a topic.
- Enforce boundaries between runtime, business logic, data, interface, integration, and operations documentation.

## When to Invoke Which Agent

| Prompt concerns | Invoke |
|------------------|--------|
| Product vision, strategy, market | Product Owner |
| Cross-domain architecture, contract updates, knowledge map changes | Architect |
| Milestones, roadmap sequencing | Planner |
| Ticket decomposition, acceptance criteria, parent/sub-issue clarity | Technical Writer |
| Implementation, tests | Engineer |
| Code review, security review | Quality Assurance |
