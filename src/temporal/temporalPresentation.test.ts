import { describe, expect, it } from 'vitest';
import {
    formatExternalConnectFailedNotification,
    formatExternalReadyNotification,
    formatExternalStatusBarLabel,
    formatManagedLocalStatusBarLabel,
    formatPersistencePathForDisplay,
    formatReadyNotification,
    formatStartFailedNotification,
    formatWorkflowBlockedNotification,
    formatWorkerBlockedNotification,
    formatWorkerReadyNotification,
    formatWorkerStartFailedNotification,
    formatWorkerStatusBarSegment,
    formatWorkerStateTransitionLogLine,
    formatWorkerUpgradeRestartLogLine,
} from './temporalPresentation';
import type { ManagedLocalHealthState } from './types';

describe('temporalPresentation', () => {
    describe('formatPersistencePathForDisplay', () => {
        it('returns full path for default persistence location', () => {
            const fullPath = '/Users/me/Library/Application Support/forge/temporal/window-1';
            expect(formatPersistencePathForDisplay(fullPath, false)).toBe(fullPath);
        });

        it('returns basename only when user configured persistence path', () => {
            expect(
                formatPersistencePathForDisplay('/secret/custom/temporal-data', true)
            ).toBe('temporal-data');
        });
    });

    describe('formatManagedLocalStatusBarLabel', () => {
        const cases: Array<[ManagedLocalHealthState, string]> = [
            ['idle', '$(pulse) Temporal: idle'],
            ['starting', '$(pulse) Temporal: starting…'],
            ['ready', '$(pulse) Temporal: ready'],
            ['unhealthy', '$(pulse) Temporal: unhealthy'],
            ['start_failed', '$(pulse) Temporal: failed'],
            ['stopped', '$(pulse) Temporal: stopped'],
        ];

        it.each(cases)('maps %s to contract label', (state, expected) => {
            expect(formatManagedLocalStatusBarLabel(state)).toBe(expected);
        });
    });

    describe('formatStartFailedNotification', () => {
        it('uses port remediation copy', () => {
            expect(formatStartFailedNotification('port', 7233, 'temporal-data')).toBe(
                'Forge could not start Temporal — port 7233 is in use. Change `forge.temporal.managedLocal.grpcPort` or stop the conflicting process.'
            );
        });

        it('uses asset remediation copy', () => {
            expect(formatStartFailedNotification('asset', 7233, 'temporal-data')).toBe(
                'Forge could not start Temporal — dev server assets are missing from the extension package. Reinstall Forge Studio.'
            );
        });

        it('uses permission remediation copy with display path', () => {
            expect(formatStartFailedNotification('permission', 7233, 'temporal-data')).toBe(
                'Forge could not start Temporal — cannot write persistence data to temporal-data. Check permissions or set `forge.temporal.managedLocal.persistencePath`.'
            );
        });
    });

    it('uses ready notification copy from contract', () => {
        expect(formatReadyNotification()).toBe(
            'Forge Temporal ready — managed local dev server is accepting workflow runs.'
        );
    });

    it('uses workflow blocked notification copy from contract', () => {
        expect(formatWorkflowBlockedNotification()).toBe(
            'Workflow runs are blocked until Temporal is ready. See Forge Temporal output for details.'
        );
    });

    it('uses workflow start diagnostic catalog copy from contract', async () => {
        const {
            formatWorkflowRunStartDefinitionBlockedCatalogMessage,
            formatWorkflowRunStartFailedCatalogMessage,
            formatWorkflowRunStartInFlightCatalogMessage,
            formatWorkflowRunStartInputBlockedCatalogMessage,
        } = await import('./temporalPresentation');

        expect(formatWorkflowRunStartDefinitionBlockedCatalogMessage()).toBe(
            'Fix validation errors before starting a run.'
        );
        expect(formatWorkflowRunStartInputBlockedCatalogMessage()).toBe(
            'Complete required inputs before starting this workflow.'
        );
        expect(formatWorkflowRunStartInFlightCatalogMessage()).toBe('Starting workflow run…');
        expect(formatWorkflowRunStartFailedCatalogMessage('Task queue unavailable')).toBe(
            'Could not start workflow run — Task queue unavailable.'
        );
    });

    describe('formatExternalStatusBarLabel', () => {
        it('maps external health states to contract labels', () => {
            expect(formatExternalStatusBarLabel('connecting')).toBe(
                '$(pulse) Temporal: connecting…'
            );
            expect(formatExternalStatusBarLabel('connect_failed')).toBe(
                '$(pulse) Temporal: failed'
            );
        });
    });

    describe('formatExternalConnectFailedNotification', () => {
        it('uses auth remediation copy', () => {
            expect(formatExternalConnectFailedNotification('auth', 'host:7233')).toBe(
                'Forge could not connect to Temporal — authentication failed. Run **Forge: Set Temporal API Key** or check `forge.temporal.external.auth.mode`.'
            );
        });

        it('uses address remediation copy', () => {
            expect(formatExternalConnectFailedNotification('address', 'host:7233')).toBe(
                'Forge could not connect to Temporal — host:7233 is unreachable. Check `forge.temporal.external.address` and network access.'
            );
        });
    });

    it('uses external ready notification copy from contract', () => {
        expect(formatExternalReadyNotification('forge-ns', 'host:7233')).toBe(
            'Forge Temporal ready — connected to forge-ns at host:7233.'
        );
    });

    describe('formatWorkerStatusBarSegment', () => {
        it('maps worker health states to contract labels', () => {
            expect(formatWorkerStatusBarSegment('starting')).toBe('Worker: starting…');
            expect(formatWorkerStatusBarSegment('ready')).toBe('Worker: ready');
            expect(formatWorkerStatusBarSegment('start_failed')).toBe('Worker: failed');
        });
    });

    describe('formatManagedLocalStatusBarLabel with worker segment', () => {
        it('combines Temporal and worker segments', () => {
            expect(formatManagedLocalStatusBarLabel('ready', 'ready')).toBe(
                '$(pulse) Temporal: ready · Worker: ready'
            );
        });
    });

    describe('formatWorkerStartFailedNotification', () => {
        it('uses asset remediation copy', () => {
            expect(formatWorkerStartFailedNotification('asset')).toBe(
                'Forge could not start the workflow worker — worker assets are missing from the extension package. Reinstall Forge Studio.'
            );
        });

        it('uses crash remediation copy', () => {
            expect(formatWorkerStartFailedNotification('crash')).toBe(
                'Forge workflow worker stopped unexpectedly. See Forge Temporal output. Workflow runs are blocked until the worker is healthy.'
            );
        });
    });

    it('uses worker blocked notification copy from contract', () => {
        expect(formatWorkerBlockedNotification()).toBe(
            'Workflow runs are blocked until the Forge worker is ready. See Forge Temporal output for details.'
        );
    });

    it('uses worker ready notification copy', () => {
        expect(formatWorkerReadyNotification()).toBe('Forge workflow worker is ready.');
    });

    it('uses worker upgrade restart output copy from contract', () => {
        expect(
            formatWorkerUpgradeRestartLogLine({
                windowId: 'window-1',
                extensionVersion: '3.27.0',
            })
        ).toBe(
            '[forge.temporal.worker] Forge updated the workflow worker for this window. windowId=window-1 extensionVersion=3.27.0'
        );
    });

    describe('formatWorkerStateTransitionLogLine', () => {
        it('includes contract fields and pid when provided', () => {
            expect(
                formatWorkerStateTransitionLogLine('ready', {
                    windowId: 'window-1',
                    taskQueue: 'forge-workflows',
                    namespace: 'forge-local',
                    mode: 'managedLocal',
                    extensionVersion: '3.26.0',
                    pid: 5151,
                })
            ).toBe(
                '[forge.temporal.worker] state=ready windowId=window-1 taskQueue=forge-workflows namespace=forge-local mode=managedLocal extensionVersion=3.26.0 pid=5151'
            );
        });
    });

    describe('run recovery presentation copy', () => {
        it('maps recovery states to run list badge labels and action copy', async () => {
            const {
                formatRecoveryBadgeLabel,
                formatCancelConfirmMessage,
                formatRunActionsBlockedMessage,
                formatHumanInputBlockedMessage,
                formatOrphanedRunMessage,
                formatNeedsInputBadgeLabel,
            } = await import('./temporalPresentation');

            expect(formatRecoveryBadgeLabel('recovery_pending')).toBe('Recovering…');
            expect(formatRecoveryBadgeLabel('refresh_failed')).toBe('Refresh failed');
            expect(formatRecoveryBadgeLabel('orphaned')).toBe('Stale');
            expect(formatRecoveryBadgeLabel('unreachable')).toBe('Waiting for Temporal…');
            expect(formatCancelConfirmMessage('wf-1', 'run-1')).toContain('wf-1/run-1');
            expect(formatRunActionsBlockedMessage()).toContain('Run actions are unavailable');
            expect(formatHumanInputBlockedMessage()).toContain(
                'Submit answers after the run finishes recovering'
            );
            expect(formatOrphanedRunMessage()).toContain('dismiss it from the run list');
            expect(formatNeedsInputBadgeLabel()).toBe('Needs input');
        });
    });
});
