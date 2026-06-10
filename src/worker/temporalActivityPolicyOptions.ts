import type { ActivityOptions } from '@temporalio/common';
import {
    getRetryPolicyDefinition,
    getTimeoutPolicyDefinition,
    resolveRetryPolicyId,
    resolveTimeoutPolicyId,
    type ActivityNodePolicyRefs,
} from '../workflows/activityPolicyRegistry';

export function buildTemporalActivityOptions(policyRefs: ActivityNodePolicyRefs = {}): ActivityOptions {
    const retryPolicyId = resolveRetryPolicyId(policyRefs);
    const timeoutPolicyId = resolveTimeoutPolicyId(policyRefs);
    const retry = getRetryPolicyDefinition(retryPolicyId);
    const timeout = getTimeoutPolicyDefinition(timeoutPolicyId);

    return {
        startToCloseTimeout: timeout.startToCloseMs,
        scheduleToCloseTimeout: timeout.scheduleToCloseMs,
        retry: {
            maximumAttempts: retry.maximumAttempts,
            initialInterval: retry.initialIntervalMs,
            maximumInterval: retry.maximumIntervalMs,
            backoffCoefficient: retry.backoffCoefficient,
            nonRetryableErrorTypes: ['cursor_sdk_cancelled'],
        },
    };
}
