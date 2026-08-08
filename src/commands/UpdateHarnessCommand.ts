import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { installHarness } from '../harness/installHarness';
import { readManifest } from '../harness/manifest';
import { ensureWorktreesConfig } from '../worktrees/ensureWorktrees';

function loadForgeVersion(extensionPath: string): string {
    try {
        const pkg = JSON.parse(
            fs.readFileSync(path.join(extensionPath, 'package.json'), 'utf8')
        ) as { version?: string };
        return pkg.version || '0.0.0';
    } catch {
        return '0.0.0';
    }
}

export class UpdateHarnessCommand {
    public static readonly commandId = 'forge.updateHarness';

    public static register(
        context: vscode.ExtensionContext,
        output: vscode.OutputChannel
    ): vscode.Disposable {
        return vscode.commands.registerCommand(UpdateHarnessCommand.commandId, async () => {
            const folder = vscode.workspace.workspaceFolders?.[0];
            if (!folder) {
                void vscode.window.showErrorMessage(
                    'Open a superrepo folder before updating the Forge harness.'
                );
                return;
            }
            const repoRoot = folder.uri.fsPath;
            const previous = readManifest(repoRoot);
            if (!previous) {
                const choice = await vscode.window.showWarningMessage(
                    'No Forge manifest found. Run Initialize Superrepo instead?',
                    'Initialize Superrepo',
                    'Cancel'
                );
                if (choice === 'Initialize Superrepo') {
                    await vscode.commands.executeCommand('forge.initializeSuperrepo');
                }
                return;
            }

            try {
                const worktreesPath = previous.worktreesPath || path.join(repoRoot, '.worktrees');
                ensureWorktreesConfig(repoRoot, worktreesPath);
                const forgeVersion = loadForgeVersion(context.extensionPath);
                const result = installHarness(repoRoot, context.extensionPath, {
                    forgeVersion,
                    worktreesPath,
                    previous
                });
                output.appendLine(
                    `Updated harness: ${result.copiedFiles} files, forge ${result.manifest.forgeVersion}`
                );
                void vscode.window.showInformationMessage(
                    `Forge harness updated to ${result.manifest.forgeVersion}.`
                );
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                output.appendLine(`Update harness failed: ${message}`);
                void vscode.window.showErrorMessage(`Forge update harness failed: ${message}`);
            }
        });
    }
}
