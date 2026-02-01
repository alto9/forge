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
    milestone?: { title: string; number: number };
    assignees: Array<{ login: string }>;
}

interface RefinementData {
    owner: string;
    repo: string;
    issueNumber: number;
    issue: GitHubIssue;
}

function App() {
    const [data, setData] = React.useState<RefinementData | null>(null);
    const [parsedSections, setParsedSections] = React.useState<{
        title: string;
        problemStatement: string;
        businessValue: string;
        testingProcedures: string;
        definitionOfSuccess: string;
        definitionOfFailure: string;
    } | null>(null);
    const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);

    // Parse issue body into sections
    const parseIssueBody = React.useCallback((issue: GitHubIssue) => {
        const body = issue.body || '';
        
        // Helper function to extract section content
        const extractSection = (sectionName: string): string => {
            // Escape special regex characters in section name
            const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Match the section header (case-insensitive) followed by content
            // Pattern: ### Section Name[optional colon]\n[content](until next ### or end)
            // Use [\s\S]*? for non-greedy match of any character including newlines
            // Lookahead: either \n### (next section) or end of string
            // Allow optional colon after section name and flexible whitespace
            const regex = new RegExp(`###\\s+${escapedName}\\s*:?\\s*\\n([\\s\\S]*?)(?=\\n###\\s+|$)`, 'i');
            const match = body.match(regex);
            if (match && match[1]) {
                // Trim whitespace but preserve internal formatting
                return match[1].trim();
            }
            return '';
        };

        setParsedSections({
            title: issue.title,
            problemStatement: extractSection('Problem Statement'),
            businessValue: extractSection('Business Value'),
            testingProcedures: extractSection('Testing Procedures'),
            definitionOfSuccess: extractSection('Definition of Success'),
            definitionOfFailure: extractSection('Definition of Failure')
        });
    }, []);

    React.useEffect(() => {
        // Request initial data
        vscode?.postMessage({ type: 'getInitialData' });

        // Listen for messages from extension
        function handleMessage(event: MessageEvent) {
            const msg = event.data;
            
            if (msg?.type === 'initialData') {
                setData(msg.data);
                parseIssueBody(msg.data.issue);
                setLastUpdated(new Date());
            }
            
            if (msg?.type === 'issueUpdated') {
                // Always update when we receive an issue update
                // This panel is always for a specific issue, so we can trust the update
                setData(prevData => {
                    if (prevData) {
                        // Update existing data
                        parseIssueBody(msg.issue);
                        setLastUpdated(new Date());
                        return { ...prevData, issue: msg.issue };
                    } else {
                        // First update - parse and set initial data structure
                        parseIssueBody(msg.issue);
                        setLastUpdated(new Date());
                        // We don't have owner/repo yet, but we can extract from html_url if needed
                        // For now, return null and wait for initialData
                        return null;
                    }
                });
            }
        }

        window.addEventListener('message', handleMessage);
        
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [parseIssueBody]);

    if (!data || !parsedSections) {
        return (
            <div style={{ padding: 32, textAlign: 'center' }}>
                <div>Loading issue...</div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ margin: 0, marginBottom: 8 }}>Refinement Mode</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, opacity: 0.8 }}>
                    <a 
                        href={data.issue.html_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--vscode-textLink-foreground)' }}
                    >
                        #{data.issueNumber} - {data.issue.title}
                    </a>
                    {lastUpdated && (
                        <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                    )}
                </div>
            </div>

            {/* Instructions Panel */}
            <div style={{
                marginBottom: 24,
                padding: 16,
                background: 'var(--vscode-editor-inactiveSelectionBackground)',
                borderRadius: 4,
                border: '1px solid var(--vscode-panel-border)'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>How to Use Refinement Mode</h3>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                    <p style={{ marginTop: 0 }}>
                        Use the <strong>forge-refine</strong> command in Cursor or the <strong>@forge-refine</strong> persona in VS Code Chat to refine this issue.
                    </p>
                    <p>
                        <strong>This view is read-only.</strong> All edits are made through the agent, which will update the GitHub issue directly.
                        This view automatically refreshes every 5 seconds to show the latest issue content.
                    </p>
                    <p>
                        The goal is to ensure the business value is clearly spelled out and accurate, with testing procedures filled out from a BAU perspective.
                        Definition of success and failure must be clearly defined.
                    </p>
                </div>
            </div>

            {/* Issue Properties (View-only) */}
            <div style={{
                marginBottom: 24,
                padding: 16,
                background: 'var(--vscode-editor-inactiveSelectionBackground)',
                borderRadius: 4
            }}>
                <h3 style={{ marginTop: 0, marginBottom: 12 }}>Issue Properties</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', opacity: 0.7 }}>
                            State
                        </label>
                        <div style={{ fontSize: 13 }}>{data.issue.state}</div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', opacity: 0.7 }}>
                            Labels
                        </label>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {data.issue.labels.length > 0 ? (
                                data.issue.labels.map((label) => (
                                    <span
                                        key={label.name}
                                        style={{
                                            padding: '2px 8px',
                                            borderRadius: 10,
                                            fontSize: 11,
                                            background: `#${label.color}40`,
                                            color: 'var(--vscode-foreground)'
                                        }}
                                    >
                                        {label.name}
                                    </span>
                                ))
                            ) : (
                                <span style={{ fontSize: 12, opacity: 0.6 }}>No labels</span>
                            )}
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', opacity: 0.7 }}>
                            Assignees
                        </label>
                        <div style={{ fontSize: 13 }}>
                            {data.issue.assignees.length > 0 ? (
                                data.issue.assignees.map(a => `@${a.login}`).join(', ')
                            ) : (
                                <span style={{ opacity: 0.6 }}>No assignees</span>
                            )}
                        </div>
                    </div>
                    {data.issue.milestone && (
                        <div>
                            <label style={{ display: 'block', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', opacity: 0.7 }}>
                                Milestone
                            </label>
                            <div style={{ fontSize: 13 }}>{data.issue.milestone.title}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Issue Title (View-only) */}
            <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                    Issue Title
                </label>
                <div style={{
                    padding: '12px 16px',
                    fontSize: 16,
                    fontWeight: 600,
                    background: 'var(--vscode-editor-background)',
                    color: 'var(--vscode-editor-foreground)',
                    border: '1px solid var(--vscode-panel-border)',
                    borderRadius: 4
                }}>
                    {parsedSections.title}
                </div>
            </div>

            {/* Problem Statement (View-only) */}
            <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                    Problem Statement {parsedSections.problemStatement ? '' : '*'}
                </label>
                <div style={{
                    padding: '12px 16px',
                    fontSize: 13,
                    background: 'var(--vscode-editor-background)',
                    color: 'var(--vscode-editor-foreground)',
                    border: '1px solid var(--vscode-panel-border)',
                    borderRadius: 4,
                    minHeight: 80,
                    whiteSpace: 'pre-wrap'
                }}>
                    {parsedSections.problemStatement || <span style={{ opacity: 0.6, fontStyle: 'italic' }}>Not yet defined</span>}
                </div>
            </div>

            {/* Business Value (View-only) */}
            <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                    Business Value {parsedSections.businessValue ? '' : '*'}
                </label>
                <div style={{
                    padding: '12px 16px',
                    fontSize: 13,
                    background: 'var(--vscode-editor-background)',
                    color: 'var(--vscode-editor-foreground)',
                    border: '1px solid var(--vscode-panel-border)',
                    borderRadius: 4,
                    minHeight: 100,
                    whiteSpace: 'pre-wrap'
                }}>
                    {parsedSections.businessValue || <span style={{ opacity: 0.6, fontStyle: 'italic' }}>Not yet defined</span>}
                </div>
            </div>

            {/* Testing Procedures (View-only) */}
            <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                    Testing Procedures (BAU Perspective) {parsedSections.testingProcedures ? '' : '*'}
                </label>
                <div style={{
                    padding: '12px 16px',
                    fontSize: 13,
                    background: 'var(--vscode-editor-background)',
                    color: 'var(--vscode-editor-foreground)',
                    border: '1px solid var(--vscode-panel-border)',
                    borderRadius: 4,
                    minHeight: 120,
                    whiteSpace: 'pre-wrap'
                }}>
                    {parsedSections.testingProcedures || <span style={{ opacity: 0.6, fontStyle: 'italic' }}>Not yet defined</span>}
                </div>
            </div>

            {/* Definition of Success (View-only) */}
            <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                    Definition of Success {parsedSections.definitionOfSuccess ? '' : '*'}
                </label>
                <div style={{
                    padding: '12px 16px',
                    fontSize: 13,
                    background: 'var(--vscode-editor-background)',
                    color: 'var(--vscode-editor-foreground)',
                    border: '1px solid var(--vscode-panel-border)',
                    borderRadius: 4,
                    minHeight: 80,
                    whiteSpace: 'pre-wrap'
                }}>
                    {parsedSections.definitionOfSuccess || <span style={{ opacity: 0.6, fontStyle: 'italic' }}>Not yet defined</span>}
                </div>
            </div>

            {/* Definition of Failure (View-only) */}
            <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                    Definition of Failure {parsedSections.definitionOfFailure ? '' : '*'}
                </label>
                <div style={{
                    padding: '12px 16px',
                    fontSize: 13,
                    background: 'var(--vscode-editor-background)',
                    color: 'var(--vscode-editor-foreground)',
                    border: '1px solid var(--vscode-panel-border)',
                    borderRadius: 4,
                    minHeight: 80,
                    whiteSpace: 'pre-wrap'
                }}>
                    {parsedSections.definitionOfFailure || <span style={{ opacity: 0.6, fontStyle: 'italic' }}>Not yet defined</span>}
                </div>
            </div>

            {/* Navigation to Scribe Mode */}
            <div style={{
                padding: 16,
                background: 'var(--vscode-editor-inactiveSelectionBackground)',
                borderRadius: 4,
                border: '1px solid var(--vscode-panel-border)'
            }}>
                <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
                    <p style={{ margin: 0, marginBottom: 12 }}>
                        <strong>Ready to progress to Scribe mode?</strong> Once all required fields (*) are filled out, 
                        you can proceed to create sub-issues.
                    </p>
                    <button
                        onClick={() => {
                            // Check if all required fields are filled
                            const allFieldsFilled = 
                                parsedSections.problemStatement &&
                                parsedSections.businessValue &&
                                parsedSections.testingProcedures &&
                                parsedSections.definitionOfSuccess &&
                                parsedSections.definitionOfFailure;
                            
                            if (allFieldsFilled) {
                                vscode?.postMessage({ type: 'progressToScribe' });
                            } else {
                                // Show which fields are missing
                                const missing: string[] = [];
                                if (!parsedSections.problemStatement) missing.push('Problem Statement');
                                if (!parsedSections.businessValue) missing.push('Business Value');
                                if (!parsedSections.testingProcedures) missing.push('Testing Procedures');
                                if (!parsedSections.definitionOfSuccess) missing.push('Definition of Success');
                                if (!parsedSections.definitionOfFailure) missing.push('Definition of Failure');
                                
                                alert(`Please fill out all required fields before proceeding:\n\n${missing.join('\n')}`);
                            }
                        }}
                        style={{
                            padding: '8px 16px',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--vscode-button-foreground)',
                            background: 'var(--vscode-button-background)',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'var(--vscode-button-hoverBackground)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'var(--vscode-button-background)';
                        }}
                    >
                        Progress to Scribe Mode →
                    </button>
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    <p style={{ margin: 0 }}>
                        Alternatively, use the <strong>forge-scribe</strong> command or <strong>@forge-scribe</strong> persona to create sub-issues.
                    </p>
                </div>
            </div>
        </div>
    );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
