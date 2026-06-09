import { describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { ExternalReadinessBlockedError, ExternalTemporalSupervisor } from './ExternalTemporalSupervisor';
import { TemporalReadinessBlockedError } from './TemporalLocalSupervisor';
import { TemporalLocalSupervisor } from './TemporalLocalSupervisor';
import {
    TemporalConfigurationInvalidError,
    gateTemporalReadiness,
} from './temporalReadinessGate';

describe('temporalReadinessGate', () => {
    it('validates external configuration before running external preflight', async () => {
        await expect(
            gateTemporalReadiness({
                resolveMode: () => 'external',
                getExternalSupervisor: () => undefined,
                resolveSettings: () => ({
                    address: undefined,
                    namespace: 'forge-external',
                    taskQueue: 'forge-workflows',
                    authMode: 'apiKey',
                    tlsEnabled: true,
                    tlsServerName: '',
                }),
                getStoredApiKey: async () => 'test-key',
            })
        ).rejects.toBeInstanceOf(TemporalConfigurationInvalidError);
    });

    it('runs external preflight when configuration is valid', async () => {
        const supervisor = {
            ensureReady: vi.fn(async () => undefined),
        } as unknown as ExternalTemporalSupervisor;

        await expect(
            gateTemporalReadiness({
                resolveMode: () => 'external',
                getExternalSupervisor: () => supervisor,
                resolveSettings: () => ({
                    address: 'localhost:7233',
                    namespace: 'forge-external',
                    taskQueue: 'forge-workflows',
                    authMode: 'insecure',
                    tlsEnabled: false,
                    tlsServerName: '',
                }),
            })
        ).resolves.toBeUndefined();

        expect(supervisor.ensureReady).toHaveBeenCalledOnce();
    });

    it('blocks workflow run start when external preflight fails', async () => {
        const supervisor = {
            ensureReady: vi.fn(async () => {
                throw new ExternalReadinessBlockedError(
                    {
                        remediation: 'auth',
                        message: 'External Temporal authentication failed.',
                    },
                    'connect_failed'
                );
            }),
        } as unknown as ExternalTemporalSupervisor;

        await expect(
            gateTemporalReadiness({
                resolveMode: () => 'external',
                getExternalSupervisor: () => supervisor,
                resolveSettings: () => ({
                    address: 'localhost:7233',
                    namespace: 'forge-external',
                    taskQueue: 'forge-workflows',
                    authMode: 'apiKey',
                    tlsEnabled: true,
                    tlsServerName: '',
                }),
                getStoredApiKey: async () => 'test-key',
            })
        ).rejects.toBeInstanceOf(TemporalConfigurationInvalidError);

        expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
            'Workflow runs are blocked until Temporal is ready. See Forge Temporal output for details.'
        );
    });

    it('blocks workflow run start when supervisor is start_failed', async () => {
        const supervisor = {
            ensureReady: vi.fn(async () => {
                throw new TemporalReadinessBlockedError(
                    {
                        remediation: 'port',
                        message: 'Managed-local Temporal dev server failed to start.',
                    },
                    'start_failed'
                );
            }),
        } as unknown as TemporalLocalSupervisor;

        await expect(
            gateTemporalReadiness({
                resolveMode: () => 'managedLocal',
                getSupervisor: () => supervisor,
            })
        ).rejects.toBeInstanceOf(TemporalConfigurationInvalidError);

        expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
            'Workflow runs are blocked until Temporal is ready. See Forge Temporal output for details.'
        );

        await expect(
            gateTemporalReadiness({
                resolveMode: () => 'managedLocal',
                getSupervisor: () => supervisor,
            })
        ).rejects.toMatchObject({
            diagnostics: [
                expect.objectContaining({
                    code: 'forge.temporal.configuration_invalid',
                    severity: 'error',
                    path: 'forge.temporal.managedLocal',
                    validator_id: 'forge.temporal.readiness',
                }),
            ],
        });
    });

    it('reports configuration invalid when supervisor is not registered', async () => {
        await expect(
            gateTemporalReadiness({
                resolveMode: () => 'managedLocal',
                getSupervisor: () => undefined,
            })
        ).rejects.toBeInstanceOf(TemporalConfigurationInvalidError);
    });

    it('passes when supervisor reaches ready', async () => {
        const supervisor = {
            ensureReady: vi.fn(async () => undefined),
        } as unknown as TemporalLocalSupervisor;

        await expect(
            gateTemporalReadiness({
                resolveMode: () => 'managedLocal',
                getSupervisor: () => supervisor,
            })
        ).resolves.toBeUndefined();

        expect(supervisor.ensureReady).toHaveBeenCalledOnce();
    });
});
