import { ApplicationFailure } from '@temporalio/common';
import { describe, expect, it } from 'vitest';
import type { CursorSdkResponseEnvelope } from './activityEnvelope';
import { mapEnvelopeToActivityFailure } from './mapEnvelopeToActivityFailure';

function buildErrorEnvelope(
    overrides: Partial<CursorSdkResponseEnvelope> = {}
): CursorSdkResponseEnvelope {
    return {
        envelope_version: '1.0.0',
        activity_id: 'forge.test.activity',
        node_id: 'node-1',
        workflow_run_id: 'run-1',
        cursor_agent_id: 'agent-1',
        cursor_run_id: 'run-1',
        output_type: 'markdown',
        status: 'error',
        failure_class: 'startup',
        retryable: true,
        diagnostics: [{ code: 'cursor_sdk_startup', message: 'startup failed', severity: 'error' }],
        ...overrides,
    };
}

describe('mapEnvelopeToActivityFailure', () => {
    it('returns undefined for finished responses', () => {
        const response: CursorSdkResponseEnvelope = {
            envelope_version: '1.0.0',
            activity_id: 'forge.test.activity',
            node_id: 'node-1',
            workflow_run_id: 'run-1',
            cursor_agent_id: 'agent-1',
            cursor_run_id: 'run-1',
            output_type: 'markdown',
            status: 'finished',
            retryable: false,
        };

        expect(mapEnvelopeToActivityFailure(response)).toBeUndefined();
    });

    it('maps cancelled responses to non-retryable failures', () => {
        const failure = mapEnvelopeToActivityFailure(
            buildErrorEnvelope({
                status: 'cancelled',
                failure_class: 'cancelled',
                retryable: false,
            })
        );

        expect(failure).toBeInstanceOf(ApplicationFailure);
        expect(failure?.nonRetryable).toBe(true);
        expect(failure?.type).toBe('cursor_sdk_cancelled');
    });

    it('maps retryable startup failures to retryable ApplicationFailure with default policy', () => {
        const failure = mapEnvelopeToActivityFailure(buildErrorEnvelope());

        expect(failure).toBeInstanceOf(ApplicationFailure);
        expect(failure?.nonRetryable).not.toBe(true);
        expect(failure?.type).toBe('cursor_sdk_startup');
    });

    it('maps non-retryable failures to non-retryable ApplicationFailure', () => {
        const failure = mapEnvelopeToActivityFailure(
            buildErrorEnvelope({
                retryable: false,
            })
        );

        expect(failure?.nonRetryable).toBe(true);
    });

    it('maps retryable execution failures to non-retryable when agent_startup is selected', () => {
        const failure = mapEnvelopeToActivityFailure(
            buildErrorEnvelope({
                failure_class: 'execution',
                retryable: true,
            }),
            { retry_policy: 'agent_startup' }
        );

        expect(failure?.nonRetryable).toBe(true);
        expect(failure?.type).toBe('cursor_sdk_execution');
    });

    it('maps retryable execution failures to retryable when agent_standard is selected', () => {
        const failure = mapEnvelopeToActivityFailure(
            buildErrorEnvelope({
                failure_class: 'execution',
                retryable: true,
            }),
            { retry_policy: 'agent_standard' }
        );

        expect(failure?.nonRetryable).not.toBe(true);
    });

    it('maps retryable startup failures to non-retryable when policy is none', () => {
        const failure = mapEnvelopeToActivityFailure(buildErrorEnvelope(), { retry_policy: 'none' });

        expect(failure?.nonRetryable).toBe(true);
    });
});
