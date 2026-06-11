import type { Diagnostic } from '../workflows/types';
import type { StartWorkflowRunOutcome } from './startWorkflowRun';
import {
    RunIndexDuplicateKeyError,
    WorkflowRunIndexStore,
    buildRunIndexKey,
} from './workflowRunIndex';
import { notifyWorkflowRunIndexChanged } from './workflowRunRecoveryService';

export const WORKFLOW_RUN_INDEX_VALIDATOR_ID = 'forge.workflow.run_index';

export interface PersistAcceptedWorkflowRunInput {
    workflow_id: string;
    startOutcome: Extract<StartWorkflowRunOutcome, { ok: true }>;
    indexStore: WorkflowRunIndexStore;
    log?: (line: string) => void;
}

export type PersistAcceptedWorkflowRunOutcome =
    | { ok: true; indexKey: string }
    | { ok: false; diagnostics: Diagnostic[] };

function buildPostStartIndexLogLine(input: {
    workflow_id: string;
    namespace: string;
    workflowId: string;
    runId: string;
    taskQueue: string;
    code: string;
    message: string;
}): string {
    return [
        '[forge.workflow.run_index]',
        `code=${input.code}`,
        `workflow_id=${input.workflow_id}`,
        `namespace=${input.namespace}`,
        `workflowId=${input.workflowId}`,
        `runId=${input.runId}`,
        `taskQueue=${input.taskQueue}`,
        `message=${input.message}`,
    ].join(' ');
}

function buildDuplicateKeyDiagnostic(): Diagnostic {
    return {
        code: 'forge.workflow.run_index.duplicate_key',
        severity: 'error',
        path: 'forge.workflow.run_index',
        message:
            'Workflow run started in Temporal, but this run is already indexed. Local list, graph, cancel, and recovery actions use the existing entry.',
        validator_id: WORKFLOW_RUN_INDEX_VALIDATOR_ID,
    };
}

function buildWriteFailedDiagnostic(): Diagnostic {
    return {
        code: 'forge.workflow.run_index.write_failed',
        severity: 'error',
        path: 'forge.workflow.run_index',
        message:
            'Workflow run started in Temporal, but Forge could not save the local run index. List, graph, cancel, and recovery actions are unavailable until the run is indexed.',
        validator_id: WORKFLOW_RUN_INDEX_VALIDATOR_ID,
    };
}

export function persistAcceptedWorkflowRun(
    input: PersistAcceptedWorkflowRunInput
): PersistAcceptedWorkflowRunOutcome {
    const startOutcome = input.startOutcome;

    try {
        const entry = input.indexStore.appendRunStartEntry({
            namespace: startOutcome.namespace,
            workflowId: startOutcome.workflowId,
            runId: startOutcome.runId,
            taskQueue: startOutcome.taskQueue,
            workflow_id: input.workflow_id,
            repositoryRoot: startOutcome.repositoryRoot,
            mode: startOutcome.mode,
            startedAt: startOutcome.startedAt,
            ...(startOutcome.startInputSummary
                ? { startInputSummary: startOutcome.startInputSummary }
                : {}),
        });

        notifyWorkflowRunIndexChanged();

        return {
            ok: true,
            indexKey: buildRunIndexKey(entry.namespace, entry.workflowId, entry.runId),
        };
    } catch (error) {
        if (error instanceof RunIndexDuplicateKeyError) {
            const diagnostic = buildDuplicateKeyDiagnostic();
            input.log?.(
                buildPostStartIndexLogLine({
                    workflow_id: input.workflow_id,
                    namespace: startOutcome.namespace,
                    workflowId: startOutcome.workflowId,
                    runId: startOutcome.runId,
                    taskQueue: startOutcome.taskQueue,
                    code: diagnostic.code,
                    message: diagnostic.message,
                })
            );
            return { ok: false, diagnostics: [diagnostic] };
        }

        const diagnostic = buildWriteFailedDiagnostic();
        input.log?.(
            buildPostStartIndexLogLine({
                workflow_id: input.workflow_id,
                namespace: startOutcome.namespace,
                workflowId: startOutcome.workflowId,
                runId: startOutcome.runId,
                taskQueue: startOutcome.taskQueue,
                code: diagnostic.code,
                message: diagnostic.message,
            })
        );
        return { ok: false, diagnostics: [diagnostic] };
    }
}
