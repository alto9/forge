import { describe, expect, it, vi } from 'vitest';
import { createGitRunner, PLUGIN_GIT_BRANCH, PLUGIN_GIT_REMOTE } from './gitRunner';

describe('createGitRunner', () => {
    it('fast-forwards via explicit fetch and merge to avoid FETCH_HEAD races', async () => {
        const exec = vi.fn().mockResolvedValue({ stdout: '', stderr: '' });
        const git = createGitRunner(exec);

        await git.pull('/tmp/forge-cursor');

        expect(exec).toHaveBeenCalledTimes(2);
        expect(exec).toHaveBeenNthCalledWith(
            1,
            'git',
            ['-C', '/tmp/forge-cursor', 'fetch', PLUGIN_GIT_REMOTE, PLUGIN_GIT_BRANCH],
            { timeout: 60_000 }
        );
        expect(exec).toHaveBeenNthCalledWith(
            2,
            'git',
            [
                '-C',
                '/tmp/forge-cursor',
                'merge',
                '--ff-only',
                `${PLUGIN_GIT_REMOTE}/${PLUGIN_GIT_BRANCH}`
            ],
            { timeout: 60_000 }
        );
    });

    it('clones a shallow single-branch checkout of main', async () => {
        const exec = vi.fn().mockResolvedValue({ stdout: '', stderr: '' });
        const git = createGitRunner(exec);

        await git.clone('https://example.com/repo.git', '/tmp/dest');

        expect(exec).toHaveBeenCalledWith(
            'git',
            [
                'clone',
                '--depth',
                '1',
                '--single-branch',
                '--branch',
                PLUGIN_GIT_BRANCH,
                'https://example.com/repo.git',
                '/tmp/dest'
            ],
            { timeout: 120_000 }
        );
    });
});
