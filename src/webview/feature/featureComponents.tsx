import React from 'react';

// Gherkin interfaces for structured editing
export interface GherkinStep {
  keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';
  text: string;
}

export interface GherkinScenario {
  title: string;
  steps: GherkinStep[];
}

export interface GherkinRule {
  title: string;
  examples: GherkinScenario[];
}

export interface ParsedFeatureContent {
  background: GherkinStep[];
  rules: GherkinRule[];
  scenarios: GherkinScenario[];
  otherContent: string; // Non-Gherkin content
}

// Parse Gherkin from feature content
export function parseFeatureContent(content: string): ParsedFeatureContent {
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
export function serializeFeatureContent(parsed: ParsedFeatureContent): string {
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

// TagInput Component
export function TagInput({ tags, onChange, readOnly }: { 
  tags: string[]; 
  onChange: (tags: string[]) => void;
  readOnly: boolean;
}) {
  const [inputValue, setInputValue] = React.useState('');

  const handleAddTag = () => {
    if (!inputValue.trim()) return;
    
    // Support comma-separated input
    const newTags = inputValue
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag && !tags.includes(tag));
    
    if (newTags.length > 0) {
      onChange([...tags, ...newTags]);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {tags.map((tag, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              background: 'var(--vscode-badge-background)',
              color: 'var(--vscode-badge-foreground)',
              borderRadius: 3,
              fontSize: 12,
              fontWeight: 500
            }}
          >
            <span>{tag}</span>
            {!readOnly && (
              <button
                onClick={() => handleRemoveTag(tag)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 14,
                  lineHeight: 1,
                  opacity: 0.8
                }}
                title="Remove tag"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      {!readOnly && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="form-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add tags (comma-separated)"
            style={{ flex: 1, fontSize: 12 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleAddTag}
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

// GherkinStepRow Component
export function GherkinStepRow({ 
  step, 
  index, 
  totalSteps,
  readOnly, 
  onUpdate, 
  onMoveUp, 
  onMoveDown, 
  onDelete 
}: {
  step: GherkinStep;
  index: number;
  totalSteps: number;
  readOnly: boolean;
  onUpdate: (keyword: string, text: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  if (readOnly) {
    return (
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        padding: '8px 12px', 
        background: 'var(--vscode-editor-background)',
        border: '1px solid var(--vscode-panel-border)',
        borderRadius: 4,
        marginBottom: 4,
        alignItems: 'center'
      }}>
        <span style={{ 
          fontWeight: 600, 
          color: 'var(--vscode-charts-blue)',
          minWidth: 60,
          fontSize: 12
        }}>
          {step.keyword}
        </span>
        <span style={{ flex: 1, fontSize: 13 }}>{step.text}</span>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      gap: 8, 
      marginBottom: 8,
      alignItems: 'center'
    }}>
      <select
        className="form-input"
        value={step.keyword}
        onChange={(e) => onUpdate(e.target.value, step.text)}
        style={{ width: 100, fontSize: 12 }}
      >
        <option value="Given">Given</option>
        <option value="When">When</option>
        <option value="Then">Then</option>
        <option value="And">And</option>
        <option value="But">But</option>
      </select>
      <input
        className="form-input"
        value={step.text}
        onChange={(e) => onUpdate(step.keyword, e.target.value)}
        style={{ flex: 1, fontSize: 13 }}
      />
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          className="btn btn-secondary"
          onClick={onMoveUp}
          disabled={index === 0}
          style={{ padding: '4px 8px', fontSize: 12 }}
          title="Move up"
        >
          ↑
        </button>
        <button
          className="btn btn-secondary"
          onClick={onMoveDown}
          disabled={index === totalSteps - 1}
          style={{ padding: '4px 8px', fontSize: 12 }}
          title="Move down"
        >
          ↓
        </button>
        <button
          className="btn btn-secondary"
          onClick={onDelete}
          style={{ padding: '4px 8px', fontSize: 12, color: 'var(--vscode-errorForeground)' }}
          title="Delete step"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// BackgroundSection Component
export function BackgroundSection({ 
  steps, 
  readOnly, 
  onChange 
}: {
  steps: GherkinStep[];
  readOnly: boolean;
  onChange: (steps: GherkinStep[]) => void;
}) {
  const updateStep = (index: number, keyword: string, text: string) => {
    const newSteps = [...steps];
    newSteps[index] = { keyword: keyword as any, text };
    onChange(newSteps);
  };

  const moveStepUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    onChange(newSteps);
  };

  const moveStepDown = (index: number) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    onChange(newSteps);
  };

  const deleteStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    onChange(newSteps);
  };

  const addStep = () => {
    onChange([...steps, { keyword: 'Given', text: '' }]);
  };

  if (steps.length === 0 && readOnly) {
    return null;
  }

  return (
    <div className="content-section">
      <h3 className="section-title">Background</h3>
      {steps.length === 0 && !readOnly && (
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
          No background defined
        </div>
      )}
      {steps.map((step, index) => (
        <GherkinStepRow
          key={index}
          step={step}
          index={index}
          totalSteps={steps.length}
          readOnly={readOnly}
          onUpdate={(keyword, text) => updateStep(index, keyword, text)}
          onMoveUp={() => moveStepUp(index)}
          onMoveDown={() => moveStepDown(index)}
          onDelete={() => deleteStep(index)}
        />
      ))}
      {!readOnly && (
        <button 
          className="btn btn-secondary" 
          onClick={addStep}
          style={{ marginTop: 8, fontSize: 12 }}
        >
          + Add Background Step
        </button>
      )}
    </div>
  );
}

// ExampleScenario Component (used within Rules)
export function ExampleScenario({ 
  example, 
  readOnly,
  onUpdate,
  onDelete
}: {
  example: GherkinScenario;
  readOnly: boolean;
  onUpdate: (example: GherkinScenario) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = React.useState(true);

  const updateStep = (index: number, keyword: string, text: string) => {
    const newSteps = [...example.steps];
    newSteps[index] = { keyword: keyword as any, text };
    onUpdate({ ...example, steps: newSteps });
  };

  const moveStepUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...example.steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    onUpdate({ ...example, steps: newSteps });
  };

  const moveStepDown = (index: number) => {
    if (index === example.steps.length - 1) return;
    const newSteps = [...example.steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    onUpdate({ ...example, steps: newSteps });
  };

  const deleteStep = (index: number) => {
    const newSteps = example.steps.filter((_, i) => i !== index);
    onUpdate({ ...example, steps: newSteps });
  };

  const addStep = () => {
    onUpdate({ ...example, steps: [...example.steps, { keyword: 'Given', text: '' }] });
  };

  const updateTitle = (title: string) => {
    onUpdate({ ...example, title });
  };

  return (
    <div style={{ 
      marginLeft: 20, 
      marginBottom: 16,
      border: '1px solid var(--vscode-panel-border)',
      borderRadius: 4,
      overflow: 'hidden'
    }}>
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center',
          padding: '10px 12px',
          background: 'var(--vscode-editor-background)',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid var(--vscode-panel-border)' : 'none'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ marginRight: 8, fontSize: 12 }}>
          {expanded ? '▼' : '▶'}
        </span>
        {readOnly ? (
          <span style={{ flex: 1, fontWeight: 500, fontSize: 13 }}>Example: {example.title}</span>
        ) : (
          <input
            className="form-input"
            value={example.title}
            onChange={(e) => updateTitle(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Example title"
            style={{ flex: 1, fontSize: 13, background: 'transparent', border: 'none', padding: 0 }}
          />
        )}
        {!readOnly && (
          <button
            className="btn btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{ padding: '4px 8px', fontSize: 12, marginLeft: 8 }}
          >
            Delete Example
          </button>
        )}
      </div>
      {expanded && (
        <div style={{ padding: 12 }}>
          {example.steps.map((step, index) => (
            <GherkinStepRow
              key={index}
              step={step}
              index={index}
              totalSteps={example.steps.length}
              readOnly={readOnly}
              onUpdate={(keyword, text) => updateStep(index, keyword, text)}
              onMoveUp={() => moveStepUp(index)}
              onMoveDown={() => moveStepDown(index)}
              onDelete={() => deleteStep(index)}
            />
          ))}
          {!readOnly && (
            <button 
              className="btn btn-secondary" 
              onClick={addStep}
              style={{ marginTop: 8, fontSize: 12 }}
            >
              + Add Step
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// RulesSection Component
export function RulesSection({ 
  rules, 
  readOnly, 
  onChange 
}: {
  rules: GherkinRule[];
  readOnly: boolean;
  onChange: (rules: GherkinRule[]) => void;
}) {
  const [expandedRules, setExpandedRules] = React.useState<Set<number>>(new Set([0]));

  const toggleRule = (index: number) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRules(newExpanded);
  };

  const updateRuleTitle = (index: number, title: string) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], title };
    onChange(newRules);
  };

  const deleteRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  const addRule = () => {
    onChange([...rules, { title: 'New Rule', examples: [] }]);
  };

  const addExampleToRule = (ruleIndex: number) => {
    const newRules = [...rules];
    newRules[ruleIndex].examples.push({ title: 'New Example', steps: [] });
    onChange(newRules);
  };

  const updateExample = (ruleIndex: number, exampleIndex: number, example: GherkinScenario) => {
    const newRules = [...rules];
    newRules[ruleIndex].examples[exampleIndex] = example;
    onChange(newRules);
  };

  const deleteExample = (ruleIndex: number, exampleIndex: number) => {
    const newRules = [...rules];
    newRules[ruleIndex].examples = newRules[ruleIndex].examples.filter((_, i) => i !== exampleIndex);
    onChange(newRules);
  };

  if (rules.length === 0 && readOnly) {
    return null;
  }

  return (
    <div className="content-section">
      <h3 className="section-title">Rules</h3>
      {rules.length === 0 && !readOnly && (
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
          No rules defined
        </div>
      )}
      {rules.map((rule, ruleIndex) => (
        <div 
          key={ruleIndex} 
          style={{ 
            marginBottom: 16,
            border: '1px solid var(--vscode-panel-border)',
            borderRadius: 4,
            overflow: 'hidden'
          }}
        >
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              padding: '12px 16px',
              background: 'var(--vscode-sideBar-background)',
              cursor: 'pointer',
              borderBottom: expandedRules.has(ruleIndex) ? '1px solid var(--vscode-panel-border)' : 'none'
            }}
            onClick={() => toggleRule(ruleIndex)}
          >
            <span style={{ marginRight: 8 }}>
              {expandedRules.has(ruleIndex) ? '▼' : '▶'}
            </span>
            {readOnly ? (
              <span style={{ flex: 1, fontWeight: 600 }}>Rule: {rule.title}</span>
            ) : (
              <input
                className="form-input"
                value={rule.title}
                onChange={(e) => updateRuleTitle(ruleIndex, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Rule title"
                style={{ flex: 1, background: 'transparent', border: 'none', padding: 0, fontWeight: 600 }}
              />
            )}
            {!readOnly && (
              <button
                className="btn btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteRule(ruleIndex);
                }}
                style={{ padding: '4px 8px', fontSize: 12, marginLeft: 8 }}
              >
                Delete Rule
              </button>
            )}
          </div>
          {expandedRules.has(ruleIndex) && (
            <div style={{ padding: 16 }}>
              {rule.examples.length === 0 && (
                <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
                  No examples for this rule
                </div>
              )}
              {rule.examples.map((example, exampleIndex) => (
                <ExampleScenario
                  key={exampleIndex}
                  example={example}
                  readOnly={readOnly}
                  onUpdate={(ex) => updateExample(ruleIndex, exampleIndex, ex)}
                  onDelete={() => deleteExample(ruleIndex, exampleIndex)}
                />
              ))}
              {!readOnly && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => addExampleToRule(ruleIndex)}
                  style={{ marginTop: 8, fontSize: 12 }}
                >
                  + Add Example to Rule
                </button>
              )}
            </div>
          )}
        </div>
      ))}
      {!readOnly && (
        <button 
          className="btn btn-secondary" 
          onClick={addRule}
          style={{ marginTop: 8, fontSize: 12 }}
        >
          + Add Rule
        </button>
      )}
    </div>
  );
}

// Scenario Indicator Component with Tooltip
export function ScenarioIndicator({ changeType }: { changeType: 'added' | 'modified' | 'removed' }) {
  const [showTooltip, setShowTooltip] = React.useState(false);
  
  const tooltipText = {
    added: 'Added in current session',
    modified: 'Modified in current session',
    removed: 'Removed in current session'
  }[changeType];

  // Get color using VSCode theme variables with fallbacks
  const indicatorColor = changeType === 'added' 
    ? 'var(--vscode-charts-green, #10B981)'
    : changeType === 'modified'
    ? 'var(--vscode-charts-yellow, #F59E0B)'
    : 'var(--vscode-charts-red, #EF4444)';

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        marginRight: 8
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: indicatorColor,
          verticalAlign: 'middle'
        }}
      />
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 4,
            padding: '4px 8px',
            backgroundColor: 'var(--vscode-editorWidget-background, #252526)',
            color: 'var(--vscode-editorWidget-foreground, #cccccc)',
            fontSize: 11,
            borderRadius: 3,
            whiteSpace: 'nowrap',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none'
          }}
        >
          {tooltipText}
        </div>
      )}
    </span>
  );
}

// ScenariosSection Component
export function ScenariosSection({ 
  scenarios, 
  readOnly, 
  onChange,
  scenarioChanges
}: {
  scenarios: GherkinScenario[];
  readOnly: boolean;
  onChange: (scenarios: GherkinScenario[]) => void;
  scenarioChanges?: { added: string[]; modified: string[]; removed: string[] } | null;
}) {
  const [expandedScenarios, setExpandedScenarios] = React.useState<Set<number>>(new Set([0]));

  // Helper function to determine change type for a scenario
  const getScenarioChangeType = (scenarioTitle: string): 'added' | 'modified' | 'removed' | null => {
    if (!scenarioChanges) {
      return null;
    }
    
    if (scenarioChanges.added.includes(scenarioTitle)) {
      return 'added';
    }
    if (scenarioChanges.modified.includes(scenarioTitle)) {
      return 'modified';
    }
    if (scenarioChanges.removed.includes(scenarioTitle)) {
      return 'removed';
    }
    
    return null;
  };

  const toggleScenario = (index: number) => {
    const newExpanded = new Set(expandedScenarios);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedScenarios(newExpanded);
  };

  const updateScenarioTitle = (index: number, title: string) => {
    const newScenarios = [...scenarios];
    newScenarios[index] = { ...newScenarios[index], title };
    onChange(newScenarios);
  };

  const updateStep = (scenarioIndex: number, stepIndex: number, keyword: string, text: string) => {
    const newScenarios = [...scenarios];
    newScenarios[scenarioIndex].steps[stepIndex] = { keyword: keyword as any, text };
    onChange(newScenarios);
  };

  const moveStepUp = (scenarioIndex: number, stepIndex: number) => {
    if (stepIndex === 0) return;
    const newScenarios = [...scenarios];
    const steps = newScenarios[scenarioIndex].steps;
    [steps[stepIndex - 1], steps[stepIndex]] = [steps[stepIndex], steps[stepIndex - 1]];
    onChange(newScenarios);
  };

  const moveStepDown = (scenarioIndex: number, stepIndex: number) => {
    const newScenarios = [...scenarios];
    const steps = newScenarios[scenarioIndex].steps;
    if (stepIndex === steps.length - 1) return;
    [steps[stepIndex], steps[stepIndex + 1]] = [steps[stepIndex + 1], steps[stepIndex]];
    onChange(newScenarios);
  };

  const deleteStep = (scenarioIndex: number, stepIndex: number) => {
    const newScenarios = [...scenarios];
    newScenarios[scenarioIndex].steps = newScenarios[scenarioIndex].steps.filter((_, i) => i !== stepIndex);
    onChange(newScenarios);
  };

  const addStep = (scenarioIndex: number) => {
    const newScenarios = [...scenarios];
    newScenarios[scenarioIndex].steps.push({ keyword: 'Given', text: '' });
    onChange(newScenarios);
  };

  const deleteScenario = (index: number) => {
    onChange(scenarios.filter((_, i) => i !== index));
  };

  const addScenario = () => {
    onChange([...scenarios, { title: 'New Scenario', steps: [] }]);
  };

  if (scenarios.length === 0 && readOnly) {
    return null;
  }

  return (
    <div className="content-section">
      <h3 className="section-title">Scenarios</h3>
      {scenarios.length === 0 && !readOnly && (
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
          No scenarios defined
        </div>
      )}
      {scenarios.map((scenario, scenarioIndex) => (
        <div 
          key={scenarioIndex} 
          style={{ 
            marginBottom: 16,
            border: '1px solid var(--vscode-panel-border)',
            borderRadius: 4,
            overflow: 'hidden'
          }}
        >
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              padding: '12px 16px',
              background: 'var(--vscode-sideBar-background)',
              cursor: 'pointer',
              borderBottom: expandedScenarios.has(scenarioIndex) ? '1px solid var(--vscode-panel-border)' : 'none'
            }}
            onClick={() => toggleScenario(scenarioIndex)}
          >
            <span style={{ marginRight: 8 }}>
              {expandedScenarios.has(scenarioIndex) ? '▼' : '▶'}
            </span>
            {scenarioChanges && (() => {
              const changeType = getScenarioChangeType(scenario.title);
              return changeType ? <ScenarioIndicator changeType={changeType} /> : null;
            })()}
            {readOnly ? (
              <span style={{ flex: 1, fontWeight: 600 }}>Scenario: {scenario.title}</span>
            ) : (
              <input
                className="form-input"
                value={scenario.title}
                onChange={(e) => updateScenarioTitle(scenarioIndex, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Scenario title"
                style={{ flex: 1, background: 'transparent', border: 'none', padding: 0, fontWeight: 600 }}
              />
            )}
            {!readOnly && (
              <button
                className="btn btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteScenario(scenarioIndex);
                }}
                style={{ padding: '4px 8px', fontSize: 12, marginLeft: 8 }}
              >
                Delete Scenario
              </button>
            )}
          </div>
          {expandedScenarios.has(scenarioIndex) && (
            <div style={{ padding: 16 }}>
              {scenario.steps.length === 0 && (
                <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
                  No steps in this scenario
                </div>
              )}
              {scenario.steps.map((step, stepIndex) => (
                <GherkinStepRow
                  key={stepIndex}
                  step={step}
                  index={stepIndex}
                  totalSteps={scenario.steps.length}
                  readOnly={readOnly}
                  onUpdate={(keyword, text) => updateStep(scenarioIndex, stepIndex, keyword, text)}
                  onMoveUp={() => moveStepUp(scenarioIndex, stepIndex)}
                  onMoveDown={() => moveStepDown(scenarioIndex, stepIndex)}
                  onDelete={() => deleteStep(scenarioIndex, stepIndex)}
                />
              ))}
              {!readOnly && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => addStep(scenarioIndex)}
                  style={{ marginTop: 8, fontSize: 12 }}
                >
                  + Add Step
                </button>
              )}
            </div>
          )}
        </div>
      ))}
      {!readOnly && (
        <button 
          className="btn btn-secondary" 
          onClick={addScenario}
          style={{ marginTop: 8, fontSize: 12 }}
        >
          + Add Scenario
        </button>
      )}
    </div>
  );
}

// FeatureFrontmatter Component
export function FeatureFrontmatter({ frontmatter, onChange, readOnly }: { 
  frontmatter: any; 
  onChange: (key: string, value: any) => void;
  readOnly: boolean;
}) {
  return (
    <>
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500 }}>
          Feature ID
        </label>
        <input 
          className="form-input"
          value={frontmatter.feature_id || ''}
          onChange={(e) => onChange('feature_id', e.target.value)}
          readOnly={readOnly}
        />
      </div>
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500 }}>
          Tags
        </label>
        <TagInput
          tags={Array.isArray(frontmatter.tags) ? frontmatter.tags : []}
          onChange={(tags) => onChange('tags', tags)}
          readOnly={readOnly}
        />
      </div>
    </>
  );
}
