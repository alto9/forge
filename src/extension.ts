import * as vscode from 'vscode';
import { OpenCourseCommand } from './commands/OpenCourseCommand';
import {
    scheduleStartupSync,
    SyncCursorPluginCommand
} from './commands/SyncCursorPluginCommand';
import { CourseServer } from './course/serveCourse';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
    outputChannel = vscode.window.createOutputChannel('Forge');
    const courseServer = new CourseServer();
    context.subscriptions.push(outputChannel, courseServer);
    outputChannel.appendLine('Forge activated (Cursor plugin installer).');

    context.subscriptions.push(
        SyncCursorPluginCommand.register(context, outputChannel),
        OpenCourseCommand.register(context, outputChannel, courseServer)
    );
    scheduleStartupSync(outputChannel);
}

export function deactivate(): void {
    // no-op
}
