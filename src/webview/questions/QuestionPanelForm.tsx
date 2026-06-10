import React, { useCallback, useEffect, useState } from 'react';
import type { PendingHumanQuestion } from '../../temporal/workflowRunProjection';
import {
    getPromptAccessibleName,
    QUESTION_PANEL_COPY,
    shouldShowBatchFooter,
    type QuestionPanelWebviewModel,
} from './questionsPresentation';

export type QuestionPanelFormProps = {
    model: QuestionPanelWebviewModel;
    onDraftChange: (drafts: Record<string, string>) => void;
    onSubmit: (drafts: Record<string, string>) => void;
    onDiscardDraft: () => void;
};

const shell: React.CSSProperties = {
    fontFamily: 'var(--vscode-font-family), system-ui, -apple-system, Segoe UI, sans-serif',
    fontSize: 'var(--vscode-font-size, 13px)',
    color: 'var(--vscode-foreground)',
    background: 'var(--vscode-editor-background)',
    padding: '16px',
    boxSizing: 'border-box',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
};

const headerStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 600,
    margin: 0,
};

const bannerStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '4px',
    background: 'var(--vscode-inputValidation-warningBackground, #352a05)',
    color: 'var(--vscode-inputValidation-warningForeground, #cca700)',
    border: '1px solid var(--vscode-inputValidation-warningBorder, #b89500)',
};

const errorStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '4px',
    background: 'var(--vscode-inputValidation-errorBackground, #5a1d1d)',
    color: 'var(--vscode-inputValidation-errorForeground, #f48771)',
    border: '1px solid var(--vscode-inputValidation-errorBorder, #be1100)',
};

const successStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '4px',
    background: 'var(--vscode-editorInfo-background, #063b49)',
    color: 'var(--vscode-editorInfo-foreground, #3794ff)',
    border: '1px solid var(--vscode-editorInfo-border, #007acc)',
};

const promptBlock: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
};

const labelRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
};

const badgeStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: '3px',
    background: 'var(--vscode-inputValidation-errorBackground, #5a1d1d)',
    color: 'var(--vscode-inputValidation-errorForeground, #f48771)',
    border: '1px solid var(--vscode-inputValidation-errorBorder, #be1100)',
};

const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '72px',
    resize: 'vertical',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    color: 'var(--vscode-input-foreground)',
    background: 'var(--vscode-input-background)',
    border: '1px solid var(--vscode-input-border)',
    borderRadius: '2px',
    padding: '8px',
    boxSizing: 'border-box',
};

const footerStyle: React.CSSProperties = {
    fontSize: '12px',
    opacity: 0.85,
};

const actionsRow: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
};

const primaryButton: React.CSSProperties = {
    padding: '6px 14px',
    fontSize: '13px',
    cursor: 'pointer',
    background: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    border: 'none',
    borderRadius: '2px',
};

const secondaryButton: React.CSSProperties = {
    ...primaryButton,
    background: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
};

const helperStyle: React.CSSProperties = {
    fontSize: '12px',
    opacity: 0.9,
    margin: 0,
};

function mergeDrafts(
    question: PendingHumanQuestion | undefined,
    serverDrafts: Record<string, string>
): Record<string, string> {
    if (!question) {
        return {};
    }

    const merged: Record<string, string> = {};
    for (const prompt of question.prompts) {
        merged[prompt.field_id] = serverDrafts[prompt.field_id] ?? '';
    }
    return merged;
}

export function QuestionPanelForm({
    model,
    onDraftChange,
    onSubmit,
    onDiscardDraft,
}: QuestionPanelFormProps): React.ReactElement {
    const [drafts, setDrafts] = useState<Record<string, string>>(() =>
        mergeDrafts(model.pendingQuestion, model.drafts)
    );

    useEffect(() => {
        setDrafts(mergeDrafts(model.pendingQuestion, model.drafts));
    }, [model.pendingQuestion?.question_id, model.drafts, model.pendingQuestion]);

    const handleDraftChange = useCallback(
        (fieldId: string, value: string) => {
            setDrafts((current) => {
                const next = { ...current, [fieldId]: value };
                onDraftChange(next);
                return next;
            });
        },
        [onDraftChange]
    );

    if (model.emptyState || !model.pendingQuestion) {
        return (
            <main style={shell}>
                <h1 style={headerStyle}>Question Panel</h1>
                <p>{model.statusMessage ?? QUESTION_PANEL_COPY.noPending}</p>
            </main>
        );
    }

    const question = model.pendingQuestion;
    const showBatchFooter = shouldShowBatchFooter(question, model.batchTotal);

    return (
        <main style={shell}>
            <h1 style={headerStyle}>{model.header}</h1>

            {model.stale ? <div style={bannerStyle}>{QUESTION_PANEL_COPY.staleQuestion}</div> : null}

            {model.validationError ? <div style={errorStyle}>{model.validationError}</div> : null}

            {model.statusMessage && !model.validationError ? (
                <div style={model.statusMessage === QUESTION_PANEL_COPY.submitSuccess ? successStyle : bannerStyle}>
                    {model.statusMessage}
                </div>
            ) : null}

            {question.prompts.map((prompt) => (
                <div key={prompt.field_id} style={promptBlock}>
                    <div style={labelRow}>
                        <label htmlFor={`prompt-${prompt.field_id}`}>{prompt.label}</label>
                        {prompt.blocker ? (
                            <span style={badgeStyle} aria-hidden="true">
                                {QUESTION_PANEL_COPY.blockerBadge}
                            </span>
                        ) : null}
                    </div>
                    <textarea
                        id={`prompt-${prompt.field_id}`}
                        aria-label={getPromptAccessibleName(prompt)}
                        style={textareaStyle}
                        value={drafts[prompt.field_id] ?? ''}
                        disabled={model.stale === true}
                        onChange={(event) => handleDraftChange(prompt.field_id, event.target.value)}
                    />
                </div>
            ))}

            {showBatchFooter && model.batchTotal !== undefined ? (
                <p style={footerStyle}>
                    {QUESTION_PANEL_COPY.batchFooter(question.prompts.length, model.batchTotal)}
                </p>
            ) : null}

            {model.submitDisabledReason && !model.stale ? (
                <p style={helperStyle} id="submit-disabled-reason">
                    {model.submitDisabledReason}
                </p>
            ) : null}

            <div style={actionsRow}>
                <button
                    type="button"
                    style={{
                        ...primaryButton,
                        opacity: model.submitDisabled ? 0.6 : 1,
                        cursor: model.submitDisabled ? 'not-allowed' : 'pointer',
                    }}
                    disabled={model.submitDisabled === true}
                    aria-busy={model.submitting === true}
                    aria-describedby={
                        model.submitDisabledReason ? 'submit-disabled-reason' : undefined
                    }
                    onClick={() => onSubmit(drafts)}
                >
                    {QUESTION_PANEL_COPY.submitAnswers}
                </button>
                <button
                    type="button"
                    style={secondaryButton}
                    onClick={onDiscardDraft}
                >
                    {QUESTION_PANEL_COPY.discardDraft}
                </button>
            </div>
        </main>
    );
}
