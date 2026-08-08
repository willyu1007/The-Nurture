# Pitfalls — Institution Mode

This file exists to prevent repeating mistakes within this task.

## Do-not-repeat summary

- Do not reuse a cross-repository task ID as though task IDs were global; resolve
  the task independently in each repository before attaching a commit trailer.
- TypeScript assertion helpers called by exported assertion functions require an
  explicit assertion signature; inferred arrow-function assertions trigger TS2775.
- Under strict Ajv, every nested `properties`/string constraint introduced through
  `allOf` still needs its own explicit `type`; a referenced parent type is not a
  sufficient strictTypes annotation.
- A top-level `additionalProperties: false` closes only the union's combined field
  vocabulary. It does not stop another branch's optional field from occupying the
  current branch's optional slot when `minProperties`/`maxProperties` still pass.
  Give every discriminated branch an exact `propertyNames.enum` allowlist and a
  mixed-variant negative fixture.
- Under strict Ajv, a nested `not.pattern` constraint must also declare
  `type: string`; keep strict Schema compilation inside each implementation unit.
- A TypeScript safe-copy codec may reject exposure that its JSON Schema still
  accepts, especially case-insensitive URLs, single-line Markdown prefixes and
  internal provider/database terms. Portable exposure negatives must assert both
  layers; leave only non-portable semantic checks such as NFC normalization to the
  codec/owner contract and record that distinction explicitly.

- Do not implement a scenario-owner verifier without exact Workspace, acting User, Actor, and idempotency context, or return a receipt that is not Workspace-bound.
- Do not treat a Nurture care role, anchor, association, or platform stewardship as owner authorization; the injected Nurture authority reader remains default-deny until a separately reviewed owner source is wired.
- Do not let a service token stand in for the represented adult principal, or let
  principal/binding admission stand in for Nurture current business authority.
- Do not mint, infer, PII-match, auto-merge, or silently rebind a My-Chat Child/Family
  from Institution Admin, Caregiver, or Nurture context.
- Do not perform a remote My-Chat read inside the Nurture transaction or rely on an
  authority pre-read outside it; lock/CAS the exact Nurture authority source in the
  Receipt/effect transaction.
- Do not conflate the short-lived binding-owner Receipt with persistent business
  `CommandExecution`/`Receipt`; their identity, replay, TTL and retention differ.
- Do not claim final G1 Joint Conformance from the Fastify dev host. The same T-004
  fixtures must pass through the formal NestJS scenario-service ingress with exact
  env/port/auth boundaries.
- Do not let task status, CI links, or prose substitute for the three exact G1
  delivery roles and their append-only currentness/invalidation chain.
- Do not treat locking the binding anchor as fencing an independently mutable
  authority source; reread and lock/CAS that exact source in the receipt
  transaction.
- Do not collapse `reserved|bound_empty|associated` into a generic anchor `active` state; a generic state hides whether the Host binding or local association exists.
- Do not accept JavaScript's broad date parser as an ISO contract. Derived age/stage expiry must be canonical UTC, current, and paired with a non-future calendar `as_of_date`.
- Do not treat a version-shaped package dependency plus a local override as immutable by itself. The override is acceptable only when the checkout revision and every bounded source set are verified before install/use; release distribution remains a separate decision.
- Do not re-pin a source dependency without reconciling the consumer CI runtime and registry authentication. The current My-Chat pin requires Node 22 or newer, and GitHub Packages installation requires an authenticated read token.
- Do not prepare an exact X5 worktree with production Prisma generation only. The backend import graph also requires the generated dev-host client, so use `db:generate:all` before test collection.
- Do not rebuild a published UI package from a Base sibling template in each consumer CI job. Consume the exact registry version and keep Base source pins as conformance evidence, not runtime resolution.
- Do not close a direct sibling-source finding by changing only the import spelling. The package must export the required subpath, the consumer must use the exported subpath, and the exact transitive source population must be revision/content pinned.
- Do not treat an advisory consumer-boundary finding as fixed merely because a finding is recorded in a task bundle; closure requires the local Base artifact link and direct sibling-source import to be removed and the clean joint gates to pass.
- Do not reduce institution ecology to an authorization feature; institution is the child's external growth environment.
- Do not treat institution ecology as an independent product shell; institution ecology remains inside the My-Chat scenario boundary.
- Do not put My-Chat account/auth/session semantics inside The Nurture; they belong to My-Chat.
- Do not activate optional Host actor/workspace fields or let Nurture infer workspace from Participant history; subject-aware ingress requires one My-Chat-established adult principal and exact validated workspace.
- Do not treat a general Chat thread's personal-workspace storage partition as business context or silently promote daily Q&A into Nurture; business entry requires an explicit workspace transition and minimal confirmed intent carryover.
- Do not let one service token prove both workload and represented adult, map Host Actor to Nurture Participant, reuse nonce as command identity, or fall back to legacy metadata after vNext verification fails.
- Do not relabel the existing handoff contract hash as C-3 presentation adoption, split provider/presentation/renderer into independently activatable paths, or maintain a second handwritten pre-activation manifest.
- Do not use `Direct domain action` to mean both “not a legacy Run action” and “direct-empty effect driver.” Driver is a static action-contract property; caregiver reply and every non-empty-capable relationship action remain claimed-Step even when the current snapshot array is empty.
- Do not persist submit token, owner target/version, Nurture body/context, or claim evidence in a Workflow Step. Persist a content-free non-claimable Step, bind the Step immutably in Nurture, then expose only that original Step to claim/replay.
- Do not treat a synthetic protected ref, nullable Message body, encrypted flag, ordinary Chat turn, `PublicDraft`, local/browser cache, or AI provider policy as a complete protected-content boundary. Use the owner-encrypted aggregate, protected composer/read path, crypto-erasure, retention/restore fence, and exact cross-repo evidence together.
- Do not seed the protected composer from sent or unsent ordinary Chat text. Pilot opens an empty manual composer and keeps protected AI absent/off.
- Do not promise that private text mistakenly typed into ordinary Chat was never retained. The zero-copy guarantee begins at the protected composer; Chat remains under My-Chat policy and never auto-promotes content.
- Do not register `institution_board|institution_workbench` in a C-3 Nurture candidate. Use neutral Host renderer fixtures for generic conformance and leave real Institution routes/presenters to C-4.
- Do not add C-4 routes, handlers, models, or migrations directly to an artifact claimed to be the immutable C-3 component. Compose a separately identified Institution extension and migration ledger over the exact content-addressed C-3 input.
- Do not let C-4 evidence depend on Pilot-0-E or reuse C-3 evidence authority. Use a separate pre-E C-4 candidate kind, evidence authorization, qualification chain, and final false/empty teardown.
- Do not borrow Pilot-0-D provisioning authority to run pre-D C-4 JI1. Use the isolated single-use bootstrap-evidence authorization against the real handler in a disposable synthetic Workspace; D still owns real Pilot provisioning.
- Do not admit a complete-Pilot row from current C-3 plus E alone. Independently resolve current C-3 qualification, current C-4 qualification, E decision, and exact Pilot-1 deployment every time.
- Do not require a live Pilot-1 deployment before Pilot-0-E or hash E/evidence/deployment back into the candidate. E reviews an immutable undeployed artifact/topology/config/operations candidate; Pilot-1 later binds exact live resources and secrets.
- Do not defer static behavior-affecting configuration until Pilot-1 or hash the current environment capability/activation row into the candidate. The candidate freezes ordinary behavior values plus gate schema/default/policy; governed gate values remain live authority state.
- Do not let an informal test report satisfy E. Only a separately authorized disposable D evidence environment may produce the signed/current `pilot0_d_predeployment_evidence_seal_v1`; the environment must finish false/empty, revoke credentials, prove zero external traffic, and be destroyed.
- Do not reuse `c4_bootstrap_evidence_*`, ambient Workspace admin, Institution Admin, or Technical Operator to create the real Pilot Institution. Use the isolated real-Pilot provisioning spec/controller plus exact invitation acceptance, one-effect claim/status recovery, permanent close, and no replacement while outcome is unknown.
- Do not make a remote My-Chat gate read from inside a Nurture transaction or claim cross-database disable/commit total ordering. Host admission rereads current authorities before the owner attempt; Nurture first verifies the fresh signed private invocation/nonce and then the persisted bounded admission locally, and an already admitted in-flight attempt may commit at most once.
- Do not model an infrastructure hard stop as choosing one of ingress, private route, workers, send/open, or capability. When the application gate store is unavailable, close all ordinary effect-producing seams together and retain only the separately trusted frozen-recovery lane.
- Do not treat a stage prerequisite, daily observation record, or terminal review as an unsigned document. Each uses its named schema, isolated signer/store/current resolver, exact candidate/deployment/stage heads, and append-only invalidation semantics.
- Do not interpret one absent bootstrap lookup as `confirmed_no_effect`. The recovery lane must wait for all attempts/deadlines, acquire the C-0 writer fence, and prove exact Execution/effect absence; timeout, outage, possible in-flight work, or ambiguity remains `unknown`.
- Do not open ordinary product routes merely because the first Pilot activation row is current or Nurture C-0 committed. The row stays bootstrap-only through response loss and every same-operation recovery state; exact Host `owner_committed + spec consumed + quarantine clear` alone derives `ordinary_ready`.
- Do not make Pilot-2 readiness reject the same bootstrap operation's bounded `prepared -> claimed -> prepared` recovery loop. Keep that exact lineage verifiable while bootstrap-only; `closed_no_effect`, another operation/spec, or budget/identity drift invalidates the stage.
- Do not restore an old activation row as current, clear restored rows with SQL, or call RDS availability an RTO PASS. Restored rows deny through environment/deployment mismatch and converge to `[]` through the owner command before privacy-ledger, KMS/trust, integrity, quarantine, route-closed, and restore-seal completion.
- Do not equate Grant revoke with crypto erasure. Revoke removes cross-role authority; only redaction, source deletion, retention deletion, or explicit erase policy produces a privacy-ledger tombstone that suppresses the protected body on restore.
- Do not run disabled-cohort/kill-switch or restore tests inside the Pilot-4 PASS clock. Seal them in Pilot-3, create a no-reset owner-path baseline and fresh row, then run exactly seven planned question paths across one uninterrupted 120-hour window.
- Do not restore or extend Pilot-3's activation row after a kill-switch rehearsal. Pilot-4 requires a new signed stage authorization and a new exact row; Technical Operator remains disable-only.
- Do not equate a revoked, expired, aborted, or partially executed Pilot-3 plan with successful consumption. Only the complete ordered matrix, false/empty kill-switch census, recovery closure, and final allowlisted binding transition may append `consumed_success`; every other terminal outcome blocks Pilot-4.
- Do not make the legitimate Pilot-3 gate-close, row-removal, final binding, plan-consume, or stage-consume successors look like arbitrary bound-head drift. Resolve only the exact ordered terminal lineage; historical consumed heads verify but never execute.
- Do not gate E with a count or the phrases “critical TR-P1” or “explicitly accepted.” Use the stable `pilot0_traffic_readiness_census_v1` ids and permit `accepted_scope_exclusion` only for `TR-P1-3a-native-external-delivery`.
- Do not treat an admitted extra Pilot-4 question as harmless overflow. Any unplanned admitted Nurture question/business effect makes the window `no_pass`; only a denial before owner admission with zero effect may remain a negative probe.
- Do not interpret “zero external traffic” as zero network packets or no public My-Chat ingress. Derive `externalProductTrafficCount=0` from trusted source session/account/service boundaries: an external authenticated account counts even if Host denies before owner call, while an allowlisted internal injected-target probe stays internal only when denied with zero owner effect. Audit every narrowly excluded edge/control/service event.
- Do not omit `pilot4_terminal_stop_evidence_v1` from the evidence-only sealing grace. Every non-PASS window needs exactly one stop/boundary record, including failed full-segment and zero-length Tend cases, while the grace remains incapable of product effects.
- Do not treat two technical gates as two-person approval or let an unavailable activation store defeat shutdown. Environment capability and the exact Workspace row each deny independently, with an infrastructure hard-stop for control-plane outage.
- Do not reuse the Nurture dev host, empty Kubernetes scaffold, staging BWS/static service token, tag-based old ACR images, or one shared DB/credential as complete-Pilot topology.
- Do not use “five days” as five partial workdays or preserve a clock across gate shutdown, restore, candidate/config/trust change, or evidence gap. Pilot-4 is one fresh-row uninterrupted 120-hour window.
- Do not call legacy class-inbox/teacher-attention APIs an Institution board/workbench. C-4 requires exact Institution Admin reachability, repository-predicate-first reads, two real product surfaces, and no Institution Chat.
- Do not model staff onboarding as one Admin role write or use Workflow Step/Handoff as invitation identity transport. Host owns a non-deliverable contact shell and acceptance; Nurture owns a replayable intent, Participant binding, later Caregiver role, and later exact Lead designation.
- Do not treat Host `already_member` as staff-invitation acceptance or reuse a consumed Staff Invitation after role revoke. Existing members reauthenticate and explicitly acknowledge the new purpose; one unique source intent creates one role identity forever.
- Do not let `lead_caregiver`, Group JSON, first-staff order, or Host role independently grant teacher access. Lead is a separate exact-group RoleAssignment bound to the exact current operational Caregiver role episode.
- Do not add `withdrawn|ended|transferred` as a second Roster status enum. Roster stays `active|linked|closed`; terminal relationship class is a typed `terminalReason`.
- Do not assume a reusable terminal DTO implies that C-3 already validates `closed + no reply + resolved Attention`. C-4 owns the exact extension graph/adapter, later privacy convergence, and create/send fences separately from open.
- Do not make group pause cascade or group close silently clean dependents. Pause is a reversible current fence; terminal archive requires a locked zero-dependent census and explicit owner lifecycle closure first.
- Do not let disabled execution-status recovery reuse ordinary API/worker ingress or an expired principal as authority. Use the dedicated recovery caller/endpoint/frozen provenance and prohibit every business/read/delivery side effect.
- Do not return protocol `unknown` for an unauthenticated, malformed, replayed, or frozen-binding-mismatched recovery request. Deny generically before status/fence/application work and keep the Host row quarantined.
- Do not treat a qualification envelope, CI result, cached status, or Technical Operator action as current qualification. Only the signed append-only qualification chain resolved fail-closed by its authoritative resolver may qualify a candidate.
- Do not make disposable C-3 evidence depend on the qualification result being produced, or make I10 depend on its own exit. Use candidate-kind-specific authority and pre-seal -> controller-signed envelope/event -> resolver exit.
- Do not use legacy `business_actor_ref`, ThreadParticipant, Institution Admin, or Lead designation as activated C-3 business authority. Require the typed Participant actor and exact operational RoleAssignment/claim/Grant predicates.
- Do not implement the C30 shared baseline again in C31. C31 and every later node consume immutable predecessor evidence through the strict C30 -> C31 -> C32 -> C33 -> C34 -> C35 DAG.
- Do not let legacy R7 return `replied|followed_up|waiting_for_family` as current family-care work. Pilot current is only `open|acknowledged`; terminal work is recent/history and has no continuation action.
- Do not translate candidate `materialization_status=skipped` into provider `delivery_status=skipped`, or vice versa; identical literals belong to independent state machines.
- Do not collapse Guardian communication progress, Item suppression, and question/reply body visibility into one status; project the independent axes from a complete Item-root fact graph.
- Do not turn class inbox, TeacherAttention, legacy internal APIs, or Caregiver Chat cards into separate Caregiver work/action roots; one exact FamilyCare Item graph owns the lifecycle and Attention is only its queue projection.
- Do not let another or newly issued Caregiver RoleAssignment reply after an exact claimant acknowledges an Item; Pilot has no reassignment/handoff, and temporary versus terminal claimant loss must not be converted into takeover or silent suppression.
- Do not infer a `user_attention` producer or historical recipient cohort from direction/current membership alone; validate the Host-derived action origin and the typed commit-time RoleAssignment cohort before every current delivery plan.
- Do not alias historical `capture_family_input`, `internal_api`, a hand-filtered registry, or a mutable local dependency into the C-3 Guardian action path. Keep the canonical manifest generated/parity-checked and require C-3-5 default-off qualification before any separately authorized Pilot-2 activation.
- Do not call a persistent gate schema, disposable true/one-Workspace exercise, or qualified C-3 component “activated” or “Pilot ready.” C-3-5 must end environment activation bundle false and active Workspace rows empty.
- Do not merge evidence from different commits, builds, schemas, KMS/signing revisions, registries, or test configurations into one candidate; every evidence row binds one immutable component-candidate id.
- Do not let J1-J4 communication journeys stand in for C-3-2 Guardian relationship/authority evidence or C-4 Institution product evidence; those are separate mandatory strands.
- Do not abandon a committed Nurture Execution when the kill switch races Step completion; the original Step must close only body-free technical work without re-executing business or sending after disablement.
- Do not put Nurture care ecology semantics inside My-Chat as canonical facts. My-Chat owns protected platform Child/Family identity, stewardship/membership, and scenario bindings; Nurture owns workspace-local Child/Process/child-scoped Family, Institution, CareGroup, RoleAssignment, Enrollment, Grant, family-care messages/items, and every care policy/fact.
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
- Do not model Enrollment pause as one unowned boolean/status that either family or institution can clear. Preserve independently attributable restrictions, deny cross-side release, and reserve permanent cascade for terminal Enrollment transitions.
- Do not transfer an Enrollment by editing `careGroupId` or carrying its Grant, Thread, or content authority. Terminate the old identity and create a new separately authorized Enrollment.
- Do not add `pause_institution_enrollment` beside the locked `suspend_enrollment` key or interpret `resume_enrollment` as global recovery. Reuse the Institution keys, release only that side's hold, and recompute current aggregate state.
- Do not silently merge two side actions prepared from the same Enrollment version. The first commits; every stale confirmation refreshes and reviews the changed consequences before another hold transition.
- Do not implement transfer through `careGroupId` mutation, initial `initiate_enrollment`, terminal `close_enrollment`, Enrollment Invitation reuse, or a direct Institution-only command. Use one family-confirmed TransferIntent and a new Enrollment identity.
- Do not create the target RosterEntry before transfer confirmation or copy old Grant/Thread/content/work into the target Group. Target roster/new Enrollment and complete old closure commit together.
- Do not make permanent Enrollment withdrawal depend on Grant ownership, invitation receipt, first/primary Guardian status, or unanimous Guardians. Any current exact-Family Guardian has equal independent family-side terminal authority after strong confirmation.
- Do not model terminal exit as resume, cross-side release, a generic `end_enrollment`, or a client-authored reason. Keep family withdrawal, Institution service end, and transfer status/reason semantics distinct, and close remaining holds only as system consequences.
- Do not lock TransferIntent before Enrollment or let different topology commands invent different root orders. Enrollment is the common serialized root before Hold, TransferIntent, roster, Grant, Thread, and dependents.
- Do not record a Guardian or Institution terminal actor as `revokedByParticipantId` on a Grant they do not own. Topology invalidation uses a server cause, null revoke actor, and Enrollment Execution/CascadeAudit evidence.
- Do not commit terminal Enrollment status before closing every hold, intent, active Grant/dependent, Thread, and roster projection. Preflight the aggregate cap, assert zero survivors, and roll back the entire transaction on any defect.
- Do not reactivate a terminal Enrollment or reuse its roster, invitation, Grant, Thread, context, or work for re-entry. Reuse only the longitudinal Child/Process/Family/current Guardian identities and create a new care episode.
- Do not add separate transfer and re-entry lineage fields. Use one unique `predecessorEnrollmentId + continuityKind` pair and remove the unimplemented `supersedesEnrollmentId` proposal before schema work.
- Do not let a generic first-enrollment invitation bypass a known same-Institution terminal predecessor. Re-entry requires an exact terminal-leaf/version binding and exact current-Guardian confirmation.
- Do not merge old and new Enrollment histories or let a new Grant/Thread restore old cross-role bodies. Render separate episodes and apply original authorship/Grant/redaction/retention/policy on every old read.
- Do not model entry to another Institution as Enrollment transfer or extend `predecessorEnrollmentId` across Institutions. Use independent fresh onboarding against the family-selected ChildCareProcess, preserve concurrent Institution relationships, and carry no authority or content.
- Do not let stage change mutate Enrollment or let age, birthday, Institution data, or AI inference silently rewrite `currentStageKey`. Use the locked Guardian-owned C-2f-4-1 StageEpisode authority/history path.
- Do not treat `currentStageKey`, pregnancy-stage output, profile snapshot, age band, or roster attribute as the canonical stage ledger. Only a current versioned StageEpisode created by an exact Guardian command is authoritative.
- Do not overwrite, backdate, branch, or delete stage history to represent change or correction. Close the current leaf with fixed evidence, create at most one successor, or explicitly clear the current state.
- Do not infer or merge a child across workspaces from the same adult account, name, birth fact, contact, media, roster, or client/raw id. Exact current typed My-Chat Child/Family binding reuse is allowed; automatic local-association reuse, dossier discovery, data movement, and authority carryover remain Pilot `NO-GO`.
- Do not treat future scenario-data portability as identity migration. Any later protocol operates only after exact platform identity and target-local authorization are current, and moves only explicitly consented scenario data without roles, Enrollment, Grant, or authority.
- Do not search, suggest, overwrite, auto-attach, or merge a target dossier through source values or anchor enumeration. Existing target association resolution uses the exact typed binding/workspace compound path; conflicting anchors quarantine and Technical Operator never edits identity.
- Do not place scenario-data portability bodies, anchors, or Nurture authority claims in Workflow Step, Handoff, Outbox, Notification, provider payload, logs, or Admin controls. My-Chat may own platform identity and refs-only orchestration without owning Nurture dossier content.
- Do not promise that source revoke/redaction/deletion recalls a future separately consented scenario-data commit. Before commit all gates fail closed; after commit any transferred target-local fact follows the future target policy without reviving source authority.
- Do not collapse persisted business outcome, replay disposition, and current presenter result. A replay or already-satisfied caller cannot claim it performed, owned, approved, or jointly consented to the original effect.
- Do not treat CommandExecution `outputRefs` as client navigation, presentation authority, analytics dimensions, notification data, or Handoff content. They remain exact server-side recovery evidence and there is no `open_result` token.
- Do not widen or reinterpret existing `user_attention` for Enrollment lifecycle. A future Guardian relationship-attention contract is additive, separately versioned, capability-gated, and limited to transfer review and irreversible relationship termination.
- Do not create completion spam for pause/resume, transfer cancel/decline/confirm, re-entry confirmation, stage changes, or portability. Existing proposal/invitation/current presenters cover those paths without another lifecycle Handoff.
- Do not resolve relationship-notification recipients at delivery time. Snapshot exact current Guardian RoleAssignments at business commit, exclude the withdrawal actor, never backfill later-added Guardians, and stop lost-role recipients through current owner reread.
- Do not compensate, delete, reopen, or rewrite a committed Nurture fact because presenter, Step, Handoff, Outbox, provider, or notification delivery failed. Recover the original Execution/Step and keep technical delivery independent.
- Do not equate an authenticated My-Chat account with the scenario subject. An adult actor must reach a child/learner subject through the current scenario-owned relationship graph.
- Do not turn My-Chat's canonical platform Child/Family identity into a second Nurture subject or relationship-authority table. Host subject entries and bindings provide protected identity/routing context only; Nurture's workspace-local Process/roles/associations remain the care subject and authorization graph.
- Do not hardcode `NurtureChildCareProcess` into reusable Base/My-Chat contracts. Product copy can be child-centered while shared technical contracts use generic `subject`.
- Do not let a `subject_collection` grant bulk write, shared Grant/consent, outside-scope discovery, or membership-cache authority. Every member action resolves one exact current owner path.
- Do not reuse `DomainContextRef`, raw Subject identity, collection members/counts, or stable context-version correlation for subject discovery. Use the short-lived opaque subject locator, keep collection as one context, and resolve again at every surface/action seam.
- Do not reuse Run-level raw-target action availability, broad mobile interaction params/extensions, renderer primitives, or id-shaped pseudo-opaque refs as semantic presentation. Nurture emits bounded owner text/blocks/offers; My-Chat renders without interpreting codes or inventing controls.
- Do not treat a prospective invitation, roster prefill, same adult, name, birth fact, contact, or old cache as an established Account–Subject relationship.
- Do not build Institution presenters by loading every Enrollment for a ChildCareProcess and filtering afterward. Begin with current Institution/CareGroup authority and enforce the scope in repository predicates.
- Do not expose a stable Child/Process id, count, conflict reason, route token, stage, or empty/error distinction that lets one Institution infer another Institution relationship.
- Do not merge family longitudinal summaries into a shared cross-Institution Thread, Grant, content projection, or lifecycle. Aggregate safe navigation only and owner-reread every episode independently.
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

### 2026-07-18 — Subject-centric UX could create a second identity and authorization graph

- Symptom: narrowing My-Chat to education/nurture could lead to a Host-global
  Child table, account-equals-child assumptions, cached account-subject
  membership, automatic same-child matching across workspaces/scenarios, or a
  collection selector that silently grants batch authority.
- Context: Pilot-0-C3-0a Account–Subject reachability convergence.
- Root cause: product subject, authenticated actor, scenario-owned relationship,
  discovery projection, operational target, and canonical identity were treated
  as one platform object because the existing account-to-scenario mapping alone
  did not explain subject access.
- What we tried: traced Guardian, Caregiver, Institution Admin, prospective
  invitation, and Technical Operator paths; zero/one/multiple subjects; one
  Family with two Guardians; one CareGroup with three child scopes; stale role,
  Enrollment, Family, Process, and policy; Host aggregation; and cross-workspace
  or cross-scenario same-child claims.
- Fix / workaround: require every activated education/nurture business scenario
  to resolve a current account-to-subject path through its owner graph; use
  generic `unresolved|single_subject|subject_collection`; keep Host entries
  opaque and non-authoritative; expose prospective context minimally; and
  preserve explicit identity/link/portability protocols for any future
  cross-boundary relationship.
- Prevention: catalog classification, contract non-leakage, actor-path,
  scope-kind, prospective, live-provider, stale-reread, raw-injection,
  collection-non-authority, cross-boundary isolation, and planning-only tests
  must pass before subject-aware IIB implementation.

### 2026-07-18 — Lifecycle delivery could become a second business authority

- Symptom: a convenient result/deep-link design could expose raw output refs,
  claim that a retrying Guardian performed an earlier action, reuse
  `user_attention` for unrelated Enrollment events, notify every state change,
  select recipients at delivery time, or compensate the Nurture transaction
  after a provider failure.
- Context: Pilot-0-C2f-5 result, recovery, presenter, and Handoff convergence.
- Root cause: immutable business outcome, invocation replay, current user
  presentation, technical delivery, and relationship attention were treated as
  one success result despite having different owners, clocks, and failure
  semantics.
- What we tried: traced first commit, already-satisfied duplicate, response loss,
  same-Step reclaim, wrong-Step replay, lost command id, owner loss after commit,
  every lifecycle event, zero/one/two Guardian recipient sets, recipient role
  changes, provider failure, stale notification, and existing family-care
  `user_attention` compatibility.
- Fix / workaround: separate `businessOutcome`, response `disposition`, and
  current presenter result; keep exact output refs server-side; recover only the
  original Execution/Step; pin legacy `user_attention`; reserve a separately
  versioned relationship-attention contract for transfer review and irreversible
  relationship termination; snapshot exact RoleAssignment recipients; use
  generic refs-only delivery plus owner reread; and never compensate committed
  business facts for technical delivery failure.
- Prevention: vocabulary/codec/privacy/presenter/route, replay/fault,
  legacy-contract pin, Host-effect matrix, recipient snapshot/expiry,
  original-Step provenance, notification-open ordering, and planning-boundary
  tests must pass before C-2f-5 implementation or activation.

### 2026-07-18 — Portability could become global identity or remote-control infrastructure

- Symptom: a convenient export/import flow could infer one global child from the
  same adult or birth facts, merge an existing target profile, move roles and
  Institution history, put profile bodies in Host Handoff, or promise that a
  later source revoke deletes independently committed target facts.
- Context: Pilot-0-C2f-4-3 future cross-workspace protocol-boundary
  convergence.
- Root cause: data copying, identity proof, authority transfer, target
  reconciliation, transport delivery, and post-import lifecycle were described
  as one portability operation despite having different owners and irreversible
  privacy consequences.
- What we tried: traced same versus different adult, source issue/revoke,
  target reauthentication, new versus existing profile, field-level export,
  stage and protected-history exclusion, expiry, token forwarding,
  revoke/consume races, response loss, and source deletion before and after
  target commit.
- Fix / workaround (historical, superseded by the 2026-07-20 identity repair):
  keep Pilot scenario-data portability disabled. The former fresh-identity and
  `displayName|birthDate` copy protocol is withdrawn. A future protocol may
  move only separately consented scenario data after current platform identity
  reuse and independently authorized target-local association; it never moves
  authority, performs PII matching, or uses Host delivery as commit authority.
- Prevention: absence, actor, allowlist, forbidden-payload, fresh-target,
  no-match, lifecycle/token, owner-reread, revoke/race, replay/fault,
  post-import independence, Host/Nurture ownership, privacy-noninterference,
  and planning-boundary tests must pass before any portability implementation.

### 2026-07-18 — Family aggregation could become an Institution discovery channel

- Symptom: a useful Guardian timeline could be reused as an Institution query,
  expose a stable process id or other-Institution conflict/count, copy stage into
  roster, or merge separately authorized content and lifecycle.
- Context: Pilot-0-C2f-4-2 same-workspace multi-Institution visibility and
  concurrency convergence.
- Root cause: one longitudinal ChildCareProcess legitimately anchors family
  history, but that storage relation is not an Institution authorization or
  presentation boundary.
- What we tried: traced Guardian aggregation, Institution Admin and Caregiver
  list/detail/history, roster before Grant, current stage, protected content,
  raw ids/routes/errors, concurrent onboarding/lifecycle/stage changes, cached
  reads, and partial owner-read failure.
- Fix / workaround: allow only current-Guardian safe aggregation; require exact
  Institution/CareGroup repository predicates for organization reads; withhold
  stage and all other-Institution signals; preserve per-Enrollment authority;
  and degrade stale segments without cached substitution.
- Prevention: actor/scope query-shape, output allowlist, id/error noninterference,
  stage/no-dataClass, per-Institution uniqueness/concurrency, exact dependency,
  segmented stale-read, no-shared-projection, and planning-boundary tests must
  pass before multi-Institution implementation.

### 2026-07-18 — A mutable stage projection could erase longitudinal history

- Symptom: `currentStageKey` or a derived pregnancy/age/roster value could be
  updated in place, silently appear Guardian-confirmed, lose correction history,
  or indirectly change Enrollment behavior.
- Context: Pilot-0-C2f-4-1 stage fact, authority, and lifecycle convergence.
- Root cause: the existing optional string was a useful projection but had no
  versioned taxonomy, owner proof, lineage, transition audit, or concurrency
  contract.
- What we tried: traced initial unset/set, normal change, current correction,
  explicit clear, set-after-clear, equal Guardians, replay, stale races, legacy
  values, pregnancy guidance, downstream artifacts, and Institution reads.
- Fix / workaround: make a linear versioned StageEpisode the only stage SSOT,
  bind every write to an exact current Guardian and strong-confirmation context,
  update the coarse projection atomically, preserve fixed terminal evidence, and
  quarantine unproven legacy or mismatched projections.
- Prevention: schema/lineage/catalog, actor/surface/action, confirmation,
  transition/correction/clear, replay/race, projection/preflight, no-inference,
  no-Enrollment-side-effect, and planning-boundary tests must pass before stage
  implementation.

### 2026-07-18 — Portability could collapse stage, Institution, and workspace boundaries

- Symptom: a next-stage or new-Institution journey could be implemented as one
  Enrollment transfer, widen Enrollment lineage across Institutions, auto-end a
  concurrent relationship, or infer the same child in another workspace.
- Context: Pilot-0-C2f-4-0 portability boundary and classification convergence.
- Root cause: longitudinal child facts, stage phase, Institution relationship,
  and tenant identity were described together as "movement" despite having
  different owners, privacy reach, consent, and transaction boundaries.
- What we tried: classified same-Institution transfer/re-entry, independent
  different-Institution onboarding, stage-only change, combined stage plus new
  Institution, concurrent Enrollments, and cross-workspace identity reuse.
- Fix / workaround: keep ChildCareProcess as the same-workspace longitudinal
  spine, stage as a family-owned phase, Enrollment as Institution-local, and
  workspace as the hard identity boundary; compose separate effects rather than
  create cross-Institution lineage or a distributed move.
- Prevention: classification, concurrency, no-carryover, no-auto-exit,
  stage/Enrollment independence, cross-workspace denial, no-global-match, and
  planning-boundary tests must pass before portability implementation.

### 2026-07-18 — Re-entry could reactivate old authority or split lineage

- Symptom: returning to the same Institution could reuse a terminal Enrollment,
  old invitation/roster/Thread, or introduce `reenteredFromEnrollmentId` beside
  the planned transfer-only `supersedesEnrollmentId`, creating two successor
  sources and making old protected work appear current again.
- Context: Pilot-0-C2f-3c fresh re-entry and retained-history convergence.
- Root cause: longitudinal child identity, care-episode identity, Enrollment
  lineage, onboarding consent, and historical-body authorization were not yet
  separated after permanent closure.
- What we tried: traced family withdrawal and Institution end back through the
  existing roster/invitation confirmation flow, same/different target Groups,
  transfer lineage, dual Guardians, legacy ambiguity, old/new Threads, side-local
  history, stale notifications, replay, and concurrent successor creation.
- Fix / workaround: reuse existing initiate/confirm actions but require fresh
  relationship identities, exact terminal-leaf/current-Guardian resolution, one
  generalized predecessor/continuity pair, atomic new-episode confirmation, and
  separate history views with no old cross-role authority revival.
- Prevention: identity, lineage, invitation, owner-resolution, transaction/fault,
  successor-race, history-allowlist, original-Grant, stale-open, no-alias, and
  planning-boundary tests must pass before re-entry implementation.

### 2026-07-18 — Terminal exit could deadlock or leave live old work

- Symptom: transfer prose locked TransferIntent before Enrollment while pause used
  Enrollment first; a terminal status write could then deadlock against transfer or
  commit before old Grant work, holds, retries, and projections were fully closed.
- Context: Pilot-0-C2f-3b permanent Enrollment terminal closure convergence.
- Root cause: topology commands lacked one global root order, and Enrollment actor
  audit was conflated with Grant-owner revoke fields and eventual projection repair.
- What we tried: traced pause/transfer/end/withdraw and every dependent writer,
  multi-Grant expiry, context discovery, pending intents, cascade hard-cap behavior,
  response loss, duplicate/different causes, stale delivery, and failure injection.
- Fix / workaround: make Enrollment the shared topology root, preflight all closure
  work, use server topology Grant causes with null revoke actor, and commit terminal
  facts, holds, intents, Grants/dependents, Thread/roster, audit, and zero-survivor
  assertions in one Serializable transaction.
- Prevention: lock-order conformance, aggregate cardinality, fault-at-every-stage,
  replay/race, actor-field, expiry, survivor, stale-open, and no-remote-call tests
  must reject lock inversion, prefix commit, actor impersonation, and async repair.

### 2026-07-18 — Permanent exit could create hidden Guardian hierarchy

- Symptom: family withdrawal could be limited to the Grant owner, invitation
  recipient, earliest Guardian, invented primary Guardian, or all-Guardian vote;
  a paused Enrollment could also become impossible to close without peer release.
- Context: Pilot-0-C2f-3a permanent Enrollment action/authority convergence.
- Root cause: Grant administration, enrollment onboarding, reversible side holds,
  and permanent family relationship authority were treated as one owner concept.
- What we tried: compared the accepted equal-Guardian model, two-Guardian Pilot
  family, Institution-owned service end, strong confirmation, pause semantics,
  terminal status vocabulary, stale notifications, and fresh re-entry boundary.
- Fix / workaround: any current exact-Family Guardian may independently execute
  the dedicated withdrawal command; an exact Institution Admin independently uses
  terminal close. Fixed server status/reasons distinguish both from transfer, and
  terminal closure closes holds without pretending either side released them.
- Prevention: action/surface, actor hierarchy, strong-confirmation, status/reason,
  active/paused, two-Guardian race, alias, client-injection, and no-countersign
  tests must pass before terminal commands are implemented.

### 2026-07-18 — Operational class move could silently transfer data authority

- Symptom: an Institution-only `careGroupId` edit or reused enrollment command
  would expose safe roster state to a new caregiver scope without family review,
  while old Grant, Thread, Item, or delivery work could remain live or be copied.
- Context: Pilot-0-C2f-2 same-Institution CareGroup transfer convergence.
- Root cause: institution roster management, family-confirmed relationship scope,
  Enrollment identity, authorization closure, and historical content retention were
  treated as one mutable class-assignment field.
- What we tried: traced initial invitation/roster semantics, dual Guardian rights,
  pause holds, target readiness, Enrollment uniqueness/lineage, C-2e hard-cap
  cascade, Thread timing, old caregiver reach, response loss, and transfer races.
- Fix / workaround: use an Institution-proposed/family-confirmed TransferIntent,
  require zero holds, create target roster at confirmation, end old/create new
  Enrollment at one database time, and close old authorization without copying it.
- Prevention: action-map, intent, target readiness, lineage, transaction/fault,
  cascade overflow, persistence-privacy, stale-open, and no-carryover tests must
  reject every direct, partial, early-target, mirrored, or Host-owned transfer.

### 2026-07-18 — Resume naming could bypass the other side's hold

- Symptom: the already locked Institution `resume_enrollment` name could be read as
  setting the whole Enrollment active, while a family hold remained authoritative;
  adding a new institution pause alias would also create two command paths.
- Context: Pilot-0-C2f-1 Enrollment pause/resume convergence.
- Root cause: surface action naming, side-local restriction ownership, aggregate
  status, and concurrent confirmation semantics had not been resolved together.
- What we tried: compared personal versus side-owned holds, existing B3 action
  keys, dual-Guardian equality, actor-role loss, upper-scope pauses, Grant clocks,
  stale contexts, and two-side races.
- Fix / workaround: retain the existing Institution keys, add distinct family
  keys, define every resume as same-side release, keep holds authoritative and
  status aggregate, and force stale cross-side actions to refresh/reconfirm.
- Prevention: action-map, surface, transaction, concurrency, and presenter tests
  must prove no alias, global-resume promise, personal veto, silent merge, cascade,
  clock extension, or other-side release.

### 2026-07-18 — One shared paused flag could erase the other side's restriction

- Symptom: if Guardian and Institution Admin both write the same Enrollment status,
  either side could resume service and reopen cross-role access while the other
  side's safety or service restriction was still intended to remain active.
- Context: Pilot-0-C2f-0 Enrollment lifecycle and actor-boundary convergence.
- Root cause: the aggregate display state, the actor who imposed a restriction,
  the authority to release it, and permanent lifecycle closure were conflated.
- What we tried: separated family and institution authority, current versus
  terminal states, same-Institution transfer, and cross-Institution/workspace
  continuity before choosing command or persistence mechanics.
- Fix / workaround: treat pause as reversible current denial with independently
  attributable family/institution restrictions; neither side clears the other's
  restriction, and terminal transitions alone may invoke permanent closure.
- Prevention: C-2f-1 tests must cover both sides paused concurrently, every
  cross-side release denial, stale resume, terminal races, and zero cascade on
  pause; C-2f-2/3 must reject in-place transfer and terminal reactivation.

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
- Why the simple-role approach failed (or current hypothesis): A simple role addition would blur ownership and privacy boundaries.
- Fix / workaround: Model institution mode on `organization` workspace, with My-Chat-owned care canonical objects and The Nurture-owned projections/workflows.
- Superseded 2026-07-05: The ownership part of this workaround is superseded. Current rule: My-Chat owns account identity and scenario shell; Nurture owns the care ecology graph, including role assignments, child care process, enrollment, grant, family-care messages, and care items.
- Prevention: Start every institution-mode design review from `02-architecture.md` sections 1-4 and confirm ownership before fields or UI.
- References: `02-architecture.md`, `roadmap.md`, `docs/context/workflow/nurture-scenario-contract.md`.

### 2026-07-03 — Reducing institution ecology to a consent bridge

- Symptom: The design over-centers `ChildLinkGrant`, making the institution look like an authorization extension of family mode.
- Context: The institution is a real external environment in the child's growth process, with its own organization, teachers, group rhythms, workflows, and operational incentives.
- What we tried: Reframed `ChildLinkGrant` as the cross-ecology data-flow mechanism only.
- Why the cross-ecology-only framing failed (or current hypothesis): If the product
  does not help institutions and teachers directly, they have no reason to adopt
  the product.
- Fix / workaround: Add an explicit institution/teacher value model before capabilities: record reduction, group care operations, parent need intake, handoff, and quality review.
- Prevention: Before designing a capability, state the institution/teacher pain addressed and the resulting child benefit.
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
- Fix / workaround (current supersession applied): Define `NurtureChildCareProcess` as the local care subject; store Nurture participants, role assignments, Enrollment, `NurtureChildLinkGrant`, family-care threads/messages/items, and care facts as Nurture canonical data. My-Chat owns account plus protected platform Child/Family identity, stewardship/membership, scenario binding, shell/runtime, Notification, and deep-link surfaces, but none of those Host facts replaces Nurture authority.
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

### 2026-07-19 — Treating a trusted service call as business identity

- Symptom: A private My-Chat-to-Nurture request could appear authorized merely because the caller supplied a service credential, optional `actor_id`, surface string, or a workspace that Nurture could infer from Participant history.
- Context: C-3 subject-aware routes need both trusted transport and an authenticated adult, while all Guardian/Caregiver/Institution roles and Subject relationships remain Nurture-owned current facts.
- What we tried: Reusing the legacy workflow metadata and workspace-optional Nurture envelope as the future activated ingress contract.
- Root cause: Transport caller, adult principal, workspace selection, surface context, and business authority are separate proofs. Collapsing them lets a machine identity or ambiguous Host field become an impersonation path.
- Fix / workaround: C-3-0b-0 requires independent My-Chat service-caller and adult-principal proofs, one Host-established workspace, server-derived surface provenance, and fresh Nurture Participant/RoleAssignment/Subject resolution. Invitation acceptance stays a separate Host identity transition, and current optional fields remain non-activatable legacy scaffold.
- Prevention: Every subject-aware route review must identify the public authenticator, private workload identity, represented adult, workspace establishment, surface source, and owner reread separately; no credential or context field may satisfy two layers implicitly.
- References: `02-architecture.md` Pilot-0-C3-0b-0, `09-pilot-readiness.md` C-3-0b-0.

### 2026-07-19 — Treating every signed-in Chat as workspace business ingress

- Symptom: A daily generic My-Chat question could inherit the personal workspace used to store its thread, then silently invoke Nurture or query private workspace/Subject data when the text mentioned a child, teacher, or institution.
- Context: My-Chat supports ordinary AI use outside any business workspace, while the current identity repository can default an omitted active workspace to the earliest personal workspace.
- What we tried: Applying the same exact-workspace rule to every signed-in Chat and allowing a sole membership to become implicit business context.
- Root cause: Storage partition, account-level conversation context, and established business workspace are separate meanings. A unique membership removes ambiguity but does not express consent to cross from generic Q&A into private scenario processing.
- Fix / workaround: C-3-0b-1 defines `platform_general`, `workspace_business`, and `invitation_acceptance`. General Chat cannot call Nurture; transition remains explicit even with one eligible workspace, starts/enters a workspace-scoped conversation, and carries only the current confirmed intent by default.
- Prevention: Every Chat entry must classify context mode before scenario routing. Tests must distinguish storage workspace from business workspace and prove that child-related text alone cannot activate a scenario or copy prior general history.
- References: `02-architecture.md` Pilot-0-C3-0b-1, `09-pilot-readiness.md` C-3-0b-1.

### 2026-07-19 — Collapsing private transport proof, human identity, and replay

- Symptom: One static service credential plus optional `actor_id/workspace_id` could appear sufficient for a private Nurture call, while a reused nonce, business idempotency key, or Step claim might be treated as interchangeable replay evidence.
- Context: Current code has a static owner-read token, optional workflow actor metadata, a Nurture command replay kernel, and claimed-Step provenance, but no signed human-principal envelope or transport replay store.
- What we tried: Reusing the owner-read token and legacy `WorkflowCommandMeta` for activated subject-aware routes, or putting caller, adult, workspace, route, freshness, and business replay into one broadly interpreted token/request id.
- Root cause: Workload authentication, represented human identity, transport integrity/freshness, Nurture business idempotency, and original-Step handoff ownership prove different facts and have different retry lifecycles. Current `business_actor_ref` also carries My-Chat/system refs for legacy family-core but Participant ids for institution commands, so the name cannot safely bridge Host and domain identity.
- Fix / workaround: C-3-0b-2 requires a separate caller credential plus ES256-signed exact-body envelope, exact Workspace+User Participant binding, 60-second single-use nonce, stable inner `command_request_id`, independent original-Step check, pinned audiences/keys, verifier-only normalized context, and additive vNext no-fallback activation. Activated C3 uses the resolved Participant in domain context; C-3-0d must add a typed/versioned persisted actor representation or explicitly migrate legacy rows rather than reinterpret them.
- Prevention: Every private-ingress review must show the five evidence layers independently and run their cross-product negatives. Never reuse `NURTURE_INTERNAL_SERVICE_TOKEN`, Host Actor, nonce, command id, or claim token as another layer's authority.
- References: `02-architecture.md` Pilot-0-C3-0b-2, `06-ib-nurture-schema-spec.md` C-3-0b-2 refinement, `09-pilot-readiness.md` C-3-0b-2.

### 2026-07-19 — Forcing transitions, workers, and control-plane actors into one UI surface/principal

- Symptom: Notification, durable replay, post-accept onboarding, C-0 bootstrap, or Technical Operator recovery could be assigned a convenient Chat/board/`worker_runtime`/`technical_admin` surface and then inherit ordinary Participant resolution or business action semantics.
- Context: C-3-0b-2 locked one exact signed human-principal envelope for ordinary calls, but C-3-0b-3 still had to classify paths with no UI, no pre-existing Participant, or no represented business human.
- What we tried: Reusing broad `client_surface`/legacy event strings for every ingress and applying the ordinary zero-Participant resolver before invitation-bound onboarding.
- Root cause: Product presentation, Host transition, durable runtime, prospective identity establishment, control-plane provisioning, and technical recovery have different callers, authority, replay, and business-actor semantics. A flat surface string hides those differences and either blocks legitimate first binding or creates an impersonation/fallback path.
- Fix / workaround: C-3-0b-3 defines a discriminated product/transition/runtime ingress registry, closes API/interactive versus worker/durable combinations, makes Notification a two-stage owner read, keeps the original Step separate, and permits Participant creation only in the exact invitation-continuation transaction. C-0 provisioning and owner recovery use separate versioned endpoints/audiences/callers and never construct the ordinary principal.
- Prevention: Every new ingress must declare caller, principal origin, ingress category/key, Participant precondition, operation allowlist, replay provenance, and business-actor semantics. Do not add a fake UI surface, generic find-or-create fallback, or special caller to the ordinary matrix for implementation convenience.
- References: `02-architecture.md` Pilot-0-C3-0b-3, `06-ib-nurture-schema-spec.md` C-3-0b-3 refinement, `09-pilot-readiness.md` C-3-0b-3.

### 2026-07-19 — Treating a signed client echo or operational audit as durable business authority

- Symptom: A signed free-form client object, client-selected command id, copied request body, or long-lived audit record could become a second authority path or protected-content store.
- Context: C-3-0b signs the exact My-Chat-to-Nurture body, but the body still mixes client echo with Host-established context and Nurture-owned business facts unless every field class is closed. Host security evidence and Nurture business/audit evidence also have different owners and retention needs.
- What we tried: Generic `Record<string, unknown>` payload/detail objects, client-supplied command identity, one common audit document, copied request/response bodies, or one retention period for transport nonce, diagnostics, operator recovery, and business content.
- Root cause: Transport integrity does not turn client input into authority, and operational audit is not a durable copy of business state. Conflating these layers enables field injection, reason leakage, retention drift, or authorization from historical evidence.
- Fix / workaround: C-3-0b-4 separates strict `ScenarioClientEchoV1`, Host-only context, and Nurture-owner-only facts; forbids client-authored command identity; exposes only layered safe outcomes plus opaque support refs; splits body-free audit by owner; and fixes purpose-specific access and retention. The later consistency repair supersedes the draft shorthand “derive command identity at the Host”: My-Chat establishes request/driver inputs, while Nurture validates canonical effect identity/hash/replay under the operation/driver contract and C-3-0d locks exact derivation. Protected family content remains under its own later business-data policy.
- Prevention: Annotate every ingress field with exactly one trust class, reject unknown/authority-bearing echo fields, test that signatures never upgrade client trust, prohibit protected bodies in operational audit, and verify retention/access cutoffs independently for each owner.
- References: `02-architecture.md` Pilot-0-C3-0b-4, `06-ib-nurture-schema-spec.md` C-3-0b-4 refinement, `09-pilot-readiness.md` C-3-0b-4.

### 2026-07-19 — Treating Host request evidence as ownership of Nurture command semantics

- Symptom: The C-3-0b-4 shorthand could be read as assigning both `command_request_id` derivation and business strong authorization to My-Chat merely because the client is forbidden from supplying either value.
- Context: B3-2b already defines an owner-issued `submit_action` context and stable context-derived CommandExecution replay, while C-3-0b adds Host request/driver evidence and optional authentication-assurance evidence. Direct-empty and claimed-Step commands may need different stable seeds.
- What we tried: Classifying undifferentiated “command identity” and “strong-authorization assertion” as Host-only fields and writing that Host/Nurture jointly derives the business identity.
- Root cause: Field authorship, transport carriage, authentication assurance, canonical business-effect identity, and Nurture authorization are separate semantics. “Not client-authored” does not imply “Host-owned,” and a recent-authentication assertion does not decide a Nurture role, policy, target, or effect.
- Fix / workaround: My-Chat establishes only current request/driver inputs and bound authentication-assurance evidence. Nurture validates canonical business-effect identity/hash/replay under the registered operation/driver contract and still requires current owner facts, policy, owner-issued submit context, exact action, and confirmation for strong authorization. C-3-0d must lock direct-empty versus claimed-Step derivation before activation.
- Prevention: Contract reviews must label request identity, driver seed, canonical command identity, payload hash, authentication assurance, and business authorization separately. No implementation may infer the C-3-0d derivation rule from C-3-0b field carriage.
- References: `02-architecture.md` Pilot-0-C3-0b-4, `06-ib-nurture-schema-spec.md` C-3-0b-4 refinement, `09-pilot-readiness.md` C-3-0b-4.

### 2026-07-19 — Treating a generic renderer or AI narration as the business presenter

- Symptom: Chat, board, and workbench implementations could each reconstruct Nurture role/state/action semantics from raw refs or internal codes, while AI narration could reveal or invent facts not present in the current safe owner response.
- Context: My-Chat owns multiple product surfaces and generic UI components, while Nurture owns Subject reachability, protected business state, safe reasons, and action availability. The current scaffold has broad surfaces and synthetic summaries but no shared semantic-presentation boundary.
- What we tried: Letting surface adapters query or interpret domain facts, persisting a rendered tree/candidate list for reuse, or prompting the Chat model with broad owner metadata so the model could produce a more natural response.
- Root cause: Presentation layout and business presentation semantics have different owners. A rendered snapshot is stale immediately after role, Grant, policy, lifecycle, revoke, or redaction change, and LLM fluency cannot substitute for owner-authorized disclosure.
- Fix / workaround: C-3-0c-0 fixes one Nurture semantic presenter/owner path followed by My-Chat generic renderers. Chat narration is limited to current display-safe semantic output; renderers cannot add actions/reasons/facts; every surface rereads; and unclassified presentation/domain/protected fields cannot enter Host persistence.
- Prevention: Every renderer review must identify the owner-produced semantic input, prove zero domain queries/interpretation, compare all surfaces against one owner presenter, test LLM non-invention, and apply the C-3-0c-3 persistence class plus the later C-3-0e protected/draft/offline class to every field.
- References: `02-architecture.md` Pilot-0-C3-0c-0, `06-ib-nurture-schema-spec.md` C-3-0c-0 refinement, `09-pilot-readiness.md` C-3-0c-0.

### 2026-07-19 — Reusing domain refs or treating subject options as authority

- Symptom: A Host adapter could reuse `DomainContextRef` for subject discovery, expose stable Nurture object identity, expand a CareGroup/Institution collection into children, or treat a selected option as lasting authorization.
- Context: C-3-0a requires account-to-Subject reachability without a Host Child/relationship SSOT, while existing workflow `DomainContextRef` intentionally contains `namespace`, `object_type`, `object_id`, and optional canonical identity for durable owner reread.
- What we tried: Reusing the existing ref to avoid a new type, combining discovery and resolve in one generic method, and letting My-Chat rank or cache candidates for cross-surface convenience.
- Root cause: Durable domain identity and short-lived privacy-preserving reachability prove different facts. Candidate discovery is not current authorization, and collection reachability does not authorize member enumeration.
- Fix / workaround: C-3-0c-1 introduces separate `list_subject_contexts` and `resolve_subject_context`, a new principal/workspace/scenario-bound opaque `ScenarioSubjectContextRefV1`, one collection context without member expansion, closed results/privacy fields, and 30-minute ref/5-minute cursor/20-candidate bounds. Exact safe-copy encoding remains C-3-0c-2.
- Prevention: Conformance must reject `DomainContextRef` identity fields, Host ranking/filtering/correlation, collection member/count output, and any use of a context ref as relationship, action, replay, cross-surface, or offline authority. Resolve again at every surface/action seam.
- References: `02-architecture.md` Pilot-0-C3-0c-1, `06-ib-nurture-schema-spec.md` C-3-0c-1 refinement, `09-pilot-readiness.md` C-3-0c-1.

### 2026-07-19 — Reusing UI or Run contracts as semantic presentation

- Symptom: A producer could publish raw Run target ids through `WorkflowActionAvailability`, let My-Chat `serverAction|params|extensions` define business behavior, expose database ids in an “opaque” ref, or make the renderer/AI translate Nurture codes into copy and controls.
- Context: B3 locks cross-surface action identity while C-3-0c-0/1 lock Nurture semantic ownership and privacy-preserving subject context. Current Base, My-Chat, and Nurture scaffolds predate the new provider/presentation boundary.
- What we tried: Reusing the Run action DTO and mobile interaction envelope to avoid an additive presentation contract, adding renderer-specific blocks, and returning every unavailable action as a disabled button.
- Root cause: Workflow Run control, generic UI state, read-only owner semantics, navigation, and durable domain-action preparation have different authority and disclosure boundaries. A disabled control can also reveal that an action or target exists.
- Fix / workaround: C-3-0c-2 defines owner-resolved plain text, a closed six-block flat vocabulary, separate navigation/action unions, entitled unavailable disclosure, prepare-only opaque action targets, explicit priority/tone/confirmation/narration, exact bounds, and a refs/codes-free AI projection. Renderer/persistence, action execution, and protected/draft/offline policy remain C-3-0c-3/d/e.
- Prevention: Conformance must reject raw ids/URLs, arbitrary records/extensions, UI primitives, Run action reuse, code-to-copy translation, hidden-action reconstruction, unavailable-action existence leakage, AI ref/code exposure, and every over-bound response before activation.
- References: `02-architecture.md` Pilot-0-C3-0c-2, `06-ib-nurture-schema-spec.md` C-3-0c-2 refinement, `09-pilot-readiness.md` C-3-0c-2.

### 2026-07-19 — Persisting display-safe presentation or inventing renderer-side queries

- Symptom: A Host could treat owner-safe text as durable Chat content, keep stale cards behind refresh, persist refs/actions in a dashboard cache, or add local status/search filters that reinterpret Nurture rows. Revoke/redaction could then leave readable copies or divergent history across Chat, boards, and workbenches.
- Context: C-3-0c-2 provides display-safe semantic data but deliberately contains no renderer primitive or arbitrary business query. B3 required complete role-correct history while the first internal experiment has only three child scopes and no accepted owner query-control contract.
- What we tried: Mapping `display-safe` to “safe to persist,” reusing ordinary Chat messages for semantic narration, using stale-while-revalidate for perceived speed, filtering loaded rows in My-Chat, or smuggling query criteria through route/presentation/continuation values.
- Root cause: Safe current disclosure, durable retention, offline access, query semantics, and current authorization are independent decisions. A generic renderer cannot know whether an old label, action, row, or locally filtered absence remains safe or complete.
- Fix / workaround: C-3-0c-3 maps the four registered C-3 Nurture surfaces to three Host renderer families and uses neutral Host fixtures for the remaining generic family/read-only checks; Institution routes remain C-4. It classifies all presentation fields as owner-canonical, ephemeral, allowlisted Host shell, or forbidden Host copy, uses a content-free Chat rehydration marker, clears stale content before refresh, and caps foreground freshness at 60 seconds. Complete Pilot history is owner-paginated; arbitrary search/sort/compound filters are deferred to an additive owner query-control contract.
- Prevention: Renderer conformance must scan every Host destination, reject unclassified fields and partial/legacy fallback, prove background/focus/invalidation clearing, verify neutral read-only role-board behavior without registering C-4 keys, and test accessibility plus complete pagination without renderer business inference.
- References: `02-architecture.md` Pilot-0-C3-0c-3, `06-ib-nurture-schema-spec.md` C-3-0c-3 refinement, `09-pilot-readiness.md` C-3-0c-3.

### 2026-07-19 — Treating one hash or partial capability as presentation adoption

- Symptom: Matching Base/My-Chat workflow-contract hashes, a copied provider type, or one working renderer could be reported as complete subject-aware presentation support while trusted ingress, owner provider, manifest registry, persistence guard, or another surface remains on a legacy path.
- Context: The current `0bd892...` path-content and `a97a5b...` logical-source hashes were created for the X0 handoff contract. Nurture also has a canonical/pre-activation manifest pair and a local pnpm `file:` dependency, while C-3-0c spans reusable contracts, scenario implementation, Host renderer behavior, and exact cross-repo adoption.
- What we tried: Extending the meaning of the old hash without a named C-3 source set, enabling provider/presentation/renderer separately, treating a sibling checkout as immutable adoption proof, or adding more hand-maintained filters to the pre-activation manifest.
- Root cause: Shared source parity, scenario registry/implementation identity, Host renderer conformance, dependency materialization, and activation state prove different facts. A partial capability or independently edited projection creates a second semantic path and makes no-fallback claims unverifiable.
- Fix / workaround: C-3-0c-4 requires atomic `scenario_subject_presentation_v1` dependent on trusted ingress, a separately named `scenario_interface_source_v1`, distinct Scenario module and Host renderer identities, exact Base -> My-Chat -> Nurture adoption, four-layer conformance, and one canonical manifest with a mechanical disabled-capability projection. Legacy manifests remain unchanged, but any vNext declaration is all-or-fatal and never falls back.
- Prevention: Every adoption review must show exact revisions and named hashes, real provider/presenter/renderer registry backing, mixed-version denial, `file:` materialization provenance, projection equivalence, capability/allowlist default-off state, positive evidence for the four registered C-3 surfaces, neutral Host fixture coverage for all three renderer families, and negative evidence for the two reserved C-4 keys before claiming implementation readiness.
- References: `02-architecture.md` Pilot-0-C3-0c-4, `06-ib-nurture-schema-spec.md` C-3-0c-4 refinement, `08-iia-schema-policy-test-design.md` C-3-0c-4 test design, `09-pilot-readiness.md` C-3-0c-4.

### 2026-07-19 — Conflating domain-action shape with the effect driver

- Symptom: B3's `Direct domain action` label could make caregiver reply execute without a Workflow Step even though the committed reply may create family `user_attention`; recipient count or `already_satisfied` could also select a direct path at runtime. A worker retry might then persist a token/body in the Step or mint a replacement Step to recover.
- Context: B3 separated product action keys from legacy Workflow Run actions before C-3-0d selected exact execution drivers. C-2f-5 already requires every non-empty-capable path to be Host-first and preserves original-Step replay ownership.
- What we tried: Reusing “direct” for both handler shape and empty Host effect, creating a Step only after Nurture returns snapshots, selecting driver from the current recipient list, or storing the submit token/target/body so a later worker could call Nurture.
- Root cause: Product action identity, handler shape, business transaction, Host-effect capability, and durable recovery prove different facts. Data-dependent driver selection creates two command identities and lets a new Step acquire an old seed; raw token/body persistence violates the Host privacy boundary.
- Fix / workaround: C-3-0d defines static `scenario_direct_empty_v1|workflow_claimed_step_v1` per action, makes question/reply/transfer-proposal/withdrawal/service-end claimed, and uses content-free non-claimable Step -> immutable Nurture binding -> claim. Nurture derives effect identity, consumes context with effect/Execution/snapshots atomically, and permits only original-Step replay. A different `already_satisfied` Step stores `[]` and cannot resend. Typed Participant evidence is additive and legacy `business_actor_ref` remains unchanged.
- Prevention: Contract/manifest tests must assert one driver per action/surface, reject recipient/outcome-based switching and reply-as-direct, scan every Step/persistence destination for token/target/body/claim leakage, fault every pre-bind/post-bind seam, and deny different-Step seed transfer. Invitation, provisioning, portability, and Technical Operator remain separate protocols rather than a third catch-all driver.
- References: `02-architecture.md` Pilot-0-C3-0d, `06-ib-nurture-schema-spec.md` C-3-0d refinement, `08-iia-schema-policy-test-design.md` C-3-0d test design, `09-pilot-readiness.md` C-3-0d.

### 2026-08-05 — Carrying a Scenario-owner label into the neutral Base driver

- Symptom: The locked C-3 design called the direct driver
  `nurture_direct_empty_v1`, while C30-I1 requires Base types, Schemas and neutral
  fixtures to contain no Nurture registry value. The direct identity tuple also
  omitted the otherwise contract-defining `scenario_key` even though the claimed
  branch included it.
- Context: I1-D is the first Base slice that must encode the driver and
  effect-identity inputs rather than merely describing Nurture product behavior.
- What we tried: Preserving the earlier label as an exact shared enum, treating the
  InteractionContext as an implicit substitute for `scenario_key`, or postponing
  both inconsistencies until consumer adoption.
- Root cause: Product-owner terminology, reusable Base contract vocabulary and
  owner-internal hash derivation had been documented in one layer. An implicit
  context invariant was also carrying part of the canonical contract identity.
- Fix / workaround: Artifact 28 freezes
  `scenario_direct_empty_v1|workflow_claimed_step_v1` for Base and explicitly
  includes `scenario_key` in both server-only effect-identity input branches. The
  Nurture-owned domain-separated hash implementation remains later owner work;
  manifest dependency/source convergence remains I1-F.
- Prevention: Base neutrality scans must reject Scenario product names in shared
  enums/fixtures, identity parity tests must compare both driver branches field by
  field, and future owner-specific implementation details must not silently become
  reusable wire vocabulary.
- References: `artifacts/28-c30-i1-d-scope-freeze.md`, `02-architecture.md`
  Pilot-0-C3-0d, `06-ib-nurture-schema-spec.md` C-3-0d refinement.

### 2026-08-05 — Treating JSON serialization and recovery parity as contract proof

- Symptom: delegated `action_input` could admit non-JSON JavaScript values; exact
  replay could compare a committed original with a non-committed replay; and a
  stored binding plus an unavailable lookup could be rejected instead of remaining
  safely unavailable.
- Root cause: successful `JSON.stringify` was used as a JSON-domain proxy, result
  parity did not first require terminal committed state, and recovery validation
  coupled lookup availability to stored binding presence.
- Fix / workaround: D5 added a recursive strict-JSON assertion, committed-state
  preconditions for exact replay and an explicit fail-closed unavailable branch.
  The repaired source is `52c0dc2…`, sealed by `c179bb5…`.
- Prevention: delegated-value tests must include `undefined`, non-finite numbers,
  dates, functions and cycles; replay tests must cross every terminal/nonterminal
  state; recovery tests must keep storage evidence distinct from current lookup
  availability.
- References: `artifacts/33-c30-i1-d5-qualification-record.md`.

### 2026-07-19 — Treating encryption or a protected ref as the whole privacy boundary

- Symptom: A Message can carry `body=null` and a `protected_content_ref` while no real encrypted owner store exists, or the same text can survive in ordinary Chat, `PublicDraft`, Item detail, browser cache, logs, AI prompts, backups, or a stale protected view. The system then appears protected at the schema row while retaining several authoritative or readable copies.
- Context: The current Nurture implementation uses synthetic protected refs and scaffold storage modes; My-Chat independently persists ordinary Chat revisions and durable public drafts. C-3-0c/d intentionally left protected body, draft, cache/offline, AI, and retention behavior to C-3-0e.
- What we tried: Treating a nullable body/encrypted flag as sufficient, keeping ciphertext or summaries in multiple business rows, reusing Chat/draft infrastructure for convenience, enabling model drafting under the general AI contract, or declaring adoption when one repository had the new type.
- Root cause: Encryption at rest, current authorization, draft lifecycle, decrypted-view lifetime, deletion, backup restore, provider handling, Host persistence, and cross-repo activation prove independent properties. Closing only one leaves a hidden second content store or an unreadable/unerasable canonical fact.
- Fix / workaround: C-3-0e makes `scenario_protected_interaction_v1` atomic, adds one Nurture `NurtureProtectedContent` authority with per-content envelope encryption and crypto-erasure, separates protected composer/read from Chat and `PublicDraft`, forbids cache/offline/body-derived copies, gates protected AI separately and off, fixes Pilot retention/restore behavior, and names `scenario_protected_interaction_source_v1` plus storage/runtime evidence.
- Prevention: Activation review must trace one body from keystroke through prepare/commit/read/redact/expiry/backup restore and inspect every My-Chat/Nurture/queue/cache/observability/AI destination. Partial capability, scaffold ref, `plain_text_dev`, body-derived metadata, mutable dependency, or planning-only documentation can never count as complete adoption.
- References: `02-architecture.md` Pilot-0-C3-0e, `06-ib-nurture-schema-spec.md` C-3-0e refinement, `08-iia-schema-policy-test-design.md` C-3-0e test design, `09-pilot-readiness.md` C-3-0e.

### 2026-07-19 — Collapsing communication progress, suppression, and body visibility into one status

- Symptom: A revoked or redacted Item appears to lose its prior acknowledgment/reply, a reply redaction reopens the source task, or the UI exposes a body because the entry is still marked replied. Different surfaces then display incompatible histories from the same facts.
- Context: B3 uses Message, Receipt, Item, Event, Attention, original Grant, and protected-body policy as separate authorities. Source redaction may suppress an Item after a reply, while caregiver reply redaction must leave the source Item terminal and actionless.
- What we tried: Mapping `Item.status` directly to one product enum, treating `suppressed` as progress, or using one entry-level `visible|hidden` bit for both authors' bodies.
- Root cause: Business progress, action lifecycle, question visibility, reply visibility, and owner availability answer different questions and change under different commands/retention clocks.
- Fix / workaround: C-3-1 projects independent `progress`, `entry_lifecycle`, `question_visibility`, and `reply_visibility` axes from a complete Item-root fact graph. Missing or contradictory facts fail closed; redaction/revoke preserves the highest complete progress and applies author-specific tombstones.
- Prevention: Presenter and DB tests must enumerate all legal axes, validate unique typed source/reply relations and original Grant, reject partial graphs, and prove source versus reply redaction never invents progress, reopens work, or grants body access.
- References: `02-architecture.md` Pilot-0-C3-1, `06-ib-nurture-schema-spec.md` C-3-1 refinement, `08-iia-schema-policy-test-design.md` C-3-1 test design, `09-pilot-readiness.md` C-3-1a/d.

### 2026-07-19 — Moving ordinary Chat text into the protected composer

- Symptom: A user asks the AI a private family question and the product silently converts the Chat turn into a Nurture draft, or an `editable_preview`/`PublicDraft` path retains a second plaintext copy while appearing to use protected submission.
- Context: Generic My-Chat Chat persists conversation content, while C-3-0e permits protected body only in process-local composer memory and Nurture encrypted prepared/committed storage. Pilot protected AI is disabled.
- What we tried: One-click transfer of sent/unsent Chat text, seeding the composer from conversation history, or reusing legacy preview/draft components to avoid a new protected editor.
- Root cause: The source Chat path already has a different retention, AI, cache, and recovery contract. Moving its text does not retroactively make the original copy protected and creates ambiguous user expectations about what entered history.
- Fix / workaround: C-3-1 always opens an empty protected composer, labels the no-Chat-history boundary, and permits only normal manual typing/paste. AI receives display-safe presentation only; the protected body never enters Chat, legacy `InteractionEnvelope`, `ContentRevision`, `PublicDraft`, semantic output, or Host result state.
- Prevention: Rendered and leakage tests must start from both sent and unsent ordinary Chat text, prove no automatic/one-click transfer exists, and inspect every Host/client/cache/telemetry destination before allowing protected submission.
- References: `02-architecture.md` Pilot-0-C3-1, `06-ib-nurture-schema-spec.md` C-3-1 refinement, `08-iia-schema-policy-test-design.md` C-3-1 test design, `09-pilot-readiness.md` C-3-1-0/b.

### 2026-07-19 — Aliasing the historical family-input Workflow into the C-3 action path

- Symptom: `capture_family_input`, a hand-filtered preactivation registry, or an existing `internal_api` handler is renamed/wrapped as `submit_family_care_question`, and the system appears adopted while still accepting client-owned Nurture ids, broad profiles, synthetic protected refs, or ThreadParticipant authorization.
- Context: The X4 compatibility path predates trusted ingress, owner-derived action input, typed actor, pre-bound claimed Step, protected content, semantic Guardian presenter, and the three separately named C-3 source identities.
- What we tried: Reusing the old Run requirement as the new action DTO, keeping YAML and a handwritten runtime registry as two authorities, or enabling only the Guardian path in a shared dev environment before caregiver/continuity gates exist.
- Root cause: Similar business intent does not imply compatible trust, persistence, recovery, manifest, or privacy contracts. Partial reuse creates an untested fallback that can bypass the atomic C-3 capability set.
- Fix / workaround: C-3-1 keeps `scenario.manifest.yaml` canonical with generated typed projection and fatal bidirectional implementation parity, bans alias/fallback, orders Base -> My-Chat -> Nurture -> isolated joint evidence, and defers positive-only gate implementation plus default-off qualification to C-3-5; non-empty activation remains Pilot-2.
- Prevention: Conformance must reject mixed revisions, alternate registries, manual key filters, legacy handler coexistence, mutable local dependency evidence, and any environment activation before C-3-2/3/4, C-3-5 qualification, and separate Pilot-2 authorization pass.
- References: `02-architecture.md` Pilot-0-C3-1, `06-ib-nurture-schema-spec.md` C-3-1 refinement, `08-iia-schema-policy-test-design.md` C-3-1 test design, `09-pilot-readiness.md` C-3-1e.

### 2026-07-19 — Collapsing Guardian relationship roots into one status or Host projection

- Symptom: A subject has one apparent current Enrollment/Grant, an Institution episode failure hides every other relationship, or My-Chat reconstructs a combined relationship status from several owner calls.
- Context: One ChildCareProcess may have several same-workspace Institution Enrollment episodes while Guardian Role, Hold, TransferIntent, Grant, and StageEpisode retain distinct owners, versions, and lifecycles.
- What we tried: Adding a relationship aggregate/table, choosing one current Enrollment, flattening all episodes in Chat/board, or merging multiple presenter responses in the Host/client.
- Root cause: A convenient summary cannot preserve independent authorization, concurrency, retention, and noninterference boundaries. It also exceeds the semantic action-offer bound and creates a second business SSOT.
- Fix / workaround: C-3-2 defines one non-persisted Nurture owner composition, segments every Institution/Enrollment episode, and uses fresh owner-issued item detail before issuing one exact action target. The outer presenter never creates a combined business lifecycle.
- Prevention: Presenter and joint tests must prove multi-Institution episode separation, one owner snapshot boundary, exact action target roots, unavailable-segment noninterference, and zero Host relationship persistence or client aggregation.
- References: `02-architecture.md` Pilot-0-C3-2, `06-ib-nurture-schema-spec.md` C-3-2 refinement, `08-iia-schema-policy-test-design.md` C-3-2 test design, `09-pilot-readiness.md` C-3-2-0.

### 2026-07-19 — Treating every Guardian relationship transition as a domain-action driver

- Symptom: Raw recipient contact reaches Nurture/Chat, Host invitation acceptance creates a Guardian role, or Co-Guardian onboarding is implemented as direct-empty/claimed Workflow action with a generic Participant fallback.
- Context: Invitation delivery/authentication and ordinary current-subject actions prove different facts. A prospective recipient may correctly have no Participant before the exact onboarding transaction.
- What we tried: Reusing `ScenarioDomainActionContractV1` for invitation issue/accept, treating provider acceptance as authority, or inventing a third generic driver for Host-coordinated transitions.
- Root cause: The ordinary action path requires an established current subject relationship, while invitation continuation is the sole bounded prospective zero-Participant exception and must coordinate raw-contact ownership with a Nurture intent.
- Fix / workaround: C-3-2 keeps first/Co-Guardian invitation operations in the dedicated Host shell plus prospective application-service lane. Accepted self-exit is an ordinary strong/direct-empty action because it starts from an established current relationship; withdrawal remains the only Guardian relationship claimed action.
- Prevention: Cross-path tests must deny invitation/action/Handoff substitution, generic Participant creation, raw-contact leakage, provider-state authority, self-exit attention invention, and any fallback after a current owner or verifier failure.
- References: `02-architecture.md` Pilot-0-C3-2, `06-ib-nurture-schema-spec.md` C-3-2 refinement, `08-iia-schema-policy-test-design.md` C-3-2 test design, `09-pilot-readiness.md` C-3-2a/e.

### 2026-07-19 — Extending communication retention or Enrollment fences to longitudinal family facts

- Symptom: Stage/Enrollment history disappears after 365 days, a temporary Enrollment Hold hides the complete child/family view, or rejoining as the same Participant can never see retained family-authored history they remain authorized to read.
- Context: C-3-1's 365-day window governs one communication entry shell. Relationship, Enrollment, Grant, and Stage are canonical longitudinal facts with their own retention; holds primarily fence cross-role episode work.
- What we tried: Applying one global history cutoff/fence to every C-3 presenter or reading “new relationship does not recover old episode” as permanent denial of all family-side facts.
- Root cause: Product visibility, retention, relationship reach, original-Grant receiver authority, and temporary topology availability are independent policies.
- Fix / workaround: C-3-2 history uses owner-retained canonical facts. A new authorized Role may restore current family-side retained access and exact-author redaction, never the old Role/Grant/cross-role authority. Holds keep Stage and safe episode/family history visible while fencing exact dependent work.
- Prevention: Tests must vary retention class, hold side, terminal versus temporary facts, rejoin identity, authorship, and original Grant, and must reject global cutoff, hidden Stage, or old receiver-authority revival.
- References: `02-architecture.md` Pilot-0-C3-2, `06-ib-nurture-schema-spec.md` C-3-2 refinement, `08-iia-schema-policy-test-design.md` C-3-2 test design, `09-pilot-readiness.md` C-3-2-0/a.

### 2026-07-20 — Treating inbox and Attention as two Caregiver business lifecycles

- Symptom: `class_family_inbox`, `teacher_attention_board`, and a synthetic internal API each calculate state or expose action targets independently, so one surface shows open while another shows resolved, or an Attention ref bypasses the Item's original Grant/version.
- Context: Pilot requires an aggregated Caregiver queue and an attention-oriented teacher-board layout, but B3 also fixes one Message/Receipt/Item/Event/Attention workflow graph and C-3-0c requires one owner presentation path.
- What we tried: Registering each legacy Workflow entrypoint as a new presenter, treating `NurtureTeacherAttentionItem` as a second task aggregate, or merging several owner responses in My-Chat.
- Root cause: Product views, queue indexes, and canonical work facts solve different problems. Giving a projection its own lifecycle/authorization creates dual-track state and makes complete graph integrity impossible to prove.
- Fix / workaround: C-3-3 defines one `caregiver_family_care_work_v1` Item-root non-persisted projection. Current may render Attention summary plus inbox blocks, while recent/history/detail and every action still resolve the same complete Item graph. Attention is uniquely typed to its source Item and never becomes an action target.
- Prevention: Presenter/schema/joint tests must reject duplicate/missing/cross-Grant Attention, legacy/internal-API aliases, Host multi-presenter joins, Attention action refs, partial responses, and any state derivation that does not validate the complete Item graph.
- References: `02-architecture.md` Pilot-0-C3-3, `06-ib-nurture-schema-spec.md` C-3-3 refinement, `08-iia-schema-policy-test-design.md` C-3-3 test design, `09-pilot-readiness.md` C-3-3-0/a.

### 2026-07-20 — Turning acknowledge into implicit multi-Caregiver handoff

- Symptom: One Caregiver acknowledges an Item and another RoleAssignment submits the reply, or a terminal/new staff role silently acquires old work because the Item stores only a Participant or group.
- Context: The internal Pilot has exactly one operational Caregiver plus separate Lead designation and explicitly excludes backup, reassignment, duty handoff, and multi-Caregiver concurrency. Future extensibility must not be obtained through accidental current-query behavior.
- What we tried: Treating acknowledge as a group-wide flag, resolving any current Caregiver at reply time, adding a global one-Caregiver database constraint, or suppressing the Item automatically when the claimant role ends.
- Root cause: Audit actor, exact work claim, staffing topology, and permanent business invalidation are separate. A group-level or Participant-only claim permits unreviewed takeover; global cardinality blocks future protocols; automatic suppression misclassifies staff loss as source/Grant termination.
- Fix / workaround: C-3-3 makes acknowledge an exact Pilot Participant+RoleAssignment claim and binds the assigned role. Only that current role may reply. Temporary loss preserves acknowledged/active facts and permits fresh prepare after same-row recovery; terminal loss leaves body-free staffing-review work with no takeover. Multiple eligible roles fail the Pilot gate without a global schema constraint.
- Prevention: Tests must cover zero/one/multiple roles, same Participant/new role, suspension/resume, terminal offboarding, open-before-replacement, acknowledged-after-loss, cross-surface same claimant, and Institution/Operator denial. A future handoff requires its own versioned command and review.
- References: `02-architecture.md` Pilot-0-C3-3, `06-ib-nurture-schema-spec.md` C-3-3 refinement, `08-iia-schema-policy-test-design.md` C-3-3 test design, `09-pilot-readiness.md` C-3-3b/d.

### 2026-07-20 — Guessing user-attention origin or recipients from current rows

- Symptom: A caregiver reply is routed through the legacy capture entrypoint, a new Guardian receives an old reply notification, a departed user remains targeted, or one direction/source tuple is interpreted differently by two consumers.
- Context: The existing Handoff key/purpose/source types serve family-to-organization attention and must also carry the locked organization-to-family reply without widening the public contract. Notification continuity remains C-3-4.
- What we tried: Inferring producer from Receipt direction, faking `capture_family_input` capability/entrypoint fields, storing My-Chat user ids in Nurture, creating one Handoff per recipient, or resolving only the currently active role set at delayed delivery time.
- Root cause: Producer provenance, business audience at commit, current delivery eligibility, and Host Notification state prove different facts. Current-only lookup causes historical backfill, while a fake entrypoint breaks replay/evidence identity.
- Fix / workaround: C-3-3 adds a neutral versioned Host-derived domain-action producer origin, typed Nurture RoleAssignment cohort rows committed with the reply, one logical refs-only Handoff, and an origin/graph-aware resolver using commit cohort intersected with current eligibility. `complete_step` remains local/atomic; C-3-4 rereads before Notification/send/open.
- Prevention: Conformance must reject client/fake origin, direction-only inference, legacy alias, new Handoff key/source types, per-recipient duplicate Handoffs, late-join backfill, new-role inheritance, departed delivery, remote owner calls inside `complete_step`, and live Notification behavior in the C-3-3 harness.
- References: `02-architecture.md` Pilot-0-C3-3, `06-ib-nurture-schema-spec.md` C-3-3 refinement, `08-iia-schema-policy-test-design.md` C-3-3 test design, `09-pilot-readiness.md` C-3-3c/e.

### 2026-07-20 — Exposing a Handoff as the Notification address

- Symptom: Client DTO, provider payload, deep link, or mobile route contains a Handoff id, and an authenticated workspace member can call the owner resolver without proving ownership of one recipient Notification.
- Context: Handoff is a My-Chat technical materialization fact shared by a recipient cohort. It is neither a public resource nor a recipient binding; one reply Handoff may legitimately fan out to two Guardian Notifications.
- What we tried: Storing `targetType=workflow_handoff`, duplicating the id in metadata, generating `morethan://nurture/attention/{handoff}`, and opening through `/workflow-handoffs/:id/...`.
- Root cause: A technical source reference was treated as both delivery address and authorization locator. This leaks topology, bypasses exact recipient lookup, and makes legacy generic target and vNext semantics compete.
- Fix / workaround: C-3-4 requires Notification-id-only external carriage and an additive typed workspace/recipient/Handoff/continuity source link as the sole vNext send/open authority. Generic targets remain explicit legacy rows and are never dual-read or fallback.
- Prevention: DTO/provider/deep-link/log scans reject Handoff/target/reason fields; wrong recipient/workspace/id proves zero Handoff/Nurture calls; mixed/missing typed-link rows fail generic unavailable.
- References: `02-architecture.md` Pilot-0-C3-4, `06-ib-nurture-schema-spec.md` C-3-4 refinement, `08-iia-schema-policy-test-design.md` C-3-4 tests, `09-pilot-readiness.md` C-3-4c/e.

### 2026-07-20 — Reusing one predicate for Notification delivery and open

- Symptom: A replied/acknowledged Item can no longer open its current history because delivery required `open`, or a stale delivery predicate revives an old button/body during open.
- Context: Delivery asks whether a new generic signal should be created/sent now; open asks what an exact prior recipient may currently see. The two questions share source evidence but not lifecycle meaning.
- What we tried: One resolver with optional actor input, current Item status branching, and one fixed teacher route for create, send, and open.
- Root cause: Candidate audience, current delivery desirability, historical shell visibility, protected-body visibility, and action availability were collapsed into one boolean.
- Fix / workaround: C-3-4 separates delivery plan, exact create/send check, and authenticated open. Open first binds the historical recipient role episode, then resolves shell/body/action independently and issues only a destination locator; destination owner reread remains final.
- Prevention: Tests cover acknowledged/replied/closed, tombstone, role loss/new role, temporary recovery, Grant/source change, and owner outage with distinct create/send/open results; resolver/handler alias is fatal.
- References: `02-architecture.md` Pilot-0-C3-4, `08-iia-schema-policy-test-design.md` C-3-4 tests, `09-pilot-readiness.md` C-3-4c-e.

### 2026-07-20 — Treating Notification/provider state as Nurture business progress

- Symptom: Host read acknowledges an Item, provider success marks a Receipt delivered, provider failure makes a business command fail, or a completed Handoff is displayed as a caregiver reply.
- Context: Nurture Message/Receipt/Item/Execution, Workflow Handoff, Host Notification read, and per-device provider delivery are different owners and failure domains.
- What we tried: Deriving business result from Handoff/provider state or waiting for push success before completing the logical Notification materialization.
- Root cause: User-arrival evidence and canonical domain effect were conflated, creating distributed-transaction expectations and incorrect recovery.
- Fix / workaround: C-3-4 keeps original Execution/Step recovery authoritative, completes Handoff after idempotent logical Notification reconciliation, and gives provider work its own lease/retry/dead-letter lifecycle. Open marks only Host read and performs no Nurture write.
- Prevention: Fault tests assert one business effect through provider outage/duplicate push, zero Receipt/Item/Message/Execution mutation on open/read/unread, and independent state vocabularies/telemetry.
- References: `02-architecture.md` Pilot-0-C3-4, `06-ib-nurture-schema-spec.md` C-3-4 refinement, `08-iia-schema-policy-test-design.md` C-3-4 tests, `09-pilot-readiness.md` C-3-4b/d/e.

### 2026-07-20 — Persisting drafts, result locators, or open tokens to simulate continuity

- Symptom: Protected text crosses surfaces through Chat draft/history, a result/output ref is put in route state, or `open_notification` token survives in URL/local storage and reopens stale content offline.
- Context: Pilot continuity intentionally preserves committed owner facts, not unfinished protected authoring or cached authorization. Route/view intent and current owner reread are sufficient for ordinary movement.
- What we tried: Reusing `threadDrafts`, `PublicDraft`, continuation refs, `open_result`, persisted scenario tokens, and cached Notification detail cards.
- Root cause: Product convenience carriers were mistaken for durable owner evidence and created hidden body/authorization stores.
- Fix / workaround: C-3-4 requires `stay|discard_and_navigate`, ordinary route/view-only movement, original Execution/Step recovery, Notification-id reopen, foreground-only destination token, and a second current owner read. Offline is generic shell only.
- Prevention: Storage/browser/PWA/log inventories must remain empty for protected draft/result/token; navigation/draft/reload/multi-device tests reject every alternate carrier and legacy Handoff card.
- References: `02-architecture.md` Pilot-0-C3-4, `08-iia-schema-policy-test-design.md` C-3-4 tests, `09-pilot-readiness.md` C-3-4a/b/e.

### 2026-07-20 — Replaying partial fanout without per-candidate outcomes

- Symptom: A response-loss retry cannot distinguish a candidate that crashed before Notification creation from one already terminally skipped, so a restored role receives a late Notification or a Handoff completes while a temporary candidate is still unresolved.
- Context: One non-empty Handoff can have two immutable commit-cohort recipients, and each recipient can independently materialize, become terminally ineligible, remain temporarily fenced, or hit owner outage.
- What we tried: Inferring completion from the union of existing typed links, a current recipient query, or aggregate downstream counts.
- Root cause: Absence of a Notification is not a state. Without an immutable candidate plan and terminal outcome, crash-missing, temporary pending, and permanent skipped are indistinguishable.
- Fix / workaround: C-3-4 persists one body-free candidate row with canonical plan/intent hash and `pending|materialized|skipped`. Pending keeps Handoff requested; all skipped/none materialized stops; at least one materialized/all terminal completes; terminal skipped never backfills.
- Prevention: Fault tests cover every candidate/link/receipt seam, temporary recovery/horizon, partial fanout, plan drift, and replay. A command-time empty cohort remains Nurture `[]` and never creates a Handoff.
- References: `02-architecture.md` Pilot-0-C3-4, `06-ib-nurture-schema-spec.md` C-3-4 refinement, `08-iia-schema-policy-test-design.md` C-3-4 tests, `09-pilot-readiness.md` C-3-4c.

### 2026-07-20 — Treating activation-control implementation as permission to activate

- Symptom: Adding a Workspace gate table or briefly setting a synthetic gate during tests is reported as persistent activation, Pilot readiness, or authority to enable the internal Workspace.
- Context: C-3-5 must prove that a positive-only environment-plus-Workspace gate and kill switch work, while Pilot-0 authorizes no persistent environment, secret, database mutation, capability enablement, or traffic.
- What we tried: Deferring “persistent activation” to C-3-5 without distinguishing the gate mechanism, disposable evidence exercise, final stored state, and Pilot-2 release mutation.
- Root cause: Implementation readiness and operational authorization used the same word and hid the separate Pilot-0-D/E, Pilot-1, and Pilot-2 decisions.
- Fix / workaround: C-3-5 now owns activation-control implementation and qualification only. Its required final census is environment activation bundle false and active Workspace rows empty. A separately approved disposable proof uses a short-lived `evidence_release_controller` through the production command/path, scoped to one synthetic environment/C-3 component/disposable deployment/Workspace and destroyed afterward. Only Pilot-2's distinct controller may enable a Pilot row, and that row binds the E-reviewed complete candidate plus Pilot-1 deployment—not the C-3 component alone.
- Prevention: Status and gate tests reject `activated|pilot_ready|go`, direct DB/test bypass, component-only Pilot binding, invalidated qualification/Go, deployment drift, evidence credentials with Pilot scope, or surviving evidence authority; candidate evidence records before/after false-empty state, release authority, and zero external traffic.
- References: `02-architecture.md` Pilot-0-C3-5, `06-ib-nurture-schema-spec.md` C-3-5 refinement, `08-iia-schema-policy-test-design.md` C-3-5 tests, `09-pilot-readiness.md` C-3-5c/f.

### 2026-07-20 — Mixing evidence from different candidate builds

- Symptom: Contract tests from one Base revision, DB tests from another schema, screenshots from a rebuilt frontend, and rollback from a different configuration are combined because every individual job was green.
- Context: Cross-repository safety depends on exact source, manifest, schema, runtime, renderer, provider, KMS/signing, gate, topology, and test-code compatibility.
- What we tried: Using a branch name, release tag, one contract hash, or latest successful CI run as the umbrella identity.
- Root cause: A mutable label cannot prove that every evidence layer executed the same bits and configuration or identify which downstream proof became stale after a change.
- Fix / workaround: `c3_component_candidate_manifest_v1` derives `component_candidate_id` only from immutable build/configuration inputs. Every result records that id; a later evidence index binds it; and a separate signed `qualification_envelope_id` binds candidate id, evidence-index digest, final gate census, and result. Evidence never writes back into candidate-pinned source commits.
- Prevention: Qualification rejects a self-referential evidence-index candidate tuple, mutable lifecycle in the candidate manifest, dirty trees, post-test rebuilds, mutable dependencies/URLs, missing SBOM/provenance, mixed candidate ids, or dependency-edge reruns that omit an affected layer. A discovered risk invalidates the same candidate's qualification; only a tuple-changing fix creates a new candidate.
- References: `02-architecture.md` Pilot-0-C3-5, `08-iia-schema-policy-test-design.md` C-3-5 candidate tests, `09-pilot-readiness.md` C-3-5b.

### 2026-07-20 — Using J1-J4 as complete Guardian or Institution evidence

- Symptom: Four communication journeys pass and the release is described as covering Guardian authority, Institution onboarding, transfer/service closure, and the complete Pilot product.
- Context: J1-J4 intentionally cover the family-care round trip and four Caregiver Chat/teacher-board pairings. Guardian relationship/Enrollment/Grant/Stage actions and C-4 Institution producers/surfaces have different owners and risks.
- What we tried: Treating deterministic topology setup and one Institution account as product evidence for all prerequisite relationships.
- Root cause: Representative business paths were confused with exhaustive action/surface conformance and with setup/product ownership.
- Fix / workaround: C-3-5 requires a separate rendered C-3-2 authority strand plus J1-J4. Fixtures may seed only C-4-owned Institution/CareGroup/staff-role and pending invitation/transfer topology; qualifying Grant/Thread/accepted-Enrollment facts use real C-3 paths. C-4 routes/producers stay absent or contract-negative and must be proven later on a new complete candidate.
- Prevention: The evidence index assigns every action/surface cell and journey to its owning strand and marks fixtures explicitly. C-3 exit remains `C4_PENDING`.
- References: `08-iia-schema-policy-test-design.md` C-3-5 evidence tests, `09-pilot-readiness.md` C-3-5-0/d/f.

### 2026-07-20 — Letting the kill switch strand a committed business effect

- Symptom: A Workspace row is removed while a command is crossing the My-Chat/Nurture database boundary, leaving the Step outcome unknown, an explicit-empty replay misclassified, or a later operator tempted to run a new Step or edit the database.
- Context: Emergency disablement must stop delivery/open immediately without rewriting the already committed owner fact or losing deterministic replay ownership.
- What we tried: Comparing cross-database wall-clock delete/commit times as if they formed one transaction, applying the gate only before the command, cancelling every in-flight technical row, or disabling workers without classifying replay-seed and post-commit windows.
- Root cause: “Stop new activation” lacked an implementable admission linearization point, conflated the C-3-0b transport nonce with business commit, and conflated explicit-empty execution with non-empty handoff recovery.
- Fix / workaround: Base owns the exact admission/status contract. Host gate-read plus body-free admission persistence/issuance is admission. Each owner attempt still consumes a fresh transport nonce before owner calls; fenced `CommandExecution + business effect` is owner commit. Expiry prevents new uncommitted work but never blocks exact committed recovery. After deadline, the same command fence classifies `committed|confirmed_no_effect|unknown`: unknown stays quarantined; no-effect closes claimed/direct work without Handoff; committed direct returns the original result; committed claimed work alone enters the five settlement cases (`[]` no Handoff, non-empty/no Handoff stopped, Handoff/no plan stopped, zero-materialized skipped/stopped, partial skipped/completed). Provider/open/destination stay disabled and no business effect repeats.
- Prevention: Fault injection covers source-hash/codec drift, transport replay before owner calls, fresh-nonce exact business replay, admission before/at/after expiry, issued-before-send, nonce-before-transaction, rollback, commit-response-loss, claimed/direct drivers, both disable-race outcomes, unknown/no-effect/committed classification, wrong-Step/new-admission denial, zero audience recomputation, no skipped backfill, final false/empty state, and no duplicate CommandExecution.
- References: `02-architecture.md` Pilot-0-C3-5, `06-ib-nurture-schema-spec.md` C-3-5 refinement, `08-iia-schema-policy-test-design.md` C-3-5 kill-switch tests, `09-pilot-readiness.md` C-3-5e.

### 2026-07-20 — Masking protected evidence only after capture

- Symptom: The final screenshot or video is masked, but an unmasked source recording, editor autosave, thumbnail, clipboard, or tool cache remains on disk.
- Context: Rendered/manual qualification must prove user-visible behavior without turning the evidence system into another protected-content store.
- What we tried: Capturing the full screen and redacting the exported artifact afterward.
- Root cause: Export-time masking protects only the final file, not the capture pipeline or its intermediate persistence.
- Fix / workaround: Exclude or mask protected regions at capture time, prohibit any unmasked intermediate write, record observer attestation, and scan temporary recording/editor/tool caches before sealing evidence.
- Prevention: Manual-evidence tests fail on any unmasked frame/cache, missing capture-control attestation, or evidence destination outside the body/secret-free inventory.
- References: `08-iia-schema-policy-test-design.md` C-3-5 rendered/manual and privacy tests, `09-pilot-readiness.md` C-3-5d/e.

### 2026-07-20 — Letting C-3 product scope, generic renderer coverage, and legacy resolver semantics overlap

- Symptom: C-3 simultaneously required six Nurture product surfaces and required the two Institution surfaces to be absent; the older R7 resolver also returned replied/follow-up work as current after C-3 made reply terminal.
- Context: Generic My-Chat renderer families must be reusable before the Institution product slice exists, while one Nurture capability must still have one current/recent/history lifecycle.
- What we tried: Counting neutral renderer examples as Nurture routes and leaving the old resolver wording as a generic source-adapter option.
- Root cause: Host conformance scope was conflated with scenario product registration, and a historical resolver design was not explicitly superseded by the later product lifecycle.
- Fix / workaround: C-3 registers exactly four Guardian/Caregiver surfaces. Neutral Host fixtures exercise all three renderer families but provide no Nurture route/presenter/C-4 evidence. R7 current family-care candidates are exactly `open|acknowledged`; `replied|suppressed` are terminal recent/history, and follow-up/continue aliases are unregistered.
- Prevention: Manifest/route/presenter tests assert Institution-key absence; conformance reports fixture versus product evidence separately; resolver tests compare every source adapter to the final C-3 lifecycle table.
- References: `02-architecture.md` C-3-0c/C-3-3, `06-ib-nurture-schema-spec.md` C-3-0b/c, `08-iia-schema-policy-test-design.md` C-3-0c and R7, `09-pilot-readiness.md` C-3-0b/c/C-3-3.

### 2026-07-20 — Making protected-Chat privacy promises broader than the controllable boundary

- Symptom: Documentation promised protected text never enters Chat even though the ordinary generic Chat accepts and retains user-authored text before the protected composer is opened.
- Context: The product can prevent copying a composer body into Chat and can avoid asking for detail in Chat, but it cannot truthfully make ordinary Chat input retroactively no-retention without a separately implemented pre-persistence guard.
- What we tried: Calling ordinary natural-language intent “private draft material” and relying on UI direction to claim that users would never paste private content into Chat.
- Root cause: A lifecycle guarantee was attached to user intent rather than to the first enforceable system boundary.
- Fix / workaround: The zero-copy/no-Chat-persistence guarantee begins only when the registered protected composer accepts the business body. Nurture Chat warns and opens an empty composer before soliciting detail. Ordinary Chat remains under My-Chat transcript/provider/deletion policy, never auto-promotes its content, and receives no false zero-retention claim.
- Prevention: Tests distinguish a composer-accepted body from a mistaken ordinary Chat turn and scan every Host destination for only the former; product copy must name the boundary precisely.
- References: `02-architecture.md` C-3-0c/e, `06-ib-nurture-schema-spec.md` C-3-0c/e, `08-iia-schema-policy-test-design.md` C-3-0e/C-3-1, `09-pilot-readiness.md` C-3-0b/e/C-3-1.

### 2026-07-20 — Leaving disabled recovery and qualification without authoritative trust paths

- Symptom: Execution lookup had to work after activation disablement but ordinary invocation signing required an active row; qualification/invalidation had signed envelopes but no sole signer, append-only current-state authority, or fail-closed resolver.
- Context: Post-commit response loss must remain recoverable without reopening business authority, and activation must know whether an immutable component is currently qualified after later invalidation.
- What we tried: Reusing the ordinary API/worker principal for lookup and treating the qualification envelope or latest CI result as sufficient state.
- Root cause: Recovery classification, business invocation, evidence sealing, qualification governance, activation mutation, and Technical Operator responsibilities were not separated into distinct trust domains.
- Fix / workaround: `scenario_activation_admission_source_v1` defines a dedicated `my-chat-execution-recovery` caller/issuer/audience/endpoint/key/verifier lane bound to frozen provenance and prohibited from business/presenter/delivery effects. A separate `c3_qualification_controller` appends signed predecessor-linked events to the content-addressed store; the current-state resolver validates the unambiguous chain and fails closed. Technical Operator remains disable/request-only.
- Prevention: Cross-product tests reject credential/endpoint substitution and every forbidden lookup side effect; activation tests require the current qualification/Go resolvers and deny on outage, revoked signer, divergent chain, cached status, or invalidation.
- References: `02-architecture.md` C-3-5, `06-ib-nurture-schema-spec.md` C-3-5, `08-iia-schema-policy-test-design.md` C-3-0b-3/C-3-5, `09-pilot-readiness.md` C-3-0b-3/C-3-5b/c/f.

### 2026-07-20 — Reimplementing shared C-3 baselines and conflating same-named technical states

- Symptom: C30 and C31 both appeared to build the same contracts/Host runtime/owner baseline, while candidate and provider delivery both used an unqualified `skipped`; setup fixtures and J1 also left unclear whether accepted authority or a second business seed had been pre-created.
- Context: Cross-repository adoption must remain a DAG with attributable evidence, and the two fanout state machines have different owners and transitions.
- What we tried: Allowing “lands first or in one series” without explicit `requires` edges, using bare status literals, and describing pending invitation topology without its Host/Nurture/Roster correlation.
- Root cause: Implementation nodes described outputs but not immutable predecessor consumption; evidence shorthand omitted the exact initial and duplicate-effect assertions.
- Fix / workaround: The DAG is strict `C30 -> C31 -> C32 -> C33 -> C34 -> C35`, with C30 the sole baseline owner and C35-I1 additive convergence. Status fields are explicitly `materialization_status` versus `delivery_status` with no mapping. The fixture ends at a correlated pending Host invitation + Nurture intent + unlinked RosterEntry; real C-3 paths create accepted authority. J1 materializes G1/G2 rows from one Handoff and proves the second delivery creates no second seed/Handoff.
- Prevention: Dependency tests require every predecessor evidence ref, state-machine tests assert independent transitions, and rendered setup/journey evidence inventories every pre-created versus user-created fact.
- References: `01-plan.md`, `02-architecture.md` C-3-1/4/5, `08-iia-schema-policy-test-design.md` C-3-1/4/5, `09-pilot-readiness.md` C-3-1e/C-3-4/C-3-5a/d.

### 2026-07-20 — Letting legacy roles, thread membership, and actor bytes remain executable

- Symptom: Older policy tables allow ThreadParticipant, Institution Admin, or Lead designation to read/write family communication, while a legacy `businessActorRef` still appears to identify the actor for an activated C-3 command.
- Context: C-3 requires an exact current operational Caregiver RoleAssignment, original Grant, and acknowledge claim; the ordinary business actor is one typed Nurture Participant. Thread membership is only a projection locator, and Admin/Lead labels are not operational Caregiver authority.
- What we tried: Keeping pre-C3 predicate/type examples as broadly reusable defaults while adding narrower C-3 prose elsewhere.
- Root cause: Historical schema and policy vocabulary remained syntactically implementable and therefore formed a second authority path.
- Fix / workaround: Mark the legacy surface/policy/type material non-activatable. Activated C-3 requires versioned predicates, typed Participant actor fields with Restrict FK, separately named Host-principal provenance, and exact claimant/RoleAssignment/Grant checks. Services, recovery callers, provisioners, Notification workers, and Technical Operators never populate the Participant actor.
- Prevention: Contract and DB tests reject legacy actor reads/writes, ThreadParticipant allow/deny decisions, Admin/Lead substitution, peer/new-role reply, and missing typed actor/provenance fields.
- References: `06-ib-nurture-schema-spec.md` C-3 action and 7.2/7.4, `08-iia-schema-policy-test-design.md` R7/R8 and 4.2/4.3, `09-pilot-readiness.md` C-3-0d/C-3-3.

### 2026-07-20 — Treating invalid recovery requests as a valid unknown outcome

- Symptom: Unknown signer, replayed nonce, malformed codec, or wrong admission/request/command/Run/Step/principal binding enters the status resolver and returns `unknown`.
- Context: `unknown` describes an authenticated exact-bound request whose compatible owner evidence cannot yet distinguish committed from no effect; the value is not an authentication or authorization error bucket.
- What we tried: Failing closed by mapping every lookup failure to the same protocol state.
- Root cause: Transport denial and owner-state uncertainty were conflated, allowing invalid callers to reach the writer fence and making telemetry/recovery semantics ambiguous.
- Fix / workaround: The dedicated recovery verifier performs exact caller/credential/signature/issuer/audience/endpoint/codec/nonce/frozen-binding checks first. Failure returns a generic transport deny/unavailable response with zero status/fence/application call; My-Chat retains local `outcome_unknown/quarantined`. Only a valid request may return protocol `unknown` for lock timeout, possible in-flight work, store outage, or compatible-evidence ambiguity.
- Prevention: Negative tests assert zero downstream calls for every transport/binding defect and separately exercise each authenticated `unknown` cause.
- References: `02-architecture.md` C-3-5 recovery, `06-ib-nurture-schema-spec.md` C-3-5, `08-iia-schema-policy-test-design.md` admission-status tests, `09-pilot-readiness.md` C-3-5c/e.

### 2026-07-20 — Creating circular evidence activation or qualification authority

- Symptom: A disposable C-3 evidence row requires the qualification/E decisions that the evidence run is supposed to produce, and C35-I10 requires its own qualification event before the controller can emit that event.
- Context: C-3 qualification must run the production activation path in an isolated synthetic environment without granting Pilot authority or bypassing the final current-state resolver.
- What we tried: Applying one unconditional qualification/Go resolver predicate to every candidate kind and describing the envelope/event/resolver as one undifferentiated I10 prerequisite.
- Root cause: Evidence execution, qualification commit, Pilot authorization, and qualification exit were collapsed into one authority phase.
- Fix / workaround: `c3_component_v1` accepts only current Base-owned `c3_evidence_run_authorization_v1`, signed by the isolated evidence controller and resolved from an append-only fail-closed My-Chat store for one disposable scope; the path makes zero qualification/E resolver calls. `complete_pilot_v1` requires current C-3 qualification, E decision, and Pilot-1 deployment. I10 is ordered: complete I0–I9 and prequalification seal; CAS-append the deterministic signed `verifying` genesis; controller signs the envelope and CAS-appends the qualified/rejected child; resolver returns `qualified_default_off`; then I10 success exits.
- Prevention: Cross-kind negative tests, authority signer/trust/revocation/outage/expiry tests, zero-resolver-call disposable tests, genesis-crash retry, deterministic event idempotency, unique-head predecessor CAS, concurrent qualify/invalidate conflicts, and resolver-exit assertions prohibit hidden bypass or self-reference.
- References: `02-architecture.md` C-3-5, `06-ib-nurture-schema-spec.md` C-3-5, `08-iia-schema-policy-test-design.md` qualification/activation tests, `09-pilot-readiness.md` C-3-5a-c/f.

### 2026-07-20 — Mutating the C-3 component while claiming an additive C-4 extension

- Symptom: adding Institution surfaces, producers, schema, and routes to the same manifest/module/build makes the C-3 candidate contain capabilities that its qualification explicitly proved absent, while a nested C-3 id still labels the new artifact as unchanged.
- Context: C-4 must reuse C-3 Guardian/Caregiver capabilities and generic Host renderer/runtime seams without invalidating the immutable component evidence or creating an E-to-candidate authorization cycle.
- What we tried: treating one later repository commit and combined Prisma schema as sufficient proof that the old C-3 source, manifest, migration, and artifact identities remained intact; using the C-3 disposable authority or future Pilot-0-E decision to run C-4 evidence.
- Root cause: source evolution, component identity, manifest composition, migration order, evidence execution, qualification, and Pilot authorization were collapsed into one monolithic release identity.
- Fix / workaround: freeze the content-addressed C-3 component and migration ledger; add a separate `nurture.institution.iib.v1` fragment, C-4 sources/migrations, extension candidate, deterministic composition recipe, and composite candidate; use a separate pre-E `c4_composite_v1` evidence authority and C-4 qualification chain. Current C-3 qualification is only a fail-closed evidence-admission predicate. D creates the later complete candidate and E only reviews it.
- Prevention: composition conformance rejects collision, partial fragment, C-3 redeclaration, changed nested hash, legacy fallback, migration drift, and unpinned rebuild. Candidate tests reject qualification/evidence/E/deployment/activation values in identity. Teardown proves every switch false, active Workspace rows empty, evidence authority revoked, disposable credential destroyed, and no traffic.
- References: `02-architecture.md` section 14, `06-ib-nurture-schema-spec.md` section 12, `08-iia-schema-policy-test-design.md` C-4-0 tests, `09-pilot-readiness.md` C-4-0.

### 2026-07-20 — Collapsing Host invitation, Participant, Caregiver, and Lead into one staff grant

- Symptom: an Admin-entered contact or accepted workspace invitation immediately creates teacher access, the first teacher becomes Lead, provider retry duplicates a role, or a later same-user role silently inherits an old claim.
- Context: Institution setup crosses My-Chat identity/contact ownership and Nurture participant/role ownership, while Pilot requires exactly one operational Caregiver and a separately designated Lead.
- What we tried: mapping `initiate_participant_invitation` directly to a Host invite, assigning a generic role after delivery, representing Lead in Group/policy JSON, or using one Workflow Step/Handoff to carry recipient and business authority across both databases.
- Root cause: identity delivery, user acceptance, Participant correlation, operational role, Lead responsibility, and work-claim episode were treated as one state even though each has a different owner, transaction, replay identity, and revocation rule.
- Fix / workaround: My-Chat creates a non-deliverable contact shell; Nurture commits a seven-day exact Staff Invitation intent; My-Chat activates delivery; exact Host acceptance commits membership; a signed callback binds/reuses Participant and consumes the intent; Admin then separately creates one exact Caregiver role and one Lead RoleAssignment bound by typed self-FK to that role episode. Role revoke terminalizes the bound Lead but preserves Participant/history and derives body-free staffing review.
- Prevention: saga tests cover every response-loss, cancel/reissue/expiry/accept race and raw-contact boundary. Role tests reject assignment before consumed intent, generic role/scope/permission, Lead without exact Caregiver, more than one Lead, Admin/Caregiver overlap, same-user old-claim inheritance, and Step/Handoff invitation transport.
- References: `02-architecture.md` C-4-1, `06-ib-nurture-schema-spec.md` sections 12.3/12.4, `08-iia-schema-policy-test-design.md` C-4-1 tests, `09-pilot-readiness.md` C-4-1.
### 2026-07-20 — Collapsing roster intake, Host invitation, child profile, and Enrollment

- Symptom: A RosterEntry becomes a shadow child profile or carries one mutable Host invitation pointer, and Host acceptance appears to enroll the child.
- Context: Institution intake must remain usable before a family has adopted My-Chat, while longitudinal child identity and relationship authority remain family-confirmed.
- What we tried: correlating delivery with one Roster field, treating accepted Host membership as consumed business invitation, or updating institution prefill into an existing child by label/date/contact match.
- Root cause: Institution-local intake, Host identity coordination, family-owned profile authority, and Enrollment confirmation were collapsed into one record or lifecycle.
- Fix / workaround: C-4-2 keeps RosterEntry minimal `active|linked|closed`, stores invitation correlation on versioned EnrollmentInvitation intent lineage, treats Host acceptance as identity/membership evidence only, and lets only the exact C-3 family confirmation atomically consume the intent/create Enrollment/link Roster. Grant and Thread remain later independent family authorization.
- Prevention: Lifecycle, privacy, response-loss, reissue lineage, first-commit-wins, profile-retention-after-decline, no-fuzzy-match, no-implicit-Grant, and fresh-re-entry tests must all bind the same composite candidate.
- References: `02-architecture.md` C-4-2, `06-ib-nurture-schema-spec.md` section 12.6, `08-iia-schema-policy-test-design.md` C-4-2 tests, `09-pilot-readiness.md` C-4-2.

### 2026-07-20 — Making Enrollment notification the business transition or replay authority

- Symptom: transfer/service close waits for provider success, an old Notification executes a transition, a late Guardian receives backfill, or another Step reconstructs a lost snapshot from current recipients.
- Context: Institution Enrollment mutations are Nurture-local facts, while My-Chat provides optional durable relationship attention and retry/recovery.
- What we tried: direct-empty transfer proposal followed by asynchronous audience lookup, storing target/status in Notification, requiring active Enrollment for terminal-history open, or treating delivery failure as transaction compensation.
- Root cause: business commit, commit-time audience, Handoff materialization, provider delivery, owner presentation, and re-entry were treated as one distributed lifecycle.
- Fix / workaround: C-4-3 keeps Hold/cancel explicit-empty, makes transfer proposal/service close claimed-Step before commit, stores immutable commit-time per-role snapshots or `[]`, and opens through current owner reread. Transfer confirmation remains C-3, terminal history does not require active Enrollment/Grant, and re-entry remains a fresh invitation.
- Prevention: same-Step/wrong-Step, zero/partial audience, no-backfill, stale/open, provider/owner outage, terminal-history, retained-role/new-role, and no-compensation tests bind the exact composite candidate.
- References: `02-architecture.md` C-4-3, `06-ib-nurture-schema-spec.md` section 12.7, `08-iia-schema-policy-test-design.md` C-4-3 tests, `09-pilot-readiness.md` C-4-3.

### 2026-07-20 — Reassigning or silently suppressing work after claimant offboarding

- Symptom: a new Caregiver can read/reply to an old claimed question, the Item stays acknowledged forever, Institution closes by fabricating a reply, or family receives no terminal status because suppression hides the operational failure.
- Context: C-3 deliberately binds protected work to one exact Caregiver role episode, while a complete Institution product still needs an auditable no-takeover resolution and safe family continuity.
- What we tried: a mutable staffing-case aggregate, claim transfer, generic Item close, privacy suppression, widening `user_attention`, or direct-empty close followed by asynchronous current-recipient lookup.
- Root cause: staffing responsibility, protected receiver authority, operational terminal outcome, privacy invalidation, and Host notification were collapsed into one lifecycle.
- Fix / workaround: C-4-4 derives the case from canonical Item/Attention/terminal-role facts, closes only through exact Admin claimed-Step as typed `claimant_role_ended_unfulfilled`, creates no reply/reassignment, and emits a separate generic `family_care_status_attention` cohort frozen at commit. C-3 terminal presentation remains immutable and safe.
- Prevention: exact predicate/no-aggregate, closed-versus-suppressed, terminal-role/reply, privacy/topology race, old/new role, zero/partial audience, no-backfill, Group-pause/technical-disable, protected-field scan, and rendered family/Institution/teacher tests are qualification gates.
- References: `02-architecture.md` C-4-4, `06-ib-nurture-schema-spec.md` section 12.8, `08-iia-schema-policy-test-design.md` C-4-4 tests, `09-pilot-readiness.md` C-4-4.

### 2026-07-20 — Folding candidate identity, evidence authority, qualification, and Pilot approval together

- Symptom: C-4 rebuilds mutable C-3 source, qualification digests enter candidate identity, Pilot-0-E appears to authorize pre-E evidence, a failed test alone is rerun, or a qualified label is treated as an active Workspace gate.
- Context: C-4 must prove a new Institution extension over an already qualified immutable Guardian/Caregiver component without creating a hash/authority cycle or silently enabling traffic.
- What we tried: one monolithic release hash, one controller for evidence/qualification/Pilot activation, parallel cross-repo adoption, cached status, or a combined test pass with no layer/journey/teardown identities.
- Root cause: build identity, disposable evidence execution, signed qualification, complete-Pilot operations, deployment, and activation were treated as one phase.
- Fix / workaround: C-4-5 requires current C-3 qualification, strict C40–C45, separate extension/composite candidates, isolated `c4_evidence_run_authorization_v1`, L0–L7/JI1–JI8, a pre-seal followed by signed C-4 qualification, and final false/empty teardown. D/E/Pilot-1/2 remain later identities and authorities.
- Prevention: candidate-field negatives, cross-kind/controller tests, deterministic qualification genesis/recovery, source/migration/hash drift, three fresh high-risk runs, no-retry rule, current nested resolver checks, and exact `C4_QUALIFIED_DEFAULT_OFF / PILOT0_D_PENDING / EXTERNAL_TRAFFIC_NO_GO` exit.
- References: `02-architecture.md` C-4-5, `06-ib-nurture-schema-spec.md` section 12.9, `08-iia-schema-policy-test-design.md` C-4-5 tests, `09-pilot-readiness.md` C-4-5.

### 2026-07-20 — Letting later C-4 normalization coexist with older lifecycle and authority shorthand

- Symptom: Roster has both `closed` and `withdrawn|ended|transferred` statuses, JI1 needs a D-owned provisioning authority before D, complete-Pilot admission checks only C-3, one consumed staff intent can create another role, or C-4 treats a no-reply resolved Item as if C-3 had already defined it.
- Context: C-4 extends an immutable C-3 component and must also refine older C2f planning language without creating a second schema, evidence authority, or activation predicate.
- What we tried: leaving historical shorthand unqualified, using a generic pre-E evidence controller for C0 bootstrap, relying on nested candidate ids as authority, accepting Host `already_member` as staff acceptance, or assuming generic terminal presentation implied a valid source graph and delivery fence.
- Root cause: later normalization, disposable evidence execution, current authority, identity invitation, canonical business graph, and presentation were not traced as separate layers.
- Fix / workaround: C-4 makes Roster canonical `active|linked|closed + terminalReason`; adds single-use isolated bootstrap evidence while leaving real Pilot provisioning to D; requires current C3+C4+E+Pilot-1 deployment for complete-Pilot admission; makes Staff intent single-use with explicit existing-member acknowledgement; and adds a C-4 complete-graph adapter plus privacy-after-close and pre-send Grant/Enrollment/redaction/retention checks.
- Prevention: supersession searches, separately named source-set hashes, wrong-authority/old-intent/replayed-bootstrap negatives, four-authority activation tests, C-3 versus C-4 graph conformance, and send/open fence separation are mandatory before C-4 qualification.
- References: `02-architecture.md` C-4-0/C-4-5, `06-ib-nurture-schema-spec.md` sections 12.4/12.6/12.8/12.9, `08-iia-schema-policy-test-design.md` C-4 tests, `09-pilot-readiness.md` C-4-0 through C-4-5.

### 2026-07-20 — Consuming cross-database bootstrap authority before owner outcome is recoverable

- Symptom: My-Chat consumes a one-time authorization, then crashes before Nurture commits or loses the response after Nurture commits; the first case cannot retry and the second cannot recover without risking a duplicate effect.
- Context: Pre-D C-4 evidence must exercise the real C0 handler across separate Host and Nurture databases while retaining exact replay.
- What we tried: atomically consuming the Host authorization before the owner call and treating any later replay as forbidden.
- Root cause: transport attempt, authorization use, owner commit, and recovered outcome were collapsed into one cross-database instant that does not exist.
- Fix / workaround: claim one deterministic body-free `C4BootstrapEvidenceOperationV1` without consuming success; bind accepted invitation/membership/spec/handler/request/command/principal/payload; rely on Nurture CommandExecution idempotency; and classify only through isolated `committed|confirmed_no_effect|unknown` recovery. Consume on committed, bounded-retry only the same confirmed-no-effect operation, and quarantine unknown.
- Prevention: crash-before-call, claim-before-send, commit-before-response-loss, wrong binding, exact/different replay, expiry/revoke during claim, unknown quarantine, and teardown tests are mandatory.
- References: `02-architecture.md` C-4 evidence authority, `06-ib-nurture-schema-spec.md` section 12.9, `08-iia-schema-policy-test-design.md` C-4-5 tests, `09-pilot-readiness.md` C-4-0/C-4-5.

### 2026-07-20 — Reusing one activation profile across component evidence, composite evidence, and complete Pilot

- Symptom: a C-3-only or C-4 disposable evidence row can be interpreted as complete-Pilot activation, or C-4 design pre-authorizes D topology/configuration that does not yet exist.
- Context: the same positive-only activation table carries stage-typed rows, but each candidate kind has a different complete source/runtime bundle and authority predicate.
- What we tried: one additive `nurture_institution_ecology_pilot_v1` profile for both C-4 evidence and complete-Pilot rows.
- Root cause: evidence composition and deployable Pilot composition were treated as the same artifact.
- Fix / workaround: C-3 evidence uses `nurture_guardian_caregiver_pilot_v1`; C-4 disposable evidence uses only `nurture_institution_composite_evidence_v1`; Pilot-0-D later locks a third exact complete-Pilot profile into the D candidate. No inference, alias, or fallback is legal.
- Prevention: profile/candidate-kind cross-product negatives, normalized profile content hashes, candidate binding, and D-profile absence checks remain qualification gates.
- References: `02-architecture.md` C-3-5/C-4-5, `06-ib-nurture-schema-spec.md` section 12.9, `08-iia-schema-policy-test-design.md` C-4-5 tests, `09-pilot-readiness.md` C-3-5c/C-4-5.

### 2026-07-20 — Retaining unverified roster PII as permanent audit

- Symptom: an ignored, declined, cancelled, expired, or manually closed invitation leaves a child's institution-entered label/age/birth prefill visible indefinitely even though no family ever confirmed the record.
- Context: RosterEntry is a useful intake/audit shell but is not a longitudinal child profile or justification for perpetual personal-data retention.
- What we tried: keeping the complete immutable Roster row and applying only status closure.
- Root cause: business audit retention and unverified personal-field retention were treated as one lifecycle.
- Fix / workaround: unverified PII has an absolute 30-day deadline; terminal invitation without successor accelerates purge to seven days; manual close erases immediately; retention closure leaves only a body-free shell. Link clears Institution prefill, uses a Guardian-confirmed safe label, and de-identifies that label after 365 days. Restore replays erasure before reads.
- Prevention: retention-worker/race, reissue-no-extension, link-time replacement, presenter/cache/export/log, backup/restore, and no-revival tests bind the same candidate.
- References: `02-architecture.md` C-4-2, `06-ib-nurture-schema-spec.md` section 12.6, `08-iia-schema-policy-test-design.md` C-4-2 tests, `09-pilot-readiness.md` C-4-2.

### 2026-07-20 — Treating one absent bootstrap lookup as confirmed no effect

- Symptom: Host retries or tears down after one missing CommandExecution read while an accepted C0 writer may still be in flight, creating a late commit or second effect.
- Context: Pre-D JI1 crosses Host and Nurture databases without a distributed transaction and must classify response loss deterministically.
- What we tried: interpreting an absent status response, elapsed request timeout, or expired authorization as proof that the owner did not commit.
- Root cause: transport observation was mistaken for a linearized owner outcome.
- Fix / workaround: `confirmed_no_effect` requires all issued attempts terminal, latest claim expiry plus skew and the bounded owner-transaction deadline elapsed, acquisition of the exact C0 writer fence, and fence-protected absence of the deterministic CommandExecution. Lock timeout, store/owner outage, possible in-flight work, ambiguity, or one absent read remains `unknown`; the operation stays claimed and `outcome_unknown` until convergence.
- Prevention: writer-fence, late-writer, timeout/outage, concurrent lookup, exact absent-under-fence, and teardown-blocking tests must bind one deterministic operation.
- References: `02-architecture.md` C-4 evidence authority, `06-ib-nurture-schema-spec.md` section 12.9, `08-iia-schema-policy-test-design.md` bootstrap-recovery linearization tests, `09-pilot-readiness.md` C-4-0/C-4-5.

### 2026-07-20 — Creating one Workflow Handoff draft per recipient

- Symptom: one relationship or status business effect creates multiple drafts/Handoffs, makes partial recipient delivery look like multiple business effects, or lets recipient membership drift between drafts.
- Context: Nurture owns the exact commit-time Guardian RoleAssignment audience, while My-Chat owns technical delivery fan-out.
- What we tried: binding the draft key directly to each recipient RoleAssignment episode and materializing one Handoff per role.
- Root cause: business replay seed identity and per-recipient delivery identity were collapsed.
- Fix / workaround: zero eligible recipients stores `[]`; otherwise Nurture stores one cohort-level draft keyed by business effect/purpose/source plus canonical commit-time recipient-set hash, yielding at most one Handoff. My-Chat derives per-recipient candidate/link identities beneath that Handoff and owner-rereads each recipient before send/open.
- Prevention: zero/one/two-recipient, canonical set-order, duplicate/partial candidate materialization, late-join/no-backfill, role-loss, and same-Step/wrong-Step tests must assert one business effect and at most one Handoff.
- References: `02-architecture.md` C-2f-5/C-4-3/C-4-4, `06-ib-nurture-schema-spec.md` relationship-attention rules, `08-iia-schema-policy-test-design.md` recipient snapshot tests, `09-pilot-readiness.md` C-3-2/C-4-3/C-4-4.

### 2026-07-20 — Assuming My-Chat had no platform Child/Family identity after the boundary changed

- Symptom: Active C-3/C-4 documents still said My-Chat owned only adult accounts and had no canonical Child or stable cross-scenario correlation after My-Chat introduced protected Child/Family ownership.
- Context: The platform identity direction is compatible with Nurture ownership only when shared identity and workspace-local care subject/authority are modeled as separate layers.
- What we tried: Preserving the historical “all child/family identity is Nurture-local” shorthand and treating the workflow-contract pin as the complete future dependency.
- Root cause: A late cross-repository ownership change was reviewed as schema drift instead of a semantic dependency change, so the current context contract and Pilot decision bundle diverged.
- Fix / workaround: The prior no-platform-Child wording is superseded. My-Chat owns protected Child/Family identity, stewardship/membership, and binding lifecycle; Nurture owns local Child/Process/child-scoped Family and all care authority. C-3 adds independently pinned `platform_child_family_identity_source_v1`. My-Chat `db22de6` remains schema-only observed input and cannot satisfy adoption or replace the historical workflow pin.
- Prevention: Every final cross-repository review compares current repository ownership contracts and candidate source registries, not only pinned package bytes. A platform identity revision must invalidate qualification until schema/migrations/runtime/APIs, owner adoption, and joint conformance are complete.
- References: `docs/context/workflow/nurture-scenario-contract.md`, `00-overview.md`, `02-architecture.md` C-4-5, `06-ib-nurture-schema-spec.md` 3.2a, `08-iia-schema-policy-test-design.md` C-3/C-4 identity tests, `09-pilot-readiness.md` C-4-5.
- Supersession note: this entry also replaces any earlier historical “current rule” sentence in this ledger that says My-Chat owns only account/shell or that all Child/Family identity belongs to Nurture; those entries remain historical evidence, not executable guidance.

### 2026-07-20 — Pointing a platform scenario binding at a workspace-local Nurture object

- Symptom: One My-Chat `(Child|Family, scenarioKey)` binding appeared to point directly at one workspace-local `NurtureChild`, ChildCareProcess, or child-scoped Family, making cross-workspace reuse and one-Family/multiple-child cardinality impossible or ambiguous.
- Context: My-Chat bindings are scenario-global, while Nurture profiles and Family/Process facts are workspace- and child-scoped.
- What we tried: Adding a nullable `myChatChildId` to `NurtureChild` or storing the local object ref directly as binding `ownerRef`.
- Root cause: Global identity correlation, scenario binding endpoint, local dossier identity, and business authority were collapsed into one foreign-key-like relation across database owners.
- Fix / workaround: My-Chat `ownerRef` points only to typed scenario-global `NurtureChildBindingAnchor` / `NurtureFamilyBindingAnchor`. Separate exact workspace associations map anchors to local Child and `(Family anchor, Child anchor)` to child-scoped Family/Process. Anchors are body/PII/authority-free, invisible, and unavailable to ordinary list/count/existence queries.
- Prevention: Schema/cardinality tests require bidirectional child mapping uniqueness, pair-scoped family mapping, one Family/multiple-child denial, W1/W2 noninterference, wrong-workspace no-leak behavior, and static absence of direct platform ids on local profiles.
- References: `docs/context/workflow/nurture-scenario-contract.md`, `02-architecture.md` object model/C-4-5, `06-ib-nurture-schema-spec.md` 3.2a, `08-iia-schema-policy-test-design.md` identity tests, `09-pilot-readiness.md` C-4-5.

### 2026-07-20 — Letting a binding anchor become cross-workspace authorization or discovery

- Symptom: Reusing one platform identity/anchor could be read as permission to list another workspace's dossier, authorize through binding/membership alone, auto-merge profiles, or let Institution intake create a child before a parent participates.
- Context: Exact identity reuse is necessary for parent-first and Institution-invited growth, but privacy and authority remain local to each Nurture relationship graph.
- What we tried: Treating the anchor as a subject, repository lookup key, cache correlation id, or provisional profile; alternatively banning all global identity reuse and copying profile basics between workspaces.
- Root cause: Routing identity, local association, relationship authority, dossier portability, and Institution intake were not independently fenced.
- Fix / workaround: Product resolution first verifies exact Workspace and current Host binding/membership evidence, performs one exact compound association lookup, and immediately reads current local role/scope plus all Nurture predicates before returning a result. Roster/Intent is the only Institution provisional path and stores no platform/anchor candidates. Global revoke fences routing without rewriting facts; local exit does not mutate global binding; merge conflicts quarantine; the old copy-and-reconfirm profile protocol is withdrawn.
- Prevention: Tests deny anchor/binding/stewardship/membership/id-only reads, cross-workspace list/count/existence, one-Family cross-child access, Institution minting, automatic merge/rebind, and platform-id/anchor leakage across every client/delivery/telemetry/search destination.
- References: `docs/context/workflow/nurture-scenario-contract.md`, `02-architecture.md` C-2a/C-2f/C-4-5, `06-ib-nurture-schema-spec.md` Roster/anchor rules, `08-iia-schema-policy-test-design.md` C-2f/C-4 tests, `09-pilot-readiness.md` C-2f-4-3/C-4-2/C-4-5.

### 2026-07-20 — Reusing P0/P1 labels across design review, traffic readiness, and qualification

- Symptom: The current Pilot checkpoint claimed zero P0/P1/P2 while the same readiness document listed six P0 and three P1 blockers, so a reader could interpret a design-review PASS as permission for traffic.
- Context: Pilot-0-C separately evaluates decision quality, missing implementation/operations for real traffic, and findings against a future immutable qualification candidate.
- What we tried: Using one unqualified severity vocabulary and relying on nearby prose such as `NO-GO for external traffic` to disambiguate it.
- Root cause: Three independent gates shared one label namespace, and the 3975-line decision ledger was also used as the status entrypoint.
- Fix / workaround: Current status uses `DR-P0/DR-P1/DR-P2`; traffic blockers use `TR-P0/TR-P1`; candidate qualification uses `QR-P0/QR-P1`. `10-pilot0-c-current-decision-index.md` is the concise status/precedence entrypoint, while `09-pilot-readiness.md` remains the detailed ledger.
- Prevention: Current summaries and exit criteria MUST use qualified severity labels. A design PASS cannot close traffic or qualification findings, and a future candidate result cannot rewrite the decision ledger.
- References: `10-pilot0-c-current-decision-index.md`, `00-overview.md`, `01-plan.md`, `04-verification.md`, `09-pilot-readiness.md`.

### 2026-07-20 — Describing the opaque platform/local binding in two incompatible ways

- Symptom: One section called `child_id/family_id` required canonical refs while another prohibited raw platform ids in Nurture, leaving implementers to choose between direct-id persistence and an anchor-only path.
- Context: My-Chat owns shared protected identity; Nurture owns local care dossiers. The cross-database relationship must be stable without copying platform identity fields or turning routing into authority.
- What we tried: Documenting the My-Chat scenario binding and the Nurture anchor association separately without stating that their composition is the repository-required opaque binding.
- Root cause: Owner-side persistence and the end-to-end logical relationship were described at different abstraction levels without an explicit equivalence rule or minimum owner API contract.
- Fix / workaround: The context contract now defines one normative chain: My-Chat raw ids -> My-Chat typed scenario-binding owner refs -> Nurture typed anchors -> workspace-local associations -> local Child/Process/Family. Raw ids remain in My-Chat. The contract also fixes the minimum owner API responsibilities and makes concrete types/ports a mandatory C30-I1/I2 deliverable before candidate freeze.
- Prevention: Cross-repository reviews must trace both owner stores and the signed current-evidence boundary. Direct-id persistence, anchor-as-authority, raw-id wire leakage, unspecified fallback, and candidate freeze without a pinned owner API all fail.
- References: `AGENTS.md`, `docs/context/workflow/nurture-scenario-contract.md`, `06-ib-nurture-schema-spec.md`, `10-pilot0-c-current-decision-index.md`.

### 2026-07-20 — Blanket anchor-leakage language forbidding the private owner envelope

- Symptom: The owner API contract required typed anchor refs in short-lived signed current-owner evidence while nearby privacy text said anchors could never appear in any evidence body.
- Context: Nurture needs an opaque endpoint to join My-Chat's current binding decision to one exact local association without receiving raw platform identity.
- What we tried: Expressing the privacy rule as an absolute destination ban instead of an explicit minimum allowlist.
- Root cause: Qualification/operational evidence and the private request-time owner envelope were both called “evidence,” even though they have different audiences and retention.
- Fix / workaround: Anchors are allowed only in My-Chat scenario-binding `ownerRef`, Nurture anchor/association persistence, the short-lived private signed current-owner envelope, and the strongly authenticated reconciliation boundary. Client, UI, Chat, Notification, Handoff, provider, telemetry, analytics, search, shared cache, and qualification/operational evidence remain forbidden.
- Prevention: Privacy contracts for opaque identifiers must name the exact allowed carriers before listing forbidden destinations; conformance covers both required private carriage and leakage denial.
- References: `docs/context/workflow/nurture-scenario-contract.md`, `06-ib-nurture-schema-spec.md`, `09-pilot-readiness.md`, `10-pilot0-c-current-decision-index.md`.

### 2026-07-21 — Making Pilot-0-E depend on the deployment it authorizes

- Symptom: “complete candidate” could be read as a live Pilot environment even though Pilot-1 provisioning is allowed only after E.
- Context: E must review executable bytes and exact topology/operations semantics without creating cloud state, secrets, databases, or traffic.
- Root cause: Candidate inputs, pre-deployment evidence, approval, and deployment binding were treated as one release object.
- Fix / workaround: D locks a deterministic recipe. Current qualified C-3/C-4 plus implemented D inputs assemble an immutable undeployed candidate; a separate D evidence seal proves it; E signs that exact pair; Pilot-1 later publishes the same OCI bytes and binds real resources/secrets in `pilot_deployment_binding_v1`.
- Prevention: Candidate identity excludes qualification state, D evidence, E, ACR tag/URL, live resources, secret values, activation and observations. Any binary/behavior/schema/topology input change creates a new candidate and invalidates the old E decision.
- References: `11-pilot0-d-topology-operations-contract.md` D-0/D-2/D-7, `09-pilot-readiness.md` Pilot-0-D.

### 2026-07-21 — Reusing the kill-switch rehearsal row for observation

- Symptom: Pilot-3 must delete/disable its activation row, Technical Operator cannot re-enable, but Pilot-4 was described as following the rehearsal without a new authority.
- Context: Kill-switch evidence is invalid if the stopped authority can be silently restored or extended.
- Root cause: Pilot-2/3 rehearsal and Pilot-4 observation were modeled as one activation lease.
- Fix / workaround: Pilot-3 permanently ends its row and leaves capability false/active rows empty. Pilot-4 requires a new signed stage/resume decision and a newly created exact row. Any later kill, restore, binding/config/trust change, or evidence gap terminates the 120-hour window and requires a fresh authorization/window.
- Prevention: Technical Operator remains disable-only; activation rows cannot be restored, copied, auto-renewed, wildcarded, or retargeted. Tests require final false/empty census and two distinct row identities.
- References: `11-pilot0-d-topology-operations-contract.md` D-3/D-7, `09-pilot-readiness.md` success/rollback contract.

### 2026-07-21 — Letting Pilot-3 terminal transitions invalidate their own plan

- Symptom: the rehearsal plan required row removal, capability closure, binding rotation, plan consumption, and stage-authority consumption, while also saying any bound-head drift or consumed authority invalidated the plan.
- Context: Pilot-3 must end effect-decreasing and provide independently verifiable provenance without leaving an executable rehearsal authority.
- What we tried: binding the plan to only the initially current heads and adding a prose exception for the final rotation.
- Root cause: execution currentness and historical lineage verification were collapsed, and the complete terminal sequence was not enumerated.
- Fix / workaround: lock the sole successful lineage as `gates_closed -> final_binding_bound -> plan consumed_success -> Pilot-2 stage authority consumed -> terminal seal`. Transition mode accepts a valid partial prefix only to append/retrieve the next successor; consumed plan/stage heads prove only stage consumption/sealing respectively. Verification mode accepts historical consumed heads only through the complete append-only chain.
- Prevention: conformance rejects early consume/seal, missing/duplicate/divergent successor, order gap, attempted re-enable, unrelated deployment/config drift, and every terminal state other than the exact consumed lineage.
- References: `11-pilot0-d-topology-operations-contract.md` D-3/D-7, `02-architecture.md` 0.2, `08-iia-schema-policy-test-design.md` Pilot-0-D operations conformance.

### 2026-07-21 — Using ambiguous readiness, sample, and traffic shorthand at a release gate

- Symptom: E “may” require zero P0 and closure of undefined critical P1 items; one P1 mixed an accepted native exclusion with a required Web capability; an extra Pilot-4 question had no terminal result; and “zero external traffic” contradicted public My-Chat ingress.
- Context: release and observation gates need deterministic machine inputs even though the Pilot intentionally allows only internal users through a public Host surface.
- What we tried: relying on list positions, counts, nearby scope prose, and operator interpretation.
- Root cause: one historical finding combined two dispositions, and business-product traffic was not distinguished from denied edge/control/service network traffic.
- Fix / workaround: introduce stable `TR-P0-1..6` and `TR-P1-1|2|3a|3b` ids in `pilot0_traffic_readiness_census_v1`; require all P0 plus P1-1/2/3b closed and permit only P1-3a as `accepted_scope_exclusion`. Derive `externalProductTrafficCount` from exact trusted source session/account/service and recipient/provider boundaries rather than untrusted target claims; external authenticated requests count even when Host-denied, while exact internal wrong-target probes remain internal only when denied before owner effect. Any admitted unplanned Nurture question/effect is `no_pass`; only pre-admission zero-effect denial is a negative probe.
- Prevention: census cross-product tests reject missing/renamed/duplicate/waived rows and wrong exclusions; traffic tests cover allowlisted internal ingress, edge scans, control traffic, external principals/providers, and provider attempts; observation tests cover admitted eighth question versus pre-admission rejection.
- References: `11-pilot0-d-topology-operations-contract.md` D-0.5/D-7, `09-pilot-readiness.md` Blocking findings/Pilot-0-E, `08-iia-schema-policy-test-design.md` Pilot-0-D operations conformance.

### 2026-07-28 — Treating advisory detection as conflict closure

- Symptom: A cross-repository scan can be green as an executed advisory check
  while still returning findings, making an acceptance-only increment look like
  completed dependency cleanup.
- Context: My-Chat/T-030 N2 coordination acceptance for Nurture/T-002.
- Root cause: Work assignment, policy adoption, mechanical detection, source
  cleanup, exact dependency re-pin, and release verification were compressed
  into one “aligned” status.
- What we tried: Re-ran the Base consumer-boundary scanner against the clean
  Nurture baseline and inspected the dependency, direct-import, framework, and
  port surfaces before editing implementation code.
- Fix / workaround: Record acceptance separately from implementation. Keep
  `ECO-CONSUMER-002` and `ECO-CONSUMER-004` open until the local Base artifact
  link and sibling-source import are removed, then require exact My-Chat pin,
  clean install, typecheck/tests, and joint conformance evidence.
- Prevention: Every cross-repository status update states exact revisions,
  repo-qualified owner/task, scanner finding count, effect boundary, and the
  remaining exit gate. Advisory output is evidence of detection only.
- References: `00-overview.md`, `01-plan.md`, `04-verification.md`,
  My-Workflow-Base `docs/context/ecosystem/contract-status.md`, and
  My-Chat/T-030.

### 2026-07-28 — Treating an exact revision/hash pin as source compatibility

- Symptom: The native pin verifier passed after updating the Base and My-Chat
  revisions, but `pnpm typecheck` failed because Nurture still imported removed
  `DomainContextRef` and emitted legacy `{ kind, id }` references.
- Context: The verifier proves immutable source identity and selected
  path-content parity. It does not build linked packages or compile the
  consumer.
- What we tried: Updating only the revision and path-content hashes.
- Root cause: Pin identity, source compatibility, generated package
  materialization, persisted JSON compatibility, and four-repository
  qualification were treated as one gate.
- Fix / workaround: Migrate all shared refs to canonical schema v1, add a
  forward data/CHECK migration, build the exact linked contract before
  typecheck/build/lint and DB jobs, then require native tests plus the
  coordinator-owned federation workflow.
- Prevention: A repin is incomplete until the exact linked package is built,
  the consumer compiles, replay/persistence populations pass, legacy persisted
  refs have a forward migration, and the federated revision lock is green.

### 2026-07-28 — Comparing unrelated hash fields across consumer schemas

- Symptom: Education `scenario_release.source_hash` and Nurture
  `nurtureScenario.contractSha256` appeared different and could be reported as
  cross-project drift.
- Context: The two fields cover different path populations and use different
  lock schemas; equality is not part of either contract.
- Root cause: Both values are SHA-256 strings, so field appearance was mistaken
  for semantic equivalence.
- Fix / workaround: Compare exact Base/My-Chat revisions across consumers, then
  execute each repository's native verifier against its own declared
  population. Record both results without cross-comparing the hash values.
- Prevention: Federation qualification must declare each evidence field's
  algorithm and population identity. Only fields with the same schema,
  algorithm, and population may be compared directly.

### 2026-07-28 — Using a repository-scoped token for an unrelated private package

- Symptom: Clean GitHub runners could check out the public source repositories
  but failed every frozen install that resolved
  `@willyu1007/web-workbench@0.7.0`.
- Context: Nurture consumes a shared UI package published from another public
  repository.
- What we tried: Supplying the calling repository's `GITHUB_TOKEN` with
  `packages:read`.
- Root cause: The token is repository-scoped and did not have access to the
  unrelated private package; the declared shared distribution model and actual
  package visibility disagreed.
- Fix / workaround: With explicit owner approval, change only the package to
  public. Run `30345550728` then passed all four clean-runner install steps.
  GitHub does not support changing this public package back to private.
- Prevention: Keep the package manifest/publishing documentation aligned with
  the intended public distribution model, and prove package resolution from a
  clean unrelated repository before treating a release as consumable.

### 2026-07-28 — Searching serialized canonical refs for the word `version`

- Symptom: Production DB CI failed even though the persisted canonical driver
  correctly omitted the legacy top-level `version` field.
- Context: Canonical schema v1 requires `schema_version`.
- What we tried: `JSON.stringify(ref).not.toContain("version")`.
- Root cause: The substring assertion cannot distinguish forbidden `version`
  from required `schema_version`.
- Fix / workaround: Assert structurally with
  `expect(ref).not.toHaveProperty("version")`; the production DB suite then
  passes `24/24` locally on Node 24.
- Prevention: Validate object keys and values structurally; do not use raw
  substring checks for schemas whose legal field names overlap legacy names.

### 2026-07-28 — Checking out a linked workspace without installing it

- Symptom: The dev-host DB/E2E job failed on a clean runner while the same suite
  passed in a prepared local multi-repository worktree.
- Context: Nurture links `@my-chat/workflow-runtime` to the exact sibling
  My-Chat checkout for source-level qualification.
- What we tried: Installing Nurture and building only the pinned
  workflow-contract package.
- Root cause: The clean runner had My-Chat source files but no installed
  My-Chat workspace dependencies, so runtime source resolution differed from
  the prepared local environment.
- Fix / workaround: Install the pinned My-Chat workspace in the dev-host job
  before running migrations/E2E. The local equivalent passes `19/19`.
- Prevention: Every clean-runner job that executes linked workspace source must
  prepare that workspace explicitly; checkout alone is not dependency
  materialization.

### 2026-07-28 — Upgrading only some Node-based GitHub Actions

- Symptom: Full CI run `30347574708` passed every job but still emitted a
  deprecated Node 20 action-runtime annotation.
- Context: Checkout and setup-node had already moved to v6.
- What we tried: Replacing only the two action families named in the first
  runner annotations.
- Root cause: `pnpm/action-setup@v4` was a third Node-based action with the same
  deprecated runtime and was missed by the narrow scan.
- Fix / workaround: Verify official release metadata and upgrade all four
  `pnpm/action-setup` uses to the current v6 major.
- Prevention: After an action-runtime warning, inventory every `uses:` entry
  and inspect the completed run annotations; do not limit the repair to the
  first action names reported.

### 2026-07-28 — Changing hashed publishing metadata without moving the consumer pin

- Symptom: The package's external visibility was public, but Base still
  declared `publishConfig.access=restricted`; repairing the manifest changed
  Nurture's exact source population even though no UI runtime byte changed.
- Context: Nurture hashes Base's package manifest as one of 58 web-workbench
  source inputs.
- What we tried: Treating visibility as out-of-band package administration
  unrelated to the source qualification lock.
- Root cause: Publishing metadata is part of the consumer's reproducible source
  contract and cannot be corrected independently of its exact revision/hash.
- Fix / workaround: Commit the Base SSOT repair, recalculate the native source
  hash, re-pin Nurture and Education to the exact Base revision, then renew the
  coordinator-owned four-repository qualification.
- Prevention: Before changing package metadata, enumerate every consumer source
  population and qualification lock that includes the manifest.

### 2026-07-28 — Reconstructing a full revision from a short Git prefix

- Symptom: The pin file contained a lowercase 40-character value with the
  intended short prefix, but `git rev-parse --verify <sha>^{commit}` rejected
  it before any source comparison.
- Root cause: The suffix was typed rather than copied from the owning
  worktree's exact `git rev-parse HEAD`.
- Fix / workaround: Replace every affected consumer pin with the exact opaque
  revision and rerun native verifiers.
- Prevention: Never derive or autocomplete Git SHA suffixes; copy the complete
  value from Git output or an authoritative lock.

### 2026-07-28 — Freezing an owner receipt without complete caller scope

- Symptom: The first Host P1 owner-verifier input had typed subject and Actor
  data but omitted Workspace, acting User, and the already-required
  idempotency key; the receipt also omitted Workspace.
- Context: Nurture authority and Participant mapping are Workspace-local, while
  the My-Chat binding command is authenticated as a User plus Actor and may
  replay.
- What we tried: Structurally adopting the initial receipt as the P2 boundary.
- Root cause: The contract was reviewed as a result shape without tracing every
  owner lookup and replay key back to the authenticated Host command context.
- Fix / workaround: Repair My-Chat P1 first, pin exact revision
  `64f4165fe571a46ded094ebf6f771bdea61383d1`, bind the receipt to Workspace,
  and include Workspace/User/Actor/idempotency in the Nurture request hash and
  local authorization evidence.
- Prevention: For every cross-owner receipt, enumerate authentication,
  partition, representation, idempotency, purpose, and expiry inputs before a
  consumer implementation starts.

### 2026-07-28 — Using one generic active state for a multi-step anchor

- Symptom: The first P2 schema draft used `active`, which could not distinguish
  a reserved anchor, a Host-bound endpoint with no local association, and an
  associated local aggregate.
- Context: Response-loss recovery depends on distinguishing `reserved`,
  `bound_empty`, and `associated`; revoked or ambiguous states must fail
  closed.
- What we tried: Treating `active` as the common accepted state and relying on
  association queries for the missing detail.
- Root cause: The implementation enum was created from a rollback shorthand
  instead of the already locked Nurture identity-operation lifecycle.
- Fix / workaround: Replace `active` with explicit normal states
  `reserved|bound_empty|associated|retired`, retain `revoked|quarantined` as
  failure states, and align the schema spec, Prisma enum, migration, domain
  type, and repository checks.
- Prevention: Before adding a lifecycle enum, search the current context
  contract and task SSOT for every state transition and recovery branch; do
  not infer states from a summary label.

### 2026-07-28 — Adding tests without moving the population gates

- Symptom: The new identity tests passed directly, but
  `verify:test-routing` rejected `unit=21/19` and `productionDb=4/3`.
- Context: Nurture treats test-file routing and minimum test populations as
  release gates so silently excluded suites cannot appear green.
- What we tried: Running the new files directly before the repository routing
  census.
- Root cause: The implementation added two scenario test files and one DB test
  file without updating the hard-coded file and test-count expectations.
- Fix / workaround: Move the routing expectations to 21 unit, 5 production-DB,
  8 dev-host, and 1 X5 files; move minimum populations to 187 unit and 35
  production-DB tests; rerun the routing gate.
- Prevention: Any test-file addition must update and execute both
  `scripts/assert-test-routing.mjs` and the `verify:*population` thresholds in
  `package.json` before cloud CI.

### 2026-07-28 — Making historical association rows occupy current uniqueness

- Symptom: The first P2 schema made `(workspace, anchor/local target)` unique
  across every association row, so a revoked row would permanently block the
  replacement mapping that the contract allows.
- Context: Association history is immutable, but uniqueness and the
  Family-to-Child dependency apply to current rows.
- What we tried: Reusing ordinary Prisma composite uniques while also adding a
  lifecycle status.
- Root cause: The relational key was reviewed for current integrity without
  replaying the revoke-then-reassociate lifecycle.
- Fix / workaround: Add a nullable `currentKey` discriminator represented in
  Prisma SSOT; require `current` only for active rows and null for historical
  rows. Keep one immutable Family-to-Child-association FK and add a current-only
  composite FK that blocks Child deactivation while an active Family depends
  on it.
- Prevention: For every status-bearing unique key, test create, deactivate,
  historical retention, authorized replacement, and parent-dependency
  deactivation—not only duplicate active creation.

### 2026-07-28 — Checking anchor version without locking the issuance window

- Symptom: Authorization initially read the anchor version and then inserted
  the receipt in the same transaction, but the ordinary read did not prevent a
  concurrent revoke/version update between those statements.
- Context: The receipt is valid only for the exact current typed anchor
  lifecycle and aggregate version.
- What we tried: Relying on transaction grouping plus the later idempotent
  upsert.
- Root cause: Transaction atomicity did not itself lock the prerequisite row;
  replay safety and prerequisite-state concurrency are separate concerns.
- Fix / workaround: Read the exact Child or Family anchor through
  `SELECT ... FOR UPDATE`, then validate lifecycle/version and issue or replay
  before releasing the row lock.
- Prevention: Any authorization derived from a mutable prerequisite must
  either lock that prerequisite or perform a database-enforced conditional
  write; a plain read followed by insert is not a current-state proof.

### 2026-07-28 — Locking only the anchor while authority changes elsewhere

- Symptom: Receipt issuance locked the exact typed anchor but accepted
  role/grant/purpose evidence read before the transaction.
- Context: Anchor lifecycle/version and scenario authority are independent
  mutable prerequisites. Fencing one does not fence the other.
- What we tried: Calling a domain `verifyCurrent` port first, then passing its
  evidence into a repository transaction that locked only the anchor.
- Root cause: The adapter boundary modeled authority as input data instead of
  a transaction-local prerequisite owned by Nurture persistence.
- Fix / workaround: Pass private authority lookup input to the repository.
  Inside the exact Prisma transaction, lock the anchor, then call a
  transaction-scoped reader that locks or database-CAS-validates the exact
  authority source before insertion or replay. Default wiring denies. A real
  PostgreSQL interleaving covers concurrent revoke and post-commit denial.
- Prevention: For every receipt, enumerate every independently mutable
  prerequisite and prove each is locked or conditionally validated in the
  commit transaction. Never accept pre-read evidence as current authority.

### 2026-07-28 — Inferring a fixture type from a helper that consumes that type

- Symptom: Native CI rejected
  `type AnchorRow = ReturnType<typeof anchor>` because `anchor()` accepted
  `Partial<AnchorRow>`, creating a circular test-only type alias.
- Context: Vitest transpilation ran the repository tests successfully, while
  the authoritative repository-wide TypeScript pass analyzed the fixture
  types.
- What we tried: Avoiding a duplicate fixture shape by inferring the row type
  from its constructor helper.
- Root cause: The helper and inferred alias referenced each other.
- Fix / workaround: Define the four-field `AnchorRow` test fixture type
  explicitly and keep `anchor(overrides: Partial<AnchorRow>)` one-way.
- Prevention: A factory return type may be inferred only when the factory
  parameters do not depend on that inferred type; always retain a full
  typecheck gate in addition to transpile-and-run tests.

### 2026-07-29 — Leaving the registered normative contract on a superseded pin

- Symptom: Implementation and task handoff docs named the repaired Host and
  transaction-scoped authority flow, while the registered Nurture scenario
  contract still named Host `64f4165` and described the pre-repair source
  posture.
- Context: The workflow contract itself participates in the 31-file
  cross-repository source hash, so narrative drift is also pin drift.
- What we tried: Treating the implementation notes and cloud evidence as
  sufficient synchronization.
- Root cause: The final handoff scan checked code, tests, and task docs but did
  not compare every living registered context artifact against the current
  exact-source evidence.
- Fix / workaround: Update the normative contract, run `ctl-context touch`,
  recompute the full source hash, verify the exact Base/Host/Nurture pins, and
  rerun native CI at the synchronized source.
- Prevention: Every cross-repository source repair must include a registered
  context-artifact census before evidence closure; if a contract path changes,
  refresh its checksum, source hash, exact revision, and native CI together.

### 2026-07-29 — Generating only one Prisma client before exact X5

- Symptom: The first exact X5 attempt failed before test collection because
  `apps/backend/src/generated/dev-host-prisma/index.js` was missing.
- Context: X5 uses the production Nurture database, but importing the backend
  server also loads the dev-host client module.
- What we tried: Running only `pnpm db:generate`, which prepared the production
  Prisma client but not the backend-private generated client.
- Root cause: The disposable-worktree preparation differed from the repository
  CI preparation and did not account for the backend import graph.
- Fix / workaround: Run `pnpm db:generate:all` with valid placeholder
  production and dev-host URLs before X5 collection. The rerun reached the real
  two-database journey.
- Prevention: Exact X5 harnesses must mirror CI generation order and assert
  both generated client entrypoints exist before starting disposable
  databases.

### 2026-07-31 — Reading a drifting sibling checkout as a local regression

- Symptom: The repository-wide TypeScript command reports hundreds of missing
  My-Chat workspace modules and Prisma fields while the new scenario-service
  package itself typechecks, tests and builds cleanly.
- Context: Root package overrides deliberately link bounded My-Chat packages
  from `../My-Chat`; the current sibling is a dirty `2573635` checkout while
  T-002 pins `f00b868`.
- What we tried: Regenerating both Nurture Prisma clients and running the root
  compiler separately from the pinned-contract build to isolate generated
  state from source identity.
- Root cause: TypeScript follows linked My-Chat source whose current workspace
  packages and generated Prisma client do not represent the exact pinned
  qualification source.
- Fix / workaround: Treat the exact pin verifier as the source-identity gate,
  retain the full typecheck result as an expected owner NO-GO, and verify the
  scenario-service through its independent package compiler. Do not repin,
  regenerate or clean the user-owned My-Chat worktree from Nurture.
- Prevention: Cross-repository verification must start from the exact pinned
  clean checkout. When that precondition fails, report sibling drift
  separately and prove whether the current change contributes any compiler
  diagnostics before classifying it as a regression.

### 2026-07-31 — Treating framework defaults as an ingress security boundary

- Symptom: M1 claimed bounded, allowlisted behavior while Express still parsed
  URL-encoded bodies, exposed `X-Powered-By`, Node accepted headers/request
  bodies for up to its much longer default, raw method strings reached logs,
  and arbitrary thrown objects could select a non-500 status.
- Context: The controller timeout and safe response body were correct in
  isolation, but the full HTTP path includes the Node parser, Express defaults,
  Nest exception classification and post-response logging.
- What we tried: Reviewing only registered routes and positive HTTP responses.
- Root cause: Framework defaults and untyped third-party exception metadata
  were implicitly trusted as if they were part of the frozen P7 contract.
- Fix / workaround: Parse JSON only, set Node header/request deadlines, disable
  framework fingerprinting, normalize methods and accept status only from Nest
  HTTP exceptions or an explicit body-parser error map.
- Prevention: Every formal ingress review must enumerate the complete chain
  from socket/header/body parsing through auth/controller/error/logging and
  test both wire behavior and server configuration.

### 2026-07-31 — Leaving a losing timeout alive after `Promise.race`

- Symptom: The scenario-service smoke reported success but took about 5.6
  seconds even though the child process had already stopped.
- Context: Child cleanup raced the `exit` event against a five-second timeout.
- What we tried: Checking both `exitCode` and `signalCode`, adding graceful
  Nest shutdown and closing HTTP keep-alive connections.
- Root cause: `Promise.race` does not cancel its losing timeout; that timer
  remained referenced and kept the parent Node event loop alive.
- Fix / workaround: Replace the race with one exit waiter that removes its
  listener and clears its timer on either outcome, then escalate only if the
  child is still live.
- Prevention: Process-control tests must measure green-path wall time and
  explicitly dispose every listener/timer created for timeout races.

### 2026-07-31 — Treating a configured service token as owner readiness

- Symptom: A NestJS auth guard could return `401` or pass a request merely
  because `NURTURE_INTERNAL_SERVICE_TOKEN` exists, even though the P7
  authorizer/database composition is absent.
- Context: Fastify P7 has a three-state contract. Dependency absence is a
  disabled service, not an authentication failure, and credentials are not
  inspected until both the authorizer and token exist.
- Root cause: Collapsing “credential configured” and “business owner available”
  into one enabled flag loses the fail-closed ordering and makes a secret look
  like capability authority.
- Fix / workaround: Keep separate composition availability and service-auth
  dependencies; check both before bearer comparison. The composition seam
  defaults false and has no environment toggle. Smoke runs with the correct
  token/bearer but no authorizer and must still receive
  `503 binding_owner_disabled`.
- Prevention: Every M3 composition change must rerun all three guard states and
  prove that token presence alone cannot enable owner behavior.
## 2026-07-31 — Lockfile-only install did not materialize new workspace links

- Symptom: the scenario and DB runtime builds passed, but scenario-service
  TypeScript/Vitest could not resolve their new `binding-owner` subpaths.
- Root cause: `pnpm install --lockfile-only` updated `pnpm-lock.yaml` without
  creating the newly declared workspace symlinks under the service package.
- Attempt: rerunning the runtime builds could not repair dependency
  materialization because the package links were still absent.
- Fix: run `pnpm install --offline --frozen-lockfile` after the lockfile update;
  no package download or source change was required.
- Prevention: after adding a workspace dependency, use lockfile-only mode only
  for resolution, then perform an actual frozen install before package-local
  typecheck/test.

### 2026-07-31 — Comparing Prisma `DateTime` to raw JavaScript dates without UTC normalization

- Symptom: a Guardian role with `starts_at` 60 seconds in the future was
  authorized by the real PostgreSQL Nest journey in an Asia/Shanghai session.
- What we tried: first asserted the created Prisma row retained the exact future
  instant, then reran the production reader against a fresh database; storage
  was correct and only the raw comparison was wrong.
- Root cause: Prisma stores these `DateTime` values in PostgreSQL
  `timestamp without time zone` columns. The raw SQL parameter for a JavaScript
  `Date` carries timezone semantics, so PostgreSQL applied the session timezone
  during a mixed-type comparison.
- Fix: compare both effective-window columns against
  `date_parameter::timestamptz AT TIME ZONE 'UTC'`.
- Prevention: every raw-SQL comparison between Prisma `DateTime` columns and
  JavaScript instants needs a non-UTC-session regression with future and ended
  rows; do not infer correctness from UTC-only tests.

### 2026-07-31 — Adding parity tests without renewing CI population thresholds

- Symptom: all 43 dev-host tests passed, but the CI population verifier still
  required exactly 21 and would have rejected the job after the test command.
- What we tried: direct Vitest and file-routing checks were green, which showed
  that classification was correct but did not exercise the JSON result-count
  contract used by CI.
- Root cause: the 22-case Fastify/Nest parity file was classified correctly,
  but the separate JSON result-count contract was not updated with it.
- Fix: move the threshold to 43 and execute `test:dev-host:ci` together with
  `verify:dev-host-population`.
- Prevention: any test-population change must update and run both file-routing
  and result-count gates; a green direct Vitest invocation is insufficient CI
  evidence.

### 2026-07-31 — Reserving an anchor before entering the authority transaction

- Symptom: an authenticated but unauthorized binding request returned the
  correct denial while leaving a deterministic `reserved` anchor committed.
- Root cause: the application composition called `reserveAnchor` and
  `verify` through two independent repository transactions. Receipt issuance
  reread authority atomically, but reservation did not share that rollback
  boundary.
- Fix: add a repository-scoped transaction composition and run reservation,
  anchor lock, current Participant/Guardian locks, authority validation and
  receipt insert/replay through it.
- Prevention: fail-closed response tests must also assert zero durable effect.
  For owner commands, verify transaction membership, rollback and mutation
  counts instead of inferring atomicity from the final HTTP status.

### 2026-07-31 — Compiling over an existing `dist` directory

- Symptom: the deleted M2 disabled controller still existed under the ignored
  scenario-service `dist` directory after later builds.
- Root cause: plain `tsc` emits current files but does not remove outputs whose
  source files were deleted or renamed.
- Fix: each runtime package now removes only its own `dist` directory before
  compilation.
- Prevention: runtime builds must start from an empty package-local output
  directory, and smoke/packaging review must inspect the emitted file set rather
  than assuming source deletion removes old artifacts.

### 2026-07-31 — Direct Vitest bypassed compiled workspace prerequisites

- Symptom: a direct scenario-service Vitest invocation passed three files but
  failed to load four suites whose workspace subpaths are compiled by the
  package's official pre-test hook. A filtered dev-host startup test also
  loaded unrelated database/parity dependencies because it shared their file.
- Root cause: invoking Vitest directly bypassed the build-aware package script,
  while colocating pure startup guards with integration tests widened the
  module graph.
- Fix: move loopback/environment/port startup guards into a dependency-light
  file and verify it independently; retain the full build-aware populations in
  their official CI jobs.
- Prevention: do not claim a direct Vitest command as full regression evidence
  when package scripts own prerequisite compilation. Keep pure configuration
  tests separate from database or cross-package integration modules.

### 2026-07-31 — Env validation did not inspect a separate runtime template

- Symptom: the env contract declared `NURTURE_BACKEND_URL`, but the development
  runtime template initially still expanded the old undeclared `API_BASE_URL`.
- Root cause: env SSOT validation covers contract values and generated
  artifacts, not every independently maintained consumer template.
- Fix: update the template to the declared key and add a repository assertion
  covering the complete `8000/3001/3200/3201` topology and consumer variables.
- Prevention: every port or URL-key change must run both env-contract
  validation and the consumer-level topology assertion.

### 2026-08-05 — A source lock cannot bind uncommitted contract source

- Symptom: contract conformance portability correctly failed after the I1-A source
  changed, while the exact source-revision check could not be made green before an
  implementation commit existed.
- Root cause: the Base source lock stores both the current source manifest and an
  exact Git commit that must already contain every current TypeScript contract file.
  A single new commit cannot name its own not-yet-known commit id.
- What we tried: ran source/type/schema tests independently, then refreshed the
  deterministic manifest while retaining the historical revision long enough to
  prove portability.
- Fix: commit the verified source/test population first, update the lock to that exact
  commit, run the complete verifier, then create one metadata-only lock commit. This
  follows the repository's existing source-lock lineage.
- Prevention: plan source-lock-bearing Base changes as an ordered two-commit logical
  work unit and roll them back in reverse order; never weaken the exact-revision gate
  or point it at a symbolic/mutable revision to force a nominal single commit.

### 2026-08-05 — Presentation acceptance exceeded its executable invariants

- Symptom: the accepted I1-C record claimed broad URL rejection, current locator
  expiry, localized diagnostic/prescriptive safety, executable page defaults and
  response-local item keys, while adversarial probes bypassed five structural
  invariants and revealed that one semantic claim had no neutral implementation.
- Root cause: positive Schema/codec parity and local-block tests were treated as
  proof of broader cross-field, cross-block, current-time and natural-language
  guarantees. Documentary defaults and owner responsibilities were also phrased as
  if Base enforced them directly.
- What we tried: replayed the original bypass values against both JSON Schema and
  the built codec, separated portable shape checks from deterministic clocked and
  cross-array assertions, and evaluated keyword matching for medical copy. Keyword
  matching was rejected because it would be English-specific and unsafe across
  locales.
- Fix: reopen acceptance before source work; broaden structural locator rejection;
  add explicit-clock active option/result assertions, stable locale error mapping,
  exported/default-resolving page bounds and presentation-wide item/entry keys;
  reapprove localized disclosure/Anti-Metric semantics as a mandatory executable
  Scenario-owner adoption gate; then run three full verifiers, two isolated builds
  and an exact successor source lock.
- Prevention: every acceptance statement must name its executable owner and
  falsification layer. Test generic-scheme/network-path/bare-address values,
  expired/future clocks, duplicate keys across containers, omitted defaults and
  runtime-library exceptions; never claim neutral localized semantic classification
  without an owner-policy conformance suite.

### 2026-08-06 — Green standalone validators did not prove cross-seam action identity

- Symptom: 55 Schemas and 291 Node tests were green, yet mixed prepare-result
  branches passed Schema validation, a shape-valid replacement submit token was
  accepted, exact rebind could replace expiry/evidence, claimed driver/effect
  identity could name different Steps, and legitimate bind failure outcomes had
  no contextual validation path.
- Root cause: branch-local closure and cross-seam composition were inferred from
  independently green validators. Existing-binding context stored only the
  assertion, while token/scenario/action and the execution Step join were absent
  from the trusted private context.
- What we tried: replayed concrete bypass values against the built codec and Ajv,
  then paired independently valid Step-01/Step-02 objects. The first full
  pre-lock conformance aggregate also stopped at portability because it correctly
  still compared changed source with the historical lock.
- Fix / workaround: independently close Schema branches; bind submit identity to
  resolved private context; store and replay the full binding seal; add one
  claimed-Step execution composition assertion; branch fail-closed outcomes
  before success metadata; then reseal the committed source and requalify the
  final exact chain.
- Prevention: every union needs mixed-branch Schema/codec parity cases, and every
  invariant spanning two validators needs a composed adversarial test. Rebind
  tests must mutate both result and proposed new context while retaining an
  immutable stored baseline. Treat pre-lock source mismatch as sequencing
  evidence, never as permission to weaken the lock.

### 2026-08-06 — Shape-valid protected controls did not prove carrier confinement

- Symptom: the first E1-E4 implementation passed focused positive/negative tests,
  but Base still exported owner-internal evidence types, offered a normalization
  transformer, grouped distinct read failures, checked only shallow body fields,
  and did not compose the exact request/Workspace/principal/surface or direct/Step
  identity across every protected lifecycle seam.
- Root cause: closed public wire shapes and keyed hashes were treated as sufficient
  proof even though trust depends on independently verified context and the absence
  of protected copies in recursively nested or adjacent generic objects. Hash shape
  alone does not prove which request, field, carrier or execution produced it.
- What we tried: mutated one contextual axis at a time while retaining valid hashes,
  nested forbidden fields under generic action keys, paired a direct context or
  claimed Step from another execution, and scanned high-entropy plaintext/ref/
  version/integrity sentinels in exact, normalized, escaped, base64 and fragmented
  forms across every generic Base fixture.
- Fix / workaround: keep owner verification evidence private and closed; make Base
  validate already-normalized text without transforming it; split each failure arm;
  bind request, Workspace, principal, surface, scenario, action, field/direction,
  carrier integrity and exact direct/original-Step execution; recursively reject
  body-like action input; and add cumulative generic-fixture no-copy scans.
- Prevention: protected-content review must test trust provenance, not just hash
  syntax. Every carrier/control join needs cross-context substitution tests, every
  generic value needs recursive forbidden-field checks, and every claimed no-copy
  boundary needs encoded/fragmented sentinels plus an explicit statement of which
  later runtime layers remain unproven.

### 2026-08-06 — Naive substring scanning inverted protected-copy safety

- Symptom: green I1-E tests still allowed a protected fragment when wrapped in a
  longer control string and allowed a base64url protected ref, while one-character
  carrier/version values rejected unrelated operation and driver strings.
- Root cause: plaintext fragment matching tested whether the complete candidate
  was inside the protected text, while ref/version scanning used only direct
  substring inclusion. Neither algorithm separated high-entropy fragment evidence
  from low-entropy coincidence. Commit time and forbidden property names also had
  one-sided runtime/Schema checks rather than composed parity.
- What we tried: replayed wrapped raw fragments, encoded refs, one-character values,
  a post-expiry commit and case/separator/prefix property variants against the built
  codec and Ajv. The first full aggregate then correctly stopped at the historical
  source lock, confirming the two-commit reseal sequence was still required.
- Fix / workaround: build one bounded representation/window profile per assertion;
  use exact comparison below 16 code points and 16-code-point windows above it;
  reuse it recursively for text/ref/version/integrity; bound commit time to resolved
  `now`; mirror runtime property normalization in Schema; then commit source before
  a metadata-only exact lock.
- Prevention: every no-copy detector needs both false-negative and false-positive
  adversarial cases, including wrapped, encoded and minimum-length values. Structural
  scanners must state their entropy threshold and never be described as semantic
  DLP. Every lifecycle time must be checked against both lower and current-time
  bounds, and every runtime key normalization rule needs generated parity coverage.

### 2026-08-06 — Generic fixtures can accidentally copy protected no-copy sentinels

- Symptom: the first F1 dependency fixture made the existing I1-E E4 generic-
  fixture scan fail even though the new manifest contained no protected body.
- Root cause: placeholder hashes used repeated `a`/`b` values that exactly matched
  high-entropy protected-control sentinels. The no-copy suite correctly treats an
  exact byte copy as unsafe regardless of the field's apparent purpose.
- What we tried: ran the focused F1 suite first, then the complete Node population;
  only the latter exposed the cross-fixture collision.
- Fix / workaround: replaced repeated-character placeholder hashes with varied,
  valid lowercase SHA-256 values and reran E4 plus the full conformance population.
- Prevention: new generic fixtures must run the cumulative no-copy suite before
  commit and must not reuse opaque values from protected fixtures, even as hashes.

### 2026-08-06 — Assertion narrowing and stale build output can hide the first real error

- Symptom: F3 strict TypeScript reported validated action/protected values as
  `unknown`; the immediately parallel Node tests then loaded the prior contracts
  build and produced broad `unknown_field` failures unrelated to the new logic.
- Root cause: TypeScript did not preserve assertion-function narrowing across the
  surrounding `try/catch`, and package resolution intentionally targets built
  contracts output. The failed typecheck prevented that output from refreshing.
- What we tried: running typecheck, focused Node and runtime suites in parallel
  amplified the stale-build cascade but preserved the actual TypeScript diagnostic.
- Fix / workaround: retain explicit validated contract types, bind the required
  prepare operation with a non-null `never` branch, complete the contracts build,
  then rerun focused/runtime tests before the cumulative suite.
- Prevention: when tests import built workspace packages, resolve compile errors
  first and refresh the owning package before interpreting downstream failures.
  Keep explicit checked locals at strict assertion/catch boundaries; never use
  `any` or relax validation to silence the compiler.

### 2026-08-06 — Shallow test fixtures can leak vNext mutations into legacy cases

- Symptom: after adding the F3 legacy-action negative, later unrelated legacy v1/v2
  runtime tests failed `WF-MAN-011` and registry loading.
- Root cause: a shallow-spread federated fixture still shared the nested
  `action_availability` object with the module baseline. Directly replacing its
  `scenario_actions` array mutated the shared baseline for subsequent tests.
- What we tried: verified that the new scenario-contract cases passed, inspected
  later validation findings and traced the first shared nested write.
- Fix / workaround: replace `action_availability` with a new object in the negative
  fixture before changing `scenario_actions`; all 34 runtime tests then passed.
- Prevention: mutation-based tests must clone every nested object they modify.
  A negative-case helper must prove the baseline object is unchanged before later
  compatibility/hash assertions depend on it.

### 2026-08-06 — Source convergence must not bypass its historical lock

- Symptom: full conformance stopped at source portability after each F1-F3 source
  unit although all independent contract, Schema, runtime and Node tests passed.
- Root cause: the immutable I1-E lock still named the prior 22-file source. That
  mismatch was the intended sequencing gate, not a failing F1-F3 contract.
- What we tried: ran every non-lock check independently, kept F1/F2/F3 as separate
  green commits, then implemented deterministic named profiles and portability
  checks without editing the historical lock early.
- Fix / workaround: commit the complete F4 source/tooling first, generate one lock
  naming that exact commit, and commit only the lock JSON. Three full verifiers and
  two isolated build/manifest comparisons then passed.
- Prevention: source-changing units precede one metadata-only seal. Record a
  pre-lock mismatch as sequencing evidence; never weaken, skip or point the lock at
  an uncommitted worktree. Any validator rule addition must also update the
  mechanically checked normative inventory in the same source unit.

### 2026-08-06 — Green declaration graphs can still be impossible or unreachable

- Symptom: the accepted I1-F graph passed 435 Node tests while a second action
  could satisfy neither handler rule, a product surface could name a presentation
  unreachable from the presentation operation, large declaration arrays remained
  unbounded and a symlinked source root reproduced trusted hashes.
- Root cause: action transport and business-dispatch identities were conflated;
  surface reachability was checked against a global ingress union; outer
  population bounds were mistaken for inner-array bounds; source hashing checked
  symlink leaves but not physical-root ancestry.
- What we tried: added positive two-action graphs plus shared/cross-kind handler
  negatives, split surfaces across trusted operations, exercised exact maxima and
  maximum-plus-one values in runtime and Schema, and supplied a relocated
  symbolic-link root to the source-hash tool.
- Fix / workaround: separate transport and action handler namespaces while
  retaining global uniqueness; resolve surface reachability through the exact
  presentation operation; freeze 64/64/128 inner bounds; inspect every root and
  file path segment with `lstat`; then reseal one committed source with a
  metadata-only lock.
- Prevention: graph conformance needs satisfiable multi-row positives and
  operation-local reachability negatives, not only single-row dangling-reference
  checks. Every collection needs an explicit size review, and every integrity
  tool accepting path overrides needs root, ancestor and leaf symlink adversaries.

### 2026-08-06 — Cross-repository task IDs are not global identities

- Symptom: `resume --task T-002` resolved Nurture
  `nurture-institution-mode`, but the same command in My-Chat resolved archived
  `content-events` even though the shared isolated branch name also contained
  `T-002`.
- Root cause: project task IDs are repository-local. The worktree name preserved
  the Nurture program ID while My-Chat had already assigned that number to a
  different historical task.
- What we tried: resolved continuity independently in both repositories instead
  of trusting the branch name or copying the Nurture trailer.
- Fix / workaround: artifact 51 keeps Nurture T-002 as the program record and
  requires project orchestration to assign a new unused My-Chat local task before
  any I2 source commit. My-Chat C30 commits must not use `Task: T-002`.
- Prevention: resolve task identity against each repository's registry and task
  bundle before a cross-repository commit; treat branch IDs and upstream task
  references as context, never local trailer authority.

### 2026-08-06 — Downstream acceptance must follow a repaired upstream lock

- Symptom: Nurture still named My-Chat's first I2 runtime/aggregate/archive after
  the upstream quality review had withdrawn that acceptance; the dashboard also
  still said I2-A required authorization after I2 had completed.
- Root cause: program-level handoff evidence and the manual project focus were
  not treated as consumers of the My-Chat source lock lifecycle.
- What we tried: exact-hash search across the active T-002 bundle and project hub
  separated intentional historical rows from current acceptance claims.
- Fix / workaround: pin the repaired runtime, replacement lock, seven profiles,
  aggregate and reacceptance archive in artifact 52; mark the invalidated first
  evidence historical; update overview, roadmap, verification and project focus.
- Prevention: whenever an upstream acceptance is withdrawn or resealed, search
  every downstream current-state surface for the old revision, lock, aggregate,
  archive and successor gate before declaring cross-repository closure.

### 2026-08-06 — A complete capability graph can force premature product semantics

- Symptom: C30-I3 appeared to require a production action and protected
  declaration even though C31 owns the first reviewed Guardian action.
- Root cause: the complete four-capability Base fixture was mistaken for the only
  legal manifest state. The accepted contract also permits dependency-complete
  prefixes, while rejecting only partial, mixed or stale-source graphs.
- What we tried: compared the I1-F graph rules, C30 implementation DAG, current
  legacy action registry and C31 Guardian ownership rather than inventing a
  placeholder or relabelling `capture_family_input`.
- Fix / workaround: freeze I3 production at the exact trusted+presentation
  complete prefix with no action offers. Implement and qualify generic
  action/protected owner primitives through test-only neutral fixtures; let C31
  add the first real declarations to the same canonical manifest.
- Prevention: distinguish production declaration population, implementation
  support and conformance fixtures. Never populate a manifest merely to prove
  infrastructure; every production action must have an already reviewed product
  intent, handler and protected lifecycle.

### 2026-08-06 — A preselected disposable port can already belong to another target

- Symptom: the planned I3 PostgreSQL port 55439 was already published by the
  unrelated `codex-q4b5-mychat-pg` container.
- Root cause: a prior exact port choice is not proof that the endpoint remains
  unowned when implementation begins.
- Fix / workaround: inspect the exact owner read-only, leave it untouched, then
  select and prove-free 55440 before creating `nurture-c30-i3` there.
- Prevention: resolve container name and loopback port immediately before every
  disposable create; ownership mismatch changes the new target, never the
  preexisting service.

### 2026-08-06 — Workspace package tests can require built subpath artifacts

- Symptom: the complete DB suite failed during module collection before any test
  ran, while its focused source-imported C30 integration suite passed.
- Root cause: historical workspace package subpath exports resolve to `dist`, and
  the current Scenario/DB output had not yet been refreshed for the new exports.
- Fix / workaround: run the authorized `build:binding-owner-runtime` prerequisite,
  then rerun the whole DB population; all 22 files / 234 tests passed.
- Prevention: refresh owning package artifacts before broad suites whose package
  exports target `dist`; classify collection failure separately from a source or
  database test failure.

### 2026-08-06 — Prisma diff inputs need stable database endpoints

- Symptom: a migration diff using a process-substitution `/dev/fd` datasource did
  not provide Prisma a usable stable schema endpoint.
- Root cause: Prisma's diff subprocess cannot rely on a shell-owned file
  descriptor path remaining available through its own process lifecycle.
- Fix / workaround: create a dedicated empty shadow database inside the exact
  disposable I3 container and compare migrations, target and SSOT through normal
  PostgreSQL URLs; both final diffs are empty.
- Prevention: use an explicitly scoped disposable shadow database for migration
  previews and validate its target identity before use; do not use transient file
  descriptors as Prisma datasource authorities.

### 2026-08-06 — Opaque locator encryption still needs a wire-size budget

- Symptom: a valid encrypted subject locator passed short-ID unit tests but
  exceeded Base's 512-character bound with UUID-shaped persisted identities.
- Root cause: the first encrypted plaintext used verbose JSON field names; AEAD
  overhead and base64url expansion made wire size depend unnecessarily on names.
- Fix / workaround: retain the typed internal locator but encrypt a closed,
  versioned positional tuple. UUID-shaped integration locators now remain within
  the accepted 32..512 bound and still reveal no identifier.
- Prevention: test opaque locators with maximum realistic IDs and account for
  nonce, tag and encoding expansion; opacity, authenticity and bounded size are
  separate acceptance properties.

### 2026-08-06 — Lifecycle-negative fixtures must satisfy the lifecycle constraint

- Symptom: a family-association revoke test was rejected by PostgreSQL before
  the read path ran.
- Root cause: the test cleared `current_key` but retained the current-child link,
  creating an invalid mixed lifecycle row under the maintained constraint.
- Fix / workaround: revoke atomically with `current_key` and
  `current_child_association_id` both cleared and the revocation timestamp set;
  the owner read then correctly failed closed.
- Prevention: negative tests should transition persisted fixtures through a
  legal lifecycle state before asserting consumer behavior; constraint failures
  and consumer denials prove different boundaries.

### 2026-08-06 — Base64URL last-character mutation may preserve decoded bytes

- Symptom: the full Scenario suite intermittently accepted a test signature
  whose encoded last character had supposedly been changed.
- Root cause: for an unpadded Base64URL value, the final character can include
  unused low-order bits; changing only those bits produces the same decoded
  signature bytes and therefore is not cryptographic tampering.
- Fix / workaround: mutate the first encoded character, which always changes a
  significant byte, while keeping the encoded shape valid.
- Prevention: signature-negative fixtures must alter a known significant byte
  or decode/mutate/re-encode; do not assume every textual Base64URL change
  changes the represented bytes.

### 2026-08-06 — Crypto-erasure must survive database rollback and restoration

- Symptom: clearing a wrapped DEK and KMS handle only inside a database
  transaction can be undone by rollback or by restoring an older snapshot.
- Root cause: database deletion is not authoritative erasure while an external
  KMS can still unwrap a snapshotted key envelope.
- What we tried: the first lifecycle destroyed the handle and cleared the row in
  one surrounding database transaction; ambiguity testing showed that the two
  systems could not share a commit outcome.
- Fix / workaround: durably commit `erasing`, destroy the external KMS handle,
  then clear all recoverable database material in a final transaction. A later
  database restore is fail-closed because it cannot restore the destroyed handle.
- Prevention: qualification must restore pre-erasure database material and
  prove unwrap denial against the external KMS state; never equate row clearing
  alone with cryptographic erasure.

### 2026-08-06 — External KMS calls cannot share a database transaction boundary

- Symptom: a successful DB commit with an ambiguous client response could run
  cleanup and destroy the key referenced by the committed row; conversely, a
  successful KMS destroy followed by DB rollback could leave an `active` row
  pointing to a destroyed key.
- Root cause: two independent commit authorities were treated as one atomic
  transaction, and catch-based cleanup could not distinguish rollback from an
  ambiguous committed outcome.
- What we tried: injected ambiguous success after KMS provision and destroy,
  then inspected the durable row and retried the same logical operation. The
  former transaction-wrapped flow either risked key destruction or restored an
  `active` row whose handle no longer existed.
- Fix / workaround: persist `provisioning` before idempotent KMS provision and
  `erasing` before idempotent KMS destroy. Run KMS outside DB transactions and
  finalize through locked, replayable transitions; never destroy a provisioned
  key merely because the DB client observed an error.
- Prevention: every external side effect needs a durable operation identity,
  non-active intermediate state, idempotent retry and ambiguity test.

### 2026-08-06 — Binding revision is not canonical object version

- Symptom: Participant refs used the principal-binding aggregate revision and
  pair/action evidence hard-coded other refs to `v1`, so independently updated
  objects could be denied or misrepresented.
- Root cause: association lifecycle and canonical object lifecycle were treated
  as one version clock.
- What we tried: exercised a Participant at version 7 with binding revision 1,
  Process version 5 and Family version 6 across pair commit, replay, Execution
  and outbox evidence; the prior implementation emitted incorrect versions.
- Fix / workaround: join the Participant when reading a binding, persist exact
  Participant/Process/Family versions in the committed pair operation and reuse
  them in result, Execution, outbox and replay.
- Prevention: every typed ref version must come from that object's own aggregate;
  binding revisions remain separate evidence fields.

### 2026-08-06 — PostgreSQL enum values need a committed migration before use

- Symptom: a fresh migration failed with `55P04 unsafe use of new value` when
  one migration both added `provisioning|erasing` and referenced them in a
  default/check constraint.
- Root cause: PostgreSQL does not allow a new enum value to be used until the
  transaction that creates it commits.
- What we tried: Prisma validation and schema diffs passed, but replaying the
  complete migration chain on an empty PostgreSQL 16 target failed at the new
  default before application tests could start.
- Fix / workaround: add enum values in `20260806225000`, then apply columns,
  default and constraints in `20260806230000`.
- Prevention: whenever a migration adds and immediately consumes enum values,
  split it at the commit boundary and prove the full chain from an empty DB.

### 2026-08-06 — A digest-shaped foreground value is not verified foreground state

- Symptom: protected read accepted a caller-provided SHA-256 string as the
  carrier binding and never used the claimed foreground-context hash.
- Root cause: shape validation was mistaken for server-owned provenance and the
  owner did not independently bind decrypted bytes to request/surface context.
- What we tried: supplied a validly shaped but invented foreground digest and
  revoked authority during the decrypt/bind interval; the first implementation
  accepted both cases because it had no owner verifier or final reread.
- Fix / workaround: remove the caller binding field; an injected default-deny
  owner port verifies current foreground state and derives the keyed binding
  from request identity, server-held surface/key context and exact carrier bytes.
- Prevention: client or transport digests are evidence inputs only. Any value
  that authorizes or binds plaintext must be independently recomputed or
  verified by the owner before a final current-authority reread.

### 2026-08-06 — Package-local Vitest can inherit repository-relative includes

- Symptom: `pnpm --filter @the-nurture/scenario test` collected zero tests even
  though the same files passed from the repository root.
- Root cause: the shared Vitest include is repository-relative, while the
  package command changed the test root to the package directory.
- What we tried: the first filtered focused command reproduced the zero-file
  result; a root invocation proved that discovery and test bodies were healthy.
- Fix / workaround: the package script now passes `--root ../..`; its declared
  command runs all 58 Scenario files / 635 tests.
- Prevention: execute each package's public test script during convergence, not
  only an equivalent root command, and pin the package script in the source lock.

### 2026-08-06 — Package typechecks may miss integration-test wire mutability

- Symptom: the final root TypeScript check rejected readonly binding tuples in
  the C30 pair integration fixture although focused runtime tests were green.
- Root cause: literal `as const` arrays were readonly, but the exact Base wire
  uses mutable two-item tuples; narrower package build configurations had not
  compiled that integration fixture.
- What we tried: root typecheck located both request/result assignments before
  any build compilation began.
- Fix / workaround: contextually type both fixtures from
  `NurtureC30PairAssociationCommandV1` and use mutable tuples; root typecheck and
  the 14-test pair suite pass.
- Prevention: cumulative qualification must include the root TypeScript graph
  in addition to package builds and focused database execution.
### 2026-08-08 — C30 merged Nurture-only, but it is a three-repository change

- Symptom: merging `codex/T-002-c30-i0` into Nurture `main` produced 130
  typecheck errors, 80 of them in `src` (71 in
  `packages/nurture-scenario/src/c30`, 9 in `packages/nurture-db/src/c30`).
  Every error was a missing `@my-chat/workflow-contracts` export:
  `ScenarioContractManifestV1`, the `scenario_contracts` manifest field,
  `ScenarioHumanPrincipalV1`, `ScenarioProtectedInteractionContractV1`,
  `ScenarioPrivateInvocationV1` and four `assertScenario*` helpers.
- Root cause: C30 spans three repositories and all three sides sat on
  unmerged branches — Nurture `codex/T-002-c30-i0` (`76ece1f`), My-Chat
  `codex/T-035-scenario-host-adoption` (`cd7bbc2`) and My-Workflow-Base
  `codex/T-002-c30-i0-base` (`4350086`). The missing exports are introduced by
  My-Chat `470fc86`, which is contained in no repository pin and in no
  mainline; My-Chat mainline carries a differently shaped `ScenarioManifestV2`
  instead. Merging one third of a three-repository change cannot typecheck
  against any available sibling state.
- What was checked and still missed it: the merge conflict set (5, all small),
  `prisma/schema.prisma` (merged clean, `prisma validate` passed), migration
  object disjointness (C30's 2026-08-06 migrations and T-009's 2026-08-07
  migrations share no table, enum or altered column) and the recomputed test
  census. None of those inspect cross-repository symbol availability.
- Fix: revert the merge (`faee71d`), restoring 0 typecheck errors. The branch
  is preserved at `origin/codex/T-002-c30-i0`; reverting the revert later
  restores the merge together with its conflict resolution.
- Prevention: before merging any branch, read its own upstream gate. This one
  ships `scripts/verify-c30-i3-upstream.mjs`, which hardcodes the two sibling
  heads it requires — and those are not the repository pins in
  `docs/project/integrations/my-chat-workflow-contract.json`. A branch whose
  gate pins sibling revisions different from the repository pins is by
  definition not independently mergeable. Land C30 as one coordinated
  three-repository sequence: Base, then My-Chat host adoption, then a pin
  rotation, then Nurture.
