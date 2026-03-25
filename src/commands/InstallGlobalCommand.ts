import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const FORGE_MANIFEST_VERSION = 1;
const FORGE_MANIFEST_FILE = '.forge-manifest.json';
const MANAGED_DIRECTORIES = ['agents', 'commands', 'skills', 'hooks'];

export interface ManagedFileRecord {
    path: string;
    sha256: string;
}

export interface ForgeManifest {
    manifestVersion: number;
    forgeVersion: string;
    updatedAt: string;
    managedFiles: ManagedFileRecord[];
}

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

function toManifestPath(relativePath: string): string {
    return relativePath.split(path.sep).join('/');
}

function sha256OfContent(content: string | Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex');
}

function sha256OfFile(filePath: string): string {
    return sha256OfContent(fs.readFileSync(filePath));
}

function listFilesRecursive(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...listFilesRecursive(entryPath));
        } else {
            files.push(entryPath);
        }
    }
    return files;
}

function buildHooksJson(cursorHome: string): string {
    const hookScriptPath = path.join(cursorHome, 'hooks', 'validate-json-schema.js');
    return JSON.stringify(
        {
            version: 1,
            hooks: {
                afterFileEdit: [{ command: `node "${hookScriptPath}"` }],
                afterTabFileEdit: [{ command: `node "${hookScriptPath}"` }]
            }
        },
        null,
        2
    );
}

function collectDesiredManagedFiles(workflowPath: string, cursorHome: string): ManagedFileRecord[] {
    const files: ManagedFileRecord[] = [];

    for (const directory of MANAGED_DIRECTORIES) {
        const sourceRoot = path.join(workflowPath, directory);
        const sourceFiles = listFilesRecursive(sourceRoot);
        for (const sourceFile of sourceFiles) {
            const relativeToSource = path.relative(sourceRoot, sourceFile);
            const managedPath = toManifestPath(path.join(directory, relativeToSource));
            files.push({
                path: managedPath,
                sha256: sha256OfFile(sourceFile)
            });
        }
    }

    files.push({
        path: 'hooks.json',
        sha256: sha256OfContent(buildHooksJson(cursorHome))
    });

    files.sort((a, b) => a.path.localeCompare(b.path));
    return files;
}

function collectCurrentManagedFiles(cursorHome: string, desiredFiles: ManagedFileRecord[]): ManagedFileRecord[] {
    return desiredFiles.map((file) => {
        const destinationPath = path.join(cursorHome, file.path);
        if (!fs.existsSync(destinationPath)) {
            return { path: file.path, sha256: '' };
        }
        return { path: file.path, sha256: sha256OfFile(destinationPath) };
    });
}

function readManifest(cursorHome: string): ForgeManifest | null {
    const manifestPath = path.join(cursorHome, FORGE_MANIFEST_FILE);
    if (!fs.existsSync(manifestPath)) return null;

    try {
        const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as ForgeManifest;
        if (
            typeof parsed !== 'object' ||
            typeof parsed.forgeVersion !== 'string' ||
            !Array.isArray(parsed.managedFiles)
        ) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

function writeManifest(cursorHome: string, manifest: ForgeManifest): void {
    const manifestPath = path.join(cursorHome, FORGE_MANIFEST_FILE);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

function toHashMap(files: ManagedFileRecord[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const file of files) {
        map.set(file.path, file.sha256);
    }
    return map;
}

export function shouldSyncManagedFiles(
    manifest: ForgeManifest | null,
    forgeVersion: string,
    desiredFiles: ManagedFileRecord[],
    currentFiles: ManagedFileRecord[]
): boolean {
    if (!manifest) return true;
    if (manifest.manifestVersion !== FORGE_MANIFEST_VERSION) return true;
    if (manifest.forgeVersion !== forgeVersion) return true;

    const desiredMap = toHashMap(desiredFiles);
    const manifestMap = toHashMap(manifest.managedFiles);
    const currentMap = toHashMap(currentFiles);

    if (manifestMap.size !== desiredMap.size) return true;
    for (const [filePath, desiredHash] of desiredMap.entries()) {
        if (manifestMap.get(filePath) !== desiredHash) return true;
        if (currentMap.get(filePath) !== desiredHash) return true;
    }

    return false;
}

export function shouldRequestUserConfirmation(
    needsSync: boolean,
    confirmBeforeUpdate?: boolean
): boolean {
    return needsSync && Boolean(confirmBeforeUpdate);
}

/**
 * Install Forge agents, commands, skills, and hooks to ~/.cursor/.
 * Makes Forge agents available in all projects.
 */
export class InstallGlobalCommand {
    static async execute(
        context: vscode.ExtensionContext,
        outputChannel?: vscode.OutputChannel,
        options?: { silent?: boolean; confirmBeforeUpdate?: boolean }
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

        try {
            const forgeVersion = String(context.extension.packageJSON.version || '0.0.0');
            const desiredManagedFiles = collectDesiredManagedFiles(workflowPath, cursorHome);
            const currentManagedFiles = collectCurrentManagedFiles(cursorHome, desiredManagedFiles);
            const existingManifest = readManifest(cursorHome);
            const needsSync = shouldSyncManagedFiles(
                existingManifest,
                forgeVersion,
                desiredManagedFiles,
                currentManagedFiles
            );

            if (!needsSync) {
                outputChannel?.appendLine(
                    'Forge Cursor agents are already up to date in ~/.cursor/'
                );
                if (!options?.silent) {
                    vscode.window.showInformationMessage(
                        'Forge Cursor agents are already up to date in ~/.cursor.'
                    );
                }
                return;
            }

            if (shouldRequestUserConfirmation(needsSync, options?.confirmBeforeUpdate)) {
                const confirmation = await vscode.window.showInformationMessage(
                    'Forge detected Cursor agent updates for ~/.cursor. Apply updates now?',
                    'Update',
                    'Skip'
                );
                if (confirmation !== 'Update') {
                    outputChannel?.appendLine('Skipped Cursor agent update in ~/.cursor/');
                    return;
                }
            }

            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Installing Forge to ~/.cursor',
                    cancellable: false
                },
                async (progress) => {
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
                    fs.writeFileSync(hooksJsonDest, buildHooksJson(cursorHome), 'utf8');
                    outputChannel?.appendLine('Installed ~/.cursor/hooks.json');

                    writeManifest(cursorHome, {
                        manifestVersion: FORGE_MANIFEST_VERSION,
                        forgeVersion,
                        updatedAt: new Date().toISOString(),
                        managedFiles: desiredManagedFiles
                    });
                    outputChannel?.appendLine(`Updated ~/.cursor/${FORGE_MANIFEST_FILE}`);

                    if (!options?.silent || options?.confirmBeforeUpdate) {
                        vscode.window.showInformationMessage(
                            'Forge Cursor agents installed to ~/.cursor.'
                        );
                    }
                }
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            outputChannel?.appendLine(`Install failed: ${msg}`);
            vscode.window.showErrorMessage(`Install failed: ${msg}`);
        }
    }
}
