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
