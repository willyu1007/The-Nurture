# G4-0F-3 Citation, Answer Safety & Conflict Review — Freeze Record

## Status

- Date: 2026-08-10
- Task: T-007
- Contract identity: `nurture.institution-knowledge-answer-safety@1.0.0`
- Consumes: 0F scope/source pin ([`64`](./64-g4-0f-scope-freeze.md)),
  lifecycle/provenance ([`65`](./65-g4-0f-1-knowledge-lifecycle-provenance-freeze.md))
  and retrieval/currentness ([`66`](./66-g4-0f-2-retrieval-owner-bridge-freeze.md))
- Verdict: `G4_0F_3_FREEZE_PASS`
- Schema delta: **one immutable conflict-review candidate table planned, not applied**
- Non-effects: no candidate row, model call, export, schema apply, owner adoption,
  Surface, activation or traffic.

## 1. Owners and exact operation

| Role | Owner/source |
| --- | --- |
| Answer request authority, eligible Nurture sources and final Nurture currentness | 0C + 0F-2 Nurture policies/providers |
| Generic retrieval, generation replay, authority-source currentness and model telemetry | My-Chat owner through exact scenario adapters; generic source baseline remains the [`64`](./64-g4-0f-scope-freeze.md) pin |
| Claim/citation schema, source precedence, abstention and conflict-candidate policy | Nurture 0F-3 |
| Deterministic request/source/draft safety decision | Exact answer-safety owner through `InstitutionKnowledgeAnswerSafetyOwnerPortV1`; no generative model may implement this decision |
| Immutable conflict-review candidate | Nurture 0F-3 repository; Admin Workbench is a consumer only |

`answerInstitutionKnowledgeV1` is an effectful operation, not a read-only
database query: the Host generation owner records/replays one generation and a
material source conflict may append one Nurture review candidate. Trusted
server context supplies the exact invocation, actor, current Admin assignment,
Workspace, Institution, Workbench surface and
`institution_admin_online_answer` purpose. The caller supplies only the closed
0F-2 online query. The caller cannot name candidates, citations, claim types,
safety decisions, model/provider fields, conflict findings, child/family facts,
heads or command identities.

The exact execution order is:

1. authorize and validate the 0F-2 query;
2. retrieve at most 16 candidates and validate every Nurture and authority
   source before any model context is built;
3. run deterministic request/source safety; conflict or unsafe-request results
   abstain before generation;
4. invoke one replayable Host generation over only the validated candidates;
5. reject extra fields, unsupported citation refs and invalid claim shapes;
   route an unsafe draft to the closed safety abstention;
6. revalidate every distinct citation actually used against its canonical
   owner after generation;
7. construct citations from owner facts, then return one bounded result.

No model output, index row, excerpt, URL or citation ID can skip a phase.

## 2. Exact owner ports

### Generation owner

`InstitutionKnowledgeGenerationOwnerPortV1` accepts the trusted invocation,
question, exact purpose, answer-policy version and at most 16 already-validated
candidate packages. The Host returns exactly one strict draft:

- `generationRef`, canonical input digest, generated time and
  `assistanceKind=ai_generated_with_retrieved_sources`;
- 1..8 ordered claim drafts, each with nonblank text of at most 800 characters /
  3,200 UTF-8 bytes, one closed claim kind and 1..4 unique candidate refs;
- no prose outside claims, source object, new URL, diagnosis/prescription flag,
  action execution, conflict decision, role/scope decision or provider payload.

Claim kinds are closed:

```text
institution_process | developmental_guidance | care_guidance
| medical_fact | first_aid_action | danger_signal
```

For one invocation identity and canonical input digest, Host replay returns the
same immutable draft and `generationRef`. A changed input under that identity
conflicts. Missing replay support, malformed output, extra fields, unknown refs
or Host failure is `unavailable`; Nurture does not call another model, compose
free text locally or return a partial draft.

### Authority citation currentness

`InstitutionKnowledgeAuthorityCitationCurrentnessOwnerPortV1` validates at
most 16 distinct exact authority source ref/version/content-hash tuples under
the trusted Workspace/Institution/purpose context. It uses the pinned generic
current-source validation behavior through a scenario adapter and returns one
ordered `eligible | denied | unavailable` result per input. Closed denials are:

```text
scope_denied | source_not_current | source_not_readable | content_drift
```

The adapter returns no body, owner policy internals or replacement source. A
denied tuple is removed; technical/contract failure makes the operation
unavailable. Nurture citations continue to use the 0F-2 currentness provider.
The pinned generic `sourceVersion` and excerpt fingerprint do not by themselves
satisfy the required authority content hash. The scenario bridge remains
unqualified until the owner supplies that exact content identity; an adapter
must not relabel an excerpt fingerprint or snapshot hash as source content
currentness.

### Deterministic answer safety

`InstitutionKnowledgeAnswerSafetyOwnerPortV1` exposes two bounded decisions
under one exact `ruleSetRef` and rule version:

1. `evaluateRequestAndSources` receives the question plus at most 16 exact,
   current candidate ref/version/hash/excerpt packages and returns
   `general_clear | medical_clear | unsafe_request | material_source_conflict | unavailable`;
2. `validateDraft` receives the exact generation ref, ordered draft claims and
   referenced source packages and returns `safe | unsafe | unavailable`.

The same normalized input and rule version must produce the same ordered
decision and evidence fingerprints. This owner is a deterministic policy
service, not the generation model, prompt instruction or model self-rating.
Until an exact provider and replay fixtures are qualified, all online
generation is unavailable: Nurture cannot safely infer that a free-text
question is non-medical. No keyword or compatibility classifier is allowed.

`material_source_conflict` contains 1..8 findings. Each finding names 2..8
unique exact current source tuples from the supplied candidate set and one
closed class:

```text
contradictory_action | contradictory_sequence
| contradictory_escalation | contraindication_conflict
```

`unsafe_request` and unsafe draft reasons are closed:

```text
child_specific_or_private_fact | person_specific_diagnosis
| prescriptive_medication_or_dose
| emergency_replacement | unsupported_deterministic_step
```

Unsafe request/draft output is never used as a knowledge-source conflict
candidate. An unknown/duplicate source tuple, finding class, safety reason or
extra field makes the safety result unavailable. A candidate records only
exact conflicting canonical sources.

## 3. Result, claim and citation contract

`InstitutionKnowledgeAnswerResultV1` is a closed union:

```text
answered | abstained_no_source | abstained_source_changed
| abstained_medical_conflict | abstained_safety
```

`unavailable` is an operation failure outside this union. It never masquerades
as no-source abstention, and no result invents a deadline, blocker or knowledge
lifecycle state.

An `answered` result contains 1..8 ordered `InstitutionKnowledgeClaimV1`
values, 1..16 unique citations and AI-assistance provenance. Every claim keeps
the strict model text and closed claim kind, references 1..4 citations, and has
no uncited prefix/suffix/summary. Every cited source must have been retrieved,
prevalidated and finally revalidated in this invocation. The entire canonical
result JSON is at most 65,536 UTF-8 bytes; overflow is unavailable rather than
silently truncated.

Medical claims have stricter source precedence:

- `medical_fact`, `first_aid_action` and `danger_signal` each require at least
  one current `authority_source` citation;
- an Institution revision may explain local escalation or process but cannot
  be the sole medical authority;
- `institution_process` prefers the current Institution publication;
- no trust label, review state or linked URL changes
  `institution_authored` into `authority_source`.

`InstitutionKnowledgeCitationV1` is constructed by Nurture from current owner
facts, never copied from model prose. Common fields are an invocation-local
citation ref, exact source ref/version/content hash, title, nonblank excerpt of
at most 600 characters / 2,400 UTF-8 bytes and optional current owner-issued
open ref. The source union is exact:

- `institution_material`: label `园区材料`, item/revision ref, revision number,
  publication event/time and `provenanceKind=institution_authored`;
- `authority_source`: label `权威来源`, opaque owner ref/version,
  publisher, source date and `provenanceKind=authority_source`.

Raw database IDs, rank/score/vector, permission internals, prompt/provider
payload, actor identity, child/family ref and sealed content never appear.

## 4. Abstention and fixed safety presentation

- Retrieval with zero eligible candidates returns `abstained_no_source` and no
  citation, generation or candidate write.
- Candidates removed before generation also become no-source; a source removed
  only by final post-generation validation returns
  `abstained_source_changed`, exposes no stale excerpt and does not retry with a
  different source set inside the invocation.
- A material source conflict returns `abstained_medical_conflict`, no generated
  claim text, 1..8 conflict presentations and the exact candidate refs produced
  by section 5. Every displayed conflict source is finally current.
- An unsafe request or draft returns `abstained_safety`, no generated text and
  no source-conflict candidate. In particular, question text containing
  child-specific/private care facts cannot turn the no-child-field DTO into a
  child-specific retrieval channel.

Medical answered results and every safety abstention append an immutable
`InstitutionKnowledgeSafetyNoticeV1` selected by Nurture reason keys, not by a
model:

```text
not_a_diagnosis | not_a_prescription | not_emergency_replacement
| seek_qualified_medical_help | remove_child_specific_details
```

The selected notice uses only keys relevant to the decision; child-private
input receives `remove_child_specific_details`, while medical results use the
medical notice keys. A notice may direct the user to qualified or emergency
help but cannot add a diagnosis, medication/dose, deterministic treatment step
or claim of source consensus. A technical failure may display the same fixed
notice through the error presenter, but never a cached or partially generated
answer.

## 5. Immutable conflict-review candidate

`InstitutionKnowledgeConflictReviewCandidateV1` is an immutable, noncanonical
review input. A stable candidate identity hashes the exact Workspace,
Institution, rule-set/version, conflict class, deterministic finding
fingerprint, sorted source ref/version/hash tuples and sorted targeted Nurture
revision refs. Question text, actor identity, invocation identity and model
output are excluded, so separate users observing the same source conflict
converge on one candidate without merging different findings on the same
sources.

Before writing, every evidence tuple is finally current. The internal
`record_institution_knowledge_conflict_candidate` command reuses
`NurtureCommandExecution`; exact replay or a uniqueness race returns the one
candidate, while changed evidence cannot merge. The command is reachable only
from the deterministic answer-safety service, never as a public capability or
model action.

The candidate stores exact scope, finding/rule identity, source tuples,
optional targeted revision refs, created time, command execution and one
schema-validated sealed evidence payload. Canonical plaintext evidence is at
most 8,192 UTF-8 bytes and always preserves every source tuple/fingerprint.
Optional excerpts use one closed `all | none` mode: if all excerpts do not fit,
none is sealed and no partial source evidence is implied. The payload contains
no question, child/family/private-care fact, generated answer, prompt/provider
payload or credential.

There is no candidate status, deadline, blocker, mutable resolution field or
second knowledge review lifecycle. A candidate creates a monotone safety hold
only for the exact targeted Nurture revision/source version. Admin review uses
the 0F-1 create-revision, review, publish or revoke commands; a new published
revision is re-evaluated independently. The candidate itself cannot edit,
review, publish, revoke, dismiss or restore knowledge. Historical evidence is
retained even after the targeted revision is superseded or revoked.

An authority-only conflict still creates an Institution-scoped review
candidate but cannot mutate or hold the authority owner source. The exact
source combination is rejected for the invocation and reevaluated on later
requests.

## 6. Concurrency, replay and drift

- Host generation identity belongs to My-Chat; conflict-candidate command
  identity belongs to Nurture. Neither side copies the other's ledger.
- Response loss after generation reuses the same Host draft, then reruns all
  currentness and safety gates. A stale replayed draft is never returned.
- Response loss after candidate commit returns the one immutable candidate;
  concurrent invocations with the same conflict identity cannot create two.
- Source version/content hash drift between retrieval, safety, generation and
  presentation removes the exact source. It never substitutes a newer revision
  or blends old/new excerpts.
- Final currentness covers all distinct used citations, at most 16, so it fits
  both bounded owner validators without truncation.
- Retry is permitted only for explicit owner/technical `unavailable`. Policy
  abstention, source drift, unsafe input and material conflict are terminal for
  that invocation.

## 7. Copy and export

Only an `answered` Admin Workbench result may be copied or exported in 0F v1.
`InstitutionKnowledgePortableAnswerV1` preserves the ordered claims, all
citations, fixed safety notice when present, exact generated time/generation
ref and `assistanceKind=ai_generated_with_retrieved_sources`. Copy/export may
change formatting only; dropping citations or AI provenance invalidates the
whole artifact.

Portable output creates no Nurture canonical row and grants no family share,
Guardian/caregiver visibility, notification, external connector or
communication authority. Preview, abstention and unavailable results cannot be
exported. My-Chat owns any future file renderer/download route and delivery
telemetry after a separate contract freeze.

## 8. Default-safe behavior

| Condition | Result |
| --- | --- |
| Wrong/ambiguous Admin role, scope, surface or purpose | deny before retrieval/model/body read |
| Caller supplies trusted/source/model/safety/child fields | invalid request |
| Zero eligible source before generation | `abstained_no_source`; no model/candidate |
| Generic RAG/generation/currentness adapter unqualified or unavailable | unavailable; no local fallback |
| Answer-safety owner unqualified/unavailable | all online generation unavailable; no compatibility classification |
| Material medical conflict | abstain, current citations + one deduplicated candidate; no deterministic medical step |
| Child-private, diagnostic, prescriptive or emergency-replacement request/draft | `abstained_safety`; no draft text/candidate |
| Unknown/extra claim, citation or candidate ref | unavailable; no partial answer |
| Medical claim lacks current authority citation | unavailable; no Institution-only fallback |
| Used source drifts after generation | `abstained_source_changed`; stale citation hidden |
| Copy/export would omit citation or AI provenance | reject whole portable artifact |
| Candidate write fails | conflict result unavailable; never report an unrecorded candidate ref |

## 9. Fixtures, owner delta and DB posture

Required fixtures:

1. positive general and medical answers contain only bounded cited claims;
   every medical claim has a current authority citation;
2. no-source, pre-generation removal, final drift, conflict, unsafe request,
   unsafe draft and technical failure remain distinct and fail closed;
3. model-added prose, URL, citation ref, source, field or action is rejected;
4. Nurture and authority citations are independently finally revalidated;
   generic source version/excerpt fingerprint cannot masquerade as the exact
   authority content hash;
5. Institution authorship never receives an authority label through review,
   link, Host trust label or presenter mapping;
6. same invocation/digest exactly replays one Host draft; changed input
   conflicts and stale replay is revalidated;
7. same conflict evidence across actors/invocations creates one candidate;
   changed source version/hash/rule cannot merge;
8. candidate evidence is sealed, <=8,192 bytes and excludes question,
   child/family/private facts, model/provider data and credentials;
9. conflict candidate is immutable; a targeted revision can be made irrelevant
   only by the ordinary 0F-1 publication lifecycle, while an authority-only
   tuple changes only through owner source currentness, never candidate-state
   mutation;
10. authority-only conflict cannot mutate the external source;
11. copy/export preserves all claims, citations, safety notice and AI
    provenance and opens no family/external delivery;
12. static boundaries find no provider SDK, local model/prompt/vector runtime,
    My-Chat ORM/ledger, host route or duplicate knowledge review state.

The My-Chat scenario delta now includes the 0F-2 source/retrieval/currentness
bridge plus replayable structured generation and authority-citation
currentness. The deterministic answer-safety owner also requires an exact
provider and rule-set pin. These contracts are frozen but remain
`DEFINED_UNQUALIFIED`; the generic Knowledge/RAG source baseline alone does not
qualify them.

Planned table, not applied:

| Table | Purpose |
| --- | --- |
| `NurtureInstitutionKnowledgeConflictReviewCandidate` | immutable exact conflict identity, scope/source/revision/rule refs, sealed evidence and one command-execution link |

0F-3 reuses `NurtureCommandExecution` and the protected-content port. It adds
no candidate event/status table, answer/generation/citation cache, model/prompt,
chunk/vector/index, host outbox/ledger or child/family relation.

## Exit

`G4_0F_3_FREEZE_PASS` completes the three unit freezes and releases only the 0G
cross-contract audit and 0F branch Exit. It does not authorize schema apply,
model/safety/owner adoption, public contract rotation, source ingestion,
copy/export route, activation, deployment or traffic.
