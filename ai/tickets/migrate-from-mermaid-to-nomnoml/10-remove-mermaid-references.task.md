---
task_id: remove-mermaid-references
session_id: migrate-from-mermaid-to-nomnoml
type: manual
status: pending
priority: low
---

## Description

Perform a final sweep of the entire codebase to find and remove any remaining references to mermaid that were not caught by previous stories.

## Reason

After migrating to nomnoml, there may be stray references to mermaid in comments, documentation, or variable names. A final sweep ensures complete migration.

## Steps

1. Run global search for "mermaid" (case-insensitive):
   ```bash
   grep -ri "mermaid" packages/ ai/ --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=out
   ```

2. Review each result and determine if it needs updating

3. Update any remaining references:
   - Code comments
   - Variable names
   - Console log messages
   - Configuration files
   - Build scripts

4. Search for package dependencies:
   ```bash
   grep -r "mermaid" package*.json
   ```

5. Remove any mermaid packages if installed

6. Run build to verify no breaking changes:
   ```bash
   npm run build
   ```

7. Run tests to verify functionality:
   ```bash
   npm test
   ```

## Resources

- grep or ripgrep
- Text editor
- Terminal

## Completion Criteria

- [ ] Global search completed for "mermaid"
- [ ] All relevant references updated or removed
- [ ] No mermaid packages in dependencies
- [ ] Build completes successfully
- [ ] All tests pass
- [ ] No functionality broken by migration

