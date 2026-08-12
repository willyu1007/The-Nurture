# G4-D I4-B Host carrier signed positive qualification

Date: 2026-08-12

## Verdict

`G4_D_I4_B_HOST_CARRIER_SIGNED_POSITIVE_QUALIFIED_DEFAULT_OFF /
REMAINING_I4_MATRIX_PENDING / G4_F_CLOSED`

## Qualified boundary

The exact My-Chat T-041 source
`ae33b31363b86b0664412e0d053104780048c342` now supplies the real private
current-owner carrier producer and detached-response-verified prepare/execute
client. The joint vehicle uses the real My-Chat Prisma binding-pair and
prospective-contact owners, not a test-local evidence builder.

For `enrollment_trial_pair`, the Host rereads the current committed Child/
Family pair and emits short-lived, purpose-bound evidence. For
`enrollment_family_acceptance`, it also validates the Guardian action and
rereads the exact current opaque contact ref. No raw phone/WeChat value crosses
the Host boundary.

The signed client sends the exact formal prepare-v2 and execute-v3 declarations.
Nurture verifies the Ed25519 request and nonce, dispatches its real formal
handler, verifies current authority and locally derives the pair and Grant,
then signs the response. Prepare receives one carrier; execute receives newly
issued evidence. The carrier is not persisted in the prepared-command ledger.

## Real state and effect

The fixture creates the platform Child/Family/stewardship/membership/binding
facts in My-Chat and the matching Nurture anchors, associations,
authorizations, Guardian role and immutable Grant policy. Enrollment Journey
state is built through the six canonical command transitions rather than by
writing an advanced Workflow head directly.

The signed positive command is `prepare_trial_relationship`. It creates one
pending Enrollment and one active trial Grant through the production option,
authority, prepared-command and transaction owners. Assertions prove that:

- the resulting Workflow advances by exactly one head;
- the Enrollment and Grant belong to the exact current pair/process;
- prepared persistence contains neither the carrier hashes nor owner refs;
  and
- the raw Host contact value is absent from Nurture inquiry rows.

## Quality repairs

The first fixture draft attempted to insert an already-advanced Workflow.
PostgreSQL correctly rejected the later effect because the append-only
transition history was absent. Replacing that shortcut with canonical command
execution turned the test into state-machine evidence rather than a constraint
bypass.

The next draft used a Nurture Participant id as the Guardian action actor even
though the carrier contract requires the My-Chat canonical Actor. The fixture
now keeps those namespaces distinct. The Enrollment assertion was also scoped
to the exact new ChildCareProcess so an intentionally ended capacity fixture
could not be mistaken for the created relationship.

## Verification

| Gate | Result |
| --- | --- |
| My-Chat carrier/signed-client focused set | PASS — 4 files / 24 tests |
| My-Chat full unit / root TypeScript / ESLint | PASS — 166 files / 1154 tests; all 17 typed workspace projects; lint clean |
| Nurture joint settlement file | PASS — 1 file / 8 tests |
| complete serialized x5 lane | PASS — three consecutive runs, each 5 files / 37 tests |
| Nurture full unit / root TypeScript | PASS — 97 files / 1049 tests; typecheck clean |
| formal ingress / routing / Host source lock | PASS — 7 routes; x5 census 5; Host lock unchanged |
| runtime effects | NONE — named disposable databases only; no route, DI binding, durable apply, activation, deployment or traffic |

## Deliberately open

This record qualifies one real Host-producer, signed, positive two-database
path. It does not complete native-message source coverage, the remaining
command families, exact replay/response-loss combinations, Guardian/mobile
ingress or the complete revoke/expiry/head-drift matrix. G4-F remains closed.
