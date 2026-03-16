import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

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
 * Install Forge agents, commands, skills, and hooks to ~/.cursor/.
 * Makes Forge available in all projects. Run "Setup Project for Cursor" in each project to add .forge/.
 */
export class InstallGlobalCommand {
    static async execute(
        context: vscode.ExtensionContext,
        outputChannel?: vscode.OutputChannel
    ) {
        const extensionPath = context.extensionPath;
        const workflowPath = path.join(extensionPath, 'resources', 'workflow');
        const cursorHome = path.join(os.homedir(), '.cursor');

        if (!fs.existsSync(workflowPath)) {
            vscode.window.showErrorMessage(
                'Forge workflow resources not found. The extension may be misconfigured.'
            );
            return;
        }

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Installing Forge to ~/.cursor',
                cancellable: false
            },
            async (progress) => {
                try {
                    fs.mkdirSync(cursorHome, { recursive: true });

                    progress.report({ message: 'Copying agents...' });
                    const agentsSrc = path.join(workflowPath, 'agents');
                    const agentsDest = path.join(cursorHome, 'agents');
                    if (fs.existsSync(agentsSrc)) {
                        copyDirRecursive(agentsSrc, agentsDest);
                        outputChannel?.appendLine('Installed ~/.cursor/agents/');
                    }

                    progress.report({ message: 'Copying commands...' });
                    const commandsSrc = path.join(workflowPath, 'commands');
                    const commandsDest = path.join(cursorHome, 'commands');
                    if (fs.existsSync(commandsSrc)) {
                        copyDirRecursive(commandsSrc, commandsDest);
                        outputChannel?.appendLine('Installed ~/.cursor/commands/');
                    }

                    progress.report({ message: 'Copying skills...' });
                    const skillsSrc = path.join(workflowPath, 'skills');
                    const skillsDest = path.join(cursorHome, 'skills');
                    if (fs.existsSync(skillsSrc)) {
                        copyDirRecursive(skillsSrc, skillsDest);
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
                        makeExecutable(skillsDest);
                        outputChannel?.appendLine('Installed ~/.cursor/skills/');
                    }

                    progress.report({ message: 'Copying hooks...' });
                    const hooksSrc = path.join(workflowPath, 'hooks');
                    const hooksDest = path.join(cursorHome, 'hooks');
                    if (fs.existsSync(hooksSrc)) {
                        copyDirRecursive(hooksSrc, hooksDest);
                        const hookScript = path.join(hooksDest, 'validate-json-schema.js');
                        if (fs.existsSync(hookScript)) {
                            try {
                                fs.chmodSync(hookScript, 0o755);
                            } catch {
                                // chmod may fail on some systems
                            }
                        }
                        outputChannel?.appendLine('Installed ~/.cursor/hooks/');
                    }

                    const hooksJsonDest = path.join(cursorHome, 'hooks.json');
                    const hookScriptPath = path.join(cursorHome, 'hooks', 'validate-json-schema.js');
                    const hooksJson = {
                        version: 1,
                        hooks: {
                            afterFileEdit: [{ command: `node "${hookScriptPath}"` }],
                            afterTabFileEdit: [{ command: `node "${hookScriptPath}"` }]
                        }
                    };
                    fs.writeFileSync(hooksJsonDest, JSON.stringify(hooksJson, null, 2), 'utf8');
                    outputChannel?.appendLine('Installed ~/.cursor/hooks.json');

                    vscode.window.showInformationMessage(
                        'Forge installed to ~/.cursor. Run "Forge: Setup Project for Cursor" in each project to add .forge/ and project-specific config.'
                    );
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err);
                    outputChannel?.appendLine(`Install failed: ${msg}`);
                    vscode.window.showErrorMessage(`Install failed: ${msg}`);
                }
            }
        );
    }
}
