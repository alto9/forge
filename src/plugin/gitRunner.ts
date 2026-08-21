import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export const PLUGIN_GIT_REMOTE = 'origin';
export const PLUGIN_GIT_BRANCH = 'main';

export interface GitRunner {
    clone(repoUrl: string, dest: string): Promise<void>;
    pull(dest: string): Promise<void>;
    revParse(dest: string): Promise<string>;
}

export function createGitRunner(
    exec: typeof execFileAsync = execFileAsync
): GitRunner {
    return {
        async clone(repoUrl: string, dest: string): Promise<void> {
            await exec(
                'git',
                [
                    'clone',
                    '--depth',
                    '1',
                    '--single-branch',
                    '--branch',
                    PLUGIN_GIT_BRANCH,
                    repoUrl,
                    dest
                ],
                { timeout: 120_000 }
            );
        },
        async pull(dest: string): Promise<void> {
            // Fetch then merge origin/main explicitly. Bare `pull --ff-only` can fail
            // when another process (e.g. a second Cursor window) leaves multiple refs
            // in FETCH_HEAD.
            await exec(
                'git',
                ['-C', dest, 'fetch', PLUGIN_GIT_REMOTE, PLUGIN_GIT_BRANCH],
                { timeout: 60_000 }
            );
            await exec(
                'git',
                [
                    '-C',
                    dest,
                    'merge',
                    '--ff-only',
                    `${PLUGIN_GIT_REMOTE}/${PLUGIN_GIT_BRANCH}`
                ],
                { timeout: 60_000 }
            );
        },
        async revParse(dest: string): Promise<string> {
            const { stdout } = await exec('git', ['-C', dest, 'rev-parse', 'HEAD'], {
                timeout: 10_000
            });
            return stdout.trim();
        }
    };
}
