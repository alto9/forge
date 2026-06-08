import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    gateWorkflowRunStart,
    validateWorkflowForRun,
    WorkflowRunStartBlockedError,
} from './validateWorkflowForRun';
import { resetWorkflowSchemaValidatorCacheForTests } from './validateWorkflowSchema';

const fixturesDir = path.join(__dirname, '__fixtures__');
const tempDirs: string[] = [];

function readFixture(name: string): unknown {
    return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

function createTempWorkspace(workflows: Record<string, unknown>): string {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-workflow-prerun-'));
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

describe('validateWorkflowForRun', () => {
    beforeEach(() => {
        resetWorkflowSchemaValidatorCacheForTests();
    });

    it('resolves workflow_id via discovery and validates the definition', () => {
        const workspaceRoot = createTempWorkspace({
            'test-minimal.json': readFixture('valid-minimal.json'),
        });

        const result = validateWorkflowForRun({
            workspaceRoots: [workspaceRoot],
            workflowId: 'test-minimal',
        });

        expect(result.valid).toBe(true);
        expect(result.workflow_id).toBe('test-minimal');
        expect(result.path).toBe('.ai/workflows/test-minimal.json');
    });

    it('blocks invalid definitions resolved by workflow_id', () => {
        const workspaceRoot = createTempWorkspace({
            'broken-transition.json': readFixture('broken-transition.json'),
        });

        const result = validateWorkflowForRun({
            workspaceRoots: [workspaceRoot],
            workflowId: 'broken-transition',
        });

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'graph.missing_transition_target',
                    severity: 'error',
                }),
            ])
        );
    });

    it('validates by direct definition path', () => {
        const workspaceRoot = createTempWorkspace({
            'test-minimal.json': readFixture('valid-minimal.json'),
            'broken-transition.json': readFixture('broken-transition.json'),
        });

        const valid = validateWorkflowForRun({
            workspaceRoots: [workspaceRoot],
            definitionPath: '.ai/workflows/test-minimal.json',
        });
        const invalid = validateWorkflowForRun({
            workspaceRoots: [workspaceRoot],
            definitionPath: '.ai/workflows/broken-transition.json',
        });

        expect(valid.valid).toBe(true);
        expect(invalid.valid).toBe(false);
    });

    it('reports not found when workflow_id is missing from discovery', () => {
        const workspaceRoot = createTempWorkspace({
            'test-minimal.json': readFixture('valid-minimal.json'),
        });

        const result = validateWorkflowForRun({
            workspaceRoots: [workspaceRoot],
            workflowId: 'missing-workflow',
        });

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'forge.workflow.not_found',
                    severity: 'error',
                }),
            ])
        );
    });
});

describe('gateWorkflowRunStart', () => {
    it('returns the validation result when the definition is valid', () => {
        const workspaceRoot = createTempWorkspace({
            'test-minimal.json': readFixture('valid-minimal.json'),
        });

        const result = gateWorkflowRunStart({
            workspaceRoots: [workspaceRoot],
            workflowId: 'test-minimal',
        });

        expect(result.valid).toBe(true);
    });

    it('throws WorkflowRunStartBlockedError when validation fails', () => {
        const workspaceRoot = createTempWorkspace({
            'missing-binding.json': readFixture('missing-binding.json'),
        });

        expect(() =>
            gateWorkflowRunStart({
                workspaceRoots: [workspaceRoot],
                workflowId: 'missing-binding',
            })
        ).toThrow(WorkflowRunStartBlockedError);

        try {
            gateWorkflowRunStart({
                workspaceRoots: [workspaceRoot],
                workflowId: 'missing-binding',
            });
        } catch (error) {
            expect(error).toBeInstanceOf(WorkflowRunStartBlockedError);
            const blocked = error as WorkflowRunStartBlockedError;
            expect(blocked.result.valid).toBe(false);
            expect(blocked.result.workflow_id).toBe('missing-binding');
        }
    });
});
