import fs from 'fs';
import path from 'path';
import type { WorkflowExecutionDescription } from '@temporalio/client';
import type { TemporalMode } from './temporalSettings';
import type { RecoveryState, WorkflowRunIndexEntry } from './workflowRunIndex';

export type WorkflowExecutionStatusName =
    | 'UNSPECIFIED'
    | 'RUNNING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED'
    | 'TERMINATED'
    | 'CONTINUED_AS_NEW'
    | 'TIMED_OUT'
    | 'PAUSED'
    | 'UNKNOWN';

export interface PendingHumanQuestion {
    question_id: string;
    node_id: string;
    node_name: string;
}

export interface WorkflowRunProjection {
    namespace: string;
    workflowId: string;
    runId: string;
    taskQueue: string;
    workflow_id: string;
    repositoryRoot: string;
    mode: TemporalMode;
    recoveryState: RecoveryState;
    lastSyncedAt: string;
    terminal: boolean;
    temporalStatus: WorkflowExecutionStatusName;
    completedNodeIds: string[];
    skippedNodeIds: string[];
    cancelled: boolean;
    validationSummaries: [];
    pendingHumanQuestions: PendingHumanQuestion[];
}

const TERMINAL_TEMPORAL_STATUSES = new Set<WorkflowExecutionStatusName>([
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'TERMINATED',
    'TIMED_OUT',
]);

export function resolveProjectionPath(
    globalStoragePath: string,
    windowId: string,
    indexKey: string
): string {
    const safeKey = indexKey.replace(/:/g, '__');
    return path.join(globalStoragePath, 'temporal', windowId, 'projections', `${safeKey}.json`);
}

function atomicWriteFile(filePath: string, content: string): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tempPath, content, 'utf8');
    fs.renameSync(tempPath, filePath);
}

export function readWorkflowRunProjection(projectionPath: string): WorkflowRunProjection | undefined {
    if (!fs.existsSync(projectionPath)) {
        return undefined;
    }

    try {
        return JSON.parse(fs.readFileSync(projectionPath, 'utf8')) as WorkflowRunProjection;
    } catch {
        return undefined;
    }
}

export function writeWorkflowRunProjection(
    projectionPath: string,
    projection: WorkflowRunProjection
): void {
    atomicWriteFile(projectionPath, `${JSON.stringify(projection, null, 2)}\n`);
}

export function isTerminalTemporalStatus(status: WorkflowExecutionStatusName): boolean {
    return TERMINAL_TEMPORAL_STATUSES.has(status);
}

export function buildProjectionFromTemporalDescribe(
    entry: WorkflowRunIndexEntry,
    description: WorkflowExecutionDescription,
    recoveryState: RecoveryState,
    syncedAt: string = new Date().toISOString()
): WorkflowRunProjection {
    const temporalStatus = description.status.name;
    const terminal = isTerminalTemporalStatus(temporalStatus);

    return {
        namespace: entry.namespace,
        workflowId: entry.workflowId,
        runId: entry.runId,
        taskQueue: entry.taskQueue,
        workflow_id: entry.workflow_id,
        repositoryRoot: entry.repositoryRoot,
        mode: entry.mode,
        recoveryState,
        lastSyncedAt: syncedAt,
        terminal,
        temporalStatus,
        completedNodeIds: [],
        skippedNodeIds: [],
        cancelled: temporalStatus === 'CANCELLED',
        validationSummaries: [],
        pendingHumanQuestions: [],
    };
}
