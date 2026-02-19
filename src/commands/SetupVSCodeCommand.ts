import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {
    DEFAULT_VISION_JSON,
    DEFAULT_FEATURES_JSON,
    DEFAULT_ROADMAP_JSON,
    DEFAULT_TECHNICAL_CONCEPTS_JSON,
    getDefaultProjectJson,
    SCHEMA_FILES
} from '../templates/forgeAssets';
import {
    PULL_MILESTONES_SKILL_MD,
    PUSH_MILESTONES_SKILL_MD,
    PULL_MILESTONES_SCRIPT,
    PUSH_MILESTONES_SCRIPT
} from '../templates/skills';

/**
 * Setup project for VSCode: .forge folder and .github/skills.
 * Personas are installed via Forge extension chat participants.
 */
export class SetupVSCodeCommand {
    static async execute(
        context: vscode.ExtensionContext,
        outputChannel?: vscode.OutputChannel
    ) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }

        let projectUri = workspaceFolders[0].uri;
        if (workspaceFolders.length > 1) {
            const selected = await vscode.window.showWorkspaceFolderPick({
                placeHolder: 'Select the project to setup for VSCode'
            });
            if (!selected) return;
            projectUri = selected.uri;
        }

        const projectPath = projectUri.fsPath;
        const extensionPath = context.extensionPath;

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Setting up project for VSCode',
                cancellable: false
            },
            async (progress) => {
                try {
                    progress.report({ message: 'Creating .forge folder...' });
                    await ensureForgeFolder(projectPath, extensionPath, outputChannel);

                    progress.report({ message: 'Creating .github/skills...' });
                    await ensureGitHubSkills(projectPath, outputChannel);

                    vscode.window.showInformationMessage(
                        'Project setup for VSCode complete. .forge and .github/skills created.'
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

async function ensureGitHubSkills(projectPath: string, outputChannel?: vscode.OutputChannel) {
    const skillsDir = path.join(projectPath, '.github', 'skills');
    const pullDir = path.join(skillsDir, 'pull-milestones', 'scripts');
    const pushDir = path.join(skillsDir, 'push-milestones', 'scripts');
    if (!fs.existsSync(pullDir)) fs.mkdirSync(pullDir, { recursive: true });
    if (!fs.existsSync(pushDir)) fs.mkdirSync(pushDir, { recursive: true });

    fs.writeFileSync(path.join(skillsDir, 'pull-milestones', 'SKILL.md'), PULL_MILESTONES_SKILL_MD, 'utf8');
    fs.writeFileSync(path.join(pullDir, 'pull-milestones.sh'), PULL_MILESTONES_SCRIPT, 'utf8');
    fs.writeFileSync(path.join(skillsDir, 'push-milestones', 'SKILL.md'), PUSH_MILESTONES_SKILL_MD, 'utf8');
    fs.writeFileSync(path.join(pushDir, 'push-milestones.sh'), PUSH_MILESTONES_SCRIPT, 'utf8');
    outputChannel?.appendLine('Created .github/skills (pull-milestones, push-milestones)');
}
