# Architecture Principles

> Project-wide constraints and conventions. Each principle is a standing rule,
> not a one-time decision. Update or mark as superseded when the rule changes.

## How to maintain

1. Add a new section under **Principles** when a cross-cutting rule is established.
2. If a principle is superseded, keep it with a `[SUPERSEDED by ...]` tag — do not delete.
3. When an alternative approach is evaluated and rejected, record it under **Rejected Approaches** with the reason.
4. After editing, run `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs touch` to update checksums.

## Principles

### P-001 — Workflow is an institution-management product concept

- `Workflow` MUST mean a durable `InstitutionWorkflow` with resumable business stages,
  progress, responsibility, blockers, and next actions.
- The Institution Web workbench is the current primary Workflow operation surface.
- Boards MAY consume role-safe `InstitutionWorkflowProjection` values. Institution mobile
  is read-only in the current phase; other roles see only their authorized external slice.
- `ActionExecution`, `ActionDelivery`, `CareInteraction`, and `PublishProcess` MUST NOT be
  renamed to Workflow because they are asynchronous, cross-owner, retried, or delivered
  through Handoff/Outbox.
- `My-Workflow-Base` and existing compatibility interface names describe platform/runtime
  ownership; they do not broaden the current product Workflow scope.

Canonical definitions: `docs/context/product/workflow-product-design-contract.md`.

## Rejected Approaches

### R-001 — Treat every asynchronous or cross-owner action as Workflow

Rejected because transport durability is not a product lifecycle. The broad definition
made family communication, notification delivery, publish state, and institution management
indistinguishable and caused contract drift across task packages.
