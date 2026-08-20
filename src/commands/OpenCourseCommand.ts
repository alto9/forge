import * as vscode from 'vscode';
import { ensureLocalPlugin, localPluginPath } from '../plugin/ensureLocalPlugin';
import { createGitRunner, type GitRunner } from '../plugin/gitRunner';
import {
    CourseServer,
    courseIndexExists,
    courseRootFromPlugin
} from '../course/serveCourse';

function pluginRepoUrl(): string {
    return vscode.workspace.getConfiguration('forge.cursorPlugin').get<string>('repoUrl') || '';
}

export async function openCourseTab(url: string): Promise<void> {
    try {
        await vscode.commands.executeCommand('simpleBrowser.show', url);
    } catch {
        await vscode.env.openExternal(vscode.Uri.parse(url));
    }
}

export interface OpenForgeCourseOptions {
    ensurePlugin?: typeof ensureLocalPlugin;
    git?: GitRunner;
    homeDir?: string;
    repoUrl?: string;
    openTab?: (url: string) => Promise<void>;
}

export async function openForgeCourse(
    output: vscode.OutputChannel,
    server: CourseServer,
    options: OpenForgeCourseOptions = {}
): Promise<string> {
    const destGuess = localPluginPath(options.homeDir);
    let root = courseRootFromPlugin(destGuess);

    if (!courseIndexExists(root)) {
        output.appendLine('Forge course not found on disk; syncing Cursor plugin.');
        const ensure = options.ensurePlugin ?? ensureLocalPlugin;
        const result = await ensure({
            git: options.git ?? createGitRunner(),
            homeDir: options.homeDir,
            repoUrl: options.repoUrl
        });
        root = courseRootFromPlugin(result.dest);
    }

    if (!courseIndexExists(root)) {
        throw new Error(
            `Forge course is missing at ${root}. Update the Cursor plugin to a revision that includes course/.`
        );
    }

    const url = await server.start(root);
    output.appendLine(`Forge course → ${url}`);
    const openTab = options.openTab ?? openCourseTab;
    await openTab(url);
    return url;
}

export class OpenCourseCommand {
    public static readonly commandId = 'forge.openCourse';

    public static register(
        _context: vscode.ExtensionContext,
        output: vscode.OutputChannel,
        server: CourseServer
    ): vscode.Disposable {
        return vscode.commands.registerCommand(OpenCourseCommand.commandId, async () => {
            try {
                await openForgeCourse(output, server, {
                    repoUrl: pluginRepoUrl() || undefined
                });
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                output.appendLine(`Open Forge Course failed: ${message}`);
                void vscode.window.showErrorMessage(`Open Forge Course failed: ${message}`);
            }
        });
    }
}
