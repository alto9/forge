import { describe, expect, it } from 'vitest';
import {
    formatSafeForLog,
    redactAuthorizationMaterial,
    redactKnownSecrets,
} from './secretRedaction';

describe('secretRedaction', () => {
    it('redacts Authorization headers and bearer tokens', () => {
        const input =
            'connect failed authorization: Bearer secret-token and Bearer another-token';
        expect(redactAuthorizationMaterial(input)).toBe(
            'connect failed authorization: [redacted] and Bearer [redacted]'
        );
    });

    it('redacts known secret substrings', () => {
        expect(redactKnownSecrets('key=super-secret-value', ['super-secret-value'])).toBe(
            'key=[redacted]'
        );
    });

    it('formats log lines without leaking secrets', () => {
        const message = 'Authorization: Bearer abc123 failed for abc123';
        expect(formatSafeForLog(message, { knownSecrets: ['abc123'] })).toBe(
            'authorization: [redacted] failed for [redacted]'
        );
    });
});
