import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
    discoverWorkflowDefinitions,
    WORKFLOW_DUPLICATE_ID_VALIDATOR_ID,
} from './discoverWorkflowDefinitions';
import { resetWorkflowSchemaValidatorCacheForTests } from './validateWorkflowSchema';

const fixturesDir = path.join(__dirname, '__fixtures__');
const tempDirs: string[] = [];

function readFixture(name: string): unknown {
    return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

function createTempWorkspace(workflows: Record<string, unknown>): string {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-workflow-discovery-'));
    tempDirs.push(tempDir);

    const workflowsDir = path.join(tempDir, '.ai', 'workflows');
    fs.mkdirSync(workflowsDir, { recursive: true });

    for (const [filename, content] of Object.entries(workflows)) {
        fs.writeFileSync(
            path.join(workflowsDir, filename),
            `${JSON.stringify(content, null, 2)}\n`,
            'utf8'
        );
    }

    return tempDir;
}

afterEach(() => {
    resetWorkflowSchemaValidatorCacheForTests();

    while (tempDirs.length > 0) {
        const tempDir = tempDirs.pop();
        if (tempDir) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
});

describe('discoverWorkflowDefinitions', () => {
    it('returns one index entry per workflow JSON file with contract fields', () => {
        const workspaceRoot = createTempWorkspace({
            'alpha.json': readFixture('valid-minimal.json'),
            'beta.json': {
                schema_version: '1.0.0',
                workflow_id: 'beta-flow',
                name: 'Beta Flow',
                version: '2.1.0',
                description: 'Second workflow fixture',
                entry_node_id: 'start',
                nodes: [{ node_id: 'start', type: 'terminal', name: 'Done' }],
            },
        });

        const result = discoverWorkflowDefinitions([workspaceRoot]);

        expect(result.entries).toHaveLength(2);
        expect(result.entries).toEqual(
            expect.arrayContaining([
                {
                    workflow_id: 'test-minimal',
                    name: 'Test Minimal',
                    version: '1.0.0',
                    schema_version: '1.0.0',
                    path: '.ai/workflows/alpha.json',
                    schema_valid: true,
                },
                {
                    workflow_id: 'beta-flow',
                    name: 'Beta Flow',
                    version: '2.1.0',
                    description: 'Second workflow fixture',
                    schema_version: '1.0.0',
                    path: '.ai/workflows/beta.json',
                    schema_valid: true,
                },
            ])
        );
        expect(result.diagnostics).toEqual([]);
    });

    it('exposes declared run_inputs on discovery index entries', () => {
        const workspaceRoot = createTempWorkspace({
            'with-inputs.json': {
                schema_version: '1.0.0',
                workflow_id: 'with-inputs',
                name: 'With Inputs',
                version: '1.0.0',
                entry_node_id: 'start',
                run_inputs: [
                    {
                        input_id: 'param_a',
                        type: 'string',
                        label: 'Param A',
                        required: true,
                    },
                ],
                nodes: [{ node_id: 'start', type: 'terminal', name: 'Done' }],
            },
        });

        const result = discoverWorkflowDefinitions([workspaceRoot]);

        expect(result.entries).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    workflow_id: 'with-inputs',
                    run_inputs: [
                        expect.objectContaining({
                            input_id: 'param_a',
                            type: 'string',
                            label: 'Param A',
                            required: true,
                        }),
                    ],
                }),
            ])
        );
    });

    it('discovers the repo refine-issue workflow definition', () => {
        const result = discoverWorkflowDefinitions([process.cwd()]);

        expect(result.entries).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    workflow_id: 'refine-issue',
                    name: 'Refine Issue',
                    version: '1.1.0',
                    schema_version: '1.0.0',
                    path: '.ai/workflows/refine-issue.json',
                    schema_valid: true,
                    run_inputs: expect.arrayContaining([
                        expect.objectContaining({
                            input_id: 'issue_ref',
                            type: 'string',
                            required: true,
                        }),
                    ]),
                }),
            ])
        );
    });

    it('reports duplicate workflow_id values with forge.workflow.duplicate_id diagnostics', () => {
        const workspaceRoot = createTempWorkspace({
            'first.json': {
                schema_version: '1.0.0',
                workflow_id: 'shared-id',
                name: 'First',
                version: '1.0.0',
                entry_node_id: 'start',
                nodes: [{ node_id: 'start', type: 'terminal', name: 'Done' }],
            },
            'second.json': {
                schema_version: '1.0.0',
                workflow_id: 'shared-id',
                name: 'Second',
                version: '1.0.0',
                entry_node_id: 'start',
                nodes: [{ node_id: 'start', type: 'terminal', name: 'Done' }],
            },
        });

        const result = discoverWorkflowDefinitions([workspaceRoot]);

        expect(result.entries).toHaveLength(2);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                {
                    code: 'forge.workflow.duplicate_id',
                    severity: 'error',
                    path: '.ai/workflows/first.json',
                    message:
                        'duplicate workflow_id "shared-id" across discovered workflow definition files',
                    validator_id: WORKFLOW_DUPLICATE_ID_VALIDATOR_ID,
                },
                {
                    code: 'forge.workflow.duplicate_id',
                    severity: 'error',
                    path: '.ai/workflows/second.json',
                    message:
                        'duplicate workflow_id "shared-id" across discovered workflow definition files',
                    validator_id: WORKFLOW_DUPLICATE_ID_VALIDATOR_ID,
                },
            ])
        );
    });

    it('returns an empty index when no workflow directory exists', () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-workflow-discovery-empty-'));
        tempDirs.push(tempDir);

        const result = discoverWorkflowDefinitions([tempDir]);

        expect(result.entries).toEqual([]);
        expect(result.diagnostics).toEqual([]);
    });

    it('continues scanning after invalid JSON and attaches schema_valid when validation runs', () => {
        const workspaceRoot = createTempWorkspace({
            'valid.json': readFixture('valid-minimal.json'),
            'invalid.json': readFixture('missing-schema-version.json'),
        });
        fs.writeFileSync(
            path.join(workspaceRoot, '.ai', 'workflows', 'broken.json'),
            '{ invalid json',
            'utf8'
        );

        const result = discoverWorkflowDefinitions([workspaceRoot]);

        expect(result.entries).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    workflow_id: 'test-minimal',
                    path: '.ai/workflows/valid.json',
                    schema_valid: true,
                }),
                expect.objectContaining({
                    workflow_id: 'missing-schema-version',
                    path: '.ai/workflows/invalid.json',
                    schema_valid: false,
                }),
            ])
        );
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'forge.workflow.parse_error',
                    severity: 'error',
                    path: '.ai/workflows/broken.json',
                }),
            ])
        );
    });

    it('skips schema validation when validateSchema is false', () => {
        const workspaceRoot = createTempWorkspace({
            'invalid.json': readFixture('missing-schema-version.json'),
        });

        const result = discoverWorkflowDefinitions([workspaceRoot], { validateSchema: false });

        expect(result.entries).toEqual([
            expect.objectContaining({
                workflow_id: 'missing-schema-version',
                path: '.ai/workflows/invalid.json',
            }),
        ]);
        expect(result.entries[0]).not.toHaveProperty('schema_valid');
    });

    it('scans multiple workspace roots and detects duplicates across roots', () => {
        const firstRoot = createTempWorkspace({
            'alpha.json': {
                schema_version: '1.0.0',
                workflow_id: 'cross-root',
                name: 'Alpha',
                version: '1.0.0',
                entry_node_id: 'start',
                nodes: [{ node_id: 'start', type: 'terminal', name: 'Done' }],
            },
        });
        const secondRoot = createTempWorkspace({
            'beta.json': {
                schema_version: '1.0.0',
                workflow_id: 'cross-root',
                name: 'Beta',
                version: '1.0.0',
                entry_node_id: 'start',
                nodes: [{ node_id: 'start', type: 'terminal', name: 'Done' }],
            },
        });

        const result = discoverWorkflowDefinitions([firstRoot, secondRoot]);

        expect(result.entries).toHaveLength(2);
        expect(result.diagnostics.filter((diagnostic) => diagnostic.code === 'forge.workflow.duplicate_id')).toHaveLength(2);
    });
});
