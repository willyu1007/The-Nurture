import { randomUUID } from "node:crypto";
import type { NurtureCommandExecutionContext } from "../domain/commands/command-kernel.js";
import type { NurtureInteractionContextService } from "../domain/interactions/interaction-context.js";
import {
  NO_CHILD_ATTRIBUTION_REVISION,
  type NurtureAttributionAppendedRow,
  type NurtureMediaAttributionTransaction,
  type NurtureMediaAttributionWriteFacts,
} from "../domain/institution/media-attribution-transaction.js";
import {
  CAREGIVER_BOARD_ROLES,
  issueBoardOpaqueRef,
  issueBoardSealedRef,
  resolveBoardSealedRef,
  type BoardScopeV1,
  type CaregiverFactAuthorityV1,
} from "./board-projection.js";
import {
  createBoardWriteSpec,
  type BoardWriteRefusalV1,
  type NurtureBoardWriteSpec,
} from "./board-write-spec.js";
import {
  computeHarnessInputIntegrityTag,
  issueHarnessConfirmation,
} from "./confirmation.js";

/**
 * G3-C1 media and child-attribution lifecycles (02-architecture.md D-12).
 *
 * Media availability, child attribution and family publication are three
 * separate canonical axes. None of them mirrors another: `ready` does not mean
 * attributed, `confirmed` does not mean publishable, and `published` is never
 * written back onto an asset or an attribution.
 */
export const CONFIRM_CHILD_MEDIA_ATTRIBUTION_CAPABILITY = {
  key: "confirm_child_media_attribution",
  version: "1.0.0",
} as const;

export const REJECT_CHILD_MEDIA_ATTRIBUTION_CAPABILITY = {
  key: "reject_child_media_attribution",
  version: "1.0.0",
} as const;

export const SUPERSEDE_CHILD_MEDIA_ATTRIBUTION_CAPABILITY = {
  key: "supersede_child_media_attribution",
  version: "1.0.0",
} as const;

export const MEDIA_ASSET_TARGET_KIND = "media_asset";
export const CHILD_OPTION_KIND = "attribution_child";

export const MEDIA_ASSET_LIFECYCLE_STATES = [
  "preparing",
  "ready",
  "unavailable",
  "discarded",
  "redacted",
] as const;

export type MediaAssetLifecycleV1 = (typeof MEDIA_ASSET_LIFECYCLE_STATES)[number];

export const CHILD_ATTRIBUTION_STATES = [
  "candidate",
  "confirmed",
  "rejected",
  "superseded",
] as const;

export type ChildAttributionStateV1 = (typeof CHILD_ATTRIBUTION_STATES)[number];

/** `automatic_face_match` belongs to the default-off G3-C2 lane, not to C1. */
export type AttributionSourceV1 =
  | "manual"
  | "organizer_candidate"
  | "automatic_face_match";

const MEDIA_TRANSITIONS: Record<MediaAssetLifecycleV1, readonly MediaAssetLifecycleV1[]> = {
  preparing: ["ready", "unavailable", "discarded", "redacted"],
  ready: ["unavailable", "discarded", "redacted"],
  unavailable: ["ready", "discarded", "redacted"],
  discarded: [],
  redacted: [],
};

const ATTRIBUTION_TRANSITIONS: Record<
  ChildAttributionStateV1,
  readonly ChildAttributionStateV1[]
> = {
  candidate: ["confirmed", "rejected"],
  confirmed: ["superseded"],
  rejected: [],
  superseded: [],
};

export const isLegalMediaAssetTransition = (
  from: MediaAssetLifecycleV1,
  to: MediaAssetLifecycleV1,
): boolean => MEDIA_TRANSITIONS[from].includes(to);

export const isLegalAttributionTransition = (
  from: ChildAttributionStateV1,
  to: ChildAttributionStateV1,
): boolean => ATTRIBUTION_TRANSITIONS[from].includes(to);

/** An asset can back a draft only while the owner can actually serve it. */
export const mediaUsableForDraft = (lifecycle: MediaAssetLifecycleV1): boolean =>
  lifecycle === "ready";

// ---------------------------------------------------------------------------
// One-time legacy migration mapping.

export type LegacyMediaAssetStatusV1 = "active" | "hidden" | "deleted";
export type LegacyAttributionStatusV1 =
  | "candidate"
  | "confirmed"
  | "rejected"
  | "corrected"
  | "hidden"
  | "deleted";

export type LegacyMappingDecisionV1<State> =
  | { status: "mapped"; state: State }
  | { status: "ambiguous"; reason_code: string };

/**
 * Maps one legacy `NurtureMediaAssetRef.status` row. `active` is unambiguous;
 * `hidden` and `deleted` conflate "removed before anyone saw it" with "stopped
 * showing after a family already had it", so they require release evidence and
 * otherwise fail the migration gate rather than being guessed.
 */
export const mapLegacyMediaAssetStatus = (row: {
  legacy_status: LegacyMediaAssetStatusV1;
  has_committed_release?: boolean;
  owner_can_provide?: boolean;
}): LegacyMappingDecisionV1<MediaAssetLifecycleV1> => {
  if (row.legacy_status === "active") {
    return { status: "mapped", state: row.owner_can_provide === false ? "unavailable" : "ready" };
  }
  if (row.has_committed_release === undefined) {
    return { status: "ambiguous", reason_code: "missing_release_evidence" };
  }
  return {
    status: "mapped",
    state: row.has_committed_release ? "redacted" : "discarded",
  };
};

/**
 * Maps one legacy `NurtureChildMediaAttribution.status` row. `corrected` only
 * becomes `superseded` when the successor is actually known, and legacy
 * `hidden`/`deleted` need an explicit, evidence-backed resolution.
 */
export const mapLegacyAttributionStatus = (row: {
  legacy_status: LegacyAttributionStatusV1;
  superseded_by_attribution_id?: string;
  resolved_as?: Extract<ChildAttributionStateV1, "rejected" | "superseded">;
  evidence_ref?: string;
}): LegacyMappingDecisionV1<ChildAttributionStateV1> => {
  if (
    row.legacy_status === "candidate" ||
    row.legacy_status === "confirmed" ||
    row.legacy_status === "rejected"
  ) {
    return { status: "mapped", state: row.legacy_status };
  }
  if (row.legacy_status === "corrected") {
    return row.superseded_by_attribution_id
      ? { status: "mapped", state: "superseded" }
      : { status: "ambiguous", reason_code: "missing_supersession_link" };
  }
  if (!row.resolved_as || !row.evidence_ref) {
    return { status: "ambiguous", reason_code: "missing_resolution_evidence" };
  }
  if (row.resolved_as === "superseded" && !row.superseded_by_attribution_id) {
    return { status: "ambiguous", reason_code: "missing_supersession_link" };
  }
  return { status: "mapped", state: row.resolved_as };
};

// ---------------------------------------------------------------------------
// Manual attribution capabilities.

export type ChildAttributionFactV1 = {
  attribution_id: string;
  child_care_process_id: string;
  status: ChildAttributionStateV1;
  revision: number;
  source: AttributionSourceV1;
  /**
   * The instant the owner recorded this decision: `confirmed_at` for a
   * confirmation, the append instant otherwise. Absent exactly while the fact
   * is an undecided candidate. An idempotent repeat answers with THIS value —
   * a repeat that stamped its own clock would report a decision at a moment
   * the decision did not happen (the cancel-instant class).
   */
  decided_at?: string;
};

export type MediaAttributionFactsV1 = {
  authority: CaregiverFactAuthorityV1;
  media_lifecycle: MediaAssetLifecycleV1;
  /** The exact immutable original-media revision this decision binds to. */
  media_revision: number;
  /** Children of this exact CareGroup the actor may currently attribute to. */
  eligible_child_ids: string[];
  attributions: ChildAttributionFactV1[];
};

export type MediaAttributionReadPort = {
  listAttributableMediaIds(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<string[]>;
  loadMediaAttributionFacts(input: {
    workspace_id: string;
    participant_id: string;
    media_asset_id: string;
  }): Promise<MediaAttributionFactsV1 | null>;
};

export type MediaAttributionDependencies = {
  integrity_key: string;
  reads: MediaAttributionReadPort;
  now?: () => Date;
};

export type AttributionRecordV1 = {
  attributionRef: string;
  childRef: string;
  status: ChildAttributionStateV1;
  revision: number;
  source: AttributionSourceV1;
  decidedAt: string;
};

export type AttributionDecisionV1 =
  | { status: "committed"; mediaRef: string; mediaRevision: number; records: AttributionRecordV1[] }
  | { status: "already_satisfied"; mediaRef: string; records: AttributionRecordV1[] }
  | { status: "needs_input"; fields: string[] }
  | { status: "denied"; reason_code: string };

const actorEligible = (authority: CaregiverFactAuthorityV1): boolean =>
  CAREGIVER_BOARD_ROLES.includes(authority.role) &&
  authority.role_scope_type === "care_group" &&
  authority.role_scope_matches_source &&
  authority.role_assignment_current;

export const issueChildOptionRef = (
  integrityKey: string,
  scope: BoardScopeV1,
  childCareProcessId: string,
): string => issueBoardSealedRef(integrityKey, scope, CHILD_OPTION_KIND, childCareProcessId);

export const issueMediaAssetTargetRef = (
  integrityKey: string,
  scope: BoardScopeV1,
  mediaAssetId: string,
): string => issueBoardSealedRef(integrityKey, scope, MEDIA_ASSET_TARGET_KIND, mediaAssetId);

/**
 * The public record of one decision. The ref derives from
 * (asset, child, revision) — an identity both the commit acknowledgement and
 * every later read can compute. An earlier version derived it from the
 * predecessor ROW's id plus the successor's revision, a pair that exists
 * nowhere once the writer appends the successor as its own row, so the ack and
 * the reads minted different refs for the same decision.
 */
export const buildAttributionRecord = (
  deps: { integrity_key: string },
  scope: BoardScopeV1,
  identity: {
    media_asset_id: string;
    child_care_process_id: string;
    revision: number;
    status: ChildAttributionStateV1;
    source: AttributionSourceV1;
    decided_at: string;
  },
): AttributionRecordV1 => ({
  attributionRef: issueBoardOpaqueRef(
    deps.integrity_key,
    scope,
    "child_media_attribution",
    `${identity.media_asset_id}~${identity.child_care_process_id}~${identity.revision}`,
  ),
  childRef: issueChildOptionRef(deps.integrity_key, scope, identity.child_care_process_id),
  status: identity.status,
  revision: identity.revision,
  source: identity.source,
  decidedAt: identity.decided_at,
});

type ResolvedContext = {
  mediaAssetId: string;
  facts: MediaAttributionFactsV1;
  now: Date;
};

const resolveContext = async (
  deps: MediaAttributionDependencies,
  scope: BoardScopeV1,
  mediaRef: string,
): Promise<ResolvedContext | { denied: string }> => {
  const mediaAssetId = resolveBoardSealedRef(
    deps.integrity_key,
    scope,
    MEDIA_ASSET_TARGET_KIND,
    mediaRef,
    await deps.reads.listAttributableMediaIds(scope),
  );
  if (!mediaAssetId) return { denied: "target_unavailable" };
  const facts = await deps.reads.loadMediaAttributionFacts({
    ...scope,
    media_asset_id: mediaAssetId,
  });
  if (!facts) return { denied: "target_unavailable" };
  if (!actorEligible(facts.authority)) return { denied: "not_authorized" };
  // Attribution is a decision about a specific, still-servable original. A
  // discarded or redacted asset is terminal and takes no further decisions.
  if (facts.media_lifecycle === "discarded" || facts.media_lifecycle === "redacted") {
    return { denied: "media_not_attributable" };
  }
  return { mediaAssetId, facts, now: (deps.now ?? (() => new Date()))() };
};

const resolveChild = (
  deps: MediaAttributionDependencies,
  scope: BoardScopeV1,
  facts: MediaAttributionFactsV1,
  childRef: string,
): string | null =>
  resolveBoardSealedRef(
    deps.integrity_key,
    scope,
    CHILD_OPTION_KIND,
    childRef,
    facts.eligible_child_ids,
  );

/**
 * The write one decision implies, in owner vocabulary. `expected_revision` is
 * the head the command freezes: the child's current revision, or 0 for a child
 * with no attribution at all — a real row is floored at 1, so absence and a
 * first fact can never collide.
 */
export type AttributionAppendV1 = {
  child_care_process_id: string;
  expected_revision: number;
  state: Extract<ChildAttributionStateV1, "confirmed" | "rejected" | "superseded">;
  source: AttributionSourceV1;
};

export type AttributionRuleDecisionV1 =
  | { status: "append"; appends: AttributionAppendV1[] }
  | { status: "already_satisfied"; existing: ChildAttributionFactV1 }
  | { status: "denied"; reason_code: string };

const currentAttributionOf = (
  facts: Pick<MediaAttributionFactsV1, "attributions">,
  childId: string,
): ChildAttributionFactV1 | undefined =>
  facts.attributions.find((entry) => entry.child_care_process_id === childId);

/** Confirm: candidate → confirmed, or a first manual fact from nothing. */
export const evaluateConfirmChildAttribution = (
  facts: Pick<MediaAttributionFactsV1, "attributions">,
  childId: string,
): AttributionRuleDecisionV1 => {
  const existing = currentAttributionOf(facts, childId);
  if (existing?.status === "confirmed") {
    return { status: "already_satisfied", existing };
  }
  if (existing && !isLegalAttributionTransition(existing.status, "confirmed")) {
    return { status: "denied", reason_code: "illegal_attribution_transition" };
  }
  return {
    status: "append",
    appends: [
      {
        child_care_process_id: childId,
        expected_revision: existing?.revision ?? 0,
        state: "confirmed",
        // A manual confirmation is always recorded as manual, whatever proposed it.
        source: "manual",
      },
    ],
  };
};

export const evaluateRejectChildAttribution = (
  facts: Pick<MediaAttributionFactsV1, "attributions">,
  childId: string,
): AttributionRuleDecisionV1 => {
  const existing = currentAttributionOf(facts, childId);
  if (!existing) return { status: "denied", reason_code: "attribution_not_found" };
  if (existing.status === "rejected") {
    return { status: "already_satisfied", existing };
  }
  // A confirmed attribution is corrected by supersession, never by rejection:
  // rejecting it would erase confirmed history instead of appending to it.
  if (!isLegalAttributionTransition(existing.status, "rejected")) {
    return { status: "denied", reason_code: "illegal_attribution_transition" };
  }
  return {
    status: "append",
    appends: [
      {
        child_care_process_id: childId,
        expected_revision: existing.revision,
        state: "rejected",
        source: existing.source,
      },
    ],
  };
};

export const evaluateSupersedeChildAttribution = (
  facts: Pick<MediaAttributionFactsV1, "attributions">,
  fromChildId: string,
  toChildId: string,
): AttributionRuleDecisionV1 => {
  if (fromChildId === toChildId) {
    return { status: "denied", reason_code: "supersession_requires_distinct_child" };
  }
  const existing = currentAttributionOf(facts, fromChildId);
  if (!existing) return { status: "denied", reason_code: "attribution_not_found" };
  if (!isLegalAttributionTransition(existing.status, "superseded")) {
    return { status: "denied", reason_code: "illegal_attribution_transition" };
  }
  const replaced = currentAttributionOf(facts, toChildId);
  if (replaced?.status === "confirmed") {
    return { status: "denied", reason_code: "target_child_already_confirmed" };
  }
  // The to-child's confirmation is still a state transition, and it obeys the
  // same machine confirm obeys. Checking only "not already confirmed" let a
  // supersession confirm onto a terminally rejected or superseded fact —
  // history the frozen state machine forbids.
  if (replaced && !isLegalAttributionTransition(replaced.status, "confirmed")) {
    return { status: "denied", reason_code: "illegal_attribution_transition" };
  }
  return {
    status: "append",
    appends: [
      {
        child_care_process_id: fromChildId,
        expected_revision: existing.revision,
        state: "superseded",
        source: existing.source,
      },
      {
        child_care_process_id: toChildId,
        expected_revision: replaced?.revision ?? 0,
        state: "confirmed",
        // The correction is recorded as manual rather than inheriting the
        // automatic source it replaced.
        source: "manual",
      },
    ],
  };
};

/**
 * An idempotent repeat answers from the stored decision. A decided fact with no
 * stored instant cannot honestly be repeated — refusing is the
 * `cancel_evidence_unavailable` precedent, not a gap.
 */
export const alreadySatisfiedRecord = (
  deps: { integrity_key: string },
  scope: BoardScopeV1,
  mediaAssetId: string,
  existing: ChildAttributionFactV1,
):
  | { status: "ok"; record: AttributionRecordV1 }
  | { status: "denied"; reason_code: string } =>
  existing.decided_at
    ? {
        status: "ok",
        record: buildAttributionRecord(deps, scope, {
          media_asset_id: mediaAssetId,
          child_care_process_id: existing.child_care_process_id,
          revision: existing.revision,
          status: existing.status,
          source: existing.source,
          decided_at: existing.decided_at,
        }),
      }
    : { status: "denied", reason_code: "attribution_evidence_unavailable" };

export const confirmChildMediaAttribution = async (
  deps: MediaAttributionDependencies,
  scope: BoardScopeV1,
  request: { media_ref: string; operation_input: unknown },
): Promise<AttributionDecisionV1> => {
  const parsed = parseChildRefInput(request.operation_input, ["childRef"]);
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };
  const context = await resolveContext(deps, scope, request.media_ref);
  if ("denied" in context) return { status: "denied", reason_code: context.denied };
  const { facts, now } = context;

  const childId = resolveChild(deps, scope, facts, parsed.values.childRef as string);
  if (!childId) return { status: "denied", reason_code: "child_not_eligible" };

  return projectRuleDecision(
    deps,
    scope,
    context,
    evaluateConfirmChildAttribution(facts, childId),
    request.media_ref,
    now,
  );
};

export const rejectChildMediaAttribution = async (
  deps: MediaAttributionDependencies,
  scope: BoardScopeV1,
  request: { media_ref: string; operation_input: unknown },
): Promise<AttributionDecisionV1> => {
  const parsed = parseChildRefInput(request.operation_input, ["childRef"]);
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };
  const context = await resolveContext(deps, scope, request.media_ref);
  if ("denied" in context) return { status: "denied", reason_code: context.denied };
  const { facts, now } = context;

  const childId = resolveChild(deps, scope, facts, parsed.values.childRef as string);
  if (!childId) return { status: "denied", reason_code: "child_not_eligible" };

  return projectRuleDecision(
    deps,
    scope,
    context,
    evaluateRejectChildAttribution(facts, childId),
    request.media_ref,
    now,
  );
};

export const supersedeChildMediaAttribution = async (
  deps: MediaAttributionDependencies,
  scope: BoardScopeV1,
  request: { media_ref: string; operation_input: unknown },
): Promise<AttributionDecisionV1> => {
  const parsed = parseChildRefInput(request.operation_input, ["fromChildRef", "toChildRef"]);
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };
  const context = await resolveContext(deps, scope, request.media_ref);
  if ("denied" in context) return { status: "denied", reason_code: context.denied };
  const { facts, now } = context;

  const fromChildId = resolveChild(deps, scope, facts, parsed.values.fromChildRef as string);
  const toChildId = resolveChild(deps, scope, facts, parsed.values.toChildRef as string);
  if (!fromChildId || !toChildId) return { status: "denied", reason_code: "child_not_eligible" };

  return projectRuleDecision(
    deps,
    scope,
    context,
    evaluateSupersedeChildAttribution(facts, fromChildId, toChildId),
    request.media_ref,
    now,
  );
};

/**
 * Projects one rule decision into the public decision shape. The committed
 * branch previews the appends this decision implies; the command lane builds
 * its committed records from what the owner actually stored instead.
 */
const projectRuleDecision = (
  deps: MediaAttributionDependencies,
  scope: BoardScopeV1,
  context: ResolvedContext,
  decision: AttributionRuleDecisionV1,
  mediaRef: string,
  now: Date,
): AttributionDecisionV1 => {
  if (decision.status === "denied") {
    return { status: "denied", reason_code: decision.reason_code };
  }
  if (decision.status === "already_satisfied") {
    const record = alreadySatisfiedRecord(deps, scope, context.mediaAssetId, decision.existing);
    if (record.status === "denied") return record;
    return { status: "already_satisfied", mediaRef, records: [record.record] };
  }
  return {
    status: "committed",
    mediaRef,
    mediaRevision: context.facts.media_revision,
    records: decision.appends.map((append) =>
      buildAttributionRecord(deps, scope, {
        media_asset_id: context.mediaAssetId,
        child_care_process_id: append.child_care_process_id,
        revision: append.expected_revision + 1,
        status: append.state,
        source: append.source,
        decided_at: now.toISOString(),
      }),
    ),
  };
};

/**
 * The execute-side re-parse: same closed shape the prepare accepted, returning
 * the resubmitted refs so the transport can bind each to the id the
 * confirmation froze.
 */
export const parseChildAttributionExecuteInput = (
  value: unknown,
  fields: readonly string[],
): Record<string, string> | null => {
  const parsed = parseChildRefInput(value, fields);
  return parsed.status === "ok" ? parsed.values : null;
};

const parseChildRefInput = (
  value: unknown,
  fields: readonly string[],
): { status: "ok"; values: Record<string, string> } | { status: "invalid"; fields: string[] } => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { status: "invalid", fields: [...fields] };
  }
  const record = value as Record<string, unknown>;
  const unknown = Object.keys(record).filter((key) => !fields.includes(key));
  if (unknown.length > 0) return { status: "invalid", fields: unknown };
  const values: Record<string, string> = {};
  const invalid: string[] = [];
  for (const field of fields) {
    const entry = record[field];
    if (typeof entry !== "string" || entry.length === 0 || entry.length > 512) {
      invalid.push(field);
      continue;
    }
    values[field] = entry;
  }
  return invalid.length > 0 ? { status: "invalid", fields: invalid } : { status: "ok", values };
};

// ---------------------------------------------------------------------------
// The attribution commands: three decisions over one owner aggregate.

export const CONFIRM_CHILD_MEDIA_ATTRIBUTION_COMMAND_SCOPE = "child_attribution_confirm";
export const REJECT_CHILD_MEDIA_ATTRIBUTION_COMMAND_SCOPE = "child_attribution_reject";
export const SUPERSEDE_CHILD_MEDIA_ATTRIBUTION_COMMAND_SCOPE = "child_attribution_supersede";

export type ChildAttributionCommandV1 = {
  media_asset_id: string;
  child_care_process_id: string;
  expected_attribution_revision: number;
  expected_media_revision: number;
};

export type SupersedeChildAttributionCommandV1 = {
  media_asset_id: string;
  from_child_care_process_id: string;
  to_child_care_process_id: string;
  expected_from_revision: number;
  expected_to_revision: number;
  expected_media_revision: number;
};

export const canonicalizeChildAttributionCommand = (
  input: ChildAttributionCommandV1,
): unknown => ({
  media_asset_id: input.media_asset_id,
  child_care_process_id: input.child_care_process_id,
  expected_attribution_revision: input.expected_attribution_revision,
  expected_media_revision: input.expected_media_revision,
});

export const canonicalizeSupersedeChildAttributionCommand = (
  input: SupersedeChildAttributionCommandV1,
): unknown => ({
  media_asset_id: input.media_asset_id,
  from_child_care_process_id: input.from_child_care_process_id,
  to_child_care_process_id: input.to_child_care_process_id,
  expected_from_revision: input.expected_from_revision,
  expected_to_revision: input.expected_to_revision,
  expected_media_revision: input.expected_media_revision,
});

export type AttributionPrepareDecision =
  | {
      status: "ready_to_confirm";
      preview: Record<string, string | number>;
      confirmation_ref: string;
      expires_at: string;
      command_request_id: string;
    }
  | { status: "needs_input"; fields: string[] }
  | { status: "denied"; reason_code: string };

type AttributionPrepareDeps = MediaAttributionDependencies & {
  contexts: NurtureInteractionContextService;
  create_command_id?: () => string;
};

type AttributionPrepareRequest = BoardScopeV1 & {
  surface: string;
  host_conversation_ref?: string;
  operation_input?: unknown;
  target_option_ref?: string;
};

/** The owner-side current revision per child; 0 encodes "no attribution". */
const writeRevisionOf = (
  facts: Pick<NurtureMediaAttributionWriteFacts, "attributions">,
  childId: string,
): number =>
  facts.attributions.find((entry) => entry.child_care_process_id === childId)?.revision ??
  NO_CHILD_ATTRIBUTION_REVISION;

const currentRevisionOf = (
  facts: Pick<MediaAttributionFactsV1, "attributions">,
  childId: string,
): number =>
  facts.attributions.find((entry) => entry.child_care_process_id === childId)?.revision ?? 0;

const prepareAttributionDecision = async (
  deps: AttributionPrepareDeps,
  request: AttributionPrepareRequest,
  transition: {
    capability: { key: string; version: string };
    fields: readonly string[];
    evaluate(facts: MediaAttributionFactsV1, childIds: string[]): AttributionRuleDecisionV1;
    freeze(
      mediaAssetId: string,
      facts: MediaAttributionFactsV1,
      childIds: string[],
    ): {
      target_refs: Record<string, string>;
      expected_heads: Record<string, number>;
      canonical_command: unknown;
    };
  },
): Promise<AttributionPrepareDecision> => {
  const parsed = parseChildRefInput(request.operation_input, transition.fields);
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };
  if (!request.target_option_ref) return { status: "needs_input", fields: ["target"] };

  const scope: BoardScopeV1 = {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
  };
  const context = await resolveContext(deps, scope, request.target_option_ref);
  if ("denied" in context) return { status: "denied", reason_code: context.denied };

  const childIds: string[] = [];
  for (const field of transition.fields) {
    const childId = resolveChild(deps, scope, context.facts, parsed.values[field] as string);
    if (!childId) return { status: "denied", reason_code: "child_not_eligible" };
    childIds.push(childId);
  }

  const decision = transition.evaluate(context.facts, childIds);
  if (decision.status === "denied") return decision;
  if (decision.status === "already_satisfied" && !decision.existing.decided_at) {
    // The repeat would have to invent the decision instant; refuse at prepare
    // rather than let execute discover the same hole.
    return { status: "denied", reason_code: "attribution_evidence_unavailable" };
  }

  const frozen = transition.freeze(context.mediaAssetId, context.facts, childIds);
  const commandRequestId = (deps.create_command_id ?? (() => `command:${randomUUID()}`))();
  const issued = await issueHarnessConfirmation(deps.contexts, {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    surface: request.surface,
    ...(request.host_conversation_ref
      ? { host_conversation_ref: request.host_conversation_ref }
      : {}),
    payload: {
      capability_key: transition.capability.key,
      capability_version: transition.capability.version,
      command_request_id: commandRequestId,
      target_refs: { media_asset: context.mediaAssetId, ...frozen.target_refs },
      expected_heads: frozen.expected_heads,
      input_integrity_tag: computeHarnessInputIntegrityTag(
        deps.integrity_key,
        frozen.canonical_command,
      ),
      integrity_tag_version: 1,
    },
  });
  return {
    status: "ready_to_confirm",
    preview: {
      effect: transition.capability.key,
      // Repeating an already-settled decision is legal and says so.
      outcome: decision.status === "append" ? "apply" : "already_satisfied",
    },
    confirmation_ref: issued.token,
    expires_at: issued.expires_at,
    command_request_id: commandRequestId,
  };
};

export const prepareConfirmChildMediaAttribution = (
  deps: AttributionPrepareDeps,
  request: AttributionPrepareRequest,
): Promise<AttributionPrepareDecision> =>
  prepareAttributionDecision(deps, request, {
    capability: CONFIRM_CHILD_MEDIA_ATTRIBUTION_CAPABILITY,
    fields: ["childRef"],
    evaluate: (facts, [childId]) => evaluateConfirmChildAttribution(facts, childId as string),
    freeze: (mediaAssetId, facts, [childId]) => ({
      target_refs: { child: childId as string },
      expected_heads: {
        child_media_attribution: currentRevisionOf(facts, childId as string),
        media_asset_revision: facts.media_revision,
      },
      canonical_command: canonicalizeChildAttributionCommand({
        media_asset_id: mediaAssetId,
        child_care_process_id: childId as string,
        expected_attribution_revision: currentRevisionOf(facts, childId as string),
        expected_media_revision: facts.media_revision,
      }),
    }),
  });

export const prepareRejectChildMediaAttribution = (
  deps: AttributionPrepareDeps,
  request: AttributionPrepareRequest,
): Promise<AttributionPrepareDecision> =>
  prepareAttributionDecision(deps, request, {
    capability: REJECT_CHILD_MEDIA_ATTRIBUTION_CAPABILITY,
    fields: ["childRef"],
    evaluate: (facts, [childId]) => evaluateRejectChildAttribution(facts, childId as string),
    freeze: (mediaAssetId, facts, [childId]) => ({
      target_refs: { child: childId as string },
      expected_heads: {
        child_media_attribution: currentRevisionOf(facts, childId as string),
        media_asset_revision: facts.media_revision,
      },
      canonical_command: canonicalizeChildAttributionCommand({
        media_asset_id: mediaAssetId,
        child_care_process_id: childId as string,
        expected_attribution_revision: currentRevisionOf(facts, childId as string),
        expected_media_revision: facts.media_revision,
      }),
    }),
  });

export const prepareSupersedeChildMediaAttribution = (
  deps: AttributionPrepareDeps,
  request: AttributionPrepareRequest,
): Promise<AttributionPrepareDecision> =>
  prepareAttributionDecision(deps, request, {
    capability: SUPERSEDE_CHILD_MEDIA_ATTRIBUTION_CAPABILITY,
    fields: ["fromChildRef", "toChildRef"],
    evaluate: (facts, [fromChildId, toChildId]) =>
      evaluateSupersedeChildAttribution(facts, fromChildId as string, toChildId as string),
    freeze: (mediaAssetId, facts, [fromChildId, toChildId]) => ({
      target_refs: { from_child: fromChildId as string, to_child: toChildId as string },
      expected_heads: {
        child_media_attribution: currentRevisionOf(facts, fromChildId as string),
        target_child_attribution: currentRevisionOf(facts, toChildId as string),
        media_asset_revision: facts.media_revision,
      },
      canonical_command: canonicalizeSupersedeChildAttributionCommand({
        media_asset_id: mediaAssetId,
        from_child_care_process_id: fromChildId as string,
        to_child_care_process_id: toChildId as string,
        expected_from_revision: currentRevisionOf(facts, fromChildId as string),
        expected_to_revision: currentRevisionOf(facts, toChildId as string),
        expected_media_revision: facts.media_revision,
      }),
    }),
  });

// ---------------------------------------------------------------------------
// The three command specs.

const attributionCommandScope = (context: NurtureCommandExecutionContext): BoardScopeV1 => ({
  workspace_id: context.workspace_id,
  participant_id: context.business_actor_ref,
});

const isChildAttributionState = (value: string): value is ChildAttributionStateV1 =>
  (CHILD_ATTRIBUTION_STATES as readonly string[]).includes(value);

const isAttributionSource = (value: string): value is AttributionSourceV1 =>
  value === "manual" || value === "organizer_candidate" || value === "automatic_face_match";

/**
 * The owner's rows in the rule vocabulary. A state or source the domain does
 * not know is not a fact to pass through — it has no legal transitions, so the
 * caller must refuse rather than guess which one it resembles.
 */
const ruleFactsFrom = (
  facts: NurtureMediaAttributionWriteFacts,
): { status: "ok"; facts: Pick<MediaAttributionFactsV1, "attributions"> } | { status: "invalid" } => {
  const attributions: ChildAttributionFactV1[] = [];
  for (const row of facts.attributions) {
    if (!isChildAttributionState(row.status) || !isAttributionSource(row.source)) {
      return { status: "invalid" };
    }
    attributions.push({
      attribution_id: row.attribution_id,
      child_care_process_id: row.child_care_process_id,
      status: row.status,
      revision: row.revision,
      source: row.source,
      ...(row.decided_at ? { decided_at: row.decided_at } : {}),
    });
  }
  return { status: "ok", facts: { attributions } };
};

/**
 * The guards every attribution decision shares, before its own rule runs: the
 * actor writes as a current class teacher of the asset's exact CareGroup, the
 * asset still takes decisions, and every named child is currently eligible.
 */
const attributionWriteGate = (
  facts: NurtureMediaAttributionWriteFacts,
  childIds: string[],
): BoardWriteRefusalV1 | null => {
  if (!actorEligible(facts.authority as CaregiverFactAuthorityV1)) {
    return { status: "blocked", reason_code: "not_authorized" };
  }
  if (facts.media_lifecycle === "discarded" || facts.media_lifecycle === "redacted") {
    return { status: "blocked", reason_code: "media_not_attributable" };
  }
  for (const childId of childIds) {
    if (!facts.eligible_child_ids.includes(childId)) {
      return { status: "blocked", reason_code: "child_not_eligible" };
    }
  }
  return null;
};

type AttributionWrite = {
  appends: AttributionAppendV1[];
  link_supersession: boolean;
  media_revision: number;
};

/**
 * Builds the committed result from what the owner actually stored — the rows'
 * own revisions, sources and the one instant the owner stamped — never from
 * what this process computed on the way in.
 */
const committedAttributionResult = (
  deps: { integrity_key: string },
  context: NurtureCommandExecutionContext,
  mediaAssetId: string,
  mediaRevision: number,
  rows: NurtureAttributionAppendedRow[],
): unknown => {
  const scope = attributionCommandScope(context);
  return {
    mediaRef: issueMediaAssetTargetRef(deps.integrity_key, scope, mediaAssetId),
    mediaRevision,
    records: rows.map((row) => {
      if (!isChildAttributionState(row.state) || !isAttributionSource(row.source)) {
        throw new Error("nurture attribution: owner returned an unknown state or source");
      }
      return buildAttributionRecord(deps, scope, {
        media_asset_id: mediaAssetId,
        child_care_process_id: row.child_care_process_id,
        revision: row.revision,
        status: row.state,
        source: row.source,
        decided_at: row.decided_at,
      });
    }),
  };
};

const createAttributionSpec = <Command extends { media_asset_id: string }>(
  deps: { integrity_key: string },
  shape: {
    capability: { key: string; version: string };
    command_scope: string;
    head_keys: readonly string[];
    canonicalize(input: Command): unknown;
    revalidate(input: Command): boolean;
    childIds(input: Command): string[];
    evaluate(
      facts: Pick<MediaAttributionFactsV1, "attributions">,
      input: Command,
    ): AttributionRuleDecisionV1;
    expectedHeads(input: Command): Record<string, number>;
    currentHeads(
      facts: NurtureMediaAttributionWriteFacts,
      input: Command,
    ): Record<string, number>;
    link_supersession: boolean;
  },
): NurtureBoardWriteSpec<Command> =>
  createBoardWriteSpec<
    Command,
    NurtureMediaAttributionTransaction,
    NurtureMediaAttributionWriteFacts,
    AttributionWrite
  >({
    capability: shape.capability,
    command_scope: shape.command_scope,
    contract_version: 1,
    result_schema_version: 1,
    canonicalize: shape.canonicalize,
    port: {
      select: (tx) => tx.mediaAttribution,
      unavailable_reason_code: "media_attribution_port_unavailable",
    },
    revalidateInput: (input) =>
      input.media_asset_id.length > 0 && shape.revalidate(input)
        ? null
        : { status: "invalid", reason_code: "invalid_attribution_input" },
    loadFacts: (owner, input, context) =>
      owner.loadMediaAttributionWriteFacts({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        media_asset_id: input.media_asset_id,
      }),
    facts_absent_reason_code: "target_unavailable",
    head_keys: shape.head_keys,
    expectedHeads: (input) => shape.expectedHeads(input),
    currentHeads: (facts, input) => shape.currentHeads(facts, input),
    authorize: (facts, input, context) => {
      const gate = attributionWriteGate(facts, shape.childIds(input));
      if (gate) return gate;
      const ruleFacts = ruleFactsFrom(facts);
      if (ruleFacts.status === "invalid") {
        return { status: "blocked", reason_code: "illegal_attribution_transition" };
      }
      const decision = shape.evaluate(ruleFacts.facts, input);
      if (decision.status === "denied") {
        return { status: "blocked", reason_code: decision.reason_code };
      }
      if (decision.status === "already_satisfied") {
        const record = alreadySatisfiedRecord(
          deps,
          attributionCommandScope(context),
          input.media_asset_id,
          decision.existing,
        );
        if (record.status === "denied") {
          return { status: "blocked", reason_code: record.reason_code };
        }
        return {
          status: "already_satisfied",
          effect: {
            output_refs: [facts.media_asset_ref],
            committed_result: {
              mediaRef: issueMediaAssetTargetRef(
                deps.integrity_key,
                attributionCommandScope(context),
                input.media_asset_id,
              ),
              mediaRevision: facts.media_revision,
              records: [record.record],
            },
          },
        };
      }
      return {
        status: "authorized",
        write: {
          appends: decision.appends,
          link_supersession: shape.link_supersession,
          media_revision: facts.media_revision,
        },
      };
    },
    apply: async (owner, input, context, write) => {
      const applied = await owner.applyChildAttributionAppends({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        media_asset_id: input.media_asset_id,
        appends: write.appends.map((append) => ({
          child_care_process_id: append.child_care_process_id,
          expected_revision: append.expected_revision,
          state: append.state,
        })),
        link_supersession: write.link_supersession,
      });
      return {
        output_refs: [applied.media_asset_ref, ...applied.rows.map((row) => row.attribution_ref)],
        committed_result: committedAttributionResult(
          deps,
          context,
          input.media_asset_id,
          write.media_revision,
          applied.rows,
        ),
      };
    },
  });

export const createConfirmChildMediaAttributionSpec = (deps: {
  integrity_key: string;
}): NurtureBoardWriteSpec<ChildAttributionCommandV1> =>
  createAttributionSpec<ChildAttributionCommandV1>(deps, {
    capability: CONFIRM_CHILD_MEDIA_ATTRIBUTION_CAPABILITY,
    command_scope: CONFIRM_CHILD_MEDIA_ATTRIBUTION_COMMAND_SCOPE,
    head_keys: ["child_media_attribution", "media_asset_revision"],
    canonicalize: canonicalizeChildAttributionCommand,
    revalidate: (input) =>
      input.child_care_process_id.length > 0 &&
      Number.isSafeInteger(input.expected_attribution_revision) &&
      input.expected_attribution_revision >= 0 &&
      Number.isSafeInteger(input.expected_media_revision) &&
      input.expected_media_revision >= 1,
    childIds: (input) => [input.child_care_process_id],
    evaluate: (facts, input) =>
      evaluateConfirmChildAttribution(facts, input.child_care_process_id),
    expectedHeads: (input) => ({
      child_media_attribution: input.expected_attribution_revision,
      media_asset_revision: input.expected_media_revision,
    }),
    currentHeads: (facts, input) => ({
      child_media_attribution: writeRevisionOf(facts, input.child_care_process_id),
      media_asset_revision: facts.media_revision,
    }),
    link_supersession: false,
  });

export const createRejectChildMediaAttributionSpec = (deps: {
  integrity_key: string;
}): NurtureBoardWriteSpec<ChildAttributionCommandV1> =>
  createAttributionSpec<ChildAttributionCommandV1>(deps, {
    capability: REJECT_CHILD_MEDIA_ATTRIBUTION_CAPABILITY,
    command_scope: REJECT_CHILD_MEDIA_ATTRIBUTION_COMMAND_SCOPE,
    head_keys: ["child_media_attribution", "media_asset_revision"],
    canonicalize: canonicalizeChildAttributionCommand,
    revalidate: (input) =>
      input.child_care_process_id.length > 0 &&
      Number.isSafeInteger(input.expected_attribution_revision) &&
      // Reject decides an existing fact, so the frozen head is a real revision.
      input.expected_attribution_revision >= 1 &&
      Number.isSafeInteger(input.expected_media_revision) &&
      input.expected_media_revision >= 1,
    childIds: (input) => [input.child_care_process_id],
    evaluate: (facts, input) =>
      evaluateRejectChildAttribution(facts, input.child_care_process_id),
    expectedHeads: (input) => ({
      child_media_attribution: input.expected_attribution_revision,
      media_asset_revision: input.expected_media_revision,
    }),
    currentHeads: (facts, input) => ({
      child_media_attribution: writeRevisionOf(facts, input.child_care_process_id),
      media_asset_revision: facts.media_revision,
    }),
    link_supersession: false,
  });

export const createSupersedeChildMediaAttributionSpec = (deps: {
  integrity_key: string;
}): NurtureBoardWriteSpec<SupersedeChildAttributionCommandV1> =>
  createAttributionSpec<SupersedeChildAttributionCommandV1>(deps, {
    capability: SUPERSEDE_CHILD_MEDIA_ATTRIBUTION_CAPABILITY,
    command_scope: SUPERSEDE_CHILD_MEDIA_ATTRIBUTION_COMMAND_SCOPE,
    head_keys: ["child_media_attribution", "target_child_attribution", "media_asset_revision"],
    canonicalize: canonicalizeSupersedeChildAttributionCommand,
    revalidate: (input) =>
      input.from_child_care_process_id.length > 0 &&
      input.to_child_care_process_id.length > 0 &&
      Number.isSafeInteger(input.expected_from_revision) &&
      input.expected_from_revision >= 1 &&
      Number.isSafeInteger(input.expected_to_revision) &&
      input.expected_to_revision >= 0 &&
      Number.isSafeInteger(input.expected_media_revision) &&
      input.expected_media_revision >= 1,
    childIds: (input) => [input.from_child_care_process_id, input.to_child_care_process_id],
    evaluate: (facts, input) =>
      evaluateSupersedeChildAttribution(
        facts,
        input.from_child_care_process_id,
        input.to_child_care_process_id,
      ),
    expectedHeads: (input) => ({
      child_media_attribution: input.expected_from_revision,
      target_child_attribution: input.expected_to_revision,
      media_asset_revision: input.expected_media_revision,
    }),
    currentHeads: (facts, input) => ({
      child_media_attribution: writeRevisionOf(facts, input.from_child_care_process_id),
      target_child_attribution: writeRevisionOf(facts, input.to_child_care_process_id),
      media_asset_revision: facts.media_revision,
    }),
    link_supersession: true,
  });
