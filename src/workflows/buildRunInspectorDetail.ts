import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { ActivityEnvelopeSummary } from '../temporal/workflowRunProjection';
import type { WorkflowRunProjection } from '../temporal/workflowRunProjection';
import type { ValidationSummary } from '../temporal/validationSummaryProjection';
import {
    findWorkflowArtifactPath,
    resolveArtifactGlobPaths,
} from '../validation/artifactPathResolution';
import { buildWorkflowGraphModel } from './buildWorkflowGraphModel';
import { redactInspectorText } from './redactInspectorText';
import type {
    RunInspectorActivitySummary,
    RunInspectorArtifactPreview,
    RunInspectorDetail,
    RunInspectorRecoveryAction,
    RunInspectorRetryBlock,
    RunInspectorValidationSummary,
    WorkflowDefinition,
    WorkflowDefinitionNode,
    WorkflowGraphNode,
} from './types';

const PREVIEW_MAX_BYTES = 32 * 1024;
const GLOB_LIST_MAX = 20;

const EMPTY_STATE_COPY =
    'Select a step to inspect activity output, validation, and artifacts.';
const RECOVERY_BLOCKED_REASON = 'Run actions are unavailable until recovery finishes.';

interface ArtifactPreviewSource {
    artifact_id: string;
    path: string;
    size_bytes?: number;
    sha256?: string;
    media_type?: string;
}

function findDefinitionNode(
    definition: WorkflowDefinition,
    nodeId: string
): WorkflowDefinitionNode | undefined {
    return definition.nodes.find((node) => node.node_id === nodeId);
}

function findActivitySummary(
    projection: WorkflowRunProjection,
    nodeId: string
): ActivityEnvelopeSummary | undefined {
    return projection.activitySummaries?.find((summary) => summary.node_id === nodeId);
}

function findValidationSummary(
    projection: WorkflowRunProjection,
    nodeId: string,
    definitionNode: WorkflowDefinitionNode
): ValidationSummary | undefined {
    const direct = projection.validationSummaries.find((summary) => summary.node_id === nodeId);
    if (direct) {
        return direct;
    }

    if (definitionNode.type === 'activity') {
        return projection.validationSummaries.find(
            (summary) => summary.source_activity_node_id === nodeId
        );
    }

    return undefined;
}

function mapActivitySummary(summary: ActivityEnvelopeSummary): RunInspectorActivitySummary {
    return {
        activity_id: summary.activity_id,
        cursor_agent_id: summary.cursor_agent_id,
        cursor_run_id: summary.cursor_run_id,
        status: summary.status,
        ...(summary.failure_class ? { failure_class: summary.failure_class } : {}),
        retryable: summary.retryable,
        output_type: summary.output_type,
        ...(summary.diagnostics?.length
            ? {
                  diagnostics: summary.diagnostics.map((diagnostic) => ({
                      code: diagnostic.code,
                      message: redactInspectorText(diagnostic.message),
                      severity: diagnostic.severity,
                      ...(diagnostic.path ? { path: diagnostic.path } : {}),
                      ...(diagnostic.source ? { source: diagnostic.source } : {}),
                  })),
              }
            : {}),
    };
}

function mapValidationSummary(summary: ValidationSummary): RunInspectorValidationSummary {
    return {
        valid: summary.valid,
        validated_at: summary.validated_at,
        validator_outcomes: summary.validator_outcomes.map((outcome) => ({
            validator_id: outcome.validator_id,
            type: outcome.type,
            ...(outcome.target ? { target: outcome.target } : {}),
            passed: outcome.passed,
            blocking: outcome.blocking,
        })),
        diagnostics: summary.diagnostics.map((diagnostic) => ({
            code: diagnostic.code,
            severity: diagnostic.severity,
            message: redactInspectorText(diagnostic.message),
            validator_id: diagnostic.validator_id,
            ...(diagnostic.path ? { path: diagnostic.path } : {}),
        })),
    };
}

function buildRetryBlock(
    graphNode: WorkflowGraphNode | undefined,
    projection: WorkflowRunProjection,
    nodeId: string
): RunInspectorRetryBlock | undefined {
    if (projection.retrying?.node_id === nodeId) {
        return {
            attempt: projection.retrying.attempt,
            max: projection.retrying.max,
            in_progress: true,
        };
    }

    if (
        graphNode?.visual_state === 'failed' &&
        graphNode.retry_attempt !== undefined &&
        graphNode.retry_max !== undefined
    ) {
        return {
            attempt: graphNode.retry_attempt,
            max: graphNode.retry_max,
            in_progress: false,
        };
    }

    if (graphNode?.visual_state === 'retrying' && graphNode.retry_attempt !== undefined) {
        return {
            attempt: graphNode.retry_attempt,
            max: graphNode.retry_max ?? graphNode.retry_attempt,
            in_progress: true,
        };
    }

    return undefined;
}

function isBinaryContent(buffer: Buffer): boolean {
    const scanLength = Math.min(buffer.length, 8192);
    for (let index = 0; index < scanLength; index += 1) {
        if (buffer[index] === 0) {
            return true;
        }
    }
    return false;
}

function sha256Prefix(content: Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 8);
}

function readArtifactPreview(
    repositoryRoot: string,
    source: ArtifactPreviewSource
): RunInspectorArtifactPreview {
    const normalizedPath = source.path.split(path.sep).join('/');
    const absolutePath = path.join(repositoryRoot, normalizedPath);

    if (normalizedPath.includes('*')) {
        const matches = resolveArtifactGlobPaths(repositoryRoot, normalizedPath);
        const listed = matches.slice(0, GLOB_LIST_MAX);
        const overflowCount = Math.max(0, matches.length - GLOB_LIST_MAX);

        return {
            artifact_id: source.artifact_id,
            path: normalizedPath,
            size_bytes: 0,
            sha256_prefix: '00000000',
            preview_mode: 'glob_list',
            glob_matches: listed,
            ...(overflowCount > 0 ? { overflow_count: overflowCount } : {}),
        };
    }

    if (!fs.existsSync(absolutePath)) {
        return {
            artifact_id: source.artifact_id,
            path: normalizedPath,
            size_bytes: 0,
            sha256_prefix: '00000000',
            preview_mode: 'metadata_only',
        };
    }

    const stat = fs.statSync(absolutePath);
    const fileBuffer = fs.readFileSync(absolutePath);
    const sizeBytes = source.size_bytes ?? stat.size;
    const hashPrefix = source.sha256
        ? source.sha256.slice(0, 8).toLowerCase()
        : sha256Prefix(fileBuffer);

    if (isBinaryContent(fileBuffer)) {
        return {
            artifact_id: source.artifact_id,
            path: normalizedPath,
            size_bytes: sizeBytes,
            sha256_prefix: hashPrefix,
            ...(source.media_type ? { media_type: source.media_type } : {}),
            preview_mode: 'metadata_only',
        };
    }

    const truncated = fileBuffer.length > PREVIEW_MAX_BYTES;
    const previewBuffer = truncated ? fileBuffer.subarray(0, PREVIEW_MAX_BYTES) : fileBuffer;
    const previewText = redactInspectorText(previewBuffer.toString('utf8'));

    return {
        artifact_id: source.artifact_id,
        path: normalizedPath,
        size_bytes: sizeBytes,
        sha256_prefix: hashPrefix,
        ...(source.media_type ? { media_type: source.media_type } : {}),
        preview_mode: truncated ? 'truncated' : 'inline',
        preview_text: previewText,
        ...(truncated ? { truncated: true } : {}),
    };
}

function collectArtifactSources(
    definition: WorkflowDefinition,
    definitionNode: WorkflowDefinitionNode,
    activitySummary: ActivityEnvelopeSummary | undefined
): ArtifactPreviewSource[] {
    const sources = new Map<string, ArtifactPreviewSource>();

    for (const artifactRef of activitySummary?.artifact_refs ?? []) {
        sources.set(`${artifactRef.artifact_id}:${artifactRef.path}`, {
            artifact_id: artifactRef.artifact_id,
            path: artifactRef.path,
            size_bytes: artifactRef.size_bytes,
            sha256: artifactRef.sha256,
            ...(artifactRef.media_type ? { media_type: artifactRef.media_type } : {}),
        });
    }

    for (const artifactId of definitionNode.artifact_ids ?? []) {
        const declaredPath = findWorkflowArtifactPath(definition.artifacts, artifactId);
        if (!declaredPath) {
            continue;
        }

        const key = `${artifactId}:${declaredPath}`;
        if (!sources.has(key)) {
            sources.set(key, {
                artifact_id: artifactId,
                path: declaredPath,
            });
        }
    }

    return [...sources.values()];
}

function buildArtifactPreviews(
    definition: WorkflowDefinition,
    definitionNode: WorkflowDefinitionNode,
    activitySummary: ActivityEnvelopeSummary | undefined,
    repositoryRoot: string
): RunInspectorArtifactPreview[] | undefined {
    const sources = collectArtifactSources(definition, definitionNode, activitySummary);
    if (sources.length === 0) {
        return undefined;
    }

    return sources.map((source) => readArtifactPreview(repositoryRoot, source));
}

function hasResolvableArtifactPath(
    definition: WorkflowDefinition,
    definitionNode: WorkflowDefinitionNode,
    activitySummary: ActivityEnvelopeSummary | undefined,
    repositoryRoot: string
): boolean {
    return collectArtifactSources(definition, definitionNode, activitySummary).some((source) => {
        const normalizedPath = source.path.split(path.sep).join('/');
        if (normalizedPath.includes('*')) {
            return resolveArtifactGlobPaths(repositoryRoot, normalizedPath).length > 0;
        }
        return fs.existsSync(path.join(repositoryRoot, normalizedPath));
    });
}

function buildRecoveryActions(
    definitionNode: WorkflowDefinitionNode,
    graphNode: WorkflowGraphNode | undefined,
    projection: WorkflowRunProjection,
    activitySummary: ActivityEnvelopeSummary | undefined,
    validationSummary: ValidationSummary | undefined,
    definition: WorkflowDefinition,
    repositoryRoot: string
): RunInspectorRecoveryAction[] {
    const synced = projection.recoveryState === 'synced';
    const hasArtifacts = hasResolvableArtifactPath(
        definition,
        definitionNode,
        activitySummary,
        repositoryRoot
    );
    const hasDiagnostic =
        (activitySummary?.diagnostics?.length ?? 0) > 0 ||
        (validationSummary?.diagnostics?.length ?? 0) > 0;
    const hasCursorRunId = Boolean(activitySummary?.cursor_run_id);
    const isWaitingHumanQuestion =
        definitionNode.type === 'human_question' && graphNode?.visual_state === 'waiting';

    const recoveryBlocked = !synced;

    function action(
        actionId: RunInspectorRecoveryAction['action_id'],
        label: string,
        enabled: boolean,
        disabledReason?: string
    ): RunInspectorRecoveryAction {
        return {
            action_id: actionId,
            label,
            enabled,
            ...(enabled || !disabledReason ? {} : { disabled_reason: disabledReason }),
        };
    }

    return [
        action(
            'cancel_run',
            'Cancel run',
            synced && !projection.terminal,
            recoveryBlocked
                ? RECOVERY_BLOCKED_REASON
                : projection.terminal
                  ? 'Run is already terminal.'
                  : undefined
        ),
        action('refresh', 'Refresh', true),
        action(
            'open_in_editor',
            'Open in editor',
            synced && hasArtifacts,
            recoveryBlocked
                ? RECOVERY_BLOCKED_REASON
                : hasArtifacts
                  ? undefined
                  : 'No resolvable artifact path for this step.'
        ),
        action(
            'copy_path',
            'Copy path',
            synced && hasArtifacts,
            recoveryBlocked
                ? RECOVERY_BLOCKED_REASON
                : hasArtifacts
                  ? undefined
                  : 'No artifact path available for this step.'
        ),
        action(
            'copy_diagnostic',
            'Copy diagnostic',
            synced && hasDiagnostic,
            recoveryBlocked
                ? RECOVERY_BLOCKED_REASON
                : hasDiagnostic
                  ? undefined
                  : 'No diagnostic available for this step.'
        ),
        action(
            'copy_cursor_run_id',
            'Copy Cursor run ID',
            synced && hasCursorRunId,
            recoveryBlocked
                ? RECOVERY_BLOCKED_REASON
                : hasCursorRunId
                  ? undefined
                  : 'No Cursor run ID for this step.'
        ),
        action(
            'open_question_panel',
            'Answer in question panel',
            synced && isWaitingHumanQuestion,
            recoveryBlocked
                ? RECOVERY_BLOCKED_REASON
                : isWaitingHumanQuestion
                  ? undefined
                  : 'This step is not waiting for human input.'
        ),
    ];
}

export function buildRunInspectorDetail(
    definition: WorkflowDefinition,
    projection: WorkflowRunProjection | undefined,
    selectedNodeId: string | null,
    repositoryRoot: string
): RunInspectorDetail {
    if (selectedNodeId === null) {
        return {
            mode: projection ? 'run' : 'definition',
            selected_node_id: null,
            ...(projection ? { recoveryState: projection.recoveryState } : {}),
            empty_state: EMPTY_STATE_COPY,
        };
    }

    const definitionNode = findDefinitionNode(definition, selectedNodeId);
    if (!definitionNode) {
        return {
            mode: projection ? 'run' : 'definition',
            selected_node_id: selectedNodeId,
            ...(projection ? { recoveryState: projection.recoveryState } : {}),
            empty_state: EMPTY_STATE_COPY,
        };
    }

    if (!projection) {
        return {
            mode: 'definition',
            selected_node_id: selectedNodeId,
            summary: {
                node_id: definitionNode.node_id,
                type: definitionNode.type,
                name: definitionNode.name,
                status_label: 'Pending',
                ...(definitionNode.description ? { detail: definitionNode.description } : {}),
            },
        };
    }

    const graphModel = buildWorkflowGraphModel(definition, projection);
    const graphNode = graphModel.nodes.find((node) => node.node_id === selectedNodeId);
    const activitySummary = findActivitySummary(projection, selectedNodeId);
    const validationSummary = findValidationSummary(projection, selectedNodeId, definitionNode);
    const retry = buildRetryBlock(graphNode, projection, selectedNodeId);
    const artifacts = buildArtifactPreviews(
        definition,
        definitionNode,
        activitySummary,
        repositoryRoot
    );

    return {
        mode: 'run',
        selected_node_id: selectedNodeId,
        recoveryState: projection.recoveryState,
        summary: graphNode
            ? {
                  node_id: graphNode.node_id,
                  type: graphNode.type,
                  name: graphNode.name,
                  status_label: graphNode.status_label,
                  ...(graphNode.detail ? { detail: graphNode.detail } : {}),
              }
            : {
                  node_id: definitionNode.node_id,
                  type: definitionNode.type,
                  name: definitionNode.name,
                  status_label: 'Pending',
              },
        ...(definitionNode.type === 'activity' && activitySummary
            ? { activity: mapActivitySummary(activitySummary) }
            : {}),
        ...(retry ? { retry } : {}),
        ...(validationSummary ? { validation: mapValidationSummary(validationSummary) } : {}),
        ...(artifacts ? { artifacts } : {}),
        recovery_actions: buildRecoveryActions(
            definitionNode,
            graphNode,
            projection,
            activitySummary,
            validationSummary,
            definition,
            repositoryRoot
        ),
    };
}
