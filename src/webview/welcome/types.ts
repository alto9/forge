export interface FolderStatus {
    path: string;        // Relative path (e.g., "ai/actors")
    exists: boolean;     // Whether folder currently exists
    description: string; // Human-readable description
    type: 'folder';      // Discriminator for union type
}

export interface CommandStatus {
    path: string;        // Relative path (e.g., ".cursor/commands/forge-design.md")
    exists: boolean;     // Whether command file exists
    valid: boolean;      // Whether command file has valid content (hash matches)
    description: string; // Human-readable description
    type: 'command';     // Discriminator for union type
}

export type ProjectItemStatus = FolderStatus | CommandStatus;

export interface InitializationProgress {
    currentItem: string | null;
    currentItemType: 'folder' | 'file' | null;
    createdCount: number;
    totalCount: number;
}

export interface WelcomeState {
    projectPath: string;
    isReady: boolean;
    folders: FolderStatus[];
    commands: CommandStatus[];
    isInitializing: boolean;
    error: string | null;
    progress: InitializationProgress | null;
}

// Messages from extension to webview
export interface ProjectStatusMessage {
    type: 'projectStatus';
    data: {
        projectPath: string;
        isReady: boolean;
        folders: FolderStatus[];
        commands: CommandStatus[];
    };
}

export interface InitializationProgressMessage {
    type: 'initializationProgress';
    item: string;
    itemType: 'folder' | 'file';
    status: 'creating' | 'created' | 'updated' | 'error';
    error?: string;
}

export interface InitializationCompleteMessage {
    type: 'initializationComplete';
    success: boolean;
    created: number;
    failed: number;
}

export interface ErrorMessage {
    type: 'error';
    message: string;
}

export type IncomingMessage = 
    | ProjectStatusMessage
    | InitializationProgressMessage
    | InitializationCompleteMessage
    | ErrorMessage;

// Messages from webview to extension
export interface GetProjectStatusMessage {
    type: 'getProjectStatus';
}

export interface InitializeProjectMessage {
    type: 'initializeProject';
}

export interface OpenForgeStudioMessage {
    type: 'openForgeStudio';
}

export type OutgoingMessage = 
    | GetProjectStatusMessage
    | InitializeProjectMessage
    | OpenForgeStudioMessage;

