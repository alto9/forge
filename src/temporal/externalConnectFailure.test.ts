import { describe, expect, it } from 'vitest';
import { classifyExternalConnectFailure } from './externalConnectFailure';

describe('classifyExternalConnectFailure', () => {
    it('classifies authentication failures', () => {
        expect(
            classifyExternalConnectFailure(new Error('UNAUTHENTICATED: invalid api key')).remediation
        ).toBe('auth');
    });

    it('classifies TLS failures', () => {
        expect(
            classifyExternalConnectFailure(new Error('TLS handshake failed: certificate verify failed'))
                .remediation
        ).toBe('tls');
    });

    it('classifies address failures', () => {
        const error = new Error('connect ECONNREFUSED 127.0.0.1:7233') as NodeJS.ErrnoException;
        error.code = 'ECONNREFUSED';
        expect(classifyExternalConnectFailure(error).remediation).toBe('address');
    });

    it('falls back to config remediation', () => {
        expect(classifyExternalConnectFailure(new Error('unexpected failure')).remediation).toBe(
            'config'
        );
    });
});
