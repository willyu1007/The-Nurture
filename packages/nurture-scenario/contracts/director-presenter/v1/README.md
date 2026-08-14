# Director presenter owner contract v1

This directory publishes the standalone, default-off, read-only
`nurture.director-presenter@1.0.0` contract. It covers My-Chat T-039
`D-O01` through `D-O14` through overview, bounded drilldown and protected
material reads without changing `nurture.surface-contract@1.20.0`.

Material pages are bound to the exact request cursor (`null` for the first
page). Ready responses are accepted only when owner resolution, generation,
cache expiry and protected-access expiry form a valid ordered lifetime. Empty
or unavailable overview sections cannot carry metrics, trends, drilldown refs
or material refs; ratio metrics require a valid denominator, and photos require
display-safe alternative text.

Institution Mobile remains action-free. The `operation_entry` section is
always unavailable with `web_workbench_required`; no action, confirmation or
command reference is admitted by the response schema. Institution commands
remain in `InstitutionAdminWorkbench`.

The scenario service mounts three service-authenticated private routes behind
`NURTURE_DIRECTOR_PRESENTER_ENABLED`. Exact `true` is still insufficient
without complete current-authority and owner ports. No deployment, activation,
traffic or device qualification follows from publication.

The digest covers only `director-presenter.owner-contract.json`, parsed as
strict JSON and serialized with the repository canonicalizer before SHA-256.
Fixtures carry the exact pin but remain outside the digest scope.

Run from the repository root:

```bash
node --import tsx packages/nurture-scenario/contracts/director-presenter/v1/validate-contract.mjs
```

The validator checks exact D-O coverage, all three request/response schemas,
current-authority cache binding, independent section states, read-only
operation posture, page binding, lifetime ordering, protected material refs,
negative scenarios and executed invalid mutations.
