import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import type { WorkflowRunProjection } from '../temporal/workflowRunProjection';
import {
    buildDefinitionGraph,
    buildWorkflowGraphModel,
    overlayRunProjection,
} from './buildWorkflowGraphModel';
import type { WorkflowDefinition } from './types';

const fixturePath = path.join(__dirname, '__fixtures__', 'graph-test-workflow.json');

function loadGraphTestDefinition(): WorkflowDefinition {
    return JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as WorkflowDefinition;
}

function baseProjection(overrides: Partial<WorkflowRunProjection> = {}): WorkflowRunProjection {
    return {
        namespace: 'forge-local',
        workflowId: 'graph-test-run',
        runId: 'run-1',
        taskQueue: 'forge-workflows',
        workflow_id: 'graph-test',
        repositoryRoot: '/tmp/repo',
        mode: 'managedLocal',
        recoveryState: 'synced',
        lastSyncedAt: '2026-06-10T12:00:00.000Z',
        terminal: false,
        temporalStatus: 'RUNNING',
        completedNodeIds: [],
        skippedNodeIds: [],
        cancelled: false,
        validationSummaries: [],
        pendingHumanQuestions: [],
        ...overrides,
    };
}

describe('buildWorkflowGraphModel', () => {
    const definition = loadGraphTestDefinition();

    it('builds a definition-only graph with pending nodes and idle edges', () => {
        const model = buildWorkflowGraphModel(definition);

        expect(model.mode).toBe('definition');
        expect(model.workflow_id).toBe('graph-test');
        expect(model.workflow_name).toBe('Graph Test Workflow');
        expect(model.nodes.every((node) => node.visual_state === 'pending')).toBe(true);
        expect(model.nodes.every((node) => node.status_label === 'Pending')).toBe(true);
        expect(model.edges.every((edge) => edge.visual_state === 'idle')).toBe(true);
        expect(model.step_list).toHaveLength(definition.nodes.length);
        expect(model.run_summary).toBeUndefined();
        expect(model.recoveryState).toBeUndefined();
    });

    it('derives edges from transitions with stable edge_id values', () => {
        const model = buildDefinitionGraph(definition);

        expect(model.edges).toContainEqual({
            edge_id: 'decide->branch_a',
            from_node_id: 'decide',
            to_node_id: 'branch_a',
            visual_state: 'idle',
            condition: 'path_a',
        });
        expect(model.edges).toContainEqual({
            edge_id: 'decide->branch_b',
            from_node_id: 'decide',
            to_node_id: 'branch_b',
            visual_state: 'idle',
            condition: 'path_b',
        });
    });

    it('orders step_list top-to-bottom with node_id tie-break', () => {
        const first = buildDefinitionGraph(definition);
        const second = buildDefinitionGraph(definition);

        expect(first.step_list.map((entry) => entry.node_id)).toEqual(
            second.step_list.map((entry) => entry.node_id)
        );

        for (let index = 1; index < first.step_list.length; index += 1) {
            const previousNode = first.nodes.find((node) => node.node_id === first.step_list[index - 1].node_id);
            const currentNode = first.nodes.find((node) => node.node_id === first.step_list[index].node_id);
            expect(previousNode).toBeDefined();
            expect(currentNode).toBeDefined();
            expect(previousNode!.position.y).toBeLessThanOrEqual(currentNode!.position.y);
        }
    });

    it('overlays an active node in run mode', () => {
        const model = buildWorkflowGraphModel(
            definition,
            baseProjection({
                completedNodeIds: ['start', 'decide', 'branch_a'],
                activeNodeId: 'validate',
            })
        );

        const validateNode = model.nodes.find((node) => node.node_id === 'validate');
        expect(model.mode).toBe('run');
        expect(validateNode?.visual_state).toBe('active');
        expect(validateNode?.status_label).toBe('Active');
        expect(model.edges.find((edge) => edge.edge_id === 'branch_a->validate')?.visual_state).toBe('active');
        expect(model.run_summary).toBe('Active step: Validate');
        expect(model.temporal_ids).toEqual({
            workflowId: 'graph-test-run',
            runId: 'run-1',
            namespace: 'forge-local',
        });
    });

    it('marks completed nodes and traversed edges', () => {
        const model = buildWorkflowGraphModel(
            definition,
            baseProjection({
                completedNodeIds: ['start', 'decide', 'branch_a', 'validate'],
                activeNodeId: 'question',
            })
        );

        expect(model.nodes.find((node) => node.node_id === 'start')?.visual_state).toBe('completed');
        expect(model.nodes.find((node) => node.node_id === 'validate')?.visual_state).toBe('completed');
        expect(model.edges.find((edge) => edge.edge_id === 'start->decide')?.visual_state).toBe('traversed');
        expect(model.edges.find((edge) => edge.edge_id === 'validate->question')?.visual_state).toBe('active');
    });

    it('marks a failed validation node', () => {
        const model = buildWorkflowGraphModel(
            definition,
            baseProjection({
                completedNodeIds: ['start', 'decide', 'branch_a'],
                failedNodeId: 'validate',
                activeNodeId: 'validate',
                temporalStatus: 'FAILED',
                terminal: true,
            })
        );

        const validateNode = model.nodes.find((node) => node.node_id === 'validate');
        expect(validateNode?.visual_state).toBe('failed');
        expect(validateNode?.status_label).toBe('Failed');
        expect(model.run_summary).toBe('Failed at Validate');
    });

    it('marks retrying activity copy with attempt and max', () => {
        const model = buildWorkflowGraphModel(
            definition,
            baseProjection({
                completedNodeIds: ['start', 'decide', 'branch_a', 'validate', 'question'],
                activeNodeId: 'retry_activity',
                retrying: { node_id: 'retry_activity', attempt: 2, max: 5 },
            })
        );

        const retryNode = model.nodes.find((node) => node.node_id === 'retry_activity');
        expect(retryNode?.visual_state).toBe('retrying');
        expect(retryNode?.status_label).toBe('Retrying (2/5)');
        expect(retryNode?.retry_attempt).toBe(2);
        expect(retryNode?.retry_max).toBe(5);
        expect(model.run_summary).toBe('Retrying Retryable activity');
    });

    it('marks skipped branch nodes and untaken decision edges', () => {
        const model = buildWorkflowGraphModel(
            definition,
            baseProjection({
                completedNodeIds: ['start', 'decide', 'branch_a', 'validate'],
                skippedNodeIds: ['branch_b'],
                activeNodeId: 'question',
            })
        );

        expect(model.nodes.find((node) => node.node_id === 'branch_b')?.visual_state).toBe('skipped');
        expect(model.edges.find((edge) => edge.edge_id === 'decide->branch_b')?.visual_state).toBe('untaken');
        expect(model.edges.find((edge) => edge.edge_id === 'decide->branch_a')?.visual_state).toBe('traversed');
    });

    it('marks a cancelled active node', () => {
        const model = buildWorkflowGraphModel(
            definition,
            baseProjection({
                completedNodeIds: ['start', 'decide', 'branch_a'],
                activeNodeId: 'validate',
                cancelled: true,
                temporalStatus: 'CANCELLED',
            })
        );

        expect(model.nodes.find((node) => node.node_id === 'validate')?.visual_state).toBe('cancelled');
        expect(model.nodes.find((node) => node.node_id === 'validate')?.status_label).toBe('Cancelled');
        expect(model.run_summary).toBe('Run cancelled');
    });

    it('marks waiting human_question nodes with accessible copy and detail', () => {
        const model = buildWorkflowGraphModel(
            definition,
            baseProjection({
                completedNodeIds: ['start', 'decide', 'branch_a', 'validate'],
                waitingNodeId: 'question',
                activeNodeId: 'question',
            })
        );

        const questionNode = model.nodes.find((node) => node.node_id === 'question');
        expect(questionNode?.visual_state).toBe('waiting');
        expect(questionNode?.status_label).toBe('Waiting for input');
        expect(questionNode?.detail).toBe('confirm_ready');
    });

    it('builds run overlay when recoveryState is not synced', () => {
        const definitionGraph = buildDefinitionGraph(definition);
        const model = overlayRunProjection(
            definitionGraph,
            definition,
            baseProjection({
                recoveryState: 'refresh_failed',
                completedNodeIds: ['start'],
                activeNodeId: 'decide',
            })
        );

        expect(model.recoveryState).toBe('refresh_failed');
        expect(model.mode).toBe('run');
        expect(model.nodes.find((node) => node.node_id === 'decide')?.visual_state).toBe('active');
    });
});
