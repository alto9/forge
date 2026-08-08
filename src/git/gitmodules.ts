import * as fs from 'fs';
import * as path from 'path';
import { detectProviderFromUrl } from './provider';
import type { SubmoduleEntry, SubmoduleView } from './types';

/**
 * Parse full submodule entries from .gitmodules contents (Git config format).
 */
export function parseSubmodules(contents: string): SubmoduleEntry[] {
    const entries: SubmoduleEntry[] = [];
    let currentName: string | null = null;
    let current: Partial<SubmoduleEntry> | null = null;

    const flush = () => {
        if (!current || !currentName) {
            return;
        }
        const submodulePath = (current.path ?? '').trim();
        const url = (current.url ?? '').trim();
        if (!submodulePath || !url) {
            currentName = null;
            current = null;
            return;
        }
        entries.push({
            name: currentName,
            path: submodulePath,
            url,
            branch: (current.branch ?? 'main').trim() || 'main'
        });
        currentName = null;
        current = null;
    };

    for (const rawLine of contents.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#') || line.startsWith(';')) {
            continue;
        }
        const sectionMatch = line.match(/^\[submodule\s+"([^"]+)"\]$/i);
        if (sectionMatch) {
            flush();
            currentName = sectionMatch[1];
            current = { name: currentName };
            continue;
        }
        if (line.startsWith('[')) {
            flush();
            continue;
        }
        if (!current) {
            continue;
        }
        const kv = line.match(/^([^=]+)=(.*)$/);
        if (!kv) {
            continue;
        }
        const key = kv[1].trim().toLowerCase();
        let value = kv[2].trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        if (key === 'path') {
            current.path = value;
        } else if (key === 'url') {
            current.url = value;
        } else if (key === 'branch') {
            current.branch = value;
        }
    }
    flush();
    return entries;
}

/** @deprecated Prefer parseSubmodules; kept for path-only callers. */
export function parseSubmodulePaths(contents: string): string[] {
    return parseSubmodules(contents).map((e) => e.path);
}

export function serializeSubmodules(entries: SubmoduleEntry[]): string {
    if (entries.length === 0) {
        return '';
    }
    const blocks = entries.map((entry) => {
        const name = entry.name || path.basename(entry.path);
        return [
            `[submodule "${name}"]`,
            `\tpath = ${entry.path}`,
            `\turl = ${entry.url}`,
            `\tbranch = ${entry.branch || 'main'}`
        ].join('\n');
    });
    return `${blocks.join('\n')}\n`;
}

export function readSubmodules(repoRoot: string): SubmoduleView[] {
    const gitmodulesPath = path.join(repoRoot, '.gitmodules');
    if (!fs.existsSync(gitmodulesPath)) {
        return [];
    }
    const contents = fs.readFileSync(gitmodulesPath, 'utf8');
    return parseSubmodules(contents).map((entry) => ({
        ...entry,
        provider: detectProviderFromUrl(entry.url)
    }));
}

export function writeSubmodulesFile(repoRoot: string, entries: SubmoduleEntry[]): void {
    const gitmodulesPath = path.join(repoRoot, '.gitmodules');
    if (entries.length === 0) {
        if (fs.existsSync(gitmodulesPath)) {
            fs.unlinkSync(gitmodulesPath);
        }
        return;
    }
    fs.writeFileSync(gitmodulesPath, serializeSubmodules(entries), 'utf8');
}

function isDirectoryInsideParent(parentResolved: string, candidateResolved: string): boolean {
    const rel = path.relative(parentResolved, candidateResolved);
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
        return false;
    }
    return true;
}

/**
 * Returns checked-out submodule directories under repoRoot (does not include superproject).
 */
export function listCheckedOutSubmoduleDirs(repoRoot: string): string[] {
    const rootResolved = path.resolve(repoRoot);
    const entries = readSubmodules(rootResolved);
    const dirs: string[] = [];
    for (const entry of entries) {
        const abs = path.resolve(rootResolved, entry.path);
        if (!isDirectoryInsideParent(rootResolved, abs)) {
            continue;
        }
        try {
            if (fs.statSync(abs).isDirectory()) {
                dirs.push(abs);
            }
        } catch {
            // skip missing
        }
    }
    return dirs;
}
