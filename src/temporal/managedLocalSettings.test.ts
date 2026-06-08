import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import {
    computeDefaultPersistencePath,
    resolveManagedLocalSettings,
    resolveTemporalMode,
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
        vi.spyOn(vscode.workspace, 'getConfiguration').mockImplementation((section?: string) => {
            if (section === 'forge.temporal.managedLocal') {
                return {
                    inspect: (key: string) => {
                        switch (key) {
                            case 'grpcPort':
                                return { workspaceValue: 17233 };
                            case 'uiPort':
                                return { workspaceValue: 18233 };
                            case 'namespace':
                                return { workspaceValue: 'workspace-ns' };
                            case 'taskQueue':
                                return { workspaceValue: 'workspace-queue' };
                            case 'persistencePath':
                                return { workspaceValue: '' };
                            default:
                                return undefined;
                        }
                    },
                } as vscode.WorkspaceConfiguration;
            }
            return {} as vscode.WorkspaceConfiguration;
        });

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
        expect(resolved.persistencePathUserConfigured).toBe(false);
    });

    it('marks user-configured persistence path', () => {
        const customPath = path.join(os.tmpdir(), 'custom-temporal');

        vi.spyOn(vscode.workspace, 'getConfiguration').mockImplementation((section?: string) => {
            if (section === 'forge.temporal.managedLocal') {
                return {
                    inspect: (key: string) => {
                        if (key === 'persistencePath') {
                            return { workspaceValue: customPath };
                        }
                        return undefined;
                    },
                } as vscode.WorkspaceConfiguration;
            }
            return {} as vscode.WorkspaceConfiguration;
        });

        const resolved = resolveManagedLocalSettings({
            globalStoragePath: path.join(os.tmpdir(), 'forge-global'),
            windowId: 'window-custom',
        });

        expect(resolved.persistencePath).toBe(customPath);
        expect(resolved.persistencePathUserConfigured).toBe(true);
    });

    it('prefers workspace settings over environment variables', () => {
        process.env.FORGE_TEMPORAL_MANAGED_LOCAL_GRPC_PORT = '27233';
        process.env.FORGE_TEMPORAL_MANAGED_LOCAL_NAMESPACE = 'env-ns';

        vi.spyOn(vscode.workspace, 'getConfiguration').mockImplementation((section?: string) => {
            if (section === 'forge.temporal.managedLocal') {
                return {
                    inspect: (key: string) => {
                        switch (key) {
                            case 'grpcPort':
                                return { workspaceValue: 17233 };
                            case 'uiPort':
                                return { workspaceValue: 8233 };
                            case 'namespace':
                                return { workspaceValue: 'workspace-ns' };
                            case 'taskQueue':
                                return { workspaceValue: 'forge-workflows' };
                            case 'persistencePath':
                                return { workspaceValue: '' };
                            default:
                                return undefined;
                        }
                    },
                } as vscode.WorkspaceConfiguration;
            }
            return {} as vscode.WorkspaceConfiguration;
        });

        const resolved = resolveManagedLocalSettings({
            globalStoragePath: path.join(os.tmpdir(), 'forge-settings-'),
            windowId: 'window-env',
        });

        expect(resolved.grpcPort).toBe(17233);
        expect(resolved.namespace).toBe('workspace-ns');
    });

    it('falls back to environment variables when workspace and user settings are unset', () => {
        process.env.FORGE_TEMPORAL_MANAGED_LOCAL_GRPC_PORT = '27233';
        process.env.FORGE_TEMPORAL_MANAGED_LOCAL_NAMESPACE = 'env-ns';

        vi.spyOn(vscode.workspace, 'getConfiguration').mockImplementation((section?: string) => {
            if (section === 'forge.temporal.managedLocal') {
                return {
                    inspect: () => undefined,
                } as vscode.WorkspaceConfiguration;
            }
            return {} as vscode.WorkspaceConfiguration;
        });

        const resolved = resolveManagedLocalSettings({
            globalStoragePath: path.join(os.tmpdir(), 'forge-settings-'),
            windowId: 'window-env',
        });

        expect(resolved.grpcPort).toBe(27233);
        expect(resolved.namespace).toBe('env-ns');
    });

    it('prefers user settings over environment variables', () => {
        process.env.FORGE_TEMPORAL_MANAGED_LOCAL_GRPC_PORT = '27233';

        vi.spyOn(vscode.workspace, 'getConfiguration').mockImplementation((section?: string) => {
            if (section === 'forge.temporal.managedLocal') {
                return {
                    inspect: (key: string) => {
                        if (key === 'grpcPort') {
                            return { globalValue: 18233 };
                        }
                        return undefined;
                    },
                } as vscode.WorkspaceConfiguration;
            }
            return {} as vscode.WorkspaceConfiguration;
        });

        const resolved = resolveManagedLocalSettings({
            globalStoragePath: path.join(os.tmpdir(), 'forge-settings-'),
            windowId: 'window-user',
        });

        expect(resolved.grpcPort).toBe(18233);
    });

    it('resolves managedLocal mode by default', () => {
        vi.spyOn(vscode.workspace, 'getConfiguration').mockImplementation((section?: string) => {
            if (section === 'forge.temporal') {
                return {
                    inspect: () => undefined,
                } as vscode.WorkspaceConfiguration;
            }
            return {} as vscode.WorkspaceConfiguration;
        });

        expect(resolveTemporalMode()).toBe('managedLocal');
    });

    it('resolves external mode from workspace setting', () => {
        vi.spyOn(vscode.workspace, 'getConfiguration').mockImplementation((section?: string) => {
            if (section === 'forge.temporal') {
                return {
                    inspect: (key: string) =>
                        key === 'mode' ? { workspaceValue: 'external' } : undefined,
                } as vscode.WorkspaceConfiguration;
            }
            return {} as vscode.WorkspaceConfiguration;
        });

        expect(resolveTemporalMode()).toBe('external');
    });
});
