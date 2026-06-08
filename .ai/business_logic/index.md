# Index

This document defines Forge's business rules for workflow definitions, runs, activities, validators, human questions, and GitHub delivery ownership.

## Scope

- Keep workflow behavior generic and data-defined rather than hard-coding one workflow into Forge.
- Treat Temporal as the durable execution owner for runs, waits, retries, and recovery.
- Treat Cursor SDK activity output as provisional until deterministic validation accepts it.
- Keep GitHub authoritative for issues, milestones, project fields, and delivery records.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
- Keep entries concise and remove stale pointers.
