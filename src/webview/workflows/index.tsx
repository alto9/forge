import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    CATALOG_EMPTY_STATE_COPY,
    CATALOG_RUN_TOOLTIP,
    getCatalogBadgeLabel,
    getCatalogRowSummary,
    type WorkflowCatalogWebviewModel,
} from './catalogPresentation';

declare const acquireVsCodeApi: () => {
    postMessage: (message: unknown) => void;
};

const vscode = acquireVsCodeApi();

const shell: React.CSSProperties = {
    fontFamily: 'var(--vscode-font-family), system-ui, -apple-system, Segoe UI, sans-serif',
    fontSize: 'var(--vscode-font-size, 13px)',
    color: 'var(--vscode-foreground)',
    background: 'var(--vscode-editor-background)',
    padding: '12px 16px',
    boxSizing: 'border-box',
    minHeight: '100vh',
};

const heading: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 600,
    margin: '0 0 4px 0',
};

const sub: React.CSSProperties = {
    opacity: 0.85,
    margin: '0 0 16px 0',
    fontSize: '12px',
};

const listStyle: React.CSSProperties = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
};

function badgeStyle(valid: boolean, hasWarnings: boolean): React.CSSProperties {
    if (!valid) {
        return {
            background: 'var(--vscode-inputValidation-errorBackground, #5a1d1d)',
            color: 'var(--vscode-inputValidation-errorForeground, #f48771)',
            border: '1px solid var(--vscode-inputValidation-errorBorder, #be1100)',
        };
    }
    if (hasWarnings) {
        return {
            background: 'var(--vscode-inputValidation-warningBackground, #352a05)',
            color: 'var(--vscode-inputValidation-warningForeground, #cca700)',
            border: '1px solid var(--vscode-inputValidation-warningBorder, #b89500)',
        };
    }
    return {
        background: 'var(--vscode-badge-background)',
        color: 'var(--vscode-badge-foreground)',
        border: '1px solid var(--vscode-panel-border)',
    };
}

function WorkflowCatalogApp(): React.ReactElement {
    const [model, setModel] = useState<WorkflowCatalogWebviewModel>({
        repositoryRoot: '',
        repositoryName: '',
        entries: [],
    });
    const [expandedWorkflowId, setExpandedWorkflowId] = useState<string | undefined>();

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            const message = event.data as { type?: string; payload?: WorkflowCatalogWebviewModel };
            if (message?.type === 'init' && message.payload) {
                setModel(message.payload);
            }
        };

        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    const emptyCopy = useMemo(() => {
        if (!model.emptyState) {
            return undefined;
        }
        return CATALOG_EMPTY_STATE_COPY[model.emptyState];
    }, [model.emptyState]);

    const selectWorkflow = (workflowId: string) => {
        vscode.postMessage({ type: 'selectWorkflow', workflowId });
        setModel((current) => ({ ...current, selectedWorkflowId: workflowId }));
    };

    return (
        <div style={shell}>
            <h1 style={heading}>Workflow Catalog</h1>
            <p style={sub}>
                {model.repositoryName
                    ? `Repository folder: ${model.repositoryName}`
                    : 'Discover workflow definitions from `.ai/workflows/`.'}
            </p>

            {emptyCopy ? (
                <p role="status">{emptyCopy}</p>
            ) : (
                <ul style={listStyle} role="listbox" aria-label="Workflow definitions">
                    {model.entries.map((entry) => {
                        const selected = model.selectedWorkflowId === entry.workflow_id;
                        const badgeLabel = getCatalogBadgeLabel(entry);
                        const summary = getCatalogRowSummary(entry);
                        const expanded = expandedWorkflowId === entry.workflow_id;
                        const runDisabled = !entry.validation.valid;
                        const runTooltip = runDisabled
                            ? CATALOG_RUN_TOOLTIP.invalid
                            : CATALOG_RUN_TOOLTIP.valid;

                        return (
                            <li key={entry.workflow_id}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={selected}
                                    aria-label={`${entry.name}, ${badgeLabel}, ${entry.workflow_id}`}
                                    onClick={() => selectWorkflow(entry.workflow_id)}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        background: selected
                                            ? 'var(--vscode-list-activeSelectionBackground)'
                                            : 'var(--vscode-editor-background)',
                                        color: selected
                                            ? 'var(--vscode-list-activeSelectionForeground)'
                                            : 'var(--vscode-foreground)',
                                        border: '1px solid var(--vscode-panel-border)',
                                        borderRadius: '4px',
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            gap: '12px',
                                            alignItems: 'flex-start',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{entry.name}</div>
                                            <div style={{ fontSize: '12px', opacity: 0.9 }}>
                                                {entry.workflow_id}
                                                {entry.version ? ` · v${entry.version}` : ''}
                                            </div>
                                            {entry.description ? (
                                                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                                                    {entry.description}
                                                </div>
                                            ) : null}
                                            {summary ? (
                                                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                                                    {summary}
                                                </div>
                                            ) : null}
                                        </div>
                                        <span
                                            aria-label={`Validation status: ${badgeLabel}`}
                                            style={{
                                                ...badgeStyle(
                                                    entry.validation.valid,
                                                    entry.validation.warningCount > 0
                                                ),
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                padding: '2px 8px',
                                                borderRadius: '10px',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {badgeLabel}
                                        </span>
                                    </div>
                                </button>

                                <div style={{ margin: '8px 0 0 4px', display: 'flex', gap: '8px' }}>
                                    <button
                                        type="button"
                                        aria-expanded={expanded}
                                        onClick={() =>
                                            setExpandedWorkflowId(
                                                expanded ? undefined : entry.workflow_id
                                            )
                                        }
                                    >
                                        {expanded ? 'Hide diagnostics' : 'Show diagnostics'}
                                    </button>
                                    <button
                                        type="button"
                                        aria-disabled={runDisabled}
                                        disabled={runDisabled}
                                        title={runTooltip}
                                        style={{ opacity: runDisabled ? 0.6 : 1 }}
                                    >
                                        Start run
                                    </button>
                                    {!runDisabled ? (
                                        <span style={{ fontSize: '12px', alignSelf: 'center' }}>
                                            {runTooltip}
                                        </span>
                                    ) : (
                                        <span
                                            style={{ fontSize: '12px', alignSelf: 'center' }}
                                            aria-live="polite"
                                        >
                                            {runTooltip}
                                        </span>
                                    )}
                                </div>

                                {expanded ? (
                                    <div
                                        role="region"
                                        aria-label={`Diagnostics for ${entry.name}`}
                                        style={{
                                            marginTop: '8px',
                                            padding: '8px 12px',
                                            border: '1px solid var(--vscode-panel-border)',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                        }}
                                    >
                                        <div style={{ marginBottom: '6px', opacity: 0.85 }}>
                                            {entry.path}
                                        </div>
                                        {entry.validation.diagnostics.length === 0 ? (
                                            <div>No diagnostics.</div>
                                        ) : (
                                            <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                                {entry.validation.diagnostics.map(
                                                    (diagnostic, index) => (
                                                        <li key={`${diagnostic.code}-${index}`}>
                                                            <strong>
                                                                {diagnostic.severity === 'error'
                                                                    ? 'Error'
                                                                    : 'Warning'}
                                                            </strong>
                                                            {`: ${diagnostic.message}`}
                                                            {diagnostic.path
                                                                ? ` (${diagnostic.path})`
                                                                : ''}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                ) : null}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(<WorkflowCatalogApp />);
}
