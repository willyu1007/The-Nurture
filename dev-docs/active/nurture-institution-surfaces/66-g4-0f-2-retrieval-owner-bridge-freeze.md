# G4-0F-2 Retrieval Eligibility & Owner Bridge — Freeze Record

## Status

- Date: 2026-08-10
- Task: T-007
- Contract identity: `nurture.institution-knowledge-retrieval@1.0.0`
- Consumes: 0C authority, 0F scope/source pin ([`64`](./64-g4-0f-scope-freeze.md))
  and 0F-1 lifecycle/provenance ([`65`](./65-g4-0f-1-knowledge-lifecycle-provenance-freeze.md))
- Verdict: `G4_0F_2_FREEZE_PASS`
- Schema delta: **none beyond 0F-1; port/projection only**
- Non-effects: no source ingestion, index, model call, owner adoption, Surface,
  activation or traffic.

## 1. Owner, consumer and source

| Role | Owner/source |
| --- | --- |
| Current Institution revision/publication/review/applicability | Nurture 0F-1 Knowledge owner |
| Active role, Workspace and Institution authority | 0C exact current `institution_admin` chain |
| Authority-source identity and currentness | My-Chat authority-source owner through an exact owner adapter |
| Generic source/chunk/vector retrieval and PBR | My-Chat generic Knowledge/RAG owner at the exact [`64`](./64-g4-0f-scope-freeze.md) source pin |
| Scenario source admission and currentness | Nurture provider ports in this record; My-Chat owns consumer cursor, index and retries |
| Answer/citation safety | 0F-3; 0F-2 returns eligible context candidates, not an answer |

Nurture does not import `@my-chat/rag`, `@my-chat/permissions`, a provider SDK
or the My-Chat ORM. My-Chat does not query the Nurture database. The exact
source pin is a design input, not evidence that the observed checkout or an
Institution-specific bridge has been adopted.

## 2. Closed purposes and request contexts

0F v1 defines exactly three scenario purposes:

```text
institution_knowledge_indexing
institution_admin_online_answer
institution_admin_editor_preview
```

The current My-Chat owner contract exposes only generic public-answer and
knowledge-ingestion purposes. `institution_knowledge_indexing` may be backed by
the generic ingestion machinery only after an exact adapter is accepted.
`institution_admin_online_answer` MUST NOT be mapped to `public_rag_answer`,
and preview MUST NOT be mapped to either public answer or ingestion.

`InstitutionKnowledgeOnlineQueryV1` accepts only a nonblank question of at
most 2,000 characters / 8,192 UTF-8 bytes, up to 16 unique age-band keys and
up to 16 unique scenario keys. Trusted server context supplies
Workspace, actor participant, current Admin role assignment, Institution,
`institution_workbench` surface, purpose and invocation identity. The public
request accepts no role, scope, source/revision ref, child/family ref, Grant,
visibility, policy decision, owner head, citation or model field.

`InstitutionKnowledgeEditorPreviewV1` names 1..8 exact revision option refs
issued to the same current Admin editor. The preview may include draft
revisions from the same Institution and may compare them with the current
publication. The preview is ephemeral and creates no source, chunk, embedding,
retrieval cache, citation record, publication, export or family communication.

V1 has no child-specific retrieval context. Age/scenario labels are coarse
applicability filters and cannot be inferred from or joined to child/private
care facts.

## 3. Index admission and online eligibility

A Nurture revision is admissible to the rebuildable Host index only when all
of the following are true at the current read:

1. exact Workspace and Institution match the trusted request/service scope;
2. item current-published pointer names that exact revision and source version;
3. no later revoke/supersede event invalidates the publication;
4. latest explicit review decision for the revision is `reviewed`;
5. intended audiences include `institution_admin`;
6. `validUntil` is absent or still future, using the repository/owner clock
   rather than caller time; a future `validFrom` may be indexed ahead of use;
7. protected body unseals and its canonical content hash still matches;
8. no active safety/conflict hold from 0F-3 applies;
9. for `basic_health_first_aid`, at least one linked authority source resolves
    at the exact stored owner version and remains currently readable/eligible;

Online answer eligibility adds all of these request-time predicates:

1. `validFrom` is absent or reached;
2. an empty revision age/scenario set means generally applicable; a non-empty
   revision set requires a non-empty validated query set with at least one
   exact match;
3. current Admin role, Workbench surface and
   `institution_admin_online_answer` authorization pass.

Indexing additionally requires exact authenticated My-Chat service evidence
and purpose `institution_knowledge_indexing`. Service identity is routing
evidence, not permission: Workspace/Institution, publication, review,
protected body and safety predicates still run in Nurture. Index presence does
not expose a future-effective source because no candidate reaches model
context until online currentness passes.

Publishing without review or a current medical authority source remains a
valid 0F-1 business fact but returns `ineligible`; it never falls back to a
draft, superseded revision, linked excerpt alone or a generic host source.

## 4. Exact bridge ports

### Nurture source-change provider

`InstitutionKnowledgeSourceChangeProviderV1` is a bounded pull contract for
the authenticated My-Chat consumer:

- `listSourceChanges(afterCursor?, limit<=100)` returns an opaque monotone
  cursor plus body-free `published | superseded | revoked | review_changed`
  changes;
- each change carries exact Nurture source canonical ref, source version,
  Institution ref, item head, event ref/type and committed time;
- `readSourceForIndexing(sourceRef, sourceVersion)` reruns the indexing
  predicate and returns either an exact source snapshot, `ineligible`, or
  `unavailable`;
- `listCurrentSourceStates(reconciliationRef?, afterSourceCursor?, limit<=100)`
  provides a body-free full-reconciliation page over every current publication,
  ordered by canonical source ref. The first page fixes an opaque
  `reconciliationRef` and owner `evaluatedAt`; continuations must use that same
  snapshot or fail `unavailable`. Each row carries the exact source ref/version,
  content hash and `indexable | ineligible` decision. The terminal page is
  explicit, so the Host may compare its inventory only after one complete
  snapshot. This recovers changes that are not lifecycle writes, including
  time-window passage, authority-source currentness and a 0F-3 safety-hold
  resolution;
- source snapshot contains canonical source ref/version/content hash,
  `sourceKind=nurture_institution_revision`,
  `provenanceKind=institution_authored`, title/summary/sections, category,
  applicability/safety metadata, current publication event and linked
  authority-source refs/versions;
- cursor and refs contain no body, actor identity, role, child/family fact,
  encryption key, provider payload or database ID.

The 0F-1 append-only event sequence is the change cursor source; current-source
reconciliation is a bounded snapshot over the same canonical item/revision
facts plus later safety facts. A row becoming `ineligible` is an explicit
removal signal; an index entry absent from a completed snapshot is removable
only after an exact read confirms it is no longer a current publication.
Nurture adds no knowledge outbox or consumer cursor table. My-Chat owns its
durable cursors, ingestion ledger, index lifecycle and retries. A missed
notification or non-event eligibility change is recoverable by
pull/reconciliation; it never makes a stale source authorized.

### My-Chat retrieval consumer

`InstitutionKnowledgeRetrievalOwnerPortV1` receives the trusted online context
and query metadata and returns a bounded maximum of 16 candidate packages:

- candidate ref, source owner/kind/version, content hash, rank/match reason and
  nonblank excerpt of at most 1,200 characters / 4,096 UTF-8 bytes;
- host PBR/current-source decision and generic lifecycle metadata;
- separate Nurture Institution source versus My-Chat authority-source
  provenance; no `reviewed_curated` or authority upgrade by adapter mapping;
- no answer text, diagnosis, recommended action, prompt/provider payload,
  embedding/vector, permission internals or raw private body.

Owner denial produces a legal empty candidate set. Owner/contract/technical
unavailability produces `unavailable`, not empty and not a local-search
fallback.

### Nurture currentness validator

`InstitutionKnowledgeSourceCurrentnessProviderV1` validates at most 32 exact
Nurture source ref/version/content-hash tuples in one bounded call. It rereads
the current publication/review/applicability/safety facts under the trusted
answer context and returns an ordered decision per input:

```text
eligible | denied | unavailable
```

Denied reasons are closed in v1:

```text
scope_denied | not_published | review_incomplete | audience_denied
| not_yet_valid | expired | applicability_mismatch | safety_hold
| authority_source_invalid | content_drift
```

Technical/owner failure is `unavailable`. The validator returns no body or
policy internals. 0F-3 must call it again on the citations actually used by a
model; pre-generation validation alone is not final citation evidence.

## 5. Preview eligibility

Editor preview is deliberately not online retrieval:

- exact current Admin Workbench authority is mandatory;
- every option resolves to the same Workspace/Institution and exact revision;
- draft, published and superseded revisions may be selected; revoked revisions
  are excluded;
- selected drafts may be unreviewed or outside their publication time window,
  because preview displays explicit warnings rather than claiming online
  eligibility;
- protected-body or authority-owner failure makes the selected revision
  unavailable; it is not silently omitted;
- preview context is constructed in memory for one invocation and is neither
  indexed nor reusable by online answer, export or another actor.

Preview cannot publish, review, revoke, create a source, clear a safety hold or
execute any attendance/Workflow action.

## 6. Concurrency, cache and replay

- Retrieval and validation are side-effect-free and create no Nurture command
  identity.
- Source-change cursors are monotone over committed 0F-1 events. Re-reading a
  cursor range is exact and idempotent; one current-source reconciliation uses
  one opaque snapshot, stable canonical-ref ordering and an explicit terminal
  page. An expired snapshot is unavailable and restarts; partial or mixed
  snapshots cannot authorize inventory deletion.
- Source version is the immutable revision number plus content hash; item head
  is concurrency evidence and never replaces source identity.
- Host index/cache presence is never authority. Every online candidate is
  owner-revalidated after retrieval, and every used citation is revalidated
  again by 0F-3 after generation.
- A publish/review/revoke/source-currentness change between phases removes or
  denies the stale candidate; results never merge old and new source versions.
- Retry is allowed only for an explicit `unavailable` provider result. Policy
  denial, empty eligibility and source drift are terminal for that invocation.

## 7. Default-safe behavior

| Condition | Result |
| --- | --- |
| Wrong/ambiguous role, surface, Workspace or Institution | deny before query/body/source read |
| Caller supplies child/family/source/scope/purpose internals | invalid request |
| Draft/superseded/revoked/unreviewed revision | not indexable or online; never fallback |
| Future `validFrom` revision | may be indexed, but remains online-ineligible until repository time reaches it |
| Medical revision lacks a current exact authority source | ineligible online/indexing; editor preview warning only |
| Age/scenario-specific source lacks matching trusted context | ineligible |
| Host generic RAG/PBR unavailable or contract mismatched | unavailable; no local search/vector fallback |
| Nurture owner/currentness unavailable | unavailable; no cached-authority fallback |
| All candidates denied/stale | legal empty eligible set for 0F-3 no-source abstention |
| Source changes after retrieval | removed at final currentness/citation validation |
| Preview option cannot resolve exactly | whole preview unavailable; no silent omission |

## 8. Fixtures, owner delta and DB posture

Required fixtures:

1. only current published, reviewed, audience-safe sources pass indexing;
   online use additionally requires current time/applicability, while a future
   `validFrom` may be indexed but cannot pass online currentness;
2. draft is usable only through exact Admin preview and never appears in
   source changes, index or online candidates;
3. wrong role/surface/Institution and caller-supplied child/private/source
   fields fail before retrieval;
4. medical source without current exact authority evidence is ineligible;
5. `public_rag_answer`, `knowledge_ingestion` from an unqualified adapter and
   reserved `external` activation are rejected as scenario-purpose substitutes;
6. source-change replay is cursor-stable/body-free and review changes are
   visible; one stable, terminally complete reconciliation snapshot rediscovers
   non-event eligibility without deletion from a partial/mixed scan;
7. retrieval owner denial is empty while owner/technical failure is
   unavailable;
8. stale item head, source version, content hash, revoke, review change and
   safety hold fail currentness;
9. post-retrieval and post-generation validation both remove drifted sources;
10. limits of 100 source changes/reconciliation rows, 16 candidates, 32
    validations and 8 preview revisions reject overflow instead of truncating
    silently;
11. preview failure is all-or-nothing and writes no source/index/cache;
12. static boundaries find no My-Chat ORM/provider/RAG SDK import, local vector
    store, host outbox or Nurture retrieval cache.

The pinned My-Chat contract still needs an accepted Institution-specific owner
delta before I3: admitted Nurture source kind/provenance, the three scenario
purposes, owner-currentness callback, and citation metadata that preserves
Institution versus authority identity. The current generic implementation is
`PRESENT_PINNED`; that scenario delta remains `DEFINED_UNQUALIFIED`. 0F-2 does
not advance the external pin or invent a compatibility mapping.

0F-2 plans no new Nurture table beyond the 0F-1 facts. Provider cursors derive
from its event table; candidate packages and preview context are noncanonical
in-memory values. 0F-3 separately owns any conflict-review/safety fact it
freezes. My-Chat owns index, vector, cache, consumer cursor and generic runtime
persistence.

## Exit

`G4_0F_2_FREEZE_PASS` releases 0F-3 and G4-E increment 2 only after full 0F
Exit. It does not authorize owner adoption, schema apply, source ingestion,
model invocation, public capability rotation, activation or traffic.
