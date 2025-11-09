---
story_id: update-dashboard-feature-scenarios
session_id: project-init
feature_id: [studio-dashboard]
spec_id: [forge-studio-implementation]
model_id: []
context_id: []
status: completed
priority: low
estimated_minutes: 10
---

# Update Dashboard Feature Scenarios for Readiness Flow

## Objective

Update the dashboard feature file scenarios to reflect the new readiness-based routing behavior (already done in git diff, this is verification).

## Context

The dashboard feature file was updated during the design session to include scenarios for Forge-ready and non-ready projects. This story verifies those changes are correct.

## Implementation Steps

1. Review `ai/features/studio/dashboard/overview.feature.md`
2. Verify scenarios include readiness checks
3. Verify single/multi-root workspace scenarios updated
4. Ensure scenarios match new welcome screen flow
5. Check that sidebar collapse is mentioned

## Files Affected

- `ai/features/studio/dashboard/overview.feature.md` - Verify changes

## Acceptance Criteria

- [x] "Open Studio with single Forge-ready workspace" scenario exists (lines 178-186)
- [x] "Open Studio with single non-ready workspace" scenario exists (lines 187-195)
- [x] Multi-root scenarios show ALL projects (lines 196-220)
- [x] Scenarios mention readiness indicators (lines 202-204)
- [x] Sidebar collapse mentioned in relevant scenarios (lines 185, 194)
- [x] Feature file follows Gherkin format correctly
- [x] All scenarios are clear and testable

## Dependencies

None - documentation verification

