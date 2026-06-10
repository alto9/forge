import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QuestionPanelForm } from './QuestionPanelForm';
import type { QuestionPanelWebviewModel } from './questionsPresentation';

declare const acquireVsCodeApi: () => {
    postMessage: (message: unknown) => void;
};

const vscode = acquireVsCodeApi();

function QuestionPanelApp(): React.ReactElement {
    const [model, setModel] = useState<QuestionPanelWebviewModel>({
        header: 'Question Panel',
        workflowName: '',
        drafts: {},
    });

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            const message = event.data as {
                type?: string;
                payload?: QuestionPanelWebviewModel;
            };
            if (message.type === 'init' && message.payload) {
                setModel(message.payload);
            }
        };

        window.addEventListener('message', handler);
        vscode.postMessage({ type: 'ready' });
        return () => window.removeEventListener('message', handler);
    }, []);

    const onDraftChange = useCallback((drafts: Record<string, string>) => {
        vscode.postMessage({ type: 'draftUpdate', drafts });
    }, []);

    const onSubmit = useCallback((drafts: Record<string, string>) => {
        vscode.postMessage({ type: 'submit', drafts });
    }, []);

    const onDiscardDraft = useCallback(() => {
        vscode.postMessage({ type: 'discardDraft' });
    }, []);

    return (
        <QuestionPanelForm
            model={model}
            onDraftChange={onDraftChange}
            onSubmit={onSubmit}
            onDiscardDraft={onDiscardDraft}
        />
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(<QuestionPanelApp />);
}
