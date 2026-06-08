import fs from 'fs';
import path from 'path';
import { discoverWorkflowDefinitions } from './discoverWorkflowDefinitions';
import {
    validateWorkflowDefinition,
    validateWorkflowDefinitionFile,
} from './validateWorkflowDefinition';
import type { Diagnostic, ValidationResult } from './types';

export interface ValidateWorkflowForRunOptions {
    workspaceRoots: string[];
    workflowId?: string;
    definitionPath?: string;
}

export class WorkflowRunStartBlockedError extends Error {
    readonly result: ValidationResult;

    constructor(result: ValidationResult) {
        const target = result.workflow_id ?? result.path ?? 'workflow definition';
        super(`workflow run start blocked: pre-run validation failed for ${target}`);
        this.name = 'WorkflowRunStartBlockedError';
        this.result = result;
    }
}

function toPosixPath(repoRelativePath: string): string {
    return repoRelativePath.split(path.sep).join('/');
}

function resolveWorkspaceRootForRelativePath(
    workspaceRoots: string[],
    relativePath: string
): string | undefined {
    const posixPath = toPosixPath(relativePath);

    for (const workspaceRoot of workspaceRoots) {
        const absoluteRoot = path.resolve(workspaceRoot);
        const candidate = path.join(absoluteRoot, posixPath);
        if (fs.existsSync(candidate)) {
            return absoluteRoot;
        }
    }

    return undefined;
}

function notFoundResult(workflowId: string, discoveryDiagnostics: Diagnostic[]): ValidationResult {
    return {
        valid: false,
        diagnostics: [
            ...discoveryDiagnostics,
            {
                code: 'forge.workflow.not_found',
                severity: 'error',
                path: '.ai/workflows',
                message: `workflow_id "${workflowId}" was not found in workspace workflow definitions`,
                validator_id: 'forge.workflow.binding',
            },
        ],
    };
}

export function validateWorkflowForRun(options: ValidateWorkflowForRunOptions): ValidationResult {
    const workspaceRoots = options.workspaceRoots.map((root) => path.resolve(root));

    if (options.definitionPath) {
        const relativePath = toPosixPath(options.definitionPath);
        const workspaceRoot =
            resolveWorkspaceRootForRelativePath(workspaceRoots, relativePath) ?? workspaceRoots[0];
        const discovery = discoverWorkflowDefinitions(workspaceRoots, { validateSchema: false });
        const discoveredWorkflowIds = discovery.entries.map((entry) => entry.workflow_id);

        const result = validateWorkflowDefinitionFile(relativePath, {
            workspaceRoot,
            discoveredWorkflowIds,
        });

        return {
            ...result,
            diagnostics: [...discovery.diagnostics, ...result.diagnostics],
            valid:
                result.valid &&
                !discovery.diagnostics.some((diagnostic) => diagnostic.severity === 'error'),
        };
    }

    const workflowId = options.workflowId;
    if (!workflowId) {
        return {
            valid: false,
            diagnostics: [
                {
                    code: 'forge.workflow.missing_target',
                    severity: 'error',
                    path: '.ai/workflows',
                    message: 'validateWorkflowForRun requires workflowId or definitionPath',
                    validator_id: 'forge.workflow.binding',
                },
            ],
        };
    }

    const discovery = discoverWorkflowDefinitions(workspaceRoots, { validateSchema: false });
    const entry = discovery.entries.find((candidate) => candidate.workflow_id === workflowId);
    if (!entry) {
        return notFoundResult(workflowId, discovery.diagnostics);
    }

    const workspaceRoot = resolveWorkspaceRootForRelativePath(workspaceRoots, entry.path);
    if (!workspaceRoot) {
        return {
            valid: false,
            diagnostics: [
                ...discovery.diagnostics,
                {
                    code: 'forge.workflow.unresolved_path',
                    severity: 'error',
                    path: entry.path,
                    message: `workflow definition path "${entry.path}" does not resolve in workspace roots`,
                    validator_id: 'forge.workflow.binding',
                },
            ],
            workflow_id: workflowId,
            path: entry.path,
        };
    }

    const absolutePath = path.join(workspaceRoot, entry.path);
    let content: unknown;
    try {
        content = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'invalid JSON';
        return {
            valid: false,
            diagnostics: [
                ...discovery.diagnostics,
                {
                    code: 'forge.workflow.parse_error',
                    severity: 'error',
                    path: entry.path,
                    message: `failed to parse workflow definition: ${message}`,
                    validator_id: 'forge.workflow.schema',
                },
            ],
            workflow_id: workflowId,
            path: entry.path,
        };
    }

    const discoveredWorkflowIds = discovery.entries.map((candidate) => candidate.workflow_id);
    const result = validateWorkflowDefinition(content, {
        path: entry.path,
        workspaceRoot,
        discoveredWorkflowIds,
    });

    return {
        ...result,
        diagnostics: [...discovery.diagnostics, ...result.diagnostics],
        valid:
            result.valid &&
            !discovery.diagnostics.some((diagnostic) => diagnostic.severity === 'error'),
    };
}

/**
 * Pre-run gate invoked before Temporal run creation. Throws when validation fails.
 */
export function gateWorkflowRunStart(options: ValidateWorkflowForRunOptions): ValidationResult {
    const result = validateWorkflowForRun(options);
    if (!result.valid) {
        throw new WorkflowRunStartBlockedError(result);
    }
    return result;
}
