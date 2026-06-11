import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
    validateWorkflowDomain,
    WORKFLOW_BINDING_VALIDATOR_ID,
    WORKFLOW_DUPLICATE_ID_VALIDATOR_ID,
    WORKFLOW_GRAPH_VALIDATOR_ID,
    WORKFLOW_ORPHAN_NODE_CODE,
    WORKFLOW_UNSUPPORTED_VERSION_VALIDATOR_ID,
} from './validateWorkflowDomain';

const fixturesDir = path.join(__dirname, '__fixtures__');

function readFixture(name: string): unknown {
    return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

describe('validateWorkflowDomain', () => {
    it('accepts a valid minimal workflow fixture', () => {
        const content = readFixture('valid-minimal.json');
        const result = validateWorkflowDomain(content, {
            path: '.ai/workflows/test-minimal.json',
        });

        expect(result.valid).toBe(true);
        expect(result.diagnostics).toEqual([]);
        expect(result.workflow_id).toBe('test-minimal');
    });

    it('validates the repo refine-issue workflow definition with binding paths', () => {
        const refineIssuePath = path.join(process.cwd(), '.ai/workflows/refine-issue.json');
        const content = JSON.parse(fs.readFileSync(refineIssuePath, 'utf8'));
        const result = validateWorkflowDomain(content, {
            path: '.ai/workflows/refine-issue.json',
            workspaceRoot: process.cwd(),
        });

        expect(result.valid).toBe(true);
        expect(result.diagnostics).toEqual([]);
        expect(result.workflow_id).toBe('refine-issue');
    });

    it('reports duplicate run input input_id values', () => {
        const content = {
            schema_version: '1.0.0',
            workflow_id: 'duplicate-inputs',
            name: 'Duplicate Inputs',
            version: '1.0.0',
            entry_node_id: 'start',
            run_inputs: [
                {
                    input_id: 'shared',
                    type: 'string',
                    label: 'Shared',
                },
                {
                    input_id: 'shared',
                    type: 'string',
                    label: 'Shared again',
                },
            ],
            nodes: [{ node_id: 'start', type: 'terminal', name: 'Done' }],
        };

        const result = validateWorkflowDomain(content, {
            path: '.ai/workflows/duplicate-inputs.json',
        });

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'run_input.duplicate_id',
                    path: '/run_inputs/1/input_id',
                    validator_id: WORKFLOW_BINDING_VALIDATOR_ID,
                }),
            ])
        );
    });

    it('reports broken transition targets as graph errors', () => {
        const content = readFixture('broken-transition.json');
        const result = validateWorkflowDomain(content, {
            path: '.ai/workflows/broken-transition.json',
            workspaceRoot: process.cwd(),
        });

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'graph.missing_transition_target',
                    severity: 'error',
                    path: '/nodes/0/transitions/0/to_node_id',
                    validator_id: WORKFLOW_GRAPH_VALIDATOR_ID,
                }),
                expect.objectContaining({
                    code: 'graph.unreachable_terminal',
                    severity: 'error',
                    validator_id: WORKFLOW_GRAPH_VALIDATOR_ID,
                }),
            ])
        );
    });

    it('reports missing activity bindings as errors', () => {
        const content = readFixture('missing-binding.json');
        const result = validateWorkflowDomain(content, {
            path: '.ai/workflows/missing-binding.json',
        });

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'binding.missing_agent_or_skill_path',
                    severity: 'error',
                    path: '/nodes/0',
                    validator_id: WORKFLOW_BINDING_VALIDATOR_ID,
                }),
            ])
        );
    });

    it('reports orphan nodes as warnings without failing validation', () => {
        const content = readFixture('orphan-node.json');
        const result = validateWorkflowDomain(content, {
            path: '.ai/workflows/orphan-node.json',
        });

        expect(result.valid).toBe(true);
        expect(result.diagnostics).toEqual([
            expect.objectContaining({
                code: WORKFLOW_ORPHAN_NODE_CODE,
                severity: 'warning',
                path: '/nodes/1',
                validator_id: WORKFLOW_GRAPH_VALIDATOR_ID,
            }),
        ]);
    });

    it('reports duplicate workflow_id values from discovery context', () => {
        const content = readFixture('valid-minimal.json');
        const result = validateWorkflowDomain(content, {
            path: '.ai/workflows/test-minimal.json',
            discoveredWorkflowIds: ['test-minimal', 'test-minimal', 'other-flow'],
        });

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual([
            expect.objectContaining({
                code: 'forge.workflow.duplicate_id',
                severity: 'error',
                path: '.ai/workflows/test-minimal.json',
                validator_id: WORKFLOW_DUPLICATE_ID_VALIDATOR_ID,
            }),
        ]);
    });

    it('reports unsupported schema_version majors', () => {
        const content = readFixture('unsupported-version.json');
        const result = validateWorkflowDomain(content, {
            path: '.ai/workflows/unsupported-version.json',
        });

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual([
            expect.objectContaining({
                code: 'forge.workflow.unsupported_version',
                severity: 'error',
                path: '/schema_version',
                validator_id: WORKFLOW_UNSUPPORTED_VERSION_VALIDATOR_ID,
            }),
        ]);
    });

    it('reports when no terminal node is reachable from entry', () => {
        const content = readFixture('no-terminal-reachable.json');
        const result = validateWorkflowDomain(content, {
            path: '.ai/workflows/no-terminal-reachable.json',
            workspaceRoot: process.cwd(),
        });

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'graph.unreachable_terminal',
                    severity: 'error',
                    validator_id: WORKFLOW_GRAPH_VALIDATOR_ID,
                }),
            ])
        );
    });

    it('reports filename stem mismatch under binding rules', () => {
        const content = readFixture('valid-minimal.json');
        const result = validateWorkflowDomain(content, {
            path: '.ai/workflows/wrong-stem.json',
        });

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'binding.filename_stem_mismatch',
                    severity: 'error',
                    path: '.ai/workflows/wrong-stem.json',
                    validator_id: WORKFLOW_BINDING_VALIDATOR_ID,
                }),
            ])
        );
    });

    it('reports unresolved binding paths when workspaceRoot is provided', () => {
        const content = {
            schema_version: '1.0.0',
            workflow_id: 'bad-path',
            name: 'Bad Path',
            version: '1.0.0',
            entry_node_id: 'start',
            nodes: [
                {
                    node_id: 'start',
                    type: 'activity',
                    name: 'Start',
                    activity_id: 'forge.test.start',
                    agent_path: 'does/not/exist.md',
                    transitions: [{ to_node_id: 'done' }],
                },
                {
                    node_id: 'done',
                    type: 'terminal',
                    name: 'Done',
                },
            ],
        };

        const result = validateWorkflowDomain(content, {
            path: '.ai/workflows/bad-path.json',
            workspaceRoot: process.cwd(),
        });

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'binding.unresolved_path',
                    severity: 'error',
                    path: '/nodes/0/agent_path',
                    validator_id: WORKFLOW_BINDING_VALIDATOR_ID,
                }),
            ])
        );
    });

    it('returns no diagnostics for non-object content', () => {
        const result = validateWorkflowDomain('not-an-object', {
            path: '.ai/workflows/invalid.json',
        });

        expect(result.valid).toBe(true);
        expect(result.diagnostics).toEqual([]);
    });

    it('reports unknown retry and timeout policy references', () => {
        const content = {
            schema_version: '1.0.0',
            workflow_id: 'policy-test',
            name: 'Policy Test',
            version: '1.0.0',
            entry_node_id: 'start',
            retry_policies: [{ policy_id: 'not-a-policy' }],
            timeout_policies: [{ policy_id: 'also-unknown' }],
            nodes: [
                {
                    node_id: 'start',
                    type: 'activity',
                    name: 'Start',
                    activity_id: 'forge.test.start',
                    agent_path: 'resources/workflow/agents/technical-writer.md',
                    retry_policy: 'missing-retry',
                    timeout_policy: 'missing-timeout',
                    transitions: [{ to_node_id: 'done' }],
                },
                {
                    node_id: 'done',
                    type: 'terminal',
                    name: 'Done',
                },
            ],
        };

        const result = validateWorkflowDomain(content, {
            path: '.ai/workflows/policy-test.json',
            workspaceRoot: process.cwd(),
        });

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'binding.unknown_retry_policy_id',
                    path: '/retry_policies/0/policy_id',
                    validator_id: WORKFLOW_BINDING_VALIDATOR_ID,
                }),
                expect.objectContaining({
                    code: 'binding.unknown_timeout_policy_id',
                    path: '/timeout_policies/0/policy_id',
                    validator_id: WORKFLOW_BINDING_VALIDATOR_ID,
                }),
                expect.objectContaining({
                    code: 'binding.unresolved_retry_policy',
                    path: '/nodes/0/retry_policy',
                    validator_id: WORKFLOW_BINDING_VALIDATOR_ID,
                }),
                expect.objectContaining({
                    code: 'binding.unresolved_timeout_policy',
                    path: '/nodes/0/timeout_policy',
                    validator_id: WORKFLOW_BINDING_VALIDATOR_ID,
                }),
            ])
        );
    });
});
