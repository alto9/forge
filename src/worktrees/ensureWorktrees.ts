import * as fs from 'fs';
import * as path from 'path';

const IGNORE_LINES = ['.worktrees/', '.cursor/.tmp/'];

/**
 * Ensure the worktrees directory exists and root .gitignore covers worktrees + session tmp.
 */
export function ensureWorktreesConfig(
    repoRoot: string,
    worktreesPath: string
): { worktreesPath: string; gitignoreUpdated: boolean } {
    const absWorktrees = path.isAbsolute(worktreesPath)
        ? worktreesPath
        : path.resolve(repoRoot, worktreesPath);

    fs.mkdirSync(absWorktrees, { recursive: true });

    // Keep a .gitkeep so empty dir is visible if someone force-adds; still gitignored.
    const keep = path.join(absWorktrees, '.gitkeep');
    if (!fs.existsSync(keep)) {
        fs.writeFileSync(keep, '', 'utf8');
    }

    const gitignorePath = path.join(repoRoot, '.gitignore');
    let content = '';
    if (fs.existsSync(gitignorePath)) {
        content = fs.readFileSync(gitignorePath, 'utf8');
    }

    const lines = content.length ? content.split(/\r?\n/) : [];
    const existing = new Set(lines.map((l) => l.trim()));
    let changed = false;
    for (const line of IGNORE_LINES) {
        if (!existing.has(line)) {
            lines.push(line);
            changed = true;
        }
    }
    // Also ignore relative worktrees path if it is not the default name
    const rel = path.relative(repoRoot, absWorktrees).replace(/\\/g, '/');
    if (rel && rel !== '.worktrees' && !rel.startsWith('..')) {
        const ignoreRel = rel.endsWith('/') ? rel : `${rel}/`;
        if (!existing.has(ignoreRel) && !existing.has(rel)) {
            lines.push(ignoreRel);
            changed = true;
        }
    }

    if (changed) {
        const next = `${lines.filter((l, i) => !(l === '' && i === lines.length - 1)).join('\n').replace(/\n*$/, '\n')}`;
        fs.writeFileSync(gitignorePath, next.endsWith('\n') ? next : `${next}\n`, 'utf8');
    }

    return { worktreesPath: absWorktrees, gitignoreUpdated: changed };
}
