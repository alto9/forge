import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import { SCHEMA_FILES } from '../templates/forgeAssets';
import { SetupCursorCommand, __testables } from '../commands/SetupCursorCommand';

function makeTempDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'forge-setup-test-'));
}

describe('setup cursor canonical JSON sync', () => {
    const tempDirs: string[] = [];

    afterEach(() => {
        for (const dir of tempDirs.splice(0)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('normalizes valid JSON and rejects invalid JSON', () => {
        expect(__testables.normalizeJson('{"a":1}')).toBe('{\n  "a": 1\n}');
        expect(__testables.normalizeJson('{invalid}')).toBeNull();
    });

    it('creates destination when missing', () => {
        const tempDir = makeTempDir();
        tempDirs.push(tempDir);
        const src = path.join(tempDir, 'src.json');
        const dest = path.join(tempDir, 'dest.json');

        fs.writeFileSync(src, '{"skills":[{"id":"a"}]}', 'utf8');
        __testables.syncCanonicalJsonReference(src, dest, '.forge/skill_registry.json');

        expect(fs.existsSync(dest)).toBe(true);
        expect(fs.readFileSync(dest, 'utf8')).toBe('{\n  "skills": [\n    {\n      "id": "a"\n    }\n  ]\n}\n');
    });

    it('updates destination when content drifts from canonical', () => {
        const tempDir = makeTempDir();
        tempDirs.push(tempDir);
        const src = path.join(tempDir, 'src.json');
        const dest = path.join(tempDir, 'dest.json');

        fs.writeFileSync(src, '{"skills":[{"id":"expected"}]}', 'utf8');
        fs.writeFileSync(dest, '{"skills":[{"id":"stale"}]}', 'utf8');

        __testables.syncCanonicalJsonReference(src, dest, '.forge/skill_registry.json');

        expect(fs.readFileSync(dest, 'utf8')).toBe(
            '{\n  "skills": [\n    {\n      "id": "expected"\n    }\n  ]\n}\n'
        );
    });

    it('repairs destination when destination JSON is invalid', () => {
        const tempDir = makeTempDir();
        tempDirs.push(tempDir);
        const src = path.join(tempDir, 'src.json');
        const dest = path.join(tempDir, 'dest.json');

        fs.writeFileSync(src, '{"knowledge_map":[]}', 'utf8');
        fs.writeFileSync(dest, '{not-valid}', 'utf8');

        __testables.syncCanonicalJsonReference(src, dest, '.forge/knowledge_map.json');

        expect(fs.readFileSync(dest, 'utf8')).toBe('{\n  "knowledge_map": []\n}\n');
    });
});

describe('forge folder sync policies', () => {
    const tempDirs: string[] = [];

    afterEach(() => {
        for (const dir of tempDirs.splice(0)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    function writeFileSyncEnsured(filePath: string, content: string): void {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content, 'utf8');
    }

    function writeCanonicalAssets(extensionPath: string): void {
        const workflowPath = path.join(extensionPath, 'resources', 'workflow');
        writeFileSyncEnsured(
            path.join(workflowPath, 'references', 'skill_registry.json'),
            '{"version":"canonical-skill"}'
        );
        writeFileSyncEnsured(
            path.join(workflowPath, 'references', 'knowledge_map.json'),
            '{"knowledge_map":[{"primary_doc":".forge/interface/index.md"}]}'
        );
        for (const schema of SCHEMA_FILES) {
            writeFileSyncEnsured(path.join(extensionPath, 'schemas', schema), '{"schemaVersion":"canonical"}');
        }
    }

    it('keeps vision and project create-only while syncing canonical refs and schemas', async () => {
        const projectPath = makeTempDir();
        const extensionPath = makeTempDir();
        const workflowPath = path.join(extensionPath, 'resources', 'workflow');
        tempDirs.push(projectPath, extensionPath);

        writeFileSyncEnsured(
            path.join(workflowPath, 'references', 'skill_registry.json'),
            '{"version":"canonical-skill"}'
        );
        writeFileSyncEnsured(
            path.join(workflowPath, 'references', 'knowledge_map.json'),
            '{"knowledge_map":[]}'
        );

        for (const schema of SCHEMA_FILES) {
            writeFileSyncEnsured(path.join(extensionPath, 'schemas', schema), '{"schemaVersion":"canonical"}');
        }

        writeFileSyncEnsured(path.join(projectPath, '.forge', 'vision.json'), '{"custom":"vision"}');
        writeFileSyncEnsured(path.join(projectPath, '.forge', 'project.json'), '{"custom":"project"}');
        writeFileSyncEnsured(path.join(projectPath, '.forge', 'skill_registry.json'), '{"version":"stale"}');
        writeFileSyncEnsured(path.join(projectPath, '.forge', 'knowledge_map.json'), '{"knowledge_map":[{"name":"stale"}]}');
        writeFileSyncEnsured(
            path.join(projectPath, '.forge', 'schemas', SCHEMA_FILES[0]),
            '{"schemaVersion":"stale"}'
        );

        await __testables.ensureForgeFolder(projectPath, extensionPath, workflowPath);

        expect(fs.readFileSync(path.join(projectPath, '.forge', 'vision.json'), 'utf8')).toBe(
            '{"custom":"vision"}'
        );
        expect(fs.readFileSync(path.join(projectPath, '.forge', 'project.json'), 'utf8')).toBe(
            '{"custom":"project"}'
        );
        expect(fs.readFileSync(path.join(projectPath, '.forge', 'skill_registry.json'), 'utf8')).toBe(
            '{\n  "version": "canonical-skill"\n}\n'
        );
        expect(fs.readFileSync(path.join(projectPath, '.forge', 'knowledge_map.json'), 'utf8')).toBe(
            '{\n  "knowledge_map": []\n}\n'
        );
        for (const schema of SCHEMA_FILES) {
            expect(fs.readFileSync(path.join(projectPath, '.forge', 'schemas', schema), 'utf8')).toBe(
                '{\n  "schemaVersion": "canonical"\n}\n'
            );
        }
    });

    it('supports silent per-folder sync entrypoint for automation', async () => {
        const projectPath = makeTempDir();
        const extensionPath = makeTempDir();
        const workflowPath = path.join(extensionPath, 'resources', 'workflow');
        tempDirs.push(projectPath, extensionPath);

        writeFileSyncEnsured(
            path.join(workflowPath, 'references', 'skill_registry.json'),
            '{"version":"1.0.0"}'
        );
        writeFileSyncEnsured(
            path.join(workflowPath, 'references', 'knowledge_map.json'),
            '{"knowledge_map":[]}'
        );
        for (const schema of SCHEMA_FILES) {
            writeFileSyncEnsured(path.join(extensionPath, 'schemas', schema), '{"schemaVersion":"1"}');
        }

        const context = { extensionPath } as vscode.ExtensionContext;
        const synced = await SetupCursorCommand.syncProjectFolder(context, projectPath, undefined, {
            forgeOnly: true,
            silent: true
        });

        expect(synced).toBe(true);
        expect(fs.existsSync(path.join(projectPath, '.forge', 'vision.json'))).toBe(true);
        expect(fs.existsSync(path.join(projectPath, '.forge', 'project.json'))).toBe(true);
    });

    it('marks project as needing sync when .forge is missing', () => {
        const projectPath = makeTempDir();
        const extensionPath = makeTempDir();
        tempDirs.push(projectPath, extensionPath);
        writeCanonicalAssets(extensionPath);

        expect(__testables.projectForgeAssetsNeedSync(projectPath, extensionPath)).toBe(true);
    });

    it('marks project as needing sync when mapped markdown docs are missing', async () => {
        const projectPath = makeTempDir();
        const extensionPath = makeTempDir();
        tempDirs.push(projectPath, extensionPath);
        writeCanonicalAssets(extensionPath);

        const workflowPath = path.join(extensionPath, 'resources', 'workflow');
        await __testables.ensureForgeFolder(projectPath, extensionPath, workflowPath);
        fs.rmSync(path.join(projectPath, '.forge', 'interface', 'index.md'));

        expect(__testables.projectForgeAssetsNeedSync(projectPath, extensionPath)).toBe(true);
    });

    it('marks project as up to date when canonical .forge assets match', async () => {
        const projectPath = makeTempDir();
        const extensionPath = makeTempDir();
        tempDirs.push(projectPath, extensionPath);
        writeCanonicalAssets(extensionPath);

        const workflowPath = path.join(extensionPath, 'resources', 'workflow');
        await __testables.ensureForgeFolder(projectPath, extensionPath, workflowPath);

        expect(__testables.projectForgeAssetsNeedSync(projectPath, extensionPath)).toBe(false);
    });
});
