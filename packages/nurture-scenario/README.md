# Nurture Scenario Module

Scenario-module scaffold for My-Chat integration.

Rules:

- This package owns Nurture manifest, handlers, actions, presenters, policies, adapters, repository ports, and deterministic journey fixtures.
- My-Chat owns host runtime, routes, workers, outbox, shared ledgers, handoffs, and downstream consumers.
- Contract types come from the pinned My-Chat `workflow-contracts` package; local duplicate contract types are forbidden.
- Health-state outputs must stay non-diagnostic and non-prescriptive.

Primary entry:

- `src/module.ts`
- `scenario.manifest.yaml`
