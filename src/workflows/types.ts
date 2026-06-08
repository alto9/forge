export type WorkflowDiagnosticSeverity = 'error' | 'warning';

export interface WorkflowDiagnostic {
    code: string;
    severity: WorkflowDiagnosticSeverity;
    path: string;
    message: string;
    validator_id: string;
}

/** Pre-run validation diagnostic (alias for discovery and run-start gates). */
export type Diagnostic = WorkflowDiagnostic;

export interface WorkflowSchemaValidationResult {
    valid: boolean;
    diagnostics: WorkflowDiagnostic[];
    workflow_id?: string;
    path?: string;
}

/** Aggregate pre-run validation result per `.ai/data/serialization.md`. */
export type ValidationResult = WorkflowSchemaValidationResult;

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
