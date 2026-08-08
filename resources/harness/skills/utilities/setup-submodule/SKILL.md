---
name: setup-submodule
description: Ensure a product submodule has baseline .ai structure (vision, project, knowledge_map, domain folders) with TODO placeholders when facts are unknown; never invent false product data.
---

# Setup Submodule

LLM-callable utility: scaffold **`.ai/`** in a product repository when contracts are missing or incomplete. Use when onboarding a submodule into the Forge delivery model.

**This skill is intentionally invokable by the model** (no `disable-model-invocation: true`).

## Input

- **`repo-root`** — Submodule path (directory containing `.git`).
- Optional **`product-name`** — Defaults from directory name or user prompt.
- Optional **`repo-type`** — e.g. `library`, `service`, `extension` (placeholder if unknown).

## Non-goals

- Do **not** invent market facts, competitor names, API shapes, or shipped features.
- Do **not** create a **`.forge/`** directory at the consumer repo root.
- Do **not** commit unless the user explicitly asks.

## Baseline tree

Create only missing paths:

```text
.ai/
  vision.json
  project.json
  knowledge_map.json
  business_logic/index.md
  data/index.md
  integration/index.md
  interface/index.md
  operations/index.md
  runtime/index.md
```

Add **`schemas/`** only when the user or Architect requests schema stewardship.

## Placeholder rules

Use **`TODO:`** markers for unknown required fields. Example **`project.json`**:

```json
{
  "name": "my-product",
  "description": "TODO: one-sentence product summary",
  "type": "TODO: library|service|extension|site",
  "repository_url": "TODO: canonical git remote URL"
}
```

Example **`vision.json`** (minimal):

```json
{
  "mission": "TODO: product mission statement",
  "principles": ["TODO: principle 1"]
}
```

Example **`knowledge_map.json`**:

```json
{
  "domains": {
    "business_logic": { "path": ".ai/business_logic/", "children": ["index.md"] },
    "data": { "path": ".ai/data/", "children": ["index.md"] },
    "integration": { "path": ".ai/integration/", "children": ["index.md"] },
    "interface": { "path": ".ai/interface/", "children": ["index.md"] },
    "operations": { "path": ".ai/operations/", "children": ["index.md"] },
    "runtime": { "path": ".ai/runtime/", "children": ["index.md"] }
  }
}
```

Each domain **`index.md`** starts with:

```markdown
# {Domain}

TODO: timeless current-state summary for this domain.

## Scope

TODO: what this domain covers in this product.
```

## Workflow

1. Confirm **`repo-root`** exists and is a Git repository.
2. Run **`detect-provider`**; record suggested **`repository_url`** placeholder hint from `git remote get-url origin` when **`project.json`** is new.
3. Create missing files only; do not overwrite non-empty user content without explicit approval.
4. Report created paths and remaining **`TODO:`** items for Product Owner / Architect follow-up.
5. Remind that harness lives at superrepo **`.cursor/`**, contracts at **`repo-root/.ai/`**.

## Handoff

- **Product Owner** — fill `vision.json`, `project.json`, competitive context.
- **Architect** — expand `knowledge_map.json`, add `.ai/specs` when capabilities emerge.
