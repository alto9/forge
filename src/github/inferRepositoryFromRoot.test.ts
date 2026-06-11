import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { inferRepositoryFromRoot } from '../github/inferRepositoryFromRoot';

describe('inferRepositoryFromRoot', () => {
    let tempRoot: string;

    afterEach(() => {
        if (tempRoot && fs.existsSync(tempRoot)) {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    it('reads owner/repo from .ai/project.json github_url', () => {
        tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-infer-repo-'));
        fs.mkdirSync(path.join(tempRoot, '.ai'), { recursive: true });
        fs.writeFileSync(
            path.join(tempRoot, '.ai/project.json'),
            JSON.stringify({ github_url: 'https://github.com/alto9/forge' })
        );

        expect(inferRepositoryFromRoot(tempRoot)).toEqual({
            owner: 'alto9',
            repo: 'forge',
        });
    });

    it('returns undefined when no repository context can be resolved', () => {
        tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-infer-repo-'));

        expect(inferRepositoryFromRoot(tempRoot)).toBeUndefined();
    });
});
