# Overview — The Nurture MVP baseline

## Status

- State: done
- Next step: archive this task bundle only after explicit approval; the product implementation ladder continues with X0 in My-Workflow-Base and X1 in My-Chat.
- Updated: 2026-07-13

## Goal

Rebuild the existing Nurture MVP from a clean `origin/main` baseline while separating the Nurture production database from the backend-private workflow dev-host database.

## Non-goals

- Do not add institution ecology business schema in G0.
- Do not enable non-empty handoff activation.
- Do not move My-Chat account, auth, runtime, queue, lease, outbox, or Handoff Ledger ownership into Nurture.
- Do not preserve the old mixed production/dev-host database as an ongoing migration track.

## Context

The pre-G0 implementation was preserved on local branch `codex/g0-preservation` at commit `9c54ef27a7685d4d0f6cfea9c6f310704c4133f7`. The formal five-commit reconstruction was merged through PR #1 as merge commit `9e79d5eb89993b7ab9bec115fa1180faa549e21f`; the preservation/formal branches and temporary worktrees were deleted only after fresh-worktree verification.

## Acceptance criteria

- [x] The original 201-path worktree is preserved in a dedicated local commit.
- [x] The formal branch starts exactly from `origin/main`.
- [x] Obsolete UI governance tooling is retired without breaking remaining governance suites.
- [x] My-Chat/Base contract revisions and hashes are machine-verifiable.
- [x] Nurture production persistence contains no My-Chat-owned workflow runtime tables.
- [x] Dev-host workflow persistence is private to `apps/backend` and uses a separate database.
- [x] Unit tests remain at or above 86, production DB tests at or above 15, and dev-host E2E tests at or above 16 after closure hardening.
- [x] PR and main CI pass, a fresh post-merge worktree passes the complete matrix, and temporary backup/database/worktree/branch artifacts are removed.
- [x] The local-only dev host binds to loopback, refuses non-dev/test startup, and loads `.env.local` consistently for repository commands.
- [x] The pinned Base `web-workbench` source is content-verified in addition to the workflow contract.
