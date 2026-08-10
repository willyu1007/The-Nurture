# G4-E Increment 3 — Institution Knowledge Answer Safety

## Status

- Date: 2026-08-10
- Task: T-007
- Roadmap node: E3 / G4-E I1.3
- Contract: `nurture.institution-knowledge-answer-safety@1.0.0`
- Verdict: `G4_E_I1_3_PASS_STATIC`
- Schema/database: **one immutable candidate table and unapplied migration;
  no database connection or operation**
- Runtime: private/default-off; no model, provider, manifest, module or formal
  ingress binding

## Delivered boundary

This node implements frozen record
[`67`](./67-g4-0f-3-citation-answer-safety-freeze.md) as a strict private
scenario boundary:

- a seven-stage answer orchestration that consumes E2's already-authorized,
  independently current Institution and My-Chat authority candidates;
- exact deterministic request/source and draft-safety owner ports under one
  rule-set ref/version, with unknown or extra fields rejected;
- one replayable structured-generation owner port whose output is limited to
  1..8 cited claim drafts and cannot supply citations, URLs, safety decisions
  or prose outside claims;
- final exact-owner currentness over only the distinct citations used by a
  draft or displayed by a conflict result;
- Nurture-built owner/provenance-preserving citations, fixed safety notices,
  five closed answer/abstention outcomes and a citation-complete portable
  answer presenter;
- one immutable conflict-candidate command/repository that reuses
  `NurtureCommandExecution` and the protected-content port;
- the fifth and final 0F table plus an unapplied additive migration artifact.

No local model, prompt, vector, index, cache, generation ledger, answer row,
candidate status or public Surface was added. Until exact My-Chat generation/
authority-currentness and deterministic safety providers qualify, no caller
can compose the required ports and online generation remains unavailable.

## Safety, provenance and replay behavior

The model receives only strict, prevalidated candidate packages. Its canonical
input digest binds Workspace, Institution, invocation, exact purpose, answer
policy, question and all candidate facts. Host replay owns the immutable draft;
Nurture neither retries through another model nor creates local prose.

Every draft is shape-checked before deterministic draft safety. Final
currentness then independently partitions Nurture and authority citations and
requires ordered identity-preserving decisions. A denied source produces
`abstained_source_changed` with no stale excerpt; owner/contract failure is
`unavailable`. Medical claims require at least one finally current, separately
typed `authority_source`; an Institution link or label cannot upgrade
`institution_authored` material.

Unsafe request/draft results expose no generated text and create no candidate.
No-source returns before safety/generation. Conflict findings are finally
revalidated before any write, share one global set of at most 16 unique
citations and append one immutable candidate per deterministic finding. The
candidate identity excludes actor, invocation, question and model output, so
the same evidence across users converges on one internal service command.

Candidate evidence uses the closed `none` excerpt mode. The sealed plaintext
contains the complete sorted rule/finding/source/revision identity, remains
within 8 KiB and carries no question, child/family fact, generated answer,
provider/prompt data or credential. The candidate has no status, deadline,
blocker, hold, resolution or dismissal path and is never consulted by E2
eligibility.

## Quality review and repairs

| Priority | Finding | Repair |
| --- | --- | --- |
| Must | Initial conflict presentations generated citation refs independently per finding, allowing duplicate refs and more than 16 displayed sources. | Construct one globally unique final-current citation set, and let each finding reference only its subset. |
| Must | A candidate labeled `authority_source` could use a non-My-Chat canonical namespace. | Require exact `my_chat/knowledge_source` identity before authority currentness or model context. |
| Must | The first command result parser did not prove the replayed candidate identity matched the requested evidence. | Recompute and compare identity hash/ref in the command precondition, recorder and DB mapper. |
| Must | A malformed final Nurture currentness decision could be treated as eligible through TypeScript-only trust. | Admit only literal `eligible` or `denied`; every other runtime value is unavailable. |
| Should | Per-user command actors would make the same candidate payload hash differ across observers. | Use one fixed internal answer-safety service actor and identity-derived command request, while Admin authority stays in the outer answer operation. |
| Should | Optional excerpts made cross-user candidate replay nondeterministic and could leak request-adjacent text. | Select the valid stable `none` evidence mode; seal only complete exact identities. |
| Should | SQL JSON validation could call array operators on a non-array input, and the first primary-key name exceeded the safe identifier budget. | Guard JSON type with `CASE` and use an explicit bounded primary-key name. |

No Must/Should/May finding remains open. E2 candidate metadata was extended in
place to the exact title/revision/publication facts required by the E3
presenter; there is still one retrieval candidate contract and no legacy
adapter track.

## Verification

| Check | Result |
| --- | --- |
| E3 answer/candidate suite | PASS, 11/11 |
| E2 retrieval/currentness suite | PASS, 13/13 |
| Full unit lane | PASS, 935/935 across 84 files |
| Root, scenario and DB TypeScript | PASS |
| Prisma SSOT | PASS statically; format/validate/generate and DB context checksum `edc0f9ef…` |
| Test routing | PASS, 153 files: 84 unit / 42 DB / 11 dev-host / 14 scenario-service / 2 joint |
| Persistence / formal ingress / G3 freeze | PASS; exact 25 descriptors remain unrouted and the persisted model census includes the fifth table |
| Exact generic My-Chat Knowledge/RAG source pin | PASS at `567b96c` / `554e79d4…`; live checkout `2dc365e` is informational drift only |
| Static owner/runtime boundary | PASS; no My-Chat ORM, provider SDK, local model/vector/prompt runtime, host route or second ledger |
| PostgreSQL / migration | NOT RUN; Q1 has no exact approved disposable target in this node |

## Effect and next node

No database, external owner, model, index, source, Surface, deployment,
activation or traffic was touched. The migration is authored but unapplied.

Roadmap E4 may now perform the cross-increment I1 audit. Migration execution,
constraint probes, DB suites, drift proof and destruction evidence require Q1
to name and approve one exact disposable PostgreSQL database. E5/E6 remain
after the E4 commit boundary; I3/I4 additionally require Q2–Q4 and cannot be
closed by synthetic compatibility providers.
