# Parent communication owner v1

This directory publishes the standalone, default-off
`nurture.parent-communication-owner@1.0.0` interface. Nurture remains the
authority and canonical writer for communication membership, protected message
content, instruction receipts, protected media access and send outcomes.

P0 is intentionally narrow: minimized closed-surface summary, explicit-open
teacher detail, a frozen read-only protected-image access contract, and text
prepare/confirm with same-command reconciliation. The media access route
rechecks current authority but must return `content_unavailable` in P0 because
the private stream ingress and My-Chat proxy are not mounted yet. `class_group`
can report `unsupported_segment`; attachment upload/send and voice are not
admitted by this version.

Validate the exact artifact, schemas, fixtures, minimization rules and command
bindings with:

```sh
pnpm exec tsx packages/nurture-scenario/contracts/parent-communication-owner/v1/validate-contract.mjs
```

The publication does not authorize owner-port composition, capability
activation, deployment or traffic.
