import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    CATALOG_EMPTY_STATE_COPY,
    CATALOG_RUN_TOOLTIP,
    catalogEntryRequiresRunInputCollection,
    getCatalogBadgeLabel,
    getCatalogRowSummary,
    type WorkflowCatalogWebviewModel,
} from './catalogPresentation';
import type { WorkflowRunInputDefinition } from '../../workflows/types';

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

type RowRunState = {
    collectingInputs: boolean;
    inputValues: Record<string, string>;
    inFlight: boolean;
    statusMessage?: string;
};

function initialInputValues(runInputs: WorkflowRunInputDefinition[] | undefined): Record<string, string> {
    const values: Record<string, string> = {};
    for (const descriptor of runInputs ?? []) {
        values[descriptor.input_id] = '';
    }
    return values;
}

function WorkflowCatalogApp(): React.ReactElement {
    const [model, setModel] = useState<WorkflowCatalogWebviewModel>({
        repositoryRoot: '',
        repositoryName: '',
        entries: [],
    });
    const [expandedWorkflowId, setExpandedWorkflowId] = useState<string | undefined>();
    const [rowRunState, setRowRunState] = useState<Record<string, RowRunState>>({});

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            const message = event.data as {
                type?: string;
                payload?: WorkflowCatalogWebviewModel;
                workflowId?: string;
                ok?: boolean;
                message?: string;
            };

            if (message?.type === 'init' && message.payload) {
                setModel(message.payload);
                return;
            }

            if (message?.type === 'startRunResult' && typeof message.workflowId === 'string') {
                setRowRunState((current) => ({
                    ...current,
                    [message.workflowId!]: {
                        collectingInputs: false,
                        inputValues: current[message.workflowId!]?.inputValues ?? {},
                        inFlight: false,
                        statusMessage: message.ok
                            ? CATALOG_RUN_TOOLTIP.succeeded
                            : `${CATALOG_RUN_TOOLTIP.failed}${message.message ? ` — ${message.message}` : '.'}`,
                    },
                }));
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

    const getRowState = (workflowId: string, runInputs: WorkflowRunInputDefinition[] | undefined): RowRunState => {
        return (
            rowRunState[workflowId] ?? {
                collectingInputs: false,
                inputValues: initialInputValues(runInputs),
                inFlight: false,
            }
        );
    };

    const updateRowInput = (workflowId: string, inputId: string, value: string) => {
        setRowRunState((current) => {
            const existing = current[workflowId] ?? {
                collectingInputs: true,
                inputValues: {},
                inFlight: false,
            };
            return {
                ...current,
                [workflowId]: {
                    ...existing,
                    inputValues: {
                        ...existing.inputValues,
                        [inputId]: value,
                    },
                },
            };
        });
    };

    const submitStartRun = (workflowId: string, runInputs: Record<string, string>) => {
        setRowRunState((current) => ({
            ...current,
            [workflowId]: {
                collectingInputs: false,
                inputValues: runInputs,
                inFlight: true,
                statusMessage: CATALOG_RUN_TOOLTIP.inFlight,
            },
        }));
        vscode.postMessage({ type: 'startRun', workflowId, runInputs });
    };

    const handleStartRunClick = (
        workflowId: string,
        requiresInputCollection: boolean,
        runInputs: WorkflowRunInputDefinition[] | undefined
    ) => {
        const state = getRowState(workflowId, runInputs);

        if (requiresInputCollection && !state.collectingInputs) {
            setRowRunState((current) => ({
                ...current,
                [workflowId]: {
                    collectingInputs: true,
                    inputValues: initialInputValues(runInputs),
                    inFlight: false,
                    statusMessage: undefined,
                },
            }));
            return;
        }

        if (requiresInputCollection) {
            const missingRequired = (runInputs ?? []).some(
                (descriptor) =>
                    descriptor.required === true &&
                    (state.inputValues[descriptor.input_id] ?? '').trim().length === 0
            );
            if (missingRequired) {
                setRowRunState((current) => ({
                    ...current,
                    [workflowId]: {
                        ...state,
                        statusMessage: CATALOG_RUN_TOOLTIP.requiresInputs,
                    },
                }));
                return;
            }
        }

        submitStartRun(workflowId, state.inputValues);
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
                        const requiresInputCollection = catalogEntryRequiresRunInputCollection(entry);
                        const rowState = getRowState(entry.workflow_id, entry.run_inputs);
                        const startDisabled = runDisabled || rowState.inFlight;
                        const runTooltip = runDisabled
                            ? CATALOG_RUN_TOOLTIP.invalid
                            : rowState.inFlight
                              ? CATALOG_RUN_TOOLTIP.inFlight
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
                                            {rowState.statusMessage ? (
                                                <div
                                                    style={{ fontSize: '12px', marginTop: '4px' }}
                                                    aria-live="polite"
                                                >
                                                    {rowState.statusMessage}
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

                                {rowState.collectingInputs && entry.run_inputs?.length ? (
                                    <div
                                        role="form"
                                        aria-label={`Run inputs for ${entry.name}`}
                                        style={{
                                            marginTop: '8px',
                                            padding: '8px 12px',
                                            border: '1px solid var(--vscode-panel-border)',
                                            borderRadius: '4px',
                                        }}
                                    >
                                        {entry.run_inputs.map((descriptor) => (
                                            <label
                                                key={descriptor.input_id}
                                                style={{
                                                    display: 'block',
                                                    marginBottom: '10px',
                                                }}
                                            >
                                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                                    {descriptor.label}
                                                    {descriptor.required ? ' (required)' : ''}
                                                </div>
                                                {descriptor.description ? (
                                                    <div
                                                        style={{
                                                            fontSize: '12px',
                                                            opacity: 0.85,
                                                            marginBottom: '4px',
                                                        }}
                                                    >
                                                        {descriptor.description}
                                                    </div>
                                                ) : null}
                                                <input
                                                    type="text"
                                                    aria-required={descriptor.required === true}
                                                    value={rowState.inputValues[descriptor.input_id] ?? ''}
                                                    onChange={(event) =>
                                                        updateRowInput(
                                                            entry.workflow_id,
                                                            descriptor.input_id,
                                                            event.target.value
                                                        )
                                                    }
                                                    style={{
                                                        width: '100%',
                                                        boxSizing: 'border-box',
                                                    }}
                                                />
                                                {descriptor.validation_hint ? (
                                                    <div
                                                        style={{
                                                            fontSize: '11px',
                                                            opacity: 0.8,
                                                            marginTop: '4px',
                                                        }}
                                                    >
                                                        {descriptor.validation_hint}
                                                    </div>
                                                ) : null}
                                            </label>
                                        ))}
                                    </div>
                                ) : null}

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
                                        aria-disabled={startDisabled}
                                        disabled={startDisabled}
                                        title={runTooltip}
                                        style={{ opacity: startDisabled ? 0.6 : 1 }}
                                        onClick={() =>
                                            handleStartRunClick(
                                                entry.workflow_id,
                                                requiresInputCollection,
                                                entry.run_inputs
                                            )
                                        }
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
