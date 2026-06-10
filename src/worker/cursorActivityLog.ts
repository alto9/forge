import type { CursorSdkResponseEnvelope } from './activityEnvelope';

const LOG_PREFIX = '[forge.activity.cursor]';

export interface CursorActivityLogFields {
    activity_id: string;
    node_id: string;
    cursor_agent_id?: string;
    cursor_run_id?: string;
    status?: string;
    failure_class?: string;
    retryable?: boolean;
    artifact_ref_paths?: string[];
    event?: string;
}

function formatLogLine(fields: CursorActivityLogFields): string {
    const parts = [
        `${LOG_PREFIX} activity_id=${fields.activity_id}`,
        `node_id=${fields.node_id}`,
    ];

    if (fields.cursor_agent_id) {
        parts.push(`cursor_agent_id=${fields.cursor_agent_id}`);
    }
    if (fields.cursor_run_id) {
        parts.push(`cursor_run_id=${fields.cursor_run_id}`);
    }
    if (fields.status) {
        parts.push(`status=${fields.status}`);
    }
    if (fields.failure_class) {
        parts.push(`failure_class=${fields.failure_class}`);
    }
    if (fields.retryable !== undefined) {
        parts.push(`retryable=${String(fields.retryable)}`);
    }
    if (fields.artifact_ref_paths && fields.artifact_ref_paths.length > 0) {
        parts.push(`artifact_refs=${fields.artifact_ref_paths.join(',')}`);
    }
    if (fields.event) {
        parts.push(`event=${fields.event}`);
    }

    return parts.join(' ');
}

export type CursorActivityLogger = (line: string) => void;

export function createCursorActivityLogger(
    log: CursorActivityLogger = (line) => process.stderr.write(`${line}\n`)
): {
    logMetadata: (fields: CursorActivityLogFields) => void;
    logResponseEnvelope: (envelope: CursorSdkResponseEnvelope) => void;
} {
    return {
        logMetadata(fields: CursorActivityLogFields) {
            log(formatLogLine(fields));
        },
        logResponseEnvelope(envelope: CursorSdkResponseEnvelope) {
            log(
                formatLogLine({
                    activity_id: envelope.activity_id,
                    node_id: envelope.node_id,
                    cursor_agent_id: envelope.cursor_agent_id,
                    cursor_run_id: envelope.cursor_run_id,
                    status: envelope.status,
                    failure_class: envelope.failure_class,
                    retryable: envelope.retryable,
                    artifact_ref_paths: envelope.artifact_refs?.map((artifactRef) => artifactRef.path),
                })
            );
        },
    };
}
