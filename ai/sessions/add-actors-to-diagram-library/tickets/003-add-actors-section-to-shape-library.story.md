---
story_id: add-actors-section-to-shape-library
session_id: add-actors-to-diagram-library
feature_id: [react-flow-diagram-editor]
spec_id: [react-flow-diagram-implementation]
diagram_id: [react-flow-editor-architecture]
status: pending
priority: high
estimated_minutes: 30
---

# Add Actors Section to Shape Library

## Objective

Add an "Actors" section to the ShapeLibrary panel that displays all actors from `ai/actors/` as draggable items with silhouette icons.

## Context

The Shape Library currently has General Shapes and AWS Services sections. Actors should appear between these two sections. The section loads actors from the extension host via the `getActors` message.

## Implementation Steps

1. Add `ActorInfo` interface definition
2. Add state for actors: `const [actors, setActors] = useState<ActorInfo[]>([])`
3. Add `useEffect` to request actors from extension host on mount
4. Add message listener for `'actors'` response
5. Create `ActorItem` component with silhouette icon and drag handling
6. Add Actors section between General Shapes and AWS Services
7. Handle empty state with "No actors defined" message
8. Implement `handleActorDragStart` with actor-specific drag data

## Files Affected

- `packages/vscode-extension/src/webview/studio/components/diagram/ShapeLibrary.tsx` - Add Actors section

## Code Reference

```typescript
// Interface
interface ActorInfo {
  actor_id: string;
  name: string;
  type: string;
  filePath: string;
}

// State
const [actors, setActors] = useState<ActorInfo[]>([]);

// Load actors on mount
useEffect(() => {
  const vscode = (window as any).vscode;
  if (vscode) {
    vscode.postMessage({ type: 'getActors' });
  }
  
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'actors') {
      setActors(event.data.data || []);
    }
  };
  
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);

// Drag handler
const handleActorDragStart = (e: React.DragEvent, actor: ActorInfo) => {
  const dragData = {
    isNewNode: false,
    type: 'actor',
    library: 'actor',
    actor_id: actor.actor_id,
    displayName: actor.name,
    actorType: actor.type,
    isContainer: false
  };
  e.dataTransfer.setData('application/reactflow', JSON.stringify(dragData));
  e.dataTransfer.effectAllowed = 'move';
};

// Render Actors section (between General and AWS)
{/* Actors Section */}
<div style={{ marginBottom: '16px' }}>
  <h4 style={{
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--vscode-descriptionForeground)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
    paddingLeft: '4px'
  }}>Actors</h4>
  {actors.length === 0 ? (
    <div style={{
      padding: '12px',
      fontSize: '12px',
      color: 'var(--vscode-descriptionForeground)',
      fontStyle: 'italic'
    }}>No actors defined</div>
  ) : (
    actors.map(actor => (
      <ActorItem key={actor.actor_id} actor={actor} onDragStart={handleActorDragStart} />
    ))
  )}
</div>
```

## ActorItem Component

```typescript
interface ActorItemProps {
  actor: ActorInfo;
  onDragStart: (event: React.DragEvent, actor: ActorInfo) => void;
}

const ActorItem: React.FC<ActorItemProps> = ({ actor, onDragStart }) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, actor)}
      style={{
        padding: '8px 12px',
        background: 'var(--vscode-list-inactiveSelectionBackground)',
        border: '1px solid var(--vscode-panel-border)',
        borderRadius: '4px',
        marginBottom: '4px',
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s',
        fontSize: '12px',
        color: 'var(--vscode-foreground)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--vscode-list-hoverBackground)';
        e.currentTarget.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--vscode-list-inactiveSelectionBackground)';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      {/* Silhouette Icon */}
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '4px',
        background: '#6b7280',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
      <span style={{ fontWeight: 500 }}>{actor.name}</span>
    </div>
  );
};
```

## Acceptance Criteria

- [ ] Actors section appears between General Shapes and AWS Services
- [ ] Actors are loaded from extension host via `getActors` message
- [ ] Each actor displays with silhouette icon and name
- [ ] Actors are draggable with correct drag data format
- [ ] Empty state shows "No actors defined" message
- [ ] Styling follows VSCode theme conventions
- [ ] Actors from nested folders are displayed

## Dependencies

- 001-add-getactors-message-handler (extension host must provide actors)

