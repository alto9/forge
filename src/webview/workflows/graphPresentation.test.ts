import { describe, expect, it } from 'vitest';
import {
    buildGraphWebviewModel,
    formatGraphHeader,
    getRecoveryBannerCopy,
    getStepAccessibleName,
} from './graphPresentation';
import type { WorkflowGraphModel } from '../../workflows/types';

function graphModel(overrides: Partial<WorkflowGraphModel> = {}): WorkflowGraphModel {
    return {
        workflow_id: 'refine-issue',
        workflow_name: 'Refine Issue',
        mode: 'definition',
        nodes: [],
        edges: [],
        step_list: [],
        ...overrides,
    };
}

describe('graphPresentation', () => {
    it('formats definition and run headers from contract copy', () => {
        expect(formatGraphHeader(graphModel())).toBe('Definition — Refine Issue');
        expect(
            formatGraphHeader(
                graphModel({
                    mode: 'run',
                    temporal_ids: {
                        workflowId: 'wf-1',
                        runId: 'run-1',
                        namespace: 'forge-local',
                    },
                })
            )
        ).toBe('Run — Refine Issue (wf-1/run-1)');
    });

    it('maps recovery states to banner copy', () => {
        expect(getRecoveryBannerCopy('synced')).toBeUndefined();
        expect(getRecoveryBannerCopy('recovery_pending')).toBe('Recovering run state…');
        expect(getRecoveryBannerCopy('refresh_failed')).toBe(
            'Could not refresh run state. Try **Forge: Refresh Workflow Graph**.'
        );
        expect(getRecoveryBannerCopy('unreachable')).toBe('Waiting for Temporal…');
    });

    it('builds webview models with header and recovery banner', () => {
        const model = buildGraphWebviewModel(
            graphModel({ mode: 'run', recoveryState: 'recovery_pending' })
        );
        expect(model.header).toBe('Run — Refine Issue');
        expect(model.recoveryBanner).toBe('Recovering run state…');
    });

    it('includes retry counts in step accessible names', () => {
        expect(
            getStepAccessibleName({
                node_id: 'act-1',
                name: 'Implement',
                visual_state: 'retrying',
                status_label: 'Retrying (2/3)',
            })
        ).toBe('Implement, Retrying (2/3)');
    });

    it('distinguishes waiting labels in accessible names', () => {
        expect(
            getStepAccessibleName({
                node_id: 'q-1',
                name: 'Clarify scope',
                visual_state: 'waiting',
                status_label: 'Waiting for input',
            })
        ).toBe('Clarify scope, Waiting for input');
    });
});
