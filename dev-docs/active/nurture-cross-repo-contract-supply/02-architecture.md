# T-011 architecture

## W3.1 ownership and data flow

```text
My-Chat current parent context
  -> verified current-context selection port (routing only)
  -> Nurture current-authority resolver
  -> canonical Nurture family-care owner
  -> published parent-communication DTO
```

The selection port may identify one exact Enrollment candidate, but it is not
authorization. The resolver must reread current Nurture Participant, Guardian
role, family/child-care association, Enrollment/CareGroup, thread membership,
grant, purpose and lifecycle before every summary, detail, media or send
subexchange. Zero, duplicate, revoked or changed facts fail closed.

## Layer boundaries

- `packages/nurture-scenario` owns HTTP-free request/authority/owner ports,
  presentation rules, confirmation binding, command specification, reference
  derivation and latest-generation semantics.
- `packages/nurture-db` owns Prisma authority/read implementations and the
  production-shape binding factory. It reuses the existing repositories and
  command transaction; it does not create a second ORM path.
- `apps/scenario-service` owns parsing, service authentication, route guards,
  response enforcement and dependency injection. It never imports Prisma.
- My-Chat remains the consumer and platform-context owner. It does not read or
  write Nurture tables.

## Canonical write path

```text
prepare
  -> current Nurture authority
  -> encrypted, expiring InteractionContext
  -> no Message/Item/Receipt/CommandExecution

confirm
  -> current Nurture authority
  -> existing NurtureCommandRunner + advisory transaction lock
  -> consume InteractionContext
  -> Message + Item + ItemEvent + ChildLinkReceipt + Attention
  -> CommandExecution
  -> one atomic commit
```

`NurtureCommandExecution` remains the sole idempotency ledger. The local
family-care receipt and attention rows are part of the same Nurture database,
so W3.1 does not invent a cross-owner workflow outbox. The Nurture provider
outbox remains reserved for its existing family-growth release/lifecycle
events, in accordance with the repository contract.

## Read and privacy rules

- Summary contains only segment availability and bounded unread counts.
- Detail opens explicitly, is capped at 20 members and 50 messages, and uses
  actor-bound owner refs rather than raw row ids.
- Protected bodies are unsealed only after current authority succeeds and are
  never logged or copied into confirmation state as plaintext.
- `class_group` and media streaming remain unavailable in P0.
- Response cache partitions bind the exact interface, actor, workspace,
  context, owner resolution, scope version, operation and presentation.

## Async and failure semantics

The latest-generation boundary is process-local and bounded because it is
presentation race control, not a canonical business fact. It keys by actor,
workspace and operation, replaces the active context on capture, rejects late
results, and prunes inactive entries. My-Chat still performs its own consumer
generation check.

Read failures return masked/unavailable results. Confirm failures that may have
committed return `outcome_unknown/reconcile_same_command`; deterministic
validation, revocation, expiry and conflict failures return closed
`not_committed` reasons. No path tells the caller to mint a replacement command
for an unknown outcome.
