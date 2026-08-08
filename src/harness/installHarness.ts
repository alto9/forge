import * as fs from 'fs';
import * as path from 'path';
import {
    DEFAULT_MANAGED_PATHS,
    type ForgeManifest,
    writeManifest
} from './manifest';

export interface InstallHarnessResult {
    copiedFiles: number;
    managedPaths: string[];
    manifest: ForgeManifest;
}

function copyDirRecursive(src: string, dest: string, collected: string[], repoRoot: string): void {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const from = path.join(src, entry.name);
        const to = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(from, to, collected, repoRoot);
        } else if (entry.isFile()) {
            fs.mkdirSync(path.dirname(to), { recursive: true });
            fs.copyFileSync(from, to);
            collected.push(path.relative(repoRoot, to).replace(/\\/g, '/'));
        }
    }
}

export function harnessBundleRoot(extensionPath: string): string {
    return path.join(extensionPath, 'resources', 'harness');
}

/**
 * Copy bundled harness into {repoRoot}/.cursor/ (agents, skills, rules).
 * Writes/updates .cursor/forge/manifest.json.
 */
export function installHarness(
    repoRoot: string,
    extensionPath: string,
    options: {
        forgeVersion: string;
        worktreesPath: string;
        previous?: ForgeManifest | null;
    }
): InstallHarnessResult {
    const bundle = harnessBundleRoot(extensionPath);
    if (!fs.existsSync(bundle)) {
        throw new Error(`Harness bundle missing at ${bundle}`);
    }

    const cursorRoot = path.join(repoRoot, '.cursor');
    fs.mkdirSync(cursorRoot, { recursive: true });

    const copied: string[] = [];
    const mappings: Array<{ from: string; to: string }> = [
        { from: path.join(bundle, 'agents'), to: path.join(cursorRoot, 'agents') },
        { from: path.join(bundle, 'skills'), to: path.join(cursorRoot, 'skills') },
        { from: path.join(bundle, 'rules'), to: path.join(cursorRoot, 'rules') }
    ];

    for (const map of mappings) {
        if (!fs.existsSync(map.from)) {
            continue;
        }
        // Replace managed trees wholesale so updates are clean.
        if (fs.existsSync(map.to)) {
            fs.rmSync(map.to, { recursive: true, force: true });
        }
        copyDirRecursive(map.from, map.to, copied, repoRoot);
    }

    const now = new Date().toISOString();
    const absWorktrees = path.isAbsolute(options.worktreesPath)
        ? options.worktreesPath
        : path.resolve(repoRoot, options.worktreesPath);
    const relWorktrees = path.relative(repoRoot, absWorktrees).replace(/\\/g, '/');
    const worktreesPathForManifest =
        relWorktrees && !relWorktrees.startsWith('..') && !path.isAbsolute(relWorktrees)
            ? relWorktrees
            : absWorktrees;

    const manifest: ForgeManifest = {
        manifestVersion: 1,
        forgeVersion: options.forgeVersion,
        worktreesPath: worktreesPathForManifest,
        initializedAt: options.previous?.initializedAt ?? now,
        updatedAt: now,
        managedPaths: [...DEFAULT_MANAGED_PATHS]
    };
    writeManifest(repoRoot, manifest);
    copied.push('.cursor/forge/manifest.json');

    // Ensure tmp dir exists for sessions
    fs.mkdirSync(path.join(cursorRoot, '.tmp'), { recursive: true });

    return {
        copiedFiles: copied.length,
        managedPaths: manifest.managedPaths,
        manifest
    };
}
