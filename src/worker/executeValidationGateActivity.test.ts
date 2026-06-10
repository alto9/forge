import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { resetJsonSchemaValidatorCacheForTests } from '../validation/jsonSchemaValidation';
import { ARTIFACT_EXISTS_VALIDATOR_ID } from '../validation/validators';
import type { WorkflowArtifactDefinition } from '../validation';
import {
    executeValidationGateActivity,
    VALIDATION_GATE_ACTIVITY_ID,
} from './executeValidationGateActivity';
import { buildValidationGateActivityOptions } from './temporalActivityPolicyOptions';

const tempDirs: string[] = [];

const refineIssueArtifacts: WorkflowArtifactDefinition[] = [
    {
        artifact_id: 'user_questions',
        path: '.cursor/.tmp/refine-*/user_questions.md',
    },
    {
        artifact_id: 'assumptions',
        path: '.cursor/.tmp/refine-*/assumptions.md',
    },
];

function createTempWorkspace(): string {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-validation-gate-'));
    tempDirs.push(workspaceRoot);
    return workspaceRoot;
}

afterEach(() => {
    resetJsonSchemaValidatorCacheForTests();
    for (const tempDir of tempDirs.splice(0)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

describe('executeValidationGateActivity', () => {
    it('exposes the forge.validation.executeGate activity id', () => {
        expect(VALIDATION_GATE_ACTIVITY_ID).toBe('forge.validation.executeGate');
    });

    it('returns a schema-valid aggregate when triage artifacts exist', async () => {
        const workspaceRoot = createTempWorkspace();
        const sessionDir = path.join(workspaceRoot, '.cursor', '.tmp', 'refine-forge-51');
        fs.mkdirSync(sessionDir, { recursive: true });
        fs.writeFileSync(path.join(sessionDir, 'user_questions.md'), '# Questions');
        fs.writeFileSync(path.join(sessionDir, 'assumptions.md'), '# Assumptions');

        const result = await executeValidationGateActivity({
            nodeId: 'validate_triage_artifacts',
            workflowRunId: 'run-51',
            workspaceRoot,
            sourceActivityNodeId: 'triage_questions',
            validators: [
                {
                    validator_id: ARTIFACT_EXISTS_VALIDATOR_ID,
                    type: 'artifact',
                    target: 'user_questions',
                },
                {
                    validator_id: ARTIFACT_EXISTS_VALIDATOR_ID,
                    type: 'artifact',
                    target: 'assumptions',
                },
            ],
            workflowArtifacts: refineIssueArtifacts,
        });

        expect(result.valid).toBe(true);
        expect(result.node_id).toBe('validate_triage_artifacts');
        expect(result.source_activity_node_id).toBe('triage_questions');
        expect(result.validator_outcomes).toHaveLength(2);
    });

    it('returns valid=false without throwing when artifacts are missing', async () => {
        const workspaceRoot = createTempWorkspace();

        const result = await executeValidationGateActivity({
            nodeId: 'validate_triage_artifacts',
            workflowRunId: 'run-51',
            workspaceRoot,
            validators: [
                {
                    validator_id: ARTIFACT_EXISTS_VALIDATOR_ID,
                    type: 'artifact',
                    target: 'user_questions',
                },
            ],
            workflowArtifacts: refineIssueArtifacts,
        });

        expect(result.valid).toBe(false);
        expect(result.diagnostics).toHaveLength(1);
        expect(result.diagnostics[0]?.validator_id).toBe(ARTIFACT_EXISTS_VALIDATOR_ID);
    });

    it('evaluates refine-issue exit criteria when context is supplied', async () => {
        const workspaceRoot = createTempWorkspace();

        const passResult = await executeValidationGateActivity({
            nodeId: 'validate_exit_criteria',
            workflowRunId: 'run-51',
            workspaceRoot,
            validators: [
                {
                    validator_id: 'local.forge.refine_issue.exit_criteria',
                    type: 'domain',
                },
            ],
            refineIssueExitContext: {
                issueBodyValid: true,
                blockersResolved: true,
                openDecisionsResolved: true,
                aiChangesCommitted: true,
            },
        });

        expect(passResult.valid).toBe(true);

        const failResult = await executeValidationGateActivity({
            nodeId: 'validate_exit_criteria',
            workflowRunId: 'run-51',
            workspaceRoot,
            validators: [
                {
                    validator_id: 'local.forge.refine_issue.exit_criteria',
                    type: 'domain',
                },
            ],
            refineIssueExitContext: {
                issueBodyValid: true,
                blockersResolved: false,
                openDecisionsResolved: true,
                aiChangesCommitted: true,
            },
        });

        expect(failResult.valid).toBe(false);
        expect(failResult.diagnostics.some((diagnostic) => diagnostic.path === 'blockersResolved')).toBe(
            true
        );
    });
});

describe('buildValidationGateActivityOptions', () => {
    it('uses retry_policy none so validation failures do not consume retry budget', () => {
        const options = buildValidationGateActivityOptions();

        expect(options.startToCloseTimeout).toBe(5 * 60 * 1_000);
        expect(options.scheduleToCloseTimeout).toBe(10 * 60 * 1_000);
        expect(options.retry?.maximumAttempts).toBe(1);
    });
});
