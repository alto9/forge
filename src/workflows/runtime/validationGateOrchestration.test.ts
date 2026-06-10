import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { resetJsonSchemaValidatorCacheForTests } from '../../validation/jsonSchemaValidation';
import type { WorkflowArtifactDefinition } from '../../validation';
import { executeValidationGateActivity } from '../../worker/executeValidationGateActivity';
import {
    REFINE_ISSUE_VALIDATION_NODE_IDS,
    buildRefineIssueValidationGateInput,
    findValidationNode,
    resolveValidationTransition,
    shouldAdvanceAfterValidation,
} from './validationGateOrchestration';

const REFINE_ISSUE_PATH = '.ai/workflows/refine-issue.json';
const tempDirs: string[] = [];

function createTempWorkspace(): string {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-refine-validation-gate-'));
    tempDirs.push(workspaceRoot);
    return workspaceRoot;
}

function loadRefineIssueDefinition(): {
    artifacts: WorkflowArtifactDefinition[];
    nodes: Array<{ node_id: string; type: string; name: string; validators?: Array<{ validator_id: string; type: string; target?: string }> }>;
} {
    const absolutePath = path.join(process.cwd(), REFINE_ISSUE_PATH);
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as {
        artifacts: WorkflowArtifactDefinition[];
        nodes: Array<{
            node_id: string;
            type: string;
            name: string;
            validators?: Array<{ validator_id: string; type: string; target?: string }>;
        }>;
    };
}

afterEach(() => {
    resetJsonSchemaValidatorCacheForTests();
    for (const tempDir of tempDirs.splice(0)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

describe('validation gate orchestration', () => {
    it('blocks transitions when validation fails and advances when valid', () => {
        const node = {
            node_id: 'validate_triage_artifacts',
            type: 'validation' as const,
            name: 'Validate triage artifacts',
            validators: [],
            transitions: [{ to_node_id: 'user_verification_batch' }],
        };

        const blocked = resolveValidationTransition(node, {
            valid: false,
            node_id: node.node_id,
            workflow_run_id: 'run-1',
            validated_at: '2026-06-10T12:00:00.000Z',
            diagnostics: [],
            validator_outcomes: [],
        });

        expect(blocked.advance).toBe(false);
        expect(blocked.validationFailed).toBe(true);
        expect(blocked.failedNodeId).toBe('validate_triage_artifacts');
        expect(blocked.nextNodeId).toBeUndefined();

        const advanced = resolveValidationTransition(node, {
            valid: true,
            node_id: node.node_id,
            workflow_run_id: 'run-1',
            validated_at: '2026-06-10T12:00:00.000Z',
            diagnostics: [],
            validator_outcomes: [],
        });

        expect(advanced.advance).toBe(true);
        expect(advanced.validationFailed).toBe(false);
        expect(advanced.nextNodeId).toBe('user_verification_batch');
        expect(
            shouldAdvanceAfterValidation({
                valid: true,
                node_id: node.node_id,
                workflow_run_id: 'run-1',
                validated_at: '2026-06-10T12:00:00.000Z',
                diagnostics: [],
                validator_outcomes: [],
            })
        ).toBe(true);
    });
});

describe('refine-issue validation gate integration', () => {
    it('wires validate_triage_artifacts and blocks when user_questions is missing', async () => {
        const definition = loadRefineIssueDefinition();
        const node = findValidationNode(definition.nodes, REFINE_ISSUE_VALIDATION_NODE_IDS.triageArtifacts);
        expect(node).toBeDefined();

        const workspaceRoot = createTempWorkspace();
        const sessionDir = path.join(workspaceRoot, '.cursor', '.tmp', 'refine-forge-51');
        fs.mkdirSync(sessionDir, { recursive: true });
        fs.writeFileSync(path.join(sessionDir, 'assumptions.md'), '# Assumptions');

        const gateInput = buildRefineIssueValidationGateInput({
            node: node!,
            workflowRunId: 'run-51',
            workspaceRoot,
            workflowArtifacts: definition.artifacts,
            sourceActivityNodeId: 'triage_questions',
        });

        const result = await executeValidationGateActivity(gateInput);
        const transition = resolveValidationTransition(node!, result);

        expect(result.valid).toBe(false);
        expect(transition.validationFailed).toBe(true);
        expect(transition.advance).toBe(false);
    });

    it('wires validate_triage_artifacts and advances when artifacts exist', async () => {
        const definition = loadRefineIssueDefinition();
        const node = findValidationNode(definition.nodes, REFINE_ISSUE_VALIDATION_NODE_IDS.triageArtifacts);
        expect(node).toBeDefined();

        const workspaceRoot = createTempWorkspace();
        const sessionDir = path.join(workspaceRoot, '.cursor', '.tmp', 'refine-forge-51');
        fs.mkdirSync(sessionDir, { recursive: true });
        fs.writeFileSync(path.join(sessionDir, 'user_questions.md'), '# Questions');
        fs.writeFileSync(path.join(sessionDir, 'assumptions.md'), '# Assumptions');

        const result = await executeValidationGateActivity(
            buildRefineIssueValidationGateInput({
                node: node!,
                workflowRunId: 'run-51',
                workspaceRoot,
                workflowArtifacts: definition.artifacts,
                sourceActivityNodeId: 'triage_questions',
            })
        );
        const transition = resolveValidationTransition(node!, result);

        expect(result.valid).toBe(true);
        expect(transition.advance).toBe(true);
        expect(transition.nextNodeId).toBe('user_verification_batch');
    });

    it('wires validate_exit_criteria and blocks when blockers remain', async () => {
        const definition = loadRefineIssueDefinition();
        const node = findValidationNode(definition.nodes, REFINE_ISSUE_VALIDATION_NODE_IDS.exitCriteria);
        expect(node).toBeDefined();

        const result = await executeValidationGateActivity(
            buildRefineIssueValidationGateInput({
                node: node!,
                workflowRunId: 'run-51',
                workspaceRoot: createTempWorkspace(),
                workflowArtifacts: definition.artifacts,
                refineIssueExitContext: {
                    issueBodyValid: true,
                    blockersResolved: false,
                    openDecisionsResolved: true,
                    aiChangesCommitted: true,
                },
            })
        );
        const transition = resolveValidationTransition(node!, result);

        expect(result.valid).toBe(false);
        expect(transition.validationFailed).toBe(true);
        expect(transition.nextNodeId).toBeUndefined();
    });

    it('wires validate_exit_criteria and advances when exit criteria are met', async () => {
        const definition = loadRefineIssueDefinition();
        const node = findValidationNode(definition.nodes, REFINE_ISSUE_VALIDATION_NODE_IDS.exitCriteria);
        expect(node).toBeDefined();

        const result = await executeValidationGateActivity(
            buildRefineIssueValidationGateInput({
                node: node!,
                workflowRunId: 'run-51',
                workspaceRoot: createTempWorkspace(),
                workflowArtifacts: definition.artifacts,
                refineIssueExitContext: {
                    issueBodyValid: true,
                    blockersResolved: true,
                    openDecisionsResolved: true,
                    aiChangesCommitted: true,
                },
            })
        );
        const transition = resolveValidationTransition(node!, result);

        expect(result.valid).toBe(true);
        expect(transition.advance).toBe(true);
        expect(transition.nextNodeId).toBe('commit_ai_contracts');
    });
});
