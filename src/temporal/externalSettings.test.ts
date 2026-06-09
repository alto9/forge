import { afterEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import {
    resolveExternalApiKey,
    resolveExternalAuthMode,
    resolveExternalSettings,
} from './externalSettings';

describe('externalSettings', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        process.env = { ...originalEnv };
        vi.restoreAllMocks();
    });

    it('resolves external settings from workspace values', () => {
        vi.spyOn(vscode.workspace, 'getConfiguration').mockImplementation((section?: string) => {
            if (section === 'forge.temporal.external') {
                return {
                    inspect: (key: string) => {
                        switch (key) {
                            case 'address':
                                return { workspaceValue: 'my-ns.a1b2c.tmprl.cloud:7233' };
                            case 'namespace':
                                return { workspaceValue: 'my-ns.a1b2c' };
                            case 'taskQueue':
                                return { workspaceValue: 'custom-queue' };
                            case 'auth.mode':
                                return { workspaceValue: 'tlsServer' };
                            case 'tls.enabled':
                                return { workspaceValue: false };
                            case 'tls.serverName':
                                return { workspaceValue: 'temporal.internal' };
                            default:
                                return undefined;
                        }
                    },
                } as vscode.WorkspaceConfiguration;
            }
            return {} as vscode.WorkspaceConfiguration;
        });

        expect(resolveExternalSettings()).toEqual({
            address: 'my-ns.a1b2c.tmprl.cloud:7233',
            namespace: 'my-ns.a1b2c',
            taskQueue: 'custom-queue',
            authMode: 'tlsServer',
            tlsEnabled: false,
            tlsServerName: 'temporal.internal',
        });
    });

    it('prefers workspace settings over environment variables', () => {
        process.env.FORGE_TEMPORAL_EXTERNAL_NAMESPACE = 'env-ns';
        process.env.FORGE_TEMPORAL_EXTERNAL_ADDRESS = 'env-host:7233';

        vi.spyOn(vscode.workspace, 'getConfiguration').mockImplementation((section?: string) => {
            if (section === 'forge.temporal.external') {
                return {
                    inspect: (key: string) => {
                        if (key === 'namespace') {
                            return { workspaceValue: 'workspace-ns' };
                        }
                        if (key === 'address') {
                            return { workspaceValue: 'workspace-host:7233' };
                        }
                        return undefined;
                    },
                } as vscode.WorkspaceConfiguration;
            }
            return {} as vscode.WorkspaceConfiguration;
        });

        const resolved = resolveExternalSettings();
        expect(resolved.namespace).toBe('workspace-ns');
        expect(resolved.address).toBe('workspace-host:7233');
    });

    it('falls back to environment variables when settings are unset', () => {
        process.env.FORGE_TEMPORAL_EXTERNAL_NAMESPACE = 'env-ns';
        process.env.FORGE_TEMPORAL_EXTERNAL_ADDRESS = 'env-host:7233';
        process.env.FORGE_TEMPORAL_EXTERNAL_AUTH_MODE = 'insecure';
        process.env.FORGE_TEMPORAL_EXTERNAL_TLS_ENABLED = 'false';

        vi.spyOn(vscode.workspace, 'getConfiguration').mockImplementation((section?: string) => {
            if (section === 'forge.temporal.external') {
                return {
                    inspect: () => undefined,
                } as vscode.WorkspaceConfiguration;
            }
            return {} as vscode.WorkspaceConfiguration;
        });

        const resolved = resolveExternalSettings();
        expect(resolved.namespace).toBe('env-ns');
        expect(resolved.address).toBe('env-host:7233');
        expect(resolved.authMode).toBe('insecure');
        expect(resolved.tlsEnabled).toBe(false);
        expect(resolved.taskQueue).toBe('forge-workflows');
    });

    it('normalizes unknown auth modes to apiKey', () => {
        expect(resolveExternalAuthMode('unknown')).toBe('apiKey');
        expect(resolveExternalAuthMode('apiKey')).toBe('apiKey');
    });

    it('prefers environment API key over SecretStorage', async () => {
        process.env.FORGE_TEMPORAL_EXTERNAL_API_KEY = 'env-key';

        const stored = vi.fn(async () => 'stored-key');
        await expect(resolveExternalApiKey(stored)).resolves.toBe('env-key');
        expect(stored).not.toHaveBeenCalled();
    });

    it('falls back to SecretStorage when env API key is unset', async () => {
        delete process.env.FORGE_TEMPORAL_EXTERNAL_API_KEY;

        const stored = vi.fn(async () => 'stored-key');
        await expect(resolveExternalApiKey(stored)).resolves.toBe('stored-key');
    });
});
