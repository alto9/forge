import { describe, expect, it, vi } from 'vitest';
import {
    ExternalReadinessBlockedError,
    ExternalTemporalSupervisor,
} from './ExternalTemporalSupervisor';
import type { ResolvedExternalSettings } from './externalSettings';

const externalSettings: ResolvedExternalSettings = {
    address: 'temporal.example.com:7233',
    namespace: 'forge-external',
    taskQueue: 'forge-workflows',
    authMode: 'apiKey',
    tlsEnabled: true,
    tlsServerName: '',
};

function createSupervisor(options: {
    preflightResults: Array<void | Error>;
    probeResults?: boolean[];
}) {
    let preflightIndex = 0;
    let probeIndex = 0;

    const supervisor = new ExternalTemporalSupervisor(
        {
            windowId: 'window-test',
            resolveSettings: () => externalSettings,
            resolveApiKey: async () => 'secret-key',
        },
        {
            preflight: async () => {
                const result = options.preflightResults[preflightIndex];
                preflightIndex += 1;
                if (result instanceof Error) {
                    throw result;
                }
            },
            probeHealth: async () => {
                const result = options.probeResults?.[probeIndex] ?? true;
                probeIndex += 1;
                return result;
            },
        }
    );

    return supervisor;
}

describe('ExternalTemporalSupervisor', () => {
    it('starts idle and transitions to ready after preflight succeeds', async () => {
        const supervisor = createSupervisor({ preflightResults: [undefined] });

        expect(supervisor.getHealthState()).toBe('idle');
        await supervisor.ensureReady();
        expect(supervisor.getHealthState()).toBe('ready');
    });

    it('transitions to connect_failed on auth failure and blocks subsequent runs', async () => {
        const supervisor = createSupervisor({
            preflightResults: [new Error('UNAUTHENTICATED: invalid api key')],
        });

        await expect(supervisor.ensureReady()).rejects.toBeInstanceOf(ExternalReadinessBlockedError);
        expect(supervisor.getHealthState()).toBe('connect_failed');
        expect(supervisor.getConnectError()?.remediation).toBe('auth');

        await expect(supervisor.ensureReady()).rejects.toBeInstanceOf(ExternalReadinessBlockedError);
    });

    it('classifies address failures', async () => {
        const error = new Error('connect ECONNREFUSED 127.0.0.1:7233') as NodeJS.ErrnoException;
        error.code = 'ECONNREFUSED';
        const supervisor = createSupervisor({ preflightResults: [error] });

        await expect(supervisor.ensureReady()).rejects.toBeInstanceOf(ExternalReadinessBlockedError);
        expect(supervisor.getConnectError()?.remediation).toBe('address');
    });

    it('transitions to unhealthy when health probes fail after ready', async () => {
        vi.useFakeTimers();
        const supervisor = createSupervisor({
            preflightResults: [undefined],
            probeResults: [false, false, false],
        });

        await supervisor.ensureReady();
        expect(supervisor.getHealthState()).toBe('ready');

        await vi.advanceTimersByTimeAsync(1_600);
        expect(supervisor.getHealthState()).toBe('unhealthy');
        vi.useRealTimers();
    });
});
