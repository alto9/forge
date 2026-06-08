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

export interface WorkflowDefinitionIndexEntry {
    workflow_id: string;
    name: string;
    version: string;
    description?: string;
    schema_version: string;
    path: string;
    schema_valid?: boolean;
}

export interface WorkflowDiscoveryResult {
    entries: WorkflowDefinitionIndexEntry[];
    diagnostics: WorkflowDiagnostic[];
}
