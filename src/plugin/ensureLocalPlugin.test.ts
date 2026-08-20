import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    DEFAULT_PLUGIN_REPO,
    ensureLocalPlugin,
    localPluginPath
} from './ensureLocalPlugin';
import type { GitRunner } from './gitRunner';

const dirs: string[] = [];

afterEach(() => {
    for (const dir of dirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

function mockGit(overrides: Partial<GitRunner> = {}): GitRunner {
    return {
        clone: vi.fn(async (_repo, dest) => {
            fs.mkdirSync(path.join(dest, '.git'), { recursive: true });
        }),
        pull: vi.fn(async () => undefined),
        revParse: vi.fn(async () => 'abc123'),
        ...overrides
    };
}

describe('localPluginPath', () => {
    it('resolves under ~/.cursor/plugins/local/forge-cursor', () => {
        expect(localPluginPath('/Users/dev')).toBe(
            path.join('/Users/dev', '.cursor', 'plugins', 'local', 'forge-cursor')
        );
    });
});

describe('ensureLocalPlugin', () => {
    it('clones when the local plugin folder is missing', async () => {
        const home = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-plugin-home-'));
        dirs.push(home);
        const git = mockGit();

        const result = await ensureLocalPlugin({ git, homeDir: home });

        expect(result.action).toBe('cloned');
        expect(result.dest).toBe(localPluginPath(home));
        expect(git.clone).toHaveBeenCalledWith(DEFAULT_PLUGIN_REPO, result.dest);
        expect(fs.existsSync(path.join(result.dest, '.git'))).toBe(true);
    });

    it('pulls and reports updated when HEAD moves', async () => {
        const home = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-plugin-home-'));
        dirs.push(home);
        const dest = localPluginPath(home);
        fs.mkdirSync(path.join(dest, '.git'), { recursive: true });
        const git = mockGit({
            revParse: vi
                .fn()
                .mockResolvedValueOnce('aaa')
                .mockResolvedValueOnce('bbb')
        });

        const result = await ensureLocalPlugin({ git, homeDir: home });

        expect(result.action).toBe('updated');
        expect(git.pull).toHaveBeenCalledWith(dest);
        expect(git.clone).not.toHaveBeenCalled();
    });

    it('reports unchanged when pull is a no-op', async () => {
        const home = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-plugin-home-'));
        dirs.push(home);
        const dest = localPluginPath(home);
        fs.mkdirSync(path.join(dest, '.git'), { recursive: true });
        const git = mockGit();

        const result = await ensureLocalPlugin({ git, homeDir: home });

        expect(result.action).toBe('unchanged');
        expect(git.pull).toHaveBeenCalledWith(dest);
    });

    it('refuses to overwrite a non-git folder already at the install path', async () => {
        const home = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-plugin-home-'));
        dirs.push(home);
        const dest = localPluginPath(home);
        fs.mkdirSync(dest, { recursive: true });
        fs.writeFileSync(path.join(dest, 'README.md'), 'manual');
        const git = mockGit();

        await expect(ensureLocalPlugin({ git, homeDir: home })).rejects.toThrow(
            /not a git clone/
        );
        expect(git.clone).not.toHaveBeenCalled();
        expect(git.pull).not.toHaveBeenCalled();
    });
});
