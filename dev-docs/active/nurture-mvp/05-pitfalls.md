# Pitfalls — G0 baseline reconstruction

## Do-not-repeat summary

- Never merge or cherry-pick `codex/g0-preservation`; reconstruct explicit formal scopes from `origin/main`.
- Never deploy backend dev-host Workflow models through the root Nurture Prisma migration stream.
- Never advance after a failed node gate; record and fix the failure first.

## Pitfall log

### 2026-07-13 — retired paths survived as empty directories

- Symptom: the first UI retirement gate exited non-zero after all content checks passed.
- Context: the gate requires the retired `ui/` and UI test paths to be absent, not merely untracked.
- What we tried: file deletion through `apply_patch`, which correctly removed tracked files but does not remove their final empty directories.
- Why it failed: filesystem directories are not represented in the Git patch.
- Fix / workaround: remove only confirmed-empty directories, then rerun the complete gate.
- Prevention: after whole-directory retirement, assert both zero references and physical path absence before recording PASS.
- References: `test ! -e ui`; `test ! -e docs/context/ui`; `test ! -e .ai/tests/suites/ui`; `test ! -e .ai/tests/maintainer/ui`.

### 2026-07-13 — repository prefixes made equal contracts hash differently

- Symptom: the first Base and My-Chat contract hashes differed although their eight `src` files were byte-identical.
- Context: the first algorithm input used paths relative to each repository root.
- What we tried: hashing full repository-relative paths plus file contents.
- Why it failed: Base and My-Chat store the same contract under different directory prefixes, so storage layout contaminated the content identity.
- Fix / workaround: pin an explicit `contractRoot` per repository and hash paths relative to that root; keep repository revision as a separate field.
- Prevention: contract content hashes must normalize package-root layout while still including paths below the contract root.
- References: `sha256-path-content-v1`; `docs/project/integrations/my-chat-workflow-contract.json`.

### 2026-07-13 — file-linked My-Chat runtime could not resolve workspace contracts

- Symptom: `pnpm install` failed with `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` for `@my-chat/workflow-contracts@workspace:*`.
- Context: Nurture consumes `@my-chat/workflow-runtime` from the adjacent My-Chat repository for conformance tests.
- What we tried: the package-level `file:` dependency alone.
- Why it failed: the linked runtime retains a My-Chat-internal `workspace:*` dependency that is not a member of the Nurture workspace.
- Fix / workaround: root pnpm override maps `@my-chat/workflow-contracts` to the adjacent pinned My-Chat contract package.
- Prevention: keep the cross-repository revision/hash verifier mandatory whenever local path overrides are used.
- References: `package.json#pnpm.overrides`; `docs/project/integrations/my-chat-workflow-contract.json`.

### 2026-07-13 — Prisma validate and psql used different URL query support

- Symptom: Prisma accepted `?schema=public`, but a diagnostic `psql` invocation rejected the same URI with `invalid URI query parameter: schema` after all migration/tests had passed.
- Context: the PostgreSQL catalog was being printed as additional evidence after the Node catalog assertion.
- What we tried: reuse the Prisma `DATABASE_URL` directly with `psql`.
- Why it failed: Prisma-specific `schema` is not a libpq connection URI parameter.
- Fix / workaround: pass host, port, user, and database explicitly to `psql`; keep the Prisma URL for Prisma commands.
- Prevention: do not assume ORM URL extensions are accepted by native database clients.
- References: `pnpm db:assert-boundary`; `psql -h 127.0.0.1 -p 5433 -U nurture -d nurture_g0_verify`.

### 2026-07-13 — ordinary diff check missed untracked-file whitespace

- Symptom: `git diff --check` passed before staging, then `git diff --cached --check` reported EOF blank lines in newly added source and test files.
- Context: the reconstruction helper imported preserved files as new, untracked paths.
- What we tried: the normal working-tree diff gate before staging.
- Why it failed: `git diff` does not include untracked files.
- Fix / workaround: normalize the imported files, stage the explicit scope, then run the cached diff gate.
- Prevention: every increment with new files must treat `git diff --cached --check` as mandatory evidence; the pre-stage check is not sufficient.
- References: `git diff --cached --check`; `git status --untracked-files=all`.
