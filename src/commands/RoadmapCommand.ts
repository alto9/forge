import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { fetchRoadmapIssuesWithFallback } from '../github/roadmapGraphql';
import { parseGithubRepoUrl, parseProjectBoardUrl } from '../github/projectBoardUrl';
import { RoadmapPanel } from '../webview/RoadmapPanel';

type ForgeProjectJson = {
    github_url: string;
    github_board: string;
};

function readProjectJson(folder: vscode.WorkspaceFolder): ForgeProjectJson {
    const root = folder.uri.fsPath;
    const metaPath = path.join(root, '.forge', 'project.json');
    if (!fs.existsSync(metaPath)) {
        throw new Error(
            `No .forge/project.json in "${folder.name}". Run **Forge: Initialize Project** first.`
        );
    }
    const raw = fs.readFileSync(metaPath, 'utf8');
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error(`.forge/project.json in "${folder.name}" is not valid JSON.`);
    }
    if (!parsed || typeof parsed !== 'object') {
        throw new Error(`.forge/project.json in "${folder.name}" must be a JSON object.`);
    }
    const o = parsed as Record<string, unknown>;
    const github_url = o.github_url;
    const github_board = o.github_board;
    if (typeof github_url !== 'string' || !github_url.trim()) {
        throw new Error(`.forge/project.json must include a string "github_url".`);
    }
    if (typeof github_board !== 'string' || !github_board.trim()) {
        throw new Error(`.forge/project.json must include a string "github_board" (GitHub Project v2 URL).`);
    }
    return {
        github_url: github_url.trim(),
        github_board: github_board.trim()
    };
}

async function pickFolder(): Promise<vscode.WorkspaceFolder | undefined> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders?.length) {
        void vscode.window.showErrorMessage('Forge Roadmap needs an open workspace folder.');
        return undefined;
    }
    if (folders.length === 1) {
        return folders[0];
    }
    return vscode.window.showWorkspaceFolderPick({
        placeHolder: 'Select the Forge project folder for the roadmap'
    });
}

export class RoadmapCommand {
    static async execute(context: vscode.ExtensionContext): Promise<void> {
        const folder = await pickFolder();
        if (!folder) {
            return;
        }

        let project: ForgeProjectJson;
        try {
            project = readProjectJson(folder);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            void vscode.window.showErrorMessage(msg);
            return;
        }

        let repoTarget: ReturnType<typeof parseGithubRepoUrl>;
        let boardTarget: ReturnType<typeof parseProjectBoardUrl>;
        try {
            repoTarget = parseGithubRepoUrl(project.github_url);
            boardTarget = parseProjectBoardUrl(project.github_board);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            void vscode.window.showErrorMessage(msg);
            return;
        }

        const config = vscode.workspace.getConfiguration('forge');
        const statusFieldName = config.get<string>('roadmap.statusFieldName', 'Status');
        const sprintFieldName = config.get<string>('roadmap.sprintFieldName', 'Sprint');
        const doneStatusName = config.get<string>('roadmap.doneStatusName', 'Done');

        let session: vscode.AuthenticationSession;
        try {
            const s = await vscode.authentication.getSession(
                'github',
                ['repo', 'read:project', 'read:user'],
                { createIfNone: true }
            );
            if (!s) {
                void vscode.window.showErrorMessage(
                    'GitHub sign-in was cancelled. Forge Roadmap needs a GitHub session.'
                );
                return;
            }
            session = s;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            void vscode.window.showErrorMessage(`GitHub authentication failed: ${msg}`);
            return;
        }

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Loading roadmap from GitHub…',
                cancellable: false
            },
            async () => {
                try {
                    const { project: ghProject, issues } = await fetchRoadmapIssuesWithFallback(
                        session.accessToken,
                        boardTarget,
                        {
                            statusFieldName,
                            sprintFieldName,
                            doneStatusName
                        }
                    );
                    await RoadmapPanel.show(context, {
                        primaryRepo: `${repoTarget.owner}/${repoTarget.repo}`,
                        projectTitle: ghProject.title,
                        issues
                    });
                } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    void vscode.window.showErrorMessage(`Forge Roadmap: ${msg}`);
                }
            }
        );
    }
}
