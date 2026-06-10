import { describe, expect, it } from 'vitest';
import {
    buildTemporalActivityOptions,
    buildValidationGateActivityOptions,
} from './temporalActivityPolicyOptions';

describe('buildTemporalActivityOptions', () => {
    it('applies agent_default and agent_standard when node policies are omitted', () => {
        const options = buildTemporalActivityOptions({});

        expect(options.startToCloseTimeout).toBe(30 * 60 * 1_000);
        expect(options.scheduleToCloseTimeout).toBe(45 * 60 * 1_000);
        expect(options.retry).toEqual(
            expect.objectContaining({
                maximumAttempts: 3,
                initialInterval: 1_000,
                maximumInterval: 30_000,
                backoffCoefficient: 2,
                nonRetryableErrorTypes: ['cursor_sdk_cancelled'],
            })
        );
    });

    it('applies explicit node policy references', () => {
        const options = buildTemporalActivityOptions({
            retry_policy: 'none',
            timeout_policy: 'agent_short',
        });

        expect(options.startToCloseTimeout).toBe(5 * 60 * 1_000);
        expect(options.scheduleToCloseTimeout).toBe(10 * 60 * 1_000);
        expect(options.retry?.maximumAttempts).toBe(1);
    });

    it('buildValidationGateActivityOptions uses none retry and agent_short timeout', () => {
        const options = buildValidationGateActivityOptions();

        expect(options.startToCloseTimeout).toBe(5 * 60 * 1_000);
        expect(options.retry?.maximumAttempts).toBe(1);
    });
});
