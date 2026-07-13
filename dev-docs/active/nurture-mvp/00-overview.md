# Overview — The Nurture MVP baseline

## Status

- State: in-progress
- Next step: reconstruct and verify the Nurture production persistence baseline without workflow dev-host models.
- Updated: 2026-07-13

## Goal

Rebuild the existing Nurture MVP from a clean `origin/main` baseline while separating the Nurture production database from the backend-private workflow dev-host database.

## Non-goals

- Do not add institution ecology business schema in G0.
- Do not enable non-empty handoff activation.
- Do not move My-Chat account, auth, runtime, queue, lease, outbox, or Handoff Ledger ownership into Nurture.
- Do not preserve the old mixed production/dev-host database as an ongoing migration track.

## Context

The pre-G0 implementation was preserved on local branch `codex/g0-preservation` at commit `9c54ef27a7685d4d0f6cfea9c6f310704c4133f7`. Formal work starts from `origin/main` on `codex/g0-nurture-baseline` and reconstructs that implementation as independently green, revertible commits.

## Acceptance criteria

- [x] The original 201-path worktree is preserved in a dedicated local commit.
- [x] The formal branch starts exactly from `origin/main`.
- [ ] Obsolete UI governance tooling is retired without breaking remaining governance suites.
- [x] My-Chat/Base contract revisions and hashes are machine-verifiable.
- [ ] Nurture production persistence contains no My-Chat-owned workflow runtime tables.
- [ ] Dev-host workflow persistence is private to `apps/backend` and uses a separate database.
- [ ] Unit tests remain at or above 86, production DB tests at or above 15, and dev-host E2E tests at or above 14.
