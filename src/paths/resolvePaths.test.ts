import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
    MEMORY_REPO_PATH,
    codeSubmodulePaths,
    findMemoryRepoEntry,
    findSuperRepoRoot,
    isMemoryRepoConfigured,
    listCodeSubmodules,
    parseGitmodules,
    resolvePaths,
    resolveSubmodulePath,
} from './resolvePaths';

const tempDirs: string[] = [];

function mkTemp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-paths-'));
    tempDirs.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

describe('parseGitmodules', () => {
    it('parses path url and branch', () => {
        const content = `
[submodule "forge"]
\tpath = forge
\turl = https://example.com/forge.git
\tbranch = main
[submodule "memory"]
\tpath = .ai/memory
\turl = https://example.com/memory.git
`;
        const entries = parseGitmodules(content);
        expect(entries).toEqual([
            { path: 'forge', url: 'https://example.com/forge.git', branch: 'main' },
            { path: '.ai/memory', url: 'https://example.com/memory.git' },
        ]);
        expect(findMemoryRepoEntry(entries)?.path).toBe(MEMORY_REPO_PATH);
        expect(codeSubmodulePaths(entries)).toEqual(['forge']);
    });
});

describe('findSuperRepoRoot', () => {
    it('finds nearest .gitmodules with .ai/memory preference', () => {
        const root = mkTemp();
        fs.writeFileSync(path.join(root, '.gitmodules'), '');
        fs.mkdirSync(path.join(root, '.ai', 'memory'), { recursive: true });
        const nested = path.join(root, 'forge', 'src');
        fs.mkdirSync(nested, { recursive: true });

        const found = findSuperRepoRoot(nested);
        expect(found).toEqual({ root });
    });

    it('errors when no .gitmodules found', () => {
        const root = mkTemp();
        const result = findSuperRepoRoot(root);
        expect(result).toHaveProperty('error');
    });

    it('uses explicit super-repo when provided', () => {
        const root = mkTemp();
        fs.writeFileSync(path.join(root, '.gitmodules'), '');
        const result = findSuperRepoRoot('/tmp', root);
        expect(result).toEqual({ root: path.resolve(root) });
    });
});

describe('resolvePaths', () => {
    it('returns ok when memory submodule is configured', () => {
        const root = mkTemp();
        fs.writeFileSync(
            path.join(root, '.gitmodules'),
            `[submodule "app"]\n\tpath = app\n[submodule "memory"]\n\tpath = .ai/memory\n`
        );
        fs.mkdirSync(path.join(root, '.ai', 'memory', 'app'), { recursive: true });
        fs.mkdirSync(path.join(root, 'app'), { recursive: true });
        fs.writeFileSync(path.join(root, '.ai', 'memory', '.git'), 'gitdir: ../.git/modules/memory');

        const result = resolvePaths({ cwd: path.join(root, 'app'), superRepo: root });
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.submodulePath).toBe('app');
            expect(result.memoryRoot).toBe(path.join(root, '.ai', 'memory', 'app'));
            expect(result.memoryRepoInitialized).toBe(true);
            expect(isMemoryRepoConfigured(result)).toBe(true);
        }
    });

    it('fails when memory submodule is missing from .gitmodules', () => {
        const root = mkTemp();
        fs.writeFileSync(path.join(root, '.gitmodules'), `[submodule "app"]\n\tpath = app\n`);
        const result = resolvePaths({ cwd: root, superRepo: root });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toContain('.ai/memory');
        }
        expect(isMemoryRepoConfigured(result)).toBe(false);
    });

    it('rejects .ai/memory as explicit submodule', () => {
        const root = mkTemp();
        fs.writeFileSync(
            path.join(root, '.gitmodules'),
            `[submodule "app"]\n\tpath = app\n[submodule "memory"]\n\tpath = .ai/memory\n`
        );
        fs.mkdirSync(path.join(root, '.ai', 'memory'), { recursive: true });
        const result = resolveSubmodulePath(
            root,
            root,
            '.ai/memory',
            parseGitmodules(fs.readFileSync(path.join(root, '.gitmodules'), 'utf8'))
        );
        expect(result).toHaveProperty('error');
    });

    it('lists code submodules excluding memory', () => {
        const root = mkTemp();
        fs.writeFileSync(
            path.join(root, '.gitmodules'),
            `[submodule "a"]\n\tpath = a\n[submodule "b"]\n\tpath = b\n[submodule "memory"]\n\tpath = .ai/memory\n`
        );
        expect(listCodeSubmodules(root)).toEqual(['a', 'b']);
    });

    it('fails closed on ambiguous submodule at super-repo root without preferDefault', () => {
        const root = mkTemp();
        fs.writeFileSync(
            path.join(root, '.gitmodules'),
            `[submodule "a"]\n\tpath = a\n[submodule "b"]\n\tpath = b\n[submodule "memory"]\n\tpath = .ai/memory\n`
        );
        fs.mkdirSync(path.join(root, '.ai', 'memory', 'a'), { recursive: true });
        fs.mkdirSync(path.join(root, '.ai', 'memory', 'b'), { recursive: true });
        const result = resolvePaths({ cwd: root, superRepo: root });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toContain('Ambiguous submodule');
        }
    });

    it('defaults submodule at super-repo root when preferDefaultSubmodule is set', () => {
        const root = mkTemp();
        fs.writeFileSync(
            path.join(root, '.gitmodules'),
            `[submodule "a"]\n\tpath = a\n[submodule "b"]\n\tpath = b\n[submodule "memory"]\n\tpath = .ai/memory\n`
        );
        fs.mkdirSync(path.join(root, '.ai', 'memory', 'a'), { recursive: true });
        fs.mkdirSync(path.join(root, '.ai', 'memory', 'b'), { recursive: true });
        fs.writeFileSync(path.join(root, '.ai', 'memory', '.git'), 'gitdir: ../.git/modules/memory');

        const result = resolvePaths({
            cwd: root,
            superRepo: root,
            preferDefaultSubmodule: true,
        });
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.submodulePath).toBe('a');
            expect(isMemoryRepoConfigured(result)).toBe(true);
        }
    });
});
