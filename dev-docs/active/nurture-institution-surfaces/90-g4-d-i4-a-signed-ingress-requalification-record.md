# G4-D I4-A signed-ingress requalification

Date: 2026-08-12

## Verdict

`G4_D_I4_A_SIGNED_EXECUTE_DECLARATION_REQUALIFIED_DEFAULT_OFF /
I4_REMAINDER_PENDING / G4_F_CLOSED`

## Quality finding and repair

The post-qualification review found one blocker hidden by the protocol-only
joint vehicle in record [`89`](./89-g4-d-i4-a-workflow-run-settlement-qualification-record.md).
My-Chat's signed execute client still declared the superseded
`nurture.enrollment_journey.execute` / `execute_enrollment_journey_action`
tuple, while Nurture's adopted formal ingress requires
`nurture.enrollment_journey.command.execute` /
`execute_prepared_enrollment_journey_command` at input schema v2. A real
signed execute would therefore fail the declaration gate before reaching the
qualified settlement owner.

My-Chat commit `4673712` aligns the tuple and adds an execute assertion to the
detached request/response unit round trip. Nurture now also owns a
cross-repository regression that compares the two declarations byte-for-byte,
signs the My-Chat request, verifies request trust and one-time nonce, invokes
the real Nurture formal handler, signs the response and verifies it at the
My-Chat client. The handler deliberately returns its default-off unavailable
result because no production owner binding is installed in this transport
test.

The complete x5 rerun also exposed a one-millisecond fixture race: E8 built
`issued_at` and `expires_at` from separate clock reads, so its nominal 60-second
window could become 60001ms. The fixture now derives both values from one
instant; the full lane then passed.

## Evidence

| Gate | Result |
| --- | --- |
| My-Chat signed verifier/coordinator | PASS — 2 files / 17 tests |
| signed My-Chat -> Nurture formal execute round trip | PASS — focused joint file / 7 tests |
| empty My-Chat migration replay | PASS — 43/43 on disposable PostgreSQL |
| empty Nurture migration replay | PASS — 39/39 on disposable PostgreSQL |
| complete serialized x5 lane | PASS — three consecutive runs, each 5 files / 36 tests |
| My-Chat scenario-integrations typecheck | PASS |
| Nurture DB package typecheck | PASS |
| exact workflow/source pin | PASS — My-Chat `4673712`, x5 source `312d0477...`; Base/contract and wave4 hashes unchanged |
| residual/runtime effects | disposable targets destroyed after verification; no route, DI binding, persistent apply, activation or traffic |

## Boundary and next node

This closes the signed declaration hole in I4-A; the requalification does not
combine a positive signed execute and real database mutation into a production
route, nor does it complete I4. The next bounded I4 node is the
native-source/current-owner
carrier and owner derivation freeze. That node must preserve the record-53 rule
that Host current-owner evidence lives only inside the enclosing private
invocation; the evidence must not be cached, fetched by raw platform id or treated as
Nurture business authority. Remaining Journey commands, Guardian/mobile and
the revoke/expiry/head matrix stay open.
