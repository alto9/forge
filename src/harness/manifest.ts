import * as fs from 'fs';
import * as path from 'path';

export interface ForgeManifest {
    manifestVersion: 1;
    forgeVersion: string;
    worktreesPath: string;
    initializedAt: string;
    updatedAt: string;
    /** Paths relative to superrepo root that Forge manages (may overwrite on update). */
    managedPaths: string[];
}

export const MANIFEST_RELATIVE_PATH = path.join('.cursor', 'forge', 'manifest.json');

export const DEFAULT_MANAGED_PATHS = [
    '.cursor/agents',
    '.cursor/skills',
    '.cursor/rules',
    '.cursor/forge/manifest.json'
];

export function manifestPath(repoRoot: string): string {
    return path.join(repoRoot, MANIFEST_RELATIVE_PATH);
}

export function readManifest(repoRoot: string): ForgeManifest | null {
    const p = manifestPath(repoRoot);
    if (!fs.existsSync(p)) {
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8')) as ForgeManifest;
    } catch {
        return null;
    }
}

export function writeManifest(repoRoot: string, manifest: ForgeManifest): void {
    const p = manifestPath(repoRoot);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}
