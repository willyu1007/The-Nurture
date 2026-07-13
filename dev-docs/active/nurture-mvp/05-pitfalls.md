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

### 2026-07-13 — repository prefixes made equal contracts hash differently

- Symptom: the first Base and My-Chat contract hashes differed although their eight `src` files were byte-identical.
- Context: the first algorithm input used paths relative to each repository root.
- What we tried: hashing full repository-relative paths plus file contents.
- Why it failed: Base and My-Chat store the same contract under different directory prefixes, so storage layout contaminated the content identity.
- Fix / workaround: pin an explicit `contractRoot` per repository and hash paths relative to that root; keep repository revision as a separate field.
- Prevention: contract content hashes must normalize package-root layout while still including paths below the contract root.
- References: `sha256-path-content-v1`; `docs/project/integrations/my-chat-workflow-contract.json`.
