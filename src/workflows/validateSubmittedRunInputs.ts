import type {
    ValidationResult,
    WorkflowDiagnostic,
    WorkflowRunInputDefinition,
    WorkflowRunStartInput,
} from './types';

export const WORKFLOW_RUN_INPUT_VALIDATOR_ID = 'forge.workflow.run_input';

export interface ValidateSubmittedRunInputsOptions {
    declarations: WorkflowRunInputDefinition[];
    submitted: Record<string, unknown>;
    workflow_id?: string;
    path?: string;
}

function aggregateValid(diagnostics: WorkflowDiagnostic[]): boolean {
    return !diagnostics.some((diagnostic) => diagnostic.severity === 'error');
}

export function normalizeSubmittedRunInputs(
    declarations: WorkflowRunInputDefinition[],
    submitted: Record<string, unknown>
): WorkflowRunStartInput {
    const declaredIds = new Set(declarations.map((descriptor) => descriptor.input_id));
    const normalized: WorkflowRunStartInput = {};

    for (const [key, value] of Object.entries(submitted)) {
        if (!declaredIds.has(key) || typeof value !== 'string') {
            continue;
        }

        const declaration = declarations.find((descriptor) => descriptor.input_id === key);
        if (!declaration) {
            continue;
        }

        if (value.length === 0 && declaration.required !== true) {
            continue;
        }

        normalized[key] = value;
    }

    return normalized;
}

export function validateSubmittedRunInputs(
    options: ValidateSubmittedRunInputsOptions
): ValidationResult {
    const diagnostics: WorkflowDiagnostic[] = [];
    const declaredIds = new Set(options.declarations.map((descriptor) => descriptor.input_id));

    for (const [key, value] of Object.entries(options.submitted)) {
        if (!declaredIds.has(key)) {
            diagnostics.push({
                code: 'run_input.undeclared_key',
                severity: 'error',
                path: `/run_inputs/${key}`,
                message: `submitted run input "${key}" is not declared in the workflow definition`,
                validator_id: WORKFLOW_RUN_INPUT_VALIDATOR_ID,
            });
            continue;
        }

        if (typeof value !== 'string') {
            diagnostics.push({
                code: 'run_input.invalid_type',
                severity: 'error',
                path: `/run_inputs/${key}`,
                message: `submitted run input "${key}" must be a string`,
                validator_id: WORKFLOW_RUN_INPUT_VALIDATOR_ID,
            });
        }
    }

    for (const declaration of options.declarations) {
        if (declaration.required !== true) {
            continue;
        }

        const value = options.submitted[declaration.input_id];
        if (value === undefined) {
            diagnostics.push({
                code: 'run_input.required_missing',
                severity: 'error',
                path: `/run_inputs/${declaration.input_id}`,
                message: `required run input "${declaration.input_id}" is missing`,
                validator_id: WORKFLOW_RUN_INPUT_VALIDATOR_ID,
            });
            continue;
        }

        if (typeof value !== 'string') {
            continue;
        }

        if (value.trim().length === 0) {
            diagnostics.push({
                code: 'run_input.required_empty',
                severity: 'error',
                path: `/run_inputs/${declaration.input_id}`,
                message: `required run input "${declaration.input_id}" is empty`,
                validator_id: WORKFLOW_RUN_INPUT_VALIDATOR_ID,
            });
        }
    }

    return {
        valid: aggregateValid(diagnostics),
        diagnostics,
        workflow_id: options.workflow_id,
        path: options.path,
    };
}
