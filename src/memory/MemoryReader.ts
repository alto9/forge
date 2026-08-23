import * as fs from 'fs';
import * as path from 'path';
import { load as yamlLoad } from 'js-yaml';

export interface ParsedMemoryDoc {
    /** Relative path under memoryRoot, e.g. product/brief.md */
    relPath: string;
    /** Absolute path on disk */
    absPath: string;
    exists: boolean;
    frontmatter: Record<string, unknown>;
    body: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function parseFrontmatter(content: string): {
    frontmatter: Record<string, unknown>;
    body: string;
} {
    const match = content.match(FRONTMATTER_RE);
    if (!match) {
        return { frontmatter: {}, body: content };
    }
    let frontmatter: Record<string, unknown> = {};
    try {
        const parsed = yamlLoad(match[1]);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            frontmatter = parsed as Record<string, unknown>;
        }
    } catch {
        frontmatter = {};
    }
    return { frontmatter, body: match[2] ?? '' };
}

export function readMemoryDoc(memoryRoot: string, relPath: string): ParsedMemoryDoc {
    const absPath = path.join(memoryRoot, relPath);
    if (!fs.existsSync(absPath)) {
        return {
            relPath,
            absPath,
            exists: false,
            frontmatter: {},
            body: '',
        };
    }
    const content = fs.readFileSync(absPath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);
    return { relPath, absPath, exists: true, frontmatter, body };
}

export interface ForgeJson {
    path?: string;
    host?: string;
    [key: string]: unknown;
}

export function readForgeJson(memoryRoot: string): ForgeJson | null {
    const absPath = path.join(memoryRoot, 'forge.json');
    if (!fs.existsSync(absPath)) {
        return null;
    }
    try {
        const raw = JSON.parse(fs.readFileSync(absPath, 'utf8'));
        if (raw && typeof raw === 'object') {
            return raw as ForgeJson;
        }
    } catch {
        return null;
    }
    return null;
}

/** Product Owner memory docs shown on the dashboard. */
export const PO_DOC_PATHS = {
    brief: 'product/brief.md',
    competitive: 'product/competitive.md',
    personas: 'product/personas.md',
    experiments: 'product/experiments.md',
    insights: 'product/insights.md',
    metrics: 'product/metrics.md',
} as const;

export type PoDocKey = keyof typeof PO_DOC_PATHS;

export function readProductOwnerDocs(memoryRoot: string): Record<PoDocKey, ParsedMemoryDoc> {
    const out = {} as Record<PoDocKey, ParsedMemoryDoc>;
    for (const [key, rel] of Object.entries(PO_DOC_PATHS) as [PoDocKey, string][]) {
        out[key] = readMemoryDoc(memoryRoot, rel);
    }
    return out;
}

export function listFeatureSpecs(memoryRoot: string): string[] {
    const specsDir = path.join(memoryRoot, 'product', 'specs');
    if (!fs.existsSync(specsDir)) {
        return [];
    }
    return fs
        .readdirSync(specsDir)
        .filter((f) => f.endsWith('.md'))
        .sort();
}
