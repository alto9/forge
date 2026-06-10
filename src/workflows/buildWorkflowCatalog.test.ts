import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildWorkflowCatalog, sortWorkflowCatalogEntries } from './buildWorkflowCatalog';
import { resetWorkflowSchemaValidatorCacheForTests } from './validateWorkflowSchema';
import type { WorkflowCatalogEntry } from './types';

const fixturesDir = path.join(__dirname, '__fixtures__');
const tempDirs: string[] = [];

function readFixture(name: string): unknown {
    return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf8'));
}

function createTempWorkspace(workflows: Record<string, unknown>): string {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-workflow-catalog-'));
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

describe('buildWorkflowCatalog', () => {
    it('returns no_workflows_dir when .ai/workflows is missing', () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-workflow-catalog-empty-'));
        tempDirs.push(tempDir);

        const result = buildWorkflowCatalog(tempDir);

        expect(result.emptyState).toBe('no_workflows_dir');
        expect(result.entries).toEqual([]);
    });

    it('returns no_json_files when the workflows directory is empty', () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-workflow-catalog-empty-'));
        tempDirs.push(tempDir);
        fs.mkdirSync(path.join(tempDir, '.ai', 'workflows'), { recursive: true });

        const result = buildWorkflowCatalog(tempDir);

        expect(result.emptyState).toBe('no_json_files');
        expect(result.entries).toEqual([]);
    });

    it('builds valid catalog entries with validation aggregates', () => {
        const workspaceRoot = createTempWorkspace({
            'test-minimal.json': readFixture('valid-minimal.json'),
        });

        const result = buildWorkflowCatalog(workspaceRoot);

        expect(result.emptyState).toBeUndefined();
        expect(result.entries).toHaveLength(1);
        expect(result.entries[0]).toMatchObject({
            workflow_id: 'test-minimal',
            name: 'Test Minimal',
            version: '1.0.0',
            schema_version: '1.0.0',
            path: '.ai/workflows/test-minimal.json',
            repositoryRoot: workspaceRoot,
            validation: {
                valid: true,
                errorCount: 0,
            },
        });
    });

    it('sorts valid entries before invalid and then by name', () => {
        const workspaceRoot = createTempWorkspace({
            'missing-binding.json': readFixture('missing-binding.json'),
            'test-minimal.json': readFixture('valid-minimal.json'),
        });

        const result = buildWorkflowCatalog(workspaceRoot);

        expect(result.entries.map((entry) => entry.workflow_id)).toEqual([
            'test-minimal',
            'missing-binding',
        ]);
        expect(result.entries[0]?.validation.valid).toBe(true);
        expect(result.entries[1]?.validation.valid).toBe(false);
    });

    it('reports duplicate workflow_id diagnostics on colliding entries', () => {
        const duplicate = readFixture('valid-minimal.json') as Record<string, unknown>;
        const workspaceRoot = createTempWorkspace({
            'alpha.json': duplicate,
            'beta.json': { ...duplicate, name: 'Duplicate Copy' },
        });

        const result = buildWorkflowCatalog(workspaceRoot);

        expect(result.entries).toHaveLength(2);
        for (const entry of result.entries) {
            expect(entry.validation.valid).toBe(false);
            expect(
                entry.validation.diagnostics.some(
                    (diagnostic) => diagnostic.code === 'forge.workflow.duplicate_id'
                )
            ).toBe(true);
        }
    });
});

describe('sortWorkflowCatalogEntries', () => {
    it('orders valid-first, then case-insensitive name, then workflow_id', () => {
        const entries: WorkflowCatalogEntry[] = [
            {
                workflow_id: 'b-flow',
                name: 'Bravo',
                path: '.ai/workflows/b.json',
                repositoryRoot: '/tmp',
                validation: { valid: false, diagnostics: [], errorCount: 1, warningCount: 0 },
            },
            {
                workflow_id: 'a-flow',
                name: 'alpha',
                path: '.ai/workflows/a.json',
                repositoryRoot: '/tmp',
                validation: { valid: true, diagnostics: [], errorCount: 0, warningCount: 0 },
            },
            {
                workflow_id: 'c-flow',
                name: 'Alpha',
                path: '.ai/workflows/c.json',
                repositoryRoot: '/tmp',
                validation: { valid: true, diagnostics: [], errorCount: 0, warningCount: 0 },
            },
        ];

        const sorted = sortWorkflowCatalogEntries(entries).map((entry) => entry.workflow_id);

        expect(sorted).toEqual(['a-flow', 'c-flow', 'b-flow']);
    });
});
