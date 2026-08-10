# Surface Contract V1

This directory is the Nurture-owned, framework-neutral source for the
six-surface interface contract.

## Current boundary

- `source/` is normative and human-reviewed.
- Phase 1 defines the interface-ref shape, capability-descriptor shape,
  six-surface registry, atomic surface envelope, visibility matrix and shared
  readiness/snapshot rules.
- Phase 2 defines typed query/prepare/execute/read-result, error, pagination,
  private confirmation/cursor bindings, stable presenter contracts and
  versioned policy/repository ports. The current closed registry contains 58
  independently versioned capabilities. G4-D I2-A contributes three
  Enrollment Journey queries and 21 commands behind an unqualified,
  default-off runtime owner gate. I2-B binds them to fail-closed scenario
  module adapters while leaving formal ingress, real owners and activation
  absent.
- Phase 3 adds `source/fixtures/` — the versioned PII-free synthetic world
  (`fixtures/world/`) plus one independent, repeatable initial state per
  journey (`fixtures/journeys/<gj-1…gj-5|rj-1>/initial-state.json`), each
  binding the exact world ref with a journey-prefixed overlay. Journey
  scripts (`script.json` + `expected/<step>.json`) express one value loop
  plus one highest-risk refusal per journey using only registry
  capabilities, contract effects/error codes and role-safe states. Fixture
  files join the canonical inventory and root digest without entering the
  shared core or any existing capability/surface slice.
- `generated/surface-contract.manifest.json` is deterministic output. It
  records the exact `nurture.surface-contract@1.19.0` /
  `sha256:6f67d49ca303ad627b6644857a16dde7626cc944bf8c065f09629039025f738e`,
  shared-core hash,
  canonical source inventory and per-capability/per-surface/per-fixture slice
  hashes (fixture slices: `world`, `journey:<key>`, `selection`).
  `generated/surface-contract.artifact-pin.json` is the separately trusted
  byte-independent canonical hash required before loading that manifest.
  Compatibility admission never treats a self-declared interface ref as
  artifact-integrity evidence.
  Git/source revision and build time are qualification provenance and are not
  stored as semantic digest inputs.
- `pnpm build:surface-contract` regenerates the checked artifact.
  `pnpm verify:surface-contract` rebuilds it under `.ai/.tmp/`, compares exact
  bytes and removes the temporary directory.

These artifacts do not activate a capability, grant authority, publish a
package or authorize My-Chat adoption. Protected use still requires exact
owner integration and Joint Conformance.

## Consumer adoption checklist

- Pin the exact interface ref — `key` + `version` + `digest` — taken from
  `generated/surface-contract.manifest.json`. Admission never accepts
  version ranges, a mutable `latest`, major-only pins or digest-free
  fallbacks (`interface/compatibility-policy.json` is normative).
- Load the manifest only together with the separately obtained trusted
  `surface-contract.artifact-pin.json` and reject on canonical-hash
  mismatch; a self-declared interface ref is never integrity evidence.
- Declare the expected exact ref in every invocation. The only
  renegotiation path is a `contract_mismatch` error with
  `required_upgrade`; consumers then adopt a new exact ref explicitly.
- Every semantic or additive change rotates version and digest. Evidence
  scope is judged mechanically per capability/surface/fixture slice hash:
  an unchanged slice keeps its evidence, a changed slice invalidates only
  referencing evidence, shared-core drift invalidates everything.
- `source/conformance/conformance-cases.json` enumerates the synthetic
  qualification cases (optionally back-linked via `T###-AC-###` refs);
  `pnpm verify:surface-conformance` reruns the whole suite in one
  deterministic command. Synthetic PASS qualifies the contract layer
  only — Owner Integration Readiness and Joint Conformance are separate
  gates that bind the real pinned owner path.

## Editing rules

- Keep file and directory names in kebab-case.
- Reject unknown fields in schemas and parity tests.
- Do not add Prisma, My-Chat runtime, host navigation, component trees, raw
  platform identity or authorization outcomes.
- Do not hand-create a generated manifest, artifact pin or mutable `latest`
  alias.
- Change normative source first, rotate the interface version for every
  semantic or additive change, rebuild, then review the generated diff.
