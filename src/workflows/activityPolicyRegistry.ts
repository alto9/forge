export type ActivityFailureClass = 'startup' | 'execution' | 'cancelled';

export const DEFAULT_RETRY_POLICY_ID = 'agent_standard';
export const DEFAULT_TIMEOUT_POLICY_ID = 'agent_default';

export const V1_RETRY_POLICY_IDS = [
    'none',
    'agent_standard',
    'agent_startup',
    'integration_transient',
] as const;

export const V1_TIMEOUT_POLICY_IDS = ['agent_short', 'agent_default', 'agent_long'] as const;

export type V1RetryPolicyId = (typeof V1_RETRY_POLICY_IDS)[number];
export type V1TimeoutPolicyId = (typeof V1_TIMEOUT_POLICY_IDS)[number];

export interface ForgeRetryPolicyDefinition {
    policy_id: V1RetryPolicyId;
    maximumAttempts: number;
    initialIntervalMs: number;
    maximumIntervalMs: number;
    backoffCoefficient: number;
    nonRetryableFailureClasses: ActivityFailureClass[];
}

export interface ForgeTimeoutPolicyDefinition {
    policy_id: V1TimeoutPolicyId;
    startToCloseMs: number;
    scheduleToCloseMs: number;
}

const V1_RETRY_POLICIES: Record<V1RetryPolicyId, ForgeRetryPolicyDefinition> = {
    none: {
        policy_id: 'none',
        maximumAttempts: 1,
        initialIntervalMs: 1_000,
        maximumIntervalMs: 1_000,
        backoffCoefficient: 1,
        nonRetryableFailureClasses: ['startup', 'execution', 'cancelled'],
    },
    agent_standard: {
        policy_id: 'agent_standard',
        maximumAttempts: 3,
        initialIntervalMs: 1_000,
        maximumIntervalMs: 30_000,
        backoffCoefficient: 2,
        nonRetryableFailureClasses: ['cancelled'],
    },
    agent_startup: {
        policy_id: 'agent_startup',
        maximumAttempts: 5,
        initialIntervalMs: 1_000,
        maximumIntervalMs: 10_000,
        backoffCoefficient: 2,
        nonRetryableFailureClasses: ['execution', 'cancelled'],
    },
    integration_transient: {
        policy_id: 'integration_transient',
        maximumAttempts: 3,
        initialIntervalMs: 2_000,
        maximumIntervalMs: 60_000,
        backoffCoefficient: 2,
        nonRetryableFailureClasses: ['cancelled'],
    },
};

const V1_TIMEOUT_POLICIES: Record<V1TimeoutPolicyId, ForgeTimeoutPolicyDefinition> = {
    agent_short: {
        policy_id: 'agent_short',
        startToCloseMs: 5 * 60 * 1_000,
        scheduleToCloseMs: 10 * 60 * 1_000,
    },
    agent_default: {
        policy_id: 'agent_default',
        startToCloseMs: 30 * 60 * 1_000,
        scheduleToCloseMs: 45 * 60 * 1_000,
    },
    agent_long: {
        policy_id: 'agent_long',
        startToCloseMs: 2 * 60 * 60 * 1_000,
        scheduleToCloseMs: (2 * 60 + 15) * 60 * 1_000,
    },
};

export interface ActivityNodePolicyRefs {
    retry_policy?: string;
    timeout_policy?: string;
}

export function isKnownRetryPolicyId(policyId: string): policyId is V1RetryPolicyId {
    return (V1_RETRY_POLICY_IDS as readonly string[]).includes(policyId);
}

export function isKnownTimeoutPolicyId(policyId: string): policyId is V1TimeoutPolicyId {
    return (V1_TIMEOUT_POLICY_IDS as readonly string[]).includes(policyId);
}

export function resolveRetryPolicyId(node: ActivityNodePolicyRefs): V1RetryPolicyId {
    const policyId = node.retry_policy?.trim();
    if (policyId && isKnownRetryPolicyId(policyId)) {
        return policyId;
    }
    return DEFAULT_RETRY_POLICY_ID;
}

export function resolveTimeoutPolicyId(node: ActivityNodePolicyRefs): V1TimeoutPolicyId {
    const policyId = node.timeout_policy?.trim();
    if (policyId && isKnownTimeoutPolicyId(policyId)) {
        return policyId;
    }
    return DEFAULT_TIMEOUT_POLICY_ID;
}

export function getRetryPolicyDefinition(policyId: V1RetryPolicyId): ForgeRetryPolicyDefinition {
    return V1_RETRY_POLICIES[policyId];
}

export function getTimeoutPolicyDefinition(policyId: V1TimeoutPolicyId): ForgeTimeoutPolicyDefinition {
    return V1_TIMEOUT_POLICIES[policyId];
}

export function lookupRetryPolicyDefinition(policyId: string): ForgeRetryPolicyDefinition | undefined {
    return isKnownRetryPolicyId(policyId) ? V1_RETRY_POLICIES[policyId] : undefined;
}

export function lookupTimeoutPolicyDefinition(policyId: string): ForgeTimeoutPolicyDefinition | undefined {
    return isKnownTimeoutPolicyId(policyId) ? V1_TIMEOUT_POLICIES[policyId] : undefined;
}

export function shouldRetryActivityResponse(
    failureClass: ActivityFailureClass | undefined,
    retryable: boolean,
    retryPolicyId: V1RetryPolicyId
): boolean {
    if (retryPolicyId === 'none') {
        return false;
    }

    if (failureClass === 'cancelled' || !retryable) {
        return false;
    }

    const policy = getRetryPolicyDefinition(retryPolicyId);
    if (failureClass && policy.nonRetryableFailureClasses.includes(failureClass)) {
        return false;
    }

    return true;
}
