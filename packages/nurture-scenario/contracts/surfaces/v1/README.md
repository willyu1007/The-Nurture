# Surface Contract V1

This directory is the Nurture-owned, framework-neutral source for the
six-surface interface contract.

## Current boundary

- `source/` is normative and human-reviewed.
- Phase 1 defines the interface-ref shape, capability-descriptor shape,
  six-surface registry, atomic surface envelope, visibility matrix and shared
  readiness/snapshot rules.
- Phase 2 defines typed query/prepare/execute/read-result, error, pagination,
  private confirmation/cursor bindings, the closed ten-capability V1 registry,
  stable presenter contracts and versioned policy/repository ports.
- Phase 3 adds `source/fixtures/` — the versioned PII-free synthetic world
  (`fixtures/world/`) consumed by journey and selection fixtures. Fixture
  files join the canonical inventory and root digest without entering the
  shared core or any existing capability/surface slice.
- `generated/surface-contract.manifest.json` is deterministic output. It
  records the exact `nurture.surface-contract@1.1.0` digest, shared-core hash,
  canonical source inventory and per-capability/per-surface slice hashes.
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

## Editing rules

- Keep file and directory names in kebab-case.
- Reject unknown fields in schemas and parity tests.
- Do not add Prisma, My-Chat runtime, host navigation, component trees, raw
  platform identity or authorization outcomes.
- Do not hand-create a generated manifest, artifact pin or mutable `latest`
  alias.
- Change normative source first, rotate the interface version for every
  semantic or additive change, rebuild, then review the generated diff.
