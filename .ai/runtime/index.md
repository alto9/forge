# Index

This document defines Forge workflow startup, configuration, execution, and shutdown behavior.

## Scope

- Discover workflow definitions from `.ai/workflows/*.json`.
- Select managed local Temporal or external/Cloud Temporal mode.
- Execute workflows through Temporal-backed workers outside the extension host.
- Recover visible run state from Temporal after restart.

## Primary code pointers (optional)

- Add stable code directories or modules here when known.
- Keep entries concise and remove stale pointers.
