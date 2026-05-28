# Nurture Scenario Module

Scenario-module scaffold for My-Chat integration.

Rules:

- This package owns Nurture manifest, handlers, actions, presenters, policies, adapters, repository ports, and deterministic journey fixtures.
- My-Chat owns host runtime, routes, workers, outbox, shared ledgers, handoffs, and downstream consumers.
- Local TypeScript contract types are compatibility stubs. Replace them with My-Chat host `workflow-contracts` during integration.
- Health-state outputs must stay non-diagnostic and non-prescriptive.

Primary entry:

- `src/module.ts`
- `scenario.manifest.yaml`
