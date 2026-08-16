# T-012 pitfalls

## Do not confuse demotion with deletion

The Fastify harness is architecturally obsolete as a normal runtime but still
owns focused test evidence. Remove its normal-entrypoint semantics now; remove
its code only when the explicit coverage and CI deletion gate is satisfied.

## Do not keep compatibility aliases

Keeping both `dev-host:*` and `legacy-host:*` scripts would create the same
dual vocabulary this task is intended to remove. Update maintained callers in
one change and delete the old aliases.

## Do not rewrite archived evidence

Archived dev-docs describe the repository at the time their gates ran. Their
historical `dev-host` wording remains accurate and must not be mass-renamed.

## Do not use an arbitrary local database as E2E evidence

The first phase-2 legacy run reached the configured local databases and failed
because their schemas were not current. A failing masked HTTP response did not
identify a code regression. Re-run migration-dependent evidence on two fresh,
explicitly disposable databases and prove teardown; never migrate an existing
developer database merely to make a quality gate green.

## Do not finalize a cross-repository pin before source-consumer CI is green

Typecheck and unit tests did not exercise Next/Turbopack consuming the new
TypeScript package entrypoints. The first exact pin was internally consistent
but had to be rotated after remote application builds exposed the packaging
defect. For future owner adoption, run the relevant application production build
or wait for its equivalent CI lane before declaring the upstream source frozen;
if a correction is still required, repeat both reseal stages without editing a
minted lock by hand.
