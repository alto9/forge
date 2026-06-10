import fs from 'fs';
import path from 'path';
import Ajv2020, { type ErrorObject, type ValidateFunction } from 'ajv/dist/2020';
import {
    type ActivityEnvelopeValidationResult,
    type ActivityEnvelopeValidatorDiagnostic,
} from './activityEnvelope';

export const ACTIVITY_ENVELOPE_SCHEMA_VALIDATOR_ID = 'forge.envelope.schema';
export const ACTIVITY_ENVELOPE_UNSUPPORTED_VERSION_VALIDATOR_ID = 'forge.envelope.unsupported_version';
export const ACTIVITY_ENVELOPE_SIZE_VALIDATOR_ID = 'forge.envelope.size';

export const INLINE_STRUCTURED_PAYLOAD_MAX_BYTES = 64 * 1024;
export const TOTAL_ENVELOPE_MAX_BYTES = 256 * 1024;

export const ENVELOPE_UNSUPPORTED_VERSION_CODE = 'forge.envelope.unsupported_version';
export const ENVELOPE_SIZE_EXCEEDED_CODE = 'forge.envelope.size_exceeded';

const SUPPORTED_ENVELOPE_VERSION_MAJOR = 1;

const ACTIVITY_ENVELOPE_SCHEMA_RELATIVE_PATH = '.ai/schemas/activity-envelope.schema.json';

let cachedValidator: ValidateFunction | undefined;

function resolveActivityEnvelopeSchemaPath(): string {
    const candidates = [
        path.join(process.cwd(), ACTIVITY_ENVELOPE_SCHEMA_RELATIVE_PATH),
        path.join(__dirname, '../../.ai/schemas/activity-envelope.schema.json'),
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    throw new Error(`activity envelope schema not found (expected ${ACTIVITY_ENVELOPE_SCHEMA_RELATIVE_PATH})`);
}

function loadActivityEnvelopeSchemaValidator(): ValidateFunction {
    if (cachedValidator) {
        return cachedValidator;
    }

    const schemaPath = resolveActivityEnvelopeSchemaPath();
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8')) as object;
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    cachedValidator = ajv.compile(schema);
    return cachedValidator;
}

function parseSemverMajor(version: string): number | undefined {
    const match = /^(\d+)\./.exec(version.trim());
    if (!match) {
        return undefined;
    }
    return Number.parseInt(match[1], 10);
}

function utf8ByteLength(value: string): number {
    return Buffer.byteLength(value, 'utf8');
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

function mapAjvErrorToDiagnostic(error: ErrorObject): ActivityEnvelopeValidatorDiagnostic {
    return {
        code: diagnosticCodeForAjvError(error),
        severity: 'error',
        path: jsonPointerFromAjvError(error),
        message: messageForAjvError(error),
        source: 'validator',
        validator_id: ACTIVITY_ENVELOPE_SCHEMA_VALIDATOR_ID,
    };
}

function isEnvelopeRecord(content: unknown): content is Record<string, unknown> {
    return content !== null && typeof content === 'object' && !Array.isArray(content);
}

function structuredPayloadUtf8Bytes(payload: unknown): number {
    if (typeof payload === 'string') {
        return utf8ByteLength(payload);
    }

    return utf8ByteLength(JSON.stringify(payload));
}

export function validateEnvelopeUnsupportedVersion(content: unknown): ActivityEnvelopeValidationResult {
    if (!isEnvelopeRecord(content)) {
        return { valid: true, diagnostics: [] };
    }

    const version = content.envelope_version;
    if (typeof version !== 'string') {
        return { valid: true, diagnostics: [] };
    }

    const major = parseSemverMajor(version);
    if (major === undefined) {
        return { valid: true, diagnostics: [] };
    }

    if (major !== SUPPORTED_ENVELOPE_VERSION_MAJOR) {
        const diagnostic: ActivityEnvelopeValidatorDiagnostic = {
            code: ENVELOPE_UNSUPPORTED_VERSION_CODE,
            message: `envelope_version major ${major} is not supported (supported major: ${SUPPORTED_ENVELOPE_VERSION_MAJOR})`,
            severity: 'error',
            path: '/envelope_version',
            source: 'validator',
            validator_id: ACTIVITY_ENVELOPE_UNSUPPORTED_VERSION_VALIDATOR_ID,
        };

        return { valid: false, diagnostics: [diagnostic] };
    }

    return { valid: true, diagnostics: [] };
}

export function validateEnvelopeSchema(content: unknown): ActivityEnvelopeValidationResult {
    if (!isEnvelopeRecord(content)) {
        const diagnostic: ActivityEnvelopeValidatorDiagnostic = {
            code: 'schema.type',
            severity: 'error',
            path: '/',
            message: 'activity envelope must be a JSON object',
            source: 'validator',
            validator_id: ACTIVITY_ENVELOPE_SCHEMA_VALIDATOR_ID,
        };

        return { valid: false, diagnostics: [diagnostic] };
    }

    const validate = loadActivityEnvelopeSchemaValidator();
    const valid = validate(content);

    if (valid) {
        return { valid: true, diagnostics: [] };
    }

    const diagnostics = (validate.errors ?? []).map(mapAjvErrorToDiagnostic);

    return {
        valid: false,
        diagnostics,
    };
}

export function validateEnvelopeSize(content: unknown): ActivityEnvelopeValidationResult {
    if (!isEnvelopeRecord(content)) {
        return { valid: true, diagnostics: [] };
    }

    const diagnostics: ActivityEnvelopeValidatorDiagnostic[] = [];

    const structuredPayload = content.structured_payload;
    if (structuredPayload !== undefined) {
        const inlineBytes = structuredPayloadUtf8Bytes(structuredPayload);
        if (inlineBytes > INLINE_STRUCTURED_PAYLOAD_MAX_BYTES) {
            diagnostics.push({
                code: ENVELOPE_SIZE_EXCEEDED_CODE,
                message: `structured_payload exceeds inline limit (${inlineBytes} bytes; max ${INLINE_STRUCTURED_PAYLOAD_MAX_BYTES})`,
                severity: 'error',
                path: '/structured_payload',
                source: 'validator',
                validator_id: ACTIVITY_ENVELOPE_SIZE_VALIDATOR_ID,
            });
        }
    }

    const totalBytes = utf8ByteLength(JSON.stringify(content));
    if (totalBytes > TOTAL_ENVELOPE_MAX_BYTES) {
        diagnostics.push({
            code: ENVELOPE_SIZE_EXCEEDED_CODE,
            message: `serialized envelope exceeds total limit (${totalBytes} bytes; max ${TOTAL_ENVELOPE_MAX_BYTES})`,
            severity: 'error',
            path: '/',
            source: 'validator',
            validator_id: ACTIVITY_ENVELOPE_SIZE_VALIDATOR_ID,
        });
    }

    return {
        valid: diagnostics.length === 0,
        diagnostics,
    };
}

export function validateActivityEnvelope(content: unknown): ActivityEnvelopeValidationResult {
    const versionResult = validateEnvelopeUnsupportedVersion(content);
    const schemaResult = validateEnvelopeSchema(content);
    const sizeResult = validateEnvelopeSize(content);

    const diagnostics = [
        ...versionResult.diagnostics,
        ...schemaResult.diagnostics,
        ...sizeResult.diagnostics,
    ];

    const valid = diagnostics.every((diagnostic) => diagnostic.severity !== 'error');

    return { valid, diagnostics };
}

export function resetActivityEnvelopeValidatorCacheForTests(): void {
    cachedValidator = undefined;
}
