import { ForgeFileManager } from './ForgeFileManager.js';

export interface NewDecisionData {
  whatIsChanging: string;
  whyIsItChanging: string;
  proposedChange: string;
  optionsConsidered: string;
}

export class PromptBuilder {
  constructor(private fileManager: ForgeFileManager) {}

  async generateNewDecisionPrompt(data: NewDecisionData): Promise<string> {
    const timestamp = new Date().toISOString().split('T')[0];
    const decisionId = this.generateDecisionId(data.proposedChange);

    return `Create a new decision document in the ai/decisions folder with the following details:

**Decision ID**: ${decisionId}
**Filename**: ai/decisions/${decisionId}.decision.md
**Date**: ${timestamp}

**What is changing:**
${data.whatIsChanging}

**Why is it changing:**
${data.whyIsItChanging}

**Proposed change summary:**
${data.proposedChange}

**Options considered:**
${data.optionsConsidered}

Please create this decision document using the Architecture Decision Record (ADR) format with the following structure:

---
decision_id: ${decisionId}
date: ${timestamp}
status: proposed
---

# ${this.toTitleCase(decisionId.replace(/-/g, ' '))}

## Status
Proposed

## Context
${data.whyIsItChanging}

## Decision
${data.proposedChange}

## Alternatives Considered
${data.optionsConsidered}

## Consequences
[To be filled in - what are the positive and negative consequences of this decision?]

## References
[Any relevant documentation, links, or related decisions]

Ensure the ai/decisions folder exists, and create it if it doesn't. Use proper markdown formatting and ensure the frontmatter is valid YAML.`;
  }

  async generateDistillPrompt(decisionId: string): Promise<string> {
    const decisions = await this.fileManager.listDecisions();
    const decision = decisions.find((d) => d.id === decisionId);

    if (!decision) {
      throw new Error(`Decision not found: ${decisionId}`);
    }

    const features = await this.fileManager.listFeatures();
    const specs = await this.fileManager.listSpecs();

    let prompt = `Review and distill the following decision into features and specs:

**Decision ID**: ${decisionId}
**Decision File**: ai/decisions/${decisionId}.decision.md

STEP 0: Call the get_forge_objects tool to retrieve the list of supported spec objects and their guidance. Use this knowledge to design specs that leverage supported spec objects where appropriate.

**Task**: Analyze this decision and ensure that:

1. **Features** in ai/features/ fully capture the user-facing functionality described in this decision
   - Each feature should be in Gherkin format with GIVEN/WHEN/THEN scenarios
   - Features should reference relevant spec_ids in their frontmatter
   - Create new feature files if needed or update existing ones

2. **Specs** in ai/specs/ provide the technical specifications for implementing these features
   - Specs should include technical details, architecture decisions, and diagram references where appropriate (diagrams are created separately as diagram files)
   - Specs should reference relevant feature_ids in their frontmatter
   - Create new spec files if needed or update existing ones

`;

    if (features.length > 0) {
      prompt += `**Existing Features**:\n`;
      for (const feature of features) {
        prompt += `- ${feature.id}\n`;
      }
      prompt += '\n';
    }

    if (specs.length > 0) {
      prompt += `**Existing Specs**:\n`;
      for (const spec of specs) {
        prompt += `- ${spec.id}\n`;
      }
      prompt += '\n';
    }

    prompt += `Review the decision and determine what features and specs need to be created or updated. Ensure complete coverage of the decision's requirements while maintaining proper relationships between features and specs.

When drafting specs, prefer using supported spec objects from get_forge_objects when they fit the need, aligning the spec content to the provided guidance.`;

    return prompt;
  }

  async generateTasksPrompt(decisionId: string): Promise<string> {
    const decisions = await this.fileManager.listDecisions();
    const decision = decisions.find((d) => d.id === decisionId);

    if (!decision) {
      throw new Error(`Decision not found: ${decisionId}`);
    }

    const features = await this.fileManager.listFeatures();
    const specs = await this.fileManager.listSpecs();

    // Find related features and specs based on decision_id
    const relatedFeatures = features.filter(
      (f) => f.frontmatter.decision_id === decisionId || (f.frontmatter.decision_id as string[])?.includes(decisionId)
    );
    const relatedSpecs = specs.filter(
      (s) => s.frontmatter.decision_id === decisionId || (s.frontmatter.decision_id as string[])?.includes(decisionId)
    );

    let prompt = `Convert the following decision into specific implementation tasks:

**Decision ID**: ${decisionId}
**Decision File**: ai/decisions/${decisionId}.decision.md

`;

    if (relatedFeatures.length > 0) {
      prompt += `\n**Related Features**:\n`;
      for (const feature of relatedFeatures) {
        prompt += `- ${feature.id}: ai/features/${feature.id}.feature.md\n`;
      }
    }

    if (relatedSpecs.length > 0) {
      prompt += `\n**Related Specs**:\n`;
      for (const spec of relatedSpecs) {
        prompt += `- ${spec.id}: ai/specs/${spec.id}.spec.md\n`;
      }
    }

    prompt += `\n\nSTEP 1: Read the decision file and all related files listed above

Read each file to understand the full context:
- Read the decision file to understand what is being decided
- Read related features to understand the expected behavior
- Read related specs to understand the technical implementation details

STEP 3: Create specific, actionable tasks in the ai/tasks/ folder that will implement this decision.

Requirements:
1. Each task should be a separate markdown file with a .task.md extension
2. Tasks should be specific and implementable
3. Include all necessary context references from features, specs, and contexts
4. Tasks should be ordered logically with clear dependencies
5. Each task should have clear acceptance criteria

Analyze all the provided information and create a complete set of tasks that will implement this decision. Be thorough but specific - tasks should be actionable and contain all the information needed for implementation.`;

    return prompt;
  }

  private generateDecisionId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }

  private toTitleCase(str: string): string {
    return str
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

