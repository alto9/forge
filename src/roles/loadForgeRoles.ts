import * as fs from 'fs';
import * as path from 'path';
import { localPluginPath } from '../plugin/ensureLocalPlugin';

export interface ForgeRole {
    id: string;
    label: string;
}

const FALLBACK_ROLES: ForgeRole[] = [
    { id: 'product-owner', label: 'Product Owner' },
    { id: 'project-manager', label: 'Project Manager' },
    { id: 'architect', label: 'Architect' },
    { id: 'engineer', label: 'Engineer' },
    { id: 'quality-assurance', label: 'Quality Assurance' },
    { id: 'security', label: 'Security' },
    { id: 'release-manager', label: 'Release Manager' },
    { id: 'marketing-manager', label: 'Marketing Manager' },
];

function titleCaseFromId(id: string): string {
    return id
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function parseAgentName(content: string, fallbackId: string): string {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) {
        return titleCaseFromId(fallbackId);
    }
    const nameLine = match[1].match(/^name:\s*(.+)$/m);
    if (!nameLine) {
        return titleCaseFromId(fallbackId);
    }
    return titleCaseFromId(nameLine[1].trim());
}

/**
 * Load roles from the installed Cursor plugin agents/ directory.
 * Falls back to a static list when the plugin is not yet synced.
 */
export function loadForgeRoles(homeDir?: string): ForgeRole[] {
    const agentsDir = path.join(localPluginPath(homeDir), 'agents');
    if (!fs.existsSync(agentsDir)) {
        return FALLBACK_ROLES;
    }
    const files = fs
        .readdirSync(agentsDir)
        .filter((f) => f.endsWith('.md') && !f.startsWith('.'));
    if (files.length === 0) {
        return FALLBACK_ROLES;
    }
    return files
        .map((f) => {
            const id = f.replace(/\.md$/, '');
            const content = fs.readFileSync(path.join(agentsDir, f), 'utf8');
            return { id, label: parseAgentName(content, id) };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
}

export { FALLBACK_ROLES };
