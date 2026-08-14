# G5-A Service Candidate Freeze

## Result

- Verdict: `G5_A_CANDIDATE_FROZEN_DEFAULT_OFF`
- Candidate: `nurture.service-candidate@1.0.0`
- Candidate digest:
  `sha256:c739f9291dbed99b8c96dd27be57e88429dfaeb9f2a8946395b9f58ba244debb`
- Source revision: `e6aba3792c3aec9b1b282ca665125fb416fae6f8`
- Executable digest:
  `sha256:74bb40c765776799f5cdccc89933767726c73dd9314d9c63e019e9146e34742b`
  across 974 files.
- Frozen date: 2026-08-14.

The immutable machine record is
[`release/candidates/nurture-service-candidate-1.0.0.json`](../../../release/candidates/nurture-service-candidate-1.0.0.json).
Its independent Freeze evidence is
[`release/candidates/nurture-service-candidate-1.0.0.freeze-evidence.json`](../../../release/candidates/nurture-service-candidate-1.0.0.freeze-evidence.json).
The evidence identity is
`nurture.service-candidate.freeze-evidence@1.0.0` /
`sha256:2756e407ab1534afa3df107f50d2b8694c2638d7b86d292dbfd1cb09f48bdaf6`.

## Frozen identity inputs

- Exact Nurture Git source revision and deterministic ESM output for the NestJS
  scenario service, Nurture scenario package and Nurture DB package.
- Production Prisma schema, 42-directory migration set and head
  `20260813120000_t011_family_growth_outbox_scope`.
- Scenario manifest/generated manifest/public module and the exact Nurture source
  closure already accepted by the cross-repository pin.
- `nurture.surface-contract@1.20.0`, its six-surface/65-capability artifact,
  standalone W2/W3/W4 contracts and the complete contract/fixture set.
- Environment/configuration contract, five explicit false boolean gates and the
  C30 zero-action/zero-protected/zero-activation posture.
- `nurture.six-surface-beta-profile@1.0.0` and the current exact Base/My-Chat,
  x5, wave4 and C30 owner pins. The final C30 source lock is
  `sha256:41ad50d4538aec97153d5c19fd42eacad0c758de209be79023a8ce513247b810`.

## Reproducibility and verification

- Candidate tooling tests: 7/7 passed, including complete-manifest metadata
  tamper detection.
- Root typecheck passed.
- Root unit suite: 98 files / 1086 tests passed.
- Scenario service suite: 17 files / 135 tests passed.
- Two clean service builds reproduced the same 974-file executable digest.
- Prisma validation, persistence boundaries, test routing, surface contract and
  schemas, formal ingress, exact workflow pin, C30 upstream/default-off/owner lock
  all passed.
- Strict context verification exposed stale generated registry checksums before
  the final mint. The registry was refreshed, all three affected C30 profiles
  were requalified/resealed without semantic widening, and the Candidate was
  regenerated from the resulting source revision.

## Effect boundary and next gate

This Freeze creates one immutable test subject only. The Candidate remains
capability-default-off, undeployed and unqualified. It contains no secret, PII,
live environment value, My-Chat runtime/client bundle or device evidence and
authorizes no database apply, deployment, activation, internal-test enablement
or traffic.

The next serial gate is separately authorized G5-B Deployment Binding & Local
Qualification. G5-C may prepare in parallel, but its final handoff must reference
G5-B's readback-verified Binding. G5-D remains closed.
