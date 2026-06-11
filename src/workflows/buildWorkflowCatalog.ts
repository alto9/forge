import fs from 'fs';
import path from 'path';
import { discoverWorkflowDefinitions } from './discoverWorkflowDefinitions';
import { validateWorkflowDefinitionFile } from './validateWorkflowDefinition';
import type {
    WorkflowCatalogEntry,
    WorkflowCatalogResult,
    WorkflowDiagnostic,
    WorkflowCatalogValidation,
} from './types';

const WORKFLOWS_RELATIVE_DIR = '.ai/workflows';

function countBySeverity(
    diagnostics: WorkflowDiagnostic[],
    severity: WorkflowDiagnostic['severity']
): number {
    return diagnostics.filter((diagnostic) => diagnostic.severity === severity).length;
}

function buildValidationAggregate(diagnostics: WorkflowDiagnostic[]): WorkflowCatalogValidation {
    const errorCount = countBySeverity(diagnostics, 'error');
    const warningCount = countBySeverity(diagnostics, 'warning');

    return {
        valid: errorCount === 0,
        diagnostics,
        errorCount,
        warningCount,
    };
}

function diagnosticsForEntry(
    entryPath: string,
    discoveryDiagnostics: WorkflowDiagnostic[],
    fileDiagnostics: WorkflowDiagnostic[]
): WorkflowDiagnostic[] {
    const merged = [...fileDiagnostics];

    for (const diagnostic of discoveryDiagnostics) {
        if (diagnostic.path === entryPath) {
            merged.push(diagnostic);
        }
    }

    return merged;
}

function compareCatalogEntries(left: WorkflowCatalogEntry, right: WorkflowCatalogEntry): number {
    if (left.validation.valid !== right.validation.valid) {
        return left.validation.valid ? -1 : 1;
    }

    const nameCompare = left.name.localeCompare(right.name, undefined, { sensitivity: 'base' });
    if (nameCompare !== 0) {
        return nameCompare;
    }

    return left.workflow_id.localeCompare(right.workflow_id);
}

export function sortWorkflowCatalogEntries(entries: WorkflowCatalogEntry[]): WorkflowCatalogEntry[] {
    return [...entries].sort(compareCatalogEntries);
}

function detectEmptyState(repositoryRoot: string): WorkflowCatalogResult['emptyState'] | undefined {
    const workflowsDir = path.join(repositoryRoot, WORKFLOWS_RELATIVE_DIR);
    if (!fs.existsSync(workflowsDir) || !fs.statSync(workflowsDir).isDirectory()) {
        return 'no_workflows_dir';
    }

    const hasJson = fs
        .readdirSync(workflowsDir)
        .some((name) => name.endsWith('.json') && fs.statSync(path.join(workflowsDir, name)).isFile());

    if (!hasJson) {
        return 'no_json_files';
    }

    return undefined;
}

export function buildWorkflowCatalog(repositoryRoot: string): WorkflowCatalogResult {
    const absoluteRoot = path.resolve(repositoryRoot);
    const emptyState = detectEmptyState(absoluteRoot);

    if (emptyState) {
        return {
            repositoryRoot: absoluteRoot,
            entries: [],
            emptyState,
        };
    }

    const discovery = discoverWorkflowDefinitions([absoluteRoot], { validateSchema: false });
    const discoveredWorkflowIds = discovery.entries.map((entry) => entry.workflow_id);
    const entries: WorkflowCatalogEntry[] = [];

    for (const indexEntry of discovery.entries) {
        const fileResult = validateWorkflowDefinitionFile(indexEntry.path, {
            workspaceRoot: absoluteRoot,
            discoveredWorkflowIds,
        });
        const entryDiagnostics = diagnosticsForEntry(
            indexEntry.path,
            discovery.diagnostics,
            fileResult.diagnostics
        );

        const displayName = indexEntry.name.trim() || indexEntry.workflow_id;
        const catalogEntry: WorkflowCatalogEntry = {
            workflow_id: indexEntry.workflow_id,
            name: displayName,
            path: indexEntry.path,
            repositoryRoot: absoluteRoot,
            validation: buildValidationAggregate(entryDiagnostics),
        };

        if (indexEntry.version) {
            catalogEntry.version = indexEntry.version;
        }
        if (indexEntry.description) {
            catalogEntry.description = indexEntry.description;
        }
        if (indexEntry.schema_version) {
            catalogEntry.schema_version = indexEntry.schema_version;
        }
        if (indexEntry.run_inputs && indexEntry.run_inputs.length > 0) {
            catalogEntry.run_inputs = indexEntry.run_inputs;
        }

        entries.push(catalogEntry);
    }

    for (const diagnostic of discovery.diagnostics) {
        const alreadyAssigned = entries.some((entry) =>
            entry.validation.diagnostics.some(
                (existing) =>
                    existing.code === diagnostic.code &&
                    existing.path === diagnostic.path &&
                    existing.message === diagnostic.message
            )
        );
        if (alreadyAssigned) {
            continue;
        }

        const matchingEntry = entries.find((entry) => entry.path === diagnostic.path);
        if (matchingEntry) {
            matchingEntry.validation.diagnostics.push(diagnostic);
            matchingEntry.validation = buildValidationAggregate(matchingEntry.validation.diagnostics);
        }
    }

    return {
        repositoryRoot: absoluteRoot,
        entries: sortWorkflowCatalogEntries(entries),
    };
}
