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
 * Generate session file template
 */
export function generateSessionTemplate(name: string, problemStatement: string, githubIssue?: string): string {
    const id = nameToId(name);
    const startTime = new Date().toISOString();
    const githubIssueField = githubIssue ? `github_issue: '${githubIssue}'` : `github_issue: ''`;
    return `---
session_id: ${id}
${githubIssueField}
start_time: '${startTime}'
status: planning
problem_statement: ${problemStatement}
priority: Medium - Would be helpful
changed_files: []
---

# ${name} Session

## Problem Statement
${problemStatement}

## Proposed Solution
Add your proposed solution here.

## Alternatives Considered
- Add alternatives you've considered

## Use Cases
- Add specific use cases where this would be useful

## Additional Context
Add any additional notes, mockups, or context here.
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
