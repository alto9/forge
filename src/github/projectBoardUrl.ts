/**
 * Parse GitHub repository URL into owner and repo name.
 * Accepts https://github.com/owner/repo and optional paths, .git suffix.
 */
export function parseGithubRepoUrl(url: string): { owner: string; repo: string } {
    const trimmed = url.trim();
    const m = trimmed.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
    if (!m) {
        throw new Error(
            `Invalid github_url: expected a URL like https://github.com/owner/repo — got "${trimmed}"`
        );
    }
    const repo = m[2].replace(/\.git$/i, '');
    return { owner: m[1], repo };
}

export type ProjectBoardTarget = {
    ownerKind: 'org' | 'user';
    owner: string;
    number: number;
};

/**
 * Parse a GitHub Projects (v2) board URL.
 * Supported: https://github.com/orgs/{org}/projects/{n}
 *            https://github.com/users/{user}/projects/{n}
 */
export function parseProjectBoardUrl(boardUrl: string): ProjectBoardTarget {
    const trimmed = boardUrl.trim();
    const orgMatch = trimmed.match(/github\.com\/orgs\/([^/]+)\/projects\/(\d+)/i);
    if (orgMatch) {
        return {
            ownerKind: 'org',
            owner: orgMatch[1],
            number: parseInt(orgMatch[2], 10)
        };
    }
    const userMatch = trimmed.match(/github\.com\/users\/([^/]+)\/projects\/(\d+)/i);
    if (userMatch) {
        return {
            ownerKind: 'user',
            owner: userMatch[1],
            number: parseInt(userMatch[2], 10)
        };
    }
    throw new Error(
        `Invalid github_board: set it to your GitHub Project URL, e.g. https://github.com/orgs/acme-corp/projects/3 — got "${trimmed}"`
    );
}
