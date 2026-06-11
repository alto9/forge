import { workflowRequiresRunInputCollection } from '../../workflows/parseRunInputs';
import type {
    WorkflowCatalogEmptyState,
    WorkflowCatalogEntry,
} from '../../workflows/types';

export type WorkflowCatalogWebviewModel = {
    repositoryRoot: string;
    repositoryName: string;
    entries: WorkflowCatalogEntry[];
    emptyState?: WorkflowCatalogEmptyState | 'no_workspace';
    selectedWorkflowId?: string;
};

export type WorkflowCatalogBadgeState = 'valid' | 'valid_with_warnings' | 'invalid';

export function getCatalogBadgeState(entry: WorkflowCatalogEntry): WorkflowCatalogBadgeState {
    if (!entry.validation.valid) {
        return 'invalid';
    }
    if (entry.validation.warningCount > 0) {
        return 'valid_with_warnings';
    }
    return 'valid';
}

export function getCatalogBadgeLabel(entry: WorkflowCatalogEntry): string {
    const state = getCatalogBadgeState(entry);
    switch (state) {
        case 'valid':
            return 'Valid';
        case 'valid_with_warnings':
            return 'Valid with warnings';
        case 'invalid':
            return 'Invalid';
    }
}

export function getCatalogRowSummary(entry: WorkflowCatalogEntry): string | undefined {
    const { errorCount, warningCount, valid } = entry.validation;

    if (valid && warningCount === 0) {
        return undefined;
    }

    if (valid && warningCount > 0) {
        const warningLabel = warningCount === 1 ? 'warning' : 'warnings';
        return `${warningCount} ${warningLabel} — run can start`;
    }

    const errorLabel = errorCount === 1 ? 'error' : 'errors';
    const warningSuffix =
        warningCount > 0
            ? `, ${warningCount} ${warningCount === 1 ? 'warning' : 'warnings'}`
            : '';

    return `${errorCount} ${errorLabel}${warningSuffix} — fix before run`;
}

export const CATALOG_EMPTY_STATE_COPY = {
    no_workspace: 'Open a workspace folder to discover workflow definitions.',
    no_workflows_dir:
        'No workflow definitions found. Add JSON files under `.ai/workflows/` in this repository.',
    no_json_files: 'No workflow definitions found in `.ai/workflows/`.',
} as const;

export const CATALOG_RUN_TOOLTIP = {
    invalid: 'Fix validation errors before starting a run.',
    valid: 'Start a workflow run.',
    requiresInputs: 'Complete required inputs before starting this workflow.',
    inFlight: 'Starting workflow run…',
    succeeded: 'Workflow run started.',
    failed: 'Could not start workflow run',
} as const;

export function catalogEntryRequiresRunInputCollection(entry: WorkflowCatalogEntry): boolean {
    return workflowRequiresRunInputCollection(entry.run_inputs);
}

export function clearSucceededStatusFromOtherRows<T extends { statusMessage?: string }>(
    rowRunState: Record<string, T>,
    selectedWorkflowId: string
): Record<string, T> {
    const next: Record<string, T> = {};

    for (const [workflowId, state] of Object.entries(rowRunState)) {
        if (
            workflowId !== selectedWorkflowId &&
            state.statusMessage === CATALOG_RUN_TOOLTIP.succeeded
        ) {
            next[workflowId] = { ...state, statusMessage: undefined };
        } else {
            next[workflowId] = state;
        }
    }

    return next;
}
