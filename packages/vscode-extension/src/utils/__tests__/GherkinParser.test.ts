import { describe, it, expect } from 'vitest';
import { GherkinParser } from '../GherkinParser';

describe('GherkinParser', () => {
    it('parses and serializes scenarios', () => {
        const text = `Scenario: Example\nGIVEN something\nWHEN action\nTHEN result\n`;
        const scenarios = GherkinParser.parse(text);
        expect(scenarios.length).toBe(1);
        expect(scenarios[0].steps.length).toBe(3);
        const out = GherkinParser.serialize(scenarios);
        expect(out).toContain('Scenario: Example');
        expect(out).toContain('GIVEN something');
    });
});



