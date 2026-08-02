import { createHmac, randomUUID } from "node:crypto";
import type {
  NurtureCommandExecutionContext,
  NurtureCommandSpec,
} from "../domain/commands/command-kernel.js";
import type { NurtureInteractionContextService } from "../domain/interactions/interaction-context.js";
import type {
  NurtureCaregiverWriteAuthority,
  NurturePublishProcessCancelFacts,
} from "../domain/institution/publish-process-transaction.js";
import {
  CAREGIVER_BOARD_ROLES,
  issueBoardOpaqueRef,
  issueBoardSealedRef,
  resolveBoardSealedRef,
  type BoardScopeV1,
  type CaregiverFactAuthorityV1,
} from "./board-projection.js";
import { createBoardWriteSpec } from "./board-write-spec.js";
import {
  computeHarnessInputIntegrityTag,
  issueHarnessConfirmation,
} from "./confirmation.js";
import {
  PUBLISH_PROCESS_TARGET_KIND,
  isLegalPublishProcessTransition,
  isPublishProcessState,
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

/**
 * Takes the owner-write authority shape, so the prepare step (which reads
 * through the query port) and the execute step (which re-reads through the
 * command transaction port) run the same predicate rather than two copies of
 * the same sentence.
 */
const actorEligible = (authority: NurtureCaregiverWriteAuthority): boolean =>
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

export type CancelledPublishProcessV1 = {
  processRef: string;
  cancelledAt: string;
  auditRef: string;
};

export type CancelPublishProcessDecisionV1 =
  | ({ status: "cancelled" } & CancelledPublishProcessV1)
  | ({ status: "already_satisfied" } & CancelledPublishProcessV1)
  | { status: "denied"; reason_code: string };

export type PublishCancelFactsV1 = PublishEditHoldFactsV1 & {
  /** Any committed per-target release closes the pre-release cancel window. */
  committed_release_count: number;
  /** The head the pre-release cancel freezes at prepare and writes against. */
  process_version: number;
  /**
   * Present exactly while the process is already cancelled. It is the instant
   * the owner recorded, so an idempotent repeat answers from the stored fact
   * instead of inventing one.
   */
  cancelled_at?: string;
};

export type PublishCancelReadPort = {
  loadCancelFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
  }): Promise<PublishCancelFactsV1 | null>;
};

/**
 * The cancel rule over one already-loaded owner answer. Prepare and execute both
 * call this, so a decision that is legal at prepare and a decision that is legal
 * inside the write transaction are the same sentence rather than two.
 */
export const evaluatePublishProcessCancel = (
  deps: { integrity_key: string },
  scope: BoardScopeV1,
  request: {
    process_ref: string;
    process_key: string;
    /**
     * The minimum both sides can supply: the query port's `PublishCancelFactsV1`
     * and the command transaction's `NurturePublishProcessCancelFacts` are both
     * assignable here, so neither side can answer this rule with its own copy.
     */
    facts: {
      authority: NurtureCaregiverWriteAuthority;
      process_state: string;
      committed_release_count: number;
      cancelled_at?: string;
    };
    now: Date;
  },
): CancelPublishProcessDecisionV1 => {
  const facts = request.facts;
  // Derived from the process key alone, so the repeat of an already-cancelled
  // process names the same audit handle the first cancel did.
  const auditRef = issueBoardOpaqueRef(
    deps.integrity_key,
    scope,
    "publish_cancel",
    request.process_key,
  );
  // Shared class responsibility: any current class teacher may cancel, not just
  // whoever created the card.
  if (!actorEligible(facts.authority)) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  if (facts.process_state === "cancelled") {
    // The owner has to be able to say *when*. Without the recorded instant this
    // capability would have to invent one, and a repeat would report a cancel
    // that never happened at the moment it claims.
    return facts.cancelled_at
      ? {
          status: "already_satisfied",
          processRef: request.process_ref,
          cancelledAt: facts.cancelled_at,
          auditRef,
        }
      : { status: "denied", reason_code: "cancel_evidence_unavailable" };
  }
  if (facts.committed_release_count > 0 || facts.process_state === "released") {
    // Cancel is only legal before any target has committed; afterwards the
    // remedy is a post-release safety action, not a rollback.
    return { status: "denied", reason_code: "already_released" };
  }
  if (
    !isPublishProcessState(facts.process_state) ||
    !isLegalPublishProcessTransition(facts.process_state, "cancelled")
  ) {
    return { status: "denied", reason_code: "illegal_transition" };
  }
  return {
    status: "cancelled",
    processRef: request.process_ref,
    cancelledAt: request.now.toISOString(),
    auditRef,
  };
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
  return evaluatePublishProcessCancel(deps, scope, {
    process_ref: request.process_ref,
    process_key: processKey,
    facts,
    now,
  });
};

// ---------------------------------------------------------------------------
// cancel_publish_process: prepare and the owner-write command

export const CANCEL_PUBLISH_PROCESS_COMMAND_SCOPE = "publish_process_cancel";

/** The frozen contract input is empty: the target is the owner-issued ref. */
export const parseCancelPublishProcessInputV1 = (
  value: unknown,
): { status: "ok" } | { status: "invalid"; fields: string[] } =>
  value === undefined ||
  (Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as object).length === 0)
    ? { status: "ok" }
    : { status: "invalid", fields: ["operation_input"] };

export type CancelPublishProcessCommandV1 = {
  process_key: string;
  expected_process_version: number;
};

export const canonicalizeCancelPublishProcessCommand = (
  input: CancelPublishProcessCommandV1,
): unknown => ({
  process_key: input.process_key,
  expected_process_version: input.expected_process_version,
});

export type CancelPublishProcessPrepareDecision =
  | {
      status: "ready_to_confirm";
      preview: Record<string, string | number>;
      confirmation_ref: string;
      expires_at: string;
      command_request_id: string;
    }
  | { status: "needs_input"; fields: string[] }
  | { status: "denied"; reason_code: string };

/**
 * Prepare only reads. It resolves the owner-issued process ref against the set
 * the owner would currently accept a cancel for, re-runs the cancel rule and
 * freezes the process head. The write itself happens inside the command
 * transaction, against a fresh read of the same owner.
 */
export const preparePublishProcessCancel = async (
  deps: PublishEditingDependencies & {
    reads: PublishCancelReadPort;
    contexts: NurtureInteractionContextService;
    create_command_id?: () => string;
  },
  request: BoardScopeV1 & {
    surface: string;
    host_conversation_ref?: string;
    operation_input?: unknown;
    target_option_ref?: string;
  },
): Promise<CancelPublishProcessPrepareDecision> => {
  if (parseCancelPublishProcessInputV1(request.operation_input).status === "invalid") {
    return { status: "needs_input", fields: ["operation_input"] };
  }
  if (!request.target_option_ref) return { status: "needs_input", fields: ["target"] };
  const scope: BoardScopeV1 = {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
  };
  const processKey = await resolveProcessKey(deps, scope, request.target_option_ref);
  if (!processKey) return { status: "denied", reason_code: "target_unavailable" };
  const facts = await deps.reads.loadCancelFacts({ ...scope, process_key: processKey });
  if (!facts) return { status: "denied", reason_code: "target_unavailable" };

  const decision = evaluatePublishProcessCancel(deps, scope, {
    process_ref: request.target_option_ref,
    process_key: processKey,
    facts,
    now: (deps.now ?? (() => new Date()))(),
  });
  if (decision.status === "denied") return decision;

  const command: CancelPublishProcessCommandV1 = {
    process_key: processKey,
    expected_process_version: facts.process_version,
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
      capability_key: CANCEL_PUBLISH_PROCESS_CAPABILITY.key,
      capability_version: CANCEL_PUBLISH_PROCESS_CAPABILITY.version,
      command_request_id: commandRequestId,
      target_refs: { publish_process: processKey },
      expected_heads: { publish_process: command.expected_process_version },
      input_integrity_tag: computeHarnessInputIntegrityTag(
        deps.integrity_key,
        canonicalizeCancelPublishProcessCommand(command),
      ),
      integrity_tag_version: 1,
    },
  });
  return {
    status: "ready_to_confirm",
    preview: {
      // Already-cancelled is a legal, idempotent outcome, and the preview says
      // so rather than presenting it as a fresh cancel.
      effect: decision.status === "cancelled" ? "cancel_publish_process" : "already_cancelled",
      state: decision.status === "cancelled" ? facts.process_state : "cancelled",
    },
    confirmation_ref: issued.token,
    expires_at: issued.expires_at,
    command_request_id: commandRequestId,
  };
};

export const createCancelPublishProcessSpec = (deps: {
  integrity_key: string;
  now?: () => Date;
}): NurtureCommandSpec<CancelPublishProcessCommandV1> =>
  createBoardWriteSpec({
    capability: CANCEL_PUBLISH_PROCESS_CAPABILITY,
    command_scope: CANCEL_PUBLISH_PROCESS_COMMAND_SCOPE,
    contract_version: 1,
    result_schema_version: 1,
    canonicalize: canonicalizeCancelPublishProcessCommand,
    port: {
      select: (transaction) => transaction.publishProcess,
      unavailable_reason_code: "publish_process_port_unavailable",
    },
    revalidateInput: (input) =>
      input.process_key.length > 0 &&
      Number.isSafeInteger(input.expected_process_version) &&
      input.expected_process_version >= 0
        ? null
        : { status: "invalid", reason_code: "invalid_cancel_input" },
    loadFacts: (owner, input, context) =>
      owner.loadPublishProcessCancelFacts({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        process_key: input.process_key,
      }),
    facts_absent_reason_code: "target_unavailable",
    // The same rule prepare ran, over the owner answer read inside the write
    // transaction. A denial here is owner state refusing the write, never a
    // shape problem, so every branch is `blocked`.
    authorize: (facts, input, context) => {
      const decision = evaluatePublishProcessCancel(
        deps,
        commandScope(context),
        cancelRequest(deps, context, input.process_key, facts),
      );
      if (decision.status === "denied") {
        return { status: "blocked", reason_code: decision.reason_code };
      }
      if (decision.status === "already_satisfied") {
        return {
          status: "already_satisfied",
          effect: {
            output_refs: [facts.publish_process_ref],
            committed_result: cancelledResult(decision),
          },
        };
      }
      return { status: "authorized", write: {} };
    },
    expectedHeads: (input) => ({ publish_process: input.expected_process_version }),
    currentHeads: (facts) => ({ publish_process: facts.process_version }),
    apply: async (owner, input, context) => {
      const scope = commandScope(context);
      const applied = await owner.applyPublishProcessCancel({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        process_key: input.process_key,
        expected_process_version: input.expected_process_version,
        cancelled_at: (deps.now ?? (() => new Date()))().toISOString(),
      });
      return {
        output_refs: [applied.publish_process_ref],
        committed_result: cancelledResult({
          processRef: issueBoardSealedRef(
            deps.integrity_key,
            scope,
            PUBLISH_PROCESS_TARGET_KIND,
            input.process_key,
          ),
          // The instant the owner stored, not the one this process computed.
          cancelledAt: applied.cancelled_at,
          auditRef: issueBoardOpaqueRef(
            deps.integrity_key,
            scope,
            "publish_cancel",
            input.process_key,
          ),
        }),
      };
    },
  });

const commandScope = (context: NurtureCommandExecutionContext): BoardScopeV1 => ({
  workspace_id: context.workspace_id,
  participant_id: context.business_actor_ref,
});

const cancelRequest = (
  deps: { integrity_key: string; now?: () => Date },
  context: NurtureCommandExecutionContext,
  processKey: string,
  facts: NurturePublishProcessCancelFacts,
) => ({
  // Reproduces the exact sealed ref the caller was given, from the owner key.
  process_ref: issueBoardSealedRef(
    deps.integrity_key,
    commandScope(context),
    PUBLISH_PROCESS_TARGET_KIND,
    processKey,
  ),
  process_key: processKey,
  facts,
  now: (deps.now ?? (() => new Date()))(),
});

const cancelledResult = (decision: CancelledPublishProcessV1): CancelledPublishProcessV1 => ({
  processRef: decision.processRef,
  cancelledAt: decision.cancelledAt,
  auditRef: decision.auditRef,
});
