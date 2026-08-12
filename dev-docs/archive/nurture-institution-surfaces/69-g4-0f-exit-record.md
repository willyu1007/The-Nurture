# G4-0F Exit Record

> **NON-NORMATIVE FOR CURRENT ANSWER SAFETY.** This historical branch exit
> remains evidence for the 0F decomposition, but its answer-safety `1.0.0`
> row/provider gate is superseded. Current Q3 authority is the sole `/v2`
> qualification `2.1.0` and
> [`80`](./80-g4-e-q3-provider-qualification-contract.md).

## Verdict

- Date: 2026-08-10
- Task: T-007
- Stage: G4-0F Institution Knowledge & RAG Contracts
- Verdict: **`G4_0F_EXIT_PASS`**
- Opens: **G4-E I1 only**, beginning with 0F-1 domain/persistence artifacts
- Effects: documentation only. No Prisma/schema/migration authoring or apply,
  DB access, source ingestion, model/safety owner call, public contract,
  capability, activation, deployment or traffic.

## Frozen branch

| Unit | Record | Contract | Nurture DB posture |
| --- | --- | --- | --- |
| Scope, ownership and exact generic source pin | [`64`](./64-g4-0f-scope-freeze.md) | branch decomposition + `my-chat-knowledge-rag-contract.json` | none |
| Knowledge lifecycle and provenance | [`65`](./65-g4-0f-1-knowledge-lifecycle-provenance-freeze.md) | `nurture.institution-knowledge-lifecycle@1.0.0` | four tables planned, not applied |
| Retrieval eligibility and owner bridge | [`66`](./66-g4-0f-2-retrieval-owner-bridge-freeze.md) | `nurture.institution-knowledge-retrieval@1.0.0` | no new table |
| Citation, answer safety and conflict review | [`67`](./67-g4-0f-3-citation-answer-safety-freeze.md) | historical `nurture.institution-knowledge-answer-safety@1.0.0`, superseded by current V2 SSOT | one table planned, not applied |

The 0G audit [`68`](./68-g4-0g-0f-audit-record.md) passes after repairing two
collisions: conflict candidate versus eligibility/replay, and candidate append
versus knowledge-lifecycle mutation ownership. No finding is deferred.

## Exact release boundary

G4-E I1 may implement the frozen Nurture-owned facts and pure policy in unit
order. The first implementation node is limited to 0F-1:

- strict domain types for item, immutable revision/body/provenance, explicit
  review and publish/revoke events;
- pure body/metadata/lifecycle/concurrency/idempotency decisions;
- repository/transaction ports that return domain entities and do not import
  Prisma;
- Prisma SSOT and migration **authoring only** for the four 0F-1 tables;
- synthetic unit fixtures, persistence-boundary/static checks and explicit
  manifest/module absence.

The later I1 nodes may implement 0F-2 pure eligibility/owner ports and 0F-3
strict answer/citation/safety/candidate policy only after their predecessor
quality gates pass. They may author the fifth candidate table but cannot add a
candidate status/event track, local answer cache, provider/model/vector runtime
or second knowledge lifecycle.

## Readiness carried forward

| Input | Exit posture |
| --- | --- |
| Generic My-Chat Knowledge/PBR/RAG source | `PRESENT_PINNED` at `567b96cd5ddf2a0534fee21dd87f677439f40b78` / `554e79d4e12b5aa2ef1794e46638b2705a606fc7e035e35d0d5167a8bf23ad66` |
| Institution source/retrieval/currentness bridge | `DEFINED_UNQUALIFIED` |
| Replayable structured generation/authority-content currentness | `DEFINED_UNQUALIFIED` |
| Historical V1 answer-safety provider/rule-set gate | `SUPERSEDED`; not a current qualification input |
| Public Knowledge Surface artifact/caller | absent; later I2 work |
| Persistent/shared DB apply | unauthorized |

At this historical exit, no adapter could map `institution_admin_online_answer` to
`public_rag_answer`, activate reserved `external`, relabel a generic excerpt
fingerprint as authority content hash, or use a model self-rating as the
deterministic safety owner. That provider-gate wording is not current; use
[`80`](./80-g4-e-q3-provider-qualification-contract.md) for the V2 adapter and
qualification state.

## Invariants handed to G4-E

1. Nurture owns Institution item/revision/publication/review and conflict-
   candidate facts; My-Chat owns generic index/vector/retrieval/generation and
   telemetry.
2. Publication, index admission, online eligibility and current actor read
   authority are separate gates.
3. `institution_authored` and `authority_source` never collapse through review,
   link, trust label, citation or presenter mapping.
4. V1 accepts no child/family/private-care source; free-text privacy is checked
   before generation and question text is never persisted in Nurture facts.
5. Every positive claim is bounded/cited/finally current. Medical facts,
   first-aid actions and danger signals require a current authority citation.
6. No-source, unavailable, source drift, medical conflict and safety abstention
   retain different meanings and never produce partial/cached fallback text.
7. Draft preview is exact Admin-only/in-memory and cannot index, answer, export,
   publish or create/alter a conflict candidate.
8. The immutable conflict candidate is review evidence only: no status,
   deadline, blocker, dismissal, eligibility effect or second review lifecycle.
9. My-Chat generation replay and Nurture command replay remain separate owner
   ledgers; response loss reruns currentness/safety before presentation.
10. Five planned tables do not overlap. `NurtureCommandExecution` and the
    protected-content port are reused; no Nurture answer/model/index/outbox
    table is introduced.

## What this Exit does not open

This Exit is not G4-E implementation evidence, Surface Contract, Owner
Integration Readiness, Joint Conformance, Beta Profile Handoff or Candidate
Freeze. It does not authorize:

- applying migrations to a shared, persistent, staging or production database;
- applying even to a disposable DB without a separately resolved exact target
  and approval for that qualification node;
- importing My-Chat ORM/RAG/provider code or binding the moving checkout;
- source ingestion, embedding/index writes, model/safety calls or positive
  online-answer claims;
- public handler/presenter registration, capability rotation, copy/export
  route, deployment, activation or traffic;
- caregiver/Guardian/family-share/child-specific retrieval or external
  delivery.

T-007 remains in progress and T-008 continues to wait for the complete T-007
Exit. G4-D I3 remains independently gated by G-09.

## Honest limitation

`G4_0F_EXIT_PASS` proves that the implementation inputs are exact,
non-overlapping and default-safe. It executes no policy, transaction, migration,
retrieval, generation or safety provider. Positive source-cited answers and
medical conflict behavior remain obligations for later G4-E implementation and
real owner qualification; they are not implied by this documentation pass.
