import { describe, expect, it } from 'vitest';
import {
    CATALOG_RUN_TOOLTIP,
    catalogEntryRequiresRunInputCollection,
    clearSucceededStatusFromOtherRows,
    getCatalogBadgeLabel,
    getCatalogRowSummary,
} from './catalogPresentation';
import type { WorkflowCatalogEntry } from '../../workflows/types';

function entry(overrides: Partial<WorkflowCatalogEntry> = {}): WorkflowCatalogEntry {
    return {
        workflow_id: 'test-flow',
        name: 'Test Flow',
        path: '.ai/workflows/test-flow.json',
        repositoryRoot: '/tmp/repo',
        validation: {
            valid: true,
            diagnostics: [],
            errorCount: 0,
            warningCount: 0,
        },
        ...overrides,
    };
}

describe('catalogPresentation', () => {
    it('uses contract badge labels and summaries', () => {
        expect(getCatalogBadgeLabel(entry())).toBe('Valid');
        expect(getCatalogRowSummary(entry())).toBeUndefined();

        expect(
            getCatalogBadgeLabel(
                entry({
                    validation: {
                        valid: true,
                        diagnostics: [],
                        errorCount: 0,
                        warningCount: 2,
                    },
                })
            )
        ).toBe('Valid with warnings');
        expect(
            getCatalogRowSummary(
                entry({
                    validation: {
                        valid: true,
                        diagnostics: [],
                        errorCount: 0,
                        warningCount: 2,
                    },
                })
            )
        ).toBe('2 warnings — run can start');

        expect(
            getCatalogBadgeLabel(
                entry({
                    validation: {
                        valid: false,
                        diagnostics: [],
                        errorCount: 3,
                        warningCount: 1,
                    },
                })
            )
        ).toBe('Invalid');
        expect(
            getCatalogRowSummary(
                entry({
                    validation: {
                        valid: false,
                        diagnostics: [],
                        errorCount: 3,
                        warningCount: 1,
                    },
                })
            )
        ).toBe('3 errors, 1 warning — fix before run');
    });

    it('detects when a catalog entry requires run input collection', () => {
        expect(catalogEntryRequiresRunInputCollection(entry())).toBe(false);
        expect(
            catalogEntryRequiresRunInputCollection(
                entry({
                    run_inputs: [
                        {
                            input_id: 'issue_ref',
                            type: 'string',
                            label: 'Issue',
                            required: true,
                        },
                    ],
                })
            )
        ).toBe(true);
    });

    it('clears succeeded status from other rows when selection changes', () => {
        const next = clearSucceededStatusFromOtherRows(
            {
                'flow-a': {
                    inFlight: false,
                    statusMessage: CATALOG_RUN_TOOLTIP.succeeded,
                },
                'flow-b': {
                    inFlight: false,
                    statusMessage: 'Could not start workflow run',
                },
            },
            'flow-b'
        );

        expect(next['flow-a']?.statusMessage).toBeUndefined();
        expect(next['flow-b']?.statusMessage).toBe('Could not start workflow run');
    });
});
