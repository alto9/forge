import { describe, it, expect } from 'vitest';
import { parseGithubRepoUrl, parseProjectBoardUrl } from '../github/projectBoardUrl';

describe('parseGithubRepoUrl', () => {
    it('parses https github repo', () => {
        expect(parseGithubRepoUrl('https://github.com/alto9/forge')).toEqual({
            owner: 'alto9',
            repo: 'forge'
        });
    });

    it('strips .git suffix', () => {
        expect(parseGithubRepoUrl('https://github.com/acme/widget.git')).toEqual({
            owner: 'acme',
            repo: 'widget'
        });
    });

    it('throws on invalid url', () => {
        expect(() => parseGithubRepoUrl('not-a-url')).toThrow(/Invalid github_url/);
    });
});

describe('parseProjectBoardUrl', () => {
    it('parses org project url', () => {
        expect(parseProjectBoardUrl('https://github.com/orgs/alto9/projects/12')).toEqual({
            ownerKind: 'org',
            owner: 'alto9',
            number: 12
        });
    });

    it('parses user project url', () => {
        expect(parseProjectBoardUrl('https://github.com/users/monalisa/projects/3')).toEqual({
            ownerKind: 'user',
            owner: 'monalisa',
            number: 3
        });
    });

    it('throws on issues list url', () => {
        expect(() =>
            parseProjectBoardUrl('https://github.com/alto9/forge/issues')
        ).toThrow(/Invalid github_board/);
    });
});
