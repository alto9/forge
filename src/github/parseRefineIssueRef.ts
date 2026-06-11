import type { Diagnostic } from '../workflows/types';
import { parseProjectBoardUrl } from './projectBoardUrl';

export type ParseRefineIssueRefResult =
    | {
          ok: true;
          issueRef: string;
      }
    | {
          ok: false;
          diagnostics: Diagnostic[];
      };

const OWNER_REPO_HASH_PATTERN = /^([^/\s#]+)\/([^/\s#]+)#(\d+)$/;
const BARE_ISSUE_NUMBER_PATTERN = /^(\d+)$/;
const FULL_ISSUE_URL_PATTERN = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)\/?(?:[?#].*)?$/i;
const PROJECT_ISSUE_PATTERN =
    /^(https?:\/\/github\.com\/(?:orgs|users)\/[^/]+\/projects\/\d+)#(\d+)$/i;

function buildDiagnostic(
    code: string,
    message: string,
    pathValue = 'issue_ref'
): Diagnostic {
    return {
        code,
        severity: 'error',
        path: pathValue,
        message,
        validator_id: 'forge.refine_issue.command_entry',
    };
}

function buildFullIssueUrl(owner: string, repo: string, issueNumber: string): string {
    return `https://github.com/${owner}/${repo}/issues/${issueNumber}`;
}

function parseProjectIssueRef(rawInput: string): ParseRefineIssueRefResult | undefined {
    const match = rawInput.match(PROJECT_ISSUE_PATTERN);
    if (!match) {
        return undefined;
    }

    const [, projectUrl, issueNumber] = match;
    try {
        parseProjectBoardUrl(projectUrl);
    } catch {
        return {
            ok: false,
            diagnostics: [
                buildDiagnostic(
                    'github.project_unavailable',
                    'The project identifier could not be parsed from the supplied issue reference.'
                ),
            ],
        };
    }

    return {
        ok: true,
        issueRef: `${projectUrl}#${issueNumber}`,
    };
}

export function parseRefineIssueRef(input: {
    rawInput: string;
    inferredRepository?: { owner: string; repo: string };
}): ParseRefineIssueRefResult {
    const trimmed = input.rawInput.trim();
    if (!trimmed) {
        return {
            ok: false,
            diagnostics: [
                buildDiagnostic(
                    'github.issue_number_missing',
                    'A GitHub issue reference is required for refine-issue.'
                ),
            ],
        };
    }

    const fullUrlMatch = trimmed.match(FULL_ISSUE_URL_PATTERN);
    if (fullUrlMatch) {
        const [, owner, repo, issueNumber] = fullUrlMatch;
        return {
            ok: true,
            issueRef: buildFullIssueUrl(owner, repo, issueNumber),
        };
    }

    const projectIssue = parseProjectIssueRef(trimmed);
    if (projectIssue) {
        return projectIssue;
    }

    const ownerRepoMatch = trimmed.match(OWNER_REPO_HASH_PATTERN);
    if (ownerRepoMatch) {
        const [, owner, repo, issueNumber] = ownerRepoMatch;
        return {
            ok: true,
            issueRef: buildFullIssueUrl(owner, repo, issueNumber),
        };
    }

    const bareNumberMatch = trimmed.match(BARE_ISSUE_NUMBER_PATTERN);
    if (bareNumberMatch) {
        if (!input.inferredRepository) {
            return {
                ok: false,
                diagnostics: [
                    buildDiagnostic(
                        'github.repository_inference_failed',
                        'Could not infer repository owner/name for a bare issue number. Use a full issue URL or owner/repo#N.'
                    ),
                ],
            };
        }

        return {
            ok: true,
            issueRef: buildFullIssueUrl(
                input.inferredRepository.owner,
                input.inferredRepository.repo,
                bareNumberMatch[1]
            ),
        };
    }

    if (/github\.com/i.test(trimmed) && /\/issues\//i.test(trimmed)) {
        return {
            ok: false,
            diagnostics: [
                buildDiagnostic(
                    'github.issue_url_unresolved',
                    'The supplied GitHub issue URL could not be parsed.'
                ),
            ],
        };
    }

    return {
        ok: false,
        diagnostics: [
            buildDiagnostic(
                'github.issue_url_unresolved',
                'The supplied issue reference is not a supported GitHub issue URL, owner/repo#N, project identifier, or bare issue number.'
            ),
        ],
    };
}
