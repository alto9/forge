import React from 'react';
import { createRoot } from 'react-dom/client';
import {
    FolderStatus,
    CommandStatus,
    ProjectItemStatus,
    WelcomeState,
    IncomingMessage,
    OutgoingMessage
} from './types';
import { InitializationDialog } from './components/InitializationDialog';
import { ProgressIndicator } from './components/ProgressIndicator';

// Acquire VSCode API once at module level
const vscode = typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : undefined;

function WelcomeApp() {
    const [state, setState] = React.useState<WelcomeState>({
        projectPath: '',
        isReady: false,
        folders: [],
        commands: [],
        isInitializing: false,
        error: null,
        progress: null
    });
    const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

    React.useEffect(() => {
        function onMessage(event: MessageEvent) {
            const msg = event.data as IncomingMessage;
            
            if (msg?.type === 'projectStatus') {
                setState(prev => ({
                    ...prev,
                    projectPath: msg.data.projectPath,
                    isReady: msg.data.isReady,
                    folders: msg.data.folders,
                    commands: msg.data.commands,
                    error: null
                }));
            } else if (msg?.type === 'initializationProgress') {
                setState(prev => {
                    // Calculate total count of missing folders and invalid commands on first progress message
                    const totalCount = prev.progress?.totalCount || (
                        prev.folders.filter(f => !f.exists).length +
                        prev.commands.filter(c => !c.exists || !c.valid).length
                    );
                    
                    // Update created count based on status
                    let createdCount = prev.progress?.createdCount || 0;
                    if (msg.status === 'created' || msg.status === 'updated') {
                        createdCount++;
                    }
                    
                    return {
                        ...prev,
                        isInitializing: true,
                        error: null,
                        progress: {
                            currentItem: msg.status === 'creating' ? msg.item : prev.progress?.currentItem || null,
                            currentItemType: msg.status === 'creating' ? msg.itemType : prev.progress?.currentItemType || null,
                            createdCount,
                            totalCount
                        }
                    };
                });
            } else if (msg?.type === 'initializationComplete') {
                setState(prev => ({
                    ...prev,
                    isInitializing: false,
                    isReady: msg.success,
                    error: msg.success ? null : 'Initialization failed',
                    progress: null
                }));
            } else if (msg?.type === 'error') {
                setState(prev => ({
                    ...prev,
                    isInitializing: false,
                    error: msg.message,
                    progress: null
                }));
            }
        }

        window.addEventListener('message', onMessage);
        
        // Request initial project status
        vscode?.postMessage({ type: 'getProjectStatus' } as OutgoingMessage);
        
        return () => window.removeEventListener('message', onMessage);
    }, []);

    const handleInitialize = () => {
        // Clear any previous errors before showing dialog
        setState(prev => ({ ...prev, error: null }));
        setShowConfirmDialog(true);
    };

    const handleConfirmInitialization = () => {
        setShowConfirmDialog(false);
        const missingCount = state.folders.filter(f => !f.exists).length + 
                             state.commands.filter(c => !c.exists || !c.valid).length;
        setState(prev => ({ 
            ...prev, 
            isInitializing: true, 
            error: null,
            progress: {
                currentItem: null,
                currentItemType: null,
                createdCount: 0,
                totalCount: missingCount
            }
        }));
        vscode?.postMessage({ type: 'initializeProject' } as OutgoingMessage);
    };

    const handleCancelInitialization = () => {
        setShowConfirmDialog(false);
    };

    const handleOpenStudio = () => {
        vscode?.postMessage({ type: 'openForgeStudio' } as OutgoingMessage);
    };

    return (
        <div className="container">
            <div className="welcome-content">
                <ProjectHeader projectPath={state.projectPath} />
                <StatusIndicator 
                    isReady={state.isReady} 
                    folders={state.folders}
                    commands={state.commands}
                />
                <ProjectItemChecklist 
                    folders={state.folders}
                    commands={state.commands}
                />
                {state.progress && (
                    <ProgressIndicator
                        currentItem={state.progress.currentItem}
                        currentItemType={state.progress.currentItemType}
                        createdCount={state.progress.createdCount}
                        totalCount={state.progress.totalCount}
                    />
                )}
                {state.error && (
                    <div className="error-message">
                        {state.error}
                    </div>
                )}
                <ActionButtons
                    isReady={state.isReady}
                    isInitializing={state.isInitializing}
                    hasError={!!state.error}
                    onInitialize={handleInitialize}
                    onOpenStudio={handleOpenStudio}
                />
            </div>
            {showConfirmDialog && (
                <InitializationDialog
                    folders={state.folders}
                    commands={state.commands}
                    onConfirm={handleConfirmInitialization}
                    onCancel={handleCancelInitialization}
                />
            )}
        </div>
    );
}

function ProjectHeader({ projectPath }: { projectPath: string }) {
    return (
        <div className="project-header">
            <h1 className="welcome-title">Welcome to Forge</h1>
            {projectPath && (
                <div className="project-path">
                    Project: {projectPath}
                </div>
            )}
        </div>
    );
}

function StatusIndicator({ isReady, folders, commands }: { 
    isReady: boolean;
    folders: FolderStatus[];
    commands: CommandStatus[];
}) {
    const missingFolders = folders.filter(f => !f.exists).length;
    const invalidCommands = commands.filter(c => !c.exists || !c.valid).length;
    
    let subtitle = '';
    if (isReady) {
        subtitle = 'All required folders and command files are ready';
    } else {
        const issues = [];
        if (missingFolders > 0) {
            issues.push(`${missingFolders} folder${missingFolders > 1 ? 's' : ''}`);
        }
        if (invalidCommands > 0) {
            issues.push(`${invalidCommands} command file${invalidCommands > 1 ? 's' : ''}`);
        }
        subtitle = issues.length > 0 ? `Missing or outdated: ${issues.join(', ')}` : 'Setup incomplete';
    }
    
    return (
        <div className={`status-indicator ${isReady ? 'ready' : 'not-ready'}`}>
            <div className="status-icon">
                {isReady ? '✓' : '⚠'}
            </div>
            <div className="status-text">
                {isReady ? 'Forge Ready' : 'Not Ready'}
            </div>
            <div className="status-subtitle">
                {subtitle}
            </div>
        </div>
    );
}

function ProjectItemChecklist({ folders, commands }: { 
    folders: FolderStatus[];
    commands: CommandStatus[];
}) {
    if (folders.length === 0 && commands.length === 0) {
        return null;
    }

    return (
        <div className="folder-checklist">
            {folders.length > 0 && (
                <>
                    <h3 className="checklist-title">Required Folders</h3>
                    <div className="checklist-items">
                        {folders.map((folder, index) => (
                            <div key={`folder-${index}`} className={`checklist-item ${folder.exists ? 'exists' : 'missing'}`}>
                                <div className="checklist-icon">
                                    {folder.exists ? '✓' : '✗'}
                                </div>
                                <div className="checklist-content">
                                    <div className="checklist-path">{folder.path}</div>
                                    <div className="checklist-description">{folder.description}</div>
                                </div>
                                <div className="checklist-status">
                                    {folder.exists ? 'Exists' : 'Missing'}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            {commands.length > 0 && (
                <>
                    <h3 className="checklist-title" style={{ marginTop: folders.length > 0 ? '24px' : '0' }}>
                        Required Command Files
                    </h3>
                    <div className="checklist-items">
                        {commands.map((command, index) => {
                            let statusClass = 'missing';
                            let icon = '✗';
                            let statusText = 'Missing';
                            
                            if (command.exists && command.valid) {
                                statusClass = 'exists';
                                icon = '✓';
                                statusText = 'Valid';
                            } else if (command.exists && !command.valid) {
                                statusClass = 'outdated';
                                icon = '⚠';
                                statusText = 'Outdated';
                            }
                            
                            return (
                                <div key={`command-${index}`} className={`checklist-item ${statusClass}`}>
                                    <div className="checklist-icon">
                                        {icon}
                                    </div>
                                    <div className="checklist-content">
                                        <div className="checklist-path">{command.path}</div>
                                        <div className="checklist-description">{command.description}</div>
                                    </div>
                                    <div className="checklist-status">
                                        {statusText}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

function ActionButtons({
    isReady,
    isInitializing,
    hasError,
    onInitialize,
    onOpenStudio
}: {
    isReady: boolean;
    isInitializing: boolean;
    hasError: boolean;
    onInitialize: () => void;
    onOpenStudio: () => void;
}) {
    if (isReady) {
        return (
            <div className="action-buttons">
                <button
                    className="btn btn-primary"
                    onClick={onOpenStudio}
                    disabled={isInitializing}
                >
                    Open Forge Studio
                </button>
            </div>
        );
    }

    return (
        <div className="action-buttons">
            <button
                className="btn btn-primary"
                onClick={onInitialize}
                disabled={isInitializing}
            >
                {isInitializing ? (
                    <>
                        <span className="spinner"></span>
                        Initializing...
                    </>
                ) : hasError ? (
                    'Retry Initialization'
                ) : (
                    'Initialize Forge Project'
                )}
            </button>
        </div>
    );
}

const root = createRoot(document.getElementById('root')!);
root.render(<WelcomeApp />);

