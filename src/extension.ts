import * as vscode from 'vscode';
import { OpenCourseCommand } from './commands/OpenCourseCommand';
import {
    scheduleStartupSync,
    SyncCursorPluginCommand
} from './commands/SyncCursorPluginCommand';
import { CourseServer } from './course/serveCourse';
import { DashboardPanel } from './dashboard/DashboardPanel';
import { ForgeSidebarProvider } from './sidebar/ForgeSidebarProvider';
import { SELECTED_ROLE_KEY, SIDEBAR_VIEW_ID } from './stateKeys';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
    outputChannel = vscode.window.createOutputChannel('Forge');
    const courseServer = new CourseServer();
    context.subscriptions.push(outputChannel, courseServer);
    outputChannel.appendLine('Forge activated (Cursor plugin installer + dashboard).');

    const sidebarProvider = new ForgeSidebarProvider(context, outputChannel);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(SIDEBAR_VIEW_ID, sidebarProvider)
    );

    const refreshSidebar = (): void => {
        sidebarProvider.refresh();
        DashboardPanel.refreshIfOpen();
    };

    const folders = vscode.workspace.workspaceFolders;
    if (folders?.length) {
        const root = folders[0].uri;
        const gitmodulesWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(root, '.gitmodules')
        );
        const memoryWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(root, '.ai/memory/**')
        );
        for (const w of [gitmodulesWatcher, memoryWatcher]) {
            w.onDidChange(refreshSidebar);
            w.onDidCreate(refreshSidebar);
            w.onDidDelete(refreshSidebar);
            context.subscriptions.push(w);
        }
    }

    context.subscriptions.push(
        vscode.workspace.onDidChangeWorkspaceFolders(() => refreshSidebar())
    );

    context.subscriptions.push(
        SyncCursorPluginCommand.register(context, outputChannel),
        OpenCourseCommand.register(context, outputChannel, courseServer),
        vscode.commands.registerCommand('forge.openDashboard', async () => {
            const role =
                context.workspaceState.get<string>(SELECTED_ROLE_KEY) ?? 'product-owner';
            await DashboardPanel.show(context, outputChannel, role);
        }),
        vscode.commands.registerCommand('forge.sidebar.refresh', () => {
            refreshSidebar();
        })
    );
    scheduleStartupSync(outputChannel);
}

export function deactivate(): void {
    // no-op
}
