import {
  CAREGIVER_BOARD_ROLES,
  issueBoardOpaqueRef,
  resolveBoardSealedRef,
  type BoardScopeV1,
  type CaregiverFactAuthorityV1,
} from "./board-projection.js";
import {
  evaluateMediaDetach,
  evaluateMediaDiscard,
  type MediaDetachDecisionV1,
  type MediaDiscardDecisionV1,
} from "./publish-eligibility.js";
import { MEDIA_ASSET_TARGET_KIND, type MediaAssetLifecycleV1 } from "./media-attribution.js";
import {
  PUBLICATION_TARGET_KIND,
  PUBLISH_PROCESS_TARGET_KIND,
  issuePublicationRef,
  type PublishProcessStateV1,
} from "./publish-process.js";

/**
 * G3-D post-release safety and media lifecycle actions
 * (02-architecture.md D-11/D-12).
 *
 * These are low-frequency capabilities with no expiry window: publishing does
 * not create a five-minute or twenty-four-hour review chore. Every one of them
 * appends a fact — the original release, its Receipt and the CommandExecution
 * are preserved, and nothing here claims to recall content a family already
 * read or a notification already sent.
 */
export const CORRECT_PUBLICATION_CAPABILITY = {
  key: "correct_publication",
  version: "1.0.0",
} as const;

export const REMOVE_PUBLICATION_TARGET_VISIBILITY_CAPABILITY = {
  key: "remove_publication_target_visibility",
  version: "1.0.0",
} as const;

export const REDACT_PUBLICATION_CAPABILITY = {
  key: "redact_publication",
  version: "1.0.0",
} as const;

export const DETACH_PUBLISH_PROCESS_MEDIA_CAPABILITY = {
  key: "detach_publish_process_media",
  version: "1.0.0",
} as const;

export const DISCARD_MEDIA_ASSET_CAPABILITY = {
  key: "discard_media_asset",
  version: "1.0.0",
} as const;



/** Closed reason taxonomy; the audit records a key, never free prose. */
export const PUBLICATION_SAFETY_REASONS = [
  "wrong_target",
  "wrong_media",
  "wrong_attribution",
  "content_error",
  "family_request",
  "policy_requirement",
] as const;

export type PublicationSafetyReasonV1 = (typeof PUBLICATION_SAFETY_REASONS)[number];

export type PublicationVisibilityEventKindV1 =
  | "correction"
  | "target_removal"
  | "redaction";

export type PublicationVisibilityEventV1 = {
  eventRef: string;
  kind: PublicationVisibilityEventKindV1;
  reason: PublicationSafetyReasonV1;
  occurredAt: string;
  /** The release this event explains; it is never deleted or rewritten. */
  publicationRef: string;
  preservedReceiptRef: string;
  sourceReleaseRevision: number;
};

export type PublicationSafetyDecisionV1 =
  | { status: "appended"; events: PublicationVisibilityEventV1[] }
  | { status: "already_satisfied"; events: PublicationVisibilityEventV1[] }
  | { status: "needs_input"; fields: string[] }
  | { status: "denied"; reason_code: string };

export type CommittedPublicationFactV1 = {
  publication_id: string;
  target_key: string;
  receipt_id: string;
  release_revision: number;
  visibility: "visible" | "removed" | "redacted";
};

export type PublicationSafetyFactsV1 = {
  authority: CaregiverFactAuthorityV1;
  process_state: PublishProcessStateV1;
  publications: CommittedPublicationFactV1[];
};

export type PublicationSafetyReadPort = {
  listSafetyProcessKeys(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<string[]>;
  loadPublicationSafetyFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
  }): Promise<PublicationSafetyFactsV1 | null>;
};

export type PublicationSafetyDependencies = {
  integrity_key: string;
  reads: PublicationSafetyReadPort;
  now?: () => Date;
};

const actorEligible = (authority: CaregiverFactAuthorityV1): boolean =>
  CAREGIVER_BOARD_ROLES.includes(authority.role) &&
  authority.role_scope_type === "care_group" &&
  authority.role_scope_matches_source &&
  authority.role_assignment_current;

const MAX_CORRECTION_CHARS = 2_000;

type ParsedInput<Input> =
  | { status: "ok"; input: Input }
  | { status: "invalid"; fields: string[] };

const parseReasonInput = (
  value: unknown,
  extraField?: "correctionText" | "publicationRef",
): ParsedInput<{
  reason: PublicationSafetyReasonV1;
  correctionText?: string;
  publicationRef?: string;
}> => {
  const allowed = extraField ? ["reason", extraField] : ["reason"];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { status: "invalid", fields: allowed };
  }
  const record = value as Record<string, unknown>;
  const unknown = Object.keys(record).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) return { status: "invalid", fields: unknown };
  const fields: string[] = [];
  const reason = record.reason;
  if (
    typeof reason !== "string" ||
    !PUBLICATION_SAFETY_REASONS.includes(reason as PublicationSafetyReasonV1)
  ) {
    fields.push("reason");
  }
  let extraValue: string | undefined;
  if (extraField) {
    const text = typeof record[extraField] === "string" ? (record[extraField] as string).trim() : "";
    const max = extraField === "correctionText" ? MAX_CORRECTION_CHARS : 512;
    if (text.length < 1 || text.length > max) fields.push(extraField);
    else extraValue = text;
  }
  if (fields.length > 0) return { status: "invalid", fields };
  return {
    status: "ok",
    input: {
      reason: reason as PublicationSafetyReasonV1,
      ...(extraField === "correctionText" && extraValue ? { correctionText: extraValue } : {}),
      ...(extraField === "publicationRef" && extraValue ? { publicationRef: extraValue } : {}),
    },
  };
};

const buildEvent = (
  deps: PublicationSafetyDependencies,
  scope: BoardScopeV1,
  publication: CommittedPublicationFactV1,
  kind: PublicationVisibilityEventKindV1,
  reason: PublicationSafetyReasonV1,
  occurredAt: string,
): PublicationVisibilityEventV1 => ({
  eventRef: issueBoardOpaqueRef(
    deps.integrity_key,
    scope,
    "publication_visibility_event",
    `${publication.publication_id}~${kind}~${occurredAt}`,
  ),
  kind,
  reason,
  occurredAt,
  publicationRef: issuePublicationRef(
    deps.integrity_key,
    scope,
    publication.publication_id,
  ),
  // The Receipt survives every safety action; "delete" never means erase.
  preservedReceiptRef: issueBoardOpaqueRef(
    deps.integrity_key,
    scope,
    "publication_receipt",
    publication.receipt_id,
  ),
  sourceReleaseRevision: publication.release_revision,
});

type SafetyContext = {
  facts: PublicationSafetyFactsV1;
  occurredAt: string;
};

const loadSafetyContext = async (
  deps: PublicationSafetyDependencies,
  scope: BoardScopeV1,
  processRef: string,
): Promise<SafetyContext | { denied: string }> => {
  const processKey = resolveBoardSealedRef(
    deps.integrity_key,
    scope,
    PUBLISH_PROCESS_TARGET_KIND,
    processRef,
    await deps.reads.listSafetyProcessKeys(scope),
  );
  if (!processKey) return { denied: "target_unavailable" };
  const facts = await deps.reads.loadPublicationSafetyFacts({
    ...scope,
    process_key: processKey,
  });
  if (!facts) return { denied: "target_unavailable" };
  // Shared class responsibility: any current class teacher may reduce
  // visibility, without waiting for an institution role.
  if (!actorEligible(facts.authority)) return { denied: "not_authorized" };
  if (facts.publications.length === 0) return { denied: "no_committed_publication" };
  return { facts, occurredAt: (deps.now ?? (() => new Date()))().toISOString() };
};

/**
 * Appends a correction to every visible release of one process. It never
 * rewrites the published body: the original release and its Receipt stay
 * exactly as the family received them.
 */
export const correctPublication = async (
  deps: PublicationSafetyDependencies,
  scope: BoardScopeV1,
  request: { process_ref: string; operation_input: unknown },
): Promise<PublicationSafetyDecisionV1> => {
  const parsed = parseReasonInput(request.operation_input, "correctionText");
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };
  const context = await loadSafetyContext(deps, scope, request.process_ref);
  if ("denied" in context) return { status: "denied", reason_code: context.denied };

  const visible = context.facts.publications.filter(
    (publication) => publication.visibility === "visible",
  );
  if (visible.length === 0) {
    return { status: "denied", reason_code: "no_visible_publication" };
  }
  return {
    status: "appended",
    events: visible.map((publication) =>
      buildEvent(deps, scope, publication, "correction", parsed.input.reason, context.occurredAt),
    ),
  };
};

/**
 * Stops showing one target's release. Other targets are untouched, and adding a
 * target back later is a new release effect rather than a revival of this one.
 */
export const removePublicationTargetVisibility = async (
  deps: PublicationSafetyDependencies,
  scope: BoardScopeV1,
  request: { process_ref: string; operation_input: unknown },
): Promise<PublicationSafetyDecisionV1> => {
  const parsed = parseReasonInput(request.operation_input, "publicationRef");
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };
  const context = await loadSafetyContext(deps, scope, request.process_ref);
  if ("denied" in context) return { status: "denied", reason_code: context.denied };

  const publicationId = resolveBoardSealedRef(
    deps.integrity_key,
    scope,
    PUBLICATION_TARGET_KIND,
    parsed.input.publicationRef ?? "",
    context.facts.publications.map((publication) => publication.publication_id),
  );
  if (!publicationId) return { status: "denied", reason_code: "target_unavailable" };
  const publication = context.facts.publications.find(
    (entry) => entry.publication_id === publicationId,
  );
  if (!publication) return { status: "denied", reason_code: "target_unavailable" };
  if (publication.visibility !== "visible") {
    return {
      status: "already_satisfied",
      events: [
        buildEvent(
          deps,
          scope,
          publication,
          publication.visibility === "redacted" ? "redaction" : "target_removal",
          parsed.input.reason,
          context.occurredAt,
        ),
      ],
    };
  }
  return {
    status: "appended",
    events: [
      buildEvent(
        deps,
        scope,
        publication,
        "target_removal",
        parsed.input.reason,
        context.occurredAt,
      ),
    ],
  };
};

/** Stops showing the content to every current and future read of this process. */
export const redactPublication = async (
  deps: PublicationSafetyDependencies,
  scope: BoardScopeV1,
  request: { process_ref: string; operation_input: unknown },
): Promise<PublicationSafetyDecisionV1> => {
  const parsed = parseReasonInput(request.operation_input);
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };
  const context = await loadSafetyContext(deps, scope, request.process_ref);
  if ("denied" in context) return { status: "denied", reason_code: context.denied };

  const pending = context.facts.publications.filter(
    (publication) => publication.visibility !== "redacted",
  );
  if (pending.length === 0) {
    return {
      status: "already_satisfied",
      events: context.facts.publications.map((publication) =>
        buildEvent(deps, scope, publication, "redaction", parsed.input.reason, context.occurredAt),
      ),
    };
  }
  return {
    status: "appended",
    events: pending.map((publication) =>
      buildEvent(deps, scope, publication, "redaction", parsed.input.reason, context.occurredAt),
    ),
  };
};



// ---------------------------------------------------------------------------
// Media lifecycle capabilities (2026-08-02 adoption-set amendment).

export type MediaLifecycleFactsV1 = {
  authority: CaregiverFactAuthorityV1;
  process_state: PublishProcessStateV1;
  /**
   * The head `detach_publish_process_media` binds `draft_revision must_equal`
   * to. Detaching appends a new revision, so it needs the one it is detaching
   * from — the owner previously reported no revision at all here.
   */
  draft_revision: number;
  composition_media_ids: string[];
  media_revision: number;
  media_lifecycle: MediaAssetLifecycleV1;
  committed_release_count: number;
  referencing_draft_count: number;
};

export type MediaLifecycleReadPort = {
  listMediaLifecycleAssetIds(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<string[]>;
  loadMediaLifecycleFacts(input: {
    workspace_id: string;
    participant_id: string;
    media_asset_id: string;
    process_key?: string;
  }): Promise<MediaLifecycleFactsV1 | null>;
};

export type MediaLifecycleDependencies = {
  integrity_key: string;
  reads: MediaLifecycleReadPort & Pick<PublicationSafetyReadPort, "listSafetyProcessKeys">;
  now?: () => Date;
};

/** "Remove from this card": one draft's composition, nothing else. */
export const detachPublishProcessMedia = async (
  deps: MediaLifecycleDependencies,
  scope: BoardScopeV1,
  request: { process_ref: string; media_ref: string },
): Promise<MediaDetachDecisionV1> => {
  const processKey = resolveBoardSealedRef(
    deps.integrity_key,
    scope,
    PUBLISH_PROCESS_TARGET_KIND,
    request.process_ref,
    await deps.reads.listSafetyProcessKeys(scope),
  );
  if (!processKey) return { status: "denied", reason_code: "target_unavailable" };
  const mediaAssetId = resolveBoardSealedRef(
    deps.integrity_key,
    scope,
    MEDIA_ASSET_TARGET_KIND,
    request.media_ref,
    await deps.reads.listMediaLifecycleAssetIds(scope),
  );
  if (!mediaAssetId) return { status: "denied", reason_code: "target_unavailable" };
  const facts = await deps.reads.loadMediaLifecycleFacts({
    ...scope,
    media_asset_id: mediaAssetId,
    process_key: processKey,
  });
  if (!facts) return { status: "denied", reason_code: "target_unavailable" };
  if (!actorEligible(facts.authority)) return { status: "denied", reason_code: "not_authorized" };
  return evaluateMediaDetach(deps.integrity_key, scope, {
    process_state: facts.process_state,
    composition_media_ids: facts.composition_media_ids,
    media_asset_id: mediaAssetId,
    media_revision: facts.media_revision,
  });
};

/** Pre-publication global delete; illegal the moment any release commits. */
export const discardMediaAsset = async (
  deps: MediaLifecycleDependencies,
  scope: BoardScopeV1,
  request: { media_ref: string },
): Promise<MediaDiscardDecisionV1> => {
  const mediaAssetId = resolveBoardSealedRef(
    deps.integrity_key,
    scope,
    MEDIA_ASSET_TARGET_KIND,
    request.media_ref,
    await deps.reads.listMediaLifecycleAssetIds(scope),
  );
  if (!mediaAssetId) return { status: "denied", reason_code: "target_unavailable" };
  const facts = await deps.reads.loadMediaLifecycleFacts({
    ...scope,
    media_asset_id: mediaAssetId,
  });
  if (!facts) return { status: "denied", reason_code: "target_unavailable" };
  if (!actorEligible(facts.authority)) return { status: "denied", reason_code: "not_authorized" };
  return evaluateMediaDiscard(deps.integrity_key, scope, {
    lifecycle: facts.media_lifecycle,
    committed_release_count: facts.committed_release_count,
    referencing_draft_count: facts.referencing_draft_count,
    media_asset_id: mediaAssetId,
    media_revision: facts.media_revision,
  });
};
