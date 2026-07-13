# Pitfalls — G0 baseline reconstruction

## Do-not-repeat summary

- Never merge or cherry-pick `codex/g0-preservation`; reconstruct explicit formal scopes from `origin/main`.
- Never deploy backend dev-host Workflow models through the root Nurture Prisma migration stream.
- Never advance after a failed node gate; record and fix the failure first.

## Pitfall log

### 2026-07-13 — retired paths survived as empty directories

- Symptom: the first UI retirement gate exited non-zero after all content checks passed.
- Context: the gate requires the retired `ui/` and UI test paths to be absent, not merely untracked.
- What we tried: file deletion through `apply_patch`, which correctly removed tracked files but does not remove their final empty directories.
- Why it failed: filesystem directories are not represented in the Git patch.
- Fix / workaround: remove only confirmed-empty directories, then rerun the complete gate.
- Prevention: after whole-directory retirement, assert both zero references and physical path absence before recording PASS.
- References: `test ! -e ui`; `test ! -e docs/context/ui`; `test ! -e .ai/tests/suites/ui`; `test ! -e .ai/tests/maintainer/ui`.
