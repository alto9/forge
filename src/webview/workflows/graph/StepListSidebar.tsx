import React from 'react';
import type { WorkflowGraphStepListEntry } from '../../workflows/types';
import { getStepAccessibleName } from '../graphPresentation';

export type StepListSidebarProps = {
    steps: WorkflowGraphStepListEntry[];
    selectedNodeId?: string;
    onSelectStep: (nodeId: string) => void;
};

const listStyle: React.CSSProperties = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
};

const buttonBase: React.CSSProperties = {
    width: '100%',
    textAlign: 'left',
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: '4px',
    padding: '8px 10px',
    cursor: 'pointer',
    background: 'var(--vscode-editor-background)',
    color: 'var(--vscode-foreground)',
};

export function StepListSidebar({
    steps,
    selectedNodeId,
    onSelectStep,
}: StepListSidebarProps): React.ReactElement {
    return (
        <nav aria-label="Workflow steps">
            <h2
                style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    margin: '0 0 8px 0',
                }}
            >
                Steps
            </h2>
            <ol style={listStyle} role="list">
                {steps.map((step, index) => {
                    const selected = selectedNodeId === step.node_id;
                    return (
                        <li key={step.node_id}>
                            <button
                                type="button"
                                aria-current={selected ? 'step' : undefined}
                                aria-label={getStepAccessibleName(step)}
                                onClick={() => onSelectStep(step.node_id)}
                                style={{
                                    ...buttonBase,
                                    background: selected
                                        ? 'var(--vscode-list-activeSelectionBackground)'
                                        : buttonBase.background,
                                    color: selected
                                        ? 'var(--vscode-list-activeSelectionForeground)'
                                        : buttonBase.color,
                                }}
                            >
                                <div style={{ fontSize: '11px', opacity: 0.85 }}>
                                    Step {index + 1}
                                </div>
                                <div style={{ fontWeight: 600 }}>{step.name}</div>
                                <div style={{ fontSize: '12px', marginTop: '2px' }}>
                                    {step.status_label}
                                </div>
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
