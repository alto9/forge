import { vi } from 'vitest';

export const FileType = {
    File: 1,
    Directory: 2,
    SymbolicLink: 64,
    Unknown: 0
};

export const workspace = {
    fs: {
        readDirectory: vi.fn(),
        stat: vi.fn(),
        createDirectory: vi.fn(),
        writeFile: vi.fn(),
        readFile: vi.fn(),
        delete: vi.fn()
    },
    getWorkspaceFolder: vi.fn(),
    getConfiguration: vi.fn(() => ({
        get: vi.fn(),
        inspect: vi.fn(() => undefined),
    })),
    workspaceFolders: []
};

export const Uri = {
    file: (path: string) => ({ fsPath: path, path, scheme: 'file' }),
    parse: vi.fn()
};

export const StatusBarAlignment = {
    Left: 1,
    Right: 2,
};

export const window = {
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    createOutputChannel: vi.fn(() => ({
        appendLine: vi.fn(),
        append: vi.fn(),
        show: vi.fn(),
        clear: vi.fn(),
        dispose: vi.fn()
    })),
    createStatusBarItem: vi.fn(() => ({
        text: '',
        tooltip: '',
        show: vi.fn(),
        hide: vi.fn(),
        dispose: vi.fn(),
    })),
    createWebviewPanel: vi.fn(),
    createTreeView: vi.fn(() => ({
        dispose: vi.fn(),
    })),
    showQuickPick: vi.fn(),
    showInputBox: vi.fn()
};

export class TreeItem {
    label?: string;
    description?: string;
    tooltip?: string;
    contextValue?: string;
    collapsibleState?: number;

    constructor(label: string, collapsibleState: number) {
        this.label = label;
        this.collapsibleState = collapsibleState;
    }
}

export const TreeItemCollapsibleState = {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
};

export class EventEmitter<T> {
    private listeners = new Set<(value: T) => void>();

    event = (listener: (value: T) => void) => {
        this.listeners.add(listener);
        return {
            dispose: () => {
                this.listeners.delete(listener);
            },
        };
    };

    fire(value: T): void {
        for (const listener of this.listeners) {
            listener(value);
        }
    }

    dispose(): void {
        this.listeners.clear();
    }
}

export const commands = {
    registerCommand: vi.fn(),
    executeCommand: vi.fn()
};

export const env = {
    sessionId: 'test-session-id',
    appName: 'Cursor',
};

export const ViewColumn = {
    One: 1,
    Two: 2,
    Three: 3
};

