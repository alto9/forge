import { describe, expect, it } from 'vitest';
import type { CursorSdkRequestEnvelope } from './activityEnvelope';
import {
    buildMissingApiKeyResponse,
    buildSuccessResponse,
    parseStructuredPayload,
} from './mapSdkOutcome';

const baseEnvelope: CursorSdkRequestEnvelope = {
    envelope_version: '1.0.0',
    activity_id: 'forge.test.activity',
    node_id: 'node-1',
    workflow_run_id: 'run-1',
    skill_path: '.cursor/skills/test/SKILL.md',
    prompt: 'Do work',
    inputs: {},
    output_type: 'json',
};

describe('mapSdkOutcome', () => {
    it('builds startup failure when API key is missing', () => {
        const response = buildMissingApiKeyResponse(baseEnvelope);

        expect(response.status).toBe('error');
        expect(response.failure_class).toBe('startup');
        expect(response.retryable).toBe(false);
        expect(response.diagnostics?.[0]?.code).toBe('cursor_api_key_missing');
    });

    it('parses json structured payload', () => {
        const payload = parseStructuredPayload('json', '{"ok":true}');
        expect(payload).toEqual({ ok: true });
    });

    it('returns markdown payload as string', () => {
        const payload = parseStructuredPayload('markdown', '# Done');
        expect(payload).toBe('# Done');
    });

    it('builds finished response with structured payload', () => {
        const shell = {
            envelope_version: '1.0.0',
            activity_id: baseEnvelope.activity_id,
            node_id: baseEnvelope.node_id,
            workflow_run_id: baseEnvelope.workflow_run_id,
            cursor_agent_id: 'agent-1',
            cursor_run_id: 'run-abc',
            skill_path: baseEnvelope.skill_path,
            output_type: baseEnvelope.output_type,
            status: 'error' as const,
            retryable: false,
        };

        const response = buildSuccessResponse(
            shell,
            { id: 'run-abc', status: 'finished', result: '{"done":true}' },
            'json'
        );

        expect(response.status).toBe('finished');
        expect(response.structured_payload).toEqual({ done: true });
        expect(response.failure_class).toBeUndefined();
    });
});
