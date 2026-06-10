import fs from 'fs';
import path from 'path';
import Ajv2020, { type ErrorObject, type ValidateFunction } from 'ajv/dist/2020';
import type { RuntimeValidationDiagnostic } from './types';

const schemaValidatorCache = new Map<string, ValidateFunction>();

function resolveSchemaPath(schemaRelativePath: string): string {
    const normalized = schemaRelativePath.replace(/\\/g, '/');
    const candidates = [
        path.join(process.cwd(), normalized),
        path.join(__dirname, '../../', normalized),
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    throw new Error(`JSON Schema not found (expected ${normalized})`);
}

function loadSchemaValidator(schemaRelativePath: string): ValidateFunction {
    const cached = schemaValidatorCache.get(schemaRelativePath);
    if (cached) {
        return cached;
    }

    const schemaPath = resolveSchemaPath(schemaRelativePath);
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8')) as object;
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validator = ajv.compile(schema);
    schemaValidatorCache.set(schemaRelativePath, validator);
    return validator;
}

function diagnosticCodeForAjvError(error: ErrorObject): string {
    switch (error.keyword) {
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
            return `schema.${error.keyword}`;
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

function mapAjvErrorToDiagnostic(
    error: ErrorObject,
    validatorId: string
): RuntimeValidationDiagnostic {
    return {
        code: diagnosticCodeForAjvError(error),
        severity: 'error',
        path: jsonPointerFromAjvError(error),
        message: error.message ?? `JSON Schema validation failed (${error.keyword})`,
        validator_id: validatorId,
    };
}

export interface JsonSchemaValidationOptions {
    schemaRelativePath: string;
    validatorId: string;
}

export function validateJsonSchemaContent(
    content: unknown,
    options: JsonSchemaValidationOptions
): { valid: boolean; diagnostics: RuntimeValidationDiagnostic[] } {
    if (content === null || typeof content !== 'object' || Array.isArray(content)) {
        return {
            valid: false,
            diagnostics: [
                {
                    code: 'schema.type',
                    severity: 'error',
                    path: '/',
                    message: 'content must be a JSON object',
                    validator_id: options.validatorId,
                },
            ],
        };
    }

    const validate = loadSchemaValidator(options.schemaRelativePath);
    const valid = validate(content);

    if (valid) {
        return { valid: true, diagnostics: [] };
    }

    return {
        valid: false,
        diagnostics: (validate.errors ?? []).map((error) =>
            mapAjvErrorToDiagnostic(error, options.validatorId)
        ),
    };
}

export function validateRuntimeValidationResultSchema(
    result: unknown
): { valid: boolean; diagnostics: RuntimeValidationDiagnostic[] } {
    return validateJsonSchemaContent(result, {
        schemaRelativePath: '.ai/schemas/validation-result.schema.json',
        validatorId: 'forge.validation_result.schema',
    });
}

export function resetJsonSchemaValidatorCacheForTests(): void {
    schemaValidatorCache.clear();
}
