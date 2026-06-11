import { randomUUID } from 'crypto';
import { buildStartInputSummary } from '../workflows/buildStartInputSummary';
import { parseRunInputsFromRecord } from '../workflows/parseRunInputs';
import {
    normalizeSubmittedRunInputs,
    validateSubmittedRunInputs,
    WORKFLOW_RUN_INPUT_VALIDATOR_ID,
} from '../workflows/validateSubmittedRunInputs';
import { validateWorkflowForRun } from '../workflows/validateWorkflowForRun';
import type {
    Diagnostic,
    WorkflowRunStartInput,
    WorkflowRunStartPayload,
} from '../workflows/types';
import { loadWorkflowDefinition } from '../workflows/loadWorkflowDefinition';
import {
    gateTemporalReadiness,
    TemporalConfigurationInvalidError,
} from './temporalReadinessGate';
import { formatSafeForLog } from './secretRedaction';
import { resolveTemporalMode } from './temporalSettings';
import { resolveManagedLocalSettings } from './managedLocalSettings';
import { resolveExternalSettings } from './externalSettings';
import { getRegisteredStoredApiKeyReader } from './externalCredentials';
import { resolveExternalApiKey } from './externalSettings';
import {
    buildWorkflowStartInFlightKey,
    releaseWorkflowStartInFlight,
    tryAcquireWorkflowStartInFlight,
} from './workflowStartInFlightGuard';
import { isKnownTemporalWorkflowType, resolveTemporalWorkflowType } from './workflowTypeRegistry';
import type { TemporalMode } from './temporalSettings';

export const WORKFLOW_START_IN_FLIGHT_VALIDATOR_ID = 'forge.workflow.start_in_flight';

export interface TemporalWorkflowStartClient {
    startWorkflow(input: {
        workflowType: string;
        workflowId: string;
        taskQueue: string;
        args: [WorkflowRunStartPayload];
    }): Promise<{ workflowId: string; runId: string }>;
    close(): Promise<void>;
}

export interface StartWorkflowRunInput {
    repositoryRoot: string;
    workflowId: string;
    submittedRunInputs?: Record<string, unknown>;
    globalStoragePath: string;
    windowId: string;
    startedBy?: string;
    createStartClient?: () => Promise<TemporalWorkflowStartClient>;
    now?: () => Date;
}

export type StartWorkflowRunOutcome =
    | {
          ok: true;
          workflowId: string;
          runId: string;
          namespace: string;
          taskQueue: string;
          mode: TemporalMode;
          definitionVersion: string;
          repositoryRoot: string;
          run_inputs: WorkflowRunStartInput;
          startedAt: string;
          startInputSummary?: string;
          started_by?: string;
      }
    | {
          ok: false;
          diagnostics: Diagnostic[];
          inFlight?: boolean;
      };

function buildTemporalWorkflowId(workflowId: string): string {
    return `${workflowId}-${randomUUID()}`;
}

function resolveTemporalConnection(
    globalStoragePath: string,
    windowId: string
): { namespace: string; taskQueue: string; mode: TemporalMode; grpcPort?: number } {
    const mode = resolveTemporalMode();

    if (mode === 'external') {
        const settings = resolveExternalSettings();
        return {
            namespace: settings.namespace ?? 'default',
            taskQueue: settings.taskQueue,
            mode,
        };
    }

    const settings = resolveManagedLocalSettings({
        globalStoragePath,
        windowId,
    });

    return {
        namespace: settings.namespace,
        taskQueue: settings.taskQueue,
        mode,
        grpcPort: settings.grpcPort,
    };
}

export async function createTemporalWorkflowStartClient(
    globalStoragePath: string,
    windowId: string
): Promise<TemporalWorkflowStartClient> {
    const connection = resolveTemporalConnection(globalStoragePath, windowId);
    const { Client, Connection } = await import('@temporalio/client');
    const { buildManagedLocalGrpcAddress } = await import('./devServerLaunch');
    const { buildExternalConnectionOptions } = await import('./externalConnection');

    let temporalConnection: Awaited<ReturnType<typeof Connection.connect>> | undefined;

    if (connection.mode === 'external') {
        const settings = resolveExternalSettings();
        const apiKey = await resolveExternalApiKey(getRegisteredStoredApiKeyReader());
        temporalConnection = await Connection.connect(
            buildExternalConnectionOptions(settings, apiKey)
        );
    } else {
        temporalConnection = await Connection.connect({
            address: buildManagedLocalGrpcAddress(connection.grpcPort!),
        });
    }

    const client = new Client({
        connection: temporalConnection,
        namespace: connection.namespace,
    });

    return {
        async startWorkflow(input) {
            const handle = await client.workflow.start(input.workflowType, {
                taskQueue: input.taskQueue,
                workflowId: input.workflowId,
                args: input.args,
            });

            return {
                workflowId: handle.workflowId,
                runId: handle.firstExecutionRunId,
            };
        },
        async close() {
            await temporalConnection?.close().catch(() => undefined);
        },
    };
}

export async function startWorkflowRun(input: StartWorkflowRunInput): Promise<StartWorkflowRunOutcome> {
    const repositoryRoot = input.repositoryRoot;
    const workflowId = input.workflowId;
    const submitted = input.submittedRunInputs ?? {};

    const definitionValidation = validateWorkflowForRun({
        workspaceRoots: [repositoryRoot],
        workflowId,
    });

    if (!definitionValidation.valid) {
        return { ok: false, diagnostics: definitionValidation.diagnostics };
    }

    const definition = loadWorkflowDefinition(repositoryRoot, workflowId);
    if (!definition) {
        return {
            ok: false,
            diagnostics: [
                {
                    code: 'forge.workflow.not_found',
                    severity: 'error',
                    path: '.ai/workflows',
                    message: `workflow_id "${workflowId}" was not found in workspace workflow definitions`,
                    validator_id: 'forge.workflow.binding',
                },
            ],
        };
    }

    const declarations = parseRunInputsFromRecord(definition as unknown as Record<string, unknown>);
    const runInputValidation = validateSubmittedRunInputs({
        declarations,
        submitted,
        workflow_id: workflowId,
        path: `.ai/workflows/${workflowId}.json`,
    });

    if (!runInputValidation.valid) {
        return { ok: false, diagnostics: runInputValidation.diagnostics };
    }

    const normalizedRunInputs = normalizeSubmittedRunInputs(declarations, submitted);

    if (!isKnownTemporalWorkflowType(workflowId)) {
        return {
            ok: false,
            diagnostics: [
                {
                    code: 'forge.workflow.unsupported_workflow_type',
                    severity: 'error',
                    path: `.ai/workflows/${workflowId}.json`,
                    message: `workflow_id "${workflowId}" is not registered for Temporal start`,
                    validator_id: WORKFLOW_RUN_INPUT_VALIDATOR_ID,
                },
            ],
        };
    }

    const inFlightKey = buildWorkflowStartInFlightKey(
        workflowId,
        repositoryRoot,
        normalizedRunInputs
    );

    if (!tryAcquireWorkflowStartInFlight(inFlightKey)) {
        return {
            ok: false,
            inFlight: true,
            diagnostics: [
                {
                    code: 'forge.workflow.start_in_flight',
                    severity: 'error',
                    path: `/run_inputs`,
                    message: 'A start request for this workflow and submitted inputs is already in progress',
                    validator_id: WORKFLOW_START_IN_FLIGHT_VALIDATOR_ID,
                },
            ],
        };
    }

    try {
        try {
            await gateTemporalReadiness();
        } catch (error) {
            if (error instanceof TemporalConfigurationInvalidError) {
                return { ok: false, diagnostics: error.diagnostics };
            }
            throw error;
        }

        const connection = resolveTemporalConnection(input.globalStoragePath, input.windowId);
        const temporalWorkflowType = resolveTemporalWorkflowType(workflowId)!;
        const temporalWorkflowId = buildTemporalWorkflowId(workflowId);
        const startedAt = (input.now ?? (() => new Date()))().toISOString();

        const payload: WorkflowRunStartPayload = {
            workflow_id: workflowId,
            definition_version: definition.version,
            repositoryRoot,
            run_inputs: normalizedRunInputs,
            started_at: startedAt,
            ...(input.startedBy ? { started_by: input.startedBy } : {}),
        };

        const startClient =
            input.createStartClient ??
            (() => createTemporalWorkflowStartClient(input.globalStoragePath, input.windowId));

        try {
            const client = await startClient();
            try {
                const started = await client.startWorkflow({
                    workflowType: temporalWorkflowType,
                    workflowId: temporalWorkflowId,
                    taskQueue: connection.taskQueue,
                    args: [payload],
                });

                const startInputSummary = buildStartInputSummary(declarations, normalizedRunInputs);

                return {
                    ok: true,
                    workflowId: started.workflowId,
                    runId: started.runId,
                    namespace: connection.namespace,
                    taskQueue: connection.taskQueue,
                    mode: connection.mode,
                    definitionVersion: definition.version,
                    repositoryRoot,
                    run_inputs: normalizedRunInputs,
                    startedAt,
                    startInputSummary,
                    ...(input.startedBy ? { started_by: input.startedBy } : {}),
                };
            } finally {
                await client.close();
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                ok: false,
                diagnostics: [
                    {
                        code: 'forge.temporal.start_failed',
                        severity: 'error',
                        path: 'forge.temporal',
                        message: formatSafeForLog(message),
                        validator_id: 'forge.temporal.readiness',
                    },
                ],
            };
        }
    } finally {
        releaseWorkflowStartInFlight(inFlightKey);
    }
}
