import * as fs from 'fs';
import * as path from 'path';

/** Fixed checkout path for the agent-owned memory-repo submodule. */
export const MEMORY_REPO_PATH = '.ai/memory';

export interface GitmoduleEntry {
    path: string;
    url?: string;
    branch?: string;
}

export interface ResolvePathsOk {
    ok: true;
    superRepoRoot: string;
    submodulePath: string;
    submoduleRoot: string;
    memoryRepoRoot: string;
    memoryRoot: string;
    memoryRepoInitialized: boolean;
    submoduleInitialized: boolean;
}

export interface ResolvePathsErr {
    ok: false;
    error: string;
    superRepoRoot?: string;
}

export type ResolvePathsResult = ResolvePathsOk | ResolvePathsErr;

export interface ResolvePathsOptions {
    cwd?: string;
    submodule?: string;
    superRepo?: string;
    /**
     * When true (extension UI), ambiguous submodule at the super-repo root
     * defaults to the first memory-configured code path (else first code path)
     * so the dashboard project dropdown can switch. Event commands should leave
     * this false and fail closed.
     */
    preferDefaultSubmodule?: boolean;
}

/**
 * Parse .gitmodules into submodule entries.
 */
export function parseGitmodules(content: string): GitmoduleEntry[] {
    const entries: GitmoduleEntry[] = [];
    let current: Partial<GitmoduleEntry> | null = null;
    for (const line of content.split(/\r?\n/)) {
        const section = line.match(/^\s*\[submodule\s+"[^"]+"\]\s*$/);
        if (section) {
            current = {};
            entries.push(current as GitmoduleEntry);
            continue;
        }
        if (!current) {
            continue;
        }
        const kv = line.match(/^\s*([a-zA-Z0-9_-]+)\s*=\s*(.+)$/);
        if (!kv) {
            continue;
        }
        const key = kv[1].trim();
        const value = kv[2].trim();
        if (key === 'path') {
            current.path = value;
        } else if (key === 'url') {
            current.url = value;
        } else if (key === 'branch') {
            current.branch = value;
        }
    }
    return entries.filter((e): e is GitmoduleEntry => Boolean(e.path));
}

/** Path list only (code + memory). Prefer parseGitmodules for full entries. */
export function parseGitmodulesPaths(content: string): string[] {
    return parseGitmodules(content).map((e) => e.path);
}

export function findMemoryRepoEntry(entries: GitmoduleEntry[]): GitmoduleEntry | null {
    return entries.find((e) => e.path === MEMORY_REPO_PATH) || null;
}

export function codeSubmodulePaths(entries: GitmoduleEntry[]): string[] {
    return entries.map((e) => e.path).filter((p) => p !== MEMORY_REPO_PATH);
}

export function findSuperRepoRoot(
    startDir: string,
    explicit?: string
): { root: string } | { error: string } {
    if (explicit) {
        const root = path.resolve(explicit);
        if (!fs.existsSync(path.join(root, '.gitmodules'))) {
            return { error: `FORGE_SUPER_REPO/explicit root missing .gitmodules: ${root}` };
        }
        return { root };
    }
    let dir = path.resolve(startDir);
    const candidates: string[] = [];
    for (;;) {
        if (fs.existsSync(path.join(dir, '.gitmodules'))) {
            candidates.push(dir);
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            break;
        }
        dir = parent;
    }
    if (candidates.length === 0) {
        return { error: 'No .gitmodules found walking up from cwd; set FORGE_SUPER_REPO' };
    }
    const withMemory = candidates.filter((c) =>
        fs.existsSync(path.join(c, '.ai', 'memory'))
    );
    const pool = withMemory.length ? withMemory : candidates;
    if (pool.length > 1) {
        return {
            error: `Ambiguous super-repo roots: ${pool.join(', ')}. Set FORGE_SUPER_REPO.`,
        };
    }
    return { root: pool[0] };
}

export function resolveSubmodulePath(
    superRepoRoot: string,
    cwd: string,
    explicitSubmodule: string | undefined,
    entries: GitmoduleEntry[],
    preferDefault = false
): { submodulePath: string } | { error: string } {
    const codePaths = codeSubmodulePaths(entries);
    if (explicitSubmodule) {
        const p = explicitSubmodule.replace(/^\.\//, '').replace(/\/$/, '');
        if (p === MEMORY_REPO_PATH) {
            return {
                error: `".ai/memory" is the memory-repo, not a code submodule. Pass a code path. Known: ${codePaths.join(', ') || '(none)'}`,
            };
        }
        if (!codePaths.includes(p)) {
            return {
                error: `submodule "${p}" not in .gitmodules code list. Known: ${codePaths.join(', ') || '(none)'}`,
            };
        }
        return { submodulePath: p };
    }
    const rel = path.relative(superRepoRoot, path.resolve(cwd));
    if (rel && !rel.startsWith('..')) {
        if (rel === MEMORY_REPO_PATH || rel.startsWith(MEMORY_REPO_PATH + path.sep)) {
            // fall through
        } else {
            const match = codePaths
                .filter((s) => rel === s || rel.startsWith(s + path.sep))
                .sort((a, b) => b.length - a.length)[0];
            if (match) {
                return { submodulePath: match };
            }
        }
    }
    const memoryRepoRoot = path.join(superRepoRoot, ...MEMORY_REPO_PATH.split('/'));
    const configured = codePaths.filter((s) =>
        fs.existsSync(path.join(memoryRepoRoot, s))
    );
    if (configured.length === 1) {
        return { submodulePath: configured[0] };
    }
    if (codePaths.length === 1) {
        return { submodulePath: codePaths[0] };
    }
    // Extension UI: super-repo root with multiple projects is normal — pick a default.
    if (preferDefault && codePaths.length > 0) {
        return { submodulePath: configured[0] ?? codePaths[0] };
    }
    return {
        error: `Ambiguous submodule. Pass --submodule. Known: ${codePaths.join(', ') || '(none)'}`,
    };
}

export function resolvePaths(options: ResolvePathsOptions = {}): ResolvePathsResult {
    const cwd = options.cwd ?? process.cwd();
    const superRepo = options.superRepo ?? process.env.FORGE_SUPER_REPO;
    const sr = findSuperRepoRoot(cwd, superRepo);
    if ('error' in sr) {
        return { ok: false, error: sr.error };
    }

    let entries: GitmoduleEntry[];
    try {
        const gm = fs.readFileSync(path.join(sr.root, '.gitmodules'), 'utf8');
        entries = parseGitmodules(gm);
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return { ok: false, error: `Cannot read .gitmodules: ${message}`, superRepoRoot: sr.root };
    }

    const memoryEntry = findMemoryRepoEntry(entries);
    if (!memoryEntry) {
        return {
            ok: false,
            error:
                `Missing memory-repo submodule at path "${MEMORY_REPO_PATH}". ` +
                `Add it: git submodule add -b main <url> .ai/memory`,
            superRepoRoot: sr.root,
        };
    }

    const sm = resolveSubmodulePath(
        sr.root,
        cwd,
        options.submodule,
        entries,
        options.preferDefaultSubmodule === true
    );
    if ('error' in sm) {
        return { ok: false, error: sm.error, superRepoRoot: sr.root };
    }

    const memoryRepoRoot = path.join(sr.root, ...MEMORY_REPO_PATH.split('/'));
    const submoduleRoot = path.join(sr.root, sm.submodulePath);
    const memoryRoot = path.join(memoryRepoRoot, sm.submodulePath);

    return {
        ok: true,
        superRepoRoot: sr.root,
        submodulePath: sm.submodulePath,
        submoduleRoot,
        memoryRepoRoot,
        memoryRoot,
        memoryRepoInitialized:
            fs.existsSync(path.join(memoryRepoRoot, '.git')) || fs.existsSync(memoryRepoRoot),
        submoduleInitialized: fs.existsSync(submoduleRoot),
    };
}

/** True when the workspace has a properly configured Forge memory repo (sidebar active). */
export function isMemoryRepoConfigured(result: ResolvePathsResult): boolean {
    return result.ok === true && result.memoryRepoInitialized === true;
}

/** List code submodule paths from a super-repo .gitmodules (excludes .ai/memory). */
export function listCodeSubmodules(superRepoRoot: string): string[] {
    try {
        const gm = fs.readFileSync(path.join(superRepoRoot, '.gitmodules'), 'utf8');
        return codeSubmodulePaths(parseGitmodules(gm));
    } catch {
        return [];
    }
}
