# C30-I3-A Exact Adoption and Canonical Manifest Record

## Decision

- Date: 2026-08-06
- Task: `M-002 > F-002 > T-002 nurture-institution-mode`
- Scope source: artifact 53
- Canonical-manifest source: `3b7e2a6f367c0afc7d3e6de8036617efa0d0b972`
- Self-verifying lock-tool source:
  `0f1d456f374878ad03c1317c6cbd98209dc39304`
- State: `C30_I3_A_ACCEPTED / I3_B_AUTHORIZED_NEXT`

I3-A is accepted. Nurture now has one YAML-authored, mechanically generated,
default-off production Scenario module. Its C30 graph is exactly the valid
trusted-invocation plus subject-presentation prefix frozen by artifact 53. It
does not declare a production action or protected interaction.

## Exact immutable inputs

| Owner | Revision | Aggregate source hash |
| --- | --- | --- |
| Base metadata/source | `4350086993d837baa8030564f4e19593dedd96b0` / `15ff031ed16897920c13fe24c9849531d98607ad` | `d17f23585bb90ab607eb0fc80af629d8ab13ceb4508118de28162e4fd8846383` |
| My-Chat archive/runtime | `cd7bbc2623dff8621c2c7155b04d1bf759e8404a` / `658b897360734dfa916ce25abda7a8db5fb3f27d` | `8172e370dfb5db0876709c6f7a01999314ac266bf71ba166854f9effa510a5ad` |
| Nurture lock source | `0f1d456f374878ad03c1317c6cbd98209dc39304` | `a8453249a23820cbc09e509dc393db8df75a8962e122f9961bb10144647269fc` |

The Nurture profile
`nurture_c30_manifest_foundation_v1` contains 15 exact files and hashes to
`9ca462c4d5f820de7882e4b56d876e4f2f3a89f7107e8ddd1a408258dfe55bb2`.
The immutable record is
`docs/project/integrations/c30-i3-owner-adoption-lock.json`.

## Implementation

- `scenario.manifest.yaml` is the only editable manifest source. A deterministic
  generator emits the typed registry and `--check` rejects drift.
- `nurtureScenarioModule` is the sole canonical module. The former preactivation,
  activation and compatibility-derived module variants are absent.
- The production `scenario_contracts` list is ordered as
  `trusted_scenario_invocation_v1` then
  `scenario_subject_presentation_v1`; presentation is action-free and the
  production action/protected arrays are empty.
- All seven historical capabilities remain explicitly disabled. No Host-owned
  activation population, positive registration or fallback was introduced.
- The downstream lock checks exact Base/My-Chat commits and accepted aggregates,
  exact Nurture source ancestry and the normalized bytes of the bounded profile.

## Verification

| Check | Result |
| --- | --- |
| Exact Base/My-Chat cleanliness and upstream source locks | PASS |
| Manifest generation parity and scenario typecheck | PASS |
| Focused manifest/module/G2 regression population | PASS — 5 files / 28 tests |
| Full scenario package population | PASS — 52 files / 579 tests |
| Existing G2 exit-contract assertion | PASS |
| Self-verifying C30-I3 adoption lock | PASS — `a8453249…69fc` |
| Diff hygiene | PASS |

The package-local filtered test command is not a valid repository-root Vitest
entrypoint because its include globs are rooted at the monorepo. Verification was
rerun from the repository root and passed the complete population.

## Effect boundary and next gate

No schema, migration, Prisma generation, database, KMS secret, capability,
deployment, activation, I4, C31, T-008, Pilot or traffic action occurred. Base
and My-Chat remained read-only and clean. The user's ordered I3 authorization
opens I3-B next; later units remain ordered and production capability state
remains default-off.
