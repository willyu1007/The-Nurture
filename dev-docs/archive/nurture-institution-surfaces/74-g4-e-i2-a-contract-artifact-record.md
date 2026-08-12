# G4-E I2-A — Institution Knowledge Public Wire Artifact

## Verdict

- Date: 2026-08-10
- Task: T-007
- Roadmap node: E5 / G4-E I2-A
- Verdict: `G4_E_I2_A_CONTRACT_QUALIFIED`
- Artifact: `nurture.surface-contract@1.20.0` /
  `sha256:35d6340f60aa2d81523b0c8af977c8c5bb8f01a05a84d1a73b5baffbe8654273`
- Manifest digest:
  `sha256:4b75c648d54926a0353d7cd57711be3f701e078c853090cf075cbc87f10cecd6`
- Effect boundary: source schemas/descriptors, deterministic artifact and
  synthetic contract qualification only

## Implemented boundary

The additive artifact exposes exactly seven Institution Admin Workbench
capabilities over the completed private I1 contracts:

1. one read-only `query_institution_knowledge_preview` over 1..8 exact,
   actor-bound revision option refs;
2. one effectful `answer_institution_knowledge` action over the closed online
   question/applicability DTO;
3. the five lifecycle actions: create item, create revision, record review,
   publish revision and revoke revision.

Three compact source schemas carry shared body, metadata, preview, cited-answer
and action-result shapes. Public authoring accepts only bounded business content
and owner-issued authority-source option refs. Workspace, Institution, actor,
role assignment, expected item head, canonical source identity/version,
publisher/deep-link snapshot and currentness evidence remain server-resolved.
The action result returns owner-issued item/revision option refs plus the exact
committed head/revision/state; it never accepts a caller-supplied head.

Index/source pull, source reconciliation, internal conflict-candidate append,
copy/export and generic ingestion/RAG purposes are not public capabilities.
There is no public candidate review lifecycle, status, hold, deadline or
blocker.

## Surface, execution and owner boundary

- Every descriptor supports only `institution_admin` and presents only through
  `institution_workbench`; Institution mobile, Guardian and caregiver surfaces
  receive none of the seven capabilities.
- Preview remains a side-effect-free query. Answer is deliberately an
  `action_execution` with direct execution because its frozen I1 operation may
  replay a Host generation and append one immutable conflict-review candidate;
  classifying it as a query would falsely promise read-only behavior.
- The five lifecycle mutations remain separate descriptors so target,
  confirmation and prepared `knowledge_item_head` requirements cannot drift
  behind one generic CRUD endpoint.
- The Surface eligibility registry uses one Nurture knowledge repository ref
  and three role-specific policy refs. This is contract-layer composition, not
  a replacement for the exact retrieval, generation, authority-currentness or
  deterministic safety owner ports required by I3.

## Default-off proof

- Every descriptor requires the completed
  `t007_institution_knowledge_i1@1.0.0` contract boundary and the single
  unqualified `t007_institution_knowledge_runtime@1.0.0` owner-integration gate.
- `scenario.manifest.yaml`, `src/module.ts` and formal scenario-service ingress
  remain unchanged. No handler, presenter, adapter, provider, DB operation,
  model/index runtime, deployment, activation or traffic was added.
- The shared-core hash remains
  `sha256:7bd8a82d4ad6e2ee6a5cdf02f50792049fe7bdfa546992058cb860c1baac4c6d`;
  existing capability/surface slices remain stable and the generated artifact
  adds only the seven new capability slices.

## Quality review and repairs

| Priority | Finding | Repair |
| --- | --- | --- |
| Must | The first descriptor draft treated online answer as a read-only query even though 0F-3 explicitly freezes the operation as effectful generation/candidate work. | Renamed the descriptor `answer_institution_knowledge`, moved the descriptor to direct `action_execution`, and retained preview as the only query. |
| Must | Public authoring could have accepted trusted authority-source snapshots if the private I1 payload were projected directly. | The wire accepts only opaque source option refs; source identity/version, publisher, URL, excerpt, verification and snapshot hash remain owner-resolved. |
| Should | Historical T-006 conformance censuses initially treated every new registry key as a T-006 runtime producer. | Route the exact seven-key group by its unique G4-E runtime gate to this dedicated source-only suite; no duplicate key inventory was added. |
| Should | The original aggregate filename called every knowledge operation a query. | Use one neutral `institution-knowledge-operations` schema and keep execution semantics in the descriptors. |

No Must/Should/May finding remains open. No compatibility schema, generated
alias, legacy knowledge path, temporary fixture or duplicate runtime file is
retained.

## Qualification

- Exact artifact rebuild: PASS, 65 capabilities / 6 surfaces; 61 compiled
  schemas, 19 conformance cases and 80/80 slices.
- I2-A boundary suite: PASS, 9/9 for exact inventory, execution class,
  role/surface boundary, trusted-input exclusion, prepared heads, closed
  lifecycle effects and source-only/default-off posture.
- Surface tooling, schema/negative validation, deterministic rebuild and full
  synthetic conformance: PASS.
- Full unit, TypeScript, formal-ingress/default-off and repository structural
  gates: PASS; exact counts are synchronized in [`04`](./04-verification.md).
- Database: not run and not needed for this source-only node. The previous E4
  disposable target remains destroyed; no database was selected or changed.
- JSON Schema expresses per-field and collection bounds. E6 validators must
  additionally enforce canonical body size at 8,192 UTF-8 bytes, unique body
  section keys, and `validFrom < validUntil` when both applicability dates are
  present; those private I1 invariants are not weakened by this wire artifact.

## Next gate

E6 may now implement exact validators, role-safe presenters and one adapter per
descriptor behind the existing disabled runtime gate. It must preserve the
effectful answer lane, resolve trusted source/head/context fields server-side
and add no formal caller. E7/E8 remain blocked on Q2–Q4 exact My-Chat scenario
delta adoption, deterministic answer-safety provider/rule pin and sibling-repo
change authority; no synthetic compatibility provider may close those gates.
