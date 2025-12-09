export interface GherkinStep {
    keyword: 'GIVEN' | 'WHEN' | 'THEN' | 'AND' | 'BUT' | 'Given' | 'When' | 'Then' | 'And' | 'But';
    text: string;
}

export interface GherkinScenario {
    title?: string;
    steps: GherkinStep[];
}

export interface GherkinBackground {
    steps: GherkinStep[];
}

export interface GherkinRule {
    title: string;
    scenarios: GherkinScenario[];
}

export interface ParsedGherkin {
    feature?: string;
    background?: GherkinBackground;
    scenarios: GherkinScenario[];
    rules: GherkinRule[];
}

export interface ScenarioChanges {
    added: string[];
    modified: string[];
    removed: string[];
}

export class GherkinParser {
    /**
     * Extract Gherkin content from code blocks (```gherkin ... ```)
     */
    static extractFromCodeBlocks(content: string): string[] {
        const regex = /```gherkin\s*\n([\s\S]*?)```/g;
        const blocks: string[] = [];
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            blocks.push(match[1]);
        }
        
        return blocks;
    }

    /**
     * Parse Gherkin content (handles Feature, Background, Scenario, Rule)
     */
    static parseGherkin(gherkinContent: string): ParsedGherkin {
        const lines = gherkinContent.split(/\r?\n/);
        const result: ParsedGherkin = {
            scenarios: [],
            rules: []
        };
        
        let currentScenario: GherkinScenario | undefined;
        let currentRule: GherkinRule | undefined;
        let inBackground = false;
        let backgroundSteps: GherkinStep[] = [];

        for (const raw of lines) {
            const line = raw.trim();
            if (!line) continue;

            // Feature line
            if (line.startsWith('Feature:')) {
                result.feature = line.substring('Feature:'.length).trim();
                continue;
            }

            // Background
            if (line.startsWith('Background:')) {
                inBackground = true;
                backgroundSteps = [];
                continue;
            }

            // Rule
            if (line.startsWith('Rule:')) {
                if (currentScenario) {
                    if (currentRule) {
                        currentRule.scenarios.push(currentScenario);
                    } else {
                        result.scenarios.push(currentScenario);
                    }
                    currentScenario = undefined;
                }
                if (currentRule) {
                    result.rules.push(currentRule);
                }
                currentRule = {
                    title: line.substring('Rule:'.length).trim(),
                    scenarios: []
                };
                inBackground = false;
                continue;
            }

            // Scenario or Example
            if (line.startsWith('Scenario:') || line.startsWith('Example:')) {
                if (currentScenario) {
                    if (currentRule) {
                        currentRule.scenarios.push(currentScenario);
                    } else {
                        result.scenarios.push(currentScenario);
                    }
                }
                const prefix = line.startsWith('Scenario:') ? 'Scenario:' : 'Example:';
                currentScenario = { 
                    title: line.substring(prefix.length).trim(), 
                    steps: [] 
                };
                inBackground = false;
                continue;
            }

            // Steps (Given, When, Then, And, But)
            const stepMatch = /^(Given|When|Then|And|But)\s+(.*)$/i.exec(line);
            if (stepMatch) {
                const step: GherkinStep = {
                    keyword: stepMatch[1] as any,
                    text: stepMatch[2]
                };

                if (inBackground) {
                    backgroundSteps.push(step);
                } else if (currentScenario) {
                    currentScenario.steps.push(step);
                }
            }
        }

        // Finalize
        if (backgroundSteps.length > 0) {
            result.background = { steps: backgroundSteps };
        }
        if (currentScenario) {
            if (currentRule) {
                currentRule.scenarios.push(currentScenario);
            } else {
                result.scenarios.push(currentScenario);
            }
        }
        if (currentRule) {
            result.rules.push(currentRule);
        }

        return result;
    }

    /**
     * Parse markdown content that contains Gherkin code blocks
     */
    static parse(content: string): ParsedGherkin[] {
        const blocks = this.extractFromCodeBlocks(content);
        return blocks.map(block => this.parseGherkin(block));
    }

    /**
     * Serialize Gherkin back to code block format
     */
    static serialize(parsed: ParsedGherkin): string {
        const lines: string[] = [];

        if (parsed.feature) {
            lines.push(`Feature: ${parsed.feature}`);
            lines.push('');
        }

        if (parsed.background) {
            lines.push('Background:');
            for (const step of parsed.background.steps) {
                lines.push(`  ${step.keyword} ${step.text}`);
            }
            lines.push('');
        }

        for (const scenario of parsed.scenarios) {
            if (scenario.title) {
                lines.push(`Scenario: ${scenario.title}`);
            }
            for (const step of scenario.steps) {
                lines.push(`  ${step.keyword} ${step.text}`);
            }
            lines.push('');
        }

        for (const rule of parsed.rules) {
            lines.push(`Rule: ${rule.title}`);
            for (const scenario of rule.scenarios) {
                if (scenario.title) {
                    lines.push(`  Example: ${scenario.title}`);
                }
                for (const step of scenario.steps) {
                    lines.push(`    ${step.keyword} ${step.text}`);
                }
                lines.push('');
            }
        }

        return '```gherkin\n' + lines.join('\n').trim() + '\n```';
    }

    /**
     * Extract scenario names from Gherkin content.
     * Works with raw Gherkin content (not markdown with code blocks).
     * 
     * @param content Raw Gherkin content string
     * @returns Array of scenario names
     */
    static extractScenarios(content: string): string[] {
        const scenarioPattern = /^\s*Scenario:\s*(.+)$/gm;
        const scenarios: string[] = [];
        
        let match;
        while ((match = scenarioPattern.exec(content)) !== null) {
            scenarios.push(match[1].trim());
        }
        
        return scenarios;
    }

    /**
     * Build a map of scenario name to full scenario content.
     * Includes all steps (Given/When/Then/And/But) for each scenario.
     * 
     * @param content Raw Gherkin content string
     * @returns Map of scenario name → scenario content (all steps)
     */
    static buildScenarioMap(content: string): Record<string, string> {
        const map: Record<string, string> = {};
        const lines = content.split(/\r?\n/);
        
        let currentScenario: { name: string; content: string[] } | null = null;
        
        for (const line of lines) {
            // Check if this is a Scenario or Example line
            const scenarioMatch = /^\s*Scenario:\s*(.+)$/i.exec(line);
            const exampleMatch = /^\s*Example:\s*(.+)$/i.exec(line);
            
            if (scenarioMatch || exampleMatch) {
                // Save previous scenario if exists
                if (currentScenario) {
                    map[currentScenario.name] = currentScenario.content.join('\n').trim();
                }
                // Start new scenario
                const scenarioName = scenarioMatch ? scenarioMatch[1].trim() : exampleMatch![1].trim();
                currentScenario = {
                    name: scenarioName,
                    content: []
                };
                continue;
            }
            
            // If we're in a scenario, collect its content
            if (currentScenario) {
                // Stop collecting if we hit Feature, Background, or Rule headers
                if (/^\s*(Feature|Background|Rule):/i.test(line)) {
                    // Save current scenario and stop collecting
                    map[currentScenario.name] = currentScenario.content.join('\n').trim();
                    currentScenario = null;
                    continue;
                }
                
                // Collect all content for the scenario (steps, blank lines, tables, etc.)
                currentScenario.content.push(line);
            }
        }
        
        // Save last scenario if exists
        if (currentScenario) {
            map[currentScenario.name] = currentScenario.content.join('\n').trim();
        }
        
        return map;
    }

    /**
     * Detect scenario-level changes between old and new Gherkin content.
     * Identifies scenarios that were added, modified, or removed.
     * 
     * @param oldContent Old Gherkin content
     * @param newContent New Gherkin content
     * @returns Object with arrays of added, modified, and removed scenario names
     */
    static detectScenarioChanges(oldContent: string, newContent: string): ScenarioChanges {
        const oldMap = this.buildScenarioMap(oldContent);
        const newMap = this.buildScenarioMap(newContent);
        
        const added: string[] = [];
        const modified: string[] = [];
        const removed: string[] = [];
        
        // Find added and modified scenarios
        for (const [name, content] of Object.entries(newMap)) {
            if (!oldMap[name]) {
                added.push(name);
            } else if (oldMap[name] !== content) {
                modified.push(name);
            }
        }
        
        // Find removed scenarios
        for (const name of Object.keys(oldMap)) {
            if (!newMap[name]) {
                removed.push(name);
            }
        }
        
        return { added, modified, removed };
    }
}



