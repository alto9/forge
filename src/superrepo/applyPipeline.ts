import * as path from 'path';
import { applySubmodules } from '../git/applySubmodules';
import type { SubmoduleEntry } from '../git/types';
import { installHarness } from '../harness/installHarness';
import { readManifest } from '../harness/manifest';
import { ensureWorktreesConfig } from '../worktrees/ensureWorktrees';

export type PipelineStage = 'submodules' | 'worktrees' | 'configuration' | 'harness';

export interface PipelineProgress {
    stage: PipelineStage;
    status: 'running' | 'done' | 'error';
    message: string;
}

export interface ApplyPipelineInput {
    repoRoot: string;
    extensionPath: string;
    forgeVersion: string;
    submodules: SubmoduleEntry[];
    worktreesPath: string;
    onProgress?: (progress: PipelineProgress) => void;
}

export interface ApplyPipelineResult {
    ok: boolean;
    completedStages: PipelineStage[];
    failedStage?: PipelineStage;
    error?: string;
    details: string[];
}

async function stage(
    name: PipelineStage,
    result: ApplyPipelineResult,
    onProgress: ApplyPipelineInput['onProgress'],
    fn: () => Promise<string[]> | string[]
): Promise<boolean> {
    onProgress?.({ stage: name, status: 'running', message: `Starting ${name}…` });
    try {
        const messages = await fn();
        result.details.push(...messages);
        result.completedStages.push(name);
        onProgress?.({ stage: name, status: 'done', message: `${name} complete` });
        return true;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        result.ok = false;
        result.failedStage = name;
        result.error = message;
        onProgress?.({ stage: name, status: 'error', message });
        return false;
    }
}

/**
 * Run Initialize Superrepo stages in order. Stops on first failure.
 */
export async function runApplyPipeline(input: ApplyPipelineInput): Promise<ApplyPipelineResult> {
    const result: ApplyPipelineResult = {
        ok: true,
        completedStages: [],
        details: []
    };

    const { onProgress } = input;

    const okSubs = await stage('submodules', result, onProgress, async () => {
        const applyResult = await applySubmodules(input.repoRoot, input.submodules);
        return [
            `added=${applyResult.added.length}`,
            `updated=${applyResult.updated.length}`,
            `removed=${applyResult.removed.length}`,
            ...applyResult.messages
        ];
    });
    if (!okSubs) {
        return result;
    }

    let resolvedWorktrees = input.worktreesPath;
    const okWt = await stage('worktrees', result, onProgress, () => {
        const ensured = ensureWorktreesConfig(input.repoRoot, input.worktreesPath);
        resolvedWorktrees = ensured.worktreesPath;
        return [
            `worktreesPath=${ensured.worktreesPath}`,
            `gitignoreUpdated=${ensured.gitignoreUpdated}`
        ];
    });
    if (!okWt) {
        return result;
    }

    const okCfg = await stage('configuration', result, onProgress, () => {
        // Manifest is written in harness stage; configuration stage records paths + forge metadata dir.
        const forgeDir = path.join(input.repoRoot, '.cursor', 'forge');
        const previous = readManifest(input.repoRoot);
        return [
            `repoRoot=${input.repoRoot}`,
            `forgeDir=${forgeDir}`,
            `previousManifest=${previous ? previous.forgeVersion : 'none'}`,
            `worktreesPath=${resolvedWorktrees}`
        ];
    });
    if (!okCfg) {
        return result;
    }

    await stage('harness', result, onProgress, () => {
        const previous = readManifest(input.repoRoot);
        const installed = installHarness(input.repoRoot, input.extensionPath, {
            forgeVersion: input.forgeVersion,
            worktreesPath: resolvedWorktrees,
            previous
        });
        return [
            `copiedFiles=${installed.copiedFiles}`,
            `forgeVersion=${installed.manifest.forgeVersion}`,
            ...installed.managedPaths.map((p) => `managed:${p}`)
        ];
    });

    return result;
}
