import React from 'react';
import { createRoot } from 'react-dom/client';

// Acquire VSCode API once at module level
const vscode = typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : undefined;

interface MilestoneData {
    number: number;
    title: string;
    description: string | null;
    state: string;
    open_issues: number;
    closed_issues: number;
    due_on: string | null;
    created_at: string;
    updated_at: string;
    issues: Array<{
        number: number;
        title: string;
        state: string;
        html_url: string;
    }>;
}

interface SprintData {
    title: string;
    issues: Array<{
        number: number;
        title: string;
        state: string;
        html_url: string;
    }>;
}

interface RoadmapData {
    milestones: MilestoneData[];
    sprints: SprintData[];
    unassociatedIssues: Array<{
        number: number;
        title: string;
        state: string;
        html_url: string;
    }>;
}

interface RoadmapState {
    viewMode: 'milestones' | 'sprints';
    data: RoadmapData | null;
    loading: boolean;
    error: string | null;
    repoInfo: { owner: string; repo: string } | null;
}

function RoadmapApp() {
    const [state, setState] = React.useState<RoadmapState>({
        viewMode: 'milestones',
        data: null,
        loading: true,
        error: null,
        repoInfo: null
    });

    React.useEffect(() => {
        function onMessage(event: MessageEvent) {
            const msg = event.data;
            
            if (msg?.type === 'roadmapData') {
                setState(prev => ({
                    ...prev,
                    data: msg.data,
                    repoInfo: msg.repoInfo,
                    loading: false,
                    error: null
                }));
            } else if (msg?.type === 'loading') {
                setState(prev => ({
                    ...prev,
                    loading: true,
                    error: null
                }));
            } else if (msg?.type === 'error') {
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: msg.message
                }));
            }
        }

        window.addEventListener('message', onMessage);
        
        // Request roadmap data
        vscode?.postMessage({ type: 'loadRoadmap' });
        
        return () => window.removeEventListener('message', onMessage);
    }, []);

    const handleViewModeChange = (mode: 'milestones' | 'sprints') => {
        setState(prev => ({ ...prev, viewMode: mode }));
    };

    if (state.loading) {
        return (
            <div className="container">
                <div className="loading">Loading roadmap data...</div>
            </div>
        );
    }

    if (state.error) {
        return (
            <div className="container">
                <div className="error">{state.error}</div>
            </div>
        );
    }

    if (!state.data) {
        return (
            <div className="container">
                <div className="empty-state">No roadmap data available</div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="header">
                <h1 className="header-title">
                    {state.repoInfo ? `${state.repoInfo.owner}/${state.repoInfo.repo}` : 'Roadmap'}
                </h1>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="view-toggle">
                        <button
                            className={`toggle-button ${state.viewMode === 'milestones' ? 'active' : ''}`}
                            onClick={() => handleViewModeChange('milestones')}
                        >
                            Milestones
                        </button>
                        <button
                            className={`toggle-button ${state.viewMode === 'sprints' ? 'active' : ''}`}
                            onClick={() => handleViewModeChange('sprints')}
                        >
                            Sprints
                        </button>
                    </div>
                    {state.viewMode === 'sprints' && (
                        <button
                            className="toggle-button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                vscode?.postMessage({ type: 'changeProject' });
                            }}
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                            title="Change GitHub Project"
                        >
                            Change Project
                        </button>
                    )}
                </div>
            </div>

            {state.viewMode === 'milestones' ? (
                <MilestoneView milestones={state.data.milestones} />
            ) : (
                <SprintView sprints={state.data.sprints} />
            )}

            {state.data.unassociatedIssues.length > 0 && (
                <UnassociatedIssues issues={state.data.unassociatedIssues} />
            )}
        </div>
    );
}

function MilestoneView({ milestones }: { milestones: MilestoneData[] }) {
    if (milestones.length === 0) {
        return <div className="empty-state">No milestones found</div>;
    }

    return (
        <div className="milestone-list">
            {milestones.map((milestone) => (
                <div key={milestone.number} className="milestone-item">
                    <div className="milestone-header">
                        <div>
                            <h3 className="milestone-title">{milestone.title}</h3>
                            {milestone.description && (
                                <div className="milestone-description">{milestone.description}</div>
                            )}
                            <div className="milestone-meta">
                                <span className={`milestone-status ${milestone.state}`}>
                                    {milestone.state}
                                </span>
                                <span>
                                    {milestone.open_issues} open, {milestone.closed_issues} closed
                                </span>
                                {milestone.due_on && (
                                    <span>
                                        Due: {new Date(milestone.due_on).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {milestone.issues.length > 0 && (
                        <div className="issues-section">
                            <h4 className="issues-title">Issues ({milestone.issues.length})</h4>
                            <div className="issues-list">
                                {milestone.issues.map((issue) => (
                                    <a
                                        key={issue.number}
                                        href={issue.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="issue-item"
                                    >
                                        <span className="issue-number">#{issue.number}</span>
                                        <span className="issue-title">{issue.title}</span>
                                        <span className={`issue-state ${issue.state}`}>
                                            {issue.state}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function SprintView({ sprints }: { sprints: SprintData[] }) {
    if (sprints.length === 0) {
        return (
            <div className="empty-state">
                <p>No sprints found.</p>
                <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                    Make sure your GitHub Projects have an Iteration field configured and iterations created.
                </p>
            </div>
        );
    }

    return (
        <div className="sprint-list">
            {sprints.map((sprint, index) => (
                <div key={index} className="sprint-item">
                    <div className="sprint-header">
                        <h3 className="sprint-title">{sprint.title}</h3>
                    </div>
                    {sprint.issues.length > 0 ? (
                        <div className="issues-section">
                            <h4 className="issues-title">Issues ({sprint.issues.length})</h4>
                            <div className="issues-list">
                                {sprint.issues.map((issue) => (
                                    <a
                                        key={issue.number}
                                        href={issue.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="issue-item"
                                    >
                                        <span className="issue-number">#{issue.number}</span>
                                        <span className="issue-title">{issue.title}</span>
                                        <span className={`issue-state ${issue.state}`}>
                                            {issue.state}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">No issues in this sprint</div>
                    )}
                </div>
            ))}
        </div>
    );
}

function UnassociatedIssues({ issues }: { issues: Array<{ number: number; title: string; state: string; html_url: string }> }) {
    return (
        <div className="unassociated-section">
            <h2 className="unassociated-title">Unassociated Issues ({issues.length})</h2>
            <div className="issues-list">
                {issues.map((issue) => (
                    <a
                        key={issue.number}
                        href={issue.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="issue-item"
                    >
                        <span className="issue-number">#{issue.number}</span>
                        <span className="issue-title">{issue.title}</span>
                        <span className={`issue-state ${issue.state}`}>
                            {issue.state}
                        </span>
                    </a>
                ))}
            </div>
        </div>
    );
}

const root = createRoot(document.getElementById('root')!);
root.render(<RoadmapApp />);
