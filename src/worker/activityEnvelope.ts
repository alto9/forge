export const ACTIVITY_ENVELOPE_VERSION = '1.0.0';

export type ActivityOutputType = 'json' | 'markdown' | 'text';

export type ActivityFailureClass = 'startup' | 'execution' | 'cancelled';

export type ActivityStatus = 'finished' | 'error' | 'cancelled';

export interface ActivityDiagnostic {
    code: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    path?: string;
    source?: 'sdk' | 'worker' | 'validator';
}

export interface CursorSdkRequestEnvelope {
    envelope_version: string;
    activity_id: string;
    node_id: string;
    workflow_run_id: string;
    agent_path?: string;
    skill_path?: string;
    prompt: string;
    inputs: Record<string, unknown>;
    model?: string;
    artifact_ids?: string[];
    output_type: ActivityOutputType;
}

export interface CursorSdkResponseEnvelope {
    envelope_version: string;
    activity_id: string;
    node_id: string;
    workflow_run_id: string;
    cursor_agent_id: string;
    cursor_run_id: string;
    agent_path?: string;
    skill_path?: string;
    output_type: ActivityOutputType;
    status: ActivityStatus;
    failure_class?: ActivityFailureClass;
    retryable: boolean;
    structured_payload?: unknown;
    diagnostics?: ActivityDiagnostic[];
}

export interface ExecuteCursorSdkAgentActivityInput {
    envelope: CursorSdkRequestEnvelope;
    workspaceRoot: string;
}
