# AI Workflow Rules

## Approach

Build this project incrementally using a spec-driven workflow. Context files define what to build, how to build it, and the current state of progress. Always implement against these specs — do not infer or invent behavior from scratch.

## Scoping Rules

- Work on one feature unit at a time.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in a single implementation step.

## When to Split Work

Split an implementation step if it combines:
- Real-time signaling updates and layout visual styling changes.
- Creating new custom hooks and editing page-level route layouts.
- Adjusting native config presets and adding layout animations.

If a change cannot be verified end-to-end quickly, the scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files.
- If a requirement is ambiguous, resolve it in the relevant context file before implementing.
- If a requirement is missing, add it as an open question in `progress-tracker.md` before continuing.

## Protected Files

Do not modify the following unless explicitly instructed:
- Project package lock files (`package-lock.json`).
- Precompiled native configurations or assets/images.

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:
- System architecture or boundaries.
- Theme assets and color definitions.
- Code conventions or standards.
- Progress metrics and trackers.

## Before Moving to the Next Unit

1. The current unit works end-to-end within its defined scope.
2. No invariant defined in `architecture.md` was violated.
3. `progress-tracker.md` reflects the completed work.
4. Compilation (`npm run typescript`) and testing pass cleanly.
