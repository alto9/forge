import type { DiagramData } from '../components/ReactFlowDiagramEditor';

/**
 * Parse diagram content from a markdown file containing JSON in a code block.
 *
 * Extracts JSON diagram data from markdown content that uses the format:
 * ```json
 * { "nodes": [...], "edges": [...] }
 * ```
 *
 * @param content - Full markdown content including frontmatter and code blocks
 * @returns DiagramData with nodes and edges arrays, or empty arrays if not found/invalid
 */
export function parseDiagramContent(content: string): DiagramData {
  // Match JSON code block: ```json followed by content until closing ```
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);

  if (!jsonMatch || !jsonMatch[1]) {
    return { nodes: [], edges: [] };
  }

  try {
    const data = JSON.parse(jsonMatch[1]);
    return {
      nodes: Array.isArray(data.nodes) ? data.nodes : [],
      edges: Array.isArray(data.edges) ? data.edges : [],
    };
  } catch (error) {
    // Handle parse errors gracefully by returning empty diagram
    console.error('Failed to parse diagram JSON:', error);
    return { nodes: [], edges: [] };
  }
}

/**
 * Serialize diagram data to markdown format with JSON code block.
 *
 * Creates markdown content with the structure:
 * - Frontmatter (preserved as-is)
 * - Empty line
 * - # Diagram heading
 * - Empty line
 * - JSON code block with formatted diagram data
 *
 * @param data - DiagramData containing nodes and edges
 * @param frontmatter - The frontmatter string (including --- delimiters)
 * @returns Complete markdown string ready for file saving
 */
export function serializeDiagramData(data: DiagramData, frontmatter: string): string {
  const jsonContent = JSON.stringify(data, null, 2);
  return `${frontmatter}\n\n# Diagram\n\n\`\`\`json\n${jsonContent}\n\`\`\`\n`;
}



