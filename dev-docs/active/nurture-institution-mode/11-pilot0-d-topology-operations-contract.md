# Pilot-0-D Topology and Operations Contract

## Current outcome

Pilot-0-D is decision-complete as of 2026-07-21. The only authorized effect is
the locked topology, release, operations, recovery, observation, and evidence
contract for the future internal Pilot.

- Pilot-0-C remains `DECISION COMPLETE / IMPLEMENTATION OPEN / EXTERNAL
  TRAFFIC NO-GO`.
- C30-C35, C40-C45, Pilot-0-D implementation, candidate assembly, artifact
  publication, database provisioning/migration, secrets, environment changes,
  activation, and traffic remain unauthorized.
- The canonical traffic-readiness census currently has six open `TR-P0`, three
  open `TR-P1`, and one `TR-P1` accepted scope exclusion. Design closure assigns
  owners and evidence but does not close implementation blockers.
- No complete Pilot candidate exists, so no `QR-*` result can be claimed.

## Reader path and source precedence

Use the following order. A lower row cannot override a higher row.

| Priority | Source | Purpose |
| --- | --- | --- |
| 1 | Repository `AGENTS.md` files | Cross-repository ownership, deployment, privacy, and safety invariants. |
| 2 | `docs/context/workflow/nurture-scenario-contract.md` | Exact current My-Chat/Nurture workflow and identity boundary. |
| 3 | `10-pilot0-c-current-decision-index.md` | Locked C inputs, product scope, and implementation/qualification order. |
| 4 | The current file | Normative Pilot-0-D topology and operations decisions. |
| 5 | `09-pilot-readiness.md` | Detailed Pilot decision ledger, readiness gaps, and historical rationale. |
| 6 | Architecture, schema, test, notes, verification, and pitfalls documents | Projections and chronological evidence. |

Deployment-vendor details in the current file are Pilot topology decisions, not
reusable Scenario contracts. They must not be copied into My-Workflow-Base.

## D-0 — Authority, outputs, and lifecycle

### D-0.1 Design output versus immutable candidate

Pilot-0-D locks these separately named objects:

| Object | Meaning |
| --- | --- |
| `pilot_topology_operations_source_v1` | Cross-repository source identity for the exact D recipe, profile, policies, release tooling, and conformance inputs. |
| `complete_pilot_candidate_recipe_v1` | Versioned deterministic assembly rules. The recipe is a design/implementation source, not a release candidate. |
| `nurture_institution_complete_pilot_v1` | Exact Host activation profile for the complete internal Pilot. The profile cannot alias either C-3 or C-4 disposable evidence profile. |
| `nurture_institution_complete_pilot_evidence_v1` | Strict pre-E disposable profile for the complete candidate; the evidence profile cannot target persistent Pilot or substitute for the live profile. |
| `complete_pilot_evidence_v1` | Candidate kind used only by the disposable D operational-evidence row. |
| `complete_pilot_candidate_manifest_v1` | Immutable body/secret-free manifest assembled only from implemented inputs. |
| `complete_pilot_candidate_id` | Content address of the normalized complete candidate manifest. |
| `complete_pilot_candidate_signature_v1` | Detached signature over the candidate id and canonical manifest digest; the signature is not hashed into the signed candidate. |
| `pilot0_d_candidate_evidence_authorization_v1` | Short-lived authority for one candidate-bound, disposable D evidence environment; the authority cannot target the persistent Pilot environment. |
| `pilot0_d_disposable_deployment_binding_v1` | Exact disposable runtime/resource binding used only by the pre-E D evidence environment. |
| `pilot0_d_predeployment_evidence_seal_v1` | Immutable signed result over the completed disposable operational evidence and terminal teardown census. |
| `pilot0_traffic_readiness_census_v1` | Canonical body/secret-free disposition manifest for every stable `TR-*` id; its digest and evidence refs are bound by the D evidence seal and E decision. |
| `pilot0_e_release_decision_v1` | Later signed `go|no_go` decision about one exact complete candidate and evidence seal. |
| `pilot_deployment_binding_v1` | Later Pilot-1 binding from the E-approved candidate to exact deployed artifact/configuration and real secret/KMS reference identities. |
| `pilot_stage_authorization_v1` | Later signed one-stage authorization for exactly `pilot2_rehearsal` or `pilot4_observation`; the object is not an E decision or activation row. |
| `pilot3_rehearsal_plan_authorization_v1` | Signed non-activation authority for the exact Pilot-3 fault/restore/rotation/kill-switch matrix over the existing rehearsal row. |
| `pilot0_institution_provisioning_spec_v1` | One-effect real-Pilot authority for the first synthetic Institution and first Institution Admin bootstrap; the object is never a C-4 evidence authority. |
| `pilot2_rehearsal_readiness_seal_v1` | Signed default-off deployed-topology readiness result required before Pilot-2. |
| `pilot3_terminal_rehearsal_seal_v1` | Signed terminal Pilot-3 fault/restore/kill-switch result. |
| `pilot4_observation_baseline_seal_v1` | Signed owner-path, no-reset baseline required before Pilot-4. |
| `pilot4_daily_observation_seal_v1` | Body-free signed evidence for one exact 24-hour segment of the 120-hour window. |
| `pilot4_terminal_stop_evidence_v1` | Signed terminal boundary/stop evidence for every non-PASS observation window, including a partial segment, a failed full-segment boundary, or zero-length Tend closure. |
| `pilot4_observation_result_v1` | Independently reviewed terminal `pass|no_pass|stopped` result and bounded recommendation. |

The D design can be locked before C-3/C-4 implementation. A
`complete_pilot_candidate_id` can be assembled only after separately authorized
implementation produces one current `C3_QUALIFIED_DEFAULT_OFF` component and
one current `C4_QUALIFIED_DEFAULT_OFF` composite.

Pilot-0-E reviews an undeployed but content-addressed and machine-verifiable
candidate plus pre-deployment evidence. “No paper candidate” means that mutable
documents, branch names, tags, locally equivalent DTOs, or unsealed recipes
cannot enter E. A live deployment is not required before Pilot-1.

### D-0.2 Non-circular stage order

The only legal forward order is:

```text
Pilot-0-D design lock
  -> separate C3/C4/D implementation authorization
  -> C3 and C4 implementation plus qualification
  -> complete candidate assembly
  -> authorized disposable D evidence run and pre-deployment seal
  -> Pilot-0-E Go/No-Go
  -> separately authorized Pilot-1 default-off deployment
  -> separately authorized Pilot-2 exact-Workspace activation
  -> Pilot-3 fault/recovery rehearsal and full disable
  -> new stage authorization plus new activation row
  -> Pilot-4 continuous observation
  -> continue/stop decision
```

Pilot-3 cannot restore or reuse its activation row after the kill-switch
rehearsal. The Technical Operator is disable-only. Pilot-4 requires a new signed
stage authorization and a new exact activation row.

### D-0.3 Candidate identity

`complete_pilot_candidate_id` MUST bind:

- exact C-3 component and C-4 composite candidate ids;
- the exact id, version, and implementation/content hash of
  `pilot_topology_operations_source_v1`;
- the normalized `complete_pilot_candidate_recipe_v1` implementation digest;
- the exact `nurture_institution_complete_pilot_v1` id, version, and content
  hash, plus the exact non-substitutable
  `nurture_institution_complete_pilot_evidence_v1` id/version/content hash;
- My-Chat and Nurture source/lock, executable OCI, SBOM, provenance, license,
  vulnerability-policy, schema, ordered migration, manifest/registry, and test
  plan digests;
- normalized topology, network-policy, configuration schema, the canonical
  behavior-affecting non-secret configuration snapshot, secret/KMS class,
  observability, backup/restore, retention, incident, rollback, and observation
  policy digests; and
- the implemented contract/controller/resolver revisions for disposable D
  evidence, complete-candidate signing, E decisions, deployment binding, stage
  authorization, Pilot-3 rehearsal-plan authorization, stage-evidence sealing, Pilot admission, real-Pilot
  Institution bootstrap, daily observation recording, and terminal observation
  review.

The id is the namespaced hash of the canonical manifest body with the candidate
id and detached signature fields omitted. No object can hash itself or a later
signature/attestation.

`complete_pilot_candidate_signature_v1` is produced only by
`complete_pilot_candidate_signing_controller`, issuer
`my-chat.complete-pilot-candidate`, audience
`my-chat.complete-pilot-candidate.v1`, using a signing workload/credential
separate from E, deploy, stage, activation, and Technical Admin. The artifact
builder/publisher may operate that dedicated credential, but the signature
proves bytes, manifest, SBOM and provenance only; the signature is not approval. E verifies
the exact candidate id/manifest digest, signature, trust and revocation state.

The candidate MUST exclude qualification events/results, mutable qualification
heads, live D-evidence authorization/environment/result instances and seals,
live provisioning specifications/operations, E decisions, registry URLs/tags, environment/host/DB
instances, live deployment-instance configuration/references and current gate
values, concrete secret values or versions, deployment
bindings, Workspaces, activation rows, provider state, observation results, and
post-assembly evidence.

Current C-3/C-4 qualification is an assembly, E-review, and activation
predicate. Qualification is not part of candidate identity. A later
qualification invalidation makes the candidate unusable without changing or
rewriting its id.

### D-0.4 Allowed phase result

Design closure may claim only:

`PILOT0_D_DESIGN_LOCKED / C3_C4_D_IMPLEMENTATION_PENDING /
EXTERNAL_TRAFFIC_NO_GO`

Future successful assembly may claim only:

`COMPLETE_PILOT_CANDIDATE_ASSEMBLED_DEFAULT_OFF / PILOT0_E_PENDING /
EXTERNAL_TRAFFIC_NO_GO`

Neither state is qualification, deployment, enablement, or approval for Pilot-1.

### D-0.5 Disposable operational evidence and seal

Pilot-0-E MUST require the exact traffic-readiness disposition contract in
D-7.1. The bounded path below obtains that evidence without creating a circular dependency on
the persistent Pilot deployment only through the following bounded evidence
path.

Within Pilot-0-D, “zero external traffic” has one canonical machine field:
`externalProductTrafficCount=0`. The counter increments for any authenticated
Nurture product request that reaches Host route/admission evaluation from a
source session/Workspace outside the exact synthetic experiment or from a
human account outside the seven internal accounts, even when Host denies the
request before an owner call. The counter also increments for any private owner
invocation, business effect, Notification materialization/send/open, or
external-provider dispatch attempt whose represented human actor/recipient is
outside the seven accounts or whose technical caller/destination is outside the
exact candidate service/network allowlist. An allowlisted My-Chat workload
calling private Nurture for an allowlisted internal actor is internal product
traffic, not an eighth human account and not external traffic. The counter also
increments for any provider/recipient egress that the candidate excludes,
whether or not the provider acknowledges delivery.

An exact authorized internal negative probe retains the trusted synthetic
source session/account even when its untrusted target/body claims another
Workspace, child, family, role, or raw id. If Host denies that probe before the
owner call with zero business effect, the probe remains audited internal test
traffic and does not increment solely because of the injected target. Any such
probe reaching an owner call or effect still fails the separate privacy/PASS
contract, regardless of the external-traffic count.

The counter excludes unauthenticated scans denied at the edge before Host
session/Workspace admission, health/readiness probes, cloud control-plane
traffic, and exact allowlisted service-to-service KMS, secret, ACR, backup,
body-free telemetry, evidence, or recovery operations. Those excluded events
MUST still be audited/observable, MUST NOT enter a Nurture business owner path,
and MUST satisfy their own network and principal allowlists. “Zero network
packets,” “no public endpoint,” and an informal operator statement cannot
substitute for the product-traffic census.

`externalProductTrafficCount` is a derived census result, not a resettable
application counter. Every bound seal/result records the exact environment,
candidate/deployment, synthetic Workspace, interval, append-only ingress/
private-call/delivery/open audit source identities and high-water marks,
included/excluded event-set digests, and a continuity/gap proof. Missing source,
retention gap, unclassifiable event, clock/interval ambiguity, or digest mismatch
returns `unknown` and fails the dependent seal/result; none may be interpreted
as zero.

1. `pilot0_d_candidate_evidence_controller`, issuer
   `my-chat.pilot0-d-candidate-evidence` and audience
   `my-chat.pilot0-d-candidate-evidence.v1`, issues one signed
   `pilot0_d_candidate_evidence_authorization_v1`. Its key, trust, revocation,
   store, and `pilot0_d_candidate_evidence_authorization_current_resolver_v1`
   are separate from C-3/C-4 evidence, real Pilot bootstrap, E, deployment,
   stage authorization, activation, and Technical Admin.
2. The authorization binds the exact complete candidate, topology-source hash,
   evidence matrix/version, one disposable dual-ECS/dual-RDS environment, one
   synthetic Workspace, TTL, allowed activation/disable/restore operations,
   zero external recipient/provider traffic, issuer/audience/key/signature, and
   one current head. The authorization cannot name or mutate the persistent `pilot`
   environment.
3. The disposable environment runs the same production artifact, deploy,
   default-off gate, private-call, backup/restore, alert, hard-stop, and
   operator-recovery paths. Only
   `pilot0_d_disposable_deployment_binding_controller`, issuer
   `my-chat.pilot0-d-disposable-deployment`, audience
   `my-chat.pilot0-d-disposable-deployment.v1`, may sign
   `pilot0_d_disposable_deployment_binding_v1`. Its append-only store,
   key/trust/revocation domain and
   `pilot0_d_disposable_deployment_binding_current_resolver_v1` are distinct
   from Pilot-1 deployment binding and every evidence/stage authority. The
   binding records the exact candidate OCI,
   static behavior snapshot, disposable resources/secrets/trust/migrations and
   environment census, without an E decision or Pilot-1 binding; runtime,
   artifact, config, migration, resource, secret-ref or trust drift makes the
   binding noncurrent. The short-lived
   row is exactly `candidateKind=complete_pilot_evidence_v1` with profile
   `nurture_institution_complete_pilot_evidence_v1`, current C-3/C-4
   qualifications, that disposable binding, and the current D evidence
   authorization. The kind/profile reject E, persistent Pilot/Pilot-1
   deployment or stage authority, C-3/C-4 evidence authority, external
   recipients/providers, and every other environment. Only the D evidence
   authority may create and enable the exact authorized row; no authority may
   extend, retarget, or re-enable that row. Neither
   `pilot_stage_authorization_v1` nor any Pilot authority may do so. Technical
   Operator and the independent infrastructure hard-stop retain their exact
   disable-only lanes.
   Every evidence admission/owner-call/delivery/open/restore seam independently
   rereads current C-3/C-4 qualification, D evidence authorization, and
   disposable-binding resolvers; outage, ambiguity or mismatch denies.
4. Completion requires capability false, active rows `[]`, terminal recovery
   census, `externalProductTrafficCount=0`, evidence credentials revoked, and
   the disposable environment destroyed. Response loss, duplicate execution,
   or an ambiguous head fails closed and cannot authorize a replacement effect.
5. `pilot0_d_evidence_seal_controller`, issuer
   `my-chat.pilot0-d-evidence-seal` and audience
   `my-chat.pilot0-d-evidence-seal.v1`, signs the immutable
   `pilot0_d_predeployment_evidence_seal_v1`. The seal binds the exact candidate
   and topology-source hash, authorization id/head digest, disposable
   deployment and Workspace evidence refs, test-plan/result digests, current
   C-3/C-4 qualification heads, the exact
   `pilot0_traffic_readiness_census_v1` digest and evidence refs, `DR/QR`
   census, `externalProductTrafficCount=0` proof, terminal
   false/empty census, credential-revocation proof, teardown proof, issue time,
   issuer/audience/key/signature, and known limitations. Its append-only
   `pilot0_d_predeployment_evidence_seal_current_resolver_v1` rejects
   replacement, ambiguity, invalidation, or source/result drift.

The authorization instance, disposable resources, runtime evidence, and seal
are deliberately excluded from candidate identity. E consumes the exact seal;
E does not infer operational readiness from a document or a live deployment.

## D-1 — Isolated environment and service topology

### D-1.1 Environment boundary

The future internal experiment uses one dedicated logical environment class
`pilot`. The environment is not an alias of `dev`, `staging`, or `prod` and shares no
database, Redis, secret namespace, deployment identity, activation row, or
external recipient with those environments.

The selected Pilot topology is a dedicated low-scale Alibaba Cloud Hangzhou
VPC deployment using two ECS hosts and Docker Compose: one My-Chat host and one
private Nurture host. The split provides owner/failure-boundary separation, not a
production high-availability claim. The Nurture placeholder Kubernetes
configuration is not a deployable input; My-Chat's current ECS/Compose boundary
controls until a separately authorized post-Pilot architecture change.

The data plane uses:

- one dedicated My-Chat RDS PostgreSQL instance and owner credential;
- one separate dedicated Nurture RDS PostgreSQL instance and owner credential;
- one dedicated My-Chat Redis instance for worker/queue state;
- independent migrations, backups, restore targets, credentials, and health
  evidence for both owner databases; and
- no cross-database query, credential reuse, foreign key, transaction,
  compensation, or distributed rollback.

### D-1.2 Service and ingress graph

The complete workload set contains exactly:

1. My-Chat API;
2. My-Chat Web responsive shell;
3. My-Chat Technical Admin;
4. My-Chat Workers;
5. one production-only Nurture owner API; and
6. one Nurture-owned retention/erasure worker.

The two Nurture workloads MAY use the same immutable production image digest
with distinct, candidate-bound commands and workload identities. They do not
share a runtime credential with My-Chat or turn Nurture retention into a
My-Chat technical queue.

Only My-Chat public API and Web ingress are internet reachable. Technical Admin
is reachable only through a managed-device, MFA, VPN/IP-allowlisted internal
operator path. Public TLS terminates through the Pilot Alibaba Cloud SLB/WAF
boundary before My-Chat. The Nurture owner API publishes no public host port and
accepts only registered My-Chat private callers over the dedicated service
network/security group.

The Nurture artifact MUST exclude its frontend product shell, backend dev-host
Workflow/project routes, dev-host database schema/migrations, fixture endpoints,
static bearer fallback, and any copied My-Chat runtime.

Network policy is default-deny. The allowlist contains only exact My-Chat public
ingress, My-Chat-to-Nurture private calls, service-to-owner-database access,
My-Chat Redis, approved identity/KMS/Secrets Manager access, private ACR pull,
and body-free telemetry egress. Nurture never receives My-Chat database or Redis
credentials. My-Chat never receives Nurture database credentials.

### D-1.3 Product surfaces and external integrations

The internal experiment uses authenticated browser/responsive My-Chat surfaces:

| Role | Required Pilot surface |
| --- | --- |
| Guardian | Generic My-Chat Chat with Nurture semantic UI, family board, family workbench. |
| Caregiver | Generic My-Chat Chat with Nurture semantic UI, teacher board. |
| Institution Admin | Institution board and institution workbench; no Institution Chat. |
| Technical Operator | My-Chat Technical Admin only. |
| Recipient transition | Recipient-bound in-app Notification and authenticated web deep link. |

Native mobile distribution, real OS push, SMS, email, external recipients, and
external provider delivery are excluded. One controlled, recipient-bound in-app
Notification dispatcher is required for the authenticated Web/deep-link path.
The exclusion explicitly assigns
`TR-P1-3a-native-external-delivery=accepted_scope_exclusion` for the internal
Pilot scope without claiming a native-mobile capability.
Re-entering native delivery requires a new candidate and scope decision.

Protected Nurture compose/reply is manual and protected AI remains off. Nurture
content cannot enter general Chat history, LLM prompts, Convex authority,
Search, Vector, PPR, provider payloads, or analytics. In-app shell projection
may contain only the already allowlisted refs-only/generic Notification state.

All child/family/institution/content data is synthetic. The seven logical test
accounts keep distinct users, sessions, actors, and audit evidence even when
one internal tester operates multiple personas. The Technical Operator is one
of the seven accounts but has no Nurture Participant or business role. Release,
incident, database-recovery, privacy, and evidence-review principals are
separate operational principals and do not change the locked B-2 account count.

## D-2 — Artifact, configuration, and secret custody

### D-2.1 Artifact and ACR contract

Every runnable artifact is an immutable OCI digest. Tags such as `latest`,
`staging`, branch names, or mutable release labels are display aliases only and
cannot enter candidate, E, deployment, or activation identity.

The selected ECS/Compose path makes private Alibaba Cloud ACR VPC publication a
Pilot-1 prerequisite. D and E may use locally assembled immutable OCI evidence;
Pilot-1 publishes the exact same digests without rebuilding. A push, conversion,
or manifest rewrite that changes any digest creates a new complete candidate and
invalidates the prior E decision.

The disposable pre-E D evidence run may transfer the signed content-addressed
OCI layout directly to its isolated ECS hosts and must verify the same manifest
and platform digests before execution; that transfer is not ACR publication.
Persistent ACR repositories, tags, pull identities, and URLs are created only
in separately authorized Pilot-1.

The existing My-Chat `a1b5e64` ACR images are historical delivery evidence only.
They do not contain C-3/C-4 or the production Nurture owner service and cannot be
used by the complete Pilot candidate.

Each artifact binds source commit, lockfile, builder/toolchain, base-image
digest, production dependency closure, non-root runtime, health contract, SBOM,
provenance, license result, and vulnerability result. Candidate assembly and E
reject any unresolved `QR-P0/QR-P1`, critical vulnerability, unapproved high
vulnerability, unsigned provenance, mutable base, or workspace-wide development
tooling leak.

### D-2.2 Configuration and deployment binding

The candidate contains normalized configuration schemas, default-deny rules,
configuration-policy hashes, and the complete canonical snapshot of every
static behavior-affecting non-secret value: ordinary feature flags, timeouts, retry/lease
budgets, retention/recovery thresholds, route/surface/provider-disable modes,
and observability/incident behavior. Pilot-1 cannot choose or override those
values. The candidate excludes only deployment-instance values such as IP/DNS,
host/resource ids, live endpoints, generated timestamps, and concrete
secret/KMS references or values.

The environment release capability and `ScenarioWorkspaceActivation` row are
governed live authority predicates, not ordinary behavior flags. The candidate
binds their schema, default-deny value, controller/resolver semantics, and
allowed transition policy, but excludes their current values/instances. An
authorized false→true→false gate transition therefore changes neither candidate
nor deployment binding; any change to the gate contract/default/policy does.

Pilot-1 produces `pilot_deployment_binding_v1` over the E-approved candidate,
exact ACR digests, Compose/Caddy/network configuration hashes, database and Redis
instance identities, migration census, real secret/KMS reference ids and
versions, signer trust-set revisions, health endpoints, environment identity,
deployment database time, and the exact deployed behavior-snapshot hash that
must equal the candidate snapshot. Secret values remain excluded.

Deployment drift, tag-only resolution, missing artifact, changed configuration,
changed migration, unknown secret/KMS reference, or runtime hash mismatch makes
the binding noncurrent and prevents activation.

Rebuild/republish semantics are exact:

- a rebuild that reproduces every candidate digest byte-for-byte remains the
  same candidate; any changed byte, OCI index/platform digest, SBOM/provenance,
  behavior config, profile, topology, schema/migration, or build policy creates
  a new candidate and reruns affected C-3/C-4 evidence;
- retagging is non-authoritative; publishing the same blobs unchanged to another
  approved private ACR namespace keeps the candidate but creates a new
  deployment binding;
- a container restart with the same digest, config, host/resource identities,
  secret refs, and trust set may retain the deployment binding;
- host replacement, full redeploy, concrete secret/KMS reference rotation, or
  trust-set change creates a new deployment binding and requires a newly bound
  activation row before admission; and
- hot patching is forbidden. An older artifact is not a rollback target unless
  the D-6 compatibility proof already covers the exact current schema/recovery
  revision.

### D-2.3 Secret and trust domains

Pilot secrets use Alibaba Cloud Secrets Manager plus KMS in the Pilot account
and region. Bitwarden/BWS, repository files, disk `.env`, image layers, shell
history, candidate/evidence packages, logs, and business databases are forbidden
secret carriers.

At minimum, these credentials and key domains are separate:

- My-Chat and Nurture database owners;
- My-Chat Redis;
- adult identity-provider clients/sessions;
- My-Chat API, Workflow worker, execution-status recovery, owner-reevaluation,
  and Nurture API/retention-worker workload mTLS identities;
- ordinary trusted private invocation, execution-status recovery, protected
  owner reread/Notification open, and owner-reevaluation signing;
- C-3 evidence, C-3 qualification, C-4 evidence, and C-4 bootstrap-evidence
  authorities;
- D evidence authorization, disposable deployment binding, D evidence seal, complete-candidate signing,
  stage-evidence sealing, daily observation recording, and terminal observation
  review;
- real Pilot Institution bootstrap, E decision, deployment binding, Pilot
  release controller, Pilot-2/Pilot-4 stage authorization, and Pilot-3
  rehearsal-plan authorization;
- protected-content encryption/KMS; and
- optional provider credentials, which remain absent for the internal Pilot.

The existing static `NURTURE_INTERNAL_SERVICE_TOKEN` is scaffold-only and cannot
authenticate the Pilot. Private calls require the locked signed invocation
envelope plus workload-bound mTLS. Wrong caller, audience, key, certificate,
nonce, expiry, trust-set, or current gate fails before Participant or owner
resolution.

Protected content retains the C-3 cryptographic contract: each content object
uses its own AES-256-GCM DEK, wrapped by a Pilot environment/Workspace-scoped
Nurture KEK. Only the Nurture owner workloads may decrypt. My-Chat, Institution
Admin, Technical Operator, builders, release controllers, and telemetry sinks
receive no decrypt permission or raw key/DEK material.

Rotation, revoke, wrong-key, previous/current overlap, trust-store outage, and
credential-loss recovery must be rehearsed before the Pilot-4 observation
window. Rotation cannot silently mutate candidate identity; the exact live
reference/trust revision is recorded by a new deployment binding when required.

## D-3 — Dual technical gates and activation authority

### D-3.0 Release and stage authorities

`pilot0_e_release_decision_v1` is signed only by
`pilot0_e_release_controller`, issuer `my-chat.pilot0-e-release`, audience
`my-chat.pilot0-e-release-decision.v1`, in a key/trust/revocation domain
separate from build, deploy, stage authorization, activation execution,
qualification, invocation, Notification, and Technical Operator. The immutable
decision binds exact candidate, detached candidate-signature digest, signer key
id and trust/revocation head, exact D evidence-seal id and current-head digest,
known-limitations digest,
current C-3/C-4 qualification refs, issue time, result `go|no_go`, issuer,
audience, key id, and signature. Append-only
`pilot0_e_release_decision_event_v1` records permit
`go -> invalidated|superseded` and `no_go -> superseded`; no event restores the
same decision to `go`. `pilot0_e_release_decision_current_resolver_v1` validates
the unique current head, candidate and E signatures/trust/revocation, exact
inputs, current D evidence seal, and current C-3/C-4 qualifications. Candidate
signature swap, signer compromise/revocation/provenance invalidation, or trust
head drift forces E invalidation/supersession and denies. Missing, ambiguous,
invalidated, or unavailable state denies.

`pilot_deployment_binding_v1` is signed by
`pilot_deployment_binding_controller`, issuer
`my-chat.pilot-deployment-binding`, audience
`my-chat.pilot-deployment-binding.v1`, in a separate deploy authority domain.
Its append-only head and
`pilot_deployment_binding_current_resolver_v1` verifies the exact running
artifact/config/resource/secret-ref/trust-set/migration/environment census and
returns noncurrent on drift, outage, duplicate head, redeploy/rebind, or
revocation. A noncurrent binding cannot be repaired by editing an activation
row.

`pilot_stage_authorization_v1` is signed only by
`pilot_stage_authorization_controller`, issuer `my-chat.pilot-stage-authority`,
audience `my-chat.pilot-stage-activation.v1`, with a credential/store/current
resolver separate from E and `pilot_release_controller`. The authorization
binds exact stage, candidate, E decision, deployment binding, environment,
Workspace, scenario/profile, validity interval, allowed create/disable
operations, stage-specific prerequisite-seal ids/digests,
issuer/audience/key/signature, and unique current head. Pilot-2 uses one
`pilot2_rehearsal` authorization bound to current
`pilot2_rehearsal_readiness_seal_v1`; its row remains only for the bounded
Pilot-2 activation and Pilot-3 rehearsal and is consumed at Pilot-3 shutdown.
Pilot-4 uses a different
`pilot4_observation` authorization issued only after Pilot-3's terminal
false/empty seal and bound to exact `pilot3_terminal_rehearsal_seal_v1` plus
`pilot4_observation_baseline_seal_v1`. Append-only
`pilot_stage_authorization_event_v1` records and
`pilot_stage_authorization_current_resolver_v1` establish the unique current
head and verify every prerequisite seal is current and non-invalidated.
Consumption, expiry, revoke, supersede, store/verifier outage,
or mismatch denies. An authorization cannot be extended, copied, retargeted,
or reused across stages.

The three prerequisite seals are authority-bearing evidence, not Markdown
files. Only `pilot_stage_evidence_seal_controller`, issuer
`my-chat.pilot-stage-evidence`, may sign them for the schema-specific audiences
`my-chat.pilot2-readiness-seal.v1`, `my-chat.pilot3-terminal-seal.v1`, and
`my-chat.pilot4-baseline-seal.v1`. Its key/trust/revocation domain is separate
from the stage authorizer and executor. Append-only
`pilot_stage_evidence_event_v1`, a unique head per
`(candidate,deployment,Workspace,stage,sealKind)`, and
`pilot_stage_evidence_current_resolver_v1` allow only `sealed ->
invalidated|superseded`; no event restores a seal. Each seal binds its exact
candidate/deployment/E/qualification/policy/trust heads, evidence-input/result
digests, database-time interval, required false/empty/unresolved/traffic census,
reviewer, issuer/audience/key/signature, and predecessor/head digest. Any
missing, ambiguous, invalidated, stale, or unverifiable seal denies stage
authorization.

For `pilot3_terminal_rehearsal_seal_v1`, the tuple's `deployment` is the exact
final deployment binding. The rehearsed predecessor binding remains additional
signed provenance and never selects the current-head partition.

The Pilot-2 readiness seal's provisioning prerequisite is a narrow lineage
rule, not a permanently unconsumed-spec requirement. The seal binds the issued
spec head and exact bootstrap operation id.
`pilot0_institution_provisioning_lineage_resolver_v1` accepts only that exact
same-spec/same-operation monotonic chain: issued spec plus
`prepared(clear) -> claimed(clear|outcome_unknown) -> prepared(clear)` where the
return to prepared is the writer-fenced, within-budget retry CAS, followed by
`owner_committed + spec consumed + quarantine clear`. The bounded
claimed/prepared loop retains the original issued spec head, keeps the stage
lineage verifiable, but remains
`bootstrapAdmissionMode=bootstrap_only`; only the final successor permits
`ordinary_ready`. `closed_no_effect`, another operation/spec, reopen, retarget,
budget bypass, ambiguous/missing head, or any other drift invalidates the
prerequisite and therefore the rehearsal stage.

Pilot-3 is separately authorized without minting or re-enabling a row.
`pilot3_rehearsal_authorization_controller`, issuer
`my-chat.pilot3-rehearsal`, audience
`my-chat.pilot3-rehearsal-plan.v1`, signs one
`pilot3_rehearsal_plan_authorization_v1` in a key/store/current-resolver domain
separate from stage authorization, stage-evidence sealing, execution, and
Technical Admin. The plan binds the current `pilot2_rehearsal` authorization
and row, exact candidate/deployment/E/qualification/Workspace/profile,
time-bounded ordered fault matrix, permitted owner/DB/KMS/incident executors,
exact deploy operator plus `pilot_deployment_binding_controller`,
recovery-only endpoints, expected terminal false/empty census, and
issuer/audience/key/signature. The plan may authorize only the named controlled
fault, isolated restore, credential/key rotation, delivery/DLQ, stale-open,
redaction/revoke, and kill-switch exercises. The plan cannot create, extend,
retarget, re-enable, or replace a row; grant a business role; edit facts; restore
an active namespace; or widen traffic.

The plan has one exact effect-decreasing successful lineage:

```text
issued(active initial Pilot-2 authority + active initial row + rehearsed binding)
  -> gates_closed(row disabled/removed + capability false)
  -> final_binding_bound(exact allowlisted same-candidate successor)
  -> plan consumed_success
  -> Pilot-2 stage authority consumed
  -> pilot3_terminal_rehearsal_seal_v1 sealed
```

`pilot3_rehearsal_plan_lineage_resolver_v1` has two explicit modes. Transition
mode accepts a valid exact partial prefix only to append or retrieve the one
next successor in that sequence. In particular, `plan consumed_success` is
terminal for all rehearsal effects but is the transition proof for consuming
the one bound Pilot-2 stage authority; that consumed stage head is then the
transition proof for the one terminal seal. Neither head grants a business,
rehearsal, deployment, activation, or recovery operation. Verification mode
accepts the historical issued heads only when the append-only row,
deployment-binding, plan, and stage-authorization stores prove every exact
successor in order. A disabled/removed row and consumed stage authorization are
therefore verifiable provenance but never executable current authority. Exact
retry or response-loss recovery at a transition boundary retrieves the stored
successor and resumes at the next missing transition; exact retry cannot repeat rotation,
consume twice, or create a second seal.

Before `gates_closed`, the exact initial stage authority, row, and rehearsed
deployment binding MUST be current. After `gates_closed`, the resolver permits
only frozen recovery needed to settle the named exercise and the one final
binding transition; no product ingress, owner business command, delivery,
open, new claim, row creation, or re-enable remains legal. The named deploy
operator/controller may then issue exactly one same-candidate deployment-
binding successor that changes only the allowlisted secret/KMS/trust references
and records the controlled transition. Artifact, static behavior, schema,
topology, resource, migration, environment, or any other configuration drift
is not a successor and is non-passing.

Only completion of the entire ordered matrix, false/empty kill-switch census,
required recovery evidence, exact final binding successor, plan
`consumed_success`, and Pilot-2 stage-authority consumption permits the terminal
seal. Expiry, revoke, abort, order gap, missing/duplicate/divergent successor,
unexpected bound-head drift, attempted re-enable, early authority consumption,
store/verifier outage, or unresolved outcome stops execution fail-closed,
emits non-passing terminal evidence, and can never alias success. The terminal
seal binds both historical issued heads and every successful terminal successor;
Pilot-4 baseline/stage authorization denies every other lineage.

### D-3.1 Exact predicates

The phrase “two-key” means two independently readable technical predicates,
not two-person approval:

```text
environment release capability == enabled
AND
one current exact ScenarioWorkspaceActivation row == active
```

The versioned complete-Pilot profile is
`nurture_institution_complete_pilot_v1`. The activation row MUST bind its exact
schema/version and content hash plus environment, Workspace, scenario,
`complete_pilot_candidate_id`, nested C-3/C-4 ids, current qualification heads,
exact `eDecisionId` plus current decision-head/envelope digest, exact
`deploymentBindingId` plus current binding-head digest, exact
`stageAuthorizationId` plus current authorization-head digest, validity
interval, version, issuer, audience, key id, and signature. Wildcards, environment lists,
cached allowlists, inferred profiles, and legacy/global-only fallback are
forbidden.

The Host rereads both predicates, current C-3/C-4 qualification heads,
`pilot0_e_release_decision_current_resolver_v1`,
`pilot_deployment_binding_current_resolver_v1`, and
`pilot_stage_authorization_current_resolver_v1` at route admission and
immediately before every private owner-call attempt. D does not add a parallel
admission DTO. The resulting persisted, short-lived Base-owned
`ScenarioActivationAdmissionV1` uses an additive complete-Pilot variant that
binds those exact head digests, Workspace/profile, original actor,
request/command hashes, optional original Step provenance, issue/expiry, and
the existing admission id/hash and driver semantics. The admission contains no transport
caller, route, operation, attempt-start time, nonce, signature, credential, or
owner-transaction deadline. Each owner-call attempt instead receives a fresh
signed `ScenarioPrivateInvocationV1` that binds caller, route, operation, the
exact admission hash, attempt-start database time, single-use nonce, and the
bounded owner-transaction deadline. Step completion/materialization, Notification
create/send/retry/open, and background reconciliation independently reread the
current predicates/resolvers before each new technical or user-visible effect.

Nurture never calls My-Chat or a remote qualification/gate resolver from inside
the Nurture transaction. At the private boundary Nurture first verifies and
atomically consumes the fresh invocation envelope/nonce, then verifies the exact
`ScenarioActivationAdmissionV1` and its deployment/profile/row provenance. At
transaction start Nurture verifies the bound attempt time/deadline and rechecks the
local deadline immediately before its first write. If disable
linearizes before Host admission there is no owner call or business effect. If
admission linearizes first and the owner call is already in flight, Nurture may
fail closed or commit at most one idempotent effect within the bound deadline;
afterward only frozen effect-decreasing recovery is legal. Missing, duplicate,
expired, revoked, unreadable, stale, or mismatched state denies. Ordinary
My-Chat Q&A outside the Nurture Scenario is unaffected.

### D-3.2 Enable, disable, and resume

`pilot_release_controller`, acting under the exact current signed
`pilot_stage_authorization_v1`, is the sole authority that may create the one
exact authorized activation row and may also disable that row. The controller
cannot extend, retarget, or re-enable an existing row; any changed
interval/target or resumed stage requires a new authorization and a fresh row.
Technical Operator and cloud-incident hard-stop retain only their separately
defined disable lanes and cannot create or enable a row. Pilot-2 enables
the environment capability while the active row set is still empty, verifies
the fail-closed census, and creates the exact time-bounded Workspace row last.

The Technical Operator may disable/remove the exact row, close the environment
capability, stop eligible technical delivery, and request allowlisted
reconciliation. The Technical Operator cannot enable, extend, retarget, sign a release/resume
decision, edit Nurture facts, or issue a new replay seed.

Emergency shutdown normally removes/disables the exact Workspace row first and
closes the environment capability second. If the activation store/Admin path is
unavailable, an independent infrastructure hard-stop jointly closes every
ordinary My-Chat Nurture ingress, business private route, new Workflow claim and
worker path, Notification send/open seam, and the environment capability
without waiting for the row. The isolated execution-status/convergence endpoint
and identity remain available only for frozen refs-only recovery; compromise of
that trust domain quarantines outcomes instead of guessing them.
Each predicate independently denies new work. Pilot-3's
kill-switch rehearsal ends with the capability false and active rows `[]`.
Pilot-4 requires a new signed one-time stage/resume authorization and a newly
created activation row; no rehearsal authority or row may be restored.

With business gates closed, an independently authenticated technical convergence
plane may still read refs-only evidence, stop/reconcile eligible Handoffs and
Outbox work, execute same-Step/frozen effect-decreasing recovery, and ask the
owner to reevaluate. The convergence plane cannot read protected bodies, call a business command,
create a Notification, or produce a new user-visible effect.

### D-3.3 Real-Pilot first-Institution bootstrap

The first synthetic Institution and its first Institution Admin use one
real-Pilot authority domain. They never reuse the disposable C-4 evidence
bootstrap:

1. `pilot0_institution_provisioning_controller`, issuer
   `my-chat.pilot0-institution-bootstrap`, audience
   `nurture.pilot0-institution-bootstrap.v1`, owns issuance, custody,
   revocation, and destruction of `pilot0_institution_provisioning_spec_v1`.
   Its key/trust/revocation domain, append-only store, and
   `pilot0_institution_provisioning_spec_current_resolver_v1` cannot alias
   `c4_bootstrap_evidence_controller`, its store/spec/issuer/audience/target, or
   any D evidence, E, deploy, stage, release, Technical Admin, or business-role
   authority.
2. Pilot-1, while every business gate is closed, may create only the exact
   synthetic My-Chat Workspace, the seven test accounts, and the owner-issued
   one-time Host bootstrap invitation. The controller then issues one immutable
   spec binding exact candidate, current E decision, deployment binding,
   environment, Workspace, scenario/profile, canonical Institution-definition
   hash, initial Admin My-Chat user/actor, matching Host invitation, operation
   id/request hash, issue/expiry database time, issuer/audience/key/signature,
   and unique current head. The spec instance is deployment state, not candidate
   identity or a client/deep-link/business token.
3. Before Pilot-2 creates the activation row, the exact initial Admin must
   authenticate, accept that invitation, and commit current My-Chat Workspace
   membership. After the row becomes current, the controller rereads the
   accepted invitation/membership plus every D-3 gate/resolver and atomically
   claims the one operation. A fixed C-0 private endpoint receives a fresh
   `pilot0_institution_bootstrap_claim_v1` from the dedicated
   `my-chat-pilot0-institution-bootstrap` workload identity, issuer
   `my-chat.pilot0-institution-bootstrap`, for audience
   `nurture.pilot0-institution-bootstrap-command.v1`; no ordinary Scenario
   principal or product surface may call the endpoint.
4. Durable `pilot0_institution_bootstrap_operation_v1` records
   `prepared|claimed|owner_committed|closed_no_effect` and
   `clear|outcome_unknown`, with a fencing version, canonical request hash,
   one-effect id, claim lease, and body-free result refs. The Nurture C-0
   transaction idempotently creates exactly one Institution, Participant, first
   Institution Admin role assignment, and CommandExecution. Exact response-loss
   recovery uses the same operation through
   `pilot0_institution_bootstrap_execution_status_lookup_v1`, a writer-fenced
   recovery-only endpoint called only by
   `my-chat-pilot0-institution-bootstrap-recovery`, issuer
   `my-chat.pilot0-institution-bootstrap-recovery`, audience
   `nurture.pilot0-institution-bootstrap-recovery.v1`, that returns only
   `committed|confirmed_no_effect|unknown`. A Nurture CommandExecution/effect
   found under the C-0 writer fence returns `committed`; the Host state
   `owner_committed` also exact-replays that result. For an expired/stale
   `claimed` operation, `confirmed_no_effect` is a nonterminal writer-fenced
   classification—not `closed_no_effect` itself—and requires all issued attempts terminal, latest claim
   expiry plus skew and owner-transaction deadline elapsed, acquisition of the
   same writer fence as C-0, and absence of the exact CommandExecution/effect
   under that fence. Timeout, outage, possible in-flight work, or one absent
   query remains `unknown`; lookup performs zero Participant/policy/business
   command. In one expected-version Host transaction, a
   `confirmed_no_effect` classification chooses exactly one transition: if the
   same operation/spec remains current and bounded retry budget remains,
   `claimed -> prepared` makes only that operation reclaimable; otherwise
   `claimed -> closed_no_effect` closes the operation terminally. A later fresh claim may
   start only from `prepared`; `closed_no_effect` never reopens. The recovery path never
   creates a replacement operation/spec. `unknown` quarantines replacement
   work. Exact replay returns the original result, while concurrent,
   changed, expired, wrong-user/workspace/scenario/spec/invitation/deployment,
   ordinary-admin, self-claim, and Technical-Operator attempts fail before a
   second effect.
5. The Nurture C-0 commit writes only the Nurture Institution/role/
   CommandExecution effect and never consumes My-Chat state. After the Host
   receives the exact result—or the status lane proves `committed`—one My-Chat
   transaction writes `owner_committed`, consumes the exact spec, clears
   `outcome_unknown`, and closes bootstrap permanently as one atomic Host
   transition. During response loss the Host operation remains
   `claimed + outcome_unknown`; no unconsumed-spec check may rerun the owner
   command or authorize another operation. Expiry or revoke denies an
   uncommitted effect; an in-flight ambiguous operation permits only frozen
   status recovery. Rollback closes gates, revokes the spec and
   controller credential, resolves/quarantines the operation, and never deletes
   committed Institution or role facts. After terminal evidence, the live spec
   and private credential are destroyed while body-free public verification
   metadata/signatures remain under the 365-day audit policy.

The first real-Pilot activation row is deliberately bootstrap-only until the
cross-owner operation closes. Host derives `bootstrapAdmissionMode` from the
current provisioning lineage: `bootstrap_only` while the operation/spec is
the original issued spec plus the exact operation in `prepared|claimed` with
`clear|outcome_unknown` quarantine, permitting only the exact bootstrap
claim and status-recovery endpoints and denying every ordinary Nurture
ingress/read/action, Workflow materialization, delivery, and open; and
`ordinary_ready` only when
`pilot0_institution_provisioning_lineage_resolver_v1` proves the exact
same-spec/same-operation
`owner_committed + spec consumed + quarantine clear` successor.
`closed_no_effect`, unknown, outage, expiry, revoke, mismatch,
or an absent/ambiguous lineage remains `bootstrap_only` and fail-closed. Thus a
C-0 owner commit followed by response loss cannot expose ordinary product
routes before the Host has durably closed the bootstrap lineage.

Technical Operator may inspect only refs/counts/status/reason evidence and stop
traffic. The operator cannot issue or edit a spec, select the first Admin, claim the
operation, invoke the owner effect, transform `unknown`, or reopen bootstrap.
After bootstrap, the current Institution Admin—not the controller—uses ordinary
C-1 workbench commands for CareGroup, staff, roster, and enrollment onboarding.

## D-4 — Operational ownership and separation of duties

The operations profile requires these logical responsibilities before Pilot-1:

| Responsibility | Exclusive authority and boundary |
| --- | --- |
| Base contract owner | Owns reusable contract/conformance revisions; owns no deployment or business fact. |
| My-Chat platform/runtime owner | Owns auth, surfaces, gates, Step/Handoff/Outbox/Notification/Admin and Host incident evidence. |
| Nurture domain/data owner | Owns business facts, policies, protected content, owner reread, redaction, erasure and Nurture recovery. |
| Artifact builder/publisher + candidate-signing workload | Produces content-addressed artifacts and may use the isolated candidate-signing credential to attest exact bytes/provenance; cannot approve or activate them. |
| Deploy/migration operator | Creates the Pilot binding and applies forward migrations; cannot sign E or activate traffic. |
| Secret/KMS custodian | Creates, rotates and revokes real secret/key references; cannot use them as release authority. |
| Cloud incident authority | May hard-stop SLB/ECS/network/environment capability when the application control plane is unavailable; cannot enter business Admin or read/repair business facts. |
| D evidence authorization/seal owners | Authorize one disposable candidate-bound evidence run and independently seal its terminal result; cannot target the persistent Pilot environment or approve E. |
| D disposable deploy-binding owner | Signs/resolves the exact disposable runtime/resource census; cannot issue a Pilot-1 binding, authorize evidence, sign E, or activate persistent Pilot. |
| Real-Pilot Institution bootstrap owner | Issues/custodies/revokes one exact provisioning spec and drives its one-effect operation; cannot become the initial Admin or reuse C-4 evidence authority. |
| E release approver/signer | Signs `go|no_go` for one candidate and evidence seal; performs no deployment or activation. |
| Pilot stage authority/signer | Signs one exact Pilot-2 rehearsal or Pilot-4 observation authorization; cannot deploy or write a gate. |
| Pilot-3 rehearsal-plan authority | Signs the exact bounded fault/restore/rotation/kill-switch plan over the existing rehearsal row; cannot create/enable a row or execute the plan. |
| Stage-evidence seal owner/reviewer | Independently verifies and signs Pilot-2 readiness, Pilot-3 terminal, and Pilot-4 baseline seals; cannot authorize a stage, execute a fault, deploy, or activate. |
| Pilot release controller | Performs only separately authorized stage activation/resume operations. |
| Technical Operator | Uses My-Chat Technical Admin for disable/stop/refs-only reconciliation; has no business authority. |
| My-Chat DB restore owner | Restores only My-Chat data into an isolated target and proves Host consistency. |
| Nurture DB restore owner | Restores only Nurture data into an isolated target, replays erasure, and proves owner consistency. |
| Privacy/security incident owner | Classifies privacy/integrity events and can require immediate stop. |
| Observation recorder | Signs daily body-free segment evidence; cannot review the terminal result or activate traffic. |
| Observation reviewer | Independently signs the terminal PASS/NO-PASS/stopped result and bounded recommendation; cannot write evidence or activate/expand traffic. |

One internal human may hold several responsibilities, but each use of signer,
publisher, deployer, migration, enable, disable, database restore, and business
recovery authority requires its distinct credential and audit lane. No
operational principal becomes a Nurture Participant merely by performing that
job. Institution Admin cannot perform technical recovery; Technical Operator
cannot alter Participant, role, Grant, Enrollment, Message, Receipt, Item,
Attention, or care facts.

Every stage record names the accountable owner, executor credential class,
reviewer, validity interval, exact inputs, terminal outcome, and body-free
evidence refs. An unassigned responsibility or unavailable owner is a NO-GO,
not implied consent for another role to inherit the responsibility.

## D-5 — Observability, incidents, and technical recovery

### D-5.1 Evidence and telemetry

Restricted canonical audit/evidence records MUST bind the exact candidate,
deployment binding, environment, Workspace, activation version, surface class,
operation class, safe outcome/reason, and opaque correlation ids in each
owner's access-controlled evidence store. Shared metrics, logs, traces,
dashboards, alerts, and exports instead use only the candidate-bound cohort key,
a non-reversible keyed Workspace evidence reference, or the single low-cardinality
label `pilot_cohort`; they never contain a raw Workspace id.

Neither carrier may contain a protected body/ref mapping, raw user, child,
family, Participant, anchor or local business id, claim token, nonce,
credential, secret, locator, signed envelope, or caller-selected metric label.
“Bind” means exact correlation through the restricted owner record plus keyed
reference; the binding never authorizes raw platform/business identity in shared
telemetry.

Pilot telemetry remains in the Alibaba Cloud China region through SLS/ARMS (or
an equivalently isolated, candidate-bound private sink). HTTP request/response
bodies, database parameters, exception payloads, screen/session recording, and
automatic payload capture are disabled. The Pilot privacy overlay is stricter
than any generic logger schema that permits user/account identifiers.

The minimum dashboards cover:

- capability/activation/qualification census and drift;
- command admission, Nurture Execution, Step, Handoff, Outbox, in-app
  Notification dispatcher/open and recovery status/age/count;
- owner API, both owner databases, Redis, KMS/Secrets Manager, signer/trust-set,
  backup and telemetry health; and
- per-script absolute journey completion, retry, manual intervention and safe
  unavailable reason counts.

For the seven-question internal sample, percentiles and percentages are
diagnostic only. PASS uses exact journey outcomes and deadlines. An admitted
interactive action MUST return committed/replayable success or explicit safe
unavailability within 60 seconds; the 60-second bound is the
submit/acknowledge/reply technical action deadline and does not require a human Caregiver to complete the entire
question-to-reply round trip within 60 seconds. A recipient-bound in-app Notification MUST
be available or terminally classified within five minutes. Every retry,
dead-letter, `outcome_unknown`, manual review, or recovery record contains an
owner, first-seen database time, safe reason class, allowlisted action, terminal
outcome, elapsed time, and body-free evidence ref. No unresolved such record may
remain at observation close.

### D-5.2 Incident classes and deadlines

Pilot operations use `POPS-SEV0|POPS-SEV1|POPS-SEV2`; these are not design
review (`DR`), traffic readiness (`TR`), or qualification (`QR`) severities.

| Class | Examples | Required response |
| --- | --- | --- |
| `POPS-SEV0` | Cross-scope disclosure, forbidden persistence/logging, fail-open admission, wrong-Step acceptance, duplicate business effect, wrong recipient, secret/key compromise. | Deny new work and invoke both kill-switch actions immediately; emit a safe alert within one minute; incident owner acknowledges within five minutes. The current observation window terminates. |
| `POPS-SEV1` | Owner/KMS/qualification outage, unresolved DLQ or `outcome_unknown`, backup/restore/telemetry/audit failure, or inactive/pre-activation gate/candidate/config drift with no admitted effect. | Fail closed or pause the affected journey, alert within five minutes, assign an owner within fifteen minutes, and reach terminal safe classification or explicit continued shutdown within four hours. A SEV1 event cannot coexist with a PASS window. |
| `POPS-SEV2` | Product friction or latency miss with no privacy, integrity, authority, durability, or evidence loss. | Record exact journey evidence and owner review by the next daily seal; repeated or unexplained events prevent PASS. |

An `outcome_unknown` that exceeds its bounded operation deadline, any
dead-letter, owner/KMS unavailability lasting 60 seconds or two consecutive
attempts, backup age over 24 hours, unexplained critical telemetry gap, or
credential/certificate expiry entering its runbook threshold is at least
`POPS-SEV1`. An inactive/pre-activation gate, candidate, deployment, or config
mismatch is `POPS-SEV1` and blocks activation. Any such mismatch after admission
or during active operation, any cached allow, canonical-audit write loss, or
forbidden telemetry field is `POPS-SEV0` even when no user reports an impact.

Owner, qualification, gate, audit, or protected-content control-plane outage is
never an availability fallback. If authoritative telemetry/audit cannot prove a
new write, new Pilot writes are denied until evidence health is restored and a
new stage decision authorizes any necessary resume.

Admin/recovery actions remain allowlisted and effect-decreasing: inspect
refs-only state, stop, same-Step reclaim/replay, frozen outcome classification,
owner reevaluation, and provider-delivery suppression/reconciliation. They do
not edit Nurture state, invent an Execution/Handoff/replay seed, change a
recipient, or transform `unknown` into success.

## D-6 — Backup, restore, retention, rollback, and teardown

### D-6.1 Owner recovery objectives

My-Chat and Nurture databases each require encrypted point-in-time recovery with
`RPO <= 15 minutes` and a measured isolated-restore `RTO <= 4 hours`. Pilot-2 is
blocked until each owner has restored a fresh backup plus ordered forward
migrations into its own isolated recovery target and produced a body-free
evidence seal. Redis is not canonical and has no business RPO; after loss,
My-Chat reconstructs eligible technical work only from PostgreSQL Step/Outbox
and frozen evidence under the existing recovery fences.

Restore never targets the active namespace. A Nurture-owned append-only,
body-free privacy ledger is durably stored under separate credentials outside
the database backup lineage; a ledger restored only from the same old database
backup is insufficient. Each `nurture_pilot_erasure_ledger_event_v1` has a
deterministic event id, Nurture-local opaque content ref/hash, monotonic owner
version, `redaction|source_delete|retention_delete|policy_erase` class, owner DB
time, predecessor digest, and event digest. The event contains no body, platform
Child/Family/User/Workspace id, Participant, or cross-owner raw id.

The local owner first fences the content as `erase_pending`, then appends or
exact-replays the external event, and only after durable append confirmation
finalizes local erasure and reports completion. If external append succeeds but
the local finalization is lost, replay/restore conservatively erases. If the
ledger is unavailable, behind the last local head, ambiguous, or forked, the
target exposes no protected reads. The external ledger is retained for at least
the longest backup plus body-free audit window and includes retention-deletion
tombstones as well as explicit redaction/erasure.

Before either DB becomes reachable, the external environment capability,
routes, workers, and provider traffic are false/off and the recovery target has
separate credentials/deployment identity. A My-Chat backup may contain an
activation row that was current at backup time; the new environment/deployment
mismatch makes every restored row noncurrent and fail-closed. The My-Chat owner
then uses the audited disable/remove command path to reach active rows
`[]`—never direct SQL or row reinterpretation. Each DB owner verifies
schema/migration/candidate compatibility independently. Nurture verifies the
latest complete external head and replays the privacy ledger before any
protected read; My-Chat then performs refs-only
Step/Handoff/Outbox/Notification consistency checks against current owner
results. There is no distributed snapshot or compensating rollback. Any
cross-owner checkpoint ambiguity keeps the environment disabled and requires
forward reconciliation.

`RTO <= 4 hours` ends only when the isolated target is reachable; every ordered
migration/checksum passes; all restored activation rows are noncurrent and the
My-Chat owner command has converged them to `[]`; the external privacy-ledger
head is verified and replayed; KMS/trust state is current; both owners' integrity
checks pass; every cross-owner ambiguity is terminal or quarantined; protected
and public routes remain closed; and the body-free restore seal is committed.
RDS restore completion alone is not an RTO PASS.

### D-6.2 Retention, rollback, and shutdown

- Protected Message bodies retain the locked absolute 30-day maximum and may be
  erased earlier by redaction/owner policy.
- Authorized body-free business shells/history and body-free release/audit
  evidence retain the locked 365-day maximum unless an independently governed
  incident/legal hold applies.
- Encrypted Pilot backups roll for at most 30 days and are deleted no later than
  30 days after final environment shutdown, subject only to that hold. Restore
  MUST NOT revive redacted, source-deleted, policy-erased, or
  retention-removed content. Grant revoke is not body erasure: restore must
  preserve the revoked Grant fence and prevent its cross-role visibility,
  delivery, action, or authority while the canonical author/family-side body
  continues only under the current 30-day owner policy. Privacy-ledger replay
  precedes reads and evidence closure.

Runtime rollback is gate-first shutdown plus forward repair. Rollback never deletes,
rewrites, or compensates committed Nurture facts and never performs schema down
migration. An older artifact may run only if exact schema, migration, recovery,
profile, and trust compatibility was pre-proved in the candidate; otherwise all
gates remain closed while a new candidate is built and qualified. Re-enable
never backfills cancelled, skipped, expired, old-role, old-claim, revoked, or
redacted work.

Final shutdown first removes the activation row, closes the environment
capability, settles only frozen effect-decreasing recovery, revokes traffic
credentials, and removes external/private ingress. A maintenance-only owner
retention plane then completes protected-body/backup age-out and transfers
body-free technical audit to My-Chat custody and Nurture canonical/audit shells
to a Nurture-owned retention archive for their respective 365-day windows.
Those archives are not product/read surfaces and do not grant My-Chat access to
Nurture facts. Only after owner retention/erasure closure may the remaining
Pilot compute/databases and maintenance credentials be deleted. Environment
destruction is not a substitute for owner retention or erasure.
Revoking private signing capability and traffic credentials does not destroy
the body-free public verification metadata, detached signatures, or revocation
proofs required for the 365-day audit window.

## D-7 — Rehearsal, observation, success, and stage handoff

### D-7.1 Pre-deployment and stage sequence

Pilot-0-D closes when the D contract and projections pass review. Closure does not
assemble a candidate or authorize implementation. After separate authorization,
C-3/C-4 qualification and D implementation may assemble one immutable candidate
and a body/secret-free D evidence seal.

`pilot0_traffic_readiness_census_v1` uses the following stable ids and no
free-form substitute:

| Stable id | Readiness obligation | Exact E disposition |
| --- | --- | --- |
| `TR-P0-1-production-activation-composition` | Runnable My-Chat composition loads the exact Nurture candidate and owner adapters. | `closed` |
| `TR-P0-2-institution-workflow-operable` | Required Guardian/Caregiver/Institution responsive-Web journeys are operable. | `closed` |
| `TR-P0-3-controlled-onboarding` | Real audited Institution, staff, roster, Enrollment, Grant, and first-admin onboarding paths exist. | `closed` |
| `TR-P0-4-workspace-activation-gate` | Positive-only exact Workspace activation store/resolver and dual-gate enforcement exist. | `closed` |
| `TR-P0-5-deployable-nurture-topology` | Production Nurture owner artifact/topology exists without dev-host runtime. | `closed` |
| `TR-P0-6-operational-recovery-instantiated` | Telemetry, alerts, restore, rotation, incident ownership, and kill-switch are executable. | `closed` |
| `TR-P1-1-retention-access-policy` | Question-content retention/access and Grant-revoke wording are approved and implemented. | `closed` |
| `TR-P1-2-product-operations-telemetry` | Pilot value/operations telemetry and manual-intervention evidence are instrumented. | `closed` |
| `TR-P1-3a-native-external-delivery` | Native distribution, OS push, SMS/email, external recipients/providers remain absent from the complete candidate. | `accepted_scope_exclusion` |
| `TR-P1-3b-responsive-web-notification` | In-app Notification and authenticated responsive-Web deep-link artifact/routing are implemented. | `closed` |

Each census row MUST contain its stable id, disposition, exact candidate and
evidence refs/digests, reviewer, and issue time. Only the exact
`TR-P1-3a-native-external-delivery` row may use
`accepted_scope_exclusion`, and only when candidate/static registry/network
evidence proves the excluded clients, providers, routes, recipients, and
credentials are absent or disabled. `open`, `waived`, `not_applicable`, unknown,
duplicate, missing, or differently named rows block E. A later native/external
scope requires a new candidate and decision; the existing census remains immutable.

`pilot0_e_release_decision_v1` reviews that undeployed candidate, the current
C-3/C-4 qualification heads, exact current
`pilot0_d_predeployment_evidence_seal_v1`, known-limitations digest,
`QR-P0=0 / QR-P1=0`, and the exact census above: all six `TR-P0` rows and
`TR-P1-1|2|3b` are `closed`, while only `TR-P1-3a` is
`accepted_scope_exclusion`. The E decision binds the exact census digest and
cannot infer readiness from counts or the phrase “activation-critical.”
The decision returns signed `go|no_go` for the exact candidate only. E does not publish an
artifact, provision/migrate an environment, bind a secret, create a Workspace
or activation row, or change a capability.

Pilot-1, Pilot-2, Pilot-3, and Pilot-4 remain separately authorized stages.
Pilot-1 ends deployed but default-off with capability false and active rows
`[]`; Pilot-1 may prepare the exact synthetic Workspace/accounts, Host bootstrap
invitation, and current real-Pilot provisioning spec while business gates stay
closed. Before Pilot-2, each database completes a default-off isolated-restore
qualification and the dual-gate/hard-stop paths pass without external traffic.
`pilot2_rehearsal_readiness_seal_v1` binds those exact results, the current
candidate/deployment/E/qualification heads, issued provisioning-spec head plus
exact bootstrap operation and the allowed same-operation prepared/claimed/
bounded-retry/final-committed lineage,
capability false, active rows `[]`, and `externalProductTrafficCount=0`. A current `pilot2_rehearsal`
authorization bound to that seal then lets the release controller
create the first exact row and the provisioning controller close C-0 bootstrap.

Under a separately current `pilot3_rehearsal_plan_authorization_v1`, Pilot-3
first exercises the exact deployed topology's owner/KMS/in-app-dispatcher/
outbox/DLQ, stale-open, redaction/revoke, fault/restore, and kill-switch paths.
The row is removed and capability is false before any binding-changing
credential/KMS/trust rotation runs as the final plan step through the isolated
technical plane. The controller then appends the exact final deployment-binding
successor, CAS-consumes the plan as `consumed_success`, CAS-consumes the Pilot-2
stage authorization, and only then emits
`pilot3_terminal_rehearsal_seal_v1`. The seal verifies the complete ordered
lineage while capability remains false, active rows remain `[]`, and no
unresolved outcome exists. Historical plan/stage heads remain verification-only
and cannot execute. A revoked, expired, aborted, out-of-order, drifted, or
incompletely consumed lineage produces non-passing terminal evidence and blocks
the Pilot-4 baseline and stage authorization.
If rotation changes a secret/KMS reference or trust revision, the current
deployment binding and rehearsal row immediately become noncurrent and are
never restored. The Pilot-3 plan permits that transition only as its terminal
binding-changing exercise. `pilot3_terminal_rehearsal_seal_v1` binds both
`rehearsedDeploymentBindingId` and `finalDeploymentBindingId` plus the signed
controlled-rotation transition digest. The final binding must retain the same
candidate/static behavior/schema/topology and differ only by the allowlisted
secret/KMS/trust revision, must be current with capability false and rows `[]`,
and must be the exact binding used by the Pilot-4 baseline, authorization, and
fresh row. Any unrelated redeploy/config/artifact/resource drift requires a new
candidate or separately requalified deployment and cannot use the terminal
seal.
The old row is never restored. Owner-path census—without SQL, DB reset, or
reseed—then produces `pilot4_observation_baseline_seal_v1` over the unchanged
three-child/three-family/seven-account facts; four current Guardian Host
memberships plus Nurture Guardian roles; one current Institution Admin; one
current Caregiver with the sole Lead designation and no backup/overlap; three
active Enrollments; current eligible Grant/Thread state for all seven planned
paths; active/ready exact Institution/CareGroup; every required responsive-Web
surface and in-app/Web-open path reachable; Technical Operator with no Nurture
Participant/business role; current final candidate/deployment/policy/trust;
zero unresolved Step/Handoff/Outbox/Notification/`outcome_unknown`; zero stale
authority; and terminal Pilot-3 evidence. A Grant revoked during rehearsal may
be replaced only before kill-switch through the real currently authorized
Guardian flow with a new independent Grant; baseline signing cannot revive an
old Grant, inject a fact, use SQL, or imply repair. Only a
new signed `pilot4_observation` authorization bound to both seals may create the
new observation row.

### D-7.2 Continuous observation window

Pilot-4 uses one uninterrupted 120-hour wall-clock window under the same exact
candidate, deployment binding, activation profile/row, behavior configuration,
schema/migrations, trust set, surface registry, and owner policy. The clock
starts only after Pilot-3 evidence is sealed and the new activation row becomes
current. Its active interval is exactly `[T0,T0+120h)`; the row cannot outlive
`Tend=T0+120h`. At Tend the owner path disables/expires the row and closes the
environment capability, so no business admission remains open merely to sign
evidence. Every 24-hour segment requires complete gate census, audit/telemetry,
backup evidence, no unresolved `POPS-SEV0/1`, and at least one authenticated
planned Pilot journey.

A passing 24-hour segment contains zero `POPS-SEV0` and zero `POPS-SEV1`; a
later resolution cannot preserve that segment or the current PASS clock.

`pilot_observation_recorder`, issuer `my-chat.pilot-observation`, audience
`my-chat.pilot4-daily-observation.v1`, signs one append-only
`pilot4_daily_observation_seal_v1` per exact 24-hour segment. Each seal binds the
window/stage authorization/row/candidate/deployment/policy/trust identities,
segment bounds, exact question-path and Institution-board evidence refs,
gate/authority/telemetry/backup/incident/unresolved census, segment outcome
`pass|failed`, deviations,
database time, predecessor, issuer/audience/key/signature, and contains no
business body or raw identity. `pilot4_daily_observation_seal_current_resolver_v1`
rejects a gap, overlap, duplicate/divergent head, overwrite, invalidation,
changed identity, or unavailable store. A failed segment is recorded and ends
the window; the failed segment is never rewritten to PASS.

For every non-PASS terminal window, the observation recorder uses the separate
schema audience `my-chat.pilot4-terminal-stop-evidence.v1` to sign
`pilot4_terminal_stop_evidence_v1` for `[lastCompletedBoundary,stopTime)` with
the stop trigger, incident/gate/authority census, completed-path refs, and
terminal disable evidence. The partial interval is not a daily PASS segment and
cannot be padded to 24 hours; its length may be zero when the stop occurs exactly
at a 24-hour boundary or Tend.
`pilot4_terminal_stop_evidence_current_resolver_v1` enforces one unique current
head per window and rejects daily/stop cross-kind substitution, duplicate or
divergent heads, interval gaps/overlap/padding, invalidation, or unavailable
state.

A `POPS-SEV0`, gate shutdown, DB restore, incomplete daily evidence, or change
to any identity above terminates the window. A `POPS-SEV1` or non-integrity fix
may safely pause operation but cannot preserve or resume the PASS clock. After
repair, requalification/reassembly/redeployment/rebinding is performed to the
extent required, a new authorization/row is issued, and a fresh 120-hour window
starts. Planned Pilot-3 faults never count inside Pilot-4.

### D-7.3 Exact internal sample and PASS

The successful business sample is exactly seven planned question paths:

1. each of the three designated primary Guardians submits two questions;
2. the second Guardian in Family-1 submits one additional question and proves
   same-family history/reply visibility plus denial for Families 2 and 3;
3. the seven questions cover all three child scopes and each reaches explicit
   caregiver acknowledge plus exactly one reply;
4. Guardian Chat, family board, and family workbench each originate at least one
   question;
5. the four Caregiver `Chat|teacher_board` acknowledge/reply pairings each occur
   at least once;
6. after C-0 bootstrap establishes the Institution and first Admin, that current
   Institution Admin completes CareGroup/staff/roster/enrollment onboarding
   through the real workbench before observation and owner-reads the
   Institution board at least once per 24-hour segment, with no protected body;
   and
7. happy paths use no Technical Operator, SQL, DB repair, direct Nurture route,
   or hidden surface.

These seven question paths instantiate and reuse the four B3 representative
journey pairings; they do not redefine J1-J4 as seven new journeys. Any
successfully admitted unplanned Nurture question or any unplanned Nurture
business effect is an observation-protocol deviation: the current window is
immediately `no_pass` and both gates begin fail-closed shutdown before any new
admission. The already admitted at-most-once outcome may settle only through
the frozen recovery lane after gate closure, and
`pilot4_terminal_stop_evidence_v1` records the deviation. The deviation cannot count,
replace a failed planned path, or fill an unused planned slot. A request
rejected before Nurture admission with zero owner call and zero business effect
may be recorded as a negative probe; the probe does not alter the seven-question
sample or the PASS result.

PASS is all-or-nothing: all seven planned question paths meet the D-5 technical
action and delivery deadlines; `externalProductTrafficCount=0`; there is zero
cross-Workspace/child/family/role disclosure, duplicate business effect,
wrong-Step acceptance, duplicate Handoff, non-idempotent delivery, forbidden
persistence/logging, wrong-recipient/open, fail-open after revoke/redaction/gate
loss, unresolved recovery/DLQ/backup/KMS/gate drift, or manual business edit.
Every operational case has terminal body-free evidence.

The internal result proves only operability, isolation, durability, recovery,
and the scripted surface contract. The result does not prove real-family value,
caregiver efficiency, institution adoption, production availability, staging,
production, GA, cohort expansion, native mobile, or external provider delivery.
Pilot-4 may recommend continued internal observation, stop, or a separately
reviewed next scope; Pilot-4 cannot authorize the next scope.

An independent `pilot_observation_review_controller`, issuer
`my-chat.pilot-observation-review`, audience
`my-chat.pilot4-observation-result.v1`, signs
`pilot4_observation_result_v1` only after applying these disjoint result rules:

- `pass`: exactly five contiguous `pass` daily seals, a passing terminal
  false/empty owner census, and no stop record;
- `no_pass`: either zero through four prior `pass` seals plus one failed full
  daily seal and boundary stop evidence; zero through four prior `pass` seals
  plus one partial-stop record whose reason proves a PASS criterion/incident
  failure; or five `pass` seals plus zero-length Tend evidence proving terminal
  census/sealing/review failure; and
- `stopped`: zero through four `pass` seals plus one partial or boundary stop
  record for preventive/manual/authority withdrawal with no observed PASS
  criterion failure and no failed daily seal.

`no_pass` has priority whenever failure and stop both apply. A terminal window
has at most one failed daily seal and exactly one stop record when non-PASS; the
stop record never overlaps or substitutes for a full daily interval. The result
binds exact
candidate/deployment/stage/row/window, all daily seal ids/digests, PASS/stop
criteria version, `externalProductTrafficCount` and excluded-event audit digest,
deviations/incident digest, terminal result
`pass|no_pass|stopped`, and recommendation
`continue_internal|stop|request_separate_next_scope_review`, plus issue time,
reviewer, issuer/audience/key/signature. Append-only
`pilot4_observation_result_event_v1` and
`pilot4_observation_result_current_resolver_v1` allow
invalidation/supersession but never change a failed window to PASS. The
reviewer cannot activate, extend, or expand traffic.

The terminal daily seal—either any failed full-segment seal or the fifth passing
seal—plus mandatory terminal-stop evidence for a non-PASS window and the
terminal result use the isolated evidence lane during a maximum two-hour
sealing grace after Tend or an earlier stop. Their verifiers
prove the stage authorization and activation row were current during each
recorded segment, but do not require those authorities to remain active after
the mandatory terminal close. The grace permits no product/business route,
owner command, delivery, retry, or open. The final census must show capability
false, active rows `[]`, no unresolved outcome, and no unsealed incident.
Continued observation requires a separately authorized fresh row and a new
window; the sealing result cannot reopen the completed window.

## Pilot-0-D closure

The cumulative D-0 through D-7 review finds no open decision ambiguity inside
the planning scope: `DR-P0=0 / DR-P1=0 / DR-P2=0`. The traffic inventory remains
six open `TR-P0`, three open `TR-P1`, and one
`TR-P1-3a-native-external-delivery` accepted internal-scope exclusion. The
exclusion is not implementation closure. No candidate exists and `QR-*`
remains not applicable.

Current state:

`PILOT0_D_DESIGN_LOCKED / C3_C4_D_IMPLEMENTATION_PENDING /
EXTERNAL_TRAFFIC_NO_GO`

The next permitted action is a separately authorized implementation-readiness
review or C-3/C-4/D implementation task. The permitted action is not Pilot-0-E, Pilot-1, artifact
publication, database provisioning/migration, secret creation, activation, or
traffic.
