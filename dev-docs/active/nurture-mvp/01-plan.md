# Plan — G0 baseline reconstruction

## Phases

1. Preserve the pre-G0 worktree and establish a clean formal branch.
2. Retire obsolete UI governance tooling.
3. Add the cross-repository workflow contract revision/hash pin and verifier.
4. Reconstruct the Nurture production baseline and verify its database boundary.
5. Move workflow dev-host persistence under `apps/backend` with its own database and CI job.
6. Fold the locked institution ecology design into the final documentation increment and run the G0 closure matrix.

## Detailed steps

- Make each phase an independently green and revertible commit.
- Record commands, populations, outcomes, and fixes in `04-verification.md` before advancing.
- Stage only explicit paths; inspect staged scope and post-commit residue each time.
- Keep capability activation disabled throughout G0.
- Merge only after production-boundary and dev-host verification both pass.

## Risks and mitigations

- Risk: the preserved WIP mixes unrelated phases.
  - Mitigation: reconstruct from `origin/main`; never merge or cherry-pick the WIP commit.
- Risk: dev-host Workflow tables leak into the production migration stream.
  - Mitigation: use separate Prisma schemas, generated clients, databases, migration paths, tests, and CI assertions.
- Risk: local `file:` dependencies drift across worktrees or CI.
  - Mitigation: pin repository revisions and content hashes in a machine-readable integration record.
- Risk: a smaller test selector silently reduces coverage.
  - Mitigation: enforce explicit population floors and fail when existing test files are unclassified.
