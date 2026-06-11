import { describe, expect, it } from 'vitest';
import {
    normalizeSubmittedRunInputs,
    validateSubmittedRunInputs,
    WORKFLOW_RUN_INPUT_VALIDATOR_ID,
} from './validateSubmittedRunInputs';
import type { WorkflowRunInputDefinition } from './types';

const declarations: WorkflowRunInputDefinition[] = [
    {
        input_id: 'issue_ref',
        type: 'string',
        label: 'GitHub issue',
        required: true,
    },
    {
        input_id: 'note',
        type: 'string',
        label: 'Note',
    },
];

describe('validateSubmittedRunInputs', () => {
    it('accepts required and optional string inputs', () => {
        const result = validateSubmittedRunInputs({
            declarations,
            submitted: {
                issue_ref: 'https://github.com/alto9/forge/issues/75',
                note: 'optional',
            },
            workflow_id: 'refine-issue',
        });

        expect(result.valid).toBe(true);
        expect(result.diagnostics).toEqual([]);
    });

    it('reports missing required inputs', () => {
        const result = validateSubmittedRunInputs({
            declarations,
            submitted: {},
        });

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'run_input.required_missing',
                    path: '/run_inputs/issue_ref',
                    validator_id: WORKFLOW_RUN_INPUT_VALIDATOR_ID,
                }),
            ])
        );
    });

    it('reports empty required inputs after trimming', () => {
        const result = validateSubmittedRunInputs({
            declarations,
            submitted: { issue_ref: '   ' },
        });

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'run_input.required_empty',
                    path: '/run_inputs/issue_ref',
                }),
            ])
        );
    });

    it('reports undeclared submitted keys', () => {
        const result = validateSubmittedRunInputs({
            declarations,
            submitted: {
                issue_ref: '75',
                secret_token: 'abc',
            },
        });

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'run_input.undeclared_key',
                    path: '/run_inputs/secret_token',
                }),
            ])
        );
    });

    it('reports non-string submitted values', () => {
        const result = validateSubmittedRunInputs({
            declarations,
            submitted: {
                issue_ref: 75,
            },
        });

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'run_input.invalid_type',
                    path: '/run_inputs/issue_ref',
                }),
            ])
        );
    });
});

describe('normalizeSubmittedRunInputs', () => {
    it('omits optional empty strings and keeps required values', () => {
        expect(
            normalizeSubmittedRunInputs(declarations, {
                issue_ref: 'https://github.com/alto9/forge/issues/75',
                note: '',
            })
        ).toEqual({
            issue_ref: 'https://github.com/alto9/forge/issues/75',
        });
    });
});
