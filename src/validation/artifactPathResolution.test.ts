import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { globPatternToRegExp, resolveArtifactGlobPaths } from './artifactPathResolution';

const tempDirs: string[] = [];

function createTempWorkspace(): string {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-artifact-glob-'));
    tempDirs.push(workspaceRoot);
    return workspaceRoot;
}

afterEach(() => {
    for (const tempDir of tempDirs.splice(0)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

describe('artifactPathResolution', () => {
    it('matches refine-issue tmp artifact glob paths', () => {
        const workspaceRoot = createTempWorkspace();
        const sessionDir = path.join(workspaceRoot, '.cursor', '.tmp', 'refine-forge-50');
        fs.mkdirSync(sessionDir, { recursive: true });
        fs.writeFileSync(path.join(sessionDir, 'user_questions.md'), '# Questions');
        fs.writeFileSync(path.join(sessionDir, 'assumptions.md'), '# Assumptions');

        const matches = resolveArtifactGlobPaths(
            workspaceRoot,
            '.cursor/.tmp/refine-*/user_questions.md'
        );

        expect(matches).toEqual(['.cursor/.tmp/refine-forge-50/user_questions.md']);
    });

    it('returns empty array when glob pattern has no matches', () => {
        const workspaceRoot = createTempWorkspace();

        const matches = resolveArtifactGlobPaths(
            workspaceRoot,
            '.cursor/.tmp/refine-*/user_questions.md'
        );

        expect(matches).toEqual([]);
    });

    it('returns literal path when pattern has no wildcard', () => {
        const workspaceRoot = createTempWorkspace();
        const filePath = path.join(workspaceRoot, 'artifacts', 'output.json');
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, '{}');

        const matches = resolveArtifactGlobPaths(workspaceRoot, 'artifacts/output.json');

        expect(matches).toEqual(['artifacts/output.json']);
    });

    it('converts glob patterns to anchored regular expressions', () => {
        expect(globPatternToRegExp('.cursor/.tmp/refine-*/user_questions.md').test(
            '.cursor/.tmp/refine-forge-50/user_questions.md'
        )).toBe(true);
        expect(globPatternToRegExp('.cursor/.tmp/refine-*/user_questions.md').test(
            '.cursor/.tmp/other/user_questions.md'
        )).toBe(false);
    });
});
