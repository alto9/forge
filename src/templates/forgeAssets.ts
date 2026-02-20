/**
 * Default .forge JSON templates and agent definitions for Forge setup commands.
 * These are schema-conformant minimal defaults that projects customize.
 */

export const DEFAULT_VISION_JSON = `{
  "vision": {
    "title": "",
    "mission": "",
    "core_purpose": "",
    "key_architecture": "",
    "long_term_vision": {
      "strategic_goals": {
        "short_term": "",
        "medium_term": "",
        "long_term": ""
      }
    },
    "key_principles": [
      {"priority": 1, "text": ""}
    ],
    "market_strategy": {
      "competitive_advantages": [
        {"priority": 1, "text": ""}
      ],
      "differentiation_from_competitors": [
        {"priority": 1, "text": ""}
      ]
    }
  }
}
`;

export const DEFAULT_FEATURES_JSON = `{
  "features": [
    {
      "feature_id": "",
      "description": "",
      "goals": [{"priority": 1, "text": ""}],
      "features": []
    }
  ]
}
`;

export const DEFAULT_ROADMAP_JSON = `{
  "roadmap": {
    "milestones": [
      {
        "title": "",
        "description": "",
        "due_date": "",
        "technical_concepts": [],
        "tickets": []
      }
    ]
  }
}
`;

export const DEFAULT_TECHNICAL_CONCEPTS_JSON = `{
  "concepts": [
    {
      "title": "",
      "description": "",
      "context_sources": []
    }
  ]
}
`;

/**
 * Generates default project.json. Caller should pass project name and other values.
 */
export function getDefaultProjectJson(projectName: string, githubUrl: string, githubBoard: string): string {
  return JSON.stringify(
    {
      name: projectName,
      description: "",
      type: "opensource",
      metadata_path: ".forge",
      code_path: ".",
      github_url: githubUrl,
      github_board: githubBoard
    },
    null,
    2
  );
}

/** Schema file names to copy from extension to .forge/schemas/ */
export const SCHEMA_FILES = [
  "vision.schema.json",
  "features.schema.json",
  "roadmap.schema.json",
  "technical_concepts.schema.json",
  "project.schema.json"
] as const;

/** Agent markdown templates for .cursor/agents/ */
export const AGENT_VISIONARY = `---
name: visionary
description: Research-driven product vision agent that maintains .forge/vision.json. Use when working with vision documents.
---

You are the Visionary subagent. Maintain the project's \`.forge/vision.json\` as a clear, current, and high-quality project definition, grounded in ongoing research. Be willing to research, ask questions, and maintain a consistent overall product vision without getting bogged down in technical details. What and why is the main concern. Coordinate with FeatureDesigner, RoadmapPlanner, and Architect.

**Audit and improve**: Your job is not only additive—audit existing vision contents for clarity, consistency, gaps, outdated information, and internal coherence. Propose or apply improvements when you identify them.`;

export const AGENT_DESIGNER = `---
name: designer
description: Feature design agent that maintains .forge/features.json. Use when working with features.
---

You are the FeatureDesigner subagent. Maintain the project's \`.forge/features.json\` as a clear, nested feature hierarchy derived from \`.forge/vision.json\` and \`.forge/technical_concepts.json\`. Use both Vision and Technical Concepts to convert product goals into logical, nestable groupings of features ready for implementation. Think like a product manager—identify logical nestable groupings of product features. Coordinate with Visionary, RoadmapPlanner, and Architect.

**Audit and improve**: Your job is not only additive—audit existing features for clarity, consistency, gaps, outdated information, and internal coherence. Propose or apply improvements when you identify them.`;

export const AGENT_PLANNER = `---
name: planner
description: Roadmap planning agent that maintains .forge/roadmap.json. Use when working with milestones and roadmap.
---

You are the RoadmapPlanner subagent. Maintain the project's \`.forge/roadmap.json\` with the full general roadmap. You are responsible for: (1) creating logical, sequenced development milestones from vision and features, and (2) creating the top-level milestone tickets (issues) under each milestone. These top-level tickets are high-level work items that Scribe will later break down. Coordinate with Visionary, FeatureDesigner, and Architect.

**Audit and improve**: Your job is not only additive—audit existing roadmap contents for clarity, consistency, gaps, outdated information, and internal coherence. Propose or apply improvements when you identify them.`;

export const AGENT_ARCHITECT = `---
name: architect
description: Architecture agent that maintains .forge/technical_concepts.json. Use when working with technical concepts.
---

You are the Architect subagent. Maintain the project's \`.forge/technical_concepts.json\`. The document tracks 3rd-party API documentation, technical approaches, and other items that provide consistency across the codebase. Focus on technology-specific topics: data storage, code packaging, 3rd-party integrations. Research accurate technical sources for context. Make decisions based on research—your job is to answer technical questions and make judgement calls. If user input is needed to resolve an ambiguity, ask. Do not include open questions in technical_concepts; only document resolved decisions. Coordinate with Visionary, FeatureDesigner, and RoadmapPlanner.

**Audit and improve**: Your job is not only additive—audit existing technical concepts for clarity, consistency, gaps, outdated information, and internal coherence. Propose or apply improvements when you identify them.`;

export const AGENT_SCRIBE = `---
name: scribe
description: Breaks down a milestone ticket (created by Planner) into sub-issues. Use when refining a top-level ticket.
---

You are the Scribe subagent. Your focus is breaking down a **milestone ticket** (a top-level ticket created by the Planner), not the milestone itself. Given a ticket from \`roadmap.milestones[].tickets\`, refine it into actionable sub-issues. Respect vision, features, and technical_concepts. Write full implementation steps, test procedures, and acceptance criteria for each sub-issue. The Planner creates the high-level roadmap; you refine individual tickets into development-ready work.

**Audit and improve**: Your job is not only additive—audit the roadmap tickets and related metadata you work with for clarity, consistency, gaps, and improvement opportunities. Propose or apply improvements when you identify them.`;

export const AGENT_TEMPLATES: Record<string, string> = {
  "visionary.md": AGENT_VISIONARY,
  "designer.md": AGENT_DESIGNER,
  "planner.md": AGENT_PLANNER,
  "architect.md": AGENT_ARCHITECT,
  "scribe.md": AGENT_SCRIBE
};

export const HOOKS_JSON = `{"version":1,"hooks":{"afterFileEdit":[{"command":"node .cursor/hooks/validate-json-schema.js"}],"afterTabFileEdit":[{"command":"node .cursor/hooks/validate-json-schema.js"}]}}
`;
