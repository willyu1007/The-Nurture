# G4-D I4-B current-owner admission hardening

Date: 2026-08-12

## Verdict

`G4_D_I4_B_CURRENT_OWNER_ADMISSION_HARDENED /
CARRIER_AND_POSITIVE_COMMAND_MATRIX_PENDING / DEFAULT_OFF`

## Finding and repair

The I4 review found that the I3 current-owner provider validated the Host
evidence structure and purpose but did not bind its ordered child/family owner
refs to the Nurture trial-pair snapshot it returned. A source could therefore
combine valid current evidence for one pair with a separately valid local
snapshot for another pair. The family-acceptance branch also returned an
unvalidated Guardian action, while the trial branch could report expired or
malformed grant terms as resolved before the command layer rejected them.

The provider now fails closed before its local owner read unless:

1. Guardian action structure is exact and its verification time is not in the
   future;
2. the Host evidence's ordered child/family owner refs and versions equal the
   trial-pair snapshot byte-for-byte;
3. grant terms are structurally valid and current at the provider clock; and
4. `PrismaEnrollmentPairOwnerRepository` confirms the exact pair against the
   current Nurture association, authorization, participant and Guardian-role
   graph.

The composition supplies the same injected clock to the provider and the local
pair owner, avoiding split-time decisions. Focused regressions cover malformed
Guardian action, cross-pair substitution, expired grant terms, zero local read
on pre-read rejection and the exact positive pair.

## Evidence

| Gate | Result |
| --- | --- |
| focused formal-owner PostgreSQL suite | PASS — 1 file / 6 tests |
| full production PostgreSQL lane | PASS — 50 files / 439 tests |
| Nurture DB package typecheck | PASS |
| complete serialized x5 lane | PASS — 5 files / 36 tests |
| runtime effects | NONE — no route, DI binding, persistent apply, activation or traffic |

## Carrier freeze for the next slice

This record hardens admission but does not claim current-owner transport. The
remaining carrier must follow the already frozen ownership rule:

- `ScenarioCurrentOwnerBindingPairEvidenceV1` is issued by My-Chat and lives
  only in its enclosing signed private invocation; no cache or reverse lookup
  by raw Child/Family/platform id is allowed;
- the enclosing verified principal, workspace, Nurture route, operation,
  nonce and expiry provide the evidence scope; nested copies are forbidden;
- Nurture derives pair associations, Guardian role and grant-policy facts from
  current local owners. A Host transport adapter must not manufacture Nurture
  business snapshots;
- prepare and execute each require fresh evidence; a prepared-command snapshot
  cannot extend the evidence lifetime or fill an owner outage;
- formalization additionally needs the current Guardian acceptance action and
  keeps Guardian/mobile ingress absent until that signed carrier exists.

The next implementation unit is therefore a request-scoped Host evidence
carrier plus Nurture-local derivation port for the admin trial-pair lanes,
followed by positive prepare/execute/replay and revoke/expiry/head negatives.
It must replace, not coexist with, the current mixed
`NurtureEnrollmentCurrentOwnerEvidenceSourceV1` shape. G4-F remains closed.

