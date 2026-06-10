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

export interface WorkflowCatalogValidation {
    valid: boolean;
    diagnostics: WorkflowDiagnostic[];
    errorCount: number;
    warningCount: number;
}

/** Discovery catalog row per `.ai/data/serialization.md` **Workflow catalog entry**. */
export interface WorkflowCatalogEntry {
    workflow_id: string;
    name: string;
    version?: string;
    description?: string;
    schema_version?: string;
    path: string;
    repositoryRoot: string;
    validation: WorkflowCatalogValidation;
}

export type WorkflowCatalogEmptyState =
    | 'no_workflows_dir'
    | 'no_json_files';

export interface WorkflowCatalogResult {
    repositoryRoot: string;
    entries: WorkflowCatalogEntry[];
    emptyState?: WorkflowCatalogEmptyState;
}
