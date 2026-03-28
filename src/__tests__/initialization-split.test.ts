import { describe, it, expect } from 'vitest';
import { isCursorAppName, shouldRunAutoProjectSync } from '../extension';
import {
    getStaleManagedPaths,
    shouldSyncManagedFiles,
    shouldRequestUserConfirmation,
    type ForgeManifest,
    type ManagedFileRecord
} from '../commands/InstallGlobalCommand';

const packageJson = require('../../package.json');

function createManifest(
    forgeVersion: string,
    managedFiles: ManagedFileRecord[],
    manifestVersion = 2
): ForgeManifest {
    return {
        manifestVersion,
        forgeVersion,
        updatedAt: '2026-01-01T00:00:00.000Z',
        managedFiles
    };
}

describe('initialization command split', () => {
    it('activates on startup finished', () => {
        const activationEvents: string[] = packageJson.activationEvents || [];
        expect(activationEvents).toContain('onStartupFinished');
    });

    it('contributes renamed initialize cursor agents command', () => {
        const command = packageJson.contributes.commands.find(
            (entry: { command: string; title: string }) => entry.command === 'forge.initializeAgents'
        );

        expect(command).toBeDefined();
        expect(command.title).toBe('Forge: Initialize Cursor Agents');
    });

    it('contributes initialize project command', () => {
        const command = packageJson.contributes.commands.find(
            (entry: { command: string; title: string }) => entry.command === 'forge.initializeProject'
        );

        expect(command).toBeDefined();
        expect(command.title).toBe('Forge: Initialize Project');
    });

    it('contributes auto project sync setting defaulted on', () => {
        const setting =
            packageJson.contributes?.configuration?.properties?.['forge.autoProjectSync.enabled'];
        expect(setting).toBeDefined();
        expect(setting.type).toBe('boolean');
        expect(setting.default).toBe(true);
    });
});

describe('cursor-only startup gating', () => {
    it('detects Cursor app name', () => {
        expect(isCursorAppName('Cursor')).toBe(true);
        expect(isCursorAppName('cursor nightly')).toBe(true);
    });

    it('does not detect VS Code app name as Cursor', () => {
        expect(isCursorAppName('Visual Studio Code')).toBe(false);
        expect(isCursorAppName('Code - OSS')).toBe(false);
    });
});

describe('managed file version checks', () => {
    const desiredFiles: ManagedFileRecord[] = [
        { path: 'agents/a.md', sha256: 'hash-a' },
        { path: 'commands/b.md', sha256: 'hash-b' }
    ];

    it('requires sync when no manifest exists', () => {
        expect(shouldSyncManagedFiles(null, '3.11.4', desiredFiles, desiredFiles)).toBe(true);
    });

    it('requires sync when Forge version differs', () => {
        const manifest = createManifest('3.10.0', desiredFiles);
        expect(shouldSyncManagedFiles(manifest, '3.11.4', desiredFiles, desiredFiles)).toBe(true);
    });

    it('requires sync when destination content differs from desired hashes', () => {
        const manifest = createManifest('3.11.4', desiredFiles);
        const currentFiles: ManagedFileRecord[] = [
            { path: 'agents/a.md', sha256: 'hash-a' },
            { path: 'commands/b.md', sha256: 'different-hash' }
        ];

        expect(shouldSyncManagedFiles(manifest, '3.11.4', desiredFiles, currentFiles)).toBe(true);
    });

    it('skips sync when manifest, version, and hashes all match', () => {
        const manifest = createManifest('3.11.4', desiredFiles);
        expect(shouldSyncManagedFiles(manifest, '3.11.4', desiredFiles, desiredFiles)).toBe(false);
    });
});

describe('managed file stale-path cleanup', () => {
    it('returns stale files when manifest includes removed managed files', () => {
        const manifest = createManifest('3.11.4', [
            { path: 'skills/fetch-url/SKILL.md', sha256: 'old-a' },
            { path: 'commands/build-from-github.md', sha256: 'old-b' }
        ]);
        const desiredFiles: ManagedFileRecord[] = [
            { path: 'commands/build-from-github.md', sha256: 'new-b' }
        ];

        expect(getStaleManagedPaths(manifest, desiredFiles)).toEqual(['skills/fetch-url/SKILL.md']);
    });

    it('never returns unmanaged stale paths from manifest', () => {
        const manifest = createManifest('3.11.4', [
            { path: '../outside.txt', sha256: 'x' },
            { path: 'hooks.json', sha256: 'h' }
        ]);
        const desiredFiles: ManagedFileRecord[] = [{ path: 'hooks.json', sha256: 'h2' }];

        expect(getStaleManagedPaths(manifest, desiredFiles)).toEqual([]);
    });
});

describe('startup confirmation behavior', () => {
    it('requires confirmation only when update is needed and confirmation is enabled', () => {
        expect(shouldRequestUserConfirmation(true, true)).toBe(true);
        expect(shouldRequestUserConfirmation(false, true)).toBe(false);
        expect(shouldRequestUserConfirmation(true, false)).toBe(false);
        expect(shouldRequestUserConfirmation(true, undefined)).toBe(false);
    });
});

describe('automated project sync throttling', () => {
    it('runs when no previous sync timestamp exists', () => {
        expect(shouldRunAutoProjectSync(undefined, 1_000)).toBe(true);
    });

    it('skips when minimum interval has not elapsed', () => {
        const oneHour = 60 * 60 * 1000;
        expect(shouldRunAutoProjectSync(10_000, 10_000 + oneHour - 1, oneHour)).toBe(false);
    });

    it('runs when minimum interval has elapsed', () => {
        const oneHour = 60 * 60 * 1000;
        expect(shouldRunAutoProjectSync(10_000, 10_000 + oneHour, oneHour)).toBe(true);
    });

});
