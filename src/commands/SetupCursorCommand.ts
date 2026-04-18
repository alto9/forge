import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
    DEFAULT_VISION_JSON,
    getDefaultProjectJson,
    SCHEMA_FILES
} from '../templates/forgeAssets';

type KnowledgeNode = {
    primary_doc?: string;
    children?: Array<string | KnowledgeNode>;
};

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

function collectMarkdownPaths(node: KnowledgeNode, acc: Set<string>) {
    if (typeof node.primary_doc === 'string' && node.primary_doc.endsWith('.md')) {
        acc.add(node.primary_doc);
    }
    for (const child of node.children ?? []) {
        if (typeof child === 'string') {
            if (child.endsWith('.md')) acc.add(child);
            continue;
        }
        collectMarkdownPaths(child, acc);
    }
}

function pathTitle(filePath: string): string {
    const filename = path.basename(filePath, '.md');
    return filename
        .split(/[_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function defaultMarkdownForPath(relativePath: string): string {
    const section = relativePath.replace('.forge/', '').replace(/\.md$/, '');
    const title = pathTitle(relativePath);
    const isIndexDoc = path.basename(relativePath) === 'index.md';
    if (isIndexDoc) {
        return `# ${title}

This document defines the current-state contract for the ${section} domain.

## Scope

- Record durable constraints and boundaries for this domain.
- Keep this file aligned with mapped child contracts.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
- Keep entries concise and remove stale pointers.
`;
    }

    return `# ${title}

Current-state contract for \`${section}\`.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
`;
}

function normalizeJson(rawJson: string): string | null {
    try {
        const parsed = JSON.parse(rawJson);
        return JSON.stringify(parsed, null, 2);
    } catch {
        return null;
    }
}

function syncCanonicalJsonReference(
    sourcePath: string,
    destinationPath: string,
    destinationLabel: string,
    outputChannel?: vscode.OutputChannel
) {
    if (!fs.existsSync(sourcePath)) return;

    const canonicalRaw = fs.readFileSync(sourcePath, 'utf8');
    const canonicalNormalized = normalizeJson(canonicalRaw);
    if (!canonicalNormalized) {
        outputChannel?.appendLine(`Warning: invalid canonical JSON at ${sourcePath}; skipping sync.`);
        return;
    }

    if (!fs.existsSync(destinationPath)) {
        fs.writeFileSync(destinationPath, `${canonicalNormalized}\n`, 'utf8');
        outputChannel?.appendLine(`Created ${destinationLabel}`);
        return;
    }

    const currentRaw = fs.readFileSync(destinationPath, 'utf8');
    const currentNormalized = normalizeJson(currentRaw);
    const isAccurate = currentNormalized === canonicalNormalized;
    if (isAccurate) {
        outputChannel?.appendLine(`Verified ${destinationLabel} (up to date)`);
        return;
    }

    fs.writeFileSync(destinationPath, `${canonicalNormalized}\n`, 'utf8');
    outputChannel?.appendLine(`Updated ${destinationLabel} from canonical source`);
}

function canonicalJsonNeedsSync(sourcePath: string, destinationPath: string): boolean {
    if (!fs.existsSync(sourcePath)) return false;
    if (!fs.existsSync(destinationPath)) return true;

    const canonicalRaw = fs.readFileSync(sourcePath, 'utf8');
    const canonicalNormalized = normalizeJson(canonicalRaw);
    if (!canonicalNormalized) return false;

    const currentRaw = fs.readFileSync(destinationPath, 'utf8');
    const currentNormalized = normalizeJson(currentRaw);
    return currentNormalized !== canonicalNormalized;
}

function getKnowledgeMapMarkdownPaths(knowledgeMapPath: string): Set<string> | null {
    if (!fs.existsSync(knowledgeMapPath)) return new Set<string>();

    try {
        const knowledgeMapRaw = fs.readFileSync(knowledgeMapPath, 'utf8');
        const parsed = JSON.parse(knowledgeMapRaw) as { knowledge_map?: KnowledgeNode[] };
        const mapRoots = Array.isArray(parsed.knowledge_map) ? parsed.knowledge_map : [];
        const markdownPaths = new Set<string>();
        for (const root of mapRoots) {
            collectMarkdownPaths(root, markdownPaths);
        }
        return markdownPaths;
    } catch {
        return null;
    }
}

export function projectForgeAssetsNeedSync(projectPath: string, extensionPath: string): boolean {
    const workflowPath = path.join(extensionPath, 'resources', 'workflow');
    if (!fs.existsSync(workflowPath)) {
        return false;
    }

    const forgeDir = path.join(projectPath, '.forge');
    const schemasDir = path.join(forgeDir, 'schemas');
    if (!fs.existsSync(forgeDir)) return true;
    if (!fs.existsSync(path.join(forgeDir, 'vision.json'))) return true;
    if (!fs.existsSync(path.join(forgeDir, 'project.json'))) return true;

    const skillRegistrySrc = path.join(workflowPath, 'references', 'skill_registry.json');
    const skillRegistryDest = path.join(forgeDir, 'skill_registry.json');
    if (canonicalJsonNeedsSync(skillRegistrySrc, skillRegistryDest)) return true;

    const knowledgeMapSrc = path.join(workflowPath, 'references', 'knowledge_map.json');
    const knowledgeMapDest = path.join(forgeDir, 'knowledge_map.json');
    if (canonicalJsonNeedsSync(knowledgeMapSrc, knowledgeMapDest)) return true;

    for (const schemaFile of SCHEMA_FILES) {
        const srcPath = path.join(extensionPath, 'schemas', schemaFile);
        const destPath = path.join(schemasDir, schemaFile);
        if (canonicalJsonNeedsSync(srcPath, destPath)) return true;
    }

    const markdownPaths = getKnowledgeMapMarkdownPaths(knowledgeMapDest);
    if (!markdownPaths) {
        return true;
    }

    for (const relativePath of markdownPaths) {
        if (!relativePath.startsWith('.forge/')) continue;
        const absolutePath = path.join(projectPath, relativePath);
        if (!fs.existsSync(absolutePath)) return true;
    }

    return false;
}

async function ensureKnowledgeMapDocs(
    forgeDir: string,
    knowledgeMapPath: string,
    outputChannel?: vscode.OutputChannel
) {
    const markdownPaths = getKnowledgeMapMarkdownPaths(knowledgeMapPath);
    if (!markdownPaths) {
        outputChannel?.appendLine('Warning: could not scaffold knowledge map markdown docs: invalid JSON.');
        return;
    }

    for (const relativePath of markdownPaths) {
        if (!relativePath.startsWith('.forge/')) continue;
        const absolutePath = path.join(path.dirname(forgeDir), relativePath);
        if (fs.existsSync(absolutePath)) continue;
        fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
        fs.writeFileSync(absolutePath, defaultMarkdownForPath(relativePath), 'utf8');
        outputChannel?.appendLine(`Created ${relativePath}`);
    }
}

/**
 * Project Cursor sync: ensures `.forge/` (always) and optionally `<project>/.cursor/` (agents, commands, skills, hooks) from `resources/workflow/`.
 * **Forge: Initialize Project** calls this with `forgeOnly: true` (`.forge/` only). **Forge: Initialize Cursor Agents** uses `InstallGlobalCommand` for `~/.cursor/` instead.
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

        const projectPath = await SetupCursorCommand.pickProjectPath();
        if (!projectPath) {
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
                    await SetupCursorCommand.syncProjectFolder(context, projectPath, outputChannel, {
                        forgeOnly: options?.forgeOnly,
                        progress
                    });

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

    static async syncProjectFolder(
        context: vscode.ExtensionContext,
        projectPath: string,
        outputChannel?: vscode.OutputChannel,
        options?: {
            forgeOnly?: boolean;
            progress?: { report: (value: { message?: string }) => void };
            silent?: boolean;
        }
    ): Promise<boolean> {
        const extensionPath = context.extensionPath;
        const workflowPath = path.join(extensionPath, 'resources', 'workflow');

        if (!fs.existsSync(workflowPath)) {
            const message = 'Forge workflow resources not found. The extension may be misconfigured.';
            outputChannel?.appendLine(message);
            if (!options?.silent) {
                vscode.window.showErrorMessage(message);
            }
            return false;
        }

        options?.progress?.report({ message: 'Creating .forge folder...' });
        await ensureForgeFolder(projectPath, extensionPath, workflowPath, outputChannel);

        if (!options?.forgeOnly) {
            options?.progress?.report({ message: 'Creating .cursor agents...' });
            await ensureCursorAgents(projectPath, workflowPath, outputChannel);

            options?.progress?.report({ message: 'Creating .cursor commands...' });
            await ensureCursorCommands(projectPath, workflowPath, outputChannel);

            options?.progress?.report({ message: 'Creating .cursor skills...' });
            await ensureCursorSkills(projectPath, workflowPath, outputChannel);

            options?.progress?.report({ message: 'Creating .cursor hooks...' });
            await ensureCursorHooks(projectPath, workflowPath, outputChannel);
        }

        return true;
    }

    private static async pickProjectPath(): Promise<string | null> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return null;
        }

        if (workspaceFolders.length === 1) {
            return workspaceFolders[0].uri.fsPath;
        }

        const selected = await vscode.window.showWorkspaceFolderPick({
            placeHolder: 'Select the project to setup for Cursor'
        });
        return selected?.uri.fsPath ?? null;
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
    syncCanonicalJsonReference(
        skillRegistrySrc,
        skillRegistryDest,
        '.forge/skill_registry.json',
        outputChannel
    );

    const knowledgeMapSrc = path.join(workflowPath, 'references', 'knowledge_map.json');
    const knowledgeMapDest = path.join(forgeDir, 'knowledge_map.json');
    syncCanonicalJsonReference(
        knowledgeMapSrc,
        knowledgeMapDest,
        '.forge/knowledge_map.json',
        outputChannel
    );

    for (const schemaFile of SCHEMA_FILES) {
        const srcPath = path.join(extensionPath, 'schemas', schemaFile);
        const destPath = path.join(schemasDir, schemaFile);
        syncCanonicalJsonReference(srcPath, destPath, `.forge/schemas/${schemaFile}`, outputChannel);
    }

    await ensureKnowledgeMapDocs(forgeDir, knowledgeMapDest, outputChannel);
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

export const __testables = {
    normalizeJson,
    canonicalJsonNeedsSync,
    getKnowledgeMapMarkdownPaths,
    syncCanonicalJsonReference,
    ensureForgeFolder,
    projectForgeAssetsNeedSync
};
