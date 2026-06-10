import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { composeSdkPrompt } from './composeSdkPrompt';
import type { CursorSdkRequestEnvelope } from './activityEnvelope';

describe('composeSdkPrompt', () => {
    const tempDirs: string[] = [];

    afterEach(() => {
        for (const dir of tempDirs) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
        tempDirs.length = 0;
    });

    it('combines binding content, prompt, and inputs', () => {
        const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-compose-'));
        tempDirs.push(workspaceRoot);
        const agentPath = '.cursor/agents/engineer.md';
        fs.mkdirSync(path.join(workspaceRoot, '.cursor/agents'), { recursive: true });
        fs.writeFileSync(path.join(workspaceRoot, agentPath), '# Engineer\nBuild the issue.');

        const envelope: CursorSdkRequestEnvelope = {
            envelope_version: '1.0.0',
            activity_id: 'forge.engineer.build',
            node_id: 'build-node',
            workflow_run_id: 'run-1',
            agent_path: agentPath,
            prompt: 'Implement issue #46.',
            inputs: { issueNumber: 46 },
            output_type: 'markdown',
        };

        const prompt = composeSdkPrompt(envelope, workspaceRoot);

        expect(prompt).toContain('## Agent binding');
        expect(prompt).toContain(agentPath);
        expect(prompt).toContain('# Engineer');
        expect(prompt).toContain('Implement issue #46.');
        expect(prompt).toContain('"issueNumber": 46');
    });
});
