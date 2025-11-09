import { marked } from 'marked';
import TurndownService from 'turndown';

// Configure turndown service for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',          // Use # syntax for headings
  codeBlockStyle: 'fenced',     // Use ``` syntax for code blocks
  bulletListMarker: '-',        // Use - for bullet lists
});

/**
 * Convert markdown to HTML using the marked library
 * Configured with GitHub Flavored Markdown support
 */
export function markdownToHtml(markdown: string): string {
  return marked(markdown, {
    gfm: true,      // Enable GitHub Flavored Markdown
    breaks: true,   // Convert line breaks to <br>
  }) as string;
}

/**
 * Convert HTML to markdown using the turndown library
 * Preserves markdown formatting conventions
 */
export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}

