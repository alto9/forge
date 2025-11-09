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
    workspaceFolders: []
};

export const Uri = {
    file: (path: string) => ({ fsPath: path, path, scheme: 'file' }),
    parse: vi.fn()
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
    createWebviewPanel: vi.fn(),
    showQuickPick: vi.fn(),
    showInputBox: vi.fn()
};

export const commands = {
    registerCommand: vi.fn(),
    executeCommand: vi.fn()
};

export const ViewColumn = {
    One: 1,
    Two: 2,
    Three: 3
};

