import { createHmac } from "node:crypto";
import {
  CAREGIVER_BOARD_ROLES,
  issueBoardOpaqueRef,
  resolveBoardSealedRef,
  type BoardScopeV1,
  type CaregiverFactAuthorityV1,
} from "./board-projection.js";
import {
  PUBLISH_PROCESS_TARGET_KIND,
  isLegalPublishProcessTransition,
  type PublishProcessStateV1,
} from "./publish-process.js";

/**
 * G3-B1 draft editing lane (02-architecture.md D-08).
 *
 * Nurture owns the server-side draft, its `draftRevision` and the versioned
 * save capability. My-Chat owns the protected local buffer and the
 * saving/saved/failed feedback — which is never a canonical draft, an authority
 * or a releasable revision. The short edit hold coordinates one editor and
 * pauses the scheduler; it is not a claim, an owner or a process state.
 */
export const SAVE_PUBLISH_PROCESS_DRAFT_CAPABILITY = {
  key: "save_publish_process_draft",
  version: "1.0.0",
} as const;

export const ACQUIRE_PUBLISH_EDIT_HOLD_CAPABILITY = {
  key: "acquire_publish_edit_hold",
  version: "1.0.0",
} as const;

export const RENEW_PUBLISH_EDIT_HOLD_CAPABILITY = {
  key: "renew_publish_edit_hold",
  version: "1.0.0",
} as const;

export const RELEASE_PUBLISH_EDIT_HOLD_CAPABILITY = {
  key: "release_publish_edit_hold",
  version: "1.0.0",
} as const;

export const CANCEL_PUBLISH_PROCESS_CAPABILITY = {
  key: "cancel_publish_process",
  version: "1.0.0",
} as const;

/** Short and renewable: an abandoned editor must not park a card indefinitely. */
export const DEFAULT_EDIT_HOLD_TTL_SECONDS = 120;
export const MAX_EDIT_HOLD_TTL_SECONDS = 600;

const MAX_TITLE_CHARS = 200;
const MAX_SEGMENT_CHARS = 2_000;
const MAX_SEGMENTS = 50;

const editableState = (state: PublishProcessStateV1): boolean =>
  state === "draft" || state === "needs_review" || state === "pending_release";

/**
 * Offline devices cannot reliably stop a server-side scheduled send, so editing
 * something already queued requires an online hold. New drafts and media that
 * never entered the queue may still be prepared offline.
 */
export const requiresOnlineEditHold = (state: PublishProcessStateV1): boolean =>
  state === "pending_release";

const actorEligible = (authority: CaregiverFactAuthorityV1): boolean =>
  CAREGIVER_BOARD_ROLES.includes(authority.role) &&
  authority.role_scope_type === "care_group" &&
  authority.role_scope_matches_source &&
  authority.role_assignment_current;

// ---------------------------------------------------------------------------
// Edit hold

export type PublishEditHoldFactsV1 = {
  process_state: PublishProcessStateV1;
  authority: CaregiverFactAuthorityV1;
  current_hold?: {
    holder_participant_id: string;
    holder_label: string;
    expires_at: string;
    /**
     * The head the `publish_edit_hold must_equal` binding compares against.
     * The owner never exposed one, so the contract required an equality no
     * prepare step could ever freeze.
     */
    hold_version: number;
  };
};

export type PublishEditHoldV1 = {
  processRef: string;
  expiresAt: string;
  ttlSeconds: number;
};

export type EditHoldDecisionV1 =
  | { status: "granted"; hold: PublishEditHoldV1 }
  | { status: "held_by_other"; holderLabel: string; expiresAt: string }
  | { status: "released" }
  | { status: "denied"; reason_code: string };

export type PublishEditHoldReadPort = {
  /**
   * The processes this actor may currently edit. A sealed ref resolves only
   * against this set, so a ref for a process the actor has lost access to
   * simply stops resolving.
   */
  listEditableProcessKeys(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<string[]>;
  loadEditHoldFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
  }): Promise<PublishEditHoldFactsV1 | null>;
};

export type PublishEditingDependencies = {
  integrity_key: string;
  reads: PublishEditHoldReadPort;
  now?: () => Date;
};

const resolveProcessKey = async (
  deps: { integrity_key: string; reads: PublishEditHoldReadPort },
  scope: BoardScopeV1,
  processRef: string,
): Promise<string | null> =>
  resolveBoardSealedRef(
    deps.integrity_key,
    scope,
    PUBLISH_PROCESS_TARGET_KIND,
    processRef,
    await deps.reads.listEditableProcessKeys(scope),
  );

const holdCurrent = (
  facts: PublishEditHoldFactsV1,
  now: Date,
): NonNullable<PublishEditHoldFactsV1["current_hold"]> | undefined => {
  const hold = facts.current_hold;
  if (!hold) return undefined;
  return new Date(hold.expires_at).getTime() > now.getTime() ? hold : undefined;
};

export const acquirePublishEditHold = async (
  deps: PublishEditingDependencies,
  scope: BoardScopeV1,
  request: { process_ref: string; ttl_seconds?: number },
): Promise<EditHoldDecisionV1> => {
  const ttlSeconds = request.ttl_seconds ?? DEFAULT_EDIT_HOLD_TTL_SECONDS;
  if (
    !Number.isSafeInteger(ttlSeconds) ||
    ttlSeconds < 1 ||
    ttlSeconds > MAX_EDIT_HOLD_TTL_SECONDS
  ) {
    return { status: "denied", reason_code: "invalid_hold_ttl" };
  }
  const processKey = await resolveProcessKey(deps, scope, request.process_ref);
  if (!processKey) return { status: "denied", reason_code: "target_unavailable" };
  const now = (deps.now ?? (() => new Date()))();
  const facts = await deps.reads.loadEditHoldFacts({ ...scope, process_key: processKey });
  if (!facts) return { status: "denied", reason_code: "target_unavailable" };
  // A hold never substitutes for authority: the class role is re-read here and
  // again on every action taken while holding it.
  if (!actorEligible(facts.authority)) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  if (!editableState(facts.process_state)) {
    return { status: "denied", reason_code: "process_not_editable" };
  }
  const current = holdCurrent(facts, now);
  if (current && current.holder_participant_id !== scope.participant_id) {
    // Display-safe only: another class teacher keeps read access and waits.
    return {
      status: "held_by_other",
      holderLabel: current.holder_label,
      expiresAt: current.expires_at,
    };
  }
  return {
    status: "granted",
    hold: {
      processRef: request.process_ref,
      expiresAt: new Date(now.getTime() + ttlSeconds * 1_000).toISOString(),
      ttlSeconds,
    },
  };
};

export const renewPublishEditHold = async (
  deps: PublishEditingDependencies,
  scope: BoardScopeV1,
  request: { process_ref: string; ttl_seconds?: number },
): Promise<EditHoldDecisionV1> => {
  const processKey = await resolveProcessKey(deps, scope, request.process_ref);
  if (!processKey) return { status: "denied", reason_code: "target_unavailable" };
  const now = (deps.now ?? (() => new Date()))();
  const facts = await deps.reads.loadEditHoldFacts({ ...scope, process_key: processKey });
  if (!facts) return { status: "denied", reason_code: "target_unavailable" };
  if (!actorEligible(facts.authority)) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  const current = holdCurrent(facts, now);
  // An expired hold is gone; it is renewed by acquiring a fresh one, so a stale
  // local buffer can never keep blocking the server.
  if (!current) return { status: "denied", reason_code: "hold_expired" };
  if (current.holder_participant_id !== scope.participant_id) {
    return {
      status: "held_by_other",
      holderLabel: current.holder_label,
      expiresAt: current.expires_at,
    };
  }
  return acquirePublishEditHold(deps, scope, request);
};

export const releasePublishEditHold = async (
  deps: PublishEditingDependencies,
  scope: BoardScopeV1,
  request: { process_ref: string },
): Promise<EditHoldDecisionV1> => {
  const processKey = await resolveProcessKey(deps, scope, request.process_ref);
  if (!processKey) return { status: "denied", reason_code: "target_unavailable" };
  const now = (deps.now ?? (() => new Date()))();
  const facts = await deps.reads.loadEditHoldFacts({ ...scope, process_key: processKey });
  if (!facts) return { status: "denied", reason_code: "target_unavailable" };
  if (!actorEligible(facts.authority)) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  const current = holdCurrent(facts, now);
  // Releasing an already-expired or absent hold is a no-op, not an error: the
  // next class teacher can take a fresh one either way.
  if (!current) return { status: "released" };
  if (current.holder_participant_id !== scope.participant_id) {
    return {
      status: "held_by_other",
      holderLabel: current.holder_label,
      expiresAt: current.expires_at,
    };
  }
  return { status: "released" };
};

// ---------------------------------------------------------------------------
// Autosave

export type DraftSegmentInputV1 = {
  text: string;
  /** Owner-issued capture ref when the segment still traces to a source. */
  sourceRef?: string;
};

export type SavePublishProcessDraftInputV1 = {
  title: string;
  segments: DraftSegmentInputV1[];
};

export const parseSavePublishProcessDraftInputV1 = (
  value: unknown,
):
  | { status: "ok"; input: SavePublishProcessDraftInputV1 }
  | { status: "invalid"; fields: string[] } => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { status: "invalid", fields: ["title", "segments"] };
  }
  const record = value as Record<string, unknown>;
  const unknown = Object.keys(record).filter((key) => !["title", "segments"].includes(key));
  if (unknown.length > 0) return { status: "invalid", fields: unknown };
  const fields: string[] = [];
  const title = typeof record.title === "string" ? record.title.trim() : "";
  if (title.length < 1 || title.length > MAX_TITLE_CHARS) fields.push("title");
  const rawSegments = record.segments;
  const segments: DraftSegmentInputV1[] = [];
  if (!Array.isArray(rawSegments) || rawSegments.length > MAX_SEGMENTS) {
    fields.push("segments");
  } else {
    for (const entry of rawSegments) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        fields.push("segments");
        break;
      }
      const segment = entry as Record<string, unknown>;
      const extra = Object.keys(segment).filter((key) => !["text", "sourceRef"].includes(key));
      const text = typeof segment.text === "string" ? segment.text : "";
      if (extra.length > 0 || text.length < 1 || text.length > MAX_SEGMENT_CHARS) {
        fields.push("segments");
        break;
      }
      if (segment.sourceRef !== undefined && typeof segment.sourceRef !== "string") {
        fields.push("segments");
        break;
      }
      segments.push({
        text,
        ...(typeof segment.sourceRef === "string" ? { sourceRef: segment.sourceRef } : {}),
      });
    }
  }
  if (fields.length > 0) return { status: "invalid", fields: [...new Set(fields)] };
  return { status: "ok", input: { title, segments } };
};

export type SavedDraftRevisionV1 = {
  processRef: string;
  revision: number;
  contentDigest: string;
  savedAt: string;
};

export type SaveDraftDecisionV1 =
  | { status: "saved"; result: SavedDraftRevisionV1 }
  | { status: "replayed"; result: SavedDraftRevisionV1 }
  | { status: "conflict"; currentRevision: number }
  | { status: "held_by_other"; holderLabel: string; expiresAt: string }
  | { status: "needs_input"; fields: string[] }
  | { status: "denied"; reason_code: string };

export type PublishDraftFactsV1 = PublishEditHoldFactsV1 & {
  current_revision: number;
  known_source_refs: string[];
  /** Set when this exact command identity already produced a revision. */
  replayed_revision?: { revision: number; content_digest: string; saved_at: string };
};

export type PublishDraftReadPort = {
  loadDraftFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
    command_request_id: string;
  }): Promise<PublishDraftFactsV1 | null>;
};

export const computeDraftContentDigest = (
  integrityKey: string,
  input: SavePublishProcessDraftInputV1,
): string =>
  createHmac("sha256", integrityKey)
    .update("nurture.publish-draft.v1\0", "utf8")
    .update(
      JSON.stringify([
        input.title,
        input.segments.map((segment) => [segment.text, segment.sourceRef ?? null]),
      ]),
      "utf8",
    )
    .digest("hex");

/**
 * One autosave. The revision head is the whole concurrency contract: an exact
 * match advances, an exact command replay returns the original revision, and
 * any drift is a conflict the client must refresh and reapply. There is no
 * last-write-wins branch and no local timestamp tiebreak.
 */
export const savePublishProcessDraft = async (
  deps: PublishEditingDependencies & { reads: PublishDraftReadPort & PublishEditHoldReadPort },
  scope: BoardScopeV1,
  request: {
    process_ref: string;
    command_request_id: string;
    expected_draft_revision: number;
    operation_input: unknown;
  },
): Promise<SaveDraftDecisionV1> => {
  const parsed = parseSavePublishProcessDraftInputV1(request.operation_input);
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };
  const processKey = await resolveProcessKey(deps, scope, request.process_ref);
  if (!processKey) return { status: "denied", reason_code: "target_unavailable" };
  if (
    !Number.isSafeInteger(request.expected_draft_revision) ||
    // A process with no saved revision reports `current_revision: 0`, and the
    // save that creates revision 1 must be able to say so. Rejecting 0 left
    // that process with no satisfiable input at all.
    request.expected_draft_revision < 0
  ) {
    return { status: "denied", reason_code: "invalid_expected_revision" };
  }

  const now = (deps.now ?? (() => new Date()))();
  const facts = await deps.reads.loadDraftFacts({
    ...scope,
    process_key: processKey,
    command_request_id: request.command_request_id,
  });
  if (!facts) return { status: "denied", reason_code: "target_unavailable" };
  if (!actorEligible(facts.authority)) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  if (!editableState(facts.process_state)) {
    // A released or cancelled process is never edited in place.
    return { status: "denied", reason_code: "process_not_editable" };
  }

  const current = holdCurrent(facts, now);
  if (current && current.holder_participant_id !== scope.participant_id) {
    return {
      status: "held_by_other",
      holderLabel: current.holder_label,
      expiresAt: current.expires_at,
    };
  }
  if (requiresOnlineEditHold(facts.process_state) && !current) {
    return { status: "denied", reason_code: "edit_hold_required" };
  }

  // Every retained source ref must still be one the owner issued for this
  // process; an unknown ref would fabricate provenance.
  const known = new Set(facts.known_source_refs);
  if (parsed.input.segments.some((segment) => segment.sourceRef && !known.has(segment.sourceRef))) {
    return { status: "denied", reason_code: "unknown_source_ref" };
  }

  const contentDigest = computeDraftContentDigest(deps.integrity_key, parsed.input);
  if (facts.replayed_revision) {
    if (facts.replayed_revision.content_digest !== contentDigest) {
      // Same command identity, different canonical payload: a conflict, never a
      // silent second write.
      return { status: "conflict", currentRevision: facts.current_revision };
    }
    return {
      status: "replayed",
      result: {
        processRef: request.process_ref,
        revision: facts.replayed_revision.revision,
        contentDigest,
        savedAt: facts.replayed_revision.saved_at,
      },
    };
  }
  if (facts.current_revision !== request.expected_draft_revision) {
    return { status: "conflict", currentRevision: facts.current_revision };
  }

  return {
    status: "saved",
    result: {
      processRef: request.process_ref,
      revision: facts.current_revision + 1,
      contentDigest,
      savedAt: now.toISOString(),
    },
  };
};

// ---------------------------------------------------------------------------
// Pre-release cancel

export type CancelPublishProcessDecisionV1 =
  | { status: "cancelled"; processRef: string; cancelledAt: string; auditRef: string }
  | { status: "already_satisfied"; processRef: string }
  | { status: "denied"; reason_code: string };

export type PublishCancelFactsV1 = PublishEditHoldFactsV1 & {
  /** Any committed per-target release closes the pre-release cancel window. */
  committed_release_count: number;
};

export type PublishCancelReadPort = {
  loadCancelFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
  }): Promise<PublishCancelFactsV1 | null>;
};

export const cancelPublishProcess = async (
  deps: PublishEditingDependencies & { reads: PublishCancelReadPort },
  scope: BoardScopeV1,
  request: { process_ref: string },
): Promise<CancelPublishProcessDecisionV1> => {
  const processKey = await resolveProcessKey(deps, scope, request.process_ref);
  if (!processKey) return { status: "denied", reason_code: "target_unavailable" };
  const now = (deps.now ?? (() => new Date()))();
  const facts = await deps.reads.loadCancelFacts({ ...scope, process_key: processKey });
  if (!facts) return { status: "denied", reason_code: "target_unavailable" };
  // Shared class responsibility: any current class teacher may cancel, not just
  // whoever created the card.
  if (!actorEligible(facts.authority)) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  if (facts.process_state === "cancelled") {
    return { status: "already_satisfied", processRef: request.process_ref };
  }
  if (facts.committed_release_count > 0 || facts.process_state === "released") {
    // Cancel is only legal before any target has committed; afterwards the
    // remedy is a post-release safety action, not a rollback.
    return { status: "denied", reason_code: "already_released" };
  }
  if (!isLegalPublishProcessTransition(facts.process_state, "cancelled")) {
    return { status: "denied", reason_code: "illegal_transition" };
  }
  return {
    status: "cancelled",
    processRef: request.process_ref,
    cancelledAt: now.toISOString(),
    auditRef: issueBoardOpaqueRef(deps.integrity_key, scope, "publish_cancel", processKey),
  };
};
