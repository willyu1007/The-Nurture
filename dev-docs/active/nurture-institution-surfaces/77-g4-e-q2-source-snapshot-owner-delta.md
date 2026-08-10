# G4-E Q2 Source Snapshot Owner Delta

## Status

- Date: 2026-08-10
- Task: T-007
- Verdict: `G4_E_Q2_SOURCE_SNAPSHOT_DELTA_PASS`
- External prerequisite landed: `My-Chat@6e6d57d` exact source/retrieval/currentness core
- Effect: owner contract/test only; no database, source pull, indexing, activation or traffic

## Finding

The Nurture indexing snapshot carried the exact source identity and body but omitted four owner facts required to construct the already-frozen Institution citation shape:

- `item_ref`
- `revision_ref`
- `revision_number`
- `published_at`

My-Chat cannot safely derive those values from the opaque `source_ref`, a database row ID, the revision hash or a naming convention. Doing so would create a second identity interpretation and break the 0F-2/0F-3 ownership boundary.

## Repair

`NurtureInstitutionKnowledgeSourceSnapshotV1` now returns the four facts directly from the current coherent Nurture item/revision/publication event. `snapshotOf` resolves the publication event for the selected revision and fails unavailable when it cannot produce the complete snapshot.

The delta does not add an alternate source identity, body cache, cursor state, lifecycle state, deadline or blocker. My-Chat remains responsible for its index projection and consumer progress; Nurture remains canonical for the item, revision, publication and body.

## Verification

- Scenario typecheck and generated-manifest check: pass.
- Targeted Institution Knowledge retrieval suite: 13/13 pass.
- The exact-index-snapshot fixture now asserts all four citation provenance facts.
- `git diff --check`: pass.

The repository has no maintained backend ESLint configuration; its supported scenario validation lanes are TypeScript, manifest and Vitest. No build/dev server was run.

## Next

Consume this complete snapshot in the My-Chat idempotent owner-source admission/invalidation service, then add durable change/reconciliation progress before formal E7 pinning.
