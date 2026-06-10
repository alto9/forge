import { describe, expect, it } from 'vitest';
import { redactInspectorText } from './redactInspectorText';

describe('redactInspectorText', () => {
    it('redacts Authorization headers and bearer tokens', () => {
        expect(redactInspectorText('authorization: Bearer secret-token')).toBe(
            'authorization: [redacted]'
        );
    });

    it('redacts environment variables whose names contain KEY, TOKEN, or SECRET', () => {
        expect(redactInspectorText('CURSOR_API_KEY=super-secret-value')).toBe(
            'CURSOR_API_KEY=[REDACTED]'
        );
        expect(redactInspectorText('export MY_SECRET_TOKEN=abc123')).toBe(
            'export MY_SECRET_TOKEN=[REDACTED]'
        );
    });

    it('redacts API key-like substrings', () => {
        expect(redactInspectorText('failed with sk_test_abcdefghijklmnopqrst')).toBe(
            'failed with [REDACTED]'
        );
    });
});
