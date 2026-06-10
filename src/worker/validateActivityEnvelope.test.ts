import { describe, it, expect, beforeEach } from 'vitest';
import type { CursorSdkResponseEnvelope } from './activityEnvelope';
import {
    validateActivityEnvelope,
    validateEnvelopeSchema,
    validateEnvelopeUnsupportedVersion,
    validateEnvelopeSize,
    ACTIVITY_ENVELOPE_SCHEMA_VALIDATOR_ID,
    ACTIVITY_ENVELOPE_UNSUPPORTED_VERSION_VALIDATOR_ID,
    ACTIVITY_ENVELOPE_SIZE_VALIDATOR_ID,
    ENVELOPE_SIZE_EXCEEDED_CODE,
    ENVELOPE_UNSUPPORTED_VERSION_CODE,
    INLINE_STRUCTURED_PAYLOAD_MAX_BYTES,
    TOTAL_ENVELOPE_MAX_BYTES,
    resetActivityEnvelopeValidatorCacheForTests,
} from './validateActivityEnvelope';

function baseEnvelope(
    overrides: Partial<CursorSdkResponseEnvelope> = {}
): CursorSdkResponseEnvelope {
    return {
        envelope_version: '1.0.0',
        activity_id: 'act-1',
        node_id: 'node-1',
        workflow_run_id: 'run-1',
        cursor_agent_id: 'agent-1',
        cursor_run_id: 'run-sdk-1',
        output_type: 'json',
        status: 'finished',
        retryable: false,
        ...overrides,
    };
}

describe('validateActivityEnvelope', () => {
    beforeEach(() => {
        resetActivityEnvelopeValidatorCacheForTests();
    });

    it('accepts a finished envelope with json structured_payload', () => {
        const envelope = baseEnvelope({
            structured_payload: { summary: 'done', count: 2 },
        });

        const result = validateActivityEnvelope(envelope);

        expect(result.valid).toBe(true);
        expect(result.diagnostics).toEqual([]);
    });

    it('accepts finished envelopes for markdown and text output types', () => {
        const markdown = baseEnvelope({
            output_type: 'markdown',
            structured_payload: '# Heading\n\nBody text.',
        });
        const text = baseEnvelope({
            output_type: 'text',
            structured_payload: 'plain output',
        });

        expect(validateActivityEnvelope(markdown).valid).toBe(true);
        expect(validateActivityEnvelope(text).valid).toBe(true);
    });

    it('accepts an envelope with artifact_refs and no inline payload', () => {
        const envelope = baseEnvelope({
            artifact_refs: [
                {
                    artifact_id: 'refinement',
                    path: '.ai/refinement.md',
                    size_bytes: 1200,
                    sha256: 'a'.repeat(64),
                    media_type: 'text/markdown',
                },
            ],
        });

        const result = validateActivityEnvelope(envelope);

        expect(result.valid).toBe(true);
        expect(result.diagnostics).toEqual([]);
    });

    it('rejects error envelopes missing failure_class via schema validator', () => {
        const envelope = baseEnvelope({
            status: 'error',
            retryable: true,
        });

        const result = validateEnvelopeSchema(envelope);

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    severity: 'error',
                    validator_id: ACTIVITY_ENVELOPE_SCHEMA_VALIDATOR_ID,
                }),
            ])
        );
    });

    it('rejects unsupported envelope_version major via unsupported_version validator', () => {
        const envelope = baseEnvelope({ envelope_version: '2.0.0' });

        const result = validateEnvelopeUnsupportedVersion(envelope);

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual([
            expect.objectContaining({
                code: ENVELOPE_UNSUPPORTED_VERSION_CODE,
                path: '/envelope_version',
                validator_id: ACTIVITY_ENVELOPE_UNSUPPORTED_VERSION_VALIDATOR_ID,
            }),
        ]);
    });

    it('rejects oversize serialized envelopes via size validator', () => {
        const oversizedPayload = 'x'.repeat(TOTAL_ENVELOPE_MAX_BYTES);
        const envelope = baseEnvelope({
            structured_payload: oversizedPayload,
        });

        const result = validateEnvelopeSize(envelope);

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: ENVELOPE_SIZE_EXCEEDED_CODE,
                    validator_id: ACTIVITY_ENVELOPE_SIZE_VALIDATOR_ID,
                }),
            ])
        );
    });

    it('rejects inline structured_payload above 64 KiB', () => {
        const envelope = baseEnvelope({
            structured_payload: 'x'.repeat(INLINE_STRUCTURED_PAYLOAD_MAX_BYTES + 1),
        });

        const result = validateEnvelopeSize(envelope);

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: ENVELOPE_SIZE_EXCEEDED_CODE,
                    path: '/structured_payload',
                    validator_id: ACTIVITY_ENVELOPE_SIZE_VALIDATOR_ID,
                }),
            ])
        );
    });

    it('accepts cancelled envelopes with failure_class', () => {
        const envelope = baseEnvelope({
            status: 'cancelled',
            failure_class: 'cancelled',
            diagnostics: [
                {
                    code: 'cursor_sdk_cancelled',
                    message: 'cancelled',
                    severity: 'info',
                    source: 'worker',
                },
            ],
        });

        expect(validateActivityEnvelope(envelope).valid).toBe(true);
    });
});
