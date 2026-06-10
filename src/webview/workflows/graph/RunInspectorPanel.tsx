import React, { useState } from 'react';
import type {
    RunInspectorDetail,
    RunInspectorRecoveryActionId,
} from '../../../workflows/types';
import {
    formatActivityStatusLabel,
    formatRetryLabel,
    getArtifactPreviewDescription,
    getDiagnosticAccessibleName,
    RUN_INSPECTOR_COPY,
} from '../runInspectorPresentation';

export type RunInspectorPanelProps = {
    detail?: RunInspectorDetail;
    onRecoveryAction: (actionId: RunInspectorRecoveryActionId) => void;
};

const panelStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    overflow: 'auto',
    boxSizing: 'border-box',
    padding: '12px',
};

const sectionStyle: React.CSSProperties = {
    marginBottom: '16px',
};

const sectionTitle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    opacity: 0.85,
};

const fieldRow: React.CSSProperties = {
    fontSize: '12px',
    marginBottom: '4px',
};

const previewBox: React.CSSProperties = {
    marginTop: '6px',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid var(--vscode-panel-border)',
    background: 'var(--vscode-textCodeBlock-background, var(--vscode-editor-background))',
    fontFamily: 'var(--vscode-editor-font-family, monospace)',
    fontSize: '11px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '200px',
    overflow: 'auto',
};

const bannerStyle: React.CSSProperties = {
    marginTop: '6px',
    padding: '6px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    background: 'var(--vscode-inputValidation-infoBackground)',
    color: 'var(--vscode-inputValidation-infoForeground)',
    border: '1px solid var(--vscode-inputValidation-infoBorder)',
};

const actionButton: React.CSSProperties = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    marginBottom: '6px',
    padding: '6px 10px',
    borderRadius: '4px',
    border: '1px solid var(--vscode-button-border, var(--vscode-panel-border))',
    background: 'var(--vscode-button-secondaryBackground, var(--vscode-editor-background))',
    color: 'var(--vscode-button-secondaryForeground, var(--vscode-foreground))',
    cursor: 'pointer',
    fontSize: '12px',
};

const disabledReasonStyle: React.CSSProperties = {
    fontSize: '11px',
    opacity: 0.85,
    marginTop: '2px',
    marginBottom: '8px',
};

function ValidationDiagnostics({
    diagnostics,
}: {
    diagnostics: RunInspectorDetail['validation'];
}): React.ReactElement | null {
    const [expanded, setExpanded] = useState(false);

    if (!diagnostics || diagnostics.diagnostics.length === 0) {
        return null;
    }

    return (
        <div>
            <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
                style={{
                    ...actionButton,
                    fontWeight: 600,
                }}
            >
                {expanded ? 'Hide diagnostics' : 'Show diagnostics'}
            </button>
            {expanded ? (
                <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0 }} role="list">
                    {diagnostics.diagnostics.map((diagnostic, index) => (
                        <li
                            key={`${diagnostic.code}-${index}`}
                            style={{ ...fieldRow, marginBottom: '6px' }}
                            aria-label={getDiagnosticAccessibleName(diagnostic)}
                        >
                            <span style={{ fontWeight: 600 }}>{diagnostic.severity}: </span>
                            {diagnostic.code}: {diagnostic.message}
                            {diagnostic.path ? ` (${diagnostic.path})` : ''}
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}

function ArtifactPreview({
    artifact,
}: {
    artifact: NonNullable<RunInspectorDetail['artifacts']>[number];
}): React.ReactElement {
    const description = getArtifactPreviewDescription(artifact);

    return (
        <article style={{ marginBottom: '12px' }} aria-label={`Artifact ${artifact.artifact_id}`}>
            <div style={{ fontWeight: 600 }}>{artifact.artifact_id}</div>
            <div style={fieldRow}>{artifact.path}</div>
            <div style={fieldRow}>
                {artifact.size_bytes} bytes
                {artifact.sha256_prefix ? ` · sha256 ${artifact.sha256_prefix}…` : ''}
            </div>

            {artifact.preview_mode === 'glob_list' && artifact.glob_matches ? (
                <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }} role="list">
                    {artifact.glob_matches.map((match) => (
                        <li key={match} style={fieldRow}>
                            {match}
                        </li>
                    ))}
                    {artifact.overflow_count ? (
                        <li style={fieldRow}>{RUN_INSPECTOR_COPY.globOverflow(artifact.overflow_count)}</li>
                    ) : null}
                </ul>
            ) : null}

            {artifact.preview_text ? (
                <pre
                    style={previewBox}
                    aria-label={artifact.truncated ? RUN_INSPECTOR_COPY.truncatedBanner : artifact.path}
                >
                    {artifact.preview_text}
                </pre>
            ) : null}

            {artifact.truncated ? (
                <p style={bannerStyle} role="status">
                    {RUN_INSPECTOR_COPY.truncatedBanner}
                </p>
            ) : null}

            {artifact.preview_mode === 'metadata_only' ? (
                <p style={{ ...fieldRow, opacity: 0.85 }} aria-description={description}>
                    Metadata only (binary or unknown type)
                </p>
            ) : null}
        </article>
    );
}

export function RunInspectorPanel({
    detail,
    onRecoveryAction,
}: RunInspectorPanelProps): React.ReactElement {
    if (!detail) {
        return (
            <section style={panelStyle} aria-label="Run inspector">
                <p style={{ fontSize: '12px', opacity: 0.9 }} role="status">
                    Select a step to inspect activity output, validation, and artifacts.
                </p>
            </section>
        );
    }

    if (detail.empty_state) {
        return (
            <section style={panelStyle} aria-label="Run inspector">
                <p style={{ fontSize: '12px', opacity: 0.9 }} role="status">
                    {detail.empty_state}
                </p>
            </section>
        );
    }

    return (
        <section style={panelStyle} aria-label="Run inspector">
            {detail.mode === 'definition' ? (
                <p style={{ fontSize: '12px', marginBottom: '12px' }} role="status">
                    {RUN_INSPECTOR_COPY.definitionMode}
                </p>
            ) : null}

            {detail.summary ? (
                <div style={sectionStyle}>
                    <h3 style={sectionTitle}>Summary</h3>
                    <div style={{ fontWeight: 600 }}>{detail.summary.name}</div>
                    <div style={fieldRow}>{detail.summary.type}</div>
                    <div style={fieldRow}>{detail.summary.status_label}</div>
                    {detail.summary.detail ? (
                        <div style={{ ...fieldRow, opacity: 0.9 }}>{detail.summary.detail}</div>
                    ) : null}
                </div>
            ) : null}

            {detail.activity ? (
                <div style={sectionStyle}>
                    <h3 style={sectionTitle}>Activity</h3>
                    <div style={fieldRow}>
                        {formatActivityStatusLabel(
                            detail.activity.status,
                            detail.activity.failure_class
                        )}
                    </div>
                    <div style={fieldRow}>Activity ID: {detail.activity.activity_id}</div>
                    <div style={fieldRow}>Agent: {detail.activity.cursor_agent_id}</div>
                    <div style={fieldRow}>Run ID: {detail.activity.cursor_run_id}</div>
                    <div style={fieldRow}>Output: {detail.activity.output_type}</div>
                    <div style={fieldRow}>
                        Retryable: {detail.activity.retryable ? 'Yes' : 'No'}
                    </div>
                </div>
            ) : null}

            {detail.retry ? (
                <div style={sectionStyle}>
                    <h3 style={sectionTitle}>Retry</h3>
                    <p style={fieldRow} role="status">
                        {formatRetryLabel(detail.retry)}
                    </p>
                </div>
            ) : null}

            {detail.validation ? (
                <div style={sectionStyle}>
                    <h3 style={sectionTitle}>Validation</h3>
                    <p style={fieldRow} role="status">
                        {detail.validation.valid
                            ? RUN_INSPECTOR_COPY.validationPassed
                            : RUN_INSPECTOR_COPY.validationFailed}
                    </p>
                    {detail.validation.valid ? (
                        <div style={fieldRow}>
                            {detail.validation.validator_outcomes
                                .map((outcome) => outcome.validator_id)
                                .join(', ')}
                        </div>
                    ) : (
                        <ValidationDiagnostics diagnostics={detail.validation} />
                    )}
                </div>
            ) : null}

            {detail.artifacts ? (
                <div style={sectionStyle}>
                    <h3 style={sectionTitle}>Artifacts</h3>
                    {detail.artifacts.length === 0 ? (
                        <p style={fieldRow}>{RUN_INSPECTOR_COPY.emptyArtifacts}</p>
                    ) : (
                        detail.artifacts.map((artifact) => (
                            <ArtifactPreview key={artifact.artifact_id} artifact={artifact} />
                        ))
                    )}
                </div>
            ) : null}

            {detail.recovery_actions && detail.recovery_actions.length > 0 ? (
                <footer style={sectionStyle}>
                    <h3 style={sectionTitle}>Recovery actions</h3>
                    {detail.recovery_actions.map((action) => (
                        <div key={action.action_id}>
                            <button
                                type="button"
                                disabled={!action.enabled}
                                onClick={() => onRecoveryAction(action.action_id)}
                                style={{
                                    ...actionButton,
                                    opacity: action.enabled ? 1 : 0.6,
                                    cursor: action.enabled ? 'pointer' : 'not-allowed',
                                }}
                            >
                                {action.label}
                            </button>
                            {!action.enabled && action.disabled_reason ? (
                                <p style={disabledReasonStyle} role="status">
                                    {action.disabled_reason}
                                </p>
                            ) : null}
                        </div>
                    ))}
                </footer>
            ) : null}
        </section>
    );
}
