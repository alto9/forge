import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { parseGithubRepoUrl } from './projectBoardUrl';

const PROJECT_JSON_RELATIVE_PATHS = ['.ai/project.json', '.forge/project.json'] as const;

function readGithubUrlFromProjectJson(repositoryRoot: string): string | undefined {
    for (const relativePath of PROJECT_JSON_RELATIVE_PATHS) {
        const projectJsonPath = path.join(repositoryRoot, relativePath);
        if (!fs.existsSync(projectJsonPath)) {
            continue;
        }

        try {
            const parsed = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8')) as {
                github_url?: unknown;
            };
            if (typeof parsed.github_url === 'string' && parsed.github_url.trim()) {
                return parsed.github_url.trim();
            }
        } catch {
            continue;
        }
    }

    return undefined;
}

function readOriginRemoteUrl(repositoryRoot: string): string | undefined {
    try {
        const remoteUrl = execFileSync(
            'git',
            ['-C', repositoryRoot, 'remote', 'get-url', 'origin'],
            { encoding: 'utf8' }
        ).trim();

        return remoteUrl || undefined;
    } catch {
        return undefined;
    }
}

function parseGitRemoteUrl(remoteUrl: string): { owner: string; repo: string } | undefined {
    const sshMatch = remoteUrl.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/i);
    if (sshMatch) {
        return { owner: sshMatch[1], repo: sshMatch[2] };
    }

    if (/github\.com/i.test(remoteUrl)) {
        try {
            return parseGithubRepoUrl(remoteUrl);
        } catch {
            return undefined;
        }
    }

    return undefined;
}

export function inferRepositoryFromRoot(
    repositoryRoot: string
): { owner: string; repo: string } | undefined {
    const projectGithubUrl = readGithubUrlFromProjectJson(repositoryRoot);
    if (projectGithubUrl) {
        try {
            return parseGithubRepoUrl(projectGithubUrl);
        } catch {
            // Fall through to git remote inference.
        }
    }

    const remoteUrl = readOriginRemoteUrl(repositoryRoot);
    if (!remoteUrl) {
        return undefined;
    }

    return parseGitRemoteUrl(remoteUrl);
}
