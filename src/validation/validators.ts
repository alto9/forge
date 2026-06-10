import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { CursorSdkResponseEnvelope } from '../worker/activityEnvelope';
import {
    ACTIVITY_ENVELOPE_SCHEMA_VALIDATOR_ID,
    ACTIVITY_ENVELOPE_SIZE_VALIDATOR_ID,
    ACTIVITY_ENVELOPE_UNSUPPORTED_VERSION_VALIDATOR_ID,
    validateEnvelopeSchema,
    validateEnvelopeSize,
    validateEnvelopeUnsupportedVersion,
} from '../worker/validateActivityEnvelope';
import { findWorkflowArtifactPath, resolveArtifactGlobPaths } from './artifactPathResolution';
import { validateJsonSchemaContent } from './jsonSchemaValidation';
import type {
    RuntimeValidationDiagnostic,
    ValidationNodeValidator,
    ValidatorExecutorContext,
    ValidatorExecutorResult,
} from './types';

export const ARTIFACT_EXISTS_VALIDATOR_ID = 'forge.artifact.exists';
export const ARTIFACT_INTEGRITY_VALIDATOR_ID = 'forge.artifact.integrity';
export const ARTIFACT_SCHEMA_VALIDATOR_ID = 'forge.artifact.schema';
export const DOMAIN_EXIT_CRITERIA_VALIDATOR_ID = 'forge.domain.exit_criteria';
export const REFINE_ISSUE_EXIT_CRITERIA_VALIDATOR_ID = 'local.forge.refine_issue.exit_criteria';

function mapEnvelopeDiagnostic(
    diagnostic: {
        code: string;
        severity: 'error' | 'warning' | 'info';
        message: string;
        path?: string;
        validator_id: string;
    }
): RuntimeValidationDiagnostic {
    return {
        code: diagnostic.code,
        severity: diagnostic.severity,
        message: diagnostic.message,
        validator_id: diagnostic.validator_id,
        ...(diagnostic.path ? { path: diagnostic.path } : {}),
    };
}

function runEnvelopeValidator(
    validatorId: string,
    validate: (content: unknown) => { valid: boolean; diagnostics: Array<{ code: string; severity: 'error' | 'warning' | 'info'; message: string; path?: string; validator_id: string }> },
    envelope: CursorSdkResponseEnvelope | undefined
): ValidatorExecutorResult {
    if (!envelope) {
        return {
            passed: false,
            diagnostics: [
                {
                    code: 'forge.envelope.missing',
                    severity: 'error',
                    message: 'activity envelope is required for envelope validation',
                    validator_id: validatorId,
                },
            ],
        };
    }

    const result = validate(envelope);
    return {
        passed: result.valid,
        diagnostics: result.diagnostics.map(mapEnvelopeDiagnostic),
    };
}

export function executeEnvelopeSchemaValidator(
    _declaration: ValidationNodeValidator,
    context: ValidatorExecutorContext
): ValidatorExecutorResult {
    return runEnvelopeValidator(ACTIVITY_ENVELOPE_SCHEMA_VALIDATOR_ID, validateEnvelopeSchema, context.envelope);
}

export function executeEnvelopeUnsupportedVersionValidator(
    _declaration: ValidationNodeValidator,
    context: ValidatorExecutorContext
): ValidatorExecutorResult {
    return runEnvelopeValidator(
        ACTIVITY_ENVELOPE_UNSUPPORTED_VERSION_VALIDATOR_ID,
        validateEnvelopeUnsupportedVersion,
        context.envelope
    );
}

export function executeEnvelopeSizeValidator(
    _declaration: ValidationNodeValidator,
    context: ValidatorExecutorContext
): ValidatorExecutorResult {
    return runEnvelopeValidator(ACTIVITY_ENVELOPE_SIZE_VALIDATOR_ID, validateEnvelopeSize, context.envelope);
}

export function executeArtifactExistsValidator(
    declaration: ValidationNodeValidator,
    context: ValidatorExecutorContext
): ValidatorExecutorResult {
    const artifactId = declaration.target;
    if (!artifactId) {
        return {
            passed: false,
            diagnostics: [
                {
                    code: 'forge.artifact.missing_target',
                    severity: 'error',
                    message: 'artifact validator requires target artifact_id',
                    validator_id: ARTIFACT_EXISTS_VALIDATOR_ID,
                },
            ],
        };
    }

    const artifactPath = findWorkflowArtifactPath(context.workflowArtifacts, artifactId);
    if (!artifactPath) {
        return {
            passed: false,
            diagnostics: [
                {
                    code: 'forge.artifact.undeclared',
                    severity: 'error',
                    message: `workflow artifact "${artifactId}" is not declared`,
                    validator_id: ARTIFACT_EXISTS_VALIDATOR_ID,
                    path: artifactId,
                },
            ],
        };
    }

    const matches = resolveArtifactGlobPaths(context.workspaceRoot, artifactPath);
    if (matches.length === 0) {
        return {
            passed: false,
            diagnostics: [
                {
                    code: 'forge.artifact.not_found',
                    severity: 'error',
                    message: `no on-disk match for artifact "${artifactId}" at pattern "${artifactPath}"`,
                    validator_id: ARTIFACT_EXISTS_VALIDATOR_ID,
                    path: artifactPath,
                },
            ],
        };
    }

    return { passed: true, diagnostics: [] };
}

function sha256HexFile(absolutePath: string): string {
    const content = fs.readFileSync(absolutePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

export function executeArtifactIntegrityValidator(
    _declaration: ValidationNodeValidator,
    context: ValidatorExecutorContext
): ValidatorExecutorResult {
    const artifactRefs = context.envelope?.artifact_refs ?? [];
    if (artifactRefs.length === 0) {
        return {
            passed: false,
            diagnostics: [
                {
                    code: 'forge.artifact.integrity.no_refs',
                    severity: 'error',
                    message: 'artifact integrity validation requires envelope artifact_refs',
                    validator_id: ARTIFACT_INTEGRITY_VALIDATOR_ID,
                },
            ],
        };
    }

    const diagnostics: RuntimeValidationDiagnostic[] = [];

    for (const artifactRef of artifactRefs) {
        if (!artifactRef.path || !artifactRef.sha256) {
            continue;
        }

        const absolutePath = path.join(context.workspaceRoot, artifactRef.path);
        if (!fs.existsSync(absolutePath)) {
            continue;
        }

        const actualHash = sha256HexFile(absolutePath);
        const expectedHash = artifactRef.sha256.toLowerCase();
        if (actualHash !== expectedHash) {
            diagnostics.push({
                code: 'forge.artifact.integrity.mismatch',
                severity: 'error',
                message: `SHA-256 mismatch for artifact "${artifactRef.artifact_id}" at "${artifactRef.path}"`,
                validator_id: ARTIFACT_INTEGRITY_VALIDATOR_ID,
                path: artifactRef.path,
            });
        }
    }

    return {
        passed: diagnostics.length === 0,
        diagnostics,
    };
}

function readArtifactContent(absolutePath: string): unknown {
    const raw = fs.readFileSync(absolutePath, 'utf8');
    return JSON.parse(raw) as unknown;
}

export function executeArtifactSchemaValidator(
    declaration: ValidationNodeValidator,
    context: ValidatorExecutorContext
): ValidatorExecutorResult {
    const schemaRef =
        declaration.target ?? context.envelope?.validation_inputs?.schema_ref;

    if (!schemaRef) {
        return {
            passed: false,
            diagnostics: [
                {
                    code: 'forge.artifact.schema.missing_ref',
                    severity: 'error',
                    message: 'artifact schema validator requires target schema ref or envelope validation_inputs.schema_ref',
                    validator_id: ARTIFACT_SCHEMA_VALIDATOR_ID,
                },
            ],
        };
    }

    const artifactId = context.envelope?.validation_inputs?.artifact_ids?.[0];
    let artifactPath: string | undefined;

    if (artifactId) {
        artifactPath = findWorkflowArtifactPath(context.workflowArtifacts, artifactId);
    }

    if (!artifactPath && context.envelope?.artifact_refs?.[0]?.path) {
        artifactPath = context.envelope.artifact_refs[0].path;
    }

    if (!artifactPath) {
        return {
            passed: false,
            diagnostics: [
                {
                    code: 'forge.artifact.schema.missing_artifact',
                    severity: 'error',
                    message: 'artifact schema validator could not resolve artifact path',
                    validator_id: ARTIFACT_SCHEMA_VALIDATOR_ID,
                },
            ],
        };
    }

    const matches = resolveArtifactGlobPaths(context.workspaceRoot, artifactPath);
    if (matches.length === 0) {
        return {
            passed: false,
            diagnostics: [
                {
                    code: 'forge.artifact.not_found',
                    severity: 'error',
                    message: `no on-disk match for artifact schema validation at "${artifactPath}"`,
                    validator_id: ARTIFACT_SCHEMA_VALIDATOR_ID,
                    path: artifactPath,
                },
            ],
        };
    }

    const absolutePath = path.join(context.workspaceRoot, matches[0]);
    let content: unknown;
    try {
        content = readArtifactContent(absolutePath);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'invalid artifact content';
        return {
            passed: false,
            diagnostics: [
                {
                    code: 'forge.artifact.schema.read_error',
                    severity: 'error',
                    message: `failed to read artifact for schema validation: ${message}`,
                    validator_id: ARTIFACT_SCHEMA_VALIDATOR_ID,
                    path: matches[0],
                },
            ],
        };
    }

    const validation = validateJsonSchemaContent(content, {
        schemaRelativePath: schemaRef,
        validatorId: ARTIFACT_SCHEMA_VALIDATOR_ID,
    });

    return {
        passed: validation.valid,
        diagnostics: validation.diagnostics.map((diagnostic) => ({
            ...diagnostic,
            path: diagnostic.path ?? matches[0],
        })),
    };
}

export function executeDomainExitCriteriaValidator(
    declaration: ValidationNodeValidator,
    context: ValidatorExecutorContext
): ValidatorExecutorResult {
    const criterionId = declaration.target;
    if (!criterionId) {
        return {
            passed: false,
            diagnostics: [
                {
                    code: 'forge.domain.missing_target',
                    severity: 'error',
                    message: 'domain exit criteria validator requires target criterion id',
                    validator_id: DOMAIN_EXIT_CRITERIA_VALIDATOR_ID,
                },
            ],
        };
    }

    const met = context.domainExitCriteria?.criteriaMet[criterionId];
    if (met !== true) {
        return {
            passed: false,
            diagnostics: [
                {
                    code: 'forge.domain.exit_criteria.unmet',
                    severity: 'error',
                    message: `domain exit criterion "${criterionId}" is not satisfied`,
                    validator_id: DOMAIN_EXIT_CRITERIA_VALIDATOR_ID,
                    path: criterionId,
                },
            ],
        };
    }

    return { passed: true, diagnostics: [] };
}

export function executeRefineIssueExitCriteriaValidator(
    _declaration: ValidationNodeValidator,
    context: ValidatorExecutorContext
): ValidatorExecutorResult {
    const exitContext = context.refineIssueExitContext;
    if (!exitContext) {
        return {
            passed: false,
            diagnostics: [
                {
                    code: 'forge.refine_issue.exit_criteria.missing_context',
                    severity: 'error',
                    message: 'refine-issue exit criteria context is required',
                    validator_id: REFINE_ISSUE_EXIT_CRITERIA_VALIDATOR_ID,
                },
            ],
        };
    }

    const checks: Array<{ key: keyof typeof exitContext; label: string }> = [
        { key: 'issueBodyValid', label: 'working parent issue body satisfies mandatory ticket format' },
        { key: 'blockersResolved', label: 'no unanswered tier-User blockers remain' },
        { key: 'openDecisionsResolved', label: 'in-scope Open implementation decisions are resolved in .ai' },
        { key: 'aiChangesCommitted', label: '.ai edits are committed and pushed to main from the worktree' },
    ];

    const diagnostics: RuntimeValidationDiagnostic[] = [];

    for (const check of checks) {
        if (!exitContext[check.key]) {
            diagnostics.push({
                code: 'forge.refine_issue.exit_criteria.unmet',
                severity: 'error',
                message: check.label,
                validator_id: REFINE_ISSUE_EXIT_CRITERIA_VALIDATOR_ID,
                path: check.key,
            });
        }
    }

    return {
        passed: diagnostics.length === 0,
        diagnostics,
    };
}
