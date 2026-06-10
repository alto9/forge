import fs from 'fs';
import path from 'path';
import { buildWorkflowCatalog } from './buildWorkflowCatalog';
import type { WorkflowDefinition } from './types';

export function loadWorkflowDefinition(
    repositoryRoot: string,
    workflowId: string
): WorkflowDefinition | undefined {
    const catalog = buildWorkflowCatalog(repositoryRoot);
    const entry = catalog.entries.find((candidate) => candidate.workflow_id === workflowId);
    if (!entry) {
        return undefined;
    }

    const absolutePath = path.join(repositoryRoot, entry.path);
    try {
        return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as WorkflowDefinition;
    } catch {
        return undefined;
    }
}
