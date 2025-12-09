import { describe, it, expect } from 'vitest';

// Types matching the implementation
interface GherkinStep {
  keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';
  text: string;
}

interface GherkinScenario {
  title: string;
  steps: GherkinStep[];
}

interface GherkinRule {
  title: string;
  examples: GherkinScenario[];
}

interface ParsedFeatureContent {
  background: GherkinStep[];
  rules: GherkinRule[];
  scenarios: GherkinScenario[];
  otherContent: string;
}

// Parse Gherkin from feature content
function parseFeatureContent(content: string): ParsedFeatureContent {
  const result: ParsedFeatureContent = {
    background: [],
    rules: [],
    scenarios: [],
    otherContent: ''
  };

  // Extract all Gherkin code blocks
  const gherkinBlockRegex = /```gherkin\s*\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;
  
  while ((match = gherkinBlockRegex.exec(content)) !== null) {
    blocks.push(match[1]);
  }

  // Parse each block
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    let i = 0;
    let currentScenario: GherkinScenario | null = null;
    let currentRule: GherkinRule | null = null;
    let inBackground = false;

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith('Feature:')) {
        i++;
        continue;
      }

      if (line.startsWith('Background:')) {
        inBackground = true;
        i++;
        continue;
      }

      if (line.startsWith('Rule:')) {
        if (currentScenario && !currentRule) {
          result.scenarios.push(currentScenario);
          currentScenario = null;
        }
        if (currentRule) {
          result.rules.push(currentRule);
        }
        currentRule = {
          title: line.substring(5).trim(),
          examples: []
        };
        inBackground = false;
        i++;
        continue;
      }

      if (line.startsWith('Scenario:') || line.startsWith('Example:')) {
        if (currentScenario) {
          if (currentRule) {
            currentRule.examples.push(currentScenario);
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
        i++;
        continue;
      }

      // Parse steps
      const stepMatch = /^(Given|When|Then|And|But)\s+(.*)$/i.exec(line);
      if (stepMatch) {
        const step: GherkinStep = {
          keyword: stepMatch[1].charAt(0).toUpperCase() + stepMatch[1].slice(1).toLowerCase() as any,
          text: stepMatch[2]
        };

        if (inBackground) {
          result.background.push(step);
        } else if (currentScenario) {
          currentScenario.steps.push(step);
        }
      }

      i++;
    }

    // Finalize
    if (currentScenario) {
      if (currentRule) {
        currentRule.examples.push(currentScenario);
      } else {
        result.scenarios.push(currentScenario);
      }
    }
    if (currentRule) {
      result.rules.push(currentRule);
    }
  }

  // Extract non-Gherkin content
  const withoutGherkin = content.replace(/```gherkin\s*\n[\s\S]*?```/g, '').trim();
  result.otherContent = withoutGherkin;

  return result;
}

// Serialize back to Gherkin markdown
function serializeFeatureContent(parsed: ParsedFeatureContent): string {
  const gherkinBlocks: string[] = [];

  // Background
  if (parsed.background.length > 0) {
    let block = 'Background:\n';
    for (const step of parsed.background) {
      block += `  ${step.keyword} ${step.text}\n`;
    }
    gherkinBlocks.push('```gherkin\n' + block.trim() + '\n```');
  }

  // Rules
  for (const rule of parsed.rules) {
    let block = `Rule: ${rule.title}\n`;
    for (const example of rule.examples) {
      block += `  Example: ${example.title}\n`;
      for (const step of example.steps) {
        block += `    ${step.keyword} ${step.text}\n`;
      }
      block += '\n';
    }
    gherkinBlocks.push('```gherkin\n' + block.trim() + '\n```');
  }

  // Scenarios
  for (const scenario of parsed.scenarios) {
    let block = `Scenario: ${scenario.title}\n`;
    for (const step of scenario.steps) {
      block += `  ${step.keyword} ${step.text}\n`;
    }
    gherkinBlocks.push('```gherkin\n' + block.trim() + '\n```');
  }

  return gherkinBlocks.join('\n\n');
}

describe('Feature Content Parser', () => {
  describe('parseFeatureContent', () => {
    it('should parse a simple scenario', () => {
      const content = `
\`\`\`gherkin
Scenario: User logs in
  Given a registered user
  When they enter valid credentials
  Then they should be logged in
\`\`\`
      `;

      const result = parseFeatureContent(content);

      expect(result.scenarios).toHaveLength(1);
      expect(result.scenarios[0].title).toBe('User logs in');
      expect(result.scenarios[0].steps).toHaveLength(3);
      expect(result.scenarios[0].steps[0]).toEqual({
        keyword: 'Given',
        text: 'a registered user'
      });
      expect(result.background).toHaveLength(0);
      expect(result.rules).toHaveLength(0);
    });

    it('should parse background', () => {
      const content = `
\`\`\`gherkin
Background:
  Given the system is configured
  And users can register
\`\`\`
      `;

      const result = parseFeatureContent(content);

      expect(result.background).toHaveLength(2);
      expect(result.background[0]).toEqual({
        keyword: 'Given',
        text: 'the system is configured'
      });
      expect(result.background[1]).toEqual({
        keyword: 'And',
        text: 'users can register'
      });
    });

    it('should parse rules with examples', () => {
      const content = `
\`\`\`gherkin
Rule: Password requirements
  Example: Valid password
    Given a user with password "SecurePass123"
    When they submit the form
    Then the password should be accepted
    
  Example: Invalid password
    Given a user with password "weak"
    When they submit the form
    Then they should see an error
\`\`\`
      `;

      const result = parseFeatureContent(content);

      expect(result.rules).toHaveLength(1);
      expect(result.rules[0].title).toBe('Password requirements');
      expect(result.rules[0].examples).toHaveLength(2);
      expect(result.rules[0].examples[0].title).toBe('Valid password');
      expect(result.rules[0].examples[0].steps).toHaveLength(3);
      expect(result.rules[0].examples[1].title).toBe('Invalid password');
    });

    it('should parse multiple gherkin blocks', () => {
      const content = `
# Feature Title

\`\`\`gherkin
Background:
  Given the system is ready
\`\`\`

\`\`\`gherkin
Scenario: First scenario
  When something happens
  Then a result occurs
\`\`\`

\`\`\`gherkin
Rule: Business rule
  Example: Rule example
    Given a condition
    Then an outcome
\`\`\`
      `;

      const result = parseFeatureContent(content);

      expect(result.background).toHaveLength(1);
      expect(result.scenarios).toHaveLength(1);
      expect(result.rules).toHaveLength(1);
    });

    it('should handle mixed content', () => {
      const content = `
---
feature_id: test-feature
---

# Test Feature

Some description here

\`\`\`gherkin
Scenario: Test scenario
  Given a condition
  Then an outcome
\`\`\`

More text here
      `;

      const result = parseFeatureContent(content);

      expect(result.scenarios).toHaveLength(1);
      expect(result.otherContent).toContain('---');
      expect(result.otherContent).toContain('# Test Feature');
    });
  });

  describe('serializeFeatureContent', () => {
    it('should serialize background', () => {
      const parsed: ParsedFeatureContent = {
        background: [
          { keyword: 'Given', text: 'the system is ready' },
          { keyword: 'And', text: 'users can login' }
        ],
        rules: [],
        scenarios: [],
        otherContent: ''
      };

      const result = serializeFeatureContent(parsed);

      expect(result).toContain('```gherkin');
      expect(result).toContain('Background:');
      expect(result).toContain('Given the system is ready');
      expect(result).toContain('And users can login');
    });

    it('should serialize scenarios', () => {
      const parsed: ParsedFeatureContent = {
        background: [],
        rules: [],
        scenarios: [
          {
            title: 'User logs in',
            steps: [
              { keyword: 'Given', text: 'a registered user' },
              { keyword: 'When', text: 'they enter credentials' },
              { keyword: 'Then', text: 'they are logged in' }
            ]
          }
        ],
        otherContent: ''
      };

      const result = serializeFeatureContent(parsed);

      expect(result).toContain('Scenario: User logs in');
      expect(result).toContain('Given a registered user');
      expect(result).toContain('When they enter credentials');
      expect(result).toContain('Then they are logged in');
    });

    it('should serialize rules with examples', () => {
      const parsed: ParsedFeatureContent = {
        background: [],
        rules: [
          {
            title: 'Password requirements',
            examples: [
              {
                title: 'Valid password',
                steps: [
                  { keyword: 'Given', text: 'a strong password' },
                  { keyword: 'Then', text: 'it is accepted' }
                ]
              }
            ]
          }
        ],
        scenarios: [],
        otherContent: ''
      };

      const result = serializeFeatureContent(parsed);

      expect(result).toContain('Rule: Password requirements');
      expect(result).toContain('Example: Valid password');
      expect(result).toContain('Given a strong password');
      expect(result).toContain('Then it is accepted');
    });

    it('should roundtrip parse and serialize', () => {
      const originalContent = `
\`\`\`gherkin
Background:
  Given the system is configured
\`\`\`

\`\`\`gherkin
Rule: Business rule
  Example: Valid case
    Given a condition
    Then an outcome
\`\`\`

\`\`\`gherkin
Scenario: Test scenario
  When something happens
  Then a result occurs
\`\`\`
      `.trim();

      const parsed = parseFeatureContent(originalContent);
      const serialized = serializeFeatureContent(parsed);
      const reparsed = parseFeatureContent(serialized);

      // Check that the structure is preserved
      expect(reparsed.background).toEqual(parsed.background);
      expect(reparsed.rules).toEqual(parsed.rules);
      expect(reparsed.scenarios).toEqual(parsed.scenarios);
    });
  });
});


