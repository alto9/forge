/**
 * File templates for creating new Forge documents
 */

export interface DiagramTemplate {
    diagram_id: string;
    name: string;
    description: string;
    diagram_type: string;
    feature_id: string[];
    actor_id: string[];
}

export interface SpecTemplate {
    spec_id: string;
    name: string;
    description: string;
    feature_id: string[];
    diagram_id: string[];
}

export interface ActorTemplate {
    actor_id: string;
    name: string;
    type: string;
    description: string;
}

export interface SessionTemplate {
    session_id: string;
    start_time: string;
    status: string;
    problem_statement: string;
    changed_files: any[];
}

/**
 * Generate diagram file template
 */
export function generateDiagramTemplate(name: string): string {
    const id = nameToId(name);
    return `---
diagram_id: ${id}
name: ${name}
description: ${name} diagram
diagram_type: architecture
feature_id: []
actor_id: []
---

# ${name}

\`\`\`nomnoml
#direction: down
#padding: 10

[${name}]
\`\`\`

## Description

Add your diagram description here.
`;
}

/**
 * Generate specification file template
 */
export function generateSpecTemplate(name: string): string {
    const id = nameToId(name);
    return `---
spec_id: ${id}
name: ${name}
description: ${name} specification
feature_id: []
diagram_id: []
---

# ${name}

## Overview

Add your specification overview here.

## Architecture

See diagrams:
- [Add diagram references here]

## Technical Details

Add technical implementation details here.

## API/Interface

Add API or interface details here.
`;
}

/**
 * Generate actor file template
 */
export function generateActorTemplate(name: string, type: 'human' | 'system' | 'external' = 'system'): string {
    const id = nameToId(name);
    return `---
actor_id: ${id}
name: ${name}
type: ${type}
description: ${name} actor
---

# ${name} Actor

## Profile
Add actor profile here.

## Goals
- Add actor goals here

## Responsibilities
- Add actor responsibilities here

## Skills
- Add actor skills or capabilities here

## Context
Add additional context about this actor.
`;
}

/**
 * Parse GitHub issue body to extract structured fields
 */
function parseGitHubIssueBody(body: string): {
    problemStatement: string;
    proposedSolution: string;
    alternativesConsidered: string;
    useCases: string;
    priority: string;
    additionalContext: string;
} {
    const problemMatch = body.match(/### Problem Statement\s*\n([\s\S]*?)(?=\n### |\Z)/i);
    const solutionMatch = body.match(/### Proposed Solution\s*\n([\s\S]*?)(?=\n### |\Z)/i);
    const alternativesMatch = body.match(/### Alternatives Considered\s*\n([\s\S]*?)(?=\n### |\Z)/i);
    const useCasesMatch = body.match(/### Use Cases\s*\n([\s\S]*?)(?=\n### |\Z)/i);
    const priorityMatch = body.match(/### Priority\s*\n([\s\S]*?)(?=\n### |\Z)/i);
    const contextMatch = body.match(/### Additional Context\s*\n([\s\S]*?)(?=\n### |\Z)/i);
    
    let priority = 'Medium - Would be helpful';
    if (priorityMatch) {
        const priorityText = priorityMatch[1].trim();
        if (priorityText.includes('Low')) priority = 'Low - Nice to have';
        else if (priorityText.includes('High')) priority = 'High - Important for my workflow';
        else if (priorityText.includes('Critical')) priority = 'Critical - Blocking my use of Forge';
    }
    
    return {
        problemStatement: problemMatch ? problemMatch[1].trim() : '',
        proposedSolution: solutionMatch ? solutionMatch[1].trim() : 'Add your proposed solution here.',
        alternativesConsidered: alternativesMatch ? alternativesMatch[1].trim() : '- Add alternatives you\'ve considered',
        useCases: useCasesMatch ? useCasesMatch[1].trim() : '- Add specific use cases where this would be useful',
        priority,
        additionalContext: contextMatch ? contextMatch[1].trim() : 'Add any additional notes, mockups, or context here.'
    };
}

/**
 * Generate session file template
 */
export function generateSessionTemplate(name: string, issueBody: string, githubIssue?: string, issueTitle?: string): string {
    const id = nameToId(name);
    const startTime = new Date().toISOString();
    const githubIssueField = githubIssue ? `github_issue: '${githubIssue}'` : `github_issue: ''`;
    const issueTitleField = issueTitle ? `issue_title: '${issueTitle.replace(/'/g, "''")}'` : `issue_title: ''`;
    
    // Parse issue body to extract fields
    const parsed = issueBody ? parseGitHubIssueBody(issueBody) : {
        problemStatement: 'Describe the problem to solve...',
        proposedSolution: 'Add your proposed solution here.',
        alternativesConsidered: '- Add alternatives you\'ve considered',
        useCases: '- Add specific use cases where this would be useful',
        priority: 'Medium - Would be helpful',
        additionalContext: 'Add any additional notes, mockups, or context here.'
    };
    
    return `---
session_id: ${id}
${githubIssueField}
${issueTitleField}
start_time: '${startTime}'
status: planning
problem_statement: ${parsed.problemStatement || 'Describe the problem to solve...'}
priority: ${parsed.priority}
changed_files: []
---

# ${name} Session

## Problem Statement
${parsed.problemStatement}

## Proposed Solution
${parsed.proposedSolution}

## Alternatives Considered
${parsed.alternativesConsidered}

## Use Cases
${parsed.useCases}

## Additional Context
${parsed.additionalContext}
`;
}

/**
 * Convert a name to a valid ID (lowercase, hyphenated)
 */
function nameToId(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
