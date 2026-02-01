import React from 'react';
import { createRoot } from 'react-dom/client';

// Acquire VSCode API once at module level
const vscode = typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : undefined;

interface GitHubIssue {
    number: number;
    title: string;
    body: string;
    html_url: string;
    state: string;
    labels: Array<{ name: string; color: string }>;
}

interface ScribeData {
    owner: string;
    repo: string;
    issueNumber: number;
    issue: GitHubIssue;
    subIssues: GitHubIssue[];
}

function App() {
    const [data, setData] = React.useState<ScribeData | null>(null);

    React.useEffect(() => {
        // Request initial data
        vscode?.postMessage({ type: 'getInitialData' });

        // Listen for messages from extension
        function handleMessage(event: MessageEvent) {
            const msg = event.data;
            
            if (msg?.type === 'initialData') {
                console.log('Scribe: Received initialData', msg.data);
                setData(msg.data);
            }
            
            if (msg?.type === 'subIssuesUpdated') {
                console.log('Scribe: Received subIssuesUpdated', msg.subIssues);
                // Always update when we receive sub-issues update
                // Use functional update to avoid stale closure
                setData(prevData => {
                    if (prevData) {
                        return { ...prevData, subIssues: msg.subIssues };
                    } else if (msg.subIssues) {
                        // If we don't have prevData yet, create initial structure
                        // This shouldn't happen, but handle it gracefully
                        return {
                            owner: '',
                            repo: '',
                            issueNumber: 0,
                            issue: { number: 0, title: '', body: '', html_url: '', state: 'open', labels: [] },
                            subIssues: msg.subIssues
                        };
                    }
                    return prevData;
                });
            }
            
            if (msg?.type === 'error') {
                alert(`Error: ${msg.message}`);
            }
        }

        window.addEventListener('message', handleMessage);
        
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const handleCloseSession = () => {
        if (confirm('Close this session and mark the parent issue as Ready?')) {
            vscode?.postMessage({ type: 'closeSession' });
        }
    };

    if (!data) {
        return (
            <div style={{ padding: 32, textAlign: 'center' }}>
                <div>Loading...</div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                    <h1 style={{ margin: 0, marginBottom: 8 }}>Scribe Mode</h1>
                    <div style={{ fontSize: 13, opacity: 0.8 }}>
                        <a 
                            href={data.issue.html_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: 'var(--vscode-textLink-foreground)' }}
                        >
                            Parent Issue: #{data.issueNumber} - {data.issue.title}
                        </a>
                    </div>
                </div>
                <button
                    onClick={handleCloseSession}
                    style={{
                        padding: '8px 16px',
                        background: 'var(--vscode-button-secondaryBackground)',
                        color: 'var(--vscode-button-secondaryForeground)',
                        border: '1px solid var(--vscode-button-border)',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600
                    }}
                >
                    Close Session
                </button>
            </div>

            {/* Instructions Panel */}
            <div style={{
                marginBottom: 24,
                padding: 16,
                background: 'var(--vscode-editor-inactiveSelectionBackground)',
                borderRadius: 4,
                border: '1px solid var(--vscode-panel-border)'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>How to Use Scribe Mode</h3>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                    <p style={{ marginTop: 0 }}>
                        Use the <strong>forge-scribe</strong> command in Cursor or the <strong>@forge-scribe</strong> persona in VS Code Chat to create sub-issues.
                    </p>
                    <p>
                        The goal is to create sub-issues on the parent issue that are populated with accurate technical implementation steps and test procedures.
                        Sub-issues created via the forge-scribe command will automatically be linked to the parent issue and appear in this view.
                    </p>
                    <p>
                        <strong>This view refreshes automatically</strong> every 5 seconds to show newly created sub-issues.
                    </p>
                </div>
            </div>

            {/* Parent Issue Reference (Reduced View) */}
            <div style={{
                marginBottom: 24,
                padding: 12,
                background: 'var(--vscode-editor-inactiveSelectionBackground)',
                borderRadius: 4,
                border: '1px solid var(--vscode-panel-border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                    <span style={{ opacity: 0.7 }}>Parent Issue:</span>
                    <a 
                        href={data.issue.html_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                            color: 'var(--vscode-textLink-foreground)',
                            fontWeight: 600,
                            textDecoration: 'none'
                        }}
                    >
                        #{data.issueNumber} - {data.issue.title}
                    </a>
                    <span style={{
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 11,
                        background: data.issue.state === 'open' ? 'var(--vscode-charts-green)' : 'var(--vscode-charts-red)',
                        color: 'var(--vscode-editor-background)'
                    }}>
                        {data.issue.state}
                    </span>
                </div>
            </div>

            {/* Sub-issues Table */}
            <div style={{
                marginBottom: 24,
                padding: 16,
                background: 'var(--vscode-editor-inactiveSelectionBackground)',
                borderRadius: 4
            }}>
                    <div style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0 }}>Sub-issues ({data.subIssues?.length || 0})</h3>
                </div>

                {/* Sub-issues Table */}
                {data.subIssues && data.subIssues.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--vscode-panel-border)' }}>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, opacity: 0.7 }}>Number</th>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, opacity: 0.7 }}>Title</th>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, opacity: 0.7 }}>Status</th>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, opacity: 0.7 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.subIssues.map((subIssue) => (
                                <tr key={subIssue.number} style={{ borderBottom: '1px solid var(--vscode-panel-border)' }}>
                                    <td style={{ padding: '12px', fontSize: 13 }}>
                                        <a
                                            href={subIssue.html_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: 'var(--vscode-textLink-foreground)' }}
                                        >
                                            #{subIssue.number}
                                        </a>
                                    </td>
                                    <td style={{ padding: '12px', fontSize: 13 }}>{subIssue.title}</td>
                                    <td style={{ padding: '12px', fontSize: 13 }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: 10,
                                            fontSize: 11,
                                            background: subIssue.state === 'open' ? 'var(--vscode-charts-green)' : 'var(--vscode-charts-red)',
                                            color: 'var(--vscode-editor-background)'
                                        }}>
                                            {subIssue.state}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <a
                                            href={subIssue.html_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: 'var(--vscode-textLink-foreground)',
                                                fontSize: 12,
                                                textDecoration: 'none'
                                            }}
                                        >
                                            View →
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ padding: 24, textAlign: 'center', opacity: 0.6 }}>
                        No sub-issues yet. Create one to get started.
                    </div>
                )}
            </div>
        </div>
    );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
