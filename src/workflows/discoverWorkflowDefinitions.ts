import fs from 'fs';
import path from 'path';
import { validateWorkflowDefinitionJson } from './validateWorkflowSchema';
import type {
    WorkflowDefinitionIndexEntry,
    WorkflowDiagnostic,
    WorkflowDiscoveryResult,
} from './types';

export const WORKFLOW_DUPLICATE_ID_VALIDATOR_ID = 'forge.workflow.duplicate_id';

const WORKFLOWS_RELATIVE_DIR = '.ai/workflows';

export interface DiscoverWorkflowDefinitionsOptions {
    validateSchema?: boolean;
}

interface ParsedWorkflowFile {
    entry?: WorkflowDefinitionIndexEntry;
    content?: unknown;
    diagnostics: WorkflowDiagnostic[];
    workflow_id?: string;
}

function toPosixRelativePath(workspaceRoot: string, absolutePath: string): string {
    return path.relative(workspaceRoot, absolutePath).split(path.sep).join('/');
}

function listWorkflowJsonFiles(workspaceRoot: string): string[] {
    const workflowsDir = path.join(workspaceRoot, WORKFLOWS_RELATIVE_DIR);
    if (!fs.existsSync(workflowsDir) || !fs.statSync(workflowsDir).isDirectory()) {
        return [];
    }

    return fs
        .readdirSync(workflowsDir)
        .filter((name) => name.endsWith('.json'))
        .map((name) => path.join(workflowsDir, name));
}

function readStringField(record: Record<string, unknown>, key: string): string | undefined {
    const value = record[key];
    return typeof value === 'string' ? value : undefined;
}

function parseWorkflowFile(absolutePath: string, workspaceRoot: string): ParsedWorkflowFile {
    const relativePath = toPosixRelativePath(workspaceRoot, absolutePath);
    const filenameStem = path.basename(absolutePath, '.json');
    const diagnostics: WorkflowDiagnostic[] = [];

    let content: unknown;
    try {
        content = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'invalid JSON';
        diagnostics.push({
            code: 'forge.workflow.parse_error',
            severity: 'error',
            path: relativePath,
            message: `failed to parse workflow definition: ${message}`,
            validator_id: 'forge.workflow.schema',
        });
        return { diagnostics };
    }

    if (!content || typeof content !== 'object' || Array.isArray(content)) {
        diagnostics.push({
            code: 'schema.type',
            severity: 'error',
            path: relativePath,
            message: 'workflow definition must be a JSON object',
            validator_id: 'forge.workflow.schema',
        });
        return { diagnostics };
    }

    const record = content as Record<string, unknown>;
    const workflow_id = readStringField(record, 'workflow_id') ?? filenameStem;
    const entry: WorkflowDefinitionIndexEntry = {
        workflow_id,
        name: readStringField(record, 'name') ?? '',
        version: readStringField(record, 'version') ?? '',
        schema_version: readStringField(record, 'schema_version') ?? '',
        path: relativePath,
    };

    const description = readStringField(record, 'description');
    if (description !== undefined) {
        entry.description = description;
    }

    return {
        entry,
        content,
        diagnostics,
        workflow_id,
    };
}

function addDuplicateIdDiagnostics(
    workflowId: string,
    paths: string[],
    diagnostics: WorkflowDiagnostic[]
): void {
    for (const filePath of paths) {
        diagnostics.push({
            code: 'forge.workflow.duplicate_id',
            severity: 'error',
            path: filePath,
            message: `duplicate workflow_id "${workflowId}" across discovered workflow definition files`,
            validator_id: WORKFLOW_DUPLICATE_ID_VALIDATOR_ID,
        });
    }
}

export function discoverWorkflowDefinitions(
    workspaceRoots: string[],
    options?: DiscoverWorkflowDefinitionsOptions
): WorkflowDiscoveryResult {
    const validateSchema = options?.validateSchema !== false;
    const entries: WorkflowDefinitionIndexEntry[] = [];
    const diagnostics: WorkflowDiagnostic[] = [];
    const workflowIdToPaths = new Map<string, string[]>();

    for (const workspaceRoot of workspaceRoots) {
        const absoluteRoot = path.resolve(workspaceRoot);

        for (const filePath of listWorkflowJsonFiles(absoluteRoot)) {
            const parsed = parseWorkflowFile(filePath, absoluteRoot);
            diagnostics.push(...parsed.diagnostics);

            if (!parsed.entry) {
                continue;
            }

            if (validateSchema && parsed.content !== undefined) {
                const validation = validateWorkflowDefinitionJson(parsed.content, {
                    path: parsed.entry.path,
                });
                parsed.entry.schema_valid = validation.valid;
            }

            entries.push(parsed.entry);

            const workflowId = parsed.workflow_id ?? parsed.entry.workflow_id;
            const existingPaths = workflowIdToPaths.get(workflowId) ?? [];
            existingPaths.push(parsed.entry.path);
            workflowIdToPaths.set(workflowId, existingPaths);
        }
    }

    for (const [workflowId, paths] of workflowIdToPaths) {
        if (paths.length > 1) {
            addDuplicateIdDiagnostics(workflowId, paths, diagnostics);
        }
    }

    entries.sort((left, right) => left.workflow_id.localeCompare(right.workflow_id));

    return { entries, diagnostics };
}
