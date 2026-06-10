import type { RecoveryState } from '../temporal/workflowRunIndex';
import type {
    ActivityFailureClass,
    ActivityOutputType,
    ActivityStatus,
} from '../worker/activityEnvelope';

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

export type WorkflowNodeType =
    | 'activity'
    | 'validation'
    | 'human_question'
    | 'wait'
    | 'decision'
    | 'terminal';

export type WorkflowGraphNodeVisualState =
    | 'pending'
    | 'active'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'waiting'
    | 'validating'
    | 'retrying'
    | 'skipped';

export type WorkflowGraphEdgeVisualState = 'idle' | 'traversed' | 'active' | 'untaken';

export interface WorkflowGraphPosition {
    x: number;
    y: number;
}

export interface WorkflowDefinitionTransition {
    to_node_id: string;
    condition?: string;
}

export interface WorkflowDefinitionArtifact {
    artifact_id: string;
    path: string;
    description?: string;
}

export interface WorkflowDefinitionNode {
    node_id: string;
    type: WorkflowNodeType;
    name: string;
    description?: string;
    question_id?: string;
    input_mode?: 'single_text' | 'markdown_batch' | 'form_fields';
    resume_update?: string;
    artifact_ids?: string[];
    transitions?: WorkflowDefinitionTransition[];
}

/** Parsed workflow definition graph used by the graph model builder (#26). */
export interface WorkflowDefinition {
    schema_version: string;
    workflow_id: string;
    name: string;
    version: string;
    description?: string;
    entry_node_id: string;
    artifacts?: WorkflowDefinitionArtifact[];
    nodes: WorkflowDefinitionNode[];
}

export interface WorkflowGraphNode {
    node_id: string;
    type: WorkflowNodeType;
    name: string;
    visual_state: WorkflowGraphNodeVisualState;
    status_label: string;
    position: WorkflowGraphPosition;
    retry_attempt?: number;
    retry_max?: number;
    detail?: string;
}

export interface WorkflowGraphEdge {
    edge_id: string;
    from_node_id: string;
    to_node_id: string;
    visual_state: WorkflowGraphEdgeVisualState;
    condition?: string;
}

export interface WorkflowGraphStepListEntry {
    node_id: string;
    name: string;
    visual_state: WorkflowGraphNodeVisualState;
    status_label: string;
}

export interface WorkflowGraphTemporalIds {
    workflowId: string;
    runId: string;
    namespace: string;
}

export type RunInspectorMode = 'definition' | 'run';

export interface RunInspectorSummary {
    node_id: string;
    type: WorkflowNodeType;
    name: string;
    status_label: string;
    detail?: string;
}

export interface RunInspectorActivityDiagnostic {
    code: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    path?: string;
    source?: 'sdk' | 'worker' | 'validator';
}

export interface RunInspectorActivitySummary {
    activity_id: string;
    cursor_agent_id: string;
    cursor_run_id: string;
    status: ActivityStatus;
    failure_class?: ActivityFailureClass;
    retryable: boolean;
    output_type: ActivityOutputType;
    diagnostics?: RunInspectorActivityDiagnostic[];
}

export interface RunInspectorRetryBlock {
    attempt: number;
    max: number;
    in_progress: boolean;
}

export interface RunInspectorValidationOutcome {
    validator_id: string;
    type: string;
    target?: string;
    passed: boolean;
    blocking: boolean;
}

export interface RunInspectorValidationDiagnostic {
    code: string;
    severity: string;
    message: string;
    path?: string;
    validator_id: string;
}

export interface RunInspectorValidationSummary {
    valid: boolean;
    validated_at: string;
    validator_outcomes: RunInspectorValidationOutcome[];
    diagnostics: RunInspectorValidationDiagnostic[];
}

export type RunInspectorArtifactPreviewMode =
    | 'inline'
    | 'truncated'
    | 'metadata_only'
    | 'glob_list';

export interface RunInspectorArtifactPreview {
    artifact_id: string;
    path: string;
    size_bytes: number;
    sha256_prefix: string;
    media_type?: string;
    preview_mode: RunInspectorArtifactPreviewMode;
    preview_text?: string;
    truncated?: boolean;
    glob_matches?: string[];
    overflow_count?: number;
}

export type RunInspectorRecoveryActionId =
    | 'cancel_run'
    | 'refresh'
    | 'open_in_editor'
    | 'copy_path'
    | 'copy_diagnostic'
    | 'copy_cursor_run_id'
    | 'open_question_panel';

export interface RunInspectorRecoveryAction {
    action_id: RunInspectorRecoveryActionId;
    label: string;
    enabled: boolean;
    disabled_reason?: string;
}

/** Serialized payload for the graph webview detail panel per `.ai/data/serialization.md`. */
export interface RunInspectorDetail {
    mode: RunInspectorMode;
    selected_node_id: string | null;
    recoveryState?: RecoveryState;
    summary?: RunInspectorSummary;
    activity?: RunInspectorActivitySummary;
    retry?: RunInspectorRetryBlock;
    validation?: RunInspectorValidationSummary;
    artifacts?: RunInspectorArtifactPreview[];
    recovery_actions?: RunInspectorRecoveryAction[];
    empty_state?: string;
}

/** Serialized payload for the workflow graph webview per `.ai/data/serialization.md`. */
export interface WorkflowGraphModel {
    workflow_id: string;
    workflow_name: string;
    mode: 'definition' | 'run';
    nodes: WorkflowGraphNode[];
    edges: WorkflowGraphEdge[];
    step_list: WorkflowGraphStepListEntry[];
    run_summary?: string;
    recoveryState?: RecoveryState;
    temporal_ids?: WorkflowGraphTemporalIds;
}
