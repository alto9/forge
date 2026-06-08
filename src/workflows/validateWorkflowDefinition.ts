import fs from 'fs';
import path from 'path';
import { validateWorkflowDomain } from './validateWorkflowDomain';
import { validateWorkflowDefinitionJson } from './validateWorkflowSchema';
import type { ValidationResult, WorkflowDiagnostic } from './types';

export interface ValidateWorkflowDefinitionOptions {
    path: string;
    workspaceRoot?: string;
    discoveredWorkflowIds?: string[];
}

function aggregateValid(diagnostics: WorkflowDiagnostic[]): boolean {
    return !diagnostics.some((diagnostic) => diagnostic.severity === 'error');
}

function mergeValidationResults(
    schemaResult: ValidationResult,
    domainResult: ValidationResult
): ValidationResult {
    const diagnostics = [...schemaResult.diagnostics, ...domainResult.diagnostics];

    return {
        valid: aggregateValid(diagnostics),
        diagnostics,
        workflow_id: schemaResult.workflow_id ?? domainResult.workflow_id,
        path: schemaResult.path ?? domainResult.path,
    };
}

export function validateWorkflowDefinition(
    content: unknown,
    options: ValidateWorkflowDefinitionOptions
): ValidationResult {
    const schemaResult = validateWorkflowDefinitionJson(content, { path: options.path });
    const domainResult = validateWorkflowDomain(content, {
        path: options.path,
        workspaceRoot: options.workspaceRoot,
        discoveredWorkflowIds: options.discoveredWorkflowIds,
    });

    return mergeValidationResults(schemaResult, domainResult);
}

function toPosixPath(repoRelativePath: string): string {
    return repoRelativePath.split(path.sep).join('/');
}

export function validateWorkflowDefinitionFile(
    definitionPath: string,
    options?: Omit<ValidateWorkflowDefinitionOptions, 'path'>
): ValidationResult {
    const workspaceRoot = options?.workspaceRoot ? path.resolve(options.workspaceRoot) : undefined;
    const absolutePath = path.isAbsolute(definitionPath)
        ? path.resolve(definitionPath)
        : workspaceRoot
          ? path.join(workspaceRoot, definitionPath)
          : path.resolve(definitionPath);
    const relativePath = workspaceRoot
        ? toPosixPath(path.relative(workspaceRoot, absolutePath))
        : toPosixPath(definitionPath);

    let content: unknown;
    try {
        content = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'invalid JSON';
        const diagnostic: WorkflowDiagnostic = {
            code: 'forge.workflow.parse_error',
            severity: 'error',
            path: relativePath,
            message: `failed to parse workflow definition: ${message}`,
            validator_id: 'forge.workflow.schema',
        };

        return {
            valid: false,
            diagnostics: [diagnostic],
            path: relativePath,
        };
    }

    return validateWorkflowDefinition(content, {
        path: relativePath,
        workspaceRoot: options?.workspaceRoot,
        discoveredWorkflowIds: options?.discoveredWorkflowIds,
    });
}
