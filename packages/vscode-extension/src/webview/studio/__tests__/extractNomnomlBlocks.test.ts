import { describe, it, expect } from 'vitest';

/**
 * Extract nomnoml code blocks from markdown content
 * Returns an array of sections alternating between text and nomnoml blocks
 */
function extractNomnomlBlocks(content: string): Array<{ type: 'text' | 'nomnoml'; content: string }> {
  const sections: Array<{ type: 'text' | 'nomnoml'; content: string }> = [];
  const nomnomlRegex = /```nomnoml\n([\s\S]*?)```/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = nomnomlRegex.exec(content)) !== null) {
    // Add text before this nomnoml block
    if (match.index > lastIndex) {
      const textContent = content.substring(lastIndex, match.index).trim();
      if (textContent) {
        sections.push({ type: 'text', content: textContent });
      }
    }
    
    // Add the nomnoml block
    sections.push({ type: 'nomnoml', content: match[1] });
    lastIndex = nomnomlRegex.lastIndex;
  }
  
  // Add remaining text after last nomnoml block
  if (lastIndex < content.length) {
    const textContent = content.substring(lastIndex).trim();
    if (textContent) {
      sections.push({ type: 'text', content: textContent });
    }
  }
  
  // If no nomnoml blocks found, return the entire content as text
  if (sections.length === 0) {
    sections.push({ type: 'text', content: content });
  }
  
  return sections;
}

describe('extractNomnomlBlocks', () => {
  describe('Content with nomnoml blocks', () => {
    it('should extract a single nomnoml block', () => {
      const content = `## Architecture

\`\`\`nomnoml
#direction: down
[Component A] -> [Component B]
\`\`\`

## Details`;

      const result = extractNomnomlBlocks(content);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: 'text', content: '## Architecture' });
      expect(result[1]).toEqual({ 
        type: 'nomnoml', 
        content: '#direction: down\n[Component A] -> [Component B]\n' 
      });
      expect(result[2]).toEqual({ type: 'text', content: '## Details' });
    });

    it('should extract multiple nomnoml blocks', () => {
      const content = `## First

\`\`\`nomnoml
[A] -> [B]
\`\`\`

## Second

\`\`\`nomnoml
[C] -> [D]
\`\`\`

## End`;

      const result = extractNomnomlBlocks(content);

      expect(result).toHaveLength(5);
      expect(result[0].type).toBe('text');
      expect(result[1].type).toBe('nomnoml');
      expect(result[1].content).toBe('[A] -> [B]\n');
      expect(result[2].type).toBe('text');
      expect(result[3].type).toBe('nomnoml');
      expect(result[3].content).toBe('[C] -> [D]\n');
      expect(result[4].type).toBe('text');
    });

    it('should handle nomnoml at the start', () => {
      const content = `\`\`\`nomnoml
[Start] -> [End]
\`\`\`

Some text after`;

      const result = extractNomnomlBlocks(content);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('nomnoml');
      expect(result[0].content).toBe('[Start] -> [End]\n');
      expect(result[1].type).toBe('text');
      expect(result[1].content).toBe('Some text after');
    });

    it('should handle nomnoml at the end', () => {
      const content = `Some text before

\`\`\`nomnoml
[Start] -> [End]
\`\`\``;

      const result = extractNomnomlBlocks(content);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('text');
      expect(result[0].content).toBe('Some text before');
      expect(result[1].type).toBe('nomnoml');
      expect(result[1].content).toBe('[Start] -> [End]\n');
    });

    it('should handle complex nomnoml with directives', () => {
      const content = `\`\`\`nomnoml
#direction: down
#padding: 10
#spacing: 20

[Component A] -> [Component B]
[Component B] -> [Component C]
\`\`\``;

      const result = extractNomnomlBlocks(content);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('nomnoml');
      expect(result[0].content).toContain('#direction: down');
      expect(result[0].content).toContain('[Component A] -> [Component B]');
    });
  });

  describe('Content without nomnoml blocks', () => {
    it('should return all content as text when no nomnoml blocks exist', () => {
      const content = `## Overview

This is a spec without any diagrams.

## Details

More text content here.`;

      const result = extractNomnomlBlocks(content);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: 'text', content });
    });

    it('should handle empty content', () => {
      const content = '';

      const result = extractNomnomlBlocks(content);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: 'text', content: '' });
    });
  });

  describe('Edge cases', () => {
    it('should handle consecutive nomnoml blocks', () => {
      const content = `\`\`\`nomnoml
[A] -> [B]
\`\`\`
\`\`\`nomnoml
[C] -> [D]
\`\`\``;

      const result = extractNomnomlBlocks(content);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('nomnoml');
      expect(result[0].content).toBe('[A] -> [B]\n');
      expect(result[1].type).toBe('nomnoml');
      expect(result[1].content).toBe('[C] -> [D]\n');
    });

    it('should handle nomnoml with special characters', () => {
      const content = `\`\`\`nomnoml
[Component <interface>] -> [Data: Object]
[Service|process()|save()]
\`\`\``;

      const result = extractNomnomlBlocks(content);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('nomnoml');
      expect(result[0].content).toContain('<interface>');
      expect(result[0].content).toContain('process()');
    });

    it('should not match other code block types', () => {
      const content = `\`\`\`typescript
const x = 1;
\`\`\`

\`\`\`javascript
const y = 2;
\`\`\``;

      const result = extractNomnomlBlocks(content);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('text');
      expect(result[0].content).toBe(content);
    });

    it('should handle whitespace between sections', () => {
      const content = `Text before


\`\`\`nomnoml
[A] -> [B]
\`\`\`


Text after`;

      const result = extractNomnomlBlocks(content);

      expect(result).toHaveLength(3);
      expect(result[0].content).toBe('Text before');
      expect(result[1].type).toBe('nomnoml');
      expect(result[2].content).toBe('Text after');
    });
  });
});

