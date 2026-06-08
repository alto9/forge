import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeEach } from 'vitest';
import {
    validateWorkflowDefinitionJson,
    WORKFLOW_SCHEMA_VALIDATOR_ID,
    resetWorkflowSchemaValidatorCacheForTests,
} from './validateWorkflowSchema';

const fixturesDir = path.join(__dirname, '__fixtures__');

function readFixture(name: string): unknown {
    return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

describe('validateWorkflowDefinitionJson', () => {
    beforeEach(() => {
        resetWorkflowSchemaValidatorCacheForTests();
    });

    it('accepts a valid minimal workflow fixture', () => {
        const content = readFixture('valid-minimal.json');
        const result = validateWorkflowDefinitionJson(content, {
            path: '.ai/workflows/test-minimal.json',
        });

        expect(result.valid).toBe(true);
        expect(result.diagnostics).toEqual([]);
        expect(result.workflow_id).toBe('test-minimal');
        expect(result.path).toBe('.ai/workflows/test-minimal.json');
    });

    it('validates the repo refine-issue workflow definition', () => {
        const refineIssuePath = path.join(process.cwd(), '.ai/workflows/refine-issue.json');
        const content = JSON.parse(fs.readFileSync(refineIssuePath, 'utf8'));
        const result = validateWorkflowDefinitionJson(content, {
            path: '.ai/workflows/refine-issue.json',
        });

        expect(result.valid).toBe(true);
        expect(result.diagnostics).toEqual([]);
        expect(result.workflow_id).toBe('refine-issue');
    });

    it('reports missing schema_version with forge.workflow.schema diagnostics', () => {
        const content = readFixture('missing-schema-version.json');
        const result = validateWorkflowDefinitionJson(content);

        expect(result.valid).toBe(false);
        expect(result.diagnostics.length).toBeGreaterThan(0);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'schema.required',
                    severity: 'error',
                    path: '/schema_version',
                    validator_id: WORKFLOW_SCHEMA_VALIDATOR_ID,
                }),
            ])
        );
    });

    it('reports invalid entry_node_id constraint failures', () => {
        const content = readFixture('bad-entry-node-id.json');
        const result = validateWorkflowDefinitionJson(content);

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'schema.constraint',
                    severity: 'error',
                    path: '/entry_node_id',
                    validator_id: WORKFLOW_SCHEMA_VALIDATOR_ID,
                }),
            ])
        );
    });

    it('reports invalid node type enum failures', () => {
        const content = readFixture('invalid-node-type.json');
        const result = validateWorkflowDefinitionJson(content);

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'schema.enum',
                    severity: 'error',
                    path: '/nodes/0/type',
                    validator_id: WORKFLOW_SCHEMA_VALIDATOR_ID,
                }),
            ])
        );
    });

    it('rejects non-object workflow content', () => {
        const result = validateWorkflowDefinitionJson('not-an-object');

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual([
            {
                code: 'schema.type',
                severity: 'error',
                path: '/',
                message: 'workflow definition must be a JSON object',
                validator_id: WORKFLOW_SCHEMA_VALIDATOR_ID,
            },
        ]);
    });
});
