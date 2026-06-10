import { ApplicationFailure } from '@temporalio/common';
import {
    resolveRetryPolicyId,
    shouldRetryActivityResponse,
    type ActivityNodePolicyRefs,
} from '../workflows/activityPolicyRegistry';
import type { CursorSdkResponseEnvelope } from './activityEnvelope';

function failureMessage(response: CursorSdkResponseEnvelope): string {
    const diagnostic = response.diagnostics?.[0];
    if (diagnostic?.message) {
        return diagnostic.message;
    }

    if (response.failure_class === 'cancelled') {
        return 'Cursor SDK activity was cancelled.';
    }

    return `Cursor SDK activity ${response.activity_id} failed with status ${response.status}.`;
}

function failureType(response: CursorSdkResponseEnvelope): string {
    if (response.failure_class) {
        return `cursor_sdk_${response.failure_class}`;
    }

    return 'cursor_sdk_error';
}

export function mapEnvelopeToActivityFailure(
    response: CursorSdkResponseEnvelope,
    policyRefs: ActivityNodePolicyRefs = {}
): ApplicationFailure | undefined {
    if (response.status === 'finished') {
        return undefined;
    }

    const retryPolicyId = resolveRetryPolicyId(policyRefs);
    const message = failureMessage(response);
    const type = failureType(response);
    const shouldRetry = shouldRetryActivityResponse(
        response.failure_class,
        response.retryable,
        retryPolicyId
    );

    if (shouldRetry) {
        return ApplicationFailure.retryable(message, type, response);
    }

    return ApplicationFailure.nonRetryable(message, type, response);
}
