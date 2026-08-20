import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { GitRunner } from './gitRunner';

export const DEFAULT_PLUGIN_REPO = 'https://github.com/alto9/forge-cursor-plugin.git';
export const LOCAL_PLUGIN_DIRNAME = 'forge-cursor';

export type EnsureLocalPluginAction = 'cloned' | 'updated' | 'unchanged';

export interface EnsureLocalPluginResult {
    action: EnsureLocalPluginAction;
    dest: string;
}

export interface EnsureLocalPluginOptions {
    git: GitRunner;
    homeDir?: string;
    repoUrl?: string;
}

export function localPluginPath(homeDir: string = os.homedir()): string {
    return path.join(homeDir, '.cursor', 'plugins', 'local', LOCAL_PLUGIN_DIRNAME);
}

/**
 * Clone or fast-forward the Cursor plugin into ~/.cursor/plugins/local/forge-cursor.
 * Does not use vscode.cursor.plugins.addPlugin; local-load is the install target.
 */
export async function ensureLocalPlugin(
    options: EnsureLocalPluginOptions
): Promise<EnsureLocalPluginResult> {
    const dest = localPluginPath(options.homeDir);
    const repoUrl = options.repoUrl || DEFAULT_PLUGIN_REPO;
    const parent = path.dirname(dest);
    fs.mkdirSync(parent, { recursive: true });

    if (!fs.existsSync(dest)) {
        await options.git.clone(repoUrl, dest);
        return { action: 'cloned', dest };
    }

    if (!fs.existsSync(path.join(dest, '.git'))) {
        throw new Error(
            `Forge Cursor plugin is already at ${dest} but is not a git clone. Remove that folder (or replace it with a clone of ${repoUrl}) and sync again.`
        );
    }

    const before = await options.git.revParse(dest);
    await options.git.pull(dest);
    const after = await options.git.revParse(dest);
    return {
        action: before === after ? 'unchanged' : 'updated',
        dest
    };
}
