import { afterEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import {
    clearRegisteredStoredApiKeyReader,
    registerStoredApiKeyReader,
} from './externalCredentials';
import type { ResolvedExternalSettings } from './externalSettings';
import {
    getTemporalConfigurationErrors,
    isLoopbackHost,
    parseAddressHost,
    validateTemporalConfiguration,
} from './temporalConfigurationValidation';

function externalSettings(overrides: Partial<ResolvedExternalSettings> = {}): ResolvedExternalSettings {
    return {
        address: 'localhost:7233',
        namespace: 'forge-external',
        taskQueue: 'forge-workflows',
        authMode: 'apiKey',
        tlsEnabled: true,
        tlsServerName: '',
        ...overrides,
    };
}

describe('temporalConfigurationValidation', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        process.env = { ...originalEnv };
        clearRegisteredStoredApiKeyReader();
        vi.restoreAllMocks();
    });

    it('parses loopback hosts from address strings', () => {
        expect(parseAddressHost('localhost:7233')).toBe('localhost');
        expect(parseAddressHost('127.0.0.1:7233')).toBe('127.0.0.1');
        expect(parseAddressHost('[::1]:7233')).toBe('::1');
        expect(isLoopbackHost('localhost')).toBe(true);
        expect(isLoopbackHost('my-ns.tmprl.cloud')).toBe(false);
    });

    it('reports missing required external fields', async () => {
        const diagnostics = await validateTemporalConfiguration({
            resolveMode: () => 'external',
            resolveSettings: () =>
                externalSettings({
                    address: undefined,
                    namespace: undefined,
                }),
            getStoredApiKey: async () => 'test-key',
        });

        const errors = getTemporalConfigurationErrors(diagnostics);
        expect(errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: 'forge.temporal.external.address' }),
                expect.objectContaining({ path: 'forge.temporal.external.namespace' }),
            ])
        );
    });

    it('blocks apiKey mode without a configured API key', async () => {
        const diagnostics = await validateTemporalConfiguration({
            resolveMode: () => 'external',
            resolveSettings: () => externalSettings({ authMode: 'apiKey' }),
            getStoredApiKey: async () => undefined,
        });

        expect(getTemporalConfigurationErrors(diagnostics)).toEqual([
            expect.objectContaining({
                path: 'forge.temporal.external.apiKey',
                message: expect.stringContaining('API key not configured'),
            }),
        ]);
    });

    it('accepts apiKey mode when env API key is set', async () => {
        process.env.FORGE_TEMPORAL_EXTERNAL_API_KEY = 'env-key';

        const diagnostics = await validateTemporalConfiguration({
            resolveMode: () => 'external',
            resolveSettings: () => externalSettings({ authMode: 'apiKey' }),
        });

        expect(getTemporalConfigurationErrors(diagnostics)).toEqual([]);
    });

    it('uses the registered SecretStorage reader when no override is provided', async () => {
        registerStoredApiKeyReader(async () => 'stored-key');

        const diagnostics = await validateTemporalConfiguration({
            resolveMode: () => 'external',
            resolveSettings: () => externalSettings({ authMode: 'apiKey' }),
        });

        expect(getTemporalConfigurationErrors(diagnostics)).toEqual([]);
    });

    it('blocks insecure mode for non-loopback hosts', async () => {
        const diagnostics = await validateTemporalConfiguration({
            resolveMode: () => 'external',
            resolveSettings: () =>
                externalSettings({
                    authMode: 'insecure',
                    tlsEnabled: false,
                    address: 'my-ns.a1b2c.tmprl.cloud:7233',
                }),
        });

        expect(getTemporalConfigurationErrors(diagnostics)).toEqual([
            expect.objectContaining({
                path: 'forge.temporal.external.address',
                message: expect.stringContaining('Insecure mode is allowed only for localhost'),
            }),
        ]);
    });

    it('blocks tls disabled unless auth mode is insecure on loopback', async () => {
        const diagnostics = await validateTemporalConfiguration({
            resolveMode: () => 'external',
            resolveSettings: () =>
                externalSettings({
                    authMode: 'apiKey',
                    tlsEnabled: false,
                    address: 'my-ns.a1b2c.tmprl.cloud:7233',
                }),
            getStoredApiKey: async () => 'test-key',
        });

        expect(getTemporalConfigurationErrors(diagnostics)).toEqual([
            expect.objectContaining({
                path: 'forge.temporal.external.tls.enabled',
                message: expect.stringContaining('TLS is required for this auth mode'),
            }),
        ]);
    });

    it('emits info diagnostic when managed-local keys are set in external mode', async () => {
        vi.spyOn(vscode.workspace, 'getConfiguration').mockImplementation((section?: string) => {
            if (section === 'forge.temporal.managedLocal') {
                return {
                    inspect: (key: string) =>
                        key === 'grpcPort' ? { workspaceValue: 17233 } : undefined,
                } as vscode.WorkspaceConfiguration;
            }
            if (section === 'forge.temporal.external') {
                return {
                    inspect: () => undefined,
                } as vscode.WorkspaceConfiguration;
            }
            return {} as vscode.WorkspaceConfiguration;
        });

        const diagnostics = await validateTemporalConfiguration({
            resolveMode: () => 'external',
            resolveSettings: () => externalSettings(),
            getStoredApiKey: async () => 'test-key',
        });

        expect(diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    severity: 'warning',
                    path: 'forge.temporal.managedLocal',
                }),
            ])
        );
        expect(getTemporalConfigurationErrors(diagnostics)).toEqual([]);
    });

    it('emits info diagnostic when external keys are set in managedLocal mode', async () => {
        vi.spyOn(vscode.workspace, 'getConfiguration').mockImplementation((section?: string) => {
            if (section === 'forge.temporal.external') {
                return {
                    inspect: (key: string) =>
                        key === 'address' ? { workspaceValue: 'unused:7233' } : undefined,
                } as vscode.WorkspaceConfiguration;
            }
            return {} as vscode.WorkspaceConfiguration;
        });

        const diagnostics = await validateTemporalConfiguration({
            resolveMode: () => 'managedLocal',
        });

        expect(diagnostics).toEqual([
            expect.objectContaining({
                severity: 'warning',
                path: 'forge.temporal.external',
            }),
        ]);
    });
});
