import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { gateWorkflowRunStart, validateWorkflowForRun } from './validateWorkflowForRun';
import { validateWorkflowDefinitionFile } from './validateWorkflowDefinition';

const REFINE_ISSUE_PATH = '.ai/workflows/refine-issue.json';

/** Phase-to-node mapping from `.ai/business_logic/domain_model.md`. */
const EXPECTED_PHASE_NODES: Array<{ node_id: string; type: string }> = [
    { node_id: 'normalize_issue_parentage', type: 'activity' },
    { node_id: 'workspace_prep', type: 'activity' },
    { node_id: 'ground_contracts', type: 'activity' },
    { node_id: 'triage_questions', type: 'activity' },
    { node_id: 'validate_triage_artifacts', type: 'validation' },
    { node_id: 'user_verification_batch', type: 'human_question' },
    { node_id: 'check_user_blockers', type: 'decision' },
    { node_id: 'complete_refinement', type: 'activity' },
    { node_id: 'validate_exit_criteria', type: 'validation' },
    { node_id: 'commit_ai_contracts', type: 'activity' },
    { node_id: 'handoff', type: 'activity' },
    { node_id: 'terminal_complete', type: 'terminal' },
];

const EXPECTED_ARTIFACT_IDS = [
    'issue_context',
    'user_questions',
    'assumptions',
    'refinement',
    'domain_report',
];

function loadRefineIssueDefinition(): Record<string, unknown> {
    const absolutePath = path.join(process.cwd(), REFINE_ISSUE_PATH);
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as Record<string, unknown>;
}

describe('refine-issue workflow definition', () => {
    it('uses workflow_id matching the filename stem', () => {
        const definition = loadRefineIssueDefinition();
        expect(definition.workflow_id).toBe('refine-issue');
    });

    it('maps refine phases to documented node IDs and types', () => {
        const definition = loadRefineIssueDefinition();
        const nodes = definition.nodes as Array<{ node_id: string; type: string }>;

        for (const expected of EXPECTED_PHASE_NODES) {
            const node = nodes.find((candidate) => candidate.node_id === expected.node_id);
            expect(node, `missing node ${expected.node_id}`).toBeDefined();
            expect(node?.type).toBe(expected.type);
        }
    });

    it('declares tmp session artifacts with refine glob paths', () => {
        const definition = loadRefineIssueDefinition();
        const artifacts = definition.artifacts as Array<{ artifact_id: string; path: string }>;

        for (const artifactId of EXPECTED_ARTIFACT_IDS) {
            const artifact = artifacts.find((candidate) => candidate.artifact_id === artifactId);
            expect(artifact, `missing artifact ${artifactId}`).toBeDefined();
            expect(artifact?.path).toMatch(/^\.cursor\/\.tmp\/refine-\*\//);
        }
    });

    it('uses runtime-only validators on validation nodes without failing pre-run', () => {
        const definition = loadRefineIssueDefinition();
        const nodes = definition.nodes as Array<{
            node_id: string;
            type: string;
            validators?: Array<{ validator_id: string }>;
        }>;

        const triageGate = nodes.find((node) => node.node_id === 'validate_triage_artifacts');
        expect(triageGate?.validators?.map((validator) => validator.validator_id)).toEqual([
            'forge.artifact.exists',
            'forge.artifact.exists',
        ]);

        const exitGate = nodes.find((node) => node.node_id === 'validate_exit_criteria');
        expect(exitGate?.validators?.[0]?.validator_id).toBe('local.forge.refine_issue.exit_criteria');

        const result = validateWorkflowForRun({
            workspaceRoots: [process.cwd()],
            workflowId: 'refine-issue',
        });

        expect(result.valid).toBe(true);
        expect(result.diagnostics.filter((diagnostic) => diagnostic.severity === 'error')).toEqual([]);
    });

    it('passes full definition validation and run-start gate', () => {
        const definitionResult = validateWorkflowDefinitionFile(REFINE_ISSUE_PATH, {
            workspaceRoot: process.cwd(),
        });

        expect(definitionResult.valid).toBe(true);
        expect(definitionResult.diagnostics).toEqual([]);

        const gateResult = gateWorkflowRunStart({
            workspaceRoots: [process.cwd()],
            workflowId: 'refine-issue',
        });

        expect(gateResult.valid).toBe(true);
    });
});
