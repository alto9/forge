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
     * Remove undefined values from an object recursively
     */
    private static removeUndefined(obj: any): any {
        if (obj === null || obj === undefined) {
            return undefined;
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.removeUndefined(item)).filter(item => item !== undefined);
        }
        if (typeof obj === 'object') {
            const cleaned: any = {};
            for (const [key, value] of Object.entries(obj)) {
                const cleanedValue = this.removeUndefined(value);
                if (cleanedValue !== undefined) {
                    cleaned[key] = cleanedValue;
                }
            }
            return cleaned;
        }
        return obj;
    }

    /**
     * Stringify frontmatter and content to markdown
     */
    static stringifyFrontmatter(frontmatter: any, content: string): string {
        // Clean undefined values before stringifying to avoid YAML errors
        const cleanedFrontmatter = this.removeUndefined(frontmatter);
        return matter.stringify(content, cleanedFrontmatter);
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

