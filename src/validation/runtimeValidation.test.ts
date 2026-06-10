import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { CursorSdkResponseEnvelope } from '../worker/activityEnvelope';
import { resetActivityEnvelopeValidatorCacheForTests } from '../worker/validateActivityEnvelope';
import { resetJsonSchemaValidatorCacheForTests } from './jsonSchemaValidation';
import {
    assembleRuntimeValidationResult,
    executeRegisteredValidator,
    getValidatorExecutor,
    isRuntimeCatalogValidatorId,
    RUNTIME_CATALOG_VALIDATOR_IDS,
} from './validatorRegistry';
import { validateRuntimeValidationResultSchema } from './jsonSchemaValidation';
import {
    ARTIFACT_EXISTS_VALIDATOR_ID,
    ARTIFACT_INTEGRITY_VALIDATOR_ID,
    executeArtifactExistsValidator,
    executeArtifactIntegrityValidator,
    executeDomainExitCriteriaValidator,
    executeEnvelopeSchemaValidator,
    executeRefineIssueExitCriteriaValidator,
} from './validators';
import type { ValidatorExecutorContext, WorkflowArtifactDefinition } from './types';

const tempDirs: string[] = [];

function createTempWorkspace(): string {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-runtime-validation-'));
    tempDirs.push(workspaceRoot);
    return workspaceRoot;
}

function baseEnvelope(overrides: Partial<CursorSdkResponseEnvelope> = {}): CursorSdkResponseEnvelope {
    return {
        envelope_version: '1.0.0',
        activity_id: 'act-1',
        node_id: 'node-1',
        workflow_run_id: 'run-1',
        cursor_agent_id: 'agent-1',
        cursor_run_id: 'run-sdk-1',
        output_type: 'json',
        status: 'finished',
        retryable: false,
        ...overrides,
    };
}

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

afterEach(() => {
    for (const tempDir of tempDirs.splice(0)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

describe('runtime validation registry', () => {
    beforeEach(() => {
        resetActivityEnvelopeValidatorCacheForTests();
        resetJsonSchemaValidatorCacheForTests();
    });

    it('registers all v1 runtime catalog validator ids', () => {
        expect(RUNTIME_CATALOG_VALIDATOR_IDS).toEqual([
            'forge.envelope.schema',
            'forge.envelope.unsupported_version',
            'forge.envelope.size',
            'forge.artifact.exists',
            'forge.artifact.integrity',
            'forge.artifact.schema',
            'forge.domain.exit_criteria',
            'local.forge.refine_issue.exit_criteria',
        ]);

        for (const validatorId of RUNTIME_CATALOG_VALIDATOR_IDS) {
            expect(isRuntimeCatalogValidatorId(validatorId)).toBe(true);
            expect(getValidatorExecutor(validatorId)).toBeTypeOf('function');
        }
    });

    it('passes envelope schema validation for a valid envelope', () => {
        const result = executeEnvelopeSchemaValidator(
            { validator_id: 'forge.envelope.schema', type: 'schema' },
            {
                workspaceRoot: createTempWorkspace(),
                workflowRunId: 'run-1',
                nodeId: 'validate-node',
                envelope: baseEnvelope({ structured_payload: { ok: true } }),
            }
        );

        expect(result.passed).toBe(true);
        expect(result.diagnostics).toEqual([]);
    });

    it('fails envelope schema validation for unsupported envelope versions', () => {
        const result = executeRegisteredValidator(
            { validator_id: 'forge.envelope.unsupported_version', type: 'domain' },
            {
                workspaceRoot: createTempWorkspace(),
                workflowRunId: 'run-1',
                nodeId: 'validate-node',
                envelope: baseEnvelope({ envelope_version: '2.0.0' }),
            }
        );

        expect(result.passed).toBe(false);
        expect(result.diagnostics?.[0]?.validator_id).toBe('forge.envelope.unsupported_version');
    });

    it('passes artifact exists validation when refine glob artifacts are present', () => {
        const workspaceRoot = createTempWorkspace();
        const sessionDir = path.join(workspaceRoot, '.cursor', '.tmp', 'refine-forge-50');
        fs.mkdirSync(sessionDir, { recursive: true });
        fs.writeFileSync(path.join(sessionDir, 'user_questions.md'), '# Questions');

        const context: ValidatorExecutorContext = {
            workspaceRoot,
            workflowRunId: 'run-1',
            nodeId: 'validate_triage_artifacts',
            workflowArtifacts: refineIssueArtifacts,
        };

        const result = executeArtifactExistsValidator(
            {
                validator_id: ARTIFACT_EXISTS_VALIDATOR_ID,
                type: 'artifact',
                target: 'user_questions',
            },
            context
        );

        expect(result.passed).toBe(true);
    });

    it('fails artifact exists validation when refine glob artifacts are missing', () => {
        const result = executeArtifactExistsValidator(
            {
                validator_id: ARTIFACT_EXISTS_VALIDATOR_ID,
                type: 'artifact',
                target: 'user_questions',
            },
            {
                workspaceRoot: createTempWorkspace(),
                workflowRunId: 'run-1',
                nodeId: 'validate_triage_artifacts',
                workflowArtifacts: refineIssueArtifacts,
            }
        );

        expect(result.passed).toBe(false);
        expect(result.diagnostics[0]?.code).toBe('forge.artifact.not_found');
    });

    it('detects SHA-256 mismatch in artifact integrity validation', () => {
        const workspaceRoot = createTempWorkspace();
        const relativePath = '.cursor/.tmp/refine-forge-50/user_questions.md';
        const absolutePath = path.join(workspaceRoot, relativePath);
        fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
        fs.writeFileSync(absolutePath, '# Questions');

        const actualHash = crypto.createHash('sha256').update('# Questions', 'utf8').digest('hex');

        const mismatchResult = executeArtifactIntegrityValidator(
            { validator_id: ARTIFACT_INTEGRITY_VALIDATOR_ID, type: 'artifact' },
            {
                workspaceRoot,
                workflowRunId: 'run-1',
                nodeId: 'validate-node',
                envelope: baseEnvelope({
                    artifact_refs: [
                        {
                            artifact_id: 'user_questions',
                            path: relativePath,
                            size_bytes: 11,
                            sha256: 'f'.repeat(64),
                        },
                    ],
                }),
            }
        );

        expect(mismatchResult.passed).toBe(false);
        expect(mismatchResult.diagnostics[0]?.code).toBe('forge.artifact.integrity.mismatch');

        const passResult = executeArtifactIntegrityValidator(
            { validator_id: ARTIFACT_INTEGRITY_VALIDATOR_ID, type: 'artifact' },
            {
                workspaceRoot,
                workflowRunId: 'run-1',
                nodeId: 'validate-node',
                envelope: baseEnvelope({
                    artifact_refs: [
                        {
                            artifact_id: 'user_questions',
                            path: relativePath,
                            size_bytes: 11,
                            sha256: actualHash,
                        },
                    ],
                }),
            }
        );

        expect(passResult.passed).toBe(true);
    });

    it('skips missing files in integrity validation so exists validators surface them first', () => {
        const result = executeArtifactIntegrityValidator(
            { validator_id: ARTIFACT_INTEGRITY_VALIDATOR_ID, type: 'artifact' },
            {
                workspaceRoot: createTempWorkspace(),
                workflowRunId: 'run-1',
                nodeId: 'validate-node',
                envelope: baseEnvelope({
                    artifact_refs: [
                        {
                            artifact_id: 'user_questions',
                            path: '.cursor/.tmp/refine-forge-50/user_questions.md',
                            size_bytes: 11,
                            sha256: 'a'.repeat(64),
                        },
                    ],
                }),
            }
        );

        expect(result.passed).toBe(true);
        expect(result.diagnostics).toEqual([]);
    });

    it('evaluates generic and refine-issue domain exit criteria validators', () => {
        const genericFail = executeDomainExitCriteriaValidator(
            {
                validator_id: 'forge.domain.exit_criteria',
                type: 'domain',
                target: 'criteria_a',
            },
            {
                workspaceRoot: createTempWorkspace(),
                workflowRunId: 'run-1',
                nodeId: 'validate-node',
                domainExitCriteria: { criteriaMet: { criteria_a: false } },
            }
        );
        expect(genericFail.passed).toBe(false);

        const genericPass = executeDomainExitCriteriaValidator(
            {
                validator_id: 'forge.domain.exit_criteria',
                type: 'domain',
                target: 'criteria_a',
            },
            {
                workspaceRoot: createTempWorkspace(),
                workflowRunId: 'run-1',
                nodeId: 'validate-node',
                domainExitCriteria: { criteriaMet: { criteria_a: true } },
            }
        );
        expect(genericPass.passed).toBe(true);

        const refineFail = executeRefineIssueExitCriteriaValidator(
            { validator_id: 'local.forge.refine_issue.exit_criteria', type: 'domain' },
            {
                workspaceRoot: createTempWorkspace(),
                workflowRunId: 'run-1',
                nodeId: 'validate_exit_criteria',
                refineIssueExitContext: {
                    issueBodyValid: true,
                    blockersResolved: false,
                    openDecisionsResolved: true,
                    aiChangesCommitted: true,
                },
            }
        );
        expect(refineFail.passed).toBe(false);
        expect(refineFail.diagnostics.some((diagnostic) => diagnostic.path === 'blockersResolved')).toBe(
            true
        );
    });

    it('assembles aggregate ValidationResult output that matches JSON Schema', () => {
        const workspaceRoot = createTempWorkspace();
        const sessionDir = path.join(workspaceRoot, '.cursor', '.tmp', 'refine-forge-50');
        fs.mkdirSync(sessionDir, { recursive: true });
        fs.writeFileSync(path.join(sessionDir, 'user_questions.md'), '# Questions');
        fs.writeFileSync(path.join(sessionDir, 'assumptions.md'), '# Assumptions');

        const aggregate = assembleRuntimeValidationResult({
            nodeId: 'validate_triage_artifacts',
            workflowRunId: 'run-123',
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
            context: {
                workspaceRoot,
                workflowRunId: 'run-123',
                nodeId: 'validate_triage_artifacts',
                sourceActivityNodeId: 'triage_questions',
                workflowArtifacts: refineIssueArtifacts,
            },
            validatedAt: '2026-06-10T12:00:00.000Z',
        });

        expect(aggregate.valid).toBe(true);
        expect(aggregate.validator_outcomes).toHaveLength(2);
        expect(aggregate.diagnostics).toEqual([]);

        const schemaValidation = validateRuntimeValidationResultSchema(aggregate);
        expect(schemaValidation.valid).toBe(true);
    });

    it('assembles failed aggregate with ordered diagnostics and validator outcomes', () => {
        const aggregate = assembleRuntimeValidationResult({
            nodeId: 'validate_triage_artifacts',
            workflowRunId: 'run-123',
            validators: [
                {
                    validator_id: ARTIFACT_EXISTS_VALIDATOR_ID,
                    type: 'artifact',
                    target: 'user_questions',
                },
            ],
            context: {
                workspaceRoot: createTempWorkspace(),
                workflowRunId: 'run-123',
                nodeId: 'validate_triage_artifacts',
                workflowArtifacts: refineIssueArtifacts,
            },
            validatedAt: '2026-06-10T12:00:00.000Z',
        });

        expect(aggregate.valid).toBe(false);
        expect(aggregate.validator_outcomes[0]?.passed).toBe(false);
        expect(aggregate.diagnostics).toHaveLength(1);
        expect(validateRuntimeValidationResultSchema(aggregate).valid).toBe(true);
    });
});
