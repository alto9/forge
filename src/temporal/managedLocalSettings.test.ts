import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import {
    computeDefaultPersistencePath,
    resolveManagedLocalSettings,
} from './managedLocalSettings';

describe('managedLocalSettings', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        process.env = { ...originalEnv };
        vi.restoreAllMocks();
    });

    it('computes default persistence path from global storage and window id', () => {
        expect(computeDefaultPersistencePath('/tmp/global', 'window-1')).toBe(
            path.join('/tmp/global', 'temporal', 'window-1')
        );
    });

    it('uses workspace settings when env vars are unset', () => {
        vi.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue({
            get: (key: string) => {
                switch (key) {
                    case 'grpcPort':
                        return 17233;
                    case 'uiPort':
                        return 18233;
                    case 'namespace':
                        return 'workspace-ns';
                    case 'taskQueue':
                        return 'workspace-queue';
                    case 'persistencePath':
                        return '';
                    default:
                        return undefined;
                }
            },
        } as vscode.WorkspaceConfiguration);

        const resolved = resolveManagedLocalSettings({
            globalStoragePath: path.join(os.tmpdir(), 'forge-global'),
            windowId: 'window-abc',
        });

        expect(resolved.grpcPort).toBe(17233);
        expect(resolved.uiPort).toBe(18233);
        expect(resolved.namespace).toBe('workspace-ns');
        expect(resolved.taskQueue).toBe('workspace-queue');
        expect(resolved.persistencePath).toBe(
            path.join(os.tmpdir(), 'forge-global', 'temporal', 'window-abc')
        );
    });

    it('prefers environment variables over workspace settings', () => {
        process.env.FORGE_TEMPORAL_MANAGED_LOCAL_GRPC_PORT = '27233';
        process.env.FORGE_TEMPORAL_MANAGED_LOCAL_NAMESPACE = 'env-ns';

        vi.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue({
            get: (key: string) => {
                switch (key) {
                    case 'grpcPort':
                        return 17233;
                    case 'uiPort':
                        return 8233;
                    case 'namespace':
                        return 'workspace-ns';
                    case 'taskQueue':
                        return 'forge-workflows';
                    case 'persistencePath':
                        return '';
                    default:
                        return undefined;
                }
            },
        } as vscode.WorkspaceConfiguration);

        const resolved = resolveManagedLocalSettings({
            globalStoragePath: fs.mkdtempSync(path.join(os.tmpdir(), 'forge-settings-')),
            windowId: 'window-env',
        });

        expect(resolved.grpcPort).toBe(27233);
        expect(resolved.namespace).toBe('env-ns');
    });
});
