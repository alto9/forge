---
story_id: add-getactors-message-handler
session_id: add-actors-to-diagram-library
feature_id: [react-flow-diagram-editor]
spec_id: [react-flow-diagram-implementation]
diagram_id: [react-flow-editor-architecture]
status: pending
priority: high
estimated_minutes: 20
---

# Add getActors Message Handler to ForgeStudioPanel

## Objective

Add a `getActors` message handler in `ForgeStudioPanel.ts` that scans the `ai/actors/` directory recursively and returns actor metadata to the webview.

## Context

This is the foundational story for the Actor Diagram Library feature. The webview's ShapeLibrary needs to retrieve the list of available actors from the extension host. This follows the existing pattern used by `getSpecs`.

## Implementation Steps

1. Add new case handler for `'getActors'` message type in the `_handleMessage` switch statement
2. Implement `_listActors()` private method that:
   - Uses `this._aiDir` to construct path to `actors` folder
   - Calls `_listFilesRecursive()` with `.actor.md` extension
   - Reads each actor file and extracts frontmatter
   - Returns array of `ActorInfo` objects
3. Define the `ActorInfo` interface in the file

## Files Affected

- `packages/vscode-extension/src/panels/ForgeStudioPanel.ts` - Add message handler and `_listActors()` method

## Code Reference

Follow the existing `_listSpecs()` pattern at line ~551:

```typescript
interface ActorInfo {
  actor_id: string;
  name: string;
  type: string;  // 'human' | 'system' | 'external'
  filePath: string;
}

// In switch statement:
case 'getActors':
  const actors = await this._listActors();
  this._panel.webview.postMessage({ type: 'actors', data: actors });
  break;

// New method:
private async _listActors(): Promise<ActorInfo[]> {
  const actorsDir = vscode.Uri.joinPath(this._aiDir, 'actors');
  const files = await this._listFilesRecursive(actorsDir, '.actor.md');
  
  const actors: ActorInfo[] = [];
  for (const file of files) {
    const content = await vscode.workspace.fs.readFile(file);
    const text = new TextDecoder().decode(content);
    const frontmatter = this._parseFrontmatter(text);
    
    actors.push({
      actor_id: frontmatter.actor_id || '',
      name: frontmatter.name || frontmatter.actor_id || 'Unknown',
      type: frontmatter.type || 'system',
      filePath: file.fsPath
    });
  }
  return actors;
}
```

## Acceptance Criteria

- [ ] `'getActors'` message type is handled in `_handleMessage`
- [ ] `_listActors()` method scans `ai/actors/` recursively
- [ ] Actor frontmatter (actor_id, name, type) is extracted correctly
- [ ] Response is sent via `postMessage` with type `'actors'` and data array
- [ ] Handles empty actors folder gracefully (returns empty array)
- [ ] Handles nested actor folders (e.g., `ai/actors/human/`, `ai/actors/system/`)

## Dependencies

- None (this is the foundation story)

