import { describe, expect, it } from 'vitest';
import {
    DEFAULT_RETRY_POLICY_ID,
    DEFAULT_TIMEOUT_POLICY_ID,
    getRetryPolicyDefinition,
    getTimeoutPolicyDefinition,
    isKnownRetryPolicyId,
    isKnownTimeoutPolicyId,
    resolveRetryPolicyId,
    resolveTimeoutPolicyId,
    shouldRetryActivityResponse,
} from './activityPolicyRegistry';

describe('activityPolicyRegistry', () => {
    it('resolves v1 retry policy definitions', () => {
        expect(getRetryPolicyDefinition('none')).toEqual(
            expect.objectContaining({ maximumAttempts: 1 })
        );
        expect(getRetryPolicyDefinition('agent_standard')).toEqual(
            expect.objectContaining({
                maximumAttempts: 3,
                initialIntervalMs: 1_000,
                maximumIntervalMs: 30_000,
            })
        );
        expect(getRetryPolicyDefinition('agent_startup')).toEqual(
            expect.objectContaining({
                maximumAttempts: 5,
                maximumIntervalMs: 10_000,
            })
        );
        expect(getRetryPolicyDefinition('integration_transient')).toEqual(
            expect.objectContaining({
                maximumAttempts: 3,
                initialIntervalMs: 2_000,
                maximumIntervalMs: 60_000,
            })
        );
    });

    it('resolves v1 timeout policy definitions', () => {
        expect(getTimeoutPolicyDefinition('agent_short')).toEqual(
            expect.objectContaining({
                startToCloseMs: 5 * 60 * 1_000,
                scheduleToCloseMs: 10 * 60 * 1_000,
            })
        );
        expect(getTimeoutPolicyDefinition('agent_default')).toEqual(
            expect.objectContaining({
                startToCloseMs: 30 * 60 * 1_000,
                scheduleToCloseMs: 45 * 60 * 1_000,
            })
        );
        expect(getTimeoutPolicyDefinition('agent_long')).toEqual(
            expect.objectContaining({
                startToCloseMs: 2 * 60 * 60 * 1_000,
                scheduleToCloseMs: (2 * 60 + 15) * 60 * 1_000,
            })
        );
    });

    it('applies workflow defaults when node policies are omitted', () => {
        expect(resolveRetryPolicyId({})).toBe(DEFAULT_RETRY_POLICY_ID);
        expect(resolveTimeoutPolicyId({})).toBe(DEFAULT_TIMEOUT_POLICY_ID);
    });

    it('uses explicit node policy references when present', () => {
        expect(resolveRetryPolicyId({ retry_policy: 'none' })).toBe('none');
        expect(resolveTimeoutPolicyId({ timeout_policy: 'agent_long' })).toBe('agent_long');
    });

    it('recognizes catalog policy ids', () => {
        expect(isKnownRetryPolicyId('agent_standard')).toBe(true);
        expect(isKnownRetryPolicyId('unknown')).toBe(false);
        expect(isKnownTimeoutPolicyId('agent_default')).toBe(true);
        expect(isKnownTimeoutPolicyId('unknown')).toBe(false);
    });

    it('never retries cancelled activities', () => {
        expect(shouldRetryActivityResponse('cancelled', false, 'agent_standard')).toBe(false);
        expect(shouldRetryActivityResponse('cancelled', true, 'agent_startup')).toBe(false);
    });

    it('does not retry when retryable=false', () => {
        expect(shouldRetryActivityResponse('startup', false, 'agent_standard')).toBe(false);
        expect(shouldRetryActivityResponse('execution', false, 'agent_standard')).toBe(false);
    });

    it('retries retryable startup failures for agent_standard', () => {
        expect(shouldRetryActivityResponse('startup', true, 'agent_standard')).toBe(true);
    });

    it('does not retry execution failures for agent_startup', () => {
        expect(shouldRetryActivityResponse('execution', true, 'agent_startup')).toBe(false);
    });

    it('retries retryable execution failures for agent_standard', () => {
        expect(shouldRetryActivityResponse('execution', true, 'agent_standard')).toBe(true);
    });

    it('never retries when policy is none', () => {
        expect(shouldRetryActivityResponse('startup', true, 'none')).toBe(false);
    });
});
