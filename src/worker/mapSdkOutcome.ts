import type { RunResult } from '@cursor/sdk';
import {
    ACTIVITY_ENVELOPE_VERSION,
    type ActivityOutputType,
    type CursorSdkRequestEnvelope,
    type CursorSdkResponseEnvelope,
} from './activityEnvelope';

export function buildResponseShell(
    envelope: CursorSdkRequestEnvelope,
    cursorAgentId: string,
    cursorRunId: string
): CursorSdkResponseEnvelope {
    return {
        envelope_version: ACTIVITY_ENVELOPE_VERSION,
        activity_id: envelope.activity_id,
        node_id: envelope.node_id,
        workflow_run_id: envelope.workflow_run_id,
        cursor_agent_id: cursorAgentId,
        cursor_run_id: cursorRunId,
        ...(envelope.agent_path ? { agent_path: envelope.agent_path } : {}),
        ...(envelope.skill_path ? { skill_path: envelope.skill_path } : {}),
        output_type: envelope.output_type,
        status: 'error',
        retryable: false,
    };
}

export function buildMissingApiKeyResponse(
    envelope: CursorSdkRequestEnvelope
): CursorSdkResponseEnvelope {
    return {
        envelope_version: ACTIVITY_ENVELOPE_VERSION,
        activity_id: envelope.activity_id,
        node_id: envelope.node_id,
        workflow_run_id: envelope.workflow_run_id,
        cursor_agent_id: 'unavailable',
        cursor_run_id: 'unavailable',
        ...(envelope.agent_path ? { agent_path: envelope.agent_path } : {}),
        ...(envelope.skill_path ? { skill_path: envelope.skill_path } : {}),
        output_type: envelope.output_type,
        status: 'error',
        failure_class: 'startup',
        retryable: false,
        diagnostics: [
            {
                code: 'cursor_api_key_missing',
                message: 'Cursor API key is not configured.',
                severity: 'error',
                source: 'worker',
            },
        ],
    };
}

export function buildStartupFailureResponse(
    shell: CursorSdkResponseEnvelope,
    message: string,
    retryable: boolean
): CursorSdkResponseEnvelope {
    return {
        ...shell,
        status: 'error',
        failure_class: 'startup',
        retryable,
        diagnostics: [
            {
                code: 'cursor_sdk_startup',
                message,
                severity: 'error',
                source: 'sdk',
            },
        ],
    };
}

export function buildExecutionFailureResponse(
    shell: CursorSdkResponseEnvelope,
    result: RunResult,
    retryable: boolean
): CursorSdkResponseEnvelope {
    return {
        ...shell,
        status: 'error',
        failure_class: 'execution',
        retryable,
        diagnostics: [
            {
                code: 'cursor_sdk_execution',
                message: `Cursor SDK run ${result.id} finished with status error.`,
                severity: 'error',
                source: 'sdk',
            },
        ],
    };
}

export function buildCancelledResponse(shell: CursorSdkResponseEnvelope): CursorSdkResponseEnvelope {
    return {
        ...shell,
        status: 'cancelled',
        failure_class: 'cancelled',
        retryable: false,
        diagnostics: [
            {
                code: 'cursor_sdk_cancelled',
                message: 'Cursor SDK activity was cancelled.',
                severity: 'info',
                source: 'worker',
            },
        ],
    };
}

export function parseStructuredPayload(
    outputType: ActivityOutputType,
    resultText: string | undefined
): unknown | undefined {
    if (resultText === undefined) {
        return undefined;
    }

    if (outputType === 'json') {
        try {
            return JSON.parse(resultText) as unknown;
        } catch {
            return { text: resultText };
        }
    }

    return resultText;
}

export function buildSuccessResponse(
    shell: CursorSdkResponseEnvelope,
    result: RunResult,
    outputType: ActivityOutputType
): CursorSdkResponseEnvelope {
    return {
        ...shell,
        status: 'finished',
        retryable: false,
        structured_payload: parseStructuredPayload(outputType, result.result),
    };
}
