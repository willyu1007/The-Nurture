# G4-E Increment 1 — Institution Knowledge Lifecycle/Provenance

## Status

- Date: 2026-08-10
- Task: T-007
- Roadmap node: E1 / G4-E I1.1
- Contract: `nurture.institution-knowledge-lifecycle@1.0.0`
- Verdict: `G4_E_I1_1_PASS_STATIC`
- Database apply: **not run; no target approved for this G4-E node**
- Runtime: private/default-off; manifest/module/formal ingress unchanged

## Delivered boundary

This node implements only frozen record [`65`](./65-g4-0f-1-knowledge-lifecycle-provenance-freeze.md):

- one strict item/revision/body/provenance/event vocabulary;
- five private command specs using the existing exact-replay command ledger;
- exact current `institution_admin` / Workspace / Institution resolution before
  aggregate reads or protected-content sealing;
- expected-item-head concurrency, immutable revisions/source links/events and
  explicit review/publish/revoke transitions;
- one Prisma transaction owner plus the four planned table/migration artifacts;
- bounded synthetic/static tests and refreshed DB context.

The sealed canonical body is the only stored body. Command results and event
finalization payloads remain body-free. Authority-source snapshots are trusted
service input, stored atomically with their revision and never change the
derived constant `institution_authored`. A future public adapter must resolve
source requests through the 0F-2 owner bridge; it cannot accept caller-asserted
snapshot/currentness fields.

No retrieval/currentness policy, model/index/vector/cache, answer safety,
conflict candidate, public Surface, My-Chat ORM/runtime, child/family relation,
Host outbox or second idempotency ledger was added.

## Persistence and transaction design

The additive schema contains exactly:

1. `NurtureInstitutionKnowledgeItem` — stable scope, category, monotone item
   head and latest/current-publication pointers;
2. `NurtureInstitutionKnowledgeRevision` — sealed immutable body, hash,
   applicability/safety metadata and exact author evidence;
3. `NurtureInstitutionKnowledgeAuthorityLink` — immutable bounded owner-source
   snapshot per revision;
4. `NurtureInstitutionKnowledgeRevisionEvent` — immutable lifecycle/review
   events linked to the existing `NurtureCommandExecution`.

Core mutation and event append run in the same existing Serializable command
transaction. An explicit item row lock serializes revision-number allocation;
the expected head remains the business CAS. Revision/link/event append-only
triggers, exact-scope triggers and a deferred committed-state trigger prevent
partial cyclic item/revision initialization from reaching commit.

Creating a new draft deliberately preserves an older current publication.
Only the explicit publish command supersedes that pointer, and revoke clears it
without restoring any older revision. Medical-class content may be published
without a source link; 0F-2 retrieval eligibility remains the stricter gate.

## Quality review and repairs

Architecture review closed every finding before this record:

| Priority | Finding | Repair |
| --- | --- | --- |
| Must | Concurrent revision commands could hit the revision-number unique index before CAS and surface a generic technical failure. | Lock the exact item row inside the Serializable transaction before allocation; losing writers now roll back as a classified write conflict. |
| Must | The first item trigger incorrectly required current publication to equal latest revision, rejecting the frozen older-publication/new-draft state. | Preserve an unchanged older publication; require only an explicit changed publication pointer to name latest. |
| Must | History decisions initially trusted a contiguous revision list without proving complete event heads. | Require one creation event per revision, contiguous event heads/ordinals, exact scope and known revision refs before any mutation decision. |
| Should | Source dates accepted syntactically valid but impossible calendar values. | Require exact ISO round-trip for dates/instants and reject credential-bearing deep links. |
| Should | DB event rows were scope-bound but not command-key/type-bound. | Bind every event family to the exact lifecycle command key, business actor, active timed Admin role and active participant. |
| Should | A persisted single-value authorship field duplicated a domain invariant. | Remove the enum/column; domain revision mapping derives the sole `institution_authored` value. |
| Should | New unit/table files changed structural censuses. | Update the exact test-routing and G3 persisted-table censuses; both gates pass. |

No Must/Should/May finding remains open. No compatibility adapter, duplicate
repository, legacy knowledge path, temporary fixture or debug instrumentation
was retained.

## Verification

| Check | Result |
| --- | --- |
| Targeted lifecycle/command/static suite | PASS, 10/10 |
| Full unit lane | PASS, 911/911 across 82 files |
| Root TypeScript | PASS |
| Prisma format / validate / generate | PASS |
| Schema diff preview | PASS, additive three enums/four tables only |
| DB context refresh | PASS, checksum `d38ed5ac…` |
| Persistence / port / test-routing / formal-ingress | PASS |
| G2 census/contracts and G3 freeze census | PASS |
| Exact generic My-Chat Knowledge/RAG pin | PASS at `567b96c` / `554e79d4…`; live checkout drift remains informational |
| LLM config-key scan | PASS, zero in-scope keys; existing template-registry warning unchanged |
| Context / project-state / diff hygiene | PASS |
| PostgreSQL migration execution / DB suite | NOT RUN; Q1 remains unresolved and no database was touched |

## Effect and next node

The migration is an unapplied artifact. No database connection/write,
deployment, activation, source ingestion, model call, public capability or
traffic occurred.

Roadmap E2 may now implement 0F-2 pure retrieval/currentness policy and bounded
owner ports/providers without a new table. E2 must consume E1 facts rather than
create a second item/revision/currentness store. Database qualification remains
reserved for E4 after Q1 identifies and approves one exact disposable target.
