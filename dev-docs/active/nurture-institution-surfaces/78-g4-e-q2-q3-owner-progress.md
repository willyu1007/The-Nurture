# G4-E Q2/Q3 My-Chat Owner Progress

> **NON-NORMATIVE / SUPERSEDED FOR CURRENT Q3.** This record preserves the
> historical My-Chat T-040 owner checkpoint and Q2 evidence. Its V1 safety tuple
> and fixed-rule provider gate MUST NOT be used as current qualification input.
> Current Q3 SSOT is the sole `/v2` qualification `2.1.0` and
> [`80`](./80-g4-e-q3-provider-qualification-contract.md).

## Status

- Date: 2026-08-11
- Task: T-007
- Historical verdict: `G4_E_Q2_CLOSED_Q3_PROVIDER_GATE_OPEN`
- Record posture: `NON_NORMATIVE_Q3_SUPERSEDED`
- Adopted external checkpoint: `My-Chat@942bd009fa646a8fd82ada2e7b3c5fbc174d270e`
- Effect: documentation/adoption checkpoint only; no Nurture runtime binding,
  database operation, deployment, activation or traffic

## Landed owner sequence

The user-authorized My-Chat T-040 sequence is present on My-Chat `main` and
closes the owner-contract work that was absent in the historical E7 audit:

1. `7f06432d12454748d05dd3aead03a44a6a3768d0` admits exact Nurture
   Institution source snapshots through bounded, idempotent owner-source
   admission and invalidation.
2. `44f93fe3a311690351bed70e67d408e452ed528e` adds My-Chat-owned cursor CAS
   and durable stable reconciliation without treating index presence as
   current authority.
3. `a899249190766ea7d7a4bf76d7928a7c64802a11` adds one strict structured
   generation per invocation/digest through the canonical My-Chat LLM gateway
   and generation record.
4. `942bd009fa646a8fd82ada2e7b3c5fbc174d270e` added the then-current V1
   answer-safety owner tuple, stable fingerprints and canonical
   `passed | blocked` safety persistence. That tuple is now superseded.

All four commits are ancestors of the inspected My-Chat `main`. Later My-Chat
changes through `50fcc7b` do not change the Nurture Knowledge owner paths; the
only relevant later scenario-integration diff belongs to the independent
family-sharing authorization work.

## Historical qualification evidence adopted from My-Chat T-040

- Q2 source admission/invalidation passes 5/5 PostgreSQL integration cases.
- Q2 durable reconciliation passes 8/8 after all 38 migrations replay from
  empty; cursor replay/drift, multi-page stable inventory and version-bounded
  invalidation are covered.
- Q3 structured generation passes 5/5 PostgreSQL integration cases after all
  39 migrations, plus 51/51 LLM and scenario-integration tests.
- Q3 safety adapter and canonical write pass 6/6 PostgreSQL integration cases,
  57/57 LLM/scenario tests and 135/135 DB unit tests. Safe maps to `passed`,
  unsafe maps to `blocked`, exact replay is idempotent and decision drift
  conflicts.
- Every named target was disposable and destroyed. No shared, staging or
  production database was changed.

This evidence continues to support the durable Q2 owners and Q3 replay history.
It does not qualify the current V2 answer-safety owner or provider.

## Superseded Q3 provider gate

The former requirement for a non-generative provider and immutable rule
artifact is removed. It is not a current gate or fallback. Current qualification
uses the My-Chat V2 service adapter, exact 13-pin tuple, strict structured
decision and all 15 fixtures under [`80`](./80-g4-e-q3-provider-qualification-contract.md).

## Consequence and next step

- Q2 is closed at the adopted My-Chat checkpoint.
- Q4 sibling-repository mutation authority was exercised and is closed.
- This record cannot open or close current Q3. The current V2 qualification
  status is declared only by [`80`](./80-g4-e-q3-provider-qualification-contract.md).
- E7 must bind only the exact currently qualified V2 tuple as part of one
  coherent default-off composition; it must not reuse this historical V1 pin.
- E8 Joint Conformance then proves positive/cited, no-source, medical conflict,
  provider unavailable, rule drift, replay and post-generation currentness
  through formal ingress before any activation decision.
