import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadWorkflowDefinition } from './loadWorkflowDefinition';
import { resolvePendingHumanQuestions } from './resolvePendingHumanQuestions';
import type { WorkflowRunProjection } from '../temporal/workflowRunProjection';

const tempDirs: string[] = [];

function createTempWorkspace(): string {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-pending-questions-'));
    tempDirs.push(workspaceRoot);
    return workspaceRoot;
}

function createRefineSession(workspaceRoot: string): string {
    const sessionDir = path.join(workspaceRoot, '.cursor', '.tmp', 'refine-forge-61');
    fs.mkdirSync(sessionDir, { recursive: true });
    fs.copyFileSync(
        path.join(process.cwd(), 'src/workflows/__fixtures__/sample-user_questions.md'),
        path.join(sessionDir, 'user_questions.md')
    );
    fs.writeFileSync(path.join(sessionDir, 'refinement.md'), '# Refinement\n');
    return sessionDir;
}

function baseProjection(
    overrides: Partial<WorkflowRunProjection> = {}
): WorkflowRunProjection {
    return {
        namespace: 'forge-local',
        workflowId: 'wf-1',
        runId: 'run-1',
        taskQueue: 'forge-workflows',
        workflow_id: 'refine-issue',
        repositoryRoot: '/repo',
        mode: 'managedLocal',
        recoveryState: 'synced',
        lastSyncedAt: '2026-06-10T00:00:00.000Z',
        terminal: false,
        temporalStatus: 'RUNNING',
        completedNodeIds: [],
        skippedNodeIds: [],
        cancelled: false,
        validationSummaries: [],
        pendingHumanQuestions: [],
        ...overrides,
    };
}

afterEach(() => {
    while (tempDirs.length > 0) {
        const tempDir = tempDirs.pop();
        if (tempDir) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
});

describe('resolvePendingHumanQuestions', () => {
    it('returns single_text fallback when no artifact prompts resolve', () => {
        const definition = loadWorkflowDefinition(process.cwd(), 'refine-issue');
        expect(definition).toBeDefined();

        const projection = baseProjection({
            repositoryRoot: createTempWorkspace(),
            waitingNodeId: 'user_verification_batch',
        });

        const pending = resolvePendingHumanQuestions(
            definition!,
            projection,
            projection.repositoryRoot
        );

        expect(pending).toHaveLength(1);
        expect(pending[0]?.input_mode).toBe('single_text');
        expect(pending[0]?.prompts[0]?.label).toContain('Collect tier-User answers');
    });

    it('parses markdown_batch prompts from user_questions.md with blockers first and max five items', () => {
        const workspaceRoot = createTempWorkspace();
        createRefineSession(workspaceRoot);
        const definition = loadWorkflowDefinition(process.cwd(), 'refine-issue');
        expect(definition).toBeDefined();

        const projection = baseProjection({
            repositoryRoot: workspaceRoot,
            waitingNodeId: 'user_verification_batch',
        });

        const pending = resolvePendingHumanQuestions(definition!, projection, workspaceRoot);

        expect(pending).toHaveLength(1);
        expect(pending[0]?.batch_policy).toEqual({
            max_per_submit: 5,
            blockers_first: true,
        });
        expect(pending[0]?.prompts).toHaveLength(5);
        expect(pending[0]?.prompts[0]?.blocker).toBe(true);
        expect(pending[0]?.prompts[1]?.blocker).toBe(true);
        expect(pending[0]?.artifact_targets?.some((target) => target.artifact_id === 'refinement')).toBe(
            true
        );
    });

    it('returns empty pending questions when recovery is blocked', () => {
        const definition = loadWorkflowDefinition(process.cwd(), 'refine-issue');
        expect(definition).toBeDefined();

        const projection = baseProjection({
            recoveryState: 'refresh_failed',
            waitingNodeId: 'user_verification_batch',
        });

        expect(
            resolvePendingHumanQuestions(definition!, projection, projection.repositoryRoot)
        ).toEqual([]);
    });

    it('returns empty pending questions for stale waitingNodeId on non-human_question nodes', () => {
        const definition = loadWorkflowDefinition(process.cwd(), 'refine-issue');
        expect(definition).toBeDefined();

        const projection = baseProjection({
            waitingNodeId: 'check_user_blockers',
        });

        expect(
            resolvePendingHumanQuestions(definition!, projection, projection.repositoryRoot)
        ).toEqual([]);
    });
});
