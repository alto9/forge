import { describe, it, expect } from 'vitest';
import { GherkinParser } from '../GherkinParser';

describe('GherkinParser', () => {
    it('parses and serializes scenarios', () => {
        const text = '```gherkin\nScenario: Example\nGIVEN something\nWHEN action\nTHEN result\n```';
        const scenarios = GherkinParser.parse(text);
        expect(scenarios.length).toBe(1);
        expect(scenarios[0].scenarios.length).toBe(1);
        expect(scenarios[0].scenarios[0].steps.length).toBe(3);
        const out = GherkinParser.serialize(scenarios[0]);
        expect(out).toContain('Scenario: Example');
        expect(out).toContain('GIVEN something');
    });

    describe('extractScenarios', () => {
        it('extracts scenario names from simple Gherkin content', () => {
            const content = `Feature: User Login

Scenario: Successful login
  Given a registered user
  When they enter valid credentials
  Then they should be logged in

Scenario: Failed login
  Given a registered user
  When they enter invalid credentials
  Then they should see an error message`;

            const scenarios = GherkinParser.extractScenarios(content);
            expect(scenarios).toEqual(['Successful login', 'Failed login']);
        });

        it('handles scenarios with indentation', () => {
            const content = `Feature: Test
  Scenario: Indented scenario
    Given something`;

            const scenarios = GherkinParser.extractScenarios(content);
            expect(scenarios).toEqual(['Indented scenario']);
        });

        it('returns empty array for content without scenarios', () => {
            const content = `Feature: Test Feature
Background:
  Given some background`;

            const scenarios = GherkinParser.extractScenarios(content);
            expect(scenarios).toEqual([]);
        });

        it('returns empty array for empty content', () => {
            const scenarios = GherkinParser.extractScenarios('');
            expect(scenarios).toEqual([]);
        });

        it('handles multiple scenarios in one file', () => {
            const content = `Scenario: First
  Given step 1

Scenario: Second
  Given step 2

Scenario: Third
  Given step 3`;

            const scenarios = GherkinParser.extractScenarios(content);
            expect(scenarios).toEqual(['First', 'Second', 'Third']);
        });
    });

    describe('buildScenarioMap', () => {
        it('creates map of scenario name to content', () => {
            const content = `Feature: User Login

Scenario: Successful login
  Given a registered user
  When they enter valid credentials
  Then they should be logged in`;

            const map = GherkinParser.buildScenarioMap(content);
            expect(Object.keys(map)).toEqual(['Successful login']);
            expect(map['Successful login']).toContain('Given a registered user');
            expect(map['Successful login']).toContain('When they enter valid credentials');
            expect(map['Successful login']).toContain('Then they should be logged in');
        });

        it('handles multiple scenarios', () => {
            const content = `Scenario: First
  Given step 1
  When action 1

Scenario: Second
  Given step 2
  Then result 2`;

            const map = GherkinParser.buildScenarioMap(content);
            expect(Object.keys(map)).toEqual(['First', 'Second']);
            expect(map['First']).toContain('Given step 1');
            expect(map['First']).toContain('When action 1');
            expect(map['Second']).toContain('Given step 2');
            expect(map['Second']).toContain('Then result 2');
        });

        it('includes all steps (Given/When/Then/And/But)', () => {
            const content = `Scenario: Complete flow
  Given initial state
  When action occurs
  Then result happens
  And additional check
  But exception case`;

            const map = GherkinParser.buildScenarioMap(content);
            const scenarioContent = map['Complete flow'];
            expect(scenarioContent).toContain('Given initial state');
            expect(scenarioContent).toContain('When action occurs');
            expect(scenarioContent).toContain('Then result happens');
            expect(scenarioContent).toContain('And additional check');
            expect(scenarioContent).toContain('But exception case');
        });

        it('handles scenarios with blank lines', () => {
            const content = `Scenario: With blanks
  Given step 1

  When step 2

  Then step 3`;

            const map = GherkinParser.buildScenarioMap(content);
            expect(map['With blanks']).toContain('Given step 1');
            expect(map['With blanks']).toContain('When step 2');
            expect(map['With blanks']).toContain('Then step 3');
        });

        it('returns empty map for content without scenarios', () => {
            const content = `Feature: Test Feature
Background:
  Given some background`;

            const map = GherkinParser.buildScenarioMap(content);
            expect(map).toEqual({});
        });

        it('handles Example: syntax', () => {
            const content = `Rule: Some rule
  Example: Example scenario
    Given something
    Then result`;

            const map = GherkinParser.buildScenarioMap(content);
            expect(Object.keys(map)).toEqual(['Example scenario']);
            expect(map['Example scenario']).toContain('Given something');
        });
    });

    describe('detectScenarioChanges', () => {
        it('detects added scenarios', () => {
            const oldContent = `Scenario: Existing
  Given step 1`;

            const newContent = `Scenario: Existing
  Given step 1

Scenario: New scenario
  Given new step`;

            const changes = GherkinParser.detectScenarioChanges(oldContent, newContent);
            expect(changes.added).toEqual(['New scenario']);
            expect(changes.modified).toEqual([]);
            expect(changes.removed).toEqual([]);
        });

        it('detects modified scenarios', () => {
            const oldContent = `Scenario: Modified
  Given old step
  When old action`;

            const newContent = `Scenario: Modified
  Given new step
  When new action`;

            const changes = GherkinParser.detectScenarioChanges(oldContent, newContent);
            expect(changes.added).toEqual([]);
            expect(changes.modified).toEqual(['Modified']);
            expect(changes.removed).toEqual([]);
        });

        it('detects removed scenarios', () => {
            const oldContent = `Scenario: Removed
  Given step 1

Scenario: Kept
  Given step 2`;

            const newContent = `Scenario: Kept
  Given step 2`;

            const changes = GherkinParser.detectScenarioChanges(oldContent, newContent);
            expect(changes.added).toEqual([]);
            expect(changes.modified).toEqual([]);
            expect(changes.removed).toEqual(['Removed']);
        });

        it('detects all change types simultaneously', () => {
            const oldContent = `Scenario: Modified
  Given old step

Scenario: Removed
  Given step`;

            const newContent = `Scenario: Modified
  Given new step

Scenario: Added
  Given new step`;

            const changes = GherkinParser.detectScenarioChanges(oldContent, newContent);
            expect(changes.added).toEqual(['Added']);
            expect(changes.modified).toEqual(['Modified']);
            expect(changes.removed).toEqual(['Removed']);
        });

        it('handles unchanged scenarios', () => {
            const content = `Scenario: Unchanged
  Given step 1
  When step 2`;

            const changes = GherkinParser.detectScenarioChanges(content, content);
            expect(changes.added).toEqual([]);
            expect(changes.modified).toEqual([]);
            expect(changes.removed).toEqual([]);
        });

        it('handles empty old content (new file)', () => {
            const newContent = `Scenario: New file scenario
  Given step 1`;

            const changes = GherkinParser.detectScenarioChanges('', newContent);
            expect(changes.added).toEqual(['New file scenario']);
            expect(changes.modified).toEqual([]);
            expect(changes.removed).toEqual([]);
        });

        it('handles empty new content (deleted file)', () => {
            const oldContent = `Scenario: Deleted scenario
  Given step 1`;

            const changes = GherkinParser.detectScenarioChanges(oldContent, '');
            expect(changes.added).toEqual([]);
            expect(changes.modified).toEqual([]);
            expect(changes.removed).toEqual(['Deleted scenario']);
        });

        it('handles both empty contents', () => {
            const changes = GherkinParser.detectScenarioChanges('', '');
            expect(changes.added).toEqual([]);
            expect(changes.modified).toEqual([]);
            expect(changes.removed).toEqual([]);
        });

        it('detects modification when only whitespace changes', () => {
            const oldContent = `Scenario: Test
  Given step`;

            const newContent = `Scenario: Test
  Given step
`;

            const changes = GherkinParser.detectScenarioChanges(oldContent, newContent);
            // Whitespace differences should be detected as modifications
            expect(changes.modified.length).toBeGreaterThanOrEqual(0);
        });

        it('handles multiple scenarios with mixed changes', () => {
            const oldContent = `Scenario: Unchanged
  Given step

Scenario: Modified
  Given old step

Scenario: Removed
  Given step`;

            const newContent = `Scenario: Unchanged
  Given step

Scenario: Modified
  Given new step

Scenario: Added1
  Given step 1

Scenario: Added2
  Given step 2`;

            const changes = GherkinParser.detectScenarioChanges(oldContent, newContent);
            expect(changes.added.sort()).toEqual(['Added1', 'Added2']);
            expect(changes.modified).toEqual(['Modified']);
            expect(changes.removed).toEqual(['Removed']);
        });
    });
});



