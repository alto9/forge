import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseDiagramContent, serializeDiagramData } from '../diagramUtils';

describe('diagramUtils', () => {
  describe('parseDiagramContent', () => {
    it('should extract JSON from markdown code block', () => {
      const content = `---
diagram_id: test-diagram
---

# Diagram

\`\`\`json
{
  "nodes": [
    { "id": "node-1", "type": "default", "position": { "x": 100, "y": 100 }, "data": { "label": "Node 1" } }
  ],
  "edges": [
    { "id": "edge-1", "source": "node-1", "target": "node-2" }
  ]
}
\`\`\`
`;

      const result = parseDiagramContent(content);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].id).toBe('node-1');
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].id).toBe('edge-1');
    });

    it('should return empty diagram if no JSON found', () => {
      const content = `---
diagram_id: test-diagram
---

# Diagram

No JSON here.
`;

      const result = parseDiagramContent(content);

      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
    });

    it('should return empty diagram for empty content', () => {
      const result = parseDiagramContent('');

      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
    });

    it('should handle malformed JSON gracefully', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const content = `---
diagram_id: test-diagram
---

# Diagram

\`\`\`json
{ this is not valid json }
\`\`\`
`;

      const result = parseDiagramContent(content);

      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle JSON with missing nodes array', () => {
      const content = `---
diagram_id: test-diagram
---

# Diagram

\`\`\`json
{
  "edges": [{ "id": "e1", "source": "a", "target": "b" }]
}
\`\`\`
`;

      const result = parseDiagramContent(content);

      expect(result.nodes).toEqual([]);
      expect(result.edges).toHaveLength(1);
    });

    it('should handle JSON with missing edges array', () => {
      const content = `---
diagram_id: test-diagram
---

# Diagram

\`\`\`json
{
  "nodes": [{ "id": "n1", "position": { "x": 0, "y": 0 }, "data": {} }]
}
\`\`\`
`;

      const result = parseDiagramContent(content);

      expect(result.nodes).toHaveLength(1);
      expect(result.edges).toEqual([]);
    });

    it('should handle JSON with non-array nodes/edges', () => {
      const content = `---
diagram_id: test-diagram
---

# Diagram

\`\`\`json
{
  "nodes": "not an array",
  "edges": 123
}
\`\`\`
`;

      const result = parseDiagramContent(content);

      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
    });

    it('should extract JSON from content with other code blocks', () => {
      const content = `---
diagram_id: test-diagram
---

# Diagram

Some text here.

\`\`\`typescript
const x = 1;
\`\`\`

The actual diagram:

\`\`\`json
{
  "nodes": [{ "id": "n1", "position": { "x": 0, "y": 0 }, "data": {} }],
  "edges": []
}
\`\`\`

More text.
`;

      const result = parseDiagramContent(content);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].id).toBe('n1');
    });

    it('should handle complex node data', () => {
      const content = `\`\`\`json
{
  "nodes": [
    {
      "id": "lambda-1",
      "type": "aws-lambda",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "ProcessOrder",
        "config": {
          "runtime": "nodejs18.x",
          "memory": 512
        }
      },
      "width": 150,
      "height": 50
    }
  ],
  "edges": []
}
\`\`\``;

      const result = parseDiagramContent(content);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].type).toBe('aws-lambda');
      expect(result.nodes[0].data.label).toBe('ProcessOrder');
      expect(result.nodes[0].data.config.runtime).toBe('nodejs18.x');
    });
  });

  describe('serializeDiagramData', () => {
    it('should serialize diagram data with frontmatter', () => {
      const data = {
        nodes: [
          { id: 'node-1', type: 'default', position: { x: 100, y: 100 }, data: { label: 'Node 1' } },
        ],
        edges: [{ id: 'edge-1', source: 'node-1', target: 'node-2' }],
      };
      const frontmatter = `---
diagram_id: test-diagram
name: Test Diagram
---`;

      const result = serializeDiagramData(data, frontmatter);

      expect(result).toContain('---\ndiagram_id: test-diagram');
      expect(result).toContain('# Diagram');
      expect(result).toContain('```json');
      expect(result).toContain('"nodes"');
      expect(result).toContain('"edges"');
      expect(result).toContain('```\n');
    });

    it('should format JSON with proper indentation', () => {
      const data = {
        nodes: [{ id: 'n1', position: { x: 0, y: 0 }, data: {} }],
        edges: [],
      };
      const frontmatter = '---\ndiagram_id: test\n---';

      const result = serializeDiagramData(data, frontmatter);

      // Check for 2-space indentation
      expect(result).toContain('  "nodes"');
      expect(result).toContain('    "id"');
    });

    it('should preserve frontmatter exactly', () => {
      const data = { nodes: [], edges: [] };
      const frontmatter = `---
diagram_id: my-diagram
name: My Complex Diagram
description: A diagram with special characters: "quotes" and 'apostrophes'
diagram_type: infrastructure
---`;

      const result = serializeDiagramData(data, frontmatter);

      expect(result.startsWith(frontmatter)).toBe(true);
    });

    it('should create valid markdown structure', () => {
      const data = { nodes: [], edges: [] };
      const frontmatter = '---\ndiagram_id: test\n---';

      const result = serializeDiagramData(data, frontmatter);

      // Should have: frontmatter + blank line + heading + blank line + code block
      const lines = result.split('\n');
      expect(lines[0]).toBe('---');
      expect(lines[2]).toBe('---');
      expect(lines[3]).toBe(''); // blank line after frontmatter
      expect(lines[4]).toBe('# Diagram');
      expect(lines[5]).toBe(''); // blank line after heading
      expect(lines[6]).toBe('```json');
    });

    it('should handle empty diagram data', () => {
      const data = { nodes: [], edges: [] };
      const frontmatter = '---\ndiagram_id: empty\n---';

      const result = serializeDiagramData(data, frontmatter);

      expect(result).toContain('"nodes": []');
      expect(result).toContain('"edges": []');
    });

    it('should handle complex nested data', () => {
      const data = {
        nodes: [
          {
            id: 'container-1',
            type: 'vpc-container',
            position: { x: 50, y: 50 },
            data: {
              label: 'My VPC',
              children: ['subnet-1', 'subnet-2'],
              metadata: {
                region: 'us-east-1',
                tags: ['production', 'critical'],
              },
            },
            width: 500,
            height: 400,
          },
        ],
        edges: [
          {
            id: 'e1',
            source: 'subnet-1',
            target: 'subnet-2',
            type: 'default',
            animated: true,
          },
        ],
      };
      const frontmatter = '---\ndiagram_id: complex\n---';

      const result = serializeDiagramData(data, frontmatter);

      // Verify it contains the complex data
      expect(result).toContain('vpc-container');
      expect(result).toContain('My VPC');
      expect(result).toContain('us-east-1');
      expect(result).toContain('production');
      expect(result).toContain('animated');
    });

    it('should end with newline', () => {
      const data = { nodes: [], edges: [] };
      const frontmatter = '---\ndiagram_id: test\n---';

      const result = serializeDiagramData(data, frontmatter);

      expect(result.endsWith('\n')).toBe(true);
    });
  });

  describe('round-trip', () => {
    it('should serialize and parse back to equivalent data', () => {
      const originalData = {
        nodes: [
          { id: 'n1', type: 'default', position: { x: 100, y: 200 }, data: { label: 'Test' } },
          { id: 'n2', type: 'aws-lambda', position: { x: 300, y: 200 }, data: { label: 'Lambda' } },
        ],
        edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
      };
      const frontmatter = '---\ndiagram_id: roundtrip-test\n---';

      const serialized = serializeDiagramData(originalData, frontmatter);
      const parsed = parseDiagramContent(serialized);

      expect(parsed.nodes).toHaveLength(2);
      expect(parsed.nodes[0].id).toBe('n1');
      expect(parsed.nodes[1].id).toBe('n2');
      expect(parsed.edges).toHaveLength(1);
      expect(parsed.edges[0].source).toBe('n1');
      expect(parsed.edges[0].target).toBe('n2');
    });
  });
});



