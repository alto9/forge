import { describe, expect, it } from 'vitest';
import {
    PRE_RUN_VALIDATOR_IDS,
    RUNTIME_ONLY_VALIDATOR_IDS,
    isPreRunValidatorId,
} from './preRunValidatorScope';

describe('preRunValidatorScope', () => {
    it('lists the pre-run validator catalog from domain_model.md', () => {
        expect(PRE_RUN_VALIDATOR_IDS).toEqual([
            'forge.workflow.schema',
            'forge.workflow.graph',
            'forge.workflow.binding',
            'forge.workflow.duplicate_id',
            'forge.workflow.unsupported_version',
            'forge.artifact.declared',
        ]);
    });

    it('excludes runtime-only validators from pre-run scope', () => {
        for (const runtimeId of RUNTIME_ONLY_VALIDATOR_IDS) {
            expect(isPreRunValidatorId(runtimeId)).toBe(false);
            expect(PRE_RUN_VALIDATOR_IDS).not.toContain(runtimeId);
        }
    });
});
