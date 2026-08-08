import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { installHarness } from './installHarness';
import { readManifest } from './manifest';

const dirs: string[] = [];

afterEach(() => {
    for (const dir of dirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

describe('installHarness', () => {
    it('copies bundle and writes manifest', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-harness-'));
        dirs.push(root);

        const extensionPath = path.resolve(__dirname, '../..');
        const result = installHarness(root, extensionPath, {
            forgeVersion: '4.0.0-test',
            worktreesPath: path.join(root, '.worktrees'),
            previous: null
        });

        expect(result.copiedFiles).toBeGreaterThan(0);
        expect(fs.existsSync(path.join(root, '.cursor/agents/architect.md'))).toBe(true);
        expect(fs.existsSync(path.join(root, '.cursor/skills/commands/ideate/SKILL.md'))).toBe(
            true
        );
        expect(fs.existsSync(path.join(root, '.cursor/rules/constitution.mdc'))).toBe(true);

        const manifest = readManifest(root);
        expect(manifest?.forgeVersion).toBe('4.0.0-test');
        expect(manifest?.managedPaths).toContain('.cursor/agents');
    });
});
