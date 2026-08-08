# Forge model policy

Cursor agent files under `.cursor/agents/` may set YAML frontmatter `model`:

| Value | Meaning |
|-------|---------|
| `inherit` | Same model as the parent chat / invoking agent (default) |
| `fast` | Cursor fast lane for narrow, high-volume passes |
| `<model-id>` | Pin a concrete picker id (avoid in the shipped harness; ids churn) |

Forge ships only **`inherit`** and **`fast`**. Do not pin vendor model strings in managed harness files unless a maintainer consciously accepts upgrade churn.

## Tiers

| Tier | Frontmatter | Roles |
|------|-------------|-------|
| **Think** | `model: inherit` | Product Owner, Architect, Quality Assurance |
| **Standard** | `model: inherit` | Planner, Technical Writer, Engineer, Marketing Manager |
| **Fast** | `model: fast` | Domain SMEs (`*-sme`) |

Think vs Standard share `inherit` on purpose. Differentiation is **which parent model the human selects** before invoking Think-heavy skills:

- Prefer a **high-reasoning parent** for `/ideate`, strategic PO gates, Architect integration, and `/review`.
- A mid-tier parent is fine for `/intake`, `/refine`, `/build-from-github`, `/build-from-review`, and `/plan-roadmap`.

## SME invocation (required)

SMEs are **real Task agents**, not `generalPurpose` with “read this markdown.”

| Domain folder | `Task` `subagent_type` / agent `name` |
|---------------|----------------------------------------|
| `business_logic` | `business-logic-sme` |
| `data` | `data-sme` |
| `integration` | `integration-sme` |
| `interface` | `interface-sme` |
| `operations` | `operations-sme` |
| `runtime` | `runtime-sme` |
| `schemas` | `schemas-sme` (only when `knowledge_map.json` lists `.ai/schemas/`) |

Architect fans out with **`Task(subagent_type="<name>")`** and a prompt that includes `worktree_path`, `repoRef`, briefing, and `tmp_dir`. Persona bodies live under `.cursor/agents/sme/` but the **name** field is the Task identity.

## Cost shape

Seven **Fast** SMEs + one **Think** Architect (parent) is the intended fan-out. Do not upgrade all SMEs to Think models; Architect integrates and resolves conflicts.

## Skills

Slash skills do **not** set models. Models attach to **agents** the skill delegates to. Orchestration stays on the parent chat model.
