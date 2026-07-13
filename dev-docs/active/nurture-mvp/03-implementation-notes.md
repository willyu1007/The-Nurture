# Implementation notes — G0 baseline reconstruction

## Status

- Current status: `in-progress`
- Last updated: 2026-07-13

## What changed

- Preserved the pre-G0 worktree on local branch `codex/g0-preservation` as commit `9c54ef27a7685d4d0f6cfea9c6f310704c4133f7`.
- Created formal branch `codex/g0-nurture-baseline` from `origin/main` at `e76dbb72ad68fbd0bae29a350b66b230890c9dbb` in a separate worktree.
- Retired the unused repo-local UI SSOT, four UI skills and provider wrappers, and their general/maintainer test suites.
- Removed UI from both test runners while preserving every remaining suite entry.
- Added `docs/project/integrations/my-chat-workflow-contract.json` with independent Base, My-Chat, and Nurture scenario contract pins.
- Added a dependency-free verifier with path traversal/symlink rejection, Git revision checks, deterministic path/content hashes, and CI cross-repository checkouts sourced from the pin.
- Reconstructed the scenario implementation and Nurture repository package from the preservation snapshot while keeping Prisma imports out of the business layer.
- Replaced the mixed schema history with a clean production migration containing 22 Nurture tables and 27 Nurture enums; removed all six host runtime models and two runtime enums from root Prisma/export/context surfaces.
- Added `DATABASE_URL` to the env contract, generated env/context artifacts, production catalog assertions, Vitest population assertions, and production-only CI jobs.

## Decisions and tradeoffs

- Decision: reconstruct five formal commits instead of cherry-picking the WIP snapshot.
  - Rationale: every ownership change must be independently reviewable, green, and revertible.
- Decision: use two databases in the same local Postgres instance.
  - Rationale: this preserves realistic persistence tests while making the production boundary structural.

## Known issues and follow-ups

- Backend-private dev-host reconstruction is the next increment.
- T-002 design closure remains pending.
