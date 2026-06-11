import { describe, expect, it } from 'vitest';
import { buildStartInputSummary } from './buildStartInputSummary';
import type { WorkflowRunInputDefinition } from './types';

const declarations: WorkflowRunInputDefinition[] = [
    {
        input_id: 'issue_ref',
        type: 'string',
        label: 'GitHub issue',
        required: true,
    },
];

describe('buildStartInputSummary', () => {
    it('returns undefined when no inputs were submitted', () => {
        expect(buildStartInputSummary(declarations, {})).toBeUndefined();
    });

    it('builds a display summary from accepted inputs', () => {
        expect(
            buildStartInputSummary(declarations, {
                issue_ref: 'https://github.com/alto9/forge/issues/75',
            })
        ).toBe('issue_ref: https://github.com/alto9/forge/issues/75');
    });

    it('redacts bearer token material from summaries', () => {
        expect(
            buildStartInputSummary(declarations, {
                issue_ref: 'Bearer secret-token-value',
            })
        ).toBe('issue_ref: [redacted]');
    });
});
