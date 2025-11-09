import * as fs from 'fs';
import matter from 'gray-matter';

export interface ParsedFile {
    frontmatter: any;
    content: string;
}

export class FileParser {
    /**
     * Read file content from the filesystem
     */
    static async readFile(filePath: string): Promise<string> {
        return fs.promises.readFile(filePath, 'utf-8');
    }

    /**
     * Parse frontmatter and content from a markdown file
     */
    static parseFrontmatter(content: string): ParsedFile {
        const parsed = matter(content);
        return {
            frontmatter: parsed.data,
            content: parsed.content
        };
    }

    /**
     * Stringify frontmatter and content to markdown
     */
    static stringifyFrontmatter(frontmatter: any, content: string): string {
        return matter.stringify(content, frontmatter);
    }

    /**
     * Extract IDs from frontmatter arrays
     */
    static extractIds(frontmatter: any, key: string): string[] {
        const value = frontmatter[key];
        if (Array.isArray(value)) {
            return value;
        } else if (typeof value === 'string') {
            return [value];
        }
        return [];
    }
}

