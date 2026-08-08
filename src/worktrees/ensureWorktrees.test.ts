import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { ensureWorktreesConfig } from './ensureWorktrees';

const dirs: string[] = [];

afterEach(() => {
    for (const dir of dirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

describe('ensureWorktreesConfig', () => {
    it('creates worktrees dir and gitignore entries', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-wt-'));
        dirs.push(root);
        fs.writeFileSync(path.join(root, '.gitignore'), 'node_modules/\n', 'utf8');

        const result = ensureWorktreesConfig(root, '.worktrees');
        expect(fs.existsSync(result.worktreesPath)).toBe(true);
        expect(result.gitignoreUpdated).toBe(true);

        const ignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
        expect(ignore).toContain('.worktrees/');
        expect(ignore).toContain('.cursor/.tmp/');
    });
});
