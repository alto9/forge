import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseSubmodulePaths, resolveForgeSyncRoots } from '../git/gitmodules';

function makeTempDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'forge-gitmodules-test-'));
}

describe('parseSubmodulePaths', () => {
    it('collects path entries only inside submodule sections', () => {
        const ini = `
[core]
  path = ignored

[submodule "a"]
  path = vendor/lib

[submodule "b"]
path=sub/two

[other "x"]
path = also-ignored
`;
        expect(parseSubmodulePaths(ini)).toEqual(['vendor/lib', 'sub/two']);
    });

    it('strips quotes and ignores duplicates and comments', () => {
        const ini = `
# leading comment
[submodule "dup"]
  path = "first/path"

[submodule "dup2"]
path='first/path'

[submodule "c"]
path = third
`;
        expect(parseSubmodulePaths(ini)).toEqual(['first/path', 'third']);
    });

    it('handles submodule section names with spaces', () => {
        const ini = `[submodule "my lib"]
\tpath = libs/mylib
`;
        expect(parseSubmodulePaths(ini)).toEqual(['libs/mylib']);
    });
});

describe('resolveForgeSyncRoots', () => {
    const tempDirs: string[] = [];

    afterEach(() => {
        for (const dir of tempDirs.splice(0)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    function writeFileSyncEnsured(filePath: string, content: string): void {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content, 'utf8');
    }

    it('returns only repo root when .gitmodules is missing', () => {
        const root = makeTempDir();
        tempDirs.push(root);
        expect(resolveForgeSyncRoots(root)).toEqual([path.resolve(root)]);
    });

    it('adds existing submodule directories under root', () => {
        const root = makeTempDir();
        tempDirs.push(root);
        const subA = path.join(root, 'mods', 'a');
        const subB = path.join(root, 'mods', 'b');
        fs.mkdirSync(subA, { recursive: true });
        fs.mkdirSync(subB, { recursive: true });
        writeFileSyncEnsured(
            path.join(root, '.gitmodules'),
            `[submodule "a"]
\tpath = mods/a
[submodule "b"]
\tpath = mods/b
`
        );
        const resolved = path.resolve(root);
        expect(resolveForgeSyncRoots(root)).toEqual([resolved, path.join(resolved, 'mods', 'a'), path.join(resolved, 'mods', 'b')]);
    });

    it('skips paths outside repo and missing directories', () => {
        const root = makeTempDir();
        tempDirs.push(root);
        const ok = path.join(root, 'good');
        fs.mkdirSync(ok, { recursive: true });
        writeFileSyncEnsured(
            path.join(root, '.gitmodules'),
            `[submodule "escape"]
\tpath = ../../../outside
[submodule "good"]
\tpath = good
[submodule "missing"]
\tpath = not-checked-out
`
        );
        const resolved = path.resolve(root);
        expect(resolveForgeSyncRoots(root)).toEqual([resolved, path.join(resolved, 'good')]);
    });
});
