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
  "project.schema.json",
  "features.schema.json"
] as const;
