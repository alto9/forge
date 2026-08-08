# Interactive Q&A Contract

Use this reference for human decision loops in `/ideate`, `/intake`, and `/refine`.

## Core rule

When `user_questions.md` contains unresolved blocker items, the orchestrator must use `AskQuestion` when the tool is available and must not advance to the next phase until blockers are `Answered`, `Deferred` with explicit acceptance, or `Superseded`.

If `AskQuestion` is unavailable, ask numbered questions in chat and explicitly say: `I'll wait for your answers before continuing.`

## When to prompt the human

Use this interaction pattern for:

- A tier-User blocker in `user_questions.md` during ideation or refinement.
- Ideation Phase A pre-fan-out blockers, capped at three before SME fan-out.
- Ideation Phase D review gate when confirming the compact `assumptions.md` summary.
- Intake inline Q&A when scope or acceptance is ambiguous (no tmp folder; answers land on the Issue).

Do not use this interaction pattern for:

- Facts derivable from repository code, `.ai`, specs, docs, or peer submodules. Record those in `assumptions.md`.
- Tier-TW items that Technical Writer can resolve without a product fork. Resolve those in Phase D `.ai` and Issue bodies.
- Nice-to-have questions while blockers remain.

## How to ask

Use one `AskQuestion` call per agent turn.

- Include one or two questions, not the full eight-question cap.
- Provide two to four concrete options per question.
- Put the recommended option first and mark it with `(Recommended)`.
- Rely on AskQuestion's `Other` option for custom user answers.
- Set `allow_multiple: true` only when the decision is genuinely multi-select.
- Write prompt text with context, for example: `For catalog administration, which surface owns episode edits?`
- Avoid bare question IDs or vague prompts like `Choose an approach`.

## After each answer

After the user answers:

1. Append a normalized decision to `refinement.md` (ideation/refine) or update the Issue body directly (intake).
2. Update the corresponding `user_questions.md` entry status to `Answered`, `Deferred`, or `Superseded` when a tmp file exists.
3. Mirror initiative-level facts into `ideation.md` `Known decisions` during `/ideate`, or into `issue_context.md` during `/refine`.
4. If the answer opens a new tier-User fork, triage it before continuing. Add at most one new blocker at a time and keep the eight-question cap.
5. Re-enter the loop until exit criteria pass.

## Ideation vs refinement vs intake depth

| Phase | AskQuestion scope | Examples |
|-------|-------------------|----------|
| Ideation Phase C | High-level initiative forks | Scope and non-goals, repo inclusion, storage class, auth/trust posture, cross-repo ownership |
| Intake | Single-Issue scope forks | One feature boundary, acceptance nuance, which repo owns the work |
| Refinement Phase C | Issue-scoped forks the user must own | Acceptance nuance, visible UX behavior, environment choice when specs allow multiple paths, test depth |

Refinement Phase C may ask about low-level ambiguities that would otherwise become `TBD` in the Issue. It must not ask about pure implementation detail the Technical Writer can derive from repo contracts, specs, or existing code.

## Exit criteria

Phase C is complete only when every blocker is:

- `Answered`,
- `Deferred` with explicit acceptance, or
- `Superseded` by known decisions or updated scope.

Only then may ideation move to Phase D contract drafting, intake finalize the Issue, or refinement move to Phase D Issue and `.ai` completion.

## Anti-patterns

- Pasting the full `user_questions.md` list into chat instead of using `AskQuestion`.
- Proceeding to Phase D while blockers remain assumed.
- Asking tier-TW implementation minutiae in ideation Phase C.
- Asking the human to choose facts that the repo, `.ai`, specs, or peer code already settle.
