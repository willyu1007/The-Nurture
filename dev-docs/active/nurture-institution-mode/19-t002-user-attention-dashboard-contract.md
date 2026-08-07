# T-002 Owner-Path Follow-Up — Typed User-Attention Dashboard Contract

## Outcome

- Task: T-002 (owner path), surfaced by the T-009 pin rotation on 2026-08-07
- Slice: adopt My-Chat's typed dashboard-item + acknowledge contract on the
  Nurture user-attention owner endpoints
- Executed: 2026-08-08 (local)
- **Verdict: `COMPLETE`** — the X5 joint lane compiles against the new
  contract and is green; all Nurture gates pass at the rotated pins.

## Drift Being Closed

My-Chat commit `8d508f1` ("feat(dashboard): add Nurture interaction loop")
replaced the route-only attention resolution with a typed contract:
`resolveNurtureDashboardItem` expects the owner resolve endpoint to return a
`NurtureAttentionDashboardItem` (contract_version 1, presentation_type
`nurture_attention_v1`), and `createNurtureAttentionAcknowledgeHttpSource`
expects an acknowledge endpoint with `expected_item_version` /
`idempotency_key` semantics. Nurture still served the fixed
`title_display`/`body_display`/`route_key` shape and had no action route.

## Owner-Side Adoption

- `packages/nurture-scenario/src/domain/institution/user-attention-activation.ts`
  - `NurtureUserAttentionService.resolve` now returns
    `{ status: "ready", recipient_user_ids, item }` where `item` is the typed
    dashboard item. Display fields stay generic (fixed title, no summary, no
    message/item detail) — the attention surface remains leak-free.
  - The owner-reread and revocation fences are unchanged and now shared by
    both verbs (`evaluateCurrentFacts`); the only gate widening is that an
    `acknowledged` item stays presentable (with zero available actions) so
    the dashboard can render the acknowledged state. Every other lifecycle
    state still stops as before.
  - New `NurtureUserAttentionService.acknowledge`: same ref parsing and
    fences (actor required), then version fencing on the presented item
    version, idempotent replay from the stored acknowledgement record, and
    `version_conflict` on any mismatch, already-acknowledged-under-a-
    different-key, or lost write race.
  - Version mapping: the persisted `nurture_family_care_item.version` is
    0-based at creation while the contract requires a positive
    `item_version`; the presented version is `persisted + 1`
    (`presentedItemVersion`). `owner_ref.version` uses the same presented
    value; a successful acknowledge answers with `expected + 1`.
- `packages/nurture-db/src/repositories/user-attention.repository.ts`
  - Facts now include item `version`, `updated_at`, the acknowledged flag,
    and the stored owner acknowledgement (for replay).
  - `applyAcknowledgement` is a guarded transaction fenced in the mutated
    channel: conditional item update on `{version, status: "open",
    writerContract: "legacy_v1", grant active/unrevoked/unexpired}` — a
    concurrent acknowledge, lifecycle change, or revoke resolves to
    `conflict`, never a lost update. The single-writer cutover (C6/C8) is
    preserved: harness-managed rows fail closed on this legacy-shape write.
  - The acknowledgement receipt (`user_attention_receipt` canonical ref) is
    the `acknowledged` item event; its payload carries
    `{source: "user_attention_owner", idempotency_key, actor_user_id,
    acknowledged_at, item_version}` so replays restate the original response
    verbatim. The business `child_link_receipt` transitions
    `delivered|read → acknowledged` alongside, mirroring the legacy
    `acknowledge_item` command.
- `apps/backend/src/server.ts` / `app.ts`
  - New `POST /internal/nurture/activation/user-attention/acknowledge` with
    the same service-token fences as resolve (503 unconfigured, 401 bad
    bearer) plus strict request validation (400
    `invalid_owner_action_request`).

## Verification (2026-08-08, local)

| Gate | Result |
| --- | --- |
| `pnpm typecheck` | PASS |
| `pnpm test:unit:ci` + population | 627/627 (min 458) |
| `pnpm test:db:ci` + population | 259/259 (min 180) — includes a new owner acknowledge journey (apply, replay, version fences, receipt/event state) |
| `pnpm test:dev-host:ci` + population | 27/27 (min 25) — includes acknowledge-route auth/validation fences |
| `pnpm test:scenario-service` | PASS |
| `pnpm test:x5` (fresh disposable `x5_nurture` + `x5_my_chat`, 18 + 28 migrations) | 4/4 — `resolveNurtureDashboardItem` returns `nurture_attention_v1` through the strict My-Chat parser; post-revoke stays fail-closed |
| `pnpm verify:workflow-contract-pin` | PASS at My-Chat `df7a273b`, Base `8a3ea902` |
| `verify:test-routing` / `verify:persistence-boundaries` / `verify:formal-ingress-contract` | PASS |

The Nurture scenario self-pin rotated with this change to
`8943e1f3d63d2aa6fec4568bcf2cca831ab1b643556e058f1b754fd6476a7e56`
(recorded in `docs/project/integrations/my-chat-workflow-contract.json`
together with the T-009 pin rotation to My-Chat `df7a273b` / Base
`8a3ea902`).

## Non-Effects

Owner endpoints remain internal-token gated and default-off outside the dev
host; no capability activation, deployment, secret, or traffic change.
