# C30-I1-C Subject Presentation Scope Freeze

## Decision

- Date: 2026-08-05
- Governance decision: `REUSE_TASK`
- Mapping: `M-002 > F-002 > T-002 nurture-institution-mode`
- Entry: C30-I1-A accepted; C30-I1-B accepted at Base source `edbcd74…`
  plus source lock `9a15865…`
- State: `I1_C_ACCEPTANCE_REOPENED / I1_C4_QUALITY_REPAIR_FROZEN`
- Downstream: `I1_D_NO_GO / C30_I2_NO_GO / ACTIVATION_NO_GO`

This review freezes the neutral Base contract for discovering and resolving a
Scenario-owned subject context and presenting owner-safe semantic output. The later
user authorization opens all four ordered implementation units but does not alter
their boundaries or permit downstream adoption.

## Accepted inputs and ownership

- I1-C request bodies are the delegated `operation.input` inside the accepted I1-A
  `ScenarioPrivateInvocationV1`. I1-C does not repeat caller, principal, issuer,
  audience, workspace, scenario route, request/time/nonce or signature fields.
- I1-B remains the only Base definition of canonical-object binding bodies. I1-C
  may consume accepted earlier exports but does not copy or redefine owner refs,
  binding refs, pair evidence, recovery status or current-owner authority.
- Base owns neutral transport-safe types, strict assertions, JSON Schemas, neutral
  fixtures and conformance. My-Chat later owns authenticated routing, provider
  registration, current-owner access checks, shell persistence, rendering and
  capability exposure. Nurture later owns Scenario labels, presentation keys,
  semantic facts and action preparation policy.
- Every returned ref is an opaque, short-lived locator. A subject-context,
  presentation-item, continuation or action-target ref is not a canonical object,
  relationship, authorization grant, replay token, offline credential or durable
  storage identity.
- The issuer binds each locator to the verified principal, Workspace, scenario,
  intended slot and relevant owner object/version. A consumer cannot inspect,
  compare, synthesize, transfer or repurpose the ref.

## Frozen subject-context provider wire

```ts
type ScenarioSubjectContextRefV1 = string;

type ListScenarioSubjectContextsInputV1 = {
  provider_version: 1;
  cursor?: string;
  page_size?: number;
};

type ResolveScenarioSubjectContextInputV1 = {
  provider_version: 1;
  subject_context_ref: ScenarioSubjectContextRefV1;
  known_context_version?: string;
};

type ScenarioSubjectContextOptionV1 = {
  subject_context_ref: ScenarioSubjectContextRefV1;
  scope_kind: "single_subject" | "subject_collection";
  route_class: "subject_detail" | "subject_collection";
  safe_label: ScenarioSafeLabelV1;
  safe_disambiguation?: ScenarioSafeLabelV1;
  context_version: string;
  issued_at: string;
  expires_at: string;
};

type ListScenarioSubjectContextsResultV1 =
  | { status: "resolved"; context: ScenarioSubjectContextOptionV1 }
  | {
      status: "needs_selection";
      scope_kind: "unresolved";
      candidates: ScenarioSubjectContextOptionV1[];
      next_cursor?: string;
    }
  | { status: "unavailable"; safe_reason: ScenarioSafeReasonV1 };

type ResolveScenarioSubjectContextResultV1 =
  | {
      status: "resolved";
      context: ScenarioSubjectContextOptionV1;
      resolved_at: string;
    }
  | { status: "context_changed"; safe_reason: ScenarioSafeReasonV1 }
  | { status: "unavailable"; safe_reason: ScenarioSafeReasonV1 };
```

List and resolve are distinct operations; no generic `get_subject` operation is
allowed. My-Chat must not rank, merge, infer or auto-select candidates. A
`subject_collection` is one opaque context and exposes no member ids, member count
or expansion surface. A successful resolve may issue a new ref but cannot extend an
old ref in place.

`ScenarioSubjectContextRefV1` is deliberately not `DomainContextRef`. It has no
`namespace`, `object_type`, `object_id` or `canonical_ref`, and consumers may not
decode or construct it.

## Frozen safe-copy primitives

```ts
type ScenarioSafeTextV1 = {
  kind: "plain_text";
  value: string;
  locale: string;
};

type ScenarioSafeLabelV1 = ScenarioSafeTextV1;

type ScenarioSafeReasonV1 = {
  reason_code: string;
  message: ScenarioSafeTextV1;
  help?: ScenarioSafeTextV1;
  retry_class: "none" | "refresh" | "retry_later" | "contact_support";
};

type ScenarioToneV1 =
  | "neutral"
  | "informational"
  | "positive"
  | "warning"
  | "critical";

type ScenarioNarrationPolicyV1 = "allowed" | "display_only";
```

Safe text is owner-localized BCP-47 plain text. Base rejects Markdown, HTML, URL/
URI/address-like locator text, control characters, unresolved template parameters
and explicit internal exception/provider/database details. Locale- and domain-aware
diagnostic, prescriptive and Anti-Metric semantics remain an executable Scenario-owner
disclosure-policy gate before construction of these values; neutral Base does not
guess medical meaning from localized prose. Display-safe does not mean persist-safe:
these values remain ephemeral presentation output unless a later Host contract
explicitly classifies a durable shell field.
`reason_code` is owner-declared registered vocabulary; My-Chat may route only on
`retry_class` and cannot translate the reason code into business meaning or copy.

## Frozen presentation wire

```ts
type ScenarioPresentationItemRefV1 = string;

type PresentScenarioSubjectContextInputV1 = {
  presentation_version: 1;
  subject_context_ref: ScenarioSubjectContextRefV1;
  presentation_key: string;
  view_query?: {
    view_mode: "current" | "recent" | "history";
    presentation_item_ref?: ScenarioPresentationItemRefV1;
    cursor?: string;
    page_size?: number;
  };
};

type ScenarioSemanticPresentationV1 = {
  presentation_version: 1;
  presentation_key: string;
  subject_context_ref: ScenarioSubjectContextRefV1;
  context_version: string;
  generated_at: string;
  blocks: ScenarioSemanticBlockV1[];
  navigation: ScenarioNavigationOfferV1[];
  actions: ScenarioActionOfferV1[];
};

type ScenarioPresentationResultV1 =
  | { status: "ready"; presentation: ScenarioSemanticPresentationV1 }
  | { status: "empty"; presentation: ScenarioSemanticPresentationV1 }
  | { status: "context_changed"; safe_reason: ScenarioSafeReasonV1 }
  | { status: "unavailable"; safe_reason: ScenarioSafeReasonV1 };
```

Presentation is read-only and follows a successful resolve. The result union is
closed: `partial`, `not_modified`, `error` and `needs_selection` are forbidden.
Provider/database outage maps to a generic HTTP 503 at the later Host boundary; it
must not be disguised as cached/partial HTTP 200 presentation data.
`presentation_key` and every navigation `route_class` are registered bounded keys,
not renderer identifiers or product authorization.

## Frozen semantic blocks

Every block contains `block_key`, `tone` and `narration`. The closed flat
`ScenarioSemanticBlockV1` union contains exactly six variants:

| Block | Fields after the common base |
| --- | --- |
| `summary` | optional `title`; required `body` |
| `notice` | optional `title`; required `body` |
| `fact_group` | optional `title`; `facts[]` of `fact_key`, `label`, `value`, `tone` |
| `metric_group` | optional `title`; `metrics[]` of `metric_key`, `label`, `value`, `tone` |
| `item_collection` | optional `title`; `items[]` of `item_key`, `title`, optional `summary`, `badges`, optional `occurred_at`, optional `presentation_item_ref`; optional `next_cursor` |
| `timeline` | optional `title`; `entries[]` of `entry_key`, `title`, optional `summary`, `badges`, required `occurred_at`, optional `presentation_item_ref`; optional `next_cursor` |

A branch's exact discriminator is `kind` with the corresponding table value.
A badge contains only `label: ScenarioSafeTextV1` and
`tone: ScenarioToneV1`. Blocks cannot nest and have no arbitrary extension,
renderer primitive, form, draft, media body, URL, raw id, canonical ref,
command/audit ref or protected-interaction body. Metric rows cannot use Base's
explicit forbidden rank/score/comparison key vocabulary. The Scenario owner
additionally rejects semantic rank, score, comparative trend, cross-scope comparison
or another Anti-Metric in key or copy before emitting the structurally valid row.

## Frozen navigation and action offers

```ts
type ScenarioNavigationOfferV1 = {
  route_class: string;
  label: ScenarioSafeTextV1;
  view_mode?: "current" | "recent" | "history";
  continuation_ref?: string;
  priority: "primary" | "secondary" | "tertiary";
  narration: "allowed" | "display_only";
};

type ScenarioActionTargetRefV1 = string;

type ScenarioActionOfferV1 =
  | {
      availability: "available";
      action_key: string;
      label: ScenarioSafeTextV1;
      help?: ScenarioSafeTextV1;
      target_ref: ScenarioActionTargetRefV1;
      expected_version?: string;
      confirmation_class: "explicit" | "strong_authorization";
      priority: "primary" | "secondary" | "tertiary";
      tone: ScenarioToneV1;
      narration: ScenarioNarrationPolicyV1;
    }
  | {
      availability: "unavailable";
      action_key: string;
      label: ScenarioSafeTextV1;
      safe_reason: ScenarioSafeReasonV1;
      priority: "primary" | "secondary" | "tertiary";
      tone: ScenarioToneV1;
      narration: ScenarioNarrationPolicyV1;
    };
```

Navigation is read-only and contains no URL, raw target, command, effect or action
payload. An available action offer is only a locator for a later I1-D prepare call;
it is never submit authority and requires a registered active domain-action contract
and authenticated handler. An unavailable offer has no target/version and may be
returned only when the current principal is entitled to know the action exists;
otherwise the action is omitted.

I1-C must not reuse the current Run-level `WorkflowActionAvailability`, its
`target_type`/`target_id`, `serverAction`, `params`, `extensions`, capability token
or `CommandExecution`. Action execution remains entirely outside I1-C.

## Bounds and expiry

| Value | Frozen bound |
| --- | --- |
| Subject-context ref lifetime | at most 30 minutes |
| List cursor lifetime | at most 5 minutes |
| Presentation cursor/item/continuation/action-target ref lifetime | at most 5 minutes |
| Default / maximum page size | 10 / 20 |
| Serialized presentation result | at most 64 KiB UTF-8 |
| Blocks per presentation | at most 20 |
| Facts, metrics, items or timeline entries per block/page | at most 20 |
| Navigation / action offers | at most 8 / 8 |
| Label / title | at most 80 / 120 characters |
| Summary or body / help | at most 500 / 240 characters |

All exposed timestamps are canonical UTC instants. Assertions own explicit
cross-field subject-option duration and output-size checks where JSON Schema alone
cannot express them portably. Explicitly clocked active-option/result assertions
own current-time qualification without reading the wall clock. Opaque-ref codecs
own bounded syntax, not hidden token claims; the issuing/resolving owner enforces
the five- or thirty-minute lifetime.
Unknown fields, non-canonical time, unsafe machine keys and duplicate block/item
keys are rejected; an owner rejects expired locators without extending them.

## AI narration projection

The AI-facing projection is derived, not another wire or persisted DTO. It includes
only safe text whose block/offer declares `narration = allowed`. It strips every
subject/item/continuation/action target ref, context/expected version, cursor,
reason/action code and `display_only` value. The projection may summarize allowed
safe text but cannot invent facts, relationships, actions or authority.

## Donor and current-source disposition

| Candidate | Disposition | Reason |
| --- | --- | --- |
| T-029 B01/B05 | `REWORK` | Useful structural ideas, but product/owner semantics and broad envelopes cannot enter neutral Base as-is. |
| T-029 B03 | `DEFER` | Packaging/generated descriptors belong to later convergence, not I1-C wire scope. |
| T-029 B06 | `REMOVE_OR_REWORK` | Umbrella capability/activation semantics cannot be carried into presentation. |
| T-029 B07 | `REGENERATE` | Evidence and locks must be produced from the final accepted I1-C source population. |
| Base `WorkflowActionAvailability` | `NEGATIVE_DONOR` | Run-level raw target fields and execution semantics violate the prepare-only offer boundary. |
| My-Chat `InteractionEnvelope` | `NEGATIVE_DONOR` | Broad Host interaction shape mixes ownership and does not provide the frozen closed presentation union. |
| Nurture `institution-surfaces.ts` `opaque_ref` | `NEGATIVE_DONOR` | Existing strings encode Nurture database ids; I1-C refs must be owner-issued opaque locators. |

Zero donor file is approved for direct merge.

## Planned Base impact

| Area | Frozen future impact |
| --- | --- |
| `templates/host-runtime/packages/workflow-contracts/src/types/` | Add safe-copy/ref, provider and presentation types plus strict assertions; export only the neutral public wire surface. |
| `templates/host-runtime/packages/workflow-contracts/schemas/` | Add matching closed version-1 Schemas. |
| `conformance/fixtures/` and `conformance/tests/` | Add neutral positive/negative, expiry/bounds, exposure and Schema/codec parity populations. |
| Contract source lock | Refresh only in I1-C4 after the accepted source/test population is final. |

No Base runtime/provider implementation, My-Chat consumer, Nurture presenter,
scenario manifest/module, Prisma schema/migration, database, renderer, durable shell,
capability or dependency/source convergence file is in the I1-C source scope.
Base fixtures use neutral values and contain no Nurture/My-Chat product key, product
reason, product action or Child/Family/Institution vocabulary.

## Ordered implementation units

| Unit | Scope | Entry | Exit |
| --- | --- | --- | --- |
| `I1-C1` safe-copy/ref primitives | SafeText/Label/Reason, tone/narration and opaque ref/cursor bounded-syntax validators plus lifetime-contract fixtures. | Complete at Base `64533a6…`. | Types/assertions/Schemas/neutral fixtures pass; no provider/presentation union. |
| `I1-C2` subject-context provider | List/resolve inputs, option and closed result unions; pagination, selection and context-change behavior. | Complete at Base `600faee…`. | Provider Schema/codec parity and authority/exposure negatives pass. |
| `I1-C3` semantic presentation | Present input/result, six blocks, navigation/action offers and narration projection/exposure negatives. | Complete at Base `13d2077…`. | Presentation bounds, closed unions and prepare-only semantics pass. |
| `I1-C4` cumulative qualification | Full Base verification, deterministic build/manifest and exact source-lock seal. Adds no wire. | Reopened after quality review; repair scope frozen in artifact 26. | Successor source/lock chain closes R1-R6 and passes cumulative conformance. |

No unit opens I1-D, performs consumer adoption or satisfies the cumulative C30-I1
exit. The previous I1-C4 acceptance is reopened; I1-D is ineligible until successor
I1-C4 acceptance and another explicit authorization.

## Acceptance matrix

I1-C cumulative acceptance requires all of the following:

1. TypeScript compiles without `any`, Host runtime or Scenario product imports.
2. Every public union is closed and JSON Schema/TypeScript assertion behavior is
   aligned for neutral positive and negative fixtures.
3. Negatives cover unknown/missing fields, malformed/overlong refs and cursors,
   expired/not-yet-issued subject options and provider-side expired-locator handling,
   unsafe structural text,
   invalid locale/time/key, duplicate keys, overflow, nesting, arbitrary extensions
   and forbidden ids/URLs/command/protected bodies.
4. Provider fixtures prove distinct list/resolve semantics, no auto-selection,
   opaque collection treatment, stale `known_context_version` and fail-closed
   unavailable behavior.
5. Presentation fixtures prove the six variants, all four result statuses,
   read-only navigation, prepare-only available actions, entitled unavailable versus
   omission, and AI projection stripping.
6. Legacy fixtures remain unchanged; no fallback, activation or runtime behavior is
   inferred from successful validation.
7. Locale/domain semantic disclosure and Anti-Metric negatives are required from
   each later Scenario owner before consumer adoption; Base qualification does not
   claim localized natural-language policy enforcement.
8. Full Base qualification, repeated deterministic output and exact source lock pass
   in I1-C4. C30-I2 remains NO-GO until I1-A through I1-F all pass.

## Rollback and invalidation

Each unit is committed separately. To roll back the accepted slice, revert the metadata-only source
lock first, then the cumulative review repair, C3, C2 and C1 as needed. No database or runtime compensation exists
because this freeze and the planned Base slice create no consumer adoption.

Any change to wire fields, result variants, block variants, safe-copy rules, bounds,
expiry, AI projection, action-offer authority or Base file-impact list invalidates
this freeze and requires renewed scope review before source work continues.

## Verification and effect boundary

- The original scope review inspected the accepted Pilot/context contracts, T-029 disposition,
  prior presentation decisions and live Base/My-Chat/Nurture candidate surfaces.
- Its Workflow Context checksum was
  `46c566a0123a9e555b5b6bc0142bb3fef9938612d314e643eb5916563ab244dd`;
  strict Context, project-state, governance, T-002 query and whitespace checks pass.
  Document/anchor lint checks 417 Markdown files with zero errors or warnings.
- C4's prior build/qualification is historical in artifact 25. The quality review
  reopened acceptance and artifact 26 freezes the successor repair before source
  work. No Prisma generate, database connection/apply, one-time PostgreSQL,
  deployment, capability, activation, T-007/T-008, Pilot or traffic action ran.
- No My-Chat/Nurture product source changed. This artifact remains the scope SSOT;
  artifact 26 is the current repair-scope record.

## Next gate

I1-C acceptance is reopened. The next eligible work is only the frozen I1-C4
quality repair and successor qualification; I1-D source/scope review, all
consumer/runtime adoption and C30-I2 remain unauthorized.
