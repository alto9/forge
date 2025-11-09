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
}



