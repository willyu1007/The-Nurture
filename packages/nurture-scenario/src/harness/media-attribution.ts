import {
  CAREGIVER_BOARD_ROLES,
  issueBoardOpaqueRef,
  issueBoardSealedRef,
  resolveBoardSealedRef,
  type BoardScopeV1,
  type CaregiverFactAuthorityV1,
} from "./board-projection.js";

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

const attributionRecord = (
  deps: MediaAttributionDependencies,
  scope: BoardScopeV1,
  fact: Pick<ChildAttributionFactV1, "attribution_id" | "child_care_process_id" | "source">,
  status: ChildAttributionStateV1,
  revision: number,
  decidedAt: string,
): AttributionRecordV1 => ({
  attributionRef: issueBoardOpaqueRef(
    deps.integrity_key,
    scope,
    "child_media_attribution",
    `${fact.attribution_id}~${revision}`,
  ),
  childRef: issueChildOptionRef(deps.integrity_key, scope, fact.child_care_process_id),
  status,
  revision,
  source: fact.source,
  decidedAt,
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

  const existing = facts.attributions.find(
    (entry) => entry.child_care_process_id === childId,
  );
  if (existing?.status === "confirmed") {
    return {
      status: "already_satisfied",
      mediaRef: request.media_ref,
      records: [
        attributionRecord(deps, scope, existing, "confirmed", existing.revision, now.toISOString()),
      ],
    };
  }
  if (existing && !isLegalAttributionTransition(existing.status, "confirmed")) {
    return { status: "denied", reason_code: "illegal_attribution_transition" };
  }

  const base = existing ?? {
    attribution_id: `${context.mediaAssetId}~${childId}`,
    child_care_process_id: childId,
    // A manual confirmation is always recorded as manual, whatever proposed it.
    source: "manual" as AttributionSourceV1,
  };
  return {
    status: "committed",
    mediaRef: request.media_ref,
    mediaRevision: facts.media_revision,
    records: [
      attributionRecord(
        deps,
        scope,
        { ...base, source: "manual" },
        "confirmed",
        (existing?.revision ?? 0) + 1,
        now.toISOString(),
      ),
    ],
  };
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
  const existing = facts.attributions.find(
    (entry) => entry.child_care_process_id === childId,
  );
  if (!existing) return { status: "denied", reason_code: "attribution_not_found" };
  if (existing.status === "rejected") {
    return {
      status: "already_satisfied",
      mediaRef: request.media_ref,
      records: [
        attributionRecord(deps, scope, existing, "rejected", existing.revision, now.toISOString()),
      ],
    };
  }
  // A confirmed attribution is corrected by supersession, never by rejection:
  // rejecting it would erase confirmed history instead of appending to it.
  if (!isLegalAttributionTransition(existing.status, "rejected")) {
    return { status: "denied", reason_code: "illegal_attribution_transition" };
  }
  return {
    status: "committed",
    mediaRef: request.media_ref,
    mediaRevision: facts.media_revision,
    records: [
      attributionRecord(deps, scope, existing, "rejected", existing.revision + 1, now.toISOString()),
    ],
  };
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
  if (fromChildId === toChildId) {
    return { status: "denied", reason_code: "supersession_requires_distinct_child" };
  }
  const existing = facts.attributions.find(
    (entry) => entry.child_care_process_id === fromChildId,
  );
  if (!existing) return { status: "denied", reason_code: "attribution_not_found" };
  if (!isLegalAttributionTransition(existing.status, "superseded")) {
    return { status: "denied", reason_code: "illegal_attribution_transition" };
  }
  const replaced = facts.attributions.find(
    (entry) => entry.child_care_process_id === toChildId,
  );
  if (replaced?.status === "confirmed") {
    return { status: "denied", reason_code: "target_child_already_confirmed" };
  }

  const decidedAt = now.toISOString();
  return {
    status: "committed",
    mediaRef: request.media_ref,
    mediaRevision: facts.media_revision,
    // Append-only: the original attribution is superseded, not overwritten, and
    // the correction is recorded as manual rather than inheriting the automatic
    // source it replaced.
    records: [
      attributionRecord(deps, scope, existing, "superseded", existing.revision + 1, decidedAt),
      attributionRecord(
        deps,
        scope,
        {
          attribution_id: `${context.mediaAssetId}~${toChildId}`,
          child_care_process_id: toChildId,
          source: "manual",
        },
        "confirmed",
        (replaced?.revision ?? 0) + 1,
        decidedAt,
      ),
    ],
  };
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
