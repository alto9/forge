import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { readSubmodules, writeSubmodulesFile } from './gitmodules';
import type { SubmoduleEntry } from './types';

export interface ApplySubmodulesResult {
    added: string[];
    updated: string[];
    removed: string[];
    messages: string[];
}

function runGit(cwd: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
        const child = spawn('git', args, { cwd, env: process.env });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (chunk: Buffer) => {
            stdout += chunk.toString();
        });
        child.stderr.on('data', (chunk: Buffer) => {
            stderr += chunk.toString();
        });
        child.on('close', (code) => {
            resolve({ code: code ?? 1, stdout, stderr });
        });
        child.on('error', (err) => {
            resolve({ code: 1, stdout, stderr: String(err) });
        });
    });
}

function keyOf(entry: SubmoduleEntry): string {
    return entry.path.replace(/\\/g, '/');
}

/**
 * Apply desired submodule set: add new paths, update url/branch in .gitmodules,
 * remove entries that disappeared. Then sync/init/update.
 */
export async function applySubmodules(
    repoRoot: string,
    desired: SubmoduleEntry[]
): Promise<ApplySubmodulesResult> {
    const result: ApplySubmodulesResult = {
        added: [],
        updated: [],
        removed: [],
        messages: []
    };

    const existing = readSubmodules(repoRoot);
    const existingByPath = new Map(existing.map((e) => [keyOf(e), e]));
    const desiredByPath = new Map(desired.map((e) => [keyOf(e), e]));

    // Remove submodule entries no longer desired (best-effort deinit + gitmodules rewrite).
    for (const [p, entry] of existingByPath) {
        if (desiredByPath.has(p)) {
            continue;
        }
        const abs = path.join(repoRoot, entry.path);
        const deinit = await runGit(repoRoot, ['submodule', 'deinit', '-f', '--', entry.path]);
        result.messages.push(`deinit ${entry.path}: ${deinit.stderr || deinit.stdout || 'ok'}`);
        if (fs.existsSync(abs)) {
            fs.rmSync(abs, { recursive: true, force: true });
        }
        await runGit(repoRoot, ['rm', '-f', '--cached', entry.path]);
        result.removed.push(entry.path);
    }

    // Write canonical .gitmodules for the desired set (before add for new ones that need file).
    const normalized = desired.map((e) => ({
        name: e.name || path.basename(e.path),
        path: e.path.replace(/\\/g, '/'),
        url: e.url.trim(),
        branch: e.branch?.trim() || 'main'
    }));

    // Add brand-new submodules via git submodule add when path not present.
    for (const entry of normalized) {
        const prev = existingByPath.get(keyOf(entry));
        const abs = path.join(repoRoot, entry.path);
        const pathExists = fs.existsSync(abs);

        if (!prev && !pathExists) {
            const parent = path.dirname(abs);
            fs.mkdirSync(parent, { recursive: true });
            const addArgs = [
                'submodule',
                'add',
                '-b',
                entry.branch,
                '--name',
                entry.name,
                entry.url,
                entry.path
            ];
            const add = await runGit(repoRoot, addArgs);
            if (add.code !== 0) {
                throw new Error(
                    `git submodule add failed for ${entry.path}: ${add.stderr || add.stdout}`
                );
            }
            result.added.push(entry.path);
            result.messages.push(`added ${entry.path}`);
        } else if (prev && (prev.url !== entry.url || prev.branch !== entry.branch || prev.name !== entry.name)) {
            result.updated.push(entry.path);
            result.messages.push(`updated metadata for ${entry.path}`);
        } else if (!prev && pathExists) {
            result.updated.push(entry.path);
            result.messages.push(`registered existing path ${entry.path}`);
        }
    }

    // Rewrite .gitmodules to desired final state (ensures branch/url/name consistency).
    writeSubmodulesFile(repoRoot, normalized);

    const sync = await runGit(repoRoot, ['submodule', 'sync', '--recursive']);
    result.messages.push(`sync: ${sync.stderr || sync.stdout || 'ok'}`);

    const update = await runGit(repoRoot, [
        'submodule',
        'update',
        '--init',
        '--recursive'
    ]);
    if (update.code !== 0) {
        throw new Error(
            `git submodule update --init failed: ${update.stderr || update.stdout}`
        );
    }
    result.messages.push(`update: ${update.stderr || update.stdout || 'ok'}`);

    return result;
}
