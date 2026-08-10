# G4-0F-1 Knowledge Lifecycle & Provenance — Freeze Record

## Status

- Date: 2026-08-10
- Task: T-007
- Contract identity: `nurture.institution-knowledge-lifecycle@1.0.0`
- Consumes: 0C-1/0C-2 authority and the accepted 0F scope
  ([`64`](./64-g4-0f-scope-freeze.md))
- Verdict: `G4_0F_1_FREEZE_PASS`
- Schema delta: **planned, not applied**
- Non-effects: no knowledge row, migration, model call, index, Surface,
  activation or traffic.

## 1. Owner, consumer and source

| Role | Owner/source |
| --- | --- |
| Item, revision, publication, review and provenance facts | Nurture Institution Knowledge domain; this record |
| Authoring authority | Exact current 0C `institution_admin` role and Institution scope |
| Protected body | Existing Nurture protected-content port; the Knowledge repository stores only a validated sealed payload |
| Authority-source identity/currentness | My-Chat generic owner through the future 0F-2 bridge; a link snapshot is evidence, not a second authority source |
| Consumers | 0F-2 eligibility/source provider, 0F-3 citation/safety, G4-E Admin Web |

`NurtureContextMaterial` and `NurtureRuntimeContextPack` remain excluded. They
are family-scoped 5h/5i corpus/orchestration models and cannot be renamed,
extended or queried as Institution knowledge. My-Chat chunks, embeddings,
retrieval policies and generation records are also not Nurture facts.

## 2. Exact item and revision vocabulary

Knowledge categories are closed in v1:

```text
child_communication_development | daily_care_safety | institution_policy
| activity_resource | guardian_communication | basic_health_first_aid
```

Content safety classes are independent metadata:

```text
general_guidance | care_safety | basic_health_first_aid
```

Intended audiences are applicability labels, not permission grants:

```text
institution_admin | caregiver | guardian
```

Only `institution_admin` authoring and retrieval are enabled by the first
G4-E slice. A caregiver/Guardian audience label may describe intended content
but cannot open another Surface, export or family share.

`InstitutionKnowledgeItemV1` is the stable aggregate: exact Workspace and
Institution, category, `itemHead`, latest revision ref, optional currently
published revision ref, created/updated timestamps and no child/family ref.

`InstitutionKnowledgeRevisionV1` is an immutable revision body and metadata:

- monotone `revisionNumber`, exact item ref and content hash;
- one sealed, schema-validated `InstitutionKnowledgeBodyV1` containing title,
  summary and an ordered non-empty section list;
- fixed `authorship=institution_authored`;
- non-empty, duplicate-free intended audiences plus bounded age-band and
  scenario-key sets;
- safety class, optional `validFrom`/`validUntil`, exact author participant and
  role-assignment refs, and server-owned creation time;
- zero or more append-only `InstitutionKnowledgeAuthorityLinkV1` values.

An authority link contains an opaque owner-issued source ref, exact source
version, publisher/title/date/deep-link/excerpt snapshot, verification time and
snapshot hash. It remains `authority_source`; it never changes the revision's
`institution_authored` authorship. Raw fetched pages, credentials and provider
payloads are not stored.

Revision presentation state is derived from the item pointers and append-only
events:

```text
draft | published | superseded | revoked
```

There is no mutable draft row. Every save appends a new revision and moves the
latest pointer. Older drafts become `superseded` by an immutable event.

## 3. Body and metadata contract

The plaintext authoring DTO is exact and bounded before sealing:

```text
InstitutionKnowledgeBodyV1 {
  title: nonblank text <= 200
  summary: nonblank text <= 1000
  sections: 1..16 ordered {
    sectionKey: unique token
    heading: nonblank text <= 160
    body: nonblank text <= 4000
  }
}
```

The canonical UTF-8 JSON serialization must also be at most 8,192 bytes, the
existing protected-content plaintext limit. Per-field maxima do not override
that aggregate bound. Larger material is split into multiple knowledge items;
0F does not add a second blob/encryption path.

The DTO accepts no Workspace, Institution, actor, role, item/revision ref,
head, lifecycle, review state, publication time, source currentness, child ref,
family ref, diagnosis, generated answer, citation or model metadata. Scope and
owner evidence are server-resolved. Free text still passes the later safety
policy; a valid shape alone never makes a revision publishable or retrievable.

`validFrom < validUntil` when both exist. Absence means no author-specified
time window; it does not bypass publication, role, retrieval or source gates.
Dates affect eligibility only and never mutate revision state by themselves.

## 4. Commands and authority

0F-1 owns exactly five mutations:

```text
create_institution_knowledge_item
create_institution_knowledge_revision
record_institution_knowledge_review
publish_institution_knowledge_revision
revoke_institution_knowledge_revision
```

Every command resolves the exact current `institution_admin` assignment,
Workspace and Institution before reading or writing the aggregate. A dual-role
actor acts only through the selected Admin role. Caregiver, Guardian, Lead
labels, My-Chat identity, intended audience and source refs never grant write
authority.

Review decisions are explicit `reviewed | changes_requested`, name the exact
revision and reviewer role assignment, and append a reason key. `reviewed`
means Institution content review only; it is not medical credentialing or an
authority-source endorsement. AI can propose a review candidate later but
cannot execute this command.

Publishing names one exact revision and expected item head. It atomically
supersedes the previous current publication, points the item to the selected
revision and appends publication events. Publishing medical-class content is
allowed under Admin ownership even without a verified authority link, but it
does not make that revision online-retrieval eligible; 0F-2 owns that stricter
decision.

Revocation names the current published revision and expected item head,
clears the current publication pointer and appends a revoke event. It neither
selects an older revision nor publishes a replacement. Republishing always
requires a later explicit command.

## 5. Concurrency, idempotency and replay

- All writes reuse `NurtureCommandExecution`; 0F adds no idempotency ledger.
- Create-item atomically creates item head 1, revision 1 and its creation event.
- Later commands carry `expectedItemHead`; concurrent heads never merge.
- Exact request-identity replay returns the frozen result. A changed canonical
  input under the same identity conflicts.
- Revision numbers are allocated under the locked item head. A failed or
  losing command creates no revision, link, event or pointer change.
- Result DTOs contain item/revision refs, committed item head, derived revision
  state and server time only. Protected bodies, authority snapshots and actor
  evidence remain private.
- Response loss recovers through the command ledger and committed events; no
  Nurture knowledge outbox or My-Chat shared outbox is added in 0F-1.

## 6. Default-safe behavior

| Condition | Result |
| --- | --- |
| Role/Workspace/Institution unresolved or drifted | deny before protected-body or aggregate read |
| Body/metadata shape invalid | invalid; no sealing or row |
| Protected-content port unavailable | command unavailable; never store plaintext fallback |
| Requested authority source unavailable or stale during authoring | whole revision command unavailable; no silent link omission or partial revision |
| Head or revision conflict | stable conflict; no merge or partial event |
| Publish target is not exact current item revision | conflict; never infer latest |
| Revoke target is not current published revision | conflict; never revoke another version |
| No current publication | legal empty knowledge projection; no fallback to draft/superseded revision |
| Time window not current | revision remains unchanged and later retrieval excludes it |

## 7. Fixtures and gates

1. closed category/safety/audience vocabularies and exact body keys;
2. zero child/family/private-care or model fields in item/revision DTOs;
3. wrong/ambiguous/non-Admin role and Institution drift deny before body read;
4. create and append allocate monotone heads/revisions with immutable bodies;
5. exact replay returns one result and changed-payload replay conflicts;
6. two concurrent revision/publish commands produce one winner and no merge;
7. publishing atomically supersedes the prior publication and never an
   unrelated draft;
8. revocation clears the pointer without selecting or restoring an older
   revision;
9. an authority link preserves separate source identity and never changes
   `institution_authored`;
10. medical content can be published but is not thereby retrieval eligible;
11. `validFrom`/`validUntil` passage performs no lifecycle write;
12. protected-content failure stores no plaintext or partial aggregate;
13. legacy family corpus tables and My-Chat ORM/RAG runtime are absent from the
   repository and migration plan.

Synthetic lifecycle and concurrency tests belong to G4-E increment 1. Real
My-Chat authority-source currentness and source admission remain later 0F-2 / I3
gates.

## 8. DB delta

Planned tables, not applied:

| Table | Purpose |
| --- | --- |
| `NurtureInstitutionKnowledgeItem` | exact Workspace/Institution/category, item head, latest and current-published revision pointers |
| `NurtureInstitutionKnowledgeRevision` | immutable sealed body, content hash, applicability/safety metadata, author evidence and revision number |
| `NurtureInstitutionKnowledgeAuthorityLink` | append-only owner-issued authority ref/version and bounded provenance snapshot per revision |
| `NurtureInstitutionKnowledgeRevisionEvent` | immutable create/supersede/review/publish/revoke transition and audit evidence |

`NurtureCommandExecution` is reused. No `NurtureContextMaterial`, runtime
context pack, child/family relation, embedding, chunk, vector, prompt,
generation record, retrieval cache or host outbox table is added.

## Exit

`G4_0F_1_FREEZE_PASS` releases 0F-2 and G4-E increment 1 only after the full
0F branch Exit. It does not authorize schema apply, public contract rotation,
model invocation, indexing, owner adoption, activation or traffic.
