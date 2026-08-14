# W11 Parent Communication Extension v1.1 — Digest and Adoption Pin

## Exact publication

| Field | Value |
| --- | --- |
| Interface | `nurture.parent-communication-owner@1.1.0` |
| Content digest | `sha256:d705146eb00185cbec425953e9a6fa358cc5fb9af193c86f788276617c7b29d1` |
| Digest input | [`parent-communication-owner-extension.owner-contract.json`](../../../../packages/nurture-scenario/contracts/parent-communication-owner/v1-1/parent-communication-owner-extension.owner-contract.json) |
| Base interface | `nurture.parent-communication-owner@1.0.0` at `sha256:b1dce3a7…` — declared `additive_extension_no_base_mutation`; the extension validator recomputes the frozen v1 digest on every run |
| Canonicalization | Strict JSON parse, RFC 8785 via `nurtureCanonicalJson`, UTF-8, SHA-256 |
| Surface baseline | `nurture.surface-contract@1.20.0` / `sha256:35d6340f…` (unchanged) |
| Capability dependencies | `redact_family_care_message@1.0.0` (referenced, not re-declared) |
| Runtime posture | Three private routes mounted default-off behind `NURTURE_PARENT_COMMUNICATION_EXTENSION_ENABLED` (independent of the frozen v1 gate); no deployment, activation or traffic |
| Owner ports | `createPrismaParentCommunicationExtensionBinding` implemented and DB-lane qualified over the SAME v1 resolver/reads/ref HMAC; production `main.ts` constructs no binding |

## Frozen ingress inventory

Reads answer under the v1 envelope discipline (parent resolution, coarse
cache partition keyed by operation + presentation_version, per-message
identity in the response echo). The exchange echoes exact
`command_request_id` and `message_ref`.

| T-039 rows | Operation | Internal path |
| --- | --- | --- |
| `P-H05` prepare | `redaction_preview_query` | `POST /internal/nurture/parent-communication-owner/v1.1/redaction-preview` |
| `P-H05` commit | `redact_exchange` | `POST /internal/nurture/parent-communication-owner/v1.1/redact` |
| `P-H06` | `delivery_receipt_query` | `POST /internal/nurture/parent-communication-owner/v1.1/delivery-receipts` |

## Command model the consumer must honor

- Two-step confirm in the frozen W3 discipline: the preview issues the
  confirmation for the exact message head; the commit consumes it once and
  compares the prepared preview digest. Confirmation drift re-prepares
  (`stale_confirmation` / `confirmation_expired` / `confirmation_foreign`
  / `preview_digest_mismatch` → `re_prepare`); a divergent reuse of the
  command id lands `command_payload_conflict` → `new_command`.
- Exact same-command replay answers the recorded result with
  `execution_disposition: replayed` and the ORIGINAL `redacted_at`; a new
  command against an already-redacted message answers committed
  `already_satisfied` WITHOUT `redacted_at`/`cascade` — render it as "this
  message is already redacted", never as a fresh apply.
- `outcome_unknown` recovery is exact same-command replay
  (`reconcile_same_command`); a new command is never the recovery path.
- Redaction is irreversible, author-actor only and always audited; the
  preview is a typed impact summary (bounded counts + a boolean), never
  bodies.

## Adoption notes for the My-Chat consumer

- Pin key + version + digest exactly; keep the 1.0.0 consumer untouched —
  the extension is a SEPARATE module pinning 1.1.0 and its base.
- `message_ref` is the v1-issued ref family (the v1 detail/send refs
  resolve directly); `presentation_version` must be the CURRENT v1
  presentation — a stale one masks `context_changed` (re-read the v1
  summary, then re-prepare).
- The delivery answer is one aggregate state per message under the frozen
  v1 mapping; recipient identities, receipt ids and counts never appear.
- Conformance fixtures: 11 + 12 invalid probes at
  `packages/nurture-scenario/contracts/parent-communication-owner/v1-1/conformance-fixtures.json`,
  16-scenario census; refresh the sanitized snapshot in the adoption
  change.

## Qualification summary (2026-08-15)

Contract validator passes (digest recompute, frozen-v1-unmoved recompute,
rows P-H05/P-H06, 16-scenario census, 11 fixtures, 12 probes); ingress
census registers the three routes (controller-routes 52);
scenario-service suite 187 tests incl. the 7-case W11 e2e; unit lane 104
files / 1133 tests; production-DB lane 58 files / 499 tests green incl.
the 5-case real-owner suite (preview→commit→exact replay over a real
v1-sent message, fresh-command `already_satisfied`, divergent-reuse
denial, live receipt aggregation, v1-boundary masking). No activation,
deployment, traffic or consumer change occurred in the Nurture
repository.
