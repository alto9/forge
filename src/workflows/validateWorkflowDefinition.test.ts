import fs from 'fs';
import path from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
    validateWorkflowDefinition,
    validateWorkflowDefinitionFile,
} from './validateWorkflowDefinition';
import {
    WORKFLOW_BINDING_VALIDATOR_ID,
    WORKFLOW_GRAPH_VALIDATOR_ID,
} from './validateWorkflowDomain';
import {
    WORKFLOW_SCHEMA_VALIDATOR_ID,
    resetWorkflowSchemaValidatorCacheForTests,
} from './validateWorkflowSchema';

const fixturesDir = path.join(__dirname, '__fixtures__');

function readFixture(name: string): unknown {
    return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

describe('validateWorkflowDefinition', () => {
    beforeEach(() => {
        resetWorkflowSchemaValidatorCacheForTests();
    });

    it('accepts a valid minimal workflow on the happy path', () => {
        const content = readFixture('valid-minimal.json');
        const result = validateWorkflowDefinition(content, {
            path: '.ai/workflows/test-minimal.json',
        });

        expect(result.valid).toBe(true);
        expect(result.diagnostics).toEqual([]);
        expect(result.workflow_id).toBe('test-minimal');
        expect(result.path).toBe('.ai/workflows/test-minimal.json');
    });

    it('reports schema-only failures before domain diagnostics', () => {
        const content = readFixture('missing-schema-version.json');
        const result = validateWorkflowDefinition(content, {
            path: '.ai/workflows/missing-schema-version.json',
        });

        expect(result.valid).toBe(false);
        expect(result.diagnostics[0]).toEqual(
            expect.objectContaining({
                code: 'schema.required',
                severity: 'error',
                validator_id: WORKFLOW_SCHEMA_VALIDATOR_ID,
            })
        );
        expect(result.diagnostics.every((diagnostic) => diagnostic.validator_id !== WORKFLOW_GRAPH_VALIDATOR_ID)).toBe(
            true
        );
    });

    it('reports domain-only failures when schema passes', () => {
        const content = readFixture('broken-transition.json');
        const result = validateWorkflowDefinition(content, {
            path: '.ai/workflows/broken-transition.json',
            workspaceRoot: process.cwd(),
        });

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'graph.missing_transition_target',
                    severity: 'error',
                    validator_id: WORKFLOW_GRAPH_VALIDATOR_ID,
                }),
            ])
        );
        expect(result.diagnostics.some((diagnostic) => diagnostic.validator_id === WORKFLOW_SCHEMA_VALIDATOR_ID)).toBe(
            false
        );
    });

    it('merges schema and domain failures with schema diagnostics first', () => {
        const content = {
            workflow_id: 'combined-fail',
            name: 'Combined Fail',
            version: '1.0.0',
            entry_node_id: 'start',
            nodes: [
                {
                    node_id: 'start',
                    type: 'activity',
                    name: 'Start',
                    activity_id: 'forge.test.start',
                    transitions: [{ to_node_id: 'done' }],
                },
                {
                    node_id: 'done',
                    type: 'terminal',
                    name: 'Done',
                },
            ],
        };

        const result = validateWorkflowDefinition(content, {
            path: '.ai/workflows/combined-fail.json',
            workspaceRoot: process.cwd(),
        });

        expect(result.valid).toBe(false);
        expect(result.diagnostics[0]).toEqual(
            expect.objectContaining({
                code: 'schema.required',
                severity: 'error',
                validator_id: WORKFLOW_SCHEMA_VALIDATOR_ID,
            })
        );
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'binding.missing_agent_or_skill_path',
                    severity: 'error',
                    validator_id: WORKFLOW_BINDING_VALIDATOR_ID,
                }),
            ])
        );
    });

    it('keeps valid true when only warnings are present', () => {
        const content = readFixture('orphan-node.json');
        const result = validateWorkflowDefinition(content, {
            path: '.ai/workflows/orphan-node.json',
        });

        expect(result.valid).toBe(true);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'graph.orphan_node',
                    severity: 'warning',
                }),
            ])
        );
    });

    it('loads and validates a definition file from disk', () => {
        const definitionPath = path.join(process.cwd(), '.ai/workflows/refine-issue.json');
        const result = validateWorkflowDefinitionFile(definitionPath, {
            workspaceRoot: process.cwd(),
        });

        expect(result.valid).toBe(true);
        expect(result.workflow_id).toBe('refine-issue');
        expect(result.path).toBe('.ai/workflows/refine-issue.json');
    });
});
