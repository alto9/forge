import { describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { TemporalReadinessBlockedError } from './TemporalLocalSupervisor';
import { TemporalLocalSupervisor } from './TemporalLocalSupervisor';
import {
    TemporalConfigurationInvalidError,
    gateTemporalReadiness,
} from './temporalReadinessGate';

describe('temporalReadinessGate', () => {
    it('skips readiness when mode is external', async () => {
        await expect(
            gateTemporalReadiness({
                resolveMode: () => 'external',
                getSupervisor: () => undefined,
            })
        ).resolves.toBeUndefined();
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
