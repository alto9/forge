import * as vscode from 'vscode';
import { Octokit } from '@octokit/rest';
import { GitUtils } from '../utils/GitUtils';

export interface GitHubIssue {
    number: number;
    title: string;
    body: string;
    html_url: string;
    state: string;
    labels: Array<{ name: string; color: string }>;
    milestone?: { title: string; number: number };
    assignees: Array<{ login: string }>;
    created_at: string;
    updated_at: string;
}

export interface GitHubRepoInfo {
    owner: string;
    repo: string;
}

export class GitHubService {
    private static async getOctokit(): Promise<Octokit> {
        let auth: string | undefined;
        try {
            const session = await vscode.authentication.getSession('github', ['repo'], { createIfNone: true });
            if (session) {
                auth = session.accessToken;
            }
        } catch (error) {
            throw new Error('GitHub authentication required. Please sign in to GitHub in VSCode (Cmd/Ctrl+Shift+P → "GitHub: Sign In")');
        }

        if (!auth) {
            throw new Error('GitHub authentication required. Please sign in to GitHub in VSCode (Cmd/Ctrl+Shift+P → "GitHub: Sign In")');
        }

        return new Octokit({
            baseUrl: 'https://api.github.com',
            auth
        });
    }

    /**
     * Get GitHub repository info from workspace
     */
    static async getRepoInfo(workspacePath: string): Promise<GitHubRepoInfo | null> {
        try {
            const remoteUrl = await GitUtils.executeGitCommand(workspacePath, ['remote', 'get-url', 'origin']);
            return this.parseGitHubUrl(remoteUrl.trim());
        } catch (error) {
            console.error('Failed to get GitHub repo info:', error);
            return null;
        }
    }

    /**
     * Parse GitHub URL to extract owner and repo
     */
    private static parseGitHubUrl(url: string): GitHubRepoInfo | null {
        // Handle HTTPS URLs: https://github.com/owner/repo.git
        const httpsMatch = url.match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
        if (httpsMatch) {
            return {
                owner: httpsMatch[1],
                repo: httpsMatch[2].replace(/\.git$/, '')
            };
        }

        // Handle SSH URLs: git@github.com:owner/repo.git
        const sshMatch = url.match(/git@github\.com:([^/]+)\/(.+?)(\.git)?$/);
        if (sshMatch) {
            return {
                owner: sshMatch[1],
                repo: sshMatch[2].replace(/\.git$/, '')
            };
        }

        return null;
    }

    /**
     * Parse issue identifier (URL or number) to extract owner, repo, and issue number
     */
    static parseIssueIdentifier(issueIdentifier: string, repoInfo?: GitHubRepoInfo): { owner: string; repo: string; issueNumber: number } {
        // Try to parse as URL first
        const urlMatch = issueIdentifier.match(/github\.com\/([\w-]+)\/([\w-]+)\/issues\/(\d+)/);
        if (urlMatch) {
            return {
                owner: urlMatch[1],
                repo: urlMatch[2],
                issueNumber: parseInt(urlMatch[3], 10)
            };
        }

        // Try to parse as owner/repo#number
        const shortMatch = issueIdentifier.match(/^([\w-]+)\/([\w-]+)#(\d+)$/);
        if (shortMatch) {
            return {
                owner: shortMatch[1],
                repo: shortMatch[2],
                issueNumber: parseInt(shortMatch[3], 10)
            };
        }

        // Try to parse as just a number (requires repoInfo)
        if (/^\d+$/.test(issueIdentifier.trim()) && repoInfo) {
            return {
                owner: repoInfo.owner,
                repo: repoInfo.repo,
                issueNumber: parseInt(issueIdentifier.trim(), 10)
            };
        }

        throw new Error('Invalid GitHub issue format. Use full URL, owner/repo#number, or issue number (if in repo context)');
    }

    /**
     * Fetch issue details from GitHub
     */
    static async getIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
        const octokit = await this.getOctokit();

        try {
            const { data } = await octokit.rest.issues.get({
                owner,
                repo,
                issue_number: issueNumber
            });

            return {
                number: data.number,
                title: data.title,
                body: data.body || '',
                html_url: data.html_url,
                state: data.state,
                labels: data.labels.map((label: any) => ({
                    name: typeof label === 'string' ? label : label.name,
                    color: typeof label === 'object' && label.color ? label.color : '000000'
                })),
                milestone: data.milestone ? { title: data.milestone.title, number: data.milestone.number } : undefined,
                assignees: data.assignees?.map((a: any) => ({ login: a.login })) || [],
                created_at: data.created_at,
                updated_at: data.updated_at
            };
        } catch (error: any) {
            throw new Error(`Failed to fetch GitHub issue #${issueNumber}: ${error.message || error}`);
        }
    }

    /**
     * Get the parent issue of a sub-issue
     */
    static async getParentIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue | null> {
        const octokit = await this.getOctokit();

        try {
            console.log(`GitHubService: Fetching parent issue for sub-issue #${issueNumber}...`);
            
            // Use request method directly since getParentIssue might not be in Octokit v22 yet
            const { data: parentIssue } = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}/parent', {
                owner,
                repo,
                issue_number: issueNumber
            });

            console.log(`GitHubService: Found parent issue #${parentIssue.number}`);
            
            return {
                number: parentIssue.number,
                title: parentIssue.title,
                body: parentIssue.body || '',
                html_url: parentIssue.html_url,
                state: parentIssue.state,
                labels: parentIssue.labels.map((label: any) => ({
                    name: typeof label === 'string' ? label : label.name,
                    color: typeof label === 'object' && label.color ? label.color : '000000'
                })),
                milestone: parentIssue.milestone ? { title: parentIssue.milestone.title, number: parentIssue.milestone.number } : undefined,
                assignees: parentIssue.assignees?.map((a: any) => ({ login: a.login })) || [],
                created_at: parentIssue.created_at,
                updated_at: parentIssue.updated_at
            };
        } catch (error: any) {
            // 404 means this issue doesn't have a parent (it's not a sub-issue)
            if (error.status === 404) {
                console.log(`GitHubService: Issue #${issueNumber} does not have a parent issue`);
                return null;
            }
            console.error(`GitHubService: Error fetching parent issue for #${issueNumber}:`, error);
            throw new Error(`Failed to fetch parent issue for #${issueNumber}: ${error.message || error}`);
        }
    }

    /**
     * Get sub-issues (issues linked to a parent issue)
     */
    static async getSubIssues(owner: string, repo: string, parentIssueNumber: number): Promise<GitHubIssue[]> {
        const octokit = await this.getOctokit();

        try {
            // Use GitHub's native sub-issues API endpoint
            console.log(`GitHubService: Fetching sub-issues for parent issue #${parentIssueNumber} using native API...`);
            
            const { data: subIssuesData } = await octokit.rest.issues.listSubIssues({
                owner,
                repo,
                issue_number: parentIssueNumber
            });

            console.log(`GitHubService: Native API returned ${subIssuesData.length} sub-issues`);

            // Convert to our GitHubIssue format
            const subIssues: GitHubIssue[] = subIssuesData.map((item: any) => ({
                number: item.number,
                title: item.title,
                body: item.body || '',
                html_url: item.html_url,
                state: item.state,
                labels: item.labels.map((label: any) => ({
                    name: typeof label === 'string' ? label : label.name,
                    color: typeof label === 'object' && label.color ? label.color : '000000'
                })),
                milestone: item.milestone ? { title: item.milestone.title, number: item.milestone.number } : undefined,
                assignees: item.assignees?.map((a: any) => ({ login: a.login })) || [],
                created_at: item.created_at,
                updated_at: item.updated_at
            }));

            console.log(`GitHubService: Returning ${subIssues.length} sub-issues for issue #${parentIssueNumber}`);
            return subIssues;
        } catch (error: any) {
            console.error(`GitHubService: Error fetching sub-issues for #${parentIssueNumber}:`, error);
            throw new Error(`Failed to fetch sub-issues for #${parentIssueNumber}: ${error.message || error}`);
        }
    }

    /**
     * Create a sub-issue linked to a parent issue
     */
    static async createSubIssue(
        owner: string,
        repo: string,
        parentIssueNumber: number,
        title: string,
        body: string
    ): Promise<GitHubIssue> {
        const octokit = await this.getOctokit();

        try {
            // First, create the issue
            console.log(`GitHubService: Creating sub-issue "${title}" for parent issue #${parentIssueNumber}...`);
            const { data: newIssue } = await octokit.rest.issues.create({
                owner,
                repo,
                title,
                body
            });

            console.log(`GitHubService: Created issue #${newIssue.number}, now linking as sub-issue...`);

            // Then, link it as a sub-issue using GitHub's native API
            await octokit.rest.issues.addSubIssue({
                owner,
                repo,
                issue_number: parentIssueNumber,
                sub_issue_id: newIssue.id
            });

            console.log(`GitHubService: Successfully linked issue #${newIssue.number} as sub-issue of #${parentIssueNumber}`);

            return {
                number: newIssue.number,
                title: newIssue.title,
                body: newIssue.body || '',
                html_url: newIssue.html_url,
                state: newIssue.state,
                labels: newIssue.labels.map((label: any) => ({
                    name: typeof label === 'string' ? label : label.name,
                    color: typeof label === 'object' && label.color ? label.color : '000000'
                })),
                milestone: newIssue.milestone ? { title: newIssue.milestone.title, number: newIssue.milestone.number } : undefined,
                assignees: newIssue.assignees?.map((a: any) => ({ login: a.login })) || [],
                created_at: newIssue.created_at,
                updated_at: newIssue.updated_at
            };
        } catch (error: any) {
            console.error(`GitHubService: Error creating sub-issue:`, error);
            throw new Error(`Failed to create sub-issue: ${error.message || error}`);
        }
    }

    /**
     * Update an issue
     */
    static async updateIssue(
        owner: string,
        repo: string,
        issueNumber: number,
        updates: {
            title?: string;
            body?: string;
            state?: 'open' | 'closed';
            labels?: string[];
            milestone?: string;
            assignees?: string[];
        }
    ): Promise<GitHubIssue> {
        const octokit = await this.getOctokit();

        try {
            const updatePayload: any = {
                owner,
                repo,
                issue_number: issueNumber
            };

            if (updates.title !== undefined) {
                updatePayload.title = updates.title;
            }
            if (updates.body !== undefined) {
                updatePayload.body = updates.body;
            }
            if (updates.state !== undefined) {
                updatePayload.state = updates.state;
            }
            if (updates.labels !== undefined) {
                updatePayload.labels = updates.labels;
            }
            if (updates.assignees !== undefined) {
                updatePayload.assignees = updates.assignees;
            }

            // Handle milestone (need to look up milestone number by title)
            if (updates.milestone && updates.milestone.trim()) {
                try {
                    const { data: milestones } = await octokit.rest.issues.listMilestones({
                        owner,
                        repo,
                        state: 'all'
                    });
                    const matchingMilestone = milestones.find((m: any) => m.title === updates.milestone);
                    if (matchingMilestone) {
                        updatePayload.milestone = matchingMilestone.number;
                    }
                } catch (error) {
                    console.log('Failed to set milestone:', error);
                }
            }

            const { data } = await octokit.rest.issues.update(updatePayload);

            return {
                number: data.number,
                title: data.title,
                body: data.body || '',
                html_url: data.html_url,
                state: data.state,
                labels: data.labels.map((label: any) => ({
                    name: typeof label === 'string' ? label : label.name,
                    color: typeof label === 'object' && label.color ? label.color : '000000'
                })),
                milestone: data.milestone ? { title: data.milestone.title, number: data.milestone.number } : undefined,
                assignees: data.assignees?.map((a: any) => ({ login: a.login })) || [],
                created_at: data.created_at,
                updated_at: data.updated_at
            };
        } catch (error: any) {
            throw new Error(`Failed to update issue #${issueNumber}: ${error.message || error}`);
        }
    }

    /**
     * Update issue status/state
     */
    static async updateIssueStatus(
        owner: string,
        repo: string,
        issueNumber: number,
        state: 'open' | 'closed'
    ): Promise<void> {
        await this.updateIssue(owner, repo, issueNumber, { state });
    }

    /**
     * Get all milestones for a repository
     */
    static async getMilestones(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'all'): Promise<Array<{
        number: number;
        title: string;
        description: string | null;
        state: string;
        open_issues: number;
        closed_issues: number;
        due_on: string | null;
        created_at: string;
        updated_at: string;
    }>> {
        const octokit = await this.getOctokit();

        try {
            const { data } = await octokit.rest.issues.listMilestones({
                owner,
                repo,
                state,
                per_page: 100
            });

            return data.map((milestone: any) => ({
                number: milestone.number,
                title: milestone.title,
                description: milestone.description,
                state: milestone.state,
                open_issues: milestone.open_issues,
                closed_issues: milestone.closed_issues,
                due_on: milestone.due_on,
                created_at: milestone.created_at,
                updated_at: milestone.updated_at
            }));
        } catch (error: any) {
            throw new Error(`Failed to fetch milestones: ${error.message || error}`);
        }
    }

    /**
     * Get all issues for a repository, optionally filtered by milestone
     */
    static async getIssues(
        owner: string,
        repo: string,
        options: {
            milestone?: number | string;
            state?: 'open' | 'closed' | 'all';
            per_page?: number;
        } = {}
    ): Promise<GitHubIssue[]> {
        const octokit = await this.getOctokit();

        try {
            const params: any = {
                owner,
                repo,
                state: options.state || 'all',
                per_page: options.per_page || 100
            };

            if (options.milestone !== undefined) {
                params.milestone = options.milestone;
            }

            const { data } = await octokit.rest.issues.listForRepo(params);

            return data.map((issue: any) => ({
                number: issue.number,
                title: issue.title,
                body: issue.body || '',
                html_url: issue.html_url,
                state: issue.state,
                labels: issue.labels.map((label: any) => ({
                    name: typeof label === 'string' ? label : label.name,
                    color: typeof label === 'object' && label.color ? label.color : '000000'
                })),
                milestone: issue.milestone ? { title: issue.milestone.title, number: issue.milestone.number } : undefined,
                assignees: issue.assignees?.map((a: any) => ({ login: a.login })) || [],
                created_at: issue.created_at,
                updated_at: issue.updated_at
            }));
        } catch (error: any) {
            throw new Error(`Failed to fetch issues: ${error.message || error}`);
        }
    }

    /**
     * Get all projects for a repository (GitHub Projects v2)
     * Includes both repository-level and organization-level projects
     */
    static async getProjects(owner: string, repo: string): Promise<Array<{
        id: string;
        number: number;
        title: string;
        state: string;
        scope: 'repository' | 'organization';
    }>> {
        const octokit = await this.getOctokit();

        const projects: Array<{
            id: string;
            number: number;
            title: string;
            state: string;
            scope: 'repository' | 'organization';
        }> = [];

        try {
            // First, try to get repository-level projects
            const repoQuery = `
                query($owner: String!, $repo: String!) {
                    repository(owner: $owner, name: $repo) {
                        projectsV2(first: 20) {
                            nodes {
                                id
                                number
                                title
                                closed
                            }
                        }
                    }
                }
            `;

            const repoResult = await octokit.graphql(repoQuery, {
                owner,
                repo
            }) as any;

            if (repoResult?.repository?.projectsV2?.nodes) {
                const repoProjects = repoResult.repository.projectsV2.nodes
                    .filter((project: any) => !project.closed)
                    .map((project: any) => ({
                        id: project.id,
                        number: project.number,
                        title: project.title,
                        state: project.closed ? 'closed' : 'open',
                        scope: 'repository' as const
                    }));
                projects.push(...repoProjects);
            }

            // Also try to get organization-level projects
            // Check if owner is an organization (not a user)
            try {
                const orgQuery = `
                    query($owner: String!) {
                        organization(login: $owner) {
                            projectsV2(first: 20) {
                                nodes {
                                    id
                                    number
                                    title
                                    closed
                                }
                            }
                        }
                    }
                `;

                const orgResult = await octokit.graphql(orgQuery, {
                    owner
                }) as any;

                if (orgResult?.organization?.projectsV2?.nodes) {
                    const orgProjects = orgResult.organization.projectsV2.nodes
                        .filter((project: any) => !project.closed)
                        .map((project: any) => ({
                            id: project.id,
                            number: project.number,
                            title: project.title,
                            state: project.closed ? 'closed' : 'open',
                            scope: 'organization' as const
                        }));
                    projects.push(...orgProjects);
                }
            } catch (orgError: any) {
                // If owner is not an organization (it's a user), this will fail - that's okay
                // We'll just use repository-level projects
                console.log('Owner is not an organization, skipping organization-level projects');
            }

            return projects;
        } catch (error: any) {
            console.log('Failed to fetch projects:', error.message);
            if (error.errors) {
                console.log('GraphQL errors:', JSON.stringify(error.errors, null, 2));
            }
            return [];
        }
    }

    /**
     * Get iterations (sprints) from a GitHub Project v2
     */
    static async getIterations(projectId: string): Promise<Array<{
        id: string;
        title: string;
        startDate: string | null;
        duration: number;
    }>> {
        const octokit = await this.getOctokit();

        try {
            // Use GraphQL API for Projects v2 iterations
            const query = `
                query($projectId: ID!) {
                    node(id: $projectId) {
                        ... on ProjectV2 {
                            field(name: "Iteration") {
                                ... on ProjectV2IterationField {
                                    configuration {
                                        iterations {
                                            id
                                            title
                                            startDate
                                            duration
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const { node } = await octokit.graphql(query, {
                projectId
            }) as any;

            if (!node) {
                console.log('Project node not found for projectId:', projectId);
                return [];
            }

            if (!node.field) {
                console.log('Iteration field not found in project. The project may not have an Iteration field configured.');
                return [];
            }

            if (!node.field.configuration) {
                console.log('Iteration field configuration not found');
                return [];
            }

            const iterations = node.field.configuration.iterations || [];
            console.log(`Found ${iterations.length} iterations in project`);
            return iterations;
        } catch (error: any) {
            console.log('Failed to fetch iterations:', error.message);
            if (error.errors) {
                console.log('GraphQL errors:', JSON.stringify(error.errors, null, 2));
            }
            return [];
        }
    }

    /**
     * Get issues assigned to a specific iteration in a project
     * Works with both repository-level and organization-level projects
     */
    static async getIssuesForIteration(
        projectId: string,
        iterationId: string
    ): Promise<GitHubIssue[]> {
        const octokit = await this.getOctokit();

        try {
            // Query project items directly by project ID (works for both repo and org projects)
            const query = `
                query($projectId: ID!) {
                    node(id: $projectId) {
                        ... on ProjectV2 {
                            items(first: 100) {
                                nodes {
                                    content {
                                        ... on Issue {
                                            number
                                            title
                                            body
                                            url
                                            state
                                            labels(first: 20) {
                                                nodes {
                                                    name
                                                    color
                                                }
                                            }
                                            milestone {
                                                title
                                                number
                                            }
                                            assignees(first: 10) {
                                                nodes {
                                                    login
                                                }
                                            }
                                            createdAt
                                            updatedAt
                                        }
                                    }
                                    fieldValueByName(name: "Iteration") {
                                        ... on ProjectV2ItemFieldIterationValue {
                                            iterationId
                                            title
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const { node } = await octokit.graphql(query, {
                projectId
            }) as any;

            if (!node || !node.items) {
                console.log(`Project items not found for project ${projectId}`);
                return [];
            }

            const items = node.items.nodes || [];
            console.log(`Found ${items.length} total items in project`);
            
            const filteredItems = items
                .filter((item: any) => {
                    const iterationValue = item.fieldValueByName;
                    if (!iterationValue) {
                        return false;
                    }
                    const matches = iterationValue.iterationId === iterationId;
                    if (matches) {
                        console.log(`Item matches iteration ${iterationId}: ${item.content?.title || 'unknown'}`);
                    }
                    return matches;
                });
            
            console.log(`Found ${filteredItems.length} items matching iteration ${iterationId}`);
            
            return filteredItems
                .map((item: any) => {
                    const issue = item.content;
                    if (!issue) {
                        console.log('Item has no content (might be a PR or other type)');
                        return null;
                    }

                    return {
                        number: issue.number,
                        title: issue.title,
                        body: issue.body || '',
                        html_url: issue.url,
                        state: issue.state.toLowerCase(),
                        labels: (issue.labels?.nodes || []).map((label: any) => ({
                            name: label.name,
                            color: label.color
                        })),
                        milestone: issue.milestone ? {
                            title: issue.milestone.title,
                            number: issue.milestone.number
                        } : undefined,
                        assignees: (issue.assignees?.nodes || []).map((a: any) => ({ login: a.login })),
                        created_at: issue.createdAt,
                        updated_at: issue.updatedAt
                    };
                })
                .filter((issue: any) => issue !== null) as GitHubIssue[];
        } catch (error: any) {
            console.log('Failed to fetch issues for iteration:', error.message);
            if (error.errors) {
                console.log('GraphQL errors:', JSON.stringify(error.errors, null, 2));
            }
            return [];
        }
    }
}
