# G4-E Increment 2 — Institution Knowledge Retrieval/Currentness

## Status

- Date: 2026-08-10
- Task: T-007
- Roadmap node: E2 / G4-E I1.2
- Contract: `nurture.institution-knowledge-retrieval@1.0.0`
- Verdict: `G4_E_I1_2_PASS_STATIC`
- Schema/database: **no delta; no database connection or operation**
- Runtime: private/default-off; manifest, module and formal ingress unchanged

## Delivered boundary

This node implements frozen record [`66`](./66-g4-0f-2-retrieval-owner-bridge-freeze.md)
without adding a Host runtime or a second knowledge store:

- one pure eligibility decision shared by index admission and online
  currentness, with future-effective content allowed only in the rebuildable
  index;
- a bounded authenticated source-change/read/reconciliation provider contract;
- an exact My-Chat candidate consumer port and pre/post-retrieval orchestration;
- a strict candidate union that keeps Nurture Institution material and My-Chat
  authority sources independently typed and owner-revalidated;
- a bounded Nurture final-currentness provider for 1..32 exact
  source/version/hash tuples;
- an exact Admin editor-preview provider using 1..8 actor-bound opaque option
  refs, all-or-nothing body resolution and explicit warnings;
- exact service/Admin/authority-currentness ports whose unqualified real owner
  bindings remain later I3 gates.

The implementation consumes the E1 item/revision/review/publication facts and
reuses E1's complete history validator. It creates no source, index, vector,
cache, answer, candidate, outbox or cursor row. Candidate retrieval remains a
consumer port; no generic `public_rag_answer` or `knowledge_ingestion` purpose
is accepted as a scenario substitute.

## Security, currentness and replay behavior

Service authentication or current Admin Workbench authority runs before source,
candidate or protected-body reads. Source/event/cursor/reconciliation/preview
option refs are owner-issued opaque values; no persistence item/revision ID is
returned by the preview presenter. Provider outputs are reconstructed field by
field, so an owner adapter cannot smuggle a body or extra policy fact through a
body-free change response.

Index admission requires current publication, latest explicit review,
Institution Admin audience, unexpired content, body/hash integrity and a
current exact authority source for medical material. Online currentness adds
`validFrom` and exact age/scenario applicability. Authority owner denial makes
a medical source ineligible; authority/technical failure makes the invocation
unavailable. Index/cache presence never supplies authority.

One reconciliation page preserves its owner-issued snapshot ref and
`evaluatedAt`, stable canonical-source order, bounded rows and an explicit
terminal flag. The provider rejects mixed snapshot refs, invalid terminal/
cursor combinations, duplicate/unsorted sources and malformed owner results.
Retrieval owner denial is represented by a legal empty candidate list;
technical failure is `unavailable`. Every nonempty candidate list is
revalidated in exact order before it can reach the later answer-safety phase.

Preview resolves opaque options against the same current Admin editor,
Workspace, Institution and invocation. Draft/published/superseded revisions may
be shown with warnings; a revoked/missing/body-drifted option or owner failure
makes the whole preview unavailable. Preview has no write or reusable output.

## Quality review and repairs

| Priority | Finding | Repair |
| --- | --- | --- |
| Must | The first draft let online retrieval reach the Host owner before rechecking current Admin authority. | Added an explicit pre-retrieval Admin check and retained the post-retrieval currentness check. |
| Must | Initial source/event refs were derivable from internal item/event IDs. | Made opaque source/publication refs owner facts and removed internal item/revision IDs from preview requests/results. |
| Must | Preview initially accepted raw revision refs without proving they were issued to the same editor. | Replaced them with actor/invocation-bound opaque option refs resolved through one exact owner port. |
| Must | The first committed candidate shape allowed only Nurture material, so a linked authority source could not become an independently current medical citation. | Reopened E2 before E3, added the exact Institution/authority candidate union and required separate pre-generation currentness for both owner classes. |
| Must | Raw source-change objects could carry undeclared runtime fields. | Validate then rebuild every public change field; protected body and extra owner payload cannot cross the provider. |
| Must | A missing/stale version read could collapse source drift into `not_published`. | Read the current publication by stable source ref, then compare the requested immutable version/hash and return `content_drift`. |
| Should | E2 duplicated part of E1's history-chain validation. | Export and reuse the E1 SSOT validator; E2 adds only source/ref/provenance coherence. |
| Should | Reconciliation accepted malformed terminal/cursor and mixed-order pages. | Enforce exact snapshot continuation, timestamp, unique sorted source refs and terminal/cursor parity. |
| Should | Currentness response order and thrown provider errors were not fully guarded. | Verify identity-preserving ordered decisions and map thrown owner/currentness failures to `unavailable`. |

No Must/Should/May finding remains open. The only census change is the new
maintained unit suite; the exact routing gate now records 83 unit files.

## Verification

| Check | Result |
| --- | --- |
| Targeted E1/E2 suites | PASS, 23/23 |
| E2 retrieval/currentness suite | PASS, 13/13 |
| Full unit lane | PASS, 924/924 across 83 files |
| Root and scenario TypeScript | PASS |
| Test routing | PASS, 152 files: 83 unit / 42 DB / 11 dev-host / 14 scenario-service / 2 joint |
| Persistence / port topology / formal ingress | PASS; exact 25 descriptors remain unrouted |
| G2 contract/census and G3 freeze | PASS |
| Exact generic My-Chat Knowledge/RAG source pin | PASS at `567b96c` / `554e79d4…`; live checkout `2dc365e` is informational drift only |
| Full workflow pin against live sibling | EXPECTED FAIL at My-Chat revision mismatch; no pin/adoption change |
| Diff/static boundary scan | PASS; no Prisma, My-Chat RAG/permissions SDK, child/family or legacy corpus import |
| PostgreSQL / migration | NOT RUN; E2 has no schema delta and Q1 remains unresolved |

## Effect and next node

No database, source owner, model, index, Surface, deployment, activation or
traffic was touched. The concrete E1 persistence reader, opaque-ref issuer and
real My-Chat service/retrieval/authority-currentness adapters remain I3 work;
their absence keeps runtime default-off and is not replaced by a synthetic
compatibility adapter.

Roadmap E3 may now implement frozen 0F-3 structured answer/citation safety and
the single immutable conflict-review candidate. E3 must not bind a model
runtime or invent an answer-safety provider; real generation/safety readiness
still requires Q2/Q3/Q4.
