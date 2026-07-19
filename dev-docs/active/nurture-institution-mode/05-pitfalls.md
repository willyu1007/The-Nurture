# Pitfalls — Institution Mode

This file exists to prevent repeating mistakes within this task.

## Do-not-repeat summary

- Do not reduce institution ecology to an authorization feature; institution is the child's external growth environment.
- Do not treat institution ecology as an independent product shell; institution ecology remains inside the My-Chat scenario boundary.
- Do not put My-Chat account/auth/session semantics inside The Nurture; they belong to My-Chat.
- Do not activate optional Host actor/workspace fields or let Nurture infer workspace from Participant history; subject-aware ingress requires one My-Chat-established adult principal and exact validated workspace.
- Do not treat a general Chat thread's personal-workspace storage partition as business context or silently promote daily Q&A into Nurture; business entry requires an explicit workspace transition and minimal confirmed intent carryover.
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
- Do not infer or merge a child across workspaces from the same adult account, name, birth fact, contact, media, roster, or raw id. Cross-workspace portability remains Pilot `NO-GO` until a separate consented versioned protocol exists.
- Do not treat future portability as identity migration or let the same My-Chat adult prove the same child. Future v1 may only copy explicitly confirmed minimum fields into a fresh target-local aggregate after independent source and target checks.
- Do not search, suggest, attach to, overwrite, or merge an existing target child during future v1 import. Existing-profile reconciliation is a separate target-local protocol and never a Technical Operator edit.
- Do not place portability bodies or child-identity claims in My-Chat Workflow Step, Handoff, Outbox, notification, provider payload, logs, or Admin controls; My-Chat remains authentication plus refs-only transport.
- Do not promise that source revoke/redaction/deletion recalls an already consumed import. Before consume these gates fail closed; after consume the copied fields are target-local facts under target Guardian policy.
- Do not collapse persisted business outcome, replay disposition, and current presenter result. A replay or already-satisfied caller cannot claim it performed, owned, approved, or jointly consented to the original effect.
- Do not treat CommandExecution `outputRefs` as client navigation, presentation authority, analytics dimensions, notification data, or Handoff content. They remain exact server-side recovery evidence and there is no `open_result` token.
- Do not widen or reinterpret existing `user_attention` for Enrollment lifecycle. A future Guardian relationship-attention contract is additive, separately versioned, capability-gated, and limited to transfer review and irreversible relationship termination.
- Do not create completion spam for pause/resume, transfer cancel/decline/confirm, re-entry confirmation, stage changes, or portability. Existing proposal/invitation/current presenters cover those paths without another lifecycle Handoff.
- Do not resolve relationship-notification recipients at delivery time. Snapshot exact current Guardian RoleAssignments at business commit, exclude the withdrawal actor, never backfill later-added Guardians, and stop lost-role recipients through current owner reread.
- Do not compensate, delete, reopen, or rewrite a committed Nurture fact because presenter, Step, Handoff, Outbox, provider, or notification delivery failed. Recover the original Execution/Step and keep technical delivery independent.
- Do not equate an authenticated My-Chat account with the scenario subject. An adult actor must reach a child/learner subject through the current scenario-owned relationship graph.
- Do not solve account-to-subject discovery by creating a second canonical Child or relationship table in My-Chat. Host subject entries are opaque discovery/navigation context and never authorization.
- Do not hardcode `NurtureChildCareProcess` into reusable Base/My-Chat contracts. Product copy can be child-centered while shared technical contracts use generic `subject`.
- Do not let a `subject_collection` grant bulk write, shared Grant/consent, outside-scope discovery, or membership-cache authority. Every member action resolves one exact current owner path.
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
- Fix / workaround: keep Pilot executable portability disabled; constrain a
  future v1 to the same authenticated adult, independent dual-scope checks,
  fresh target-local identities, `displayName` plus opt-in `birthDate`, a
  seven-day target-bound Intent and five-minute confirmation, Nurture-owned
  consumption/idempotency, refs-only Host delivery, no match/merge, and clear
  post-consume no-recall semantics.
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
