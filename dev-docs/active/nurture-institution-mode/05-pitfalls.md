# Pitfalls — Institution Mode

This file exists to prevent repeating mistakes within this task.

## Do-not-repeat summary

- Do not reduce institution ecology to an authorization feature; institution is the child's external growth environment.
- Do not treat institution ecology as an independent product shell; it remains inside the My-Chat scenario boundary.
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
- Do not treat an updated adjacent-repo revision pin as sufficient for a pnpm `file:` dependency; rebuild the local package snapshot and rerun typecheck/tests before accepting the pin.

## Pitfall log (append-only)

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
- Context: The institution is a real external environment in the child's growth process. It has its own organization, teachers, group rhythms, workflows, and operational incentives.
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
