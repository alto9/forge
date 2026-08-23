import { describe, expect, it } from 'vitest';
import {
    buildActionPrompt,
    getActionPrompt,
    listActionPromptIds,
} from './productOwner';

const REQUIRED_IDS = [
    'brief.defineProduct',
    'brief.analyzeProblem',
    'brief.refreshAudience',
    'brief.updateGoals',
    'brief.setNonGoals',
    'brief.setTargets',
    'brief.setFocus',
    'competitive.scanAlternatives',
    'competitive.updateWins',
    'competitive.updateLosses',
    'competitive.updateWatchList',
    'competitive.deriveImplications',
    'personas.refreshPersonas',
    'personas.updateJobs',
    'personas.setExclusions',
    'experiments.reviewActive',
    'experiments.proposeBet',
    'experiments.concludeBet',
    'insights.synthesizeThemes',
    'insights.captureQuestions',
    'insights.addEvidence',
    'insights.deriveImplications',
    'metrics.setPrimary',
    'metrics.addSupporting',
    'metrics.setTargets',
    'metrics.refreshRead',
    'sidebar.initProject',
];

describe('productOwner prompts', () => {
    it('registers every Figma action id', () => {
        const ids = listActionPromptIds();
        for (const id of REQUIRED_IDS) {
            expect(ids).toContain(id);
            expect(getActionPrompt(id)).toBeDefined();
        }
    });

    it('expands submodule and memory placeholders', () => {
        const prompt = buildActionPrompt('competitive.scanAlternatives', {
            submodulePath: 'forge-cursor-plugin',
            memoryRoot: '/repo/.ai/memory/forge-cursor-plugin',
        });
        expect(prompt).toBeDefined();
        expect(prompt).toContain('forge-cursor-plugin');
        expect(prompt).toContain('/repo/.ai/memory/forge-cursor-plugin');
        expect(prompt).not.toContain('{submodulePath}');
        expect(prompt).not.toContain('{memoryRoot}');
        expect(prompt).toContain('/forge.competitive-scan');
    });

    it('returns undefined for unknown ids', () => {
        expect(buildActionPrompt('nope', { submodulePath: 'x', memoryRoot: 'y' })).toBeUndefined();
    });
});
