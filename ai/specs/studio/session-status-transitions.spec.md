---
spec_id: session-status-transitions
feature_id:
  - session-status-workflow
context_id: []
---

# Spec: Session Status Transitions

## Overview
Defines the status values, transition rules, and validation logic for session lifecycle management.

## Session Status Values

### Status Enum
```typescript
enum SessionStatus {
  DESIGN = 'design',
  SCRIBE = 'scribe',
  DEVELOPMENT = 'development',
  COMPLETED = 'completed'
}
```

### Status Descriptions

| Status | Description | User Actions Available |
|--------|-------------|------------------------|
| `design` | Active session for creating/editing design docs | Edit features, specs, diagrams, models; Track changes; End session |
| `scribe` | Design complete, ready for distillation | Review changes; Run forge-scribe command |
| `development` | Tickets created, implementation in progress | Work on stories; Mark stories complete; Mark session complete |
| `completed` | All work finished, session archived | View only; No edits |

## Transition Rules

### Valid Transitions

```typescript
const VALID_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  [SessionStatus.DESIGN]: [SessionStatus.SCRIBE],
  [SessionStatus.SCRIBE]: [SessionStatus.DEVELOPMENT],
  [SessionStatus.DEVELOPMENT]: [SessionStatus.COMPLETED],
  [SessionStatus.COMPLETED]: []
};
```

### Transition Validation

Function to validate status transitions:
```typescript
function canTransition(
  currentStatus: SessionStatus,
  newStatus: SessionStatus
): boolean {
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  return allowedTransitions.includes(newStatus);
}
```

## Transition Triggers

### DESIGN → SCRIBE

**Trigger**: User clicks "End Design Session" button

**Pre-conditions**:
- Session status is `design`
- Session has at least one changed file

**Actions**:
1. Set `status: scribe`
2. Set `end_time` to current ISO timestamp
3. Save final `changed_files` array
4. Clear active session indicator in Studio
5. Show session in Scribe section with "Run forge-scribe" button

**Post-conditions**:
- Session is no longer active
- Design editing is disabled
- forge-scribe command is available

### SCRIBE → DEVELOPMENT

**Trigger**: User runs forge-scribe command, and AI agent creates tickets

**Pre-conditions**:
- Session status is `scribe`
- User has invoked forge-scribe command
- AI agent has completed ticket creation

**Actions**:
1. AI agent creates tickets in `ai/sessions/{session-id}/tickets/`
2. AI agent sets `status: development` in session file
3. Studio detects status change via file watcher
4. Studio reloads session data
5. Studio displays tickets list

**Post-conditions**:
- Session status is `development`
- Tickets folder exists with story/task files
- "Mark Complete" button is available

### DEVELOPMENT → COMPLETED

**Trigger**: User clicks "Mark Complete" button

**Pre-conditions**:
- Session status is `development`
- All tickets have `status: completed`

**Actions**:
1. Validate all tickets in `ai/sessions/{session-id}/tickets/` are completed
2. If validation passes:
   - Set `status: completed`
   - Save session file
   - Show success message
3. If validation fails:
   - Show error message
   - List incomplete tickets
   - Keep status as `development`

**Post-conditions**:
- Session status is `completed`
- Session moves to Completed section
- Session is read-only

## Validation Logic

### Check All Tickets Completed

```typescript
async function validateAllTicketsCompleted(
  sessionId: string
): Promise<{ valid: boolean; incompleteTickets: string[] }> {
  const ticketsPath = `ai/sessions/${sessionId}/tickets/`;
  const ticketFiles = await glob(`${ticketsPath}*.{story,task}.md`);
  
  const incompleteTickets: string[] = [];
  
  for (const file of ticketFiles) {
    const content = await fs.readFile(file, 'utf-8');
    const { data } = matter(content);
    
    if (data.status !== 'completed') {
      incompleteTickets.push(path.basename(file));
    }
  }
  
  return {
    valid: incompleteTickets.length === 0,
    incompleteTickets
  };
}
```

## Session File Updates

### Status Field in Frontmatter

```yaml
---
session_id: example-session
start_time: '2025-11-10T12:00:00.000Z'
end_time: '2025-11-10T14:30:00.000Z'
status: design  # or scribe, development, completed
problem_statement: >-
  Description of the problem
changed_files: []
---
```

### Status Update Function

```typescript
async function updateSessionStatus(
  sessionPath: string,
  newStatus: SessionStatus,
  additionalUpdates?: Record<string, any>
): Promise<void> {
  const content = await fs.readFile(sessionPath, 'utf-8');
  const { data, content: body } = matter(content);
  
  // Validate transition
  if (!canTransition(data.status, newStatus)) {
    throw new Error(
      `Invalid transition from ${data.status} to ${newStatus}`
    );
  }
  
  // Update status
  data.status = newStatus;
  
  // Apply additional updates
  if (additionalUpdates) {
    Object.assign(data, additionalUpdates);
  }
  
  // Write back to file
  const updated = matter.stringify(body, data);
  await fs.writeFile(sessionPath, updated, 'utf-8');
}
```

## UI State Management

### Status-Based UI Configuration

```typescript
interface StatusUIConfig {
  badge: {
    text: string;
    color: string;
  };
  actions: string[];
  editingAllowed: boolean;
}

const STATUS_UI_CONFIG: Record<SessionStatus, StatusUIConfig> = {
  [SessionStatus.DESIGN]: {
    badge: { text: 'Design', color: 'blue' },
    actions: ['End Design Session', 'Save Session'],
    editingAllowed: true
  },
  [SessionStatus.SCRIBE]: {
    badge: { text: 'Scribe', color: 'orange' },
    actions: ['Run forge-scribe'],
    editingAllowed: false
  },
  [SessionStatus.DEVELOPMENT]: {
    badge: { text: 'Development', color: 'purple' },
    actions: ['Mark Complete'],
    editingAllowed: false
  },
  [SessionStatus.COMPLETED]: {
    badge: { text: 'Completed', color: 'green' },
    actions: [],
    editingAllowed: false
  }
};
```

## Error Handling

### Transition Errors

| Error | Message | Action |
|-------|---------|--------|
| Invalid transition | "Cannot transition from {current} to {new}" | Block action, show error |
| No changed files | "Session must have changes before ending" | Block transition, prompt to make changes |
| Incomplete tickets | "Not all tickets are completed" | Block transition, show list of incomplete |
| Missing tickets folder | "No tickets found for session" | Block completion, verify distillation ran |

## Constraints

1. **Linear Progression**: Sessions must progress through statuses in order (no skipping)
2. **One Way**: Cannot move backwards in status (e.g., development → scribe)
3. **Validation Required**: Each transition must pass validation checks
4. **File System Sync**: Status changes must be persisted to session file immediately
5. **UI Consistency**: UI must update to reflect status changes in real-time

