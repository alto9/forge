import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { orchestrateHumanAnswerSubmit } from './humanAnswerOrchestration';
import { HumanAnswerSubmitError, type HumanAnswerSubmitClient } from './humanAnswerSubmit';
import type { PendingHumanQuestion, WorkflowRunProjection } from './workflowRunProjection';
import type { WorkflowRunIndexEntry } from './workflowRunIndex';

const tempDirs: string[] = [];

function createTempWorkspace(): string {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-human-answer-orch-'));
    tempDirs.push(workspaceRoot);
    return workspaceRoot;
}

function createEntry(repositoryRoot: string): WorkflowRunIndexEntry {
    return {
        namespace: 'forge-local',
        workflowId: 'wf-1',
        runId: 'run-1',
        taskQueue: 'forge-workflows',
        workflow_id: 'refine-issue',
        repositoryRoot,
        mode: 'managedLocal',
        startedAt: '2026-06-01T00:00:00.000Z',
        recoveryState: 'synced',
        terminal: false,
    };
}

function createPendingQuestion(refinementPath: string): PendingHumanQuestion {
    return {
        question_id: 'user_verification_batch',
        node_id: 'user_verification_batch',
        node_name: 'User verification (Phase C)',
        title: 'User verification (Phase C)',
        input_mode: 'markdown_batch',
        prompts: [
            { field_id: 'q1', label: 'Should authentication use SSO only?', required: true },
        ],
        artifact_targets: [{ artifact_id: 'refinement', path: refinementPath }],
    };
}

function createProjection(repositoryRoot: string): WorkflowRunProjection {
    const pendingQuestion = createPendingQuestion('.cursor/.tmp/refine-forge-61/refinement.md');
    return {
        namespace: 'forge-local',
        workflowId: 'wf-1',
        runId: 'run-1',
        taskQueue: 'forge-workflows',
        workflow_id: 'refine-issue',
        repositoryRoot,
        mode: 'managedLocal',
        recoveryState: 'synced',
        lastSyncedAt: '2026-06-10T00:00:00.000Z',
        terminal: false,
        temporalStatus: 'RUNNING',
        completedNodeIds: [],
        skippedNodeIds: [],
        cancelled: false,
        waitingNodeId: 'user_verification_batch',
        validationSummaries: [],
        pendingHumanQuestions: [pendingQuestion],
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

describe('humanAnswerOrchestration', () => {
    it('writes refinement answers before sending the Temporal update', async () => {
        const workspaceRoot = createTempWorkspace();
        const sessionDir = path.join(workspaceRoot, '.cursor', '.tmp', 'refine-forge-61');
        fs.mkdirSync(sessionDir, { recursive: true });
        const refinementRelativePath = '.cursor/.tmp/refine-forge-61/refinement.md';
        const executeUpdate = vi.fn(async () => undefined);
        const client: HumanAnswerSubmitClient = { executeUpdate };

        await orchestrateHumanAnswerSubmit({
            entry: createEntry(workspaceRoot),
            projection: createProjection(workspaceRoot),
            pendingQuestion: createPendingQuestion(refinementRelativePath),
            answers: { q1: 'Yes, SSO only.' },
            client,
            submittedAt: '2026-06-10T12:00:00.000Z',
        });

        const refinement = fs.readFileSync(path.join(workspaceRoot, refinementRelativePath), 'utf8');
        expect(refinement).toContain('## Answered decisions');
        expect(refinement).toContain('### q1');
        expect(refinement).toContain('Yes, SSO only.');
        expect(executeUpdate).toHaveBeenCalledOnce();
    });

    it('preserves drafts when Temporal rejects the update', async () => {
        const workspaceRoot = createTempWorkspace();
        const sessionDir = path.join(workspaceRoot, '.cursor', '.tmp', 'refine-forge-61');
        fs.mkdirSync(sessionDir, { recursive: true });
        const refinementRelativePath = '.cursor/.tmp/refine-forge-61/refinement.md';
        const draftStore = new Map<string, string>();
        const workspaceState = {
            get: (key: string) => draftStore.get(key),
            update: async (key: string, value: string | undefined) => {
                if (value === undefined) {
                    draftStore.delete(key);
                } else {
                    draftStore.set(key, value);
                }
            },
        };
        draftStore.set(
            'forge.workflow.humanAnswerDraft.forge-local:wf-1:run-1.user_verification_batch',
            '{"q1":"draft"}'
        );

        const client: HumanAnswerSubmitClient = {
            executeUpdate: vi.fn(async () => {
                throw new HumanAnswerSubmitError('The submitted answers were rejected by the workflow.');
            }),
        };

        await expect(
            orchestrateHumanAnswerSubmit({
                entry: createEntry(workspaceRoot),
                projection: createProjection(workspaceRoot),
                pendingQuestion: createPendingQuestion(refinementRelativePath),
                answers: { q1: 'Yes, SSO only.' },
                client,
                workspaceState: workspaceState as never,
            })
        ).rejects.toThrow(HumanAnswerSubmitError);

        expect(
            draftStore.get(
                'forge.workflow.humanAnswerDraft.forge-local:wf-1:run-1.user_verification_batch'
            )
        ).toBe('{"q1":"draft"}');
    });

    it('blocks submit when recoveryState is not synced', async () => {
        const workspaceRoot = createTempWorkspace();
        const client: HumanAnswerSubmitClient = { executeUpdate: vi.fn(async () => undefined) };
        const entry = createEntry(workspaceRoot);
        entry.recoveryState = 'refresh_failed';

        await expect(
            orchestrateHumanAnswerSubmit({
                entry,
                projection: createProjection(workspaceRoot),
                pendingQuestion: createPendingQuestion('.cursor/.tmp/refine-forge-61/refinement.md'),
                answers: { q1: 'yes' },
                client,
            })
        ).rejects.toThrow(HumanAnswerSubmitError);
    });
});
