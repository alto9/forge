import type {
    RunInspectorActivityDiagnostic,
    RunInspectorArtifactPreview,
    RunInspectorRecoveryAction,
    RunInspectorRetryBlock,
    RunInspectorValidationDiagnostic,
} from '../../workflows/types';

export const RUN_INSPECTOR_COPY = {
    definitionMode:
        'Definition — select a run to inspect live activity and validation results.',
    emptyArtifacts: 'No artifacts for this step.',
    validationPassed: 'Validated',
    validationFailed: 'Validation failed',
    truncatedBanner: 'Showing first 32 KiB — open in editor for full file.',
    globOverflow: (count: number) => `+ ${count} more — open in editor.`,
} as const;

export function formatActivityStatusLabel(
    status: string,
    failureClass?: string
): string {
    if (status === 'finished') {
        return 'Activity finished';
    }
    if (status === 'error') {
        return failureClass ? `Activity failed — ${failureClass}` : 'Activity failed';
    }
    return status;
}

export function formatRetryLabel(retry: RunInspectorRetryBlock): string {
    if (retry.in_progress) {
        return `Automatic retry ${retry.attempt} of ${retry.max}`;
    }
    return `Retry ${retry.attempt} of ${retry.max}`;
}

export function getDiagnosticAccessibleName(
    diagnostic: RunInspectorActivityDiagnostic | RunInspectorValidationDiagnostic
): string {
    const severity = diagnostic.severity.toUpperCase();
    return `${severity}: ${diagnostic.code}: ${diagnostic.message}`;
}

export function getArtifactPreviewDescription(artifact: RunInspectorArtifactPreview): string {
    if (artifact.preview_mode === 'truncated' || artifact.truncated) {
        return RUN_INSPECTOR_COPY.truncatedBanner;
    }
    if (artifact.preview_mode === 'metadata_only') {
        return `Binary artifact ${artifact.artifact_id}, ${artifact.size_bytes} bytes`;
    }
    return artifact.path;
}

export function isRecoveryActionDisabled(action: RunInspectorRecoveryAction): boolean {
    return !action.enabled;
}
