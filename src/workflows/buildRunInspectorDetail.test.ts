import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import type { ActivityEnvelopeSummary } from '../temporal/workflowRunProjection';
import type { WorkflowRunProjection } from '../temporal/workflowRunProjection';
import { buildRunInspectorDetail } from './buildRunInspectorDetail';
import type { WorkflowDefinition } from './types';

const tempDirs: string[] = [];

afterEach(() => {
    while (tempDirs.length > 0) {
        const tempDir = tempDirs.pop();
        if (tempDir) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
});

function createRepositoryRoot(): string {
    const repositoryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-inspector-'));
    tempDirs.push(repositoryRoot);
    return repositoryRoot;
}

function baseDefinition(overrides: Partial<WorkflowDefinition> = {}): WorkflowDefinition {
    return {
        schema_version: '1.0.0',
        workflow_id: 'inspector-test',
        name: 'Inspector Test',
        version: '1.0.0',
        entry_node_id: 'activity_a',
        nodes: [
            {
                node_id: 'activity_a',
                type: 'activity',
                name: 'Activity A',
                artifact_ids: ['output'],
                transitions: [{ to_node_id: 'validate_a' }],
            },
            {
                node_id: 'validate_a',
                type: 'validation',
                name: 'Validate A',
                transitions: [{ to_node_id: 'question_a' }],
            },
            {
                node_id: 'question_a',
                type: 'human_question',
                name: 'Question A',
                question_id: 'confirm',
                transitions: [{ to_node_id: 'retry_activity' }],
            },
            {
                node_id: 'retry_activity',
                type: 'activity',
                name: 'Retry activity',
                transitions: [{ to_node_id: 'done' }],
            },
            {
                node_id: 'done',
                type: 'terminal',
                name: 'Done',
            },
        ],
        artifacts: [
            {
                artifact_id: 'output',
                path: 'artifacts/output.md',
            },
            {
                artifact_id: 'reports',
                path: '.cursor/.tmp/refine-*/report.md',
            },
        ],
        ...overrides,
    };
}

function baseProjection(
    repositoryRoot: string,
    overrides: Partial<WorkflowRunProjection> = {}
): WorkflowRunProjection {
    return {
        namespace: 'forge-local',
        workflowId: 'inspector-run',
        runId: 'run-1',
        taskQueue: 'forge-workflows',
        workflow_id: 'inspector-test',
        repositoryRoot,
        mode: 'managedLocal',
        recoveryState: 'synced',
        lastSyncedAt: '2026-06-10T12:00:00.000Z',
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

function activitySummary(
    overrides: Partial<ActivityEnvelopeSummary> = {}
): ActivityEnvelopeSummary {
    return {
        node_id: 'activity_a',
        activity_id: 'forge.test.activity',
        cursor_agent_id: 'agent-1',
        cursor_run_id: 'cursor-run-1',
        status: 'finished',
        retryable: false,
        output_type: 'markdown',
        ...overrides,
    };
}

describe('buildRunInspectorDetail', () => {
    it('returns empty_state when no node is selected', () => {
        const detail = buildRunInspectorDetail(baseDefinition(), undefined, null, '/tmp/repo');

        expect(detail.selected_node_id).toBeNull();
        expect(detail.empty_state).toBe(
            'Select a step to inspect activity output, validation, and artifacts.'
        );
    });

    it('builds definition-only detail without activity, validation, or recovery actions', () => {
        const detail = buildRunInspectorDetail(
            baseDefinition(),
            undefined,
            'activity_a',
            '/tmp/repo'
        );

        expect(detail.mode).toBe('definition');
        expect(detail.summary).toEqual({
            node_id: 'activity_a',
            type: 'activity',
            name: 'Activity A',
            status_label: 'Pending',
        });
        expect(detail.activity).toBeUndefined();
        expect(detail.validation).toBeUndefined();
        expect(detail.recovery_actions).toBeUndefined();
    });

    it('maps activity success summary and artifact preview for run mode', () => {
        const repositoryRoot = createRepositoryRoot();
        const artifactPath = path.join(repositoryRoot, 'artifacts');
        fs.mkdirSync(artifactPath, { recursive: true });
        fs.writeFileSync(path.join(artifactPath, 'output.md'), '# Hello\n', 'utf8');

        const projection = baseProjection(repositoryRoot, {
            completedNodeIds: ['activity_a'],
            activitySummaries: [activitySummary()],
        });

        const detail = buildRunInspectorDetail(
            baseDefinition(),
            projection,
            'activity_a',
            repositoryRoot
        );

        expect(detail.mode).toBe('run');
        expect(detail.activity).toMatchObject({
            activity_id: 'forge.test.activity',
            cursor_run_id: 'cursor-run-1',
            status: 'finished',
            output_type: 'markdown',
        });
        expect(detail.artifacts?.[0]).toMatchObject({
            artifact_id: 'output',
            path: 'artifacts/output.md',
            preview_mode: 'inline',
            preview_text: '# Hello\n',
        });
    });

    it('maps activity failure diagnostics with redaction', () => {
        const repositoryRoot = createRepositoryRoot();
        const projection = baseProjection(repositoryRoot, {
            failedNodeId: 'activity_a',
            activitySummaries: [
                activitySummary({
                    status: 'error',
                    failure_class: 'execution',
                    retryable: true,
                    diagnostics: [
                        {
                            code: 'sdk.execution',
                            severity: 'error',
                            message: 'Authorization: Bearer leaked-token',
                        },
                    ],
                }),
            ],
        });

        const detail = buildRunInspectorDetail(
            baseDefinition(),
            projection,
            'activity_a',
            repositoryRoot
        );

        expect(detail.activity?.status).toBe('error');
        expect(detail.activity?.failure_class).toBe('execution');
        expect(detail.activity?.diagnostics?.[0]?.message).toBe('authorization: [redacted]');
    });

    it('maps validation pass and fail summaries', () => {
        const repositoryRoot = createRepositoryRoot();
        const projection = baseProjection(repositoryRoot, {
            completedNodeIds: ['activity_a'],
            validationSummaries: [
                {
                    node_id: 'validate_a',
                    node_name: 'Validate A',
                    valid: false,
                    validated_at: '2026-06-10T12:00:00.000Z',
                    source_activity_node_id: 'activity_a',
                    validator_outcomes: [
                        {
                            validator_id: 'forge.artifact.exists',
                            type: 'artifact',
                            target: 'output',
                            passed: false,
                            blocking: true,
                        },
                    ],
                    diagnostics: [
                        {
                            code: 'forge.artifact.missing',
                            severity: 'error',
                            message: 'artifact output not found',
                            validator_id: 'forge.artifact.exists',
                            path: 'artifacts/output.md',
                        },
                    ],
                },
            ],
            failedNodeId: 'validate_a',
        });

        const validationNodeDetail = buildRunInspectorDetail(
            baseDefinition(),
            projection,
            'validate_a',
            repositoryRoot
        );
        expect(validationNodeDetail.validation?.valid).toBe(false);
        expect(validationNodeDetail.validation?.validator_outcomes).toHaveLength(1);

        const activityNodeDetail = buildRunInspectorDetail(
            baseDefinition(),
            projection,
            'activity_a',
            repositoryRoot
        );
        expect(activityNodeDetail.validation?.valid).toBe(false);
    });

    it('derives retry block from projection.retrying and failed retry history', () => {
        const repositoryRoot = createRepositoryRoot();
        const retryingProjection = baseProjection(repositoryRoot, {
            activeNodeId: 'retry_activity',
            retrying: {
                node_id: 'retry_activity',
                attempt: 2,
                max: 3,
            },
        });

        const retryingDetail = buildRunInspectorDetail(
            baseDefinition(),
            retryingProjection,
            'retry_activity',
            repositoryRoot
        );
        expect(retryingDetail.retry).toEqual({ attempt: 2, max: 3, in_progress: true });

        const failedProjection = baseProjection(repositoryRoot, {
            failedNodeId: 'retry_activity',
            activitySummaries: [
                activitySummary({
                    node_id: 'retry_activity',
                    status: 'error',
                    failure_class: 'execution',
                    retryable: true,
                }),
            ],
        });

        const failedDetail = buildRunInspectorDetail(
            baseDefinition(),
            failedProjection,
            'retry_activity',
            repositoryRoot
        );
        expect(failedDetail.retry).toBeUndefined();
    });

    it('truncates artifact previews larger than 32 KiB', () => {
        const repositoryRoot = createRepositoryRoot();
        const artifactPath = path.join(repositoryRoot, 'artifacts');
        fs.mkdirSync(artifactPath, { recursive: true });
        fs.writeFileSync(path.join(artifactPath, 'output.md'), 'a'.repeat(33 * 1024), 'utf8');

        const projection = baseProjection(repositoryRoot, {
            activitySummaries: [activitySummary()],
        });

        const detail = buildRunInspectorDetail(
            baseDefinition(),
            projection,
            'activity_a',
            repositoryRoot
        );

        expect(detail.artifacts?.[0]?.preview_mode).toBe('truncated');
        expect(detail.artifacts?.[0]?.truncated).toBe(true);
        expect(detail.artifacts?.[0]?.preview_text?.length).toBe(32 * 1024);
    });

    it('returns metadata_only previews for binary artifacts', () => {
        const repositoryRoot = createRepositoryRoot();
        const artifactPath = path.join(repositoryRoot, 'artifacts');
        fs.mkdirSync(artifactPath, { recursive: true });
        fs.writeFileSync(path.join(artifactPath, 'output.md'), Buffer.from([0, 1, 2, 3]));

        const projection = baseProjection(repositoryRoot, {
            activitySummaries: [activitySummary()],
        });

        const detail = buildRunInspectorDetail(
            baseDefinition(),
            projection,
            'activity_a',
            repositoryRoot
        );

        expect(detail.artifacts?.[0]?.preview_mode).toBe('metadata_only');
        expect(detail.artifacts?.[0]?.preview_text).toBeUndefined();
    });

    it('builds glob_list previews with overflow count', () => {
        const repositoryRoot = createRepositoryRoot();
        const tmpRoot = path.join(repositoryRoot, '.cursor', '.tmp');
        for (let index = 0; index < 22; index += 1) {
            const sessionDir = path.join(tmpRoot, `refine-${index}`);
            fs.mkdirSync(sessionDir, { recursive: true });
            fs.writeFileSync(path.join(sessionDir, 'report.md'), `# ${index}\n`, 'utf8');
        }

        const definition = baseDefinition({
            nodes: [
                {
                    node_id: 'activity_a',
                    type: 'activity',
                    name: 'Activity A',
                    artifact_ids: ['reports'],
                    transitions: [{ to_node_id: 'done' }],
                },
                {
                    node_id: 'done',
                    type: 'terminal',
                    name: 'Done',
                },
            ],
        });

        const projection = baseProjection(repositoryRoot, {
            activitySummaries: [activitySummary()],
        });

        const detail = buildRunInspectorDetail(definition, projection, 'activity_a', repositoryRoot);

        expect(detail.artifacts?.[0]?.preview_mode).toBe('glob_list');
        expect(detail.artifacts?.[0]?.glob_matches).toHaveLength(20);
        expect(detail.artifacts?.[0]?.overflow_count).toBe(2);
    });

    it('gates recovery actions when recoveryState is not synced', () => {
        const repositoryRoot = createRepositoryRoot();
        const projection = baseProjection(repositoryRoot, {
            recoveryState: 'recovery_pending',
            waitingNodeId: 'question_a',
            activitySummaries: [activitySummary()],
        });

        const detail = buildRunInspectorDetail(
            baseDefinition(),
            projection,
            'question_a',
            repositoryRoot
        );

        const cancelAction = detail.recovery_actions?.find((action) => action.action_id === 'cancel_run');
        const refreshAction = detail.recovery_actions?.find((action) => action.action_id === 'refresh');
        const questionAction = detail.recovery_actions?.find(
            (action) => action.action_id === 'open_question_panel'
        );

        expect(cancelAction?.enabled).toBe(false);
        expect(cancelAction?.disabled_reason).toBe(
            'Run actions are unavailable until recovery finishes.'
        );
        expect(refreshAction?.enabled).toBe(true);
        expect(questionAction?.enabled).toBe(false);
    });

    it('enables open_question_panel for waiting human_question nodes when synced', () => {
        const repositoryRoot = createRepositoryRoot();
        const projection = baseProjection(repositoryRoot, {
            waitingNodeId: 'question_a',
        });

        const detail = buildRunInspectorDetail(
            baseDefinition(),
            projection,
            'question_a',
            repositoryRoot
        );

        const questionAction = detail.recovery_actions?.find(
            (action) => action.action_id === 'open_question_panel'
        );
        expect(questionAction?.enabled).toBe(true);
    });

    it('redacts sensitive strings in artifact preview text', () => {
        const repositoryRoot = createRepositoryRoot();
        const artifactPath = path.join(repositoryRoot, 'artifacts');
        fs.mkdirSync(artifactPath, { recursive: true });
        fs.writeFileSync(
            path.join(artifactPath, 'output.md'),
            'CURSOR_API_KEY=super-secret-value\n',
            'utf8'
        );

        const projection = baseProjection(repositoryRoot, {
            activitySummaries: [activitySummary()],
        });

        const detail = buildRunInspectorDetail(
            baseDefinition(),
            projection,
            'activity_a',
            repositoryRoot
        );

        expect(detail.artifacts?.[0]?.preview_text).toBe('CURSOR_API_KEY=[REDACTED]\n');
    });
});
