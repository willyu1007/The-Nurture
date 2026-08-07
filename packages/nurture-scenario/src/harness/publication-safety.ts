import { randomUUID } from "node:crypto";
import type { NurtureCommandExecutionContext } from "../domain/commands/command-kernel.js";
import type { NurtureInteractionContextService } from "../domain/interactions/interaction-context.js";
import type {
  NurtureMediaAttributionTransaction,
  NurtureMediaDiscardFacts,
} from "../domain/institution/media-attribution-transaction.js";
import type {
  NurturePublishDraftFacts,
  NurturePublishProcessTransaction,
} from "../domain/institution/publish-process-transaction.js";
import type {
  NurturePublicationSafetyTransaction,
  NurturePublicationSafetyWriteFacts,
} from "../domain/institution/publication-safety-transaction.js";
import type { ProtectedContentWritePort } from "./protected-content.js";
import {
  CAREGIVER_BOARD_ROLES,
  issueBoardOpaqueRef,
  resolveBoardSealedRef,
  type BoardScopeV1,
  type CaregiverFactAuthorityV1,
} from "./board-projection.js";
import {
  createBoardWriteSpec,
  type NurtureBoardWriteSpec,
} from "./board-write-spec.js";
import {
  computeHarnessInputIntegrityTag,
  issueHarnessConfirmation,
} from "./confirmation.js";
import { computeProtectedBodyTag } from "./keyed-refs.js";
import {
  deriveMediaRef,
  evaluateMediaDetach,
  evaluateMediaDiscard,
  type MediaDetachDecisionV1,
  type MediaDiscardDecisionV1,
} from "./publish-eligibility.js";
import {
  MEDIA_ASSET_LIFECYCLE_STATES,
  MEDIA_ASSET_TARGET_KIND,
  type MediaAssetLifecycleV1,
} from "./media-attribution.js";
import {
  PUBLICATION_TARGET_KIND,
  PUBLISH_PROCESS_TARGET_KIND,
  isPublishProcessState,
  issuePublicationRef,
  type PublishProcessStateV1,
} from "./publish-process.js";
import {
  currentPublishEditHold,
  requiresOnlineEditHold,
} from "./publish-process-editing.js";

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

export type StoredVisibilityEventFactV1 = {
  kind: PublicationVisibilityEventKindV1;
  reason_key: string;
  occurred_at: string;
  source_release_revision: number;
};

export type CommittedPublicationFactV1 = {
  publication_id: string;
  target_key: string;
  /**
   * Absent when the owner cannot prove the Receipt — refusal territory,
   * never "": the empty-string sentinel hashed into a valid-looking
   * preserved ref shared by every receiptless publication.
   */
  receipt_id?: string;
  release_revision: number;
  visibility: "visible" | "removed" | "redacted";
  /**
   * The stored lineage, oldest first. An idempotent repeat answers from these
   * — a repeat that stamped its own clock or guessed a kind would report a
   * decision at a moment, and of a shape, the decision did not have.
   */
  events: StoredVisibilityEventFactV1[];
};

/**
 * A publication whose Receipt the owner has proven. The only shape an event
 * projection accepts: both lanes refuse the process before this type exists
 * for a receiptless row.
 */
export type ProvenCommittedPublicationFactV1 = CommittedPublicationFactV1 & {
  receipt_id: string;
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

export const parseReasonInput = (
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
  publication: ProvenCommittedPublicationFactV1,
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
  facts: Omit<PublicationSafetyFactsV1, "publications"> & {
    publications: ProvenCommittedPublicationFactV1[];
  };
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
  const publications: ProvenCommittedPublicationFactV1[] = [];
  for (const publication of facts.publications) {
    if (!publication.receipt_id) {
      // The same refusal, at the same scope, as the write lane: prepare must
      // never promise an action execute refuses on its first receiptless row.
      return { denied: "receipt_evidence_unavailable" };
    }
    publications.push(publication as ProvenCommittedPublicationFactV1);
  }
  return {
    facts: { ...facts, publications },
    occurredAt: (deps.now ?? (() => new Date()))().toISOString(),
  };
};

/** The stored event projected back into the public vocabulary. */
const storedEventRecord = (
  deps: { integrity_key: string },
  scope: BoardScopeV1,
  publication: Pick<
    ProvenCommittedPublicationFactV1,
    "publication_id" | "receipt_id" | "release_revision"
  >,
  event: StoredVisibilityEventFactV1,
):
  | { status: "ok"; event: PublicationVisibilityEventV1 }
  | { status: "denied"; reason_code: string } => {
  if (!PUBLICATION_SAFETY_REASONS.includes(event.reason_key as PublicationSafetyReasonV1)) {
    // A stored reason outside the taxonomy is not a fact to repeat.
    return { status: "denied", reason_code: "visibility_evidence_unavailable" };
  }
  return {
    status: "ok",
    event: buildEvent(
      deps as PublicationSafetyDependencies,
      scope,
      publication as ProvenCommittedPublicationFactV1,
      event.kind,
      event.reason_key as PublicationSafetyReasonV1,
      event.occurred_at,
    ),
  };
};

/**
 * The stored event that explains one publication's current non-visible state:
 * the LATEST event whose kind matches the visibility. Absent when the rows
 * predate the write lane — the repeat then refuses rather than inventing.
 */
const explainingEvent = (
  publication: CommittedPublicationFactV1,
): StoredVisibilityEventFactV1 | undefined => {
  const wanted: PublicationVisibilityEventKindV1 =
    publication.visibility === "redacted" ? "redaction" : "target_removal";
  return [...publication.events].reverse().find((event) => event.kind === wanted);
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
    // Already non-visible: the answer is the STORED event that made it so —
    // its own kind, its own reason, its own instant. An earlier version
    // stamped the repeat's clock and even reported "redaction" for a removal
    // it never performed.
    const stored = explainingEvent(publication);
    if (!stored) {
      return { status: "denied", reason_code: "visibility_evidence_unavailable" };
    }
    const record = storedEventRecord(deps, scope, publication, stored);
    if (record.status === "denied") return record;
    return { status: "already_satisfied", events: [record.event] };
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
    const events: PublicationVisibilityEventV1[] = [];
    for (const publication of context.facts.publications) {
      const stored = [...publication.events]
        .reverse()
        .find((event) => event.kind === "redaction");
      if (!stored) {
        return { status: "denied", reason_code: "visibility_evidence_unavailable" };
      }
      const record = storedEventRecord(deps, scope, publication, stored);
      if (record.status === "denied") return record;
      events.push(record.event);
    }
    return { status: "already_satisfied", events };
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
  /** The instant this read was true at; hold expiry is judged here only. */
  read_at: string;
  /** The stored hold, whether or not it has expired; expiry is the rule's call. */
  current_hold?: {
    holder_participant_id: string;
    holder_label: string;
    expires_at: string;
    hold_version: number;
  };
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
  // Detaching edits the shared composition, so it obeys the two draft-save
  // hold rules; expiry is judged at the owner's read instant, on no other
  // clock.
  const hold = currentPublishEditHold(facts, new Date(facts.read_at));
  if (hold && hold.holder_participant_id !== scope.participant_id) {
    return { status: "denied", reason_code: "held_by_other" };
  }
  if (requiresOnlineEditHold(facts.process_state) && !hold) {
    return { status: "denied", reason_code: "edit_hold_required" };
  }
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

// ---------------------------------------------------------------------------
// The media-lifecycle commands: detach and discard.

export const DETACH_PUBLISH_PROCESS_MEDIA_COMMAND_SCOPE = "publish_media_detach";
export const DISCARD_MEDIA_ASSET_COMMAND_SCOPE = "media_asset_discard";

export type DetachPublishProcessMediaCommandV1 = {
  process_key: string;
  media_asset_id: string;
  expected_draft_revision: number;
};

export type DiscardMediaAssetCommandV1 = {
  media_asset_id: string;
  expected_media_revision: number;
  /**
   * The blast radius the teacher confirmed. `media_asset_revision` is
   * immutable by schema, so it can never drift — this head is the one that
   * makes the strong_confirmation number enforceable: a draft attaching or
   * dropping the asset between prepare and execute is a stale confirmation,
   * not a silently different commit.
   */
  expected_referencing_draft_count: number;
};

export const canonicalizeDetachPublishProcessMediaCommand = (
  input: DetachPublishProcessMediaCommandV1,
): unknown => ({
  process_key: input.process_key,
  media_asset_id: input.media_asset_id,
  expected_draft_revision: input.expected_draft_revision,
});

export const canonicalizeDiscardMediaAssetCommand = (
  input: DiscardMediaAssetCommandV1,
): unknown => ({
  media_asset_id: input.media_asset_id,
  expected_media_revision: input.expected_media_revision,
  expected_referencing_draft_count: input.expected_referencing_draft_count,
});

export const parseDetachMediaInputV1 = (
  value: unknown,
): { status: "ok"; mediaRef: string } | { status: "invalid"; fields: string[] } => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { status: "invalid", fields: ["mediaRef"] };
  }
  const record = value as Record<string, unknown>;
  const unknown = Object.keys(record).filter((key) => key !== "mediaRef");
  if (unknown.length > 0) return { status: "invalid", fields: unknown };
  const mediaRef = record.mediaRef;
  if (typeof mediaRef !== "string" || mediaRef.length === 0 || mediaRef.length > 512) {
    return { status: "invalid", fields: ["mediaRef"] };
  }
  return { status: "ok", mediaRef };
};

export type MediaLifecyclePrepareDecision =
  | {
      status: "ready_to_confirm";
      preview: Record<string, string | number>;
      confirmation_ref: string;
      expires_at: string;
      command_request_id: string;
    }
  | { status: "needs_input"; fields: string[] }
  | { status: "denied"; reason_code: string };

type MediaLifecyclePrepareDeps = MediaLifecycleDependencies & {
  contexts: NurtureInteractionContextService;
  create_command_id?: () => string;
};

type MediaLifecyclePrepareRequest = BoardScopeV1 & {
  surface: string;
  host_conversation_ref?: string;
  operation_input?: unknown;
  target_option_ref?: string;
};

export const prepareDetachPublishProcessMedia = async (
  deps: MediaLifecyclePrepareDeps,
  request: MediaLifecyclePrepareRequest,
): Promise<MediaLifecyclePrepareDecision> => {
  const parsed = parseDetachMediaInputV1(request.operation_input);
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };
  if (!request.target_option_ref) return { status: "needs_input", fields: ["target"] };
  const scope: BoardScopeV1 = {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
  };
  const processKey = resolveBoardSealedRef(
    deps.integrity_key,
    scope,
    PUBLISH_PROCESS_TARGET_KIND,
    request.target_option_ref,
    await deps.reads.listSafetyProcessKeys(scope),
  );
  if (!processKey) return { status: "denied", reason_code: "target_unavailable" };
  const mediaAssetId = resolveBoardSealedRef(
    deps.integrity_key,
    scope,
    MEDIA_ASSET_TARGET_KIND,
    parsed.mediaRef,
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

  // The same two hold rules the execute spec enforces: prepare must not
  // issue a confirmation the command is certain to refuse.
  const hold = currentPublishEditHold(facts, new Date(facts.read_at));
  if (hold && hold.holder_participant_id !== request.participant_id) {
    return { status: "denied", reason_code: "held_by_other" };
  }
  if (requiresOnlineEditHold(facts.process_state) && !hold) {
    return { status: "denied", reason_code: "edit_hold_required" };
  }

  const decision = evaluateMediaDetach(deps.integrity_key, scope, {
    process_state: facts.process_state,
    composition_media_ids: facts.composition_media_ids,
    media_asset_id: mediaAssetId,
    media_revision: facts.media_revision,
  });
  if (decision.status === "denied") return decision;

  const command: DetachPublishProcessMediaCommandV1 = {
    process_key: processKey,
    media_asset_id: mediaAssetId,
    expected_draft_revision: facts.draft_revision,
  };
  const commandRequestId = (deps.create_command_id ?? (() => `command:${randomUUID()}`))();
  const issued = await issueHarnessConfirmation(deps.contexts, {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    surface: request.surface,
    ...(request.host_conversation_ref
      ? { host_conversation_ref: request.host_conversation_ref }
      : {}),
    payload: {
      capability_key: DETACH_PUBLISH_PROCESS_MEDIA_CAPABILITY.key,
      capability_version: DETACH_PUBLISH_PROCESS_MEDIA_CAPABILITY.version,
      command_request_id: commandRequestId,
      target_refs: { publish_process: processKey, media_asset: mediaAssetId },
      expected_heads: { draft_revision: command.expected_draft_revision },
      input_integrity_tag: computeHarnessInputIntegrityTag(
        deps.integrity_key,
        canonicalizeDetachPublishProcessMediaCommand(command),
      ),
      integrity_tag_version: 1,
    },
  });
  return {
    status: "ready_to_confirm",
    preview: {
      effect: DETACH_PUBLISH_PROCESS_MEDIA_CAPABILITY.key,
      remaining_media_count: decision.remainingMediaCount,
    },
    confirmation_ref: issued.token,
    expires_at: issued.expires_at,
    command_request_id: commandRequestId,
  };
};

export const prepareDiscardMediaAsset = async (
  deps: MediaLifecyclePrepareDeps,
  request: MediaLifecyclePrepareRequest,
): Promise<MediaLifecyclePrepareDecision> => {
  if (
    request.operation_input !== undefined &&
    (typeof request.operation_input !== "object" ||
      request.operation_input === null ||
      Array.isArray(request.operation_input) ||
      Object.keys(request.operation_input).length > 0)
  ) {
    return { status: "needs_input", fields: ["operation_input"] };
  }
  if (!request.target_option_ref) return { status: "needs_input", fields: ["target"] };
  const scope: BoardScopeV1 = {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
  };
  const mediaAssetId = resolveBoardSealedRef(
    deps.integrity_key,
    scope,
    MEDIA_ASSET_TARGET_KIND,
    request.target_option_ref,
    await deps.reads.listMediaLifecycleAssetIds(scope),
  );
  if (!mediaAssetId) return { status: "denied", reason_code: "target_unavailable" };
  const facts = await deps.reads.loadMediaLifecycleFacts({
    ...scope,
    media_asset_id: mediaAssetId,
  });
  if (!facts) return { status: "denied", reason_code: "target_unavailable" };
  if (!actorEligible(facts.authority)) return { status: "denied", reason_code: "not_authorized" };

  const decision = evaluateMediaDiscard(deps.integrity_key, scope, {
    lifecycle: facts.media_lifecycle,
    committed_release_count: facts.committed_release_count,
    referencing_draft_count: facts.referencing_draft_count,
    media_asset_id: mediaAssetId,
    media_revision: facts.media_revision,
  });
  if (decision.status === "denied") return decision;

  const command: DiscardMediaAssetCommandV1 = {
    media_asset_id: mediaAssetId,
    expected_media_revision: facts.media_revision,
    // The exact number the strong_confirmation preview shows.
    expected_referencing_draft_count: decision.affectedDraftCount,
  };
  const commandRequestId = (deps.create_command_id ?? (() => `command:${randomUUID()}`))();
  const issued = await issueHarnessConfirmation(deps.contexts, {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    surface: request.surface,
    ...(request.host_conversation_ref
      ? { host_conversation_ref: request.host_conversation_ref }
      : {}),
    payload: {
      capability_key: DISCARD_MEDIA_ASSET_CAPABILITY.key,
      capability_version: DISCARD_MEDIA_ASSET_CAPABILITY.version,
      command_request_id: commandRequestId,
      target_refs: { media_asset: mediaAssetId },
      expected_heads: {
        media_asset_revision: command.expected_media_revision,
        referencing_draft_count: command.expected_referencing_draft_count,
      },
      input_integrity_tag: computeHarnessInputIntegrityTag(
        deps.integrity_key,
        canonicalizeDiscardMediaAssetCommand(command),
      ),
      integrity_tag_version: 1,
    },
  });
  return {
    status: "ready_to_confirm",
    preview: {
      effect: DISCARD_MEDIA_ASSET_CAPABILITY.key,
      // strong_confirmation states the blast radius before the teacher commits.
      affected_draft_count: decision.affectedDraftCount,
    },
    confirmation_ref: issued.token,
    expires_at: issued.expires_at,
    command_request_id: commandRequestId,
  };
};

// ---------------------------------------------------------------------------
// The two command specs.

const mediaCommandScope = (context: NurtureCommandExecutionContext): BoardScopeV1 => ({
  workspace_id: context.workspace_id,
  participant_id: context.business_actor_ref,
});

export const createDetachPublishProcessMediaSpec = (deps: {
  integrity_key: string;
}): NurtureBoardWriteSpec<DetachPublishProcessMediaCommandV1> =>
  createBoardWriteSpec<
    DetachPublishProcessMediaCommandV1,
    NurturePublishProcessTransaction,
    NurturePublishDraftFacts,
    Record<string, never>
  >({
    capability: DETACH_PUBLISH_PROCESS_MEDIA_CAPABILITY,
    command_scope: DETACH_PUBLISH_PROCESS_MEDIA_COMMAND_SCOPE,
    contract_version: 1,
    result_schema_version: 1,
    canonicalize: canonicalizeDetachPublishProcessMediaCommand,
    port: {
      select: (tx) => tx.publishProcess,
      unavailable_reason_code: "publish_process_port_unavailable",
    },
    revalidateInput: (input) =>
      input.process_key.length > 0 &&
      input.media_asset_id.length > 0 &&
      Number.isSafeInteger(input.expected_draft_revision) &&
      // Detaching edits an existing composition, so a real revision exists.
      input.expected_draft_revision >= 1
        ? null
        : { status: "invalid", reason_code: "invalid_detach_input" },
    loadFacts: (owner, input, context) =>
      owner.loadPublishDraftFacts({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        process_key: input.process_key,
        command_request_id: context.command_request_id,
      }),
    facts_absent_reason_code: "target_unavailable",
    head_keys: ["draft_revision"],
    expectedHeads: (input) => ({ draft_revision: input.expected_draft_revision }),
    currentHeads: (facts) => ({ draft_revision: facts.current_revision }),
    authorize: (facts, input, context) => {
      if (!actorEligible(facts.authority as CaregiverFactAuthorityV1)) {
        return { status: "blocked", reason_code: "not_authorized" };
      }
      if (facts.replayed_revision) {
        // This exact command identity already detached; answer from the
        // revision it wrote rather than appending a second one.
        const scope = mediaCommandScope(context);
        return {
          status: "already_satisfied",
          effect: {
            output_refs: [facts.publish_process_ref],
            committed_result: {
              mediaRef: deriveMediaRef(deps.integrity_key, scope, {
                media_asset_id: input.media_asset_id,
                media_revision:
                  facts.composition.find(
                    (entry) => entry.media_asset_id === input.media_asset_id,
                  )?.media_revision ?? 0,
              }),
              remainingMediaCount: facts.composition.filter(
                (entry) => entry.media_asset_id !== input.media_asset_id,
              ).length,
            },
          },
        };
      }
      if (!isPublishProcessState(facts.process_state)) {
        return { status: "blocked", reason_code: "process_not_editable" };
      }
      // Detaching is an edit of the shared composition, so it obeys the same
      // two hold rules as a draft save: another teacher's live hold
      // serializes it away, and a queued process needs an online hold —
      // offline devices cannot reliably stop a server-side scheduled send.
      // Expiry is judged at the owner's own read instant, on no other clock.
      const hold = currentPublishEditHold(facts, new Date(facts.read_at));
      if (hold && hold.holder_participant_id !== context.business_actor_ref) {
        return { status: "blocked", reason_code: "held_by_other" };
      }
      if (requiresOnlineEditHold(facts.process_state) && !hold) {
        return { status: "blocked", reason_code: "edit_hold_required" };
      }
      const decision = evaluateMediaDetach(deps.integrity_key, mediaCommandScope(context), {
        process_state: facts.process_state,
        composition_media_ids: facts.composition.map((entry) => entry.media_asset_id),
        media_asset_id: input.media_asset_id,
        media_revision:
          facts.composition.find((entry) => entry.media_asset_id === input.media_asset_id)
            ?.media_revision ?? 0,
      });
      if (decision.status === "denied") {
        return { status: "blocked", reason_code: decision.reason_code };
      }
      return { status: "authorized", write: {} };
    },
    apply: async (owner, input, context) => {
      const applied = await owner.applyPublishProcessMediaDetach({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        process_key: input.process_key,
        command_request_id: context.command_request_id,
        expected_draft_revision: input.expected_draft_revision,
        media_asset_id: input.media_asset_id,
      });
      return {
        output_refs: [applied.publish_process_ref],
        committed_result: {
          // The same derivation the eligibility projection uses for the same
          // concept, over the composed revision the owner actually removed.
          mediaRef: deriveMediaRef(deps.integrity_key, mediaCommandScope(context), {
            media_asset_id: input.media_asset_id,
            media_revision: applied.detached_media_revision,
          }),
          remainingMediaCount: applied.remaining_media_count,
        },
      };
    },
  });

export const createDiscardMediaAssetSpec = (deps: {
  integrity_key: string;
}): NurtureBoardWriteSpec<DiscardMediaAssetCommandV1> =>
  createBoardWriteSpec<
    DiscardMediaAssetCommandV1,
    NurtureMediaAttributionTransaction,
    NurtureMediaDiscardFacts,
    Record<string, never>
  >({
    capability: DISCARD_MEDIA_ASSET_CAPABILITY,
    command_scope: DISCARD_MEDIA_ASSET_COMMAND_SCOPE,
    contract_version: 1,
    result_schema_version: 1,
    canonicalize: canonicalizeDiscardMediaAssetCommand,
    port: {
      select: (tx) => tx.mediaAttribution,
      unavailable_reason_code: "media_attribution_port_unavailable",
    },
    revalidateInput: (input) =>
      input.media_asset_id.length > 0 &&
      Number.isSafeInteger(input.expected_media_revision) &&
      input.expected_media_revision >= 1 &&
      Number.isSafeInteger(input.expected_referencing_draft_count) &&
      input.expected_referencing_draft_count >= 0
        ? null
        : { status: "invalid", reason_code: "invalid_discard_input" },
    loadFacts: (owner, input, context) =>
      owner.loadMediaDiscardFacts({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        media_asset_id: input.media_asset_id,
      }),
    facts_absent_reason_code: "target_unavailable",
    // media_asset_revision is immutable by schema, so alone it could never
    // drift; the draft-reference count is the head that makes the confirmed
    // blast radius enforceable.
    head_keys: ["media_asset_revision", "referencing_draft_count"],
    expectedHeads: (input) => ({
      media_asset_revision: input.expected_media_revision,
      referencing_draft_count: input.expected_referencing_draft_count,
    }),
    currentHeads: (facts) => ({
      media_asset_revision: facts.media_revision,
      referencing_draft_count: facts.referencing_draft_count,
    }),
    authorize: (facts, input, context) => {
      if (!actorEligible(facts.authority as CaregiverFactAuthorityV1)) {
        return { status: "blocked", reason_code: "not_authorized" };
      }
      if (
        !MEDIA_ASSET_LIFECYCLE_STATES.includes(facts.media_lifecycle as MediaAssetLifecycleV1)
      ) {
        return { status: "blocked", reason_code: "media_already_terminal" };
      }
      const decision = evaluateMediaDiscard(deps.integrity_key, mediaCommandScope(context), {
        lifecycle: facts.media_lifecycle as MediaAssetLifecycleV1,
        committed_release_count: facts.committed_release_count,
        referencing_draft_count: facts.referencing_draft_count,
        media_asset_id: input.media_asset_id,
        media_revision: facts.media_revision,
      });
      if (decision.status === "denied") {
        return { status: "blocked", reason_code: decision.reason_code };
      }
      return { status: "authorized", write: {} };
    },
    apply: async (owner, input, context) => {
      const applied = await owner.applyMediaAssetDiscard({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        media_asset_id: input.media_asset_id,
        expected_media_revision: input.expected_media_revision,
      });
      return {
        output_refs: [applied.media_asset_ref],
        committed_result: {
          mediaRef: deriveMediaRef(deps.integrity_key, mediaCommandScope(context), {
            media_asset_id: input.media_asset_id,
            media_revision: input.expected_media_revision,
          }),
          // Measured inside the write transaction — the number the teacher
          // confirmed is the number the commit records.
          affectedDraftCount: applied.affected_draft_count,
        },
      };
    },
  });

// ---------------------------------------------------------------------------
// The three post-release safety commands.

export const CORRECT_PUBLICATION_COMMAND_SCOPE = "publication_correct";
export const REMOVE_PUBLICATION_TARGET_VISIBILITY_COMMAND_SCOPE = "publication_remove_target";
export const REDACT_PUBLICATION_COMMAND_SCOPE = "publication_redact";

export type CorrectPublicationCommandV1 = {
  process_key: string;
  reason: PublicationSafetyReasonV1;
  correction_text: string;
};

export type RemovePublicationTargetCommandV1 = {
  process_key: string;
  publication_id: string;
  reason: PublicationSafetyReasonV1;
};

export type RedactPublicationCommandV1 = {
  process_key: string;
  reason: PublicationSafetyReasonV1;
};

/**
 * The correction body never enters the canonical payload: a keyed digest
 * stands in, so neither the CommandExecution payload hash nor the confirmation
 * stores an enumerable bare hash of what a teacher wrote.
 */
export const canonicalizeCorrectPublicationCommand =
  (integrityKey: string) =>
  (input: CorrectPublicationCommandV1): unknown => ({
    process_key: input.process_key,
    reason: input.reason,
    correction_tag: computeProtectedBodyTag(integrityKey, input.correction_text),
  });

export const canonicalizeRemovePublicationTargetCommand = (
  input: RemovePublicationTargetCommandV1,
): unknown => ({
  process_key: input.process_key,
  publication_id: input.publication_id,
  reason: input.reason,
});

export const canonicalizeRedactPublicationCommand = (
  input: RedactPublicationCommandV1,
): unknown => ({
  process_key: input.process_key,
  reason: input.reason,
});

export type PublicationSafetyPrepareDecision =
  | {
      status: "ready_to_confirm";
      preview: Record<string, string | number>;
      confirmation_ref: string;
      expires_at: string;
      command_request_id: string;
    }
  | { status: "needs_input"; fields: string[] }
  | { status: "denied"; reason_code: string };

type PublicationSafetyPrepareDeps = PublicationSafetyDependencies & {
  contexts: NurtureInteractionContextService;
  create_command_id?: () => string;
};

type PublicationSafetyPrepareRequest = BoardScopeV1 & {
  surface: string;
  host_conversation_ref?: string;
  operation_input?: unknown;
  target_option_ref?: string;
};

const preparePublicationSafetyAction = async (
  deps: PublicationSafetyPrepareDeps,
  request: PublicationSafetyPrepareRequest,
  action: {
    capability: { key: string; version: string };
    extra_field?: "correctionText" | "publicationRef";
    decide(
      context: SafetyContext,
      scope: BoardScopeV1,
      parsed: { reason: PublicationSafetyReasonV1; correctionText?: string; publicationRef?: string },
    ): Promise<PublicationSafetyDecisionV1> | PublicationSafetyDecisionV1;
    freeze(
      processKey: string,
      context: SafetyContext,
      parsed: { reason: PublicationSafetyReasonV1; correctionText?: string; publicationRef?: string },
      scope: BoardScopeV1,
    ): { target_refs: Record<string, string>; canonical_command: unknown } | { denied: string };
  },
): Promise<PublicationSafetyPrepareDecision> => {
  const parsed = parseReasonInput(request.operation_input, action.extra_field);
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };
  if (!request.target_option_ref) return { status: "needs_input", fields: ["target"] };
  const scope: BoardScopeV1 = {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
  };
  const processKey = resolveBoardSealedRef(
    deps.integrity_key,
    scope,
    PUBLISH_PROCESS_TARGET_KIND,
    request.target_option_ref,
    await deps.reads.listSafetyProcessKeys(scope),
  );
  if (!processKey) return { status: "denied", reason_code: "target_unavailable" };
  const safetyContext = await loadSafetyContext(deps, scope, request.target_option_ref);
  if ("denied" in safetyContext) return { status: "denied", reason_code: safetyContext.denied };

  const decision = await action.decide(safetyContext, scope, parsed.input);
  if (decision.status === "denied") return decision;
  if (decision.status === "needs_input") return decision;

  const frozen = action.freeze(processKey, safetyContext, parsed.input, scope);
  if ("denied" in frozen) return { status: "denied", reason_code: frozen.denied };
  const commandRequestId = (deps.create_command_id ?? (() => `command:${randomUUID()}`))();
  const issued = await issueHarnessConfirmation(deps.contexts, {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    surface: request.surface,
    ...(request.host_conversation_ref
      ? { host_conversation_ref: request.host_conversation_ref }
      : {}),
    payload: {
      capability_key: action.capability.key,
      capability_version: action.capability.version,
      command_request_id: commandRequestId,
      target_refs: { publish_process: processKey, ...frozen.target_refs },
      // Append-compatible lineage: no equality to freeze. The per-(release,
      // command, kind) unique on the event table is the concurrency contract.
      expected_heads: {},
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
      effect: action.capability.key,
      outcome: decision.status === "appended" ? "apply" : "already_satisfied",
      affected_publications: decision.events.length,
    },
    confirmation_ref: issued.token,
    expires_at: issued.expires_at,
    command_request_id: commandRequestId,
  };
};

export const prepareCorrectPublication = (
  deps: PublicationSafetyPrepareDeps,
  request: PublicationSafetyPrepareRequest,
): Promise<PublicationSafetyPrepareDecision> =>
  preparePublicationSafetyAction(deps, request, {
    capability: CORRECT_PUBLICATION_CAPABILITY,
    extra_field: "correctionText",
    decide: (_context, scope, parsed) =>
      correctPublication(deps, scope, {
        process_ref: request.target_option_ref ?? "",
        operation_input: { reason: parsed.reason, correctionText: parsed.correctionText },
      }),
    freeze: (processKey, _context, parsed) => ({
      target_refs: {},
      canonical_command: canonicalizeCorrectPublicationCommand(deps.integrity_key)({
        process_key: processKey,
        reason: parsed.reason,
        correction_text: parsed.correctionText ?? "",
      }),
    }),
  });

export const prepareRemovePublicationTargetVisibility = (
  deps: PublicationSafetyPrepareDeps,
  request: PublicationSafetyPrepareRequest,
): Promise<PublicationSafetyPrepareDecision> =>
  preparePublicationSafetyAction(deps, request, {
    capability: REMOVE_PUBLICATION_TARGET_VISIBILITY_CAPABILITY,
    extra_field: "publicationRef",
    decide: (_context, scope, parsed) =>
      removePublicationTargetVisibility(deps, scope, {
        process_ref: request.target_option_ref ?? "",
        operation_input: { reason: parsed.reason, publicationRef: parsed.publicationRef },
      }),
    freeze: (processKey, context, parsed, scope) => {
      const publicationId = resolveBoardSealedRef(
        deps.integrity_key,
        scope,
        PUBLICATION_TARGET_KIND,
        parsed.publicationRef ?? "",
        context.facts.publications.map((publication) => publication.publication_id),
      );
      if (!publicationId) return { denied: "target_unavailable" };
      return {
        target_refs: { publication: publicationId },
        canonical_command: canonicalizeRemovePublicationTargetCommand({
          process_key: processKey,
          publication_id: publicationId,
          reason: parsed.reason,
        }),
      };
    },
  });

export const prepareRedactPublication = (
  deps: PublicationSafetyPrepareDeps,
  request: PublicationSafetyPrepareRequest,
): Promise<PublicationSafetyPrepareDecision> =>
  preparePublicationSafetyAction(deps, request, {
    capability: REDACT_PUBLICATION_CAPABILITY,
    decide: (_context, scope, parsed) =>
      redactPublication(deps, scope, {
        process_ref: request.target_option_ref ?? "",
        operation_input: { reason: parsed.reason },
      }),
    freeze: (processKey, _context, parsed) => ({
      target_refs: {},
      canonical_command: canonicalizeRedactPublicationCommand({
        process_key: processKey,
        reason: parsed.reason,
      }),
    }),
  });

// ---------------------------------------------------------------------------
// The three command specs. All append-compatible: no equality to freeze, the
// per-(release, command, kind) unique on the event table is the concurrency
// contract, and the visibility transitions are monotone.

const safetyCommandScope = (context: NurtureCommandExecutionContext): BoardScopeV1 => ({
  workspace_id: context.workspace_id,
  participant_id: context.business_actor_ref,
});

type SafetyWritePublication = NurturePublicationSafetyWriteFacts["publications"][number];

const PUBLICATION_VISIBILITIES = ["visible", "removed", "redacted"] as const;

const asCommittedFact = (
  publication: SafetyWritePublication,
):
  | { status: "ok"; fact: ProvenCommittedPublicationFactV1 }
  | { status: "denied"; reason_code: string } => {
  if (
    !PUBLICATION_VISIBILITIES.includes(
      publication.visibility as (typeof PUBLICATION_VISIBILITIES)[number],
    )
  ) {
    return { status: "denied", reason_code: "visibility_evidence_unavailable" };
  }
  if (!publication.receipt_id) {
    // Every committed release carries its Receipt; one without is not a fact
    // this lane can echo — the empty-string sentinel it used to hash produced
    // a valid-looking preserved ref shared by every receiptless publication.
    return { status: "denied", reason_code: "receipt_evidence_unavailable" };
  }
  const events: StoredVisibilityEventFactV1[] = [];
  for (const event of publication.events) {
    if (
      event.kind !== "correction" &&
      event.kind !== "target_removal" &&
      event.kind !== "redaction"
    ) {
      return { status: "denied", reason_code: "visibility_evidence_unavailable" };
    }
    events.push({
      kind: event.kind,
      reason_key: event.reason_key,
      occurred_at: event.occurred_at,
      source_release_revision: event.source_release_revision,
    });
  }
  return {
    status: "ok",
    fact: {
      publication_id: publication.publication_id,
      target_key: "",
      receipt_id: publication.receipt_id,
      release_revision: publication.release_revision,
      visibility: publication.visibility as CommittedPublicationFactV1["visibility"],
      events,
    },
  };
};

type SafetyAppendPlan = {
  kind: PublicationVisibilityEventKindV1;
  targets: ProvenCommittedPublicationFactV1[];
  updates: Array<{
    publication_id: string;
    from_visibility: string[];
    to_visibility: "removed" | "redacted";
  }>;
  /**
   * The aggregate the action operated on — the one output ref. Per-event refs
   * live in `committed_result.events`; naming every event here would grow
   * with the release count and cross the kernel's 32-ref bound on a
   * whole-class process, turning a rolled-back redaction into a permanent
   * `outcome_unknown`.
   */
  publish_process_ref: NurturePublicationSafetyWriteFacts["publish_process_ref"];
  /** The authorize-validated assignment the lineage rows must name. */
  actor_role_assignment_id: string;
};

/** What a rule decides; the aggregate ref and actor come from facts, in authorize. */
type SafetyRulePlan = Omit<SafetyAppendPlan, "publish_process_ref" | "actor_role_assignment_id">;

type SafetyRuleDecision =
  | { status: "append"; plan: SafetyRulePlan }
  | {
      status: "already_satisfied";
      answers: Array<{
        fact: ProvenCommittedPublicationFactV1;
        event: StoredVisibilityEventFactV1;
      }>;
    }
  | { status: "denied"; reason_code: string };

const createPublicationSafetySpec = <
  Command extends { process_key: string; reason: PublicationSafetyReasonV1 },
>(
  deps: { integrity_key: string; now?: () => Date },
  shape: {
    capability: { key: string; version: string };
    command_scope: string;
    canonicalize(input: Command): unknown;
    revalidate(input: Command): boolean;
    evaluate(facts: ProvenCommittedPublicationFactV1[], input: Command): SafetyRuleDecision;
    /** The sealed correction body, when this action carries one. */
    body_envelope?(input: Command): unknown;
    /**
     * T-009: the display-safe correction text for the outbound family-growth
     * lifecycle envelope. Only the outbox envelope may carry it in plain
     * form; the canonical lineage row keeps the sealed body above.
     */
    display_safe_text?(input: Command): string;
  },
): NurtureBoardWriteSpec<Command> =>
  createBoardWriteSpec<
    Command,
    NurturePublicationSafetyTransaction,
    NurturePublicationSafetyWriteFacts,
    SafetyAppendPlan
  >({
    capability: shape.capability,
    command_scope: shape.command_scope,
    contract_version: 1,
    result_schema_version: 1,
    canonicalize: shape.canonicalize,
    port: {
      select: (tx) => tx.publicationSafety,
      unavailable_reason_code: "publication_safety_port_unavailable",
    },
    revalidateInput: (input) =>
      input.process_key.length > 0 &&
      PUBLICATION_SAFETY_REASONS.includes(input.reason) &&
      shape.revalidate(input)
        ? null
        : { status: "invalid", reason_code: "invalid_safety_input" },
    loadFacts: (owner, input, context) =>
      owner.loadPublicationSafetyWriteFacts({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        process_key: input.process_key,
      }),
    facts_absent_reason_code: "target_unavailable",
    // Append-compatible lineage: nothing to freeze, by declaration — the
    // registry binds `publication_visibility_lineage compatible_append`, and
    // the event unique plus the monotone visibility WHERE carry concurrency.
    head_keys: [],
    expectedHeads: () => ({}),
    currentHeads: () => ({}),
    authorize: (facts, input, context) => {
      if (!actorEligible(facts.authority as CaregiverFactAuthorityV1)) {
        return { status: "blocked", reason_code: "not_authorized" };
      }
      if (facts.publications.length === 0) {
        return { status: "blocked", reason_code: "no_committed_publication" };
      }
      const committed: ProvenCommittedPublicationFactV1[] = [];
      for (const publication of facts.publications) {
        const fact = asCommittedFact(publication);
        if (fact.status === "denied") return { status: "blocked", reason_code: fact.reason_code };
        committed.push(fact.fact);
      }
      const decision = shape.evaluate(committed, input);
      if (decision.status === "denied") {
        return { status: "blocked", reason_code: decision.reason_code };
      }
      if (decision.status === "append") {
        return {
          status: "authorized",
          write: {
            ...decision.plan,
            publish_process_ref: facts.publish_process_ref,
            actor_role_assignment_id: facts.actor_role_assignment_id,
          },
        };
      }
      const scope = safetyCommandScope(context);
      const events: PublicationVisibilityEventV1[] = [];
      for (const answer of decision.answers) {
        const record = storedEventRecord(deps, scope, answer.fact, answer.event);
        if (record.status === "denied") {
          return { status: "blocked", reason_code: record.reason_code };
        }
        events.push(record.event);
      }
      return {
        status: "already_satisfied",
        effect: {
          output_refs: [facts.publish_process_ref],
          committed_result: { events },
        },
      };
    },
    apply: async (owner, input, context, plan) => {
      const scope = safetyCommandScope(context);
      const occurredAt = (deps.now ?? (() => new Date()))().toISOString();
      if (plan.updates.length > 0) {
        await owner.applyPublicationVisibilityUpdate({
          workspace_id: context.workspace_id,
          participant_id: context.business_actor_ref,
          updates: plan.updates,
        });
      }
      // Event rows are named NOW and written by `finalize`: they carry the
      // command execution id, a row that does not exist until apply returns.
      const events = plan.targets.map((publication) => ({
        event_id: randomUUID(),
        publication_id: publication.publication_id,
        kind: plan.kind,
        reason_key: input.reason,
        source_release_revision: publication.release_revision,
        occurred_at: occurredAt,
        ...(shape.body_envelope ? { body_envelope: shape.body_envelope(input) } : {}),
        ...(shape.display_safe_text
          ? { correction_display_safe_text: shape.display_safe_text(input) }
          : {}),
      }));
      return {
        // One aggregate ref, like the already_satisfied answer above: a
        // whole-class process has one lineage row per release, and a
        // per-event list would cross the kernel's 32-ref bound — turning a
        // definitely-rolled-back redaction into a permanent outcome_unknown.
        // The events themselves are named in `committed_result.events`.
        output_refs: [plan.publish_process_ref],
        committed_result: {
          events: plan.targets.map((publication) =>
            buildEvent(
              { integrity_key: deps.integrity_key } as PublicationSafetyDependencies,
              scope,
              publication,
              plan.kind,
              input.reason,
              occurredAt,
            ),
          ),
        },
        finalization_payload: {
          events,
          actor_role_assignment_id: plan.actor_role_assignment_id,
        },
      };
    },
    finalize: async (owner, _input, context, applied) => {
      const payload = applied.finalization_payload as {
        events: Array<{
          event_id: string;
          publication_id: string;
          kind: PublicationVisibilityEventKindV1;
          reason_key: string;
          source_release_revision: number;
          occurred_at: string;
          body_envelope?: unknown;
          correction_display_safe_text?: string;
        }>;
        actor_role_assignment_id: string;
      };
      await owner.appendPublicationVisibilityEvents({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        command_execution_id: applied.execution_id,
        actor_role_assignment_id: payload.actor_role_assignment_id,
        events: payload.events,
      });
    },
  });

export const createCorrectPublicationSpec = (deps: {
  integrity_key: string;
  protected_content: ProtectedContentWritePort;
  now?: () => Date;
}): NurtureBoardWriteSpec<CorrectPublicationCommandV1> =>
  createPublicationSafetySpec<CorrectPublicationCommandV1>(deps, {
    capability: CORRECT_PUBLICATION_CAPABILITY,
    command_scope: CORRECT_PUBLICATION_COMMAND_SCOPE,
    canonicalize: canonicalizeCorrectPublicationCommand(deps.integrity_key),
    revalidate: (input) =>
      input.correction_text.length >= 1 && input.correction_text.length <= 2_000,
    evaluate: (publications) => {
      const visible = publications.filter((publication) => publication.visibility === "visible");
      if (visible.length === 0) {
        return { status: "denied", reason_code: "no_visible_publication" };
      }
      // A correction never hides anything: events only, no visibility change.
      return {
        status: "append",
        plan: { kind: "correction", targets: visible, updates: [] },
      };
    },
    // The correction body rides sealed into the lineage row; an earlier
    // version validated it and then silently dropped it.
    body_envelope: (input) => deps.protected_content.seal(input.correction_text),
    // The same text, display-safe, for the family-growth lifecycle envelope
    // (T-009): the teacher's correction input IS the display text — no
    // unseal step exists or is needed on the live path.
    display_safe_text: (input) => input.correction_text,
  });

export const createRemovePublicationTargetVisibilitySpec = (deps: {
  integrity_key: string;
  now?: () => Date;
}): NurtureBoardWriteSpec<RemovePublicationTargetCommandV1> =>
  createPublicationSafetySpec<RemovePublicationTargetCommandV1>(deps, {
    capability: REMOVE_PUBLICATION_TARGET_VISIBILITY_CAPABILITY,
    command_scope: REMOVE_PUBLICATION_TARGET_VISIBILITY_COMMAND_SCOPE,
    canonicalize: canonicalizeRemovePublicationTargetCommand,
    revalidate: (input) => input.publication_id.length > 0,
    evaluate: (publications, input) => {
      const publication = publications.find(
        (entry) => entry.publication_id === input.publication_id,
      );
      if (!publication) return { status: "denied", reason_code: "target_unavailable" };
      if (publication.visibility !== "visible") {
        const stored = explainingEvent(publication);
        if (!stored) {
          return { status: "denied", reason_code: "visibility_evidence_unavailable" };
        }
        return { status: "already_satisfied", answers: [{ fact: publication, event: stored }] };
      }
      return {
        status: "append",
        plan: {
          kind: "target_removal",
          targets: [publication],
          updates: [
            {
              publication_id: publication.publication_id,
              from_visibility: ["visible"],
              to_visibility: "removed",
            },
          ],
        },
      };
    },
  });

export const createRedactPublicationSpec = (deps: {
  integrity_key: string;
  now?: () => Date;
}): NurtureBoardWriteSpec<RedactPublicationCommandV1> =>
  createPublicationSafetySpec<RedactPublicationCommandV1>(deps, {
    capability: REDACT_PUBLICATION_CAPABILITY,
    command_scope: REDACT_PUBLICATION_COMMAND_SCOPE,
    canonicalize: canonicalizeRedactPublicationCommand,
    revalidate: () => true,
    evaluate: (publications) => {
      const pending = publications.filter(
        (publication) => publication.visibility !== "redacted",
      );
      if (pending.length === 0) {
        const answers: Array<{
          fact: ProvenCommittedPublicationFactV1;
          event: StoredVisibilityEventFactV1;
        }> = [];
        for (const publication of publications) {
          const stored = [...publication.events]
            .reverse()
            .find((event) => event.kind === "redaction");
          if (!stored) {
            return { status: "denied", reason_code: "visibility_evidence_unavailable" };
          }
          answers.push({ fact: publication, event: stored });
        }
        return { status: "already_satisfied", answers };
      }
      return {
        status: "append",
        plan: {
          kind: "redaction",
          targets: pending,
          updates: pending.map((publication) => ({
            publication_id: publication.publication_id,
            from_visibility: ["visible", "removed"],
            to_visibility: "redacted" as const,
          })),
        },
      };
    },
  });
