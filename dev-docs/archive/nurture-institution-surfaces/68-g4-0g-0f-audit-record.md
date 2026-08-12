# G4-0G Cross-contract Audit — G4-0F Branch

## Verdict

- Date: 2026-08-10
- Task: T-007
- Scope: 0F scope/source pin ([`64`](./64-g4-0f-scope-freeze.md)) and unit
  freezes [`65`](./65-g4-0f-1-knowledge-lifecycle-provenance-freeze.md)–[`67`](./67-g4-0f-3-citation-answer-safety-freeze.md)
- Verdict: `G4_0G_0F_AUDIT_PASS_AFTER_REPAIR`
- Findings: two cross-record collisions found and repaired; none deferred
- Effects: documentation only. No code, schema, DB, model, source, owner,
  capability, activation, deployment or traffic effect.

0G checks ownership and behavior *between* the accepted unit records. It does
not treat each record's local verdict as proof that their combined pipeline is
coherent.

## Finding 1 — review candidate as an eligibility hold broke replay

The first issued 0F-2/0F-3 combination treated an immutable conflict-review
candidate as an active retrieval hold. That looked conservative but created
two semantic defects:

1. the first invocation could retrieve current sources, detect a conflict,
   append the candidate and return `abstained_medical_conflict`; an exact retry
   after response loss would see the new hold during 0F-2 currentness, remove
   the same source and return `abstained_no_source`;
2. the candidate became a second eligibility SSOT beside the deterministic
   answer-safety owner, although the candidate has no resolution lifecycle.

The behavior violated exact replay and confused a review signal with a policy
decision. Adding a candidate status/dismiss command or exempting the originating
invocation would have added more state and actor-specific exceptions without
restoring one owner.

**Repair.** Records 66 and 67 now make the candidate an immutable canonical
candidate fact but a non-authoritative review input. It never grants or denies
indexing/retrieval and creates no safety hold. Every online invocation
re-evaluates the exact current source set with the one deterministic
answer-safety owner. Candidate append replay still converges on one fact; the
enclosing answer reruns currentness/safety and returns source drift rather than
stale conflict evidence if the source changed.

The 0F-2 safety-hold predicate/reason, reconciliation dependency and preview
wording were removed. Time-window and authority-source changes remain the
non-lifecycle reasons for full source-state reconciliation.

## Finding 2 — “exactly five mutations” could absorb the candidate append

Record 65 said 0F-1 owned “exactly five mutations”; record 67 introduced the
internal candidate append using the same command ledger. The ownership was
different, but the unqualified wording invited either of two bad readings: the
candidate append was an unauthorized sixth knowledge mutation, or it belonged
inside revision review and should change that lifecycle.

**Repair.** Record 65 now names exactly five **knowledge-lifecycle** mutations.
Record 67 states that its internal command appends only a candidate fact and is
not a sixth lifecycle mutation, public capability, review decision or model
action. Both reuse `NurtureCommandExecution` without sharing business fact
ownership.

## Cross-contract ownership matrix

| Concern | One owner | Audit result |
| --- | --- | --- |
| Item, immutable revision, link, review, publish/revoke | 0F-1 Nurture Knowledge | no 0F-2/3 writer or replacement source |
| Index admission, online/preview eligibility, Nurture currentness | 0F-2 Nurture policy/providers | index/cache never becomes authority |
| Generic index/vector/retrieval/generation/telemetry/replay | My-Chat | no local provider SDK, cache, vector or Host ledger |
| Claim/citation/abstention/portable presenter | 0F-3 Nurture policy/presenter | model draft never becomes presenter authority |
| Request/source/draft safety decision | exact answer-safety owner | candidate/model/trust label cannot decide safety |
| Conflict-review candidate | 0F-3 Nurture repository | immutable review input, not knowledge/review/eligibility state |

## Cross-contract invariants confirmed after repair

1. **Publication, index admission, online eligibility and actor read authority
   remain separate.** A published revision can be unreviewed or lack current
   medical authority evidence; a future-effective revision may be indexed but
   cannot enter online model context.
2. **Source identity does not collapse.** Every revision remains
   `institution_authored`; authority links/citations remain
   `authority_source`. Host trust labels, review decisions, URLs and presenter
   labels cannot upgrade either identity.
3. **Generic and scenario owner readiness stay distinct.** The exact eight-file
   generic Knowledge/PBR/RAG pin is `PRESENT_PINNED`; Institution source,
   currentness, replayable generation, authority content identity and
   answer-safety bridges remain `DEFINED_UNQUALIFIED`. Generic
   `sourceVersion`/excerpt fingerprint cannot masquerade as authority content
   hash.
4. **Currentness is phase-correct.** Retrieval admission runs before model
   context, Nurture and authority sources validate independently, and every
   actually used citation validates again after generation. Drift never swaps
   in a newer source or returns a partial answer.
5. **No-source, unavailable, drift, conflict and safety abstention are not
   aliases.** Empty eligibility is legal no-source; owner/contract failure is
   unavailable; final drift hides stale excerpts; conflict creates a review
   candidate; unsafe input/draft creates none.
6. **Preview and online/export do not cross.** Exact Admin preview may use
   warned drafts but creates no source/index/cache/citation/export. Only an
   answered online Admin result may become a portable artifact, retaining all
   citations, AI provenance and fixed notices.
7. **Replay has one owner per effect.** My-Chat owns generation identity/replay;
   Nurture owns lifecycle and candidate commands. Neither copies the other's
   ledger, and no candidate side effect changes the answer disposition on an
   otherwise-current replay.
8. **Events and reconciliation have one purpose.** 0F-1 events feed body-free
   incremental source changes; a stable full snapshot converges time/authority
   changes. My-Chat owns consumer cursor/index/retry. No Nurture knowledge or
   Host workflow outbox is added.
9. **Child/private facts remain outside the branch.** Closed DTO keys are
   reinforced by deterministic free-text safety. No item, revision, retrieval,
   candidate, answer or portable payload stores a child/family/private-care
   ref or question text.
10. **Medical safety is deterministic and fail-closed.** A generative model,
    prompt, citation label or Admin review cannot adjudicate source conflict.
    Medical claims require a current authority citation; conflict and unsafe
    results expose no generated deterministic medical step.
11. **There is no second review lifecycle.** Candidate identity includes exact
    rule/finding/source/revision evidence; the row has no status, deadline,
    blocker, dismiss event or eligibility effect. Content changes use only the
    0F-1 revision/review/publish/revoke path.
12. **Schema deltas do not overlap.** 0F-1 plans four Knowledge tables, 0F-2
    plans none, and 0F-3 plans one candidate table. The existing command ledger
    and protected-content port are reused; answer/citation/index/model facts
    get no Nurture table.

## Bounds and default-safe matrix

The audit recomputed the pipeline maxima rather than assuming nested limits:

- query: 2,000 characters / 8,192 bytes, 16 age keys, 16 scenario keys;
- source pull/reconciliation: 100 rows per stable page;
- retrieval: 16 candidates; Nurture currentness: 32 tuples;
- generation: 8 claims, 4 citation refs per claim, 16 distinct final citations;
- answer JSON: 65,536 bytes; candidate sealed evidence: 8,192 bytes with
  all-or-none optional excerpts.

The final 16-citation bound fits both currentness adapters without silent
truncation. Overflow, unknown/extra fields, mixed reconciliation snapshots,
malformed generation, unqualified safety, owner failure and candidate write
failure all fail unavailable/invalid at their owning layer. None becomes an
empty answer, partial export or local fallback.

## Source and schema qualification note

The generic My-Chat source pin remains exact at revision
`567b96cd5ddf2a0534fee21dd87f677439f40b78`, digest
`554e79d4e12b5aa2ef1794e46638b2705a606fc7e035e35d0d5167a8bf23ad66`.
Observed checkout drift is informational and was not adopted. The audit does
not invent a scenario compatibility mapping, medical-safety provider or rule
pin.

All five planned tables remain design input only. No Prisma schema or migration
has been authored or applied, and no database was contacted.

## What 0G does not certify

This is a freeze-record audit, not G4-E implementation, Surface Contract,
Owner Integration Readiness, Joint Conformance, Beta Handoff or activation
evidence. It does not qualify positive generation, medical policy, authority
source identity, source ingestion, index convergence, copy/export rendering or
any real owner path. Those gates remain in G4-E I1–I4.

## Exit

With both findings repaired and no deferred collision, the 0F branch satisfies
the 0G cross-contract audit. 0F Exit is reachable but is not issued by this
record.
