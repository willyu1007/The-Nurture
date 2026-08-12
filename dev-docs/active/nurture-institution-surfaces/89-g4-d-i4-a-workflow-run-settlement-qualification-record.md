# G4-D I4-A Workflow Run settlement qualification

Date: 2026-08-12

## Verdict

`G4_D_I4_A_WORKFLOW_RUN_SETTLEMENT_DB_QUALIFIED_DEFAULT_OFF /
I4_REMAINDER_PENDING / G4_F_CLOSED`

## Qualified slice

The serialized joint vehicle composes the real My-Chat
`PrismaWorkflowRunReservationLifecycleRepository` and default-off coordinator
with the real Nurture settlement owner/repository, command runner/repository
and settlement finalizer. The two canonical databases remain separate; the
test does not issue a Run locally in Nurture or write either database through
the other repository.

The six-case matrix proves:

1. committed Nurture execution materializes exactly one Host Run and one
   body-free `workflow.run.created` event;
2. execute response loss reconciles through writer-fenced committed history;
3. no-effect response loss reconciles to Host abandonment with no Run/event;
4. unresolved prepared state remains quarantined and non-executable;
5. when the command writer wins, no-effect cannot claim the same fence;
6. when no-effect wins, command execution rolls back and Host abandonment
   creates no Run/event.

Exact terminal replay does not repeat the remote mutation. No Nurture business
fact is persisted in the Host reservation/Run/outbox rows.

## Evidence

| Gate | Result |
| --- | --- |
| Nurture migration history | PASS — 39/39 on the named disposable target |
| My-Chat migration history | PASS — 43/43 on the named disposable target |
| focused joint suite | PASS — 6/6 |
| complete x5 lane | PASS — 35/35 across five files |
| routing and TypeScript | PASS |
| residual synthetic rows | zero after suite cleanup |

The first real Host settlement exposed an invalid large bounded repetition in
the My-Chat receipt CHECK. My-Chat replaced the repetition bound with an exact
`char_length` predicate plus the existing character grammar, added a
structural regression, reset the disposable target and replayed all migrations
before this record was accepted.

## Boundaries and next step

This record qualifies the generic reservation/settlement protocol, not full
G4-D I4. The native-source and current-owner transports, remaining Journey
command families, revoke/expiry/head drift, Guardian/mobile presentation and
complete negative/replay matrix remain open. G4-F cannot start until that
remainder produces one exact I4 record.

No route, dependency-injection binding, durable environment apply, capability
activation, deployment or traffic was added.
