import { describe, expect, it } from 'vitest';
import { parseRefineIssueRef } from '../github/parseRefineIssueRef';

describe('parseRefineIssueRef', () => {
    it('accepts a full GitHub issue URL', () => {
        const result = parseRefineIssueRef({
            rawInput: 'https://github.com/alto9/forge/issues/77',
        });

        expect(result).toEqual({
            ok: true,
            issueRef: 'https://github.com/alto9/forge/issues/77',
        });
    });

    it('normalizes owner/repo#N to a full issue URL', () => {
        const result = parseRefineIssueRef({
            rawInput: 'alto9/forge#77',
        });

        expect(result).toEqual({
            ok: true,
            issueRef: 'https://github.com/alto9/forge/issues/77',
        });
    });

    it('builds a full issue URL from a bare issue number when repository context is inferred', () => {
        const result = parseRefineIssueRef({
            rawInput: '77',
            inferredRepository: { owner: 'alto9', repo: 'forge' },
        });

        expect(result).toEqual({
            ok: true,
            issueRef: 'https://github.com/alto9/forge/issues/77',
        });
    });

    it('rejects a bare issue number when repository context cannot be inferred', () => {
        const result = parseRefineIssueRef({
            rawInput: '77',
        });

        expect(result.ok).toBe(false);
        if (result.ok) {
            return;
        }

        expect(result.diagnostics[0]?.code).toBe('github.repository_inference_failed');
    });

    it('accepts a GitHub Projects v2 project identifier plus issue number', () => {
        const result = parseRefineIssueRef({
            rawInput: 'https://github.com/orgs/alto9/projects/9#77',
        });

        expect(result).toEqual({
            ok: true,
            issueRef: 'https://github.com/orgs/alto9/projects/9#77',
        });
    });

    it('rejects empty input', () => {
        const result = parseRefineIssueRef({
            rawInput: '   ',
        });

        expect(result.ok).toBe(false);
        if (result.ok) {
            return;
        }

        expect(result.diagnostics[0]?.code).toBe('github.issue_number_missing');
    });

    it('rejects malformed GitHub issue URLs', () => {
        const result = parseRefineIssueRef({
            rawInput: 'https://github.com/alto9/forge/issues/not-a-number',
        });

        expect(result.ok).toBe(false);
        if (result.ok) {
            return;
        }

        expect(result.diagnostics[0]?.code).toBe('github.issue_url_unresolved');
    });
});
