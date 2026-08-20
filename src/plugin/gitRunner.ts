import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

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
            await exec('git', ['clone', '--depth', '1', repoUrl, dest], {
                timeout: 120_000
            });
        },
        async pull(dest: string): Promise<void> {
            await exec('git', ['-C', dest, 'pull', '--ff-only'], {
                timeout: 60_000
            });
        },
        async revParse(dest: string): Promise<string> {
            const { stdout } = await exec('git', ['-C', dest, 'rev-parse', 'HEAD'], {
                timeout: 10_000
            });
            return stdout.trim();
        }
    };
}
