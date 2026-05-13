import * as fs from 'fs';
import * as path from 'path';

/**
 * Parse submodule relative paths from .gitmodules contents (Git config format).
 * Only collects `path = …` keys inside `[submodule "…"]` sections.
 */
export function parseSubmodulePaths(contents: string): string[] {
    const ordered: string[] = [];
    const seen = new Set<string>();
    let inSubmoduleSection = false;

    for (const rawLine of contents.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) {
            continue;
        }
        if (line.startsWith('[submodule')) {
            inSubmoduleSection = true;
            continue;
        }
        if (line.startsWith('[')) {
            inSubmoduleSection = false;
            continue;
        }
        if (!inSubmoduleSection) {
            continue;
        }
        const pathMatch = line.match(/^\s*path\s*=\s*(.+)$/i);
        if (!pathMatch) {
            continue;
        }
        let value = pathMatch[1].trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1).trim();
        }
        if (!value || seen.has(value)) {
            continue;
        }
        seen.add(value);
        ordered.push(value);
    }

    return ordered;
}

function isDirectoryInsideParent(parentResolved: string, candidateResolved: string): boolean {
    const rel = path.relative(parentResolved, candidateResolved);
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
        return false;
    }
    return true;
}

/**
 * Returns roots for Forge sync: superproject first, then each checked-out submodule directory.
 * If .gitmodules is missing, returns [repoRoot]. Paths escaping repoRoot are skipped.
 */
export function resolveForgeSyncRoots(repoRoot: string): string[] {
    const rootResolved = path.resolve(repoRoot);
    const gitmodulesPath = path.join(rootResolved, '.gitmodules');
    if (!fs.existsSync(gitmodulesPath)) {
        return [rootResolved];
    }

    let contents: string;
    try {
        contents = fs.readFileSync(gitmodulesPath, 'utf8');
    } catch {
        return [rootResolved];
    }

    const relativePaths = parseSubmodulePaths(contents);
    const roots: string[] = [rootResolved];
    const seenAbs = new Set<string>([rootResolved]);

    for (const rel of relativePaths) {
        const abs = path.resolve(rootResolved, rel);
        if (!isDirectoryInsideParent(rootResolved, abs)) {
            continue;
        }
        if (seenAbs.has(abs)) {
            continue;
        }
        try {
            const st = fs.statSync(abs);
            if (!st.isDirectory()) {
                continue;
            }
        } catch {
            continue;
        }
        seenAbs.add(abs);
        roots.push(abs);
    }

    return roots;
}
