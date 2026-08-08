import { describe, expect, it } from 'vitest';
import { parseSubmodules, serializeSubmodules } from './gitmodules';
import { detectProviderFromUrl } from './provider';

describe('parseSubmodules', () => {
    it('parses path url and branch', () => {
        const contents = `
[submodule "kube9-web"]
\tpath = kube9/kube9-web
\turl = git@github.com:alto9/kube9-web.git
\tbranch = main
[submodule "policy"]
\tpath = control9/policy
\turl = tom.h@example.org:alto9/policy.git
\tbranch = develop
`;
        const entries = parseSubmodules(contents);
        expect(entries).toHaveLength(2);
        expect(entries[0]).toEqual({
            name: 'kube9-web',
            path: 'kube9/kube9-web',
            url: 'git@github.com:alto9/kube9-web.git',
            branch: 'main'
        });
        expect(entries[1].branch).toBe('develop');
    });

    it('round-trips serialize', () => {
        const entries = [
            {
                name: 'forge',
                path: 'forge',
                url: 'git@github.com:alto9/forge.git',
                branch: 'main'
            }
        ];
        const again = parseSubmodules(serializeSubmodules(entries));
        expect(again).toEqual(entries);
    });
});

describe('detectProviderFromUrl', () => {
    it('detects github and gitlab', () => {
        expect(detectProviderFromUrl('git@github.com:a/b.git')).toBe('github');
        expect(detectProviderFromUrl('https://gitlab.com/a/b.git')).toBe('gitlab');
        expect(detectProviderFromUrl('git@example.com:a/b.git')).toBe('unknown');
    });
});
