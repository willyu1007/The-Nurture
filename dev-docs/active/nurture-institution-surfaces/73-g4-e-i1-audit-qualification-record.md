# G4-E I1 Audit and Persistence Qualification

## Status

- Date: 2026-08-10
- Task: T-007
- Roadmap node: E4 / G4-E I1 cross-increment audit
- Verdict: `G4_E_I1_PASS_QUALIFIED`
- Database effect: approved local disposable target only; destroyed with final
  database/session counts `0/0`
- Runtime: private/default-off; no public Surface, owner provider, formal
  ingress, model/index runtime, activation or traffic

## Outcome

E1 lifecycle/provenance, E2 retrieval/currentness and E3 answer safety/
conflict-candidate now compose as one DB-qualified private I1 boundary. The
complete 35-migration history survives an empty PostgreSQL deploy, the five
Knowledge tables retain their exact ownership and append-only constraints, and
the existing single `NurtureCommandExecution` ledger remains the only replay
owner.

The qualification adds one maintained production DB test. It proves exact
Admin/Institution lifecycle writes, canonical replay under reordered metadata,
review/publish/revoke history, immutable revisions, deterministic conflict-
candidate convergence under reordered exact sources and candidate
immutability. It does not bind retrieval, generation or safety providers.

## Architecture review

- Overall risk: medium before repair; low after disposable qualification.
- Recommended next action: proceed to E5 I2-A from this clean commit boundary.

### Must-fix findings — closed

1. **G4-E repositories had a stale conditional-export runtime path.**
   TypeScript resolved new symbols from source declarations while `/harness`
   runtime resolution could still load the older checked-in `dist`. Both
   repositories now import the source-backed scenario root. Targeted and full
   PostgreSQL tests verify the production entry path.
2. **First publication always conflicted from a null publication pointer.**
   SQL three-value logic made Prisma's `NOT currentPublishedRevisionId = id`
   false for `NULL`. The CAS now explicitly permits a null pointer or a
   different revision. A real PostgreSQL create→review→publish→revoke path
   proves the repair.

### Should-fix finding — closed

1. **The integration test trusted an untyped committed result after a shallow
   object check.** It now uses an explicit closed six-field result guard with
   integer and revision-state validation. Root TypeScript and a final clean
   migration/targeted-test replay pass.

No Must/Should/May finding remains open. Authorization stays in the existing
0C authority chain, protected bodies remain sealed, Prisma remains inside the
DB layer, queries stay bounded and no secret/PII appears in evidence.

## Database lifecycle

The user approved exactly
`localhost:5433/nurture_t007_g4e_i1_qualification_20260810_01`. Preflight
proved the target absent and the configured default database distinct. The
target was created from empty, received all 35 versioned migrations, passed
targeted/full DB lanes, current status and zero drift, then was dropped without
force after zero-session checks. A short final replay after the test-only type
repair repeated the same absent→35 migrations→2/2→zero drift→destroyed
lifecycle. No durable database was touched.

Detailed sanitized evidence is under
[`artifacts/db/g4e-i1-qualification`](./artifacts/db/g4e-i1-qualification/).

## Verification

| Check | Result |
| --- | --- |
| Targeted G4-E PostgreSQL | PASS — 2/2, final test form |
| Full production DB | PASS — 391/391 across 43 files |
| Related E1–E3 unit | PASS — 34/34 |
| Full unit lane | PASS — 935/935 across 84 files |
| TypeScript | PASS — root, scenario and DB |
| Test routing | PASS — 154 files: 84 unit / 43 DB / 11 dev-host / 14 scenario-service / 2 joint |
| Migration apply/status/drift | PASS — 35/35, current, no difference |
| DB context / database feature suite | PASS — `edc0f9ef…`; SQLite pass, optional Convex skipped |
| Cleanup | PASS — exact target and sessions absent; disposable data unrecoverable |

## Effect and next node

E4 closes Q1 and releases roadmap E5 I2-A. E5 may publish exact additive
Knowledge Surface schemas and fixtures without a caller. E6 may then map them
behind one default-off gate. Q2–Q4 remain unresolved and still block E7/E8;
this qualification is not real owner readiness, joint conformance, deployment,
activation or traffic authority.
