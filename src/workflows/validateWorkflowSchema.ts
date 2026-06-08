import fs from 'fs';
import path from 'path';
import Ajv2020, { type ErrorObject, type ValidateFunction } from 'ajv/dist/2020';
import type { WorkflowDiagnostic, WorkflowSchemaValidationResult } from './types';

export const WORKFLOW_SCHEMA_VALIDATOR_ID = 'forge.workflow.schema';

const WORKFLOW_SCHEMA_RELATIVE_PATH = '.ai/schemas/workflow.schema.json';

let cachedValidator: ValidateFunction | undefined;

function resolveWorkflowSchemaPath(): string {
    const candidates = [
        path.join(process.cwd(), WORKFLOW_SCHEMA_RELATIVE_PATH),
        path.join(__dirname, '../../.ai/schemas/workflow.schema.json'),
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    throw new Error(`workflow schema not found (expected ${WORKFLOW_SCHEMA_RELATIVE_PATH})`);
}

function loadWorkflowSchemaValidator(): ValidateFunction {
    if (cachedValidator) {
        return cachedValidator;
    }

    const schemaPath = resolveWorkflowSchemaPath();
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8')) as object;
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    cachedValidator = ajv.compile(schema);
    return cachedValidator;
}

function diagnosticCodeForAjvError(error: ErrorObject): string {
    const keyword = error.keyword;

    switch (keyword) {
        case 'required':
            return 'schema.required';
        case 'type':
            return 'schema.type';
        case 'enum':
            return 'schema.enum';
        case 'const':
            return 'schema.const';
        case 'additionalProperties':
            return 'schema.additional_properties';
        case 'minLength':
        case 'minItems':
        case 'pattern':
            return 'schema.constraint';
        default:
            return `schema.${keyword}`;
    }
}

function jsonPointerFromAjvError(error: ErrorObject): string {
    const instancePath = error.instancePath || '';
    if (instancePath.length > 0) {
        return instancePath;
    }

    if (error.keyword === 'required' && error.params.missingProperty) {
        return `/${String(error.params.missingProperty)}`;
    }

    return '/';
}

function messageForAjvError(error: ErrorObject): string {
    if (error.message) {
        return error.message;
    }

    return `JSON Schema validation failed (${error.keyword})`;
}

function mapAjvErrorToDiagnostic(error: ErrorObject): WorkflowDiagnostic {
    return {
        code: diagnosticCodeForAjvError(error),
        severity: 'error',
        path: jsonPointerFromAjvError(error),
        message: messageForAjvError(error),
        validator_id: WORKFLOW_SCHEMA_VALIDATOR_ID,
    };
}

function extractWorkflowId(content: unknown): string | undefined {
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
        return undefined;
    }

    const workflowId = (content as Record<string, unknown>).workflow_id;
    return typeof workflowId === 'string' && workflowId.length > 0 ? workflowId : undefined;
}

export function validateWorkflowDefinitionJson(
    content: unknown,
    options?: { path?: string }
): WorkflowSchemaValidationResult {
    const workflow_id = extractWorkflowId(content);
    const definitionPath = options?.path;

    if (content === null || typeof content !== 'object' || Array.isArray(content)) {
        const diagnostic: WorkflowDiagnostic = {
            code: 'schema.type',
            severity: 'error',
            path: '/',
            message: 'workflow definition must be a JSON object',
            validator_id: WORKFLOW_SCHEMA_VALIDATOR_ID,
        };

        return {
            valid: false,
            diagnostics: [diagnostic],
            workflow_id,
            path: definitionPath,
        };
    }

    const validate = loadWorkflowSchemaValidator();
    const valid = validate(content);

    if (valid) {
        return {
            valid: true,
            diagnostics: [],
            workflow_id,
            path: definitionPath,
        };
    }

    const diagnostics = (validate.errors ?? []).map(mapAjvErrorToDiagnostic);

    return {
        valid: false,
        diagnostics,
        workflow_id,
        path: definitionPath,
    };
}

export function resetWorkflowSchemaValidatorCacheForTests(): void {
    cachedValidator = undefined;
}
