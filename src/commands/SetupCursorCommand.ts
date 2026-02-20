import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {
    DEFAULT_VISION_JSON,
    DEFAULT_FEATURES_JSON,
    DEFAULT_ROADMAP_JSON,
    DEFAULT_TECHNICAL_CONCEPTS_JSON,
    getDefaultProjectJson,
    SCHEMA_FILES,
    AGENT_TEMPLATES,
    HOOKS_JSON
} from '../templates/forgeAssets';
import {
    getManagedCommandPaths,
    getCommandTemplate
} from '../templates/cursorCommands';
import { generateCommandFile } from '../utils/commandValidation';
import {
    PULL_MILESTONES_SKILL_MD,
    PUSH_MILESTONES_SKILL_MD,
    PULL_MILESTONES_SCRIPT,
    PUSH_MILESTONES_SCRIPT,
    GET_ISSUE_DETAILS_SKILL_MD,
    GET_ISSUE_DETAILS_SCRIPT,
    START_ISSUE_BUILD_SKILL_MD,
    START_ISSUE_BUILD_SCRIPT,
    CREATE_FEATURE_BRANCH_SKILL_MD,
    CREATE_FEATURE_BRANCH_SCRIPT,
    COMMIT_SKILL_MD,
    COMMIT_SCRIPT,
    PUSH_SKILL_MD,
    PUSH_SCRIPT,
    MAKE_PULL_REQUEST_SKILL_MD,
    MAKE_PULL_REQUEST_SCRIPT,
    MAKE_MILESTONE_SKILL_MD,
    MAKE_MILESTONE_SCRIPT,
    MAKE_ISSUE_SKILL_MD,
    MAKE_ISSUE_SCRIPT,
    MAKE_SUB_ISSUE_SKILL_MD,
    MAKE_SUB_ISSUE_SCRIPT,
    REVIEW_PR_SKILL_MD,
    REVIEW_PR_SCRIPT
} from '../templates/skills';

/**
 * Setup project for Cursor: .forge folder, .cursor commands, agents, skills, hooks.
 */
export class SetupCursorCommand {
    static async execute(
        context: vscode.ExtensionContext,
        outputChannel?: vscode.OutputChannel,
        options?: { title?: string }
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
                    await ensureForgeFolder(projectPath, extensionPath, outputChannel);

                    progress.report({ message: 'Creating .cursor commands...' });
                    await ensureCursorCommands(projectPath, outputChannel);

                    progress.report({ message: 'Creating .cursor agents...' });
                    await ensureCursorAgents(projectPath, outputChannel);

                    progress.report({ message: 'Creating .cursor skills...' });
                    await ensureCursorSkills(projectPath, outputChannel);

                    progress.report({ message: 'Creating .cursor hooks...' });
                    await ensureCursorHooks(projectPath, extensionPath, outputChannel);

                    vscode.window.showInformationMessage(
                        'Project setup complete. .forge and .cursor folders created.'
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
    outputChannel?: vscode.OutputChannel
) {
    const forgeDir = path.join(projectPath, '.forge');
    const schemasDir = path.join(forgeDir, 'schemas');
    if (!fs.existsSync(forgeDir)) fs.mkdirSync(forgeDir, { recursive: true });
    if (!fs.existsSync(schemasDir)) fs.mkdirSync(schemasDir, { recursive: true });

    const forgeFiles: Record<string, string> = {
        'vision.json': DEFAULT_VISION_JSON,
        'features.json': DEFAULT_FEATURES_JSON,
        'roadmap.json': DEFAULT_ROADMAP_JSON,
        'technical_concepts.json': DEFAULT_TECHNICAL_CONCEPTS_JSON
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

    for (const schemaFile of SCHEMA_FILES) {
        const srcPath = path.join(extensionPath, 'schemas', schemaFile);
        const destPath = path.join(schemasDir, schemaFile);
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            outputChannel?.appendLine(`Copied schema ${schemaFile}`);
        }
    }
}

async function ensureCursorCommands(projectPath: string, outputChannel?: vscode.OutputChannel) {
    const commandsDir = path.join(projectPath, '.cursor', 'commands');
    if (!fs.existsSync(commandsDir)) fs.mkdirSync(commandsDir, { recursive: true });

    const commandPaths = getManagedCommandPaths();
    for (const commandPath of commandPaths) {
        const fullPath = path.join(projectPath, commandPath);
        const template = getCommandTemplate(commandPath);
        if (!template) continue;
        const content = generateCommandFile(commandPath);
        fs.writeFileSync(fullPath, content, 'utf8');
        outputChannel?.appendLine(`Created ${commandPath}`);
    }
}

async function ensureCursorAgents(projectPath: string, outputChannel?: vscode.OutputChannel) {
    const agentsDir = path.join(projectPath, '.cursor', 'agents');
    if (!fs.existsSync(agentsDir)) fs.mkdirSync(agentsDir, { recursive: true });

    for (const [filename, content] of Object.entries(AGENT_TEMPLATES)) {
        const fullPath = path.join(agentsDir, filename);
        fs.writeFileSync(fullPath, content, 'utf8');
        outputChannel?.appendLine(`Created .cursor/agents/${filename}`);
    }
}

const SKILL_DEFINITIONS: Array<{ name: string; skillMd: string; script: string }> = [
    { name: 'pull-milestones', skillMd: PULL_MILESTONES_SKILL_MD, script: PULL_MILESTONES_SCRIPT },
    { name: 'push-milestones', skillMd: PUSH_MILESTONES_SKILL_MD, script: PUSH_MILESTONES_SCRIPT },
    { name: 'get-issue-details', skillMd: GET_ISSUE_DETAILS_SKILL_MD, script: GET_ISSUE_DETAILS_SCRIPT },
    { name: 'start-issue-build', skillMd: START_ISSUE_BUILD_SKILL_MD, script: START_ISSUE_BUILD_SCRIPT },
    { name: 'create-feature-branch', skillMd: CREATE_FEATURE_BRANCH_SKILL_MD, script: CREATE_FEATURE_BRANCH_SCRIPT },
    { name: 'commit', skillMd: COMMIT_SKILL_MD, script: COMMIT_SCRIPT },
    { name: 'push-branch', skillMd: PUSH_SKILL_MD, script: PUSH_SCRIPT },
    { name: 'make-pull-request', skillMd: MAKE_PULL_REQUEST_SKILL_MD, script: MAKE_PULL_REQUEST_SCRIPT },
    { name: 'make-milestone', skillMd: MAKE_MILESTONE_SKILL_MD, script: MAKE_MILESTONE_SCRIPT },
    { name: 'make-issue', skillMd: MAKE_ISSUE_SKILL_MD, script: MAKE_ISSUE_SCRIPT },
    { name: 'make-sub-issue', skillMd: MAKE_SUB_ISSUE_SKILL_MD, script: MAKE_SUB_ISSUE_SCRIPT },
    { name: 'review-pr', skillMd: REVIEW_PR_SKILL_MD, script: REVIEW_PR_SCRIPT }
];

async function ensureCursorSkills(projectPath: string, outputChannel?: vscode.OutputChannel) {
    const skillsDir = path.join(projectPath, '.cursor', 'skills');

    for (const def of SKILL_DEFINITIONS) {
        const skillDir = path.join(skillsDir, def.name);
        const scriptsDir = path.join(skillDir, 'scripts');
        if (!fs.existsSync(scriptsDir)) fs.mkdirSync(scriptsDir, { recursive: true });

        fs.writeFileSync(path.join(skillDir, 'SKILL.md'), def.skillMd, 'utf8');
        const scriptPath = path.join(scriptsDir, `${def.name}.sh`);
        fs.writeFileSync(scriptPath, def.script, 'utf8');
        try {
            fs.chmodSync(scriptPath, 0o755);
        } catch {
            // chmod may fail on some systems
        }
    }

    outputChannel?.appendLine(`Created .cursor/skills (${SKILL_DEFINITIONS.map((d) => d.name).join(', ')})`);
}

async function ensureCursorHooks(
    projectPath: string,
    extensionPath: string,
    outputChannel?: vscode.OutputChannel
) {
    const hooksDir = path.join(projectPath, '.cursor', 'hooks');
    if (!fs.existsSync(hooksDir)) fs.mkdirSync(hooksDir, { recursive: true });

    fs.writeFileSync(path.join(projectPath, '.cursor', 'hooks.json'), HOOKS_JSON.trim(), 'utf8');
    const hookSrc = path.join(extensionPath, 'resources', 'hooks', 'validate-json-schema.js');
    const hookDest = path.join(hooksDir, 'validate-json-schema.js');
    if (fs.existsSync(hookSrc)) {
        fs.copyFileSync(hookSrc, hookDest);
        fs.chmodSync(hookDest, 0o755);
    }
    outputChannel?.appendLine('Created .cursor/hooks.json and validate-json-schema.js');
}
