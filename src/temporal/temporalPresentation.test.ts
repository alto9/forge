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
});
