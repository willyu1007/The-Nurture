# Surface Contract V1

This directory is the Nurture-owned, framework-neutral source for the
six-surface interface contract.

## Current boundary

- `source/` is normative and human-reviewed.
- Phase 1 defines the interface-ref shape, capability-descriptor shape,
  six-surface registry, atomic surface envelope, visibility matrix and shared
  readiness/snapshot rules.
- Phase 2 will add typed invocation/result/error sources, concrete capability
  descriptors, canonicalization, exact interface version/digest, generated
  manifest and deterministic build/verify tooling.
- `generated/` is intentionally absent until Phase 2 can produce a
  non-placeholder exact contract identity.

These artifacts do not activate a capability, grant authority, publish a
package or authorize My-Chat adoption. Protected use still requires exact
owner integration and Joint Conformance.

## Editing rules

- Keep file and directory names in kebab-case.
- Reject unknown fields in schemas and parity tests.
- Do not add Prisma, My-Chat runtime, host navigation, component trees, raw
  platform identity or authorization outcomes.
- Do not hand-create a generated manifest or a mutable `latest` alias.
