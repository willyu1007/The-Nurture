# G4-D I4-B request-scoped current-owner carrier

Date: 2026-08-12

## Verdict

`G4_D_I4_B_REQUEST_SCOPED_CARRIER_AND_LOCAL_DERIVATION_PORT_IMPLEMENTED_DEFAULT_OFF /
PRISMA_DERIVATION_AND_POSITIVE_MATRIX_PENDING / G4_F_CLOSED`

## Implemented boundary

The formal Enrollment Journey wire now admits one exact
`NurtureEnrollmentJourneyCurrentOwnerCarrierV1`. It contains the existing
My-Chat `ScenarioCurrentOwnerBindingPairEvidenceV1` and, only for
`enrollment_family_acceptance`, the exact Guardian action snapshot. The
carrier is valid only inside the already verified private invocation; it is
not a cache key, reverse-lookup request or Nurture business snapshot.

Prepare is input schema/handler v2 and execute is v3. The carrier is required
only for `qualify_capacity_waitlist`, `prepare_trial_relationship` and
`start_trial`, with the exact purpose for each capability, and is forbidden on
every other currently formal Admin capability. Prepare removes it before the
encrypted prepared-command draft is written. Execute requires a fresh carrier
after opening the frozen command and passes it only in the trusted in-memory
context to the owner binding.

The former mixed `NurtureEnrollmentCurrentOwnerEvidenceSourceV1` is removed.
The provider now receives Host evidence from the request and asks the
Nurture-local `NurtureEnrollmentLocalOwnerDerivationV1` port for the local
trial pair and Grant terms. It validates their structure and time, binds the
ordered Host owner refs and versions to the local pair and performs the final
`PrismaEnrollmentPairOwnerRepository` currentness reread before admission.
No raw platform id or Host evidence body is persisted.

My-Chat commit `42c94825f31cf274e08b4cc9de68425b48498fa6` adopts the
execute-v3 declaration in the default-off reservation/settlement coordinator.
This keeps the already qualified inquiry settlement path compatible while the
separate positive carrier producer remains closed.

## Quality evidence

| Gate | Result |
| --- | --- |
| Nurture repository-root TypeScript | PASS |
| focused carrier/formal/surface unit set | PASS — 4 files / 51 tests |
| full unit lane | PASS — 97 files / 1049 tests |
| focused current-owner PostgreSQL suite | PASS — 1 file / 6 tests |
| full production PostgreSQL lane | PASS — 50 files / 439 tests |
| empty migration replay | PASS — Nurture 39/39; My-Chat 43/43 |
| complete serialized x5 lane | PASS — three consecutive runs, each 5 files / 36 tests |
| structural/default-off gates | PASS — formal ingress, persistence, port topology, routing, manifest and C30 default-off |
| exact workflow/source pin | PASS — My-Chat `42c94825`; x5 `d7cf510b...`; wave4 `65d6b0a0...`; Nurture self `6337639e...` |
| runtime effects | NONE — no route, DI binding, persistent apply, activation or traffic |

## Deliberately open

This slice defines and qualifies the request boundary and local owner port; it
does not implement the production Prisma derivation adapter, a My-Chat carrier
producer or a positive signed prepare/execute mutation. The next unit must
bind the exact local association/Guardian-role/Grant reads, then exercise
positive prepare, fresh execute, exact replay, revoke, expiry and head drift on
the three admitted Admin commands. Guardian/mobile/formalization ingress stays
absent, and G4-F remains closed.
