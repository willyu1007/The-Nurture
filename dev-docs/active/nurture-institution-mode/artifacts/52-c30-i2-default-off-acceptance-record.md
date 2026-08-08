# C30-I2 Generic Host Adoption Default-Off Acceptance Record

## Decision

- Date: 2026-08-06
- Program task: Nurture `T-002 nurture-institution-mode`
- Implementation task: My-Chat `T-035 scenario-host-adoption` (archived)
- State: `C30_I2_GENERIC_HOST_ADOPTION_ACCEPTED_DEFAULT_OFF`
- Successor: `C30_I3_SCOPE_REVIEW_SEPARATE_AUTHORIZATION_REQUIRED`

The authorized C30-I2 implementation is complete through ordered I2-A..G. The
result is generic My-Chat Host support only. It does not register a Nurture
consumer, enable a capability or Workspace, deploy an artifact, start Pilot or
admit traffic.

## Exact repository handoff

| Repository | Accepted checkpoint | Meaning |
| --- | --- | --- |
| My-Workflow-Base | source `15ff031ed16897920c13fe24c9849531d98607ad`; metadata lock `4350086993d837baa8030564f4e19593dedd96b0`; aggregate `d17f23585bb90ab607eb0fc80af629d8ab13ceb4508118de28162e4fd8846383` | Exact neutral I1-A..F input; unchanged and clean during I2. |
| My-Chat | task registration `500a75edfda47f64163d1baa781b0b7f3cb1e941`; I2-A `470fc862895e1536c624be76b64e5bd8e2d49991`; I2-B `7aca47febc340ae58fcd3d4d8f8feaaeae6b2795`; I2-C `5fd7b082c53cec7c5ed613f63d78cb6660ae55a2`; I2-D `82f97f392a79a832ebed445567cf8c76137ddc84`; I2-E `1ef31d404c1456bdd53964837da8f7d54b50d782`; I2-F `979ba42d915ff18abc4644a68427ebb6d56a34e2`; historical I2-G/runtime-to-first-archive chain `35a41e3becaecba920772251b77a09119687affa` through `b262bfc9ec05fd17f23533749643512e6002e24d`; quality remediation `658b897360734dfa916ce25abda7a8db5fb3f27d`; replacement lock `6725dc68fb8c23da2ff39651b6d825a159a8a8b1`; reacceptance/archive `cd7bbc2623dff8621c2c7155b04d1bf759e8404a` | Exact repaired generic Host implementation, deterministic replacement lock and default-off reacceptance under My-Chat T-035. The first I2-G lock is historical only. |
| The-Nurture | artifact 52 plus task/project governance documentation | Program-level acceptance trace; no product source, manifest, module, schema or migration changed. |

My-Chat's replacement downstream aggregate is
`8172e370dfb5db0876709c6f7a01999314ac266bf71ba166854f9effa510a5ad`
over exact runtime revision `658b897360734dfa916ce25abda7a8db5fb3f27d`.
Its seven named profiles are:

| Profile | Hash |
| --- | --- |
| Trusted invocation runtime | `a69a9de4a53d5b7a2026fc547604795ae7bb4a6ec990da680b0f66dd4cd83be7` |
| Canonical pair runtime/schema | `e611afb340fdd41455c59e2817166297bac0397a76a4d1b47c2fcdced5440cff` |
| Presentation runtime | `aa0746037561dac8ea12cb813e0412509a02a39d4ec629493f0e18679084db69` |
| Action runtime | `01c512c2de3a4714d05a876e02a1cd59880db1b6348b270902385854bfb73c33` |
| Protected runtime | `333f3ff028db7f881d03dd59a0f74eec486437c2d7e7efab27bc87f356efe507` |
| Adoption registry | `ae60f2165a6ff7d2b172b2cb4fc4611f8c4aeef2033d924f4b5d3939a055d5d0` |
| Qualification tests | `c1688aa5cad46548ba8373ff309d280b4fab1ce76e73895513838298d0835736` |

## Closed implementation chain

| Unit | Accepted result |
| --- | --- |
| I2-A | Exact Base TypeScript, Schemas and validators adopted with local aliases normalized and a downstream source lock. |
| I2-B | Interactive and durable principals, detached outbound signing, inbound/response verification and one-time Host-private nonce are closed and default-off. |
| I2-C | Child/Family binding pair creation, replay, current evidence and writer-fenced recovery are atomic under the Host-owned repository boundary. |
| I2-D | Exact provider/presenter/surface registry, semantic renderer, navigation and prepare-only offers are closed without Scenario facts in Host output. |
| I2-E | Direct-empty and claimed-original-Step prepare/submit/recovery use the exact Base drivers and scenario-bound effect identities. |
| I2-F | Protected plaintext uses a dedicated transient carrier, authenticated binding, foreground-only read, lifecycle invalidation and recursive no-copy controls. |
| I2-G | Exact dependency/source/operation/runtime convergence, no legacy fallback, deterministic downstream lock and absent/off census pass. |

## Cumulative qualification

- The initial I2 source passed the full 17-project workspace build using
  ephemeral loopback-only synthetic Logto values and contacted no service. That
  pre-remediation build remains historical evidence rather than a claim about
  the replacement source population.
- The exact byte-locked Base source remains unchanged; the local lint exception
  documents that boundary.
- Workflow contract build, 66-Schema compilation, claim-token boundary, Base
  source lock and portability checks pass.
- The remediated source passes recursive typecheck across all 17 projects, full
  ESLint and 103 files / 700 unit tests; 17 files / 75 tests requiring external
  environments remain intentionally skipped. Workflow-contract typecheck also
  reruns its package build, 66-Schema and source-lock gates.
- Remediation regression coverage closes protected key/binary no-copy,
  pre-dispatch recovery eligibility and immutable evidence, coherent
  Serializable current reads, same-transaction recovery audit/outbox,
  locale-independent canonical JSON and bounded nonce cleanup.
- Strict context and project-governance checks pass. Repository docs lint has
  zero errors; its 231 warnings are non-blocking repository-wide warnings and no
  new error is introduced by T-035.

## Disposable database evidence

The remediation disposable target was exactly PostgreSQL 16 with pgvector on
`127.0.0.1:55438`, container `mychat-c30-i2-remediation`, database
`mychat_c30_i2`.

1. The port and container were absent before creation.
2. Prisma format, validate and generate passed.
3. All 27 migrations applied from an empty database; migration status was
   current and DB-to-SSOT diff was empty.
4. The combined nonce and pair integration population passed 17/17, including
   bounded cleanup over 150 expired nonces plus recovery mismatch rollback and
   same-transaction audit/outbox.
5. The maintained static plus disposable-DB collector passed with census hash
   `989e8294b47a980adcdc10ca35848c19891ca825beae80ffccc8d73271a63fdd`.
6. Final activation, Scenario registration, Host-private state, allowlist,
   positive-route, product and production-peer populations were empty.
7. Nonce and pair tables contain no body, payload, result, plaintext,
   ciphertext or protected-data columns.
8. The exact disposable container was destroyed and port 55438 was free.

No existing database was read, written or inspected.

## Default-off and ownership census

- The four C30 capabilities have no production activation rows.
- Workspace allowlists, product bindings, positive route registrations and
  production peer bindings are empty; external traffic is zero. The one
  composed pair support route is explicitly `hard_default_deny`.
- Support/contract validation is explicitly separate from activation.
- My-Chat owns canonical identity, generic Host runtime and the atomic binding
  pair. The Nurture still owns Scenario facts, permissions, policies and local
  projections; identity or routing remains insufficient authorization.
- No Nurture consumer, T-008, Pilot, C31-C35, deployment, activation, secret or
  external traffic action occurred.

## Exit and rollback

`C30-I2` exits as
`C30_I2_GENERIC_HOST_ADOPTION_ACCEPTED_DEFAULT_OFF`. My-Chat T-035 is archived
at `cd7bbc2623dff8621c2c7155b04d1bf759e8404a`, and its replacement immutable
source/lock chain is the rollback boundary. The only eligible successor is a
separately authorized `C30-I3` scope review. This record does not
authorize I3 implementation, I4, a Nurture consumer, database apply,
capability/Workspace activation, deployment, T-008, Pilot or traffic.
