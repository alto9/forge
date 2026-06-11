import { afterEach, describe, expect, it } from 'vitest';
import {
    buildWorkflowStartInFlightKey,
    releaseWorkflowStartInFlight,
    resetWorkflowStartInFlightGuardForTests,
    tryAcquireWorkflowStartInFlight,
} from './workflowStartInFlightGuard';

afterEach(() => {
    resetWorkflowStartInFlightGuardForTests();
});

describe('workflowStartInFlightGuard', () => {
    it('builds stable keys for the same workflow and payload', () => {
        const key = buildWorkflowStartInFlightKey('refine-issue', '/repo', {
            issue_ref: '75',
        });

        expect(key).toBe('refine-issue::/repo::issue_ref=75');
    });

    it('blocks duplicate in-flight starts for the same key', () => {
        const key = buildWorkflowStartInFlightKey('refine-issue', '/repo', {});

        expect(tryAcquireWorkflowStartInFlight(key)).toBe(true);
        expect(tryAcquireWorkflowStartInFlight(key)).toBe(false);

        releaseWorkflowStartInFlight(key);
        expect(tryAcquireWorkflowStartInFlight(key)).toBe(true);
    });
});
