# Pitfalls — Institution Mode

This file exists to prevent repeating mistakes within this task.

## Do-not-repeat summary

- Do not reduce institution ecology to an authorization feature; institution is the child's external growth environment.
- Do not treat institution ecology as an independent product shell; institution ecology remains inside the My-Chat scenario boundary.
- Do not put My-Chat account/auth/session semantics inside The Nurture; they belong to My-Chat.
- Do not put Nurture care ecology semantics inside My-Chat as canonical facts; family, child, institution, care group, role assignment, enrollment, grant, family-care messages, and care items belong to Nurture.
- Do not wire live manifest capabilities before Nurture care ecology schema, resolvers, policies, and handlers exist.
- Do not let institution mode drift into ranking, marketplace, competitive caregiver scoring, or institution growth tooling.
- Do not allow cross-domain ambient reads; cross-ecology movement must be `ChildLinkGrant`-gated handoff.
- Do not design only for family-side data回流; teachers and institutions must receive direct operational value.
- Do not auto-publish child photo recognition results; use reference images for candidate attribution and require teacher confirmation.
- Do not reduce institution value to generic efficiency; capture philosophy transmission, asset re-organization, and operational quality loops.
- Do not leave teachers with one UI thread per child family group; teacher-side family communication must aggregate into class inbox / attention board workflows.
- Do not declare institution context resolvers or live manifest handlers before the host registry and DB-backed owner-read path exist; legacy validation will fail or the manifest will advertise a non-functional surface.
- Do not authorize an item action from an arbitrary current grant; first revalidate the grant identity bound to that item so a replacement grant cannot reactivate old work.
- Do not assume a command-request lock serializes two Guardians using different command ids against the same Grant business identity. Enforce the active partial unique index, retry only known whole-transaction races, and reread the winner as `already_satisfied` without transferring owner or extending expiry.
- Do not compare a newly derived `expiresAt` when deciding same-definition. Directions, data classes, and purposes form the canonical business profile; lifecycle timestamps are committed facts, and recomputing them would create a rolling-renewal path.
- Do not label every successful Grant command `grant_confirmed`. A second Guardian's `already_satisfied` result means an authorization is already active, not that the actor confirmed, owns, or jointly consents to the Grant.
- Do not treat CommandExecution output refs as durable user visibility or a client result locator. Exact replay must owner-reread current state, while routes and clients receive no Grant/Thread/Execution raw refs or `open_result` token.
- Do not store both `supersedesGrantId` and a mirrored `replacementGrantId`; one unique new-to-old self-reference plus inverse query prevents lineage divergence.
- Do not treat replacement Thread reuse as Grant or content continuity. Every old Message/Receipt/Item/Attention retains the old `grantId`, and replacement cannot restore its cross-role authority.
- Do not let Grant-owner revoke become a permanent family veto. The exact Grant stays terminal, but any current equal Guardian may later complete a fresh authorization for future work only.
- Do not accept revoke reason, timestamp, actor, or dependent refs as client-authored audit. Pilot uses server-owned `user_revoked`, database time, resolved actor, exact Grant/Thread refs, and a separately bounded cascade summary.
- Do not bind Grant ownership only to Participant identity. Persist the exact confirming Guardian RoleAssignment so rejoin or a new role row cannot revive an old Grant.
- Do not translate Host account/workspace loss into a Nurture role or Grant mutation. Host blocks that user's access; Nurture suspension/terminal role facts independently govern the Grant lifecycle.
- Do not run permanent cascade for Host loss, role suspension, owner outage, or temporary policy/topology denial; current fail-closed and irreversible lifecycle convergence are different operations.
- Do not use JSON scanning, `take: 100`, `SKIP LOCKED`, intermediate commits, or truncated dependent refs as cascade closure. Typed dependencies, root locking, keyset loops, zero-row postconditions, and bounded count/hash audit are required.
- Do not treat an updated adjacent-repo revision pin as sufficient for a pnpm `file:` dependency; rebuild the local package snapshot and rerun typecheck/tests before accepting the pin.
- Do not let public database smokes fail as missing-file exceptions when they target optional feature packs absent from the repo; mark unavailable packs as explicit SKIP and continue applicable SSOT-mode tests.
- Do not derive a Nurture business command identity from claim token, Step version, or the currently executing Step; reclaim evidence rotates and a wrong Step must not become a new business command.
- Do not let a scenario command-source port supply scope, target refs, or expected versions that Nurture can derive and owner-reread; that creates a second authorization authority.
- Do not encode the same Nurture business refs into both handoff context and host Step output; keep owner-readable refs in the handoff and expose only opaque execution evidence from the Step.
- Do not return revoke/redaction classification before checking whether the current My-Chat actor is an authorized recipient; lifecycle reason is itself sensitive.
- Do not treat a delivered receipt as permanently delivered for deep-link reads; current recipient opens must also allow the converged read/acknowledged states while rechecking every other gate.
- Do not install an intentionally standalone package with a parent-workspace-aware pnpm command; use its own lockfile with `--ignore-workspace` and prove the path in a clean checkout.
- Do not assume a checked-out adjacent repository is typecheck-ready; direct source imports require its workspace install and generated clients in the same clean job.
- Do not use `NurtureFamilyCareThreadParticipant` as a second authorization ledger; current role, scope, Enrollment, Grant, Thread/source lifecycle, policy, and redaction are the owner-reread authority, while participant rows are optional projection only.
- Do not make the Enrollment invitation recipient or earliest Guardian an implicit primary Grant authority; every current exact-family Guardian may first-confirm, and only the first committed Grant establishes owner-only administration.

## Pitfall log (append-only)

### 2026-07-18 — Bounded cascade could commit a privacy-unsafe prefix

- Symptom: revoke and redaction selected only the first 100 dependents and returned
  sliced refs, allowing the root to become terminal while later Receipt, Item,
  Attention, context, or derived projection rows remained actionable or readable.
- Context: Pilot-0-C2e-4d dependent cascade closure convergence.
- Root cause: API result bounding, transaction workload control, dependency
  discovery, and authorization closure were treated as the same limit.
- What we tried: traced Grant and redaction roots through contexts, Receipts, Items,
  clarification events, Attention, Thread summaries, immutable replay seeds, and
  Host delivery retries, including more-than-100 and concurrent-insert cases.
- Fix / workaround: use typed dependencies, root-first locks, a preflight hard cap,
  in-transaction keyset loops, final zero-row assertions, and bounded count/hash
  audit; overflow rolls back before root mutation and output refs stay exact.
- Prevention: fault, overflow, phantom-insert, redaction-branch, stale-delivery, and
  persistence-privacy tests must reject every partial or body-derived survivor.

### 2026-07-18 — Participant-only ownership could revive a terminal Grant

- Symptom: an old Grant keyed only by `grantedByParticipantId` could become usable
  again when the same canonical Participant rejoined through a new Guardian
  RoleAssignment after the original role had terminated.
- Context: Pilot-0-C2e-4c Grant-owner loss convergence.
- Root cause: stable person identity and versioned authority identity were treated
  as interchangeable even though rejoin must create a new authority row.
- What we tried: traced self-exit, Host loss/restore, role suspend/resume, terminal
  role states, fresh Grant confirmation, and original-Grant runtime checks.
- Fix / workaround: add exact `grantedByRoleAssignmentId`, require current checks
  against that row, quarantine ambiguous legacy bindings, and let only a complete
  fresh confirmation create a new Grant bound to a new role.
- Prevention: migration, resolver, race, rejoin, and stale-open tests must prove a
  new RoleAssignment never restores the old Grant or old protected work.

### 2026-07-18 — Owner revoke risked creating hidden primary-Guardian veto

- Symptom: treating revoke as a family-wide permanent prohibition would let the
  first Grant owner prevent another otherwise equal current Guardian from ever
  creating a fresh authorization.
- Context: Pilot-0-C2e-4b voluntary revoke convergence.
- Root cause: administration of one exact Grant identity was conflated with global
  authority over future Family consent decisions.
- What we tried: compared C-2e-1 equal first-confirm eligibility, owner-only current
  Grant administration, irreversible terminal history, and old-work isolation.
- Fix / workaround: revoke only the exact Grant; never reactivate that row or old
  work; require a complete fresh confirmation for any future authorization; allow
  any then-current Guardian to become the owner of that new future-only Grant.
- Prevention: tests must separate same-Grant owner-only revoke from fresh-Grant
  equal-Guardian eligibility and prove no successor revives old content or actions.

### 2026-07-18 — Replacement lineage risked reauthorizing old work

- Symptom: storing both old-to-new and new-to-old Grant ids could diverge, while
  reusing the Enrollment Thread could be misread as restoring old Message,
  Receipt, Item, or Attention authority under the successor Grant.
- Context: Pilot-0-C2e-4a Grant replacement convergence.
- Root cause: authorization lineage and conversation-container continuity were
  represented as if they were the same lifecycle relationship.
- What we tried: traced replacement identity, Thread ownership, original-object
  foreign keys, current owner-read predicates, and transaction rollback together.
- Fix / workaround: persist only unique successor `supersedesGrantId` and query its
  inverse; keep every existing object on its original `grantId`; treat Thread reuse
  as container continuity only; fence old work in the atomic replacement command.
- Prevention: migration and transaction tests must reject broken or ambiguous
  lineage and prove that neither the successor Grant nor the reused Thread revives
  any old cross-role read, action, activation, or delivery permission.

### 2026-07-18 — Immutable Grant receipt risked becoming a second permission view

- Symptom: a single `grant_confirmed` result could describe a second Guardian's
  `already_satisfied` command as confirmation/ownership and could keep showing
  active state from immutable Execution refs after current authorization changed.
- Context: Pilot-0-C2e-3 result, response-loss, and Handoff convergence.
- Root cause: command idempotency evidence, current business visibility, and user
  presentation were treated as one result layer even though they have different
  lifecycle and authorization rules.
- What we tried: compared C-2e-2's immutable Execution semantics with B3-2d current
  presenter continuity and the equal-Guardian/first-committer ownership contract.
- Fix / workaround: keep exact Grant/Thread refs server-side on CommandExecution,
  owner-reread `family_care_grant_current` for every user result, and distinguish
  `activated` from `already_active` without transferring owner. Confirmation stays
  explicit-empty and creates no result token, notification, or protected work.
- Prevention: test all disposition/outcome combinations, current-state change after
  commit, second-Guardian presentation, raw-ref absence, and exact response-loss
  replay before consumed-context classification.

### 2026-07-18 — Enrollment confirmation risked becoming hidden Grant hierarchy

- Symptom: restricting first-Grant confirmation to the Enrollment invitation
  recipient would make one otherwise equal Guardian a hidden primary authority.
- Context: Pilot-0-C2e-1 review and confirming-Guardian convergence.
- Root cause: Enrollment acceptance and Grant authorization are adjacent in the UX,
  but the commands establish different facts and already have separate action keys.
- What we tried: compared the proposed actor boundary with equal Guardian rights,
  owner-only Grant administration, and the no-primary-Guardian Pilot contract.
- Fix / workaround: allow any current exact-family Guardian to review and first-
  confirm. First committed confirmation alone establishes `grantedByParticipantId`;
  `already_satisfied`, join order, or Enrollment confirmation never transfers owner.
- Prevention: presenter and concurrency tests must cover both Guardians, first-
  committer ownership, loser `already_satisfied`, and zero implicit owner transfer.

### 2026-07-17 — Stored thread membership contradicted owner-reread authority

- Symptom: C-2d-3 defined ThreadParticipant as non-authorizing projection, but the
  current family and caregiver command preconditions still require a stored
  `thread_membership_active` row. A first-Grant transaction without participant
  fan-out would therefore create an unusable Thread.
- Context: Pilot-0-C2e-0 Grant authorization convergence before implementation.
- Root cause: an earlier repository convenience check became an independent
  permission fence even though role, Enrollment, CareGroup, Grant, Thread
  lifecycle, policy, and redaction are already re-resolved by the owner path.
- What we tried: compared the locked C-2d-3 authority boundary with both Guardian
  and Caregiver command preconditions and the stored participant lookup.
- Fix / workaround: lock ThreadParticipant as optional routing/read/subscription/UI
  projection. Missing projection cannot deny current authority; stale, forged, or
  cross-scope projection cannot grant business authority. Exact Thread lifecycle remains required.
- Prevention: C-2e implementation must remove the stored membership hard gate and
  test no-row success, stale-row denial, forged-row denial, and exact-Thread failure.

### 2026-07-15 — Parent workspace discovery skipped the standalone web-workbench

- Symptom: all four Nurture PR execution jobs failed while building the pinned
  web-workbench with missing React modules and a missing local `node_modules`.
- Context: `templates/web-workbench` has its own package and lockfile but is
  intentionally absent from the My-Workflow-Base `pnpm-workspace.yaml`.
- Root cause: `pnpm --dir ... install` discovered the parent workspace, installed
  its five declared projects, and never installed the requested excluded package.
- What we tried: inspected the failed job log and reproduced both workspace
  discovery and standalone installation in a fresh temporary checkout.
- Fix / workaround: add `--ignore-workspace` to the Nurture preparation script
  and each CI bootstrap command so the template installs from its own lockfile.
- Prevention: clean-checkout validation must assert the requested package's
  dependencies and build output, not accept a successful parent install alone.
- References: `.github/workflows/ci.yml`, `package.json`, PR #3 run `29419715925`.

### 2026-07-15 — Checked-out My-Chat source lacked its build-time environment

- Symptom: after the standalone template fix, Nurture typecheck and frontend
  build reported missing My-Chat workspace aliases and `@prisma/client`.
- Context: the X5 joint acceptance test directly imports pinned My-Chat DB,
  workflow runtime, and worker source so TypeScript follows that source graph.
- Root cause: the CI jobs checked out My-Chat but did not install its workspace
  dependencies or generate its Prisma Client; the local adjacent repo already
  had both and masked the clean-job requirement.
- What we tried: reproduced all three repositories in a fresh temporary root,
  then ran My-Chat frozen install and Prisma generation before Nurture setup.
- Fix / workaround: prepare exact-revision My-Chat in the two jobs that compile
  cross-repository source; DB-only jobs remain unchanged and already pass.
- Prevention: every direct-source cross-repo test must declare checkout,
  dependency install, generated-code preparation, and typecheck as one gate.
- References: `.github/workflows/ci.yml`, `packages/nurture-db/tests/x5-joint-acceptance.integration.test.ts`, PR #3 run `29420192609`.

### 2026-07-15 — Leaking lifecycle classification to an unauthorized opener

- Symptom: the first owner-read ordering could return `source_redacted` or
  `grant_revoked` before proving that `actor_user_id` was a current recipient.
- Context: My-Chat deep links are authenticated, but a guessed Handoff ID must
  not reveal whether a private family item was redacted or its grant revoked.
- Root cause: business lifecycle checks were ordered before target
  authorization because the asynchronous delivery path has no actor.
- Fix / workaround: compute current recipients first and return generic target
  unavailable for a non-recipient; only an authorized actor may reach current
  redaction/revoke/policy classification. My-Chat renders all stopped results as
  one generic unavailable message.
- Prevention: reason-code reviews must treat classification as data exposure,
  not only the referenced content body.
- References: `packages/nurture-scenario/src/domain/institution/user-attention-activation.ts`.

### 2026-07-15 — Requiring exactly delivered broke legitimate later opens

- Symptom: the owner could create the notification while the receipt was
  `delivered`, but a later deep-link open failed after the same receipt became
  `read` or `acknowledged`.
- Context: the first delivery decision and a current actor open have different
  lifecycle predicates but share all grant/source/scope gates.
- Root cause: one receipt-status predicate was reused for both operations.
- Fix / workaround: owner delivery still requires exactly `delivered`; an
  authenticated current recipient open allows `delivered`, `read`, or
  `acknowledged` and reruns every other owner gate.
- Prevention: include post-delivery state transitions in current-open contract
  tests, not only delivery-time tests.
- References: `packages/nurture-scenario/src/domain/institution/user-attention-activation.ts`.

### 2026-07-15 — Letting the handler bridge become a second business authority

- Symptom: The first X4-C1 port draft included primary scope, target refs, expected versions, and ref provenance alongside a command payload, and the handler copied message/receipt/item identities into both the handoff and Step output.
- Context: My-Chat may prove the claimed Step and materialize drafts, but Nurture alone must resolve business identity, child scope, current target state, and authorization. Host Step output is evidence, not a second business projection.
- Root cause: The transport bridge was designed from the handler's immediate data needs instead of the repository ownership boundary, allowing technically convenient fields to become competing semantic inputs.
- Fix / workaround: Shrink the host bridge to transient driver creation and snapshot mapping. Let the scenario-owned source supply only stable request identities plus the current Nurture payload, derive scope inside Nurture, re-run command policy/preconditions, and return only an opaque CommandExecution ref from the Step.
- Prevention: Review each bridge field by authority: host claim evidence belongs to My-Chat; stable command intent and business payload belong to Nurture; current scope/policy comes from Nurture owner reads; message/receipt/item refs travel once as handoff context.
- References: `packages/nurture-scenario/src/deps.ts`, `packages/nurture-scenario/src/handlers/family-input-workflow.handler.ts`, `04-verification.md` X4-B/X4-C1 gate.

### 2026-07-15 — Treating absent optional database packs as product-test failures

- Symptom: The required public database suite failed after the X4 PostgreSQL path was fully green because Convex tests tried to copy an absent initializer blueprint and execute an absent `ctl-convex.mjs`.
- Context: The-Nurture is `repo-prisma`; its checked-in `.ai` assets do not include the optional initialization or Convex-as-SSOT packs, but the public suite enumerated every database smoke unconditionally.
- Root cause: Test preconditions were implicit, so a missing optional tool surfaced as an unhandled filesystem/module exception instead of a declared unavailable capability.
- Fix / workaround: Centralize optional script detection and return a named `SKIP` with the exact missing repo-relative assets. Continue running SQLite/repo-prisma checks and fail normally when an installed pack is broken.
- Prevention: Every public cross-feature smoke must distinguish unavailable optional packs from installed-but-failing packs; only the former may SKIP.
- References: `.ai/tests/suites/database/convex-fixture.mjs`, public database suite run `20260715-005737-a801ce`.

### 2026-07-15 — Persisting the transient host driver shape verbatim

- Symptom: Early X4-A code required `consumer_scenario_key=nurture` on the incoming driver even though the shared Base conformance fixture is owner-shaped and omits that field; the live My-Chat X3 helper also carried a transient Step version that must never be stored.
- Context: `ScenarioCommandDriverContext.driverRef` is claim-time host evidence, while `NurtureCommandExecution.handoffDriverRef` is scenario-owned replay provenance. They identify the same Step but have different persistence constraints.
- Root cause: Treating the transport shape and persisted shape as one DTO creates either Base incompatibility or a path for claim/version data to leak into Nurture.
- Fix / workaround: Accept the Base owner-shaped ref (optionally already bound to Nurture), reject version/unknown keys, and construct a new exact five-field persisted ref with the Nurture consumer. Keep token/version only in the transient driver context.
- Prevention: Test the real Base conformance fixture shape and assert both positive same-Step replay and negative secret/version persistence at unit, SQL-constraint, and DB-integration layers.
- References: `packages/nurture-scenario/src/domain/commands/handoff-replay.ts`, `04-verification.md` X4-A evidence.

### 2026-07-15 — Updating the My-Chat pin without refreshing the pnpm file snapshot

- Symptom: The exact revision/hash verifier passed at My-Chat X3, but Nurture typecheck and two unit suites failed because the installed workflow-runtime package exported three files that were absent from its stale local snapshot.
- Context: Nurture uses `file:../../../My-Chat/packages/workflow-runtime`; the lockfile directory key stayed valid while the adjacent package contents changed.
- What we tried: Ran the full static gate immediately after changing only the revision pin.
- Why it failed: Revision/hash verification reads the adjacent repository, while TypeScript and Vitest load pnpm's installed `file:` package snapshot. Those are separate freshness boundaries.
- Fix / workaround: Run `pnpm install --offline --frozen-lockfile --force` to rebuild the local snapshot without changing dependency resolution, then rerun typecheck and unit tests. Use a non-connecting placeholder `DEV_HOST_DATABASE_URL` for schema-only dev-host Prisma validation.
- Prevention: Every adopted My-Chat revision must pass both the exact pin verifier and an installed-package freshness gate before X4 code begins.
- References: `docs/project/integrations/my-chat-workflow-contract.json`, `04-verification.md` X4/N2 entry evidence.

### 2026-07-03 — Treating institution mode as ordinary family-mode extension

- Symptom: The discussion starts as "托育机构是否并入面向家长的产品", which can imply adding an institution role inside a family-owned workspace.
- Context: Institution workflows are one organization to many caregivers and children, closer to My-Chat's education-domain organization topology than to a single-family workspace.
- What we tried: Reframed as "same scenario, second tenancy mode" rather than a family-mode subfeature.
- Why it failed (or current hypothesis): A simple role addition would blur ownership and privacy boundaries.
- Fix / workaround: Model institution mode on `organization` workspace, with My-Chat-owned care canonical objects and The Nurture-owned projections/workflows.
- Superseded 2026-07-05: The ownership part of this workaround is superseded. Current rule: My-Chat owns account identity and scenario shell; Nurture owns the care ecology graph, including role assignments, child care process, enrollment, grant, family-care messages, and care items.
- Prevention: Start every institution-mode design review from `02-architecture.md` sections 1-4 and confirm ownership before fields or UI.
- References: `02-architecture.md`, `roadmap.md`, `docs/context/workflow/nurture-scenario-contract.md`.

### 2026-07-03 — Reducing institution ecology to a consent bridge

- Symptom: The design over-centers `ChildLinkGrant`, making the institution look like an authorization extension of family mode.
- Context: The institution is a real external environment in the child's growth process, with its own organization, teachers, group rhythms, workflows, and operational incentives.
- What we tried: Reframed `ChildLinkGrant` as the cross-ecology data-flow mechanism only.
- Why it failed (or current hypothesis): If the product does not help institutions and teachers directly, they have no reason to adopt it.
- Fix / workaround: Add an explicit institution/teacher value model before capabilities: record reduction, group care operations, parent need intake, handoff, and quality review.
- Prevention: Before designing a capability, state which institution/teacher pain it solves and how it helps the child.
- References: `02-architecture.md` section 5, `03-implementation-notes.md` D-004.

### 2026-07-04 — Treating face recognition as direct publication

- Symptom: "自动归类" could be misread as automatically publishing every recognized photo into family-visible child albums.
- Context: The intended flow is based on system-held child reference images such as attendance cards, not a general public face-recognition product. Class group photos are institution/class assets first.
- What we tried: Split media into original class asset, child album view, and family-visible view.
- Why it failed (or current hypothesis): Direct publication would amplify false positives and child privacy exposure.
- Fix / workaround: Use recognition only to create candidate child attribution; require teacher confirmation and policy checks before child/family views.
- Prevention: Every media attribution design must state asset owner, derived views, confirmation gate, and exposure policy.
- References: `02-architecture.md` section 5.2, `03-implementation-notes.md` D-005.

### 2026-07-05 — Over-correcting ownership into My-Chat

- Symptom: The architecture says My-Chat owns care canonical objects, `ChildLinkGrant`, family/child/institution identity, and Nurture only keeps projections.
- Context: My-Chat is the ecosystem frame and single account system. Each scenario currently maintains its own multi-user business relationships. In Nurture, parents, teachers, and institution managers are My-Chat users, but their Nurture roles and relationships are scenario-owned; children are not My-Chat users.
- What we tried: Treat My-Chat education-domain organization/class/student tables as the direct ownership template for Nurture care canonical.
- Why it failed (or current hypothesis): That pushes Nurture-specific family, child, institution, class, enrollment, consent, and care communication semantics into the generic account/shell layer.
- Fix / workaround: Define `NurtureChildCareProcess` as the center; store Nurture participants, role assignments, enrollment, `NurtureChildLinkGrant`, family-care threads/messages/items, and care facts as Nurture canonical data. My-Chat only owns account identity, shell/runtime, notification, and deep-link surfaces.
- Prevention: Before designing tables or handoffs, separate "who can log in" (`my_chat.user`) from "what role and relationship this user has in Nurture" (`NurtureParticipant` + role assignment).
- References: `02-architecture.md` sections 1-4, `03-implementation-notes.md` D-007 through D-010.

### 2026-07-05 — Modeling family_to_org as a generic note instead of teacher workload

- Symptom: `family_to_org` is framed as a small parent note or care constraint field, but does not solve the teacher's actual pain of switching across many child-specific family groups.
- Context: A class with 10 children creates 10 private family-care threads. Privacy requires those threads to remain separate for families, but teachers need one class-level work surface.
- What we tried: Model the minimum data classes as `care_constraint` and `care_day_note`.
- Why it failed (or current hypothesis): It captures data transfer but not operational load. Teachers still need to triage, confirm, reply, and follow up across many threads.
- Fix / workaround: Add `class_family_inbox` as the first family_to_org capability. Store raw messages as `NurtureFamilyCareMessage`, extract structured `NurtureFamilyCareItem`, and render a class-level inbox/attention board for teachers.
- Prevention: Every `family_to_org` design must state how it appears in the teacher's class workflow, not only what data class crosses the boundary.
- References: `02-architecture.md` section 4, `03-implementation-notes.md` D-009.

### 2026-07-13 — Advertising N1 capabilities before host resolver adoption

- Symptom: Adding institution context-ref types and capability handlers made `validateWorkflowModule` return 16 fatal `WF-MAN-030` findings because My-Chat had not registered those resolver keys.
- Context: N1 is an explicit-empty business-core increment; X4/N2 owns vNext manifest context sources and host activation wiring.
- Fix / workaround: Remove the premature manifest/handler declarations, keep N1-E as domain/repository/query code, and require the N1-F DB-backed owner-read journey before advertising direct capability surfaces.
- Prevention: Run the real My-Chat validator immediately after every manifest change and treat missing host resolver registration as a stage-order defect, not a test-fixture omission.
- References: `01-plan.md` N1/X4 ordering, `02-architecture.md` N1 implementation boundary, `04-verification.md` N1-E evidence.

### 2026-07-13 — Letting a replacement grant reactivate an old item

- Symptom: Item actions initially searched for any current grant matching child/enrollment/direction/data class; a new grant could therefore make an item bound to a revoked grant actionable again.
- Context: The locked revoke contract says a new relationship creates a new grant identity and is not reactivation of historical work.
- Fix / workaround: Query/presenter paths validate the item-linked grant itself. Action paths require that source grant to remain current before checking the requested action direction; revoke also performs bounded immediate Receipt/Item convergence.
- Prevention: Every grant-dependent aggregate must carry and revalidate its own `grantId`; never substitute a different current grant merely because its scope and data class match.
- References: `02-architecture.md` R8-B3-C2a-d, `08-iia-schema-policy-test-design.md` grant revoke matrix.

### 2026-07-14 — Pinning YAML while leaving the live registry outside the contract population

- Symptom: A full YAML/runtime comparison found the `parent` and `family` context-ref declarations in different orders even though the Nurture scenario source pin was green.
- Context: The source pin covered the YAML manifest and module, but the runtime validator consumes the TypeScript `nurtureScenarioManifest` from `registry.ts`.
- What we tried: Verified the new capability keys and routes independently; those checks could not prove complete object parity.
- Root cause: The live registry was outside the pinned source population, so semantically equivalent or divergent registry changes could escape the self-contract hash.
- Fix / workaround: Aligned the full parsed objects and added `packages/nurture-scenario/src/registry.ts` to `nurtureScenario.contractPaths`; recomputed and verified the four-file hash.
- Prevention: After any manifest edit, compare the full YAML and TypeScript objects and keep every runtime contract authority inside the pin population.
- References: `docs/project/integrations/my-chat-workflow-contract.json`, `packages/nurture-scenario/scenario.manifest.yaml`, `packages/nurture-scenario/src/registry.ts`.

### 2026-07-14 — Returning scenario enums as host-facing badge values

- Symptom: The first direct-surface presenter returned raw item category, urgency, status, and attention priority enums as badge labels, and could return owner-specific denial reason codes.
- Context: My-Chat must render generic UI and must not learn or branch on Nurture business lifecycle vocabulary.
- What we tried: Relied on the contract statement that host consumers must not branch on those fields.
- Root cause: A raw enum value still creates an avoidable coupling even when the host is instructed not to interpret it.
- Fix / workaround: Nurture maps current enum values to human-readable display labels before returning generic badges and collapses denial output to `access_changed` / `unavailable`; business authorization and transitions remain owner-side.
- Prevention: Presenter output should contain display semantics and opaque refs, not owner lifecycle codes that invite downstream branching.
- References: `packages/nurture-scenario/src/institution-surfaces.ts`, `02-architecture.md` N1-F direct surface boundary.

### 2026-07-14 — Issuing a clarification token from a workflow result that cannot return it

- Symptom: The first shared surface reader could create a clarification InteractionContext when a workflow handler encountered multiple care-group scopes, but `WorkflowStepHandlerResult` has no structured-interaction/token field.
- Context: Direct scenario responses can return the opaque token and interaction request; durable workflow Steps can only return refs, drafts, status, and a reason code.
- What we tried: Reused the same default resolver behavior for direct reads and workflow reads.
- Root cause: Resolver ambiguity handling was correct for realtime surfaces but incompatible with the narrower workflow result contract, leaving an unreachable continuation row.
- Fix / workaround: Added an explicit no-issuance resolver mode for workflow handlers. Ambiguous workflow scope becomes generic manual review without creating a token; direct internal handlers keep structured clarification.
- Prevention: A continuation token may be issued only when the current caller contract can deliver it to the user and accept the opaque response.
- References: `packages/nurture-scenario/src/domain/institution/institution-resolver.ts`, `packages/nurture-scenario/src/institution-surfaces.ts`, `packages/nurture-scenario/src/handlers/p0-handlers.ts`.

### 2026-07-15 — Nurture Version Zero Crossed a Positive-Version Host Contract

- Symptom: the first joint run committed the Nurture command but My-Chat sent
  Step completion to manual review before creating a Handoff.
- Root cause: Nurture aggregates start at version `0`; the shared optional
  context-ref version, when present, must be positive.
- Fix / workaround: preserve Nurture's internal version semantics, omit only an
  initial `0` at the shared Handoff boundary, and retain positive versions.
- Prevention: include every normalization seam in the scenario source pin and
  run a real cross-repository codec journey before activation promotion.
- References: `domain/commands/handoff-replay.ts` and the X5 joint suite.

### 2026-07-15 — Parallel DB Suites Contended on Shared Validation State

- Symptom: one production DB test failed only while My-Chat, production, and
  dev-host suites ran concurrently; isolated and three sequential runs passed.
- Root cause: the suites shared one PostgreSQL container and Prisma/Outbox test
  populations despite targeting separate logical gates.
- Fix / workaround: final database gates run sequentially, and My-Chat DB files
  serialize whenever the shared Outbox-backed integration routes are enabled.
- Prevention: parallelize unit/static work, but serialize stateful acceptance
  gates unless each queue and database population is fully isolated.
- References: X5 final gate in `04-verification.md`.

### 2026-07-15 — Generic PostgreSQL Image Could Not Apply Host Migrations

- Symptom: the first disposable `postgres:16-alpine` container failed at the
  unchanged My-Chat migration that creates the vector extension.
- Root cause: the image lacked the migration stream's pgvector prerequisite.
- Fix / workaround: recreate only the approved temporary container with
  `pgvector/pgvector:pg16`; no shared database or migration was changed.
- Prevention: inventory extension requirements before selecting a clean
  validation image.
- References: X5 final gate in `04-verification.md`.
