import type { RunResult } from '@cursor/sdk';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
    ACTIVITY_ENVELOPE_VERSION,
    type ActivityArtifactRef,
    type ActivityFollowUpQuestion,
    type ActivityOutputType,
    type CursorSdkRequestEnvelope,
    type CursorSdkResponseEnvelope,
} from './activityEnvelope';
import {
    ENVELOPE_SIZE_EXCEEDED_CODE,
    INLINE_STRUCTURED_PAYLOAD_MAX_BYTES,
    TOTAL_ENVELOPE_MAX_BYTES,
    validateActivityEnvelope,
} from './validateActivityEnvelope';

const USER_QUESTIONS_ARTIFACT_ID = 'user_questions';
const DEFAULT_ACTIVITY_OUTPUT_ARTIFACT_ID = 'activity-output';

export interface ActivityArtifactWriter {
    mkdirSync: (directory: string, options: { recursive: boolean }) => void;
    writeFileSync: (filePath: string, data: string) => void;
}

export interface BuildSuccessResponseOptions {
    requestEnvelope: CursorSdkRequestEnvelope;
    workspaceRoot: string;
    artifactWriter?: ActivityArtifactWriter;
}

function defaultArtifactWriter(): ActivityArtifactWriter {
    return {
        mkdirSync: fs.mkdirSync,
        writeFileSync: (filePath, data) => {
            fs.writeFileSync(filePath, data, 'utf8');
        },
    };
}

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

function resolveRunResultRetryable(result: RunResult): boolean {
    if ('isRetryable' in result && typeof result.isRetryable === 'boolean') {
        return result.isRetryable;
    }

    return false;
}

export function buildExecutionFailureResponse(
    shell: CursorSdkResponseEnvelope,
    result: RunResult,
    retryable: boolean = resolveRunResultRetryable(result)
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

export function buildEnvelopeSizeExceededResponse(
    shell: CursorSdkResponseEnvelope,
    totalBytes: number
): CursorSdkResponseEnvelope {
    return {
        ...shell,
        status: 'error',
        failure_class: 'execution',
        retryable: true,
        structured_payload: undefined,
        artifact_refs: undefined,
        follow_up_questions: undefined,
        diagnostics: [
            {
                code: ENVELOPE_SIZE_EXCEEDED_CODE,
                message: `serialized envelope exceeds total limit (${totalBytes} bytes; max ${TOTAL_ENVELOPE_MAX_BYTES})`,
                severity: 'error',
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

export function serializePayloadContent(payload: unknown, outputType: ActivityOutputType): string {
    if (outputType === 'json') {
        return JSON.stringify(payload);
    }

    if (payload === undefined) {
        return '';
    }

    return String(payload);
}

export function extensionForOutputType(outputType: ActivityOutputType): string {
    switch (outputType) {
        case 'json':
            return 'json';
        case 'markdown':
            return 'md';
        case 'text':
            return 'txt';
    }
}

export function mediaTypeForOutputType(outputType: ActivityOutputType): string {
    switch (outputType) {
        case 'json':
            return 'application/json';
        case 'markdown':
            return 'text/markdown';
        case 'text':
            return 'text/plain';
    }
}

export function structuredPayloadUtf8Bytes(
    payload: unknown,
    outputType: ActivityOutputType
): number {
    return Buffer.byteLength(serializePayloadContent(payload, outputType), 'utf8');
}

export function resolveActivityArtifactRelativePath(
    workflowRunId: string,
    nodeId: string,
    artifactId: string,
    outputType: ActivityOutputType
): string {
    const extension = extensionForOutputType(outputType);
    return `.cursor/.tmp/forge-activities/${workflowRunId}/${nodeId}/${artifactId}.${extension}`;
}

export function sha256Hex(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

export function writeActivityArtifact(
    workspaceRoot: string,
    relativePath: string,
    content: string,
    artifactId: string,
    outputType: ActivityOutputType,
    writer: ActivityArtifactWriter = defaultArtifactWriter()
): ActivityArtifactRef {
    const absolutePath = path.join(workspaceRoot, relativePath);
    writer.mkdirSync(path.dirname(absolutePath), { recursive: true });
    writer.writeFileSync(absolutePath, content);

    const sizeBytes = Buffer.byteLength(content, 'utf8');
    return {
        artifact_id: artifactId,
        path: relativePath.replace(/\\/g, '/'),
        size_bytes: sizeBytes,
        sha256: sha256Hex(content),
        media_type: mediaTypeForOutputType(outputType),
    };
}

export function shouldSpillToArtifact(
    payload: unknown,
    outputType: ActivityOutputType,
    artifactIds: string[] | undefined
): boolean {
    if (artifactIds && artifactIds.length > 0) {
        return true;
    }

    return structuredPayloadUtf8Bytes(payload, outputType) > INLINE_STRUCTURED_PAYLOAD_MAX_BYTES;
}

export function extractFollowUpQuestions(
    payload: unknown,
    artifactIds: string[] | undefined
): {
    structuredPayload: unknown | undefined;
    followUpQuestions?: ActivityFollowUpQuestion[];
} {
    if (artifactIds?.includes(USER_QUESTIONS_ARTIFACT_ID)) {
        return { structuredPayload: payload };
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return { structuredPayload: payload };
    }

    const record = payload as Record<string, unknown>;
    const rawQuestions = record.follow_up_questions;
    if (!Array.isArray(rawQuestions)) {
        return { structuredPayload: payload };
    }

    const followUpQuestions: ActivityFollowUpQuestion[] = [];
    for (const item of rawQuestions) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            continue;
        }

        const question = item as Record<string, unknown>;
        const questionId = typeof question.question_id === 'string' ? question.question_id : undefined;
        const prompt = typeof question.prompt === 'string' ? question.prompt : undefined;
        if (!questionId || !prompt) {
            continue;
        }

        followUpQuestions.push({
            question_id: questionId,
            prompt,
            ...(question.severity === 'blocker' || question.severity === 'non-blocker'
                ? { severity: question.severity }
                : {}),
            ...(typeof question.domain === 'string' ? { domain: question.domain } : {}),
        });
    }

    const { follow_up_questions: _removed, ...rest } = record;
    const structuredPayload = Object.keys(rest).length > 0 ? rest : undefined;

    return {
        structuredPayload,
        followUpQuestions: followUpQuestions.length > 0 ? followUpQuestions : undefined,
    };
}

export function finalizeActivityResponse(
    envelope: CursorSdkResponseEnvelope
): CursorSdkResponseEnvelope {
    if (envelope.status === 'finished') {
        const totalBytes = Buffer.byteLength(JSON.stringify(envelope), 'utf8');
        if (totalBytes > TOTAL_ENVELOPE_MAX_BYTES) {
            return buildEnvelopeSizeExceededResponse(envelope, totalBytes);
        }
    }

    const validation = validateActivityEnvelope(envelope);
    if (!validation.valid) {
        const firstError = validation.diagnostics.find((diagnostic) => diagnostic.severity === 'error');
        if (envelope.status === 'finished') {
            return {
                ...envelope,
                status: 'error',
                failure_class: 'execution',
                retryable: false,
                structured_payload: undefined,
                artifact_refs: undefined,
                follow_up_questions: undefined,
                diagnostics: [
                    {
                        code: firstError?.code ?? 'forge.envelope.validation_failed',
                        message: firstError?.message ?? 'activity envelope failed validation',
                        severity: 'error',
                        source: 'worker',
                    },
                ],
            };
        }
    }

    return envelope;
}

export function prepareActivityResponse(
    envelope: CursorSdkResponseEnvelope
): CursorSdkResponseEnvelope {
    return finalizeActivityResponse(envelope);
}

export function buildSuccessResponse(
    shell: CursorSdkResponseEnvelope,
    result: RunResult,
    outputType: ActivityOutputType,
    options?: BuildSuccessResponseOptions
): CursorSdkResponseEnvelope {
    const parsed = parseStructuredPayload(outputType, result.result);
    const { structuredPayload, followUpQuestions } = extractFollowUpQuestions(
        parsed,
        options?.requestEnvelope.artifact_ids
    );
    const payloadForStorage = structuredPayload ?? parsed;

    let response: CursorSdkResponseEnvelope = {
        ...shell,
        status: 'finished',
        retryable: false,
    };

    if (followUpQuestions) {
        response.follow_up_questions = followUpQuestions;
    }

    const spill =
        options !== undefined &&
        shouldSpillToArtifact(payloadForStorage, outputType, options.requestEnvelope.artifact_ids);

    if (spill && options) {
        const artifactId =
            options.requestEnvelope.artifact_ids?.[0] ?? DEFAULT_ACTIVITY_OUTPUT_ARTIFACT_ID;
        const content = serializePayloadContent(payloadForStorage ?? '', outputType);
        const relativePath = resolveActivityArtifactRelativePath(
            options.requestEnvelope.workflow_run_id,
            options.requestEnvelope.node_id,
            artifactId,
            outputType
        );
        const artifactRef = writeActivityArtifact(
            options.workspaceRoot,
            relativePath,
            content,
            artifactId,
            outputType,
            options.artifactWriter
        );
        response.artifact_refs = [artifactRef];
    } else if (structuredPayload !== undefined) {
        response.structured_payload = structuredPayload;
    } else if (parsed !== undefined && followUpQuestions === undefined) {
        response.structured_payload = parsed;
    }

    return finalizeActivityResponse(response);
}
