import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
    DEFAULT_VISION_JSON,
    getDefaultProjectJson,
    SCHEMA_FILES
} from '../templates/forgeAssets';

/** Recursively copy a directory, overwriting existing files. */
function copyDirRecursive(src: string, dest: string) {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Setup project for Cursor: .forge folder, .cursor commands, agents, skills, hooks.
 * Uses workflow templates from resources/workflow.
 */
export class SetupCursorCommand {
    static async execute(
        context: vscode.ExtensionContext,
        outputChannel?: vscode.OutputChannel,
        options?: { title?: string; forgeOnly?: boolean }
    ) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }

        let projectUri = workspaceFolders[0].uri;
        if (workspaceFolders.length > 1) {
            const selected = await vscode.window.showWorkspaceFolderPick({
                placeHolder: 'Select the project to setup for Cursor'
            });
            if (!selected) return;
            projectUri = selected.uri;
        }

        const projectPath = projectUri.fsPath;
        const extensionPath = context.extensionPath;
        const workflowPath = path.join(extensionPath, 'resources', 'workflow');

        if (!fs.existsSync(workflowPath)) {
            vscode.window.showErrorMessage(
                'Forge workflow resources not found. The extension may be misconfigured.'
            );
            return;
        }

        const progressTitle = options?.title ?? 'Setting up project for Cursor';
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: progressTitle,
                cancellable: false
            },
            async (progress) => {
                try {
                    progress.report({ message: 'Creating .forge folder...' });
                    await ensureForgeFolder(projectPath, extensionPath, workflowPath, outputChannel);

                    if (!options?.forgeOnly) {
                        progress.report({ message: 'Creating .cursor agents...' });
                        await ensureCursorAgents(projectPath, workflowPath, outputChannel);

                        progress.report({ message: 'Creating .cursor commands...' });
                        await ensureCursorCommands(projectPath, workflowPath, outputChannel);

                        progress.report({ message: 'Creating .cursor skills...' });
                        await ensureCursorSkills(projectPath, workflowPath, outputChannel);

                        progress.report({ message: 'Creating .cursor hooks...' });
                        await ensureCursorHooks(projectPath, workflowPath, outputChannel);
                    }

                    vscode.window.showInformationMessage(
                        options?.forgeOnly
                            ? 'Project setup complete. .forge folder created.'
                            : 'Project setup complete. .forge and .cursor folders created.'
                    );
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err);
                    outputChannel?.appendLine(`Setup failed: ${msg}`);
                    vscode.window.showErrorMessage(`Setup failed: ${msg}`);
                }
            }
        );
    }
}

async function ensureForgeFolder(
    projectPath: string,
    extensionPath: string,
    workflowPath: string,
    outputChannel?: vscode.OutputChannel
) {
    const forgeDir = path.join(projectPath, '.forge');
    const schemasDir = path.join(forgeDir, 'schemas');
    if (!fs.existsSync(forgeDir)) fs.mkdirSync(forgeDir, { recursive: true });
    if (!fs.existsSync(schemasDir)) fs.mkdirSync(schemasDir, { recursive: true });

    const forgeFiles: Record<string, string> = {
        'vision.json': DEFAULT_VISION_JSON
    };

    for (const [name, content] of Object.entries(forgeFiles)) {
        const filePath = path.join(forgeDir, name);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, content, 'utf8');
            outputChannel?.appendLine(`Created .forge/${name}`);
        }
    }

    const projectJsonPath = path.join(forgeDir, 'project.json');
    if (!fs.existsSync(projectJsonPath)) {
        const projectName = path.basename(projectPath);
        const githubUrl = `https://github.com/owner/${projectName}`;
        const githubBoard = `https://github.com/orgs/owner/projects/1`;
        fs.writeFileSync(
            projectJsonPath,
            getDefaultProjectJson(projectName, githubUrl, githubBoard),
            'utf8'
        );
        outputChannel?.appendLine('Created .forge/project.json');
    }

    const skillRegistrySrc = path.join(workflowPath, 'references', 'skill_registry.json');
    const skillRegistryDest = path.join(forgeDir, 'skill_registry.json');
    if (fs.existsSync(skillRegistrySrc)) {
        fs.copyFileSync(skillRegistrySrc, skillRegistryDest);
        outputChannel?.appendLine('Created .forge/skill_registry.json');
    }

    const knowledgeMapSrc = path.join(workflowPath, 'references', 'knowledge_map.json');
    const knowledgeMapDest = path.join(forgeDir, 'knowledge_map.json');
    if (fs.existsSync(knowledgeMapSrc)) {
        fs.copyFileSync(knowledgeMapSrc, knowledgeMapDest);
        outputChannel?.appendLine('Created .forge/knowledge_map.json');
    }

    for (const schemaFile of SCHEMA_FILES) {
        const srcPath = path.join(extensionPath, 'schemas', schemaFile);
        const destPath = path.join(schemasDir, schemaFile);
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            outputChannel?.appendLine(`Copied schema ${schemaFile}`);
        }
    }
}

async function ensureCursorAgents(
    projectPath: string,
    workflowPath: string,
    outputChannel?: vscode.OutputChannel
) {
    const src = path.join(workflowPath, 'agents');
    const dest = path.join(projectPath, '.cursor', 'agents');
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    copyDirRecursive(src, dest);
    outputChannel?.appendLine('Created .cursor/agents/');
}

async function ensureCursorCommands(
    projectPath: string,
    workflowPath: string,
    outputChannel?: vscode.OutputChannel
) {
    const src = path.join(workflowPath, 'commands');
    const dest = path.join(projectPath, '.cursor', 'commands');
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    copyDirRecursive(src, dest);
    outputChannel?.appendLine('Created .cursor/commands/');
}

async function ensureCursorSkills(
    projectPath: string,
    workflowPath: string,
    outputChannel?: vscode.OutputChannel
) {
    const src = path.join(workflowPath, 'skills');
    const dest = path.join(projectPath, '.cursor', 'skills');
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    copyDirRecursive(src, dest);
    const scriptExtensions = ['.js', '.sh'];
    const makeExecutable = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                makeExecutable(fullPath);
            } else if (scriptExtensions.some((ext) => entry.name.endsWith(ext))) {
                try {
                    fs.chmodSync(fullPath, 0o755);
                } catch {
                    // chmod may fail on some systems
                }
            }
        }
    };
    makeExecutable(dest);
    outputChannel?.appendLine('Created .cursor/skills/');
}

async function ensureCursorHooks(
    projectPath: string,
    workflowPath: string,
    outputChannel?: vscode.OutputChannel
) {
    const hooksDir = path.join(projectPath, '.cursor', 'hooks');
    if (!fs.existsSync(hooksDir)) fs.mkdirSync(hooksDir, { recursive: true });

    const hooksSrc = path.join(workflowPath, 'hooks');
    if (fs.existsSync(hooksSrc)) {
        copyDirRecursive(hooksSrc, hooksDir);
        const hookScript = path.join(hooksDir, 'validate-json-schema.js');
        if (fs.existsSync(hookScript)) {
            try {
                fs.chmodSync(hookScript, 0o755);
            } catch {
                // chmod may fail on some systems
            }
        }
    }

    const cursorHome = path.join(os.homedir(), '.cursor');
    if (!fs.existsSync(cursorHome)) fs.mkdirSync(cursorHome, { recursive: true });
    const hooksJsonSrc = path.join(workflowPath, 'hooks.json');
    const hooksJsonDest = path.join(cursorHome, 'hooks.json');
    if (fs.existsSync(hooksJsonSrc)) {
        fs.copyFileSync(hooksJsonSrc, hooksJsonDest);
        outputChannel?.appendLine('Created ~/.cursor/hooks.json');
    }
    outputChannel?.appendLine('Created .cursor/hooks/');
}
