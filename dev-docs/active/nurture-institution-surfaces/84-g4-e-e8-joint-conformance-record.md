# 84 — G4-E E8 joint conformance record

- Date: 2026-08-11
- Task: T-007 nurture-institution-surfaces (Stage G4-E, I4)
- Checkpoint: Nurture `8d41be1` (suite landed at `8411ed8`)
- Verdict: `G4_E_E8_JOINT_CONFORMANCE_PASS` at `adapter_qualified`
- Database effect: fresh disposable tmpfs targets only; destroyed with free
  ports and zero surviving containers
- Traffic / activation effect: none; every capability remains default-off and
  `live_qualified` stays `false`

## Exact bound inputs

| Input | Identity |
| --- | --- |
| Base dispatcher | `dispatchTrustedScenarioInvocation` committed by Base `6740871`, sealed at Base `536638a`, adopted by My-Chat and exercised from `@my-chat/workflow-runtime` |
| My-Chat sibling | detached checkout at `ae563988a0ee77c8faad5c3b29399dc0688d51a7` (clean); the `link:../My-Chat/...` overrides resolve to this frozen tree |
| My-Workflow-Base sibling | `536638a204865ebdc43bca70992388352789a36f` (clean) |
| Surface contract | `nurture.surface-contract@1.20.0` |
| Q2 owner pin | `NURTURE_INSTITUTION_KNOWLEDGE_MY_CHAT_Q2_OWNER_PIN` (My-Chat `942bd00`) |
| Q3 adapter qualification | `nurture.institution-knowledge-answer-safety-provider-qualification@2.1.0` / `sha256:b2e39994e712877277b2efa49300a3cf9a8b313db0f03a64fd3ffc59fb9b5741`, 13-pin service tuple |
| Answer safety contract | `nurture.institution-knowledge-answer-safety@2.0.0`; owner contract `my-chat.nurture-institution-knowledge-answer-safety-owner@2.0.0` |
| My-Chat E7 composition | `my-chat.nurture-institution-knowledge-default-off-e7@1.0.0` (byte-exact pin admission) |
| Retrieval host binding | `my-chat.nurture-institution-knowledge-retrieval-host-binding@2.0.0` |
| Nurture owner integration | exact Q2/Q3 pin admission through `admitNurtureInstitutionKnowledgeOwnerIntegration` (drifted pins fall back to the unavailable defaults) |

## Vehicle

`packages/nurture-db/tests/t007-institution-knowledge-e8-joint.integration.test.ts`
in the x5 joint lane (`vitest.x5.config.ts`, `pnpm test:x5`, census
`x5Joint=3`). The suite composes, per run: the real Nurture formal owners
(`createPrismaNurtureInstitutionKnowledgeFormalOwners` +
`bindPrismaNurtureInstitutionKnowledgeFormalOwners`) over the Nurture
disposable database; the real My-Chat E7 composition
(`bindNurtureInstitutionKnowledgeDefaultOffE7`) with the real retrieval
(`KnowledgeRagService` over `PrismaKnowledgeRepository`), authority citation
currentness, source consumer, generation owner (canonical generation ledger in
the My-Chat disposable database) and service-backed answer-safety adapter; the
real principal-bound host factory
(`bindNurtureInstitutionKnowledgeRetrievalHost` →
`createNurtureInstitutionKnowledgeAuthorizedRetrievalOwnerFactory` over
`PrismaIdentityRepository`, re-reading canonical Postgres permission context on
every retrieval and final access); and the real scenario module + registry
(`createNurtureScenarioModule` → `loadWorkflowRegistry`), driven exclusively
through `dispatchTrustedScenarioInvocation` with fully-formed verified
invocations against the real manifest.

Model transport is recorded on both the safety and generation profiles; the
recorded gateway enforces the exact safety service pin at
`selectInitialModel`, so the run is adapter-level evidence only and makes no
live-provider claim.

## Qualification topology and database posture

- Fresh disposable tmpfs containers created from absence:
  `postgres:16-alpine` at `127.0.0.1:55442` (`nurture_e8` — 36/36 migrations
  from empty; `nurture_e8_dev_host` — full dev-host schema) and
  `pgvector/pgvector:pg16` at `127.0.0.1:55443` (`mychat_e8` — the pinned
  My-Chat migration set from empty; the image choice is load-bearing for the
  `vector` extension).
- After the runs both containers were removed; ports `55442`/`55443` have no
  listener and zero `e8-*` containers remain.
- Production-boundary census was captured on one additional fresh disposable
  (`127.0.0.1:55444`, 36/36 from empty): `[ok] production DB boundary
  tables=99 enums=121`; destroyed, port free. The configured shared local
  database legitimately remains behind (durable apply of the E7 migration is
  still approval-gated), so `db:assert-boundary` against the default target is
  expectedly stale and is not E8 evidence.

## Matrix results (formal round, fresh targets)

| # | Case | Result |
| --- | --- | --- |
| 1 | Cited-positive general answer — full chain, claims and revalidated citations | PASS (`answered`, three recorded turns: request safety, generation, draft safety) |
| 2 | Cited-positive medical answer — medical claim must cite an authority-source citation | PASS (`answered`, `first_aid_action` claim citing the authority candidate) |
| 3 | No-source abstention — empty eligible set | PASS (`abstained_no_source`, no generation) |
| 4 | Material medical conflict — abstention plus one immutable review candidate, idempotent on exact replay | PASS (`abstained_medical_conflict`; candidate count stays 1 across replay) |
| 5 | Unsafe drafted text — structured draft safety failure | PASS (`abstained_safety` with `prescriptive_medication_or_dose`) |
| 6 | Provider outage — no fallback, no partial success | PASS (`unavailable`; `success_on_service_unavailable` never occurs) |
| 7 | Post-generation currentness — used source revoked between generation and final validation | PASS (`abstained_source_changed`) |
| 8 | Authority drift — admin role revoked between prepare and execute | PASS (`denied` before any transport call) |
| 9 | Replay — second execute of the same confirmed command | PASS (same `generationRef` from the canonical ledger; only the two safety turns run, no second generation transport) |
| 10 | Privacy negative — caregiver principal through the real dispatcher | PASS (`denied`, zero transport calls) |
| 11 | Provenance and leakage — exportable answer keeps citations and AI provenance; no `PermissionContext`, account or actor id crosses into results or Nurture rows; prepared-command ciphertext never contains the plaintext question | PASS |
| 12 | Final default-off census — all three formal endpoints present in the registered manifest with no enabled enablement policy | PASS |

Formal single-file round: 12/12 at `8411ed8` on fresh targets
(`scratchpad` logs `02-formal-e8.log`). Full x5 lane with the two existing
joint files, serialized: **3 files / 24 tests PASS** (`03-full-x5.log`),
including the T-009 family-growth joint suite (8/8) and the T-002 x5
acceptance suite (4/4) on the same fresh targets.

## Supporting gates at the checkpoint

`pnpm test:unit` 94 files / 1014 tests; `verify:test-routing`
(`x5Joint=3`), `verify:persistence-boundaries`, `verify:port-topology`,
`verify:formal-ingress-contract`, `verify:g3-0-freeze` and
`verify:workflow-contract-pin` (scenario self-pin rotated to `89b43ca7…`,
279 files) all `[ok]`; scenario and db package typechecks clean.

## Findings and interface notes

1. `DR-E8-01` — the read owner contracted by 0F-2 had no PostgreSQL
   implementation (E2 was statically qualified). The production
   `PrismaInstitutionKnowledgeReadOwner` was implemented for E8 (record 82
   blocker 1/2 closure), including the opaque keyed source object id that
   keeps persistence row ids out of cross-owner refs and the
   `publication_event_ref.version = publication item_head` coherence rule.
2. `DR-E8-02` — interface note for G4-D I3/G4-F: the surface
   `finalAuthorityCurrentness` port takes `{context, sources}` while the
   My-Chat authority citation owner takes a flat
   `{workspace_id, institution_ref, purpose, sources}` request. The suite
   bridges them with a thin flattening adapter; the production composer must
   own this adapter (or a contract alignment) before I4.
3. `DR-E8-03` — canonicalization note: `jsonb` storage does not preserve key
   order, so any owner-source-ref string comparison must use the
   `encodeOwnerSourceRefV1` field order on both sides. The suite's authority
   currentness adapters encode refs exactly that way.
4. The x5 lane needed `fileParallelism: false` (`8d41be1`): parallel joint
   files over the shared disposable databases trigger spurious serializable
   aborts; the previously observed x5-acceptance failure was this scheduling
   artifact, not an adoption gap — serialized, it passes 4/4.

## 2026-08-12 post-review hardening (independent Codex pass)

An independent review of the E7/E8 range produced nine findings; all are
resolved and re-qualified on fresh disposable targets (production DB lane
400/400, full x5 lane 24/24 including E8 12/12):

- `DR-E8-04` (was P1) — the prepared-command CHECK rejected expiring an
  already-consumed row (the status/`consumed_at` clause required NULL for
  every non-`consumed` status), so a consume→TTL→replay returned `unavailable`
  instead of `prepared_command_expired`. The clause now admits the expired
  state with its retained consumption audit time; a PostgreSQL test covers the
  sequence. The migration was never durably applied, so no checksum drifts.
- `DR-E8-05` (was P1×5) — `PrismaInstitutionKnowledgeReadOwner` was rewritten:
  the change feed now sorts the bounded event set by the semantic tuple
  (occurred_at, opaque item id, event ordinal) so a same-timestamp
  publication_superseded/published pair cannot invert; review/changes-requested
  events enter the feed only when they land on the item's current published
  revision (drafts never appear, and the advertised source is always the
  current publication); pagination cursors are opaque and carry no persistence
  row id; `listCurrentPublications` orders and pages by the opaque source id,
  carries the evaluation watermark in a scope-bound reconciliation ref so every
  page reports a stable `evaluated_at`, and loads a page's revisions/events/
  links with grouped queries instead of three-per-row. A dedicated integration
  test pins the pagination completeness, the republish tie ordering, the
  opaque-cursor shape and the reconciliation stability.
- `DR-E8-06` (was P2) — the source file's literal NUL separators are escaped so
  Git treats it as text.

Known coverage limitation (recorded, not silently accepted): this E8 suite
seeds the My-Chat `knowledgeSource` rows directly rather than driving them
through the production source consumer's reconciliation lane, so the change
feed / reconciliation contract is qualified by the dedicated read-owner
integration test above, not by E8 itself. Closing that gap inside E8 (seed
Nurture facts → synchronize through the real provider/consumer → answer) is
carried as follow-up hardening for the G4-F integration join.

## Boundaries

This record is joint conformance at `adapter_qualified` only. It is not a
live-provider qualification (`live_qualified=false` remains a separate
activation-only gateway smoke), not a durable database apply, not G4-D I3/I4,
not G4-F, not Candidate Freeze and not traffic authority. Recorded transport
is never live evidence.

## 2026-08-12 DR-E8-02 closure — production port adoption

- My-Chat `5ee3ffe` promotes the finding-2 thin adapter into the production
  default-off E7 composition:
  `createNurtureInstitutionKnowledgeAuthorityCurrentnessPort` re-envelopes the
  `{context, sources}` shape onto the flat authority citation currentness
  owner with the pinned `institution_admin_online_answer` purpose, passes
  `source_ref` tuples through untouched (`DR-E8-03` preserved) and fails
  closed as `unavailable` on thrown, unresolved or misaligned owner results.
  The composition exposes it as `authority_currentness_port`.
- This suite deleted both suite-local currentness adapters and consumes the
  production port for the pre-generation and final slots through typed
  assignments (`NurtureAuthorityKnowledgeSourceCurrentnessProviderV1`,
  `InstitutionKnowledgeAuthorityCitationCurrentnessOwnerPortV1`) with no
  cast — the compile-time proof the port-shape gap is closed.
- Re-run on fresh disposable targets (destroyed afterward): full x5 lane
  3 files / 24 tests PASS with the E8 matrix 12/12 inside it; unit
  1014/1014; production-db 400/400; routing census exact.
- Pin rotation: `myChat.revision=5ee3ffe`, `x5_joint_api`
  `d6277003…` (275 files); the Nurture self-pin rotated to `e8314ade…`
  (279 files), which also folds in the `a869aaf` read-owner src drift that
  had not been rotated with that commit.
- `live_qualified=false`, default-off posture, durable-apply approval path:
  all unchanged.

### 2026-08-12 closure addendum — post-review port hardening

The independent review of the closure found the port's length-only alignment
insufficient: My-Chat `0400c4c` adds position-for-position decision-identity
verification (field-wise ref comparison, version, content hash) and
`ec9f298` fails closed on sparse decision lists. Pin advanced to `ec9f298`
(`x5_joint_api` `48c0f597…`); full x5 re-run on fresh disposables at that
pin: 3 files / 24 tests PASS (E8 12/12), targets destroyed. The Nurture-side
migration set applied to the disposable now also carries the reviewed T-010
preview migration (78 total apply lines) — disposable-only, unrelated tables.
