import { describe, expect, it } from 'vitest';
import type { CursorSdkRequestEnvelope } from './activityEnvelope';
import {
    buildEnvelopeSizeExceededResponse,
    buildMissingApiKeyResponse,
    buildSuccessResponse,
    extractFollowUpQuestions,
    parseStructuredPayload,
    resolveActivityArtifactRelativePath,
    sha256Hex,
    shouldSpillToArtifact,
    structuredPayloadUtf8Bytes,
    writeActivityArtifact,
} from './mapSdkOutcome';
import {
    INLINE_STRUCTURED_PAYLOAD_MAX_BYTES,
    TOTAL_ENVELOPE_MAX_BYTES,
} from './validateActivityEnvelope';

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

const responseShell = {
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

    it('builds finished response with inline structured payload', () => {
        const response = buildSuccessResponse(
            responseShell,
            { id: 'run-abc', status: 'finished', result: '{"done":true}' },
            'json'
        );

        expect(response.status).toBe('finished');
        expect(response.structured_payload).toEqual({ done: true });
        expect(response.failure_class).toBeUndefined();
        expect(response.artifact_refs).toBeUndefined();
    });

    it('spills oversized payload to artifact_refs without inline body', () => {
        const oversized = 'x'.repeat(INLINE_STRUCTURED_PAYLOAD_MAX_BYTES + 1);
        const writes: Array<{ path: string; content: string }> = [];
        const response = buildSuccessResponse(
            responseShell,
            { id: 'run-abc', status: 'finished', result: JSON.stringify({ body: oversized }) },
            'json',
            {
                requestEnvelope: baseEnvelope,
                workspaceRoot: '/tmp/workspace',
                artifactWriter: {
                    mkdirSync: () => undefined,
                    writeFileSync: (filePath, content) => {
                        writes.push({ path: filePath, content });
                    },
                },
            }
        );

        expect(response.status).toBe('finished');
        expect(response.structured_payload).toBeUndefined();
        expect(response.artifact_refs).toHaveLength(1);
        expect(response.artifact_refs?.[0]).toEqual(
            expect.objectContaining({
                artifact_id: 'activity-output',
                path: resolveActivityArtifactRelativePath(
                    baseEnvelope.workflow_run_id,
                    baseEnvelope.node_id,
                    'activity-output',
                    'json'
                ),
                size_bytes: structuredPayloadUtf8Bytes({ body: oversized }, 'json'),
                sha256: sha256Hex(JSON.stringify({ body: oversized })),
                media_type: 'application/json',
            })
        );
        expect(writes).toHaveLength(1);
    });

    it('writes artifact_refs when request declares artifact_ids even for small payloads', () => {
        const response = buildSuccessResponse(
            responseShell,
            { id: 'run-abc', status: 'finished', result: '# Done' },
            'markdown',
            {
                requestEnvelope: {
                    ...baseEnvelope,
                    output_type: 'markdown',
                    artifact_ids: ['refinement'],
                },
                workspaceRoot: '/tmp/workspace',
                artifactWriter: {
                    mkdirSync: () => undefined,
                    writeFileSync: () => undefined,
                },
            }
        );

        expect(response.structured_payload).toBeUndefined();
        expect(response.artifact_refs?.[0]?.artifact_id).toBe('refinement');
        expect(response.artifact_refs?.[0]?.path).toBe(
            resolveActivityArtifactRelativePath(
                baseEnvelope.workflow_run_id,
                baseEnvelope.node_id,
                'refinement',
                'markdown'
            )
        );
    });

    it('extracts follow_up_questions from json output', () => {
        const extracted = extractFollowUpQuestions(
            {
                summary: 'done',
                follow_up_questions: [
                    {
                        question_id: 'auth-scope',
                        prompt: 'Which GitHub scopes are required?',
                        severity: 'blocker',
                    },
                ],
            },
            undefined
        );

        expect(extracted.structuredPayload).toEqual({ summary: 'done' });
        expect(extracted.followUpQuestions).toEqual([
            {
                question_id: 'auth-scope',
                prompt: 'Which GitHub scopes are required?',
                severity: 'blocker',
            },
        ]);
    });

    it('skips follow_up_questions when user_questions artifact is declared', () => {
        const extracted = extractFollowUpQuestions(
            {
                follow_up_questions: [{ question_id: 'q1', prompt: 'Question?' }],
            },
            ['user_questions']
        );

        expect(extracted.followUpQuestions).toBeUndefined();
        expect(extracted.structuredPayload).toEqual({
            follow_up_questions: [{ question_id: 'q1', prompt: 'Question?' }],
        });
    });

    it('includes follow_up_questions on finished response', () => {
        const response = buildSuccessResponse(
            responseShell,
            {
                id: 'run-abc',
                status: 'finished',
                result: JSON.stringify({
                    follow_up_questions: [{ question_id: 'next-step', prompt: 'Continue?' }],
                }),
            },
            'json'
        );

        expect(response.follow_up_questions).toEqual([
            { question_id: 'next-step', prompt: 'Continue?' },
        ]);
        expect(response.structured_payload).toBeUndefined();
    });

    it('returns execution failure when serialized envelope exceeds 256 KiB', () => {
        const hugeField = 'z'.repeat(TOTAL_ENVELOPE_MAX_BYTES);
        const response = buildSuccessResponse(
            responseShell,
            {
                id: 'run-abc',
                status: 'finished',
                result: JSON.stringify({ hugeField }),
            },
            'json'
        );

        expect(response.status).toBe('error');
        expect(response.failure_class).toBe('execution');
        expect(response.retryable).toBe(true);
        expect(response.diagnostics?.[0]?.code).toBe('forge.envelope.size_exceeded');
        expect(response.structured_payload).toBeUndefined();
    });

    it('builds explicit envelope size exceeded response', () => {
        const response = buildEnvelopeSizeExceededResponse(responseShell, TOTAL_ENVELOPE_MAX_BYTES + 1);

        expect(response.status).toBe('error');
        expect(response.failure_class).toBe('execution');
        expect(response.diagnostics?.[0]?.code).toBe('forge.envelope.size_exceeded');
    });

    it('writes artifact files with sha256 and size metadata', () => {
        const writes: Array<{ path: string; content: string }> = [];
        const artifactRef = writeActivityArtifact(
            '/tmp/workspace',
            '.cursor/.tmp/forge-activities/run-1/node-1/refinement.md',
            '# Output',
            'refinement',
            'markdown',
            {
                mkdirSync: () => undefined,
                writeFileSync: (filePath, content) => {
                    writes.push({ path: filePath, content });
                },
            }
        );

        expect(artifactRef).toEqual({
            artifact_id: 'refinement',
            path: '.cursor/.tmp/forge-activities/run-1/node-1/refinement.md',
            size_bytes: 8,
            sha256: sha256Hex('# Output'),
            media_type: 'text/markdown',
        });
        expect(writes[0]?.content).toBe('# Output');
    });

    it('detects spill when payload exceeds inline cap', () => {
        const payload = 'a'.repeat(INLINE_STRUCTURED_PAYLOAD_MAX_BYTES + 1);
        expect(shouldSpillToArtifact(payload, 'text', undefined)).toBe(true);
        expect(shouldSpillToArtifact('small', 'text', undefined)).toBe(false);
        expect(shouldSpillToArtifact('small', 'text', ['issue_context'])).toBe(true);
    });
});
