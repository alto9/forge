# Index

This document defines Forge workflow data ownership, serialization, projection, and validation boundaries.

## Scope

- Keep workflow definitions in repo-owned `.ai/workflows/*.json`.
- Keep durable execution history in Temporal.
- Treat Forge run projections and artifact indexes as derived support data.
- Validate serialized agent outputs before downstream workflow steps consume them.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
- Keep entries concise and remove stale pointers.
