/**
 * Pre-run validator scope per `.ai/business_logic/domain_model.md`.
 * Definition validation and run-start gates use only these IDs.
 */
export const PRE_RUN_VALIDATOR_IDS = [
    'forge.workflow.schema',
    'forge.workflow.graph',
    'forge.workflow.binding',
    'forge.workflow.duplicate_id',
    'forge.workflow.unsupported_version',
    'forge.artifact.declared',
] as const;

/** Runtime validation node validators that must not execute during pre-run. */
export const RUNTIME_ONLY_VALIDATOR_IDS = [
    'forge.artifact.exists',
    'forge.artifact.schema',
    'forge.domain.exit_criteria',
] as const;

export type PreRunValidatorId = (typeof PRE_RUN_VALIDATOR_IDS)[number];

export function isPreRunValidatorId(validatorId: string): validatorId is PreRunValidatorId {
    return (PRE_RUN_VALIDATOR_IDS as readonly string[]).includes(validatorId);
}
