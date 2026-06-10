import fs from 'fs';
import path from 'path';

function escapeRegexSegment(segment: string): string {
    return segment.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
}

export function globPatternToRegExp(globPattern: string): RegExp {
    const normalized = globPattern.split(path.sep).join('/');
    const regexSource = normalized
        .split('*')
        .map((segment) => escapeRegexSegment(segment))
        .join('[^/]*');
    return new RegExp(`^${regexSource}$`);
}

function listRelativeFilesRecursive(absoluteDir: string, relativePrefix: string): string[] {
    if (!fs.existsSync(absoluteDir)) {
        return [];
    }

    const results: string[] = [];

    for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
        const relativePath = relativePrefix.length > 0 ? `${relativePrefix}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
            results.push(...listRelativeFilesRecursive(path.join(absoluteDir, entry.name), relativePath));
            continue;
        }

        if (entry.isFile()) {
            results.push(relativePath.split(path.sep).join('/'));
        }
    }

    return results;
}

export function resolveArtifactGlobPaths(workspaceRoot: string, pattern: string): string[] {
    const normalizedPattern = pattern.split(path.sep).join('/');

    if (!normalizedPattern.includes('*')) {
        const absolutePath = path.join(workspaceRoot, normalizedPattern);
        return fs.existsSync(absolutePath) ? [normalizedPattern] : [];
    }

    const matcher = globPatternToRegExp(normalizedPattern);
    const allRelativeFiles = listRelativeFilesRecursive(workspaceRoot, '');

    return allRelativeFiles.filter((relativePath) => matcher.test(relativePath)).sort();
}

export function findWorkflowArtifactPath(
    workflowArtifacts: Array<{ artifact_id: string; path: string }> | undefined,
    artifactId: string
): string | undefined {
    return workflowArtifacts?.find((artifact) => artifact.artifact_id === artifactId)?.path;
}
