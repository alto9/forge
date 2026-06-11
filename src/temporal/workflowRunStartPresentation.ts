import * as vscode from 'vscode';
import type { Diagnostic } from '../workflows/types';
import { WORKFLOW_RUN_INPUT_VALIDATOR_ID } from '../workflows/validateSubmittedRunInputs';
import {
    formatWorkflowRunStartDefinitionBlockedCatalogMessage,
    formatWorkflowRunStartFailedCatalogMessage,
    formatWorkflowRunStartFailedNotification,
    formatWorkflowRunStartInFlightCatalogMessage,
    formatWorkflowRunStartInputBlockedCatalogMessage,
    formatWorkflowRunStartTemporalBlockedCatalogMessage,
    formatWorkflowRunStartWorkerBlockedCatalogMessage,
} from './temporalPresentation';
import { TEMPORAL_READINESS_VALIDATOR_ID } from './temporalReadinessGate';
import type { StartWorkflowRunOutcome } from './startWorkflowRun';
import { WORKFLOW_START_IN_FLIGHT_VALIDATOR_ID } from './startWorkflowRun';

export type WorkflowRunStartFailureKind =
    | 'definition_invalid'
    | 'run_input_invalid'
    | 'temporal_not_ready'
    | 'worker_not_ready'
    | 'start_in_flight'
    | 'temporal_start_failed';

export type FailedStartWorkflowRunOutcome = Extract<StartWorkflowRunOutcome, { ok: false }>;

function primaryDiagnostic(outcome: FailedStartWorkflowRunOutcome): Diagnostic | undefined {
    return outcome.diagnostics[0];
}

export function classifyWorkflowRunStartFailure(
    outcome: FailedStartWorkflowRunOutcome
): WorkflowRunStartFailureKind {
    if (outcome.inFlight) {
        return 'start_in_flight';
    }

    const diagnostic = primaryDiagnostic(outcome);
    if (!diagnostic) {
        return 'definition_invalid';
    }

    if (diagnostic.code === 'forge.temporal.start_failed') {
        return 'temporal_start_failed';
    }

    if (
        diagnostic.code === 'forge.temporal.configuration_invalid' &&
        diagnostic.validator_id === TEMPORAL_READINESS_VALIDATOR_ID
    ) {
        if (diagnostic.path === 'forge.temporal.worker') {
            return 'worker_not_ready';
        }
        return 'temporal_not_ready';
    }

    if (diagnostic.code === 'forge.workflow.start_in_flight') {
        return 'start_in_flight';
    }

    if (
        diagnostic.validator_id === WORKFLOW_RUN_INPUT_VALIDATOR_ID ||
        diagnostic.validator_id === WORKFLOW_START_IN_FLIGHT_VALIDATOR_ID
    ) {
        return 'run_input_invalid';
    }

    return 'definition_invalid';
}

export function formatWorkflowRunStartCatalogMessage(
    outcome: FailedStartWorkflowRunOutcome
): string {
    const kind = classifyWorkflowRunStartFailure(outcome);
    const diagnostic = primaryDiagnostic(outcome);

    switch (kind) {
        case 'definition_invalid':
            return formatWorkflowRunStartDefinitionBlockedCatalogMessage();
        case 'run_input_invalid':
            return formatWorkflowRunStartInputBlockedCatalogMessage();
        case 'temporal_not_ready':
            return formatWorkflowRunStartTemporalBlockedCatalogMessage();
        case 'worker_not_ready':
            return formatWorkflowRunStartWorkerBlockedCatalogMessage();
        case 'start_in_flight':
            return formatWorkflowRunStartInFlightCatalogMessage();
        case 'temporal_start_failed':
            return formatWorkflowRunStartFailedCatalogMessage(
                diagnostic?.message ?? 'Temporal start failed'
            );
    }
}

function buildStartDiagnosticLogLine(input: {
    workflowId: string;
    diagnostic: Diagnostic;
}): string {
    return [
        '[forge.workflow.start]',
        `workflow_id=${input.workflowId}`,
        `code=${input.diagnostic.code}`,
        `severity=${input.diagnostic.severity}`,
        `path=${input.diagnostic.path}`,
        `validator_id=${input.diagnostic.validator_id}`,
        `message=${input.diagnostic.message}`,
    ].join(' ');
}

export interface PresentWorkflowRunStartFailureInput {
    workflowId: string;
    outcome: FailedStartWorkflowRunOutcome;
    log?: (line: string) => void;
}

export interface PresentWorkflowRunStartFailureResult {
    catalogMessage: string;
    inFlight: boolean;
}

export function presentWorkflowRunStartFailure(
    input: PresentWorkflowRunStartFailureInput
): PresentWorkflowRunStartFailureResult {
    const kind = classifyWorkflowRunStartFailure(input.outcome);
    const catalogMessage = formatWorkflowRunStartCatalogMessage(input.outcome);
    const diagnostic = primaryDiagnostic(input.outcome);

    if (diagnostic && kind !== 'start_in_flight') {
        input.log?.(
            buildStartDiagnosticLogLine({
                workflowId: input.workflowId,
                diagnostic,
            })
        );
    }

    switch (kind) {
        case 'definition_invalid':
            void vscode.window.showWarningMessage(catalogMessage);
            break;
        case 'run_input_invalid':
            void vscode.window.showWarningMessage(catalogMessage);
            break;
        case 'temporal_start_failed':
            void vscode.window.showErrorMessage(
                formatWorkflowRunStartFailedNotification(
                    diagnostic?.message ?? 'Temporal start failed'
                )
            );
            break;
        case 'temporal_not_ready':
        case 'worker_not_ready':
        case 'start_in_flight':
            break;
    }

    return {
        catalogMessage,
        inFlight: kind === 'start_in_flight',
    };
}
