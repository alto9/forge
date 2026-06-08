export type WorkflowDiagnosticSeverity = 'error' | 'warning';

export interface WorkflowDiagnostic {
    code: string;
    severity: WorkflowDiagnosticSeverity;
    path: string;
    message: string;
    validator_id: string;
}

export interface WorkflowSchemaValidationResult {
    valid: boolean;
    diagnostics: WorkflowDiagnostic[];
    workflow_id?: string;
    path?: string;
}
