# G4-0F Knowledge & RAG — Scope Freeze

## Status

- Date: 2026-08-10
- Task: T-007
- Stage: G4-0F Knowledge & RAG Contracts
- State: **SCOPE ACCEPTED — unit freezes follow; no implementation or activation effect**
- Inputs: 0A inventory ([`07`](./07-g4-0a-inventory-record.md)), 0C Exit
  ([`19`](./19-g4-0c-exit-record.md)), the Knowledge/RAG decisions in
  `02-architecture.md`, and the exact My-Chat owner source pin below.

This record fixes the decomposition and ownership of 0F. It authorizes only
the three unit freezes below. It does not create a knowledge aggregate, apply a
schema, add a Surface capability, invoke a model, index a source, adopt the
current My-Chat checkout, or create traffic.

## Exact owner source pin

The SSOT is
`docs/project/integrations/my-chat-knowledge-rag-contract.json`, verified by:

```bash
node scripts/verify-knowledge-rag-contract-pin.mjs
```

It pins the My-Chat domain Knowledge types/repository, sole PBR entrypoint,
generic RAG service and all three package export manifests at revision
`567b96cd5ddf2a0534fee21dd87f677439f40b78`.
The verifier hashes committed Git objects, so a different local checkout cannot
silently change the frozen source. The current checkout differs from that
revision; the source artifact is exact, but real owner adoption is not claimed.

The generic owner already supplies source lifecycle/trust metadata, PBR,
retrieval, current-source citation validation and a structured citation
package. Its active source types are discussion/provisional/curated and its
purposes are public answer/ingestion. It does **not** define Nurture Institution
revision/publish, intended audience, age/scenario applicability, Admin draft
preview, authority-linked medical provenance, conflict review or a scenario
source/currentness bridge. 0F must freeze those gaps; it must not disguise an
Institution request as `public_rag_answer` or activate the reserved `external`
source type by convention.

## Current facts

| Input | Current truth |
| --- | --- |
| Institution knowledge | No Nurture Institution knowledge item, revision, publication, provenance or review aggregate exists |
| Legacy corpus models | `NurtureContextMaterial` and `NurtureRuntimeContextPack` are family-scoped 5h/5i corpus/orchestration models; they are not Admin-editable Institution knowledge and are excluded |
| Generic host RAG | My-Chat owns search/vector/model/RAG runtime, PBR, prompt/model registry, host routes and telemetry; the exact generic source pin above is reusable only through an accepted owner adapter |
| Existing protected content | Nurture has protected-content primitives, but no knowledge-specific body owner, retention or publication policy is implied by them |
| Child facts | 0F v1 admits no child-specific fact source or child identifier; age band and scenario are applicability filters, not inferred child evidence |
| Manifest/module | No Institution knowledge/RAG capability or handler exists; the branch remains absent/default-off |

## Units and order

| Unit | Owns | Depends on | Releases |
| --- | --- | --- | --- |
| **0F-1 Knowledge lifecycle and provenance** | item/category; immutable revision; structured protected body; intended audience and age/scenario applicability; institution-authored versus authority-linked provenance; explicit publish/revoke and current-revision rules | 0C-1/0C-2 authority | 0F-2, G4-E increment 1 |
| **0F-2 Retrieval eligibility and owner bridge** | online versus exact Admin-preview purpose; actor/Institution/audience/purpose/safety/currentness predicates; host ingestion/read/currentness ports; draft and child-fact exclusion | 0F-1 and the exact generic owner source pin | 0F-3, G4-E increment 2 |
| **0F-3 Citation, answer safety and conflict review** | claim-to-citation result; institution versus authority presentation; no-source abstention; medical-conflict abstention/review candidate; export/copy AI provenance | 0F-1/2 | G4-E increment 3 |

0F-1 is the only owner of knowledge revision and publication. 0F-2 never turns
an index row into a canonical source or authority grant. 0F-3 may create a
review candidate from exact conflicting sources, but it cannot edit, publish,
revoke or resolve knowledge by itself.

## Cross-cutting invariants

1. **One canonical source.** Nurture owns Institution knowledge semantics,
   revision bodies, publication and review facts. My-Chat owns rebuildable
   chunks/embeddings, generic retrieval/model execution and telemetry; neither
   side mirrors the other's canonical rows.
2. **Publication, retrieval eligibility and read authority are separate.** A
   published revision can remain ineligible, and an eligible source still
   requires current actor/scope/purpose checks on every retrieval and citation
   validation.
3. **Provenance never upgrades content.** Authority links remain separate
   sources. They do not turn an Institution-authored statement into an
   authority statement, even after human review or AI citation.
4. **Draft preview is an exact editor action.** It names selected revision refs
   and may use drafts only inside the Admin editor. It never enters online
   retrieval, another Surface, export, family communication or background
   indexing.
5. **No child-fact shortcut.** V1 accepts no child ref, private care fact,
   diagnosis, inferred mental state or family-private material as a knowledge
   source. Age/scenario labels are coarse applicability metadata only.
6. **Citations are revalidated results.** A model-supplied citation is never
   trusted. Every returned claim cites an actually retrieved, still-current,
   actor-safe source revision; otherwise the answer abstains.
7. **Medical safety is deterministic at the boundary.** Material conflicts do
   not get blended or adjudicated by the model. Deterministic medical steps
   abstain, exact conflicting refs produce a review candidate, and fixed
   guidance never diagnoses, prescribes or replaces emergency/medical care.
8. **No local LLM runtime.** 0F adds no provider SDK, vector store, model route,
   prompt template, credential/config key or retry/telemetry implementation to
   Nurture. Those remain My-Chat responsibilities under registry-first host
   governance.
9. **No clock-authored lifecycle.** `validFrom`/`validUntil` affect eligibility;
   a timer does not publish, revoke, review, resolve or rewrite a revision.

## Explicitly deferred or forbidden

- caregiver/Guardian/child-facing RAG Surfaces and family-share export without
  separately frozen audience, consent and capability contracts;
- child-specific retrieval, private Memory Index, attendance/care fact
  retrieval and personality/mental-state inference;
- automatic authoring, review approval, publication, revocation or conflict
  resolution by AI;
- a Nurture vector database, provider SDK, prompt/model registry, generic RAG
  route, copied My-Chat Knowledge ORM or use of Convex/display projections as
  retrieval authority;
- reuse or renaming of `NurtureContextMaterial`/`NurtureRuntimeContextPack` as
  Institution knowledge facts;
- treating an authority URL, generic source type, index presence, routing ref
  or My-Chat identity as read or publication permission.

## Exit

0F Exit requires all three unit records, a 0G cross-contract audit and a branch
release. It opens G4-E I1 domain/persistence implementation only. Shared or
persistent DB apply, public Surface rotation, real My-Chat owner adoption,
model execution, indexing, activation, deployment and traffic remain closed.
