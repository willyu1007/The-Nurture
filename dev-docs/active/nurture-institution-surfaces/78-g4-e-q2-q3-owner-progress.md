# G4-E Q2/Q3 My-Chat Owner Progress

## Status

- Date: 2026-08-11
- Task: T-007
- Verdict: `G4_E_Q2_CLOSED_Q3_PROVIDER_GATE_OPEN`
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
4. `942bd009fa646a8fd82ada2e7b3c5fbc174d270e` adds the provider-neutral
   deterministic answer-safety owner contract, exact qualification tuple,
   stable fingerprints and canonical `passed | blocked` safety persistence.

All four commits are ancestors of the inspected My-Chat `main`. Later My-Chat
changes through `50fcc7b` do not change the Nurture Knowledge owner paths; the
only relevant later scenario-integration diff belongs to the independent
family-sharing authorization work.

## Qualification evidence adopted from My-Chat T-040

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

This evidence qualifies the durable Q2 owners, Q3 replay owner and the
provider-neutral safety boundary. It does not qualify a positive safety
provider.

## Remaining Q3 gate

One concrete non-generative deterministic provider and immutable rule artifact
must still supply an exact provider identity, version, rule-set ref/version/
hash and replay fixtures for positive, denial, unavailable and drift outcomes.
The adapter deliberately returns unavailable when any element is absent or
different.

The existing `aliyun-bailian/qwen-plus` generation profile and its
`DASHSCOPE_API_KEY` secret reference qualify only the generative answer path.
They cannot own deterministic safety. Alibaba Cloud's generic content-risk
service may be evaluated as a supplemental pre-filter, but its generic labels
and independently permissioned API do not implement the frozen Nurture
medical/private/source-conflict rule taxonomy and therefore cannot close this
gate by itself. No keyword classifier, model self-rating or second safety
status was introduced.

## Consequence and next step

- Q2 is closed at the adopted My-Chat checkpoint.
- Q4 sibling-repository mutation authority was exercised and is closed.
- Q3 remains open only for the concrete provider/rule artifact and its replay
  qualification.
- E7 may bind the exact Q2/generation owners only as part of one coherent
  default-off composition after that Q3 pin exists; it must not create a
  partial positive runtime.
- E8 Joint Conformance then proves positive/cited, no-source, medical conflict,
  provider unavailable, rule drift, replay and post-generation currentness
  through formal ingress before any activation decision.
