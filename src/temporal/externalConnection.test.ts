import { describe, expect, it } from 'vitest';
import { buildExternalConnectionOptions } from './externalConnection';
import type { ResolvedExternalSettings } from './externalSettings';

function externalSettings(
    overrides: Partial<ResolvedExternalSettings> = {}
): ResolvedExternalSettings {
    return {
        address: 'my-ns.a1b2c.tmprl.cloud:7233',
        namespace: 'my-ns.a1b2c',
        taskQueue: 'forge-workflows',
        authMode: 'apiKey',
        tlsEnabled: true,
        tlsServerName: '',
        ...overrides,
    };
}

describe('externalConnection', () => {
    it('includes apiKey when auth mode is apiKey', () => {
        expect(
            buildExternalConnectionOptions(externalSettings(), 'secret-api-key')
        ).toEqual({
            address: 'my-ns.a1b2c.tmprl.cloud:7233',
            tls: true,
            apiKey: 'secret-api-key',
        });
    });

    it('omits apiKey for tlsServer mode', () => {
        expect(
            buildExternalConnectionOptions(
                externalSettings({ authMode: 'tlsServer' }),
                'secret-api-key'
            )
        ).toEqual({
            address: 'my-ns.a1b2c.tmprl.cloud:7233',
            tls: true,
        });
    });

    it('disables TLS for insecure loopback mode', () => {
        expect(
            buildExternalConnectionOptions(
                externalSettings({
                    authMode: 'insecure',
                    tlsEnabled: false,
                    address: '127.0.0.1:7233',
                }),
                undefined
            )
        ).toEqual({
            address: '127.0.0.1:7233',
            tls: false,
        });
    });

    it('applies TLS server name override when configured', () => {
        expect(
            buildExternalConnectionOptions(
                externalSettings({ tlsServerName: 'temporal.internal' }),
                'secret-api-key'
            )
        ).toEqual({
            address: 'my-ns.a1b2c.tmprl.cloud:7233',
            tls: {
                serverNameOverride: 'temporal.internal',
            },
            apiKey: 'secret-api-key',
        });
    });
});
