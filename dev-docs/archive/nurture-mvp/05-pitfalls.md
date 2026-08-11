# Pitfalls — G0 baseline reconstruction

## Do-not-repeat summary

- Never merge or cherry-pick `codex/g0-preservation`; reconstruct explicit formal scopes from `origin/main`.
- Never deploy backend dev-host Workflow models through the root Nurture Prisma migration stream.
- Never advance after a failed node gate; record and fix the failure first.
- Never expose the unauthenticated dev host or local PostgreSQL outside loopback.
- Never rely on a sibling source dependency without hashing the exact build inputs.

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

### 2026-07-13 — host pg_dump was older than the container server

- Symptom: backup aborted with `server version: 16.13; pg_dump version: 14.19` before any database mutation.
- Context: the local database runs in `postgres:16-alpine`, while Homebrew exposed PostgreSQL 14 client tools first.
- What we tried: invoke the host `pg_dump` against container PostgreSQL.
- Why it failed: `pg_dump` refuses to dump a newer major server.
- Fix / workaround: run `pg_dump` and `pg_restore` inside `nurture-postgres`, streaming the custom-format backup to/from the host file.
- Prevention: compare server/client major versions before backup; prefer tools shipped with the database container.
- References: `docker exec nurture-postgres pg_dump`; backup hash in `04-verification.md`.

### 2026-07-13 — dev-host URL was initially required outside dev

- Symptom: the first env contract required `DEV_HOST_DATABASE_URL` in staging and production despite the deployment boundary forbidding the dev host there.
- Context: secret-ref coverage passed mechanically, masking the semantic contradiction.
- What we tried: define the new URL as globally required.
- Why it failed: coverage correctness is not deployment-scope correctness.
- Fix / workaround: set `scopes: [dev]` and remove staging/production secret refs.
- Prevention: every new config key must encode the environments where the owning component is actually deployable.
- References: `env/contract.yaml`; `env/secrets/dev.ref.yaml`.

### 2026-07-13 — combined audit output polluted a restored document

- Symptom: an extra-path list was appended to `safety-lexicon-signoff.md` during restoration.
- Context: one shell command emitted both `git show` content and a later coverage list, and the orchestration code treated the combined stdout as one file.
- What we tried: reuse a multi-purpose command result as restoration input.
- Why it failed: stdout lacked a trustworthy boundary between file content and audit output.
- Fix / workaround: restore the file again from a command that performs only `git show`; inspect the tail before audit continuation.
- Prevention: file restoration commands must emit exactly one file and no diagnostic/list output.
- References: `dev-docs/active/nurture-mvp/safety-lexicon-signoff.md`; preservation commit `9c54ef27...`.

### 2026-07-13 — zsh path variable broke the blob audit

- Symptom: the first blob census ended with `command not found: wc`.
- Context: the loop used `path` as its variable name.
- What we tried: iterate over preserved paths in zsh.
- Why it failed: zsh treats lowercase `path` as a special array tied to `PATH`, so assigning a file path corrupted command lookup.
- Fix / workaround: rename the loop variable to `file_path` and rerun the census from empty result files.
- Prevention: never use `path` as a zsh local/loop variable in repository scripts or ad-hoc audits.
- References: blob census recorded in `g0-wip-coverage-audit.md`.

### 2026-07-13 — GitHub Package permissions blocked clean CI

- Symptom: all four install-bearing CI jobs failed with `ERR_PNPM_FETCH_403` for the private `web-workbench` package while local checks passed from cache/authenticated state.
- Context: the repository `GITHUB_TOKEN` had `packages: read` but the package belonged to another repository and did not grant this repository Actions access.
- What we tried: package repository-access API and an authenticated browser fallback; neither yielded a safe, automated repository-level grant.
- Why it failed: user-scoped package Actions access was not available through the attempted REST route, and storing the local broad PAT as a repository secret would violate least privilege.
- Fix / workaround: check out the pinned My-Workflow-Base revision, build `templates/web-workbench`, link that sibling source, and hash its exact 58 build inputs.
- Prevention: cross-repository CI must prove a clean, unauthenticated runner install; never treat local package cache/auth as portability evidence.
- References: `.github/workflows/ci.yml`; `docs/project/integrations/my-chat-workflow-contract.json`.

### 2026-07-13 — local env guidance and Prisma loading diverged

- Symptom: `pnpm dev-host:db:validate` failed without an exported `DEV_HOST_DATABASE_URL` even though generated guidance recommends `.env.local`.
- Context: Prisma CLI automatically loaded `.env`, while the repo environment contract and local tooling generate `.env.local`.
- What we tried: validation from the existing post-merge workspace without re-exporting the URL.
- Why it failed: the package scripts invoked Prisma/Vitest directly, so `.env.local` was not loaded.
- Fix / workaround: route environment-dependent repository commands through `scripts/run-with-local-env.mjs` with process env > `.env.local` > `.env` precedence; add deterministic node tests.
- Prevention: any documented local environment source must be exercised by the actual CLI entrypoints, not only by the application framework.
- References: `scripts/run-with-local-env.mjs`; `scripts/run-with-local-env.test.mjs`; `README.md`.
