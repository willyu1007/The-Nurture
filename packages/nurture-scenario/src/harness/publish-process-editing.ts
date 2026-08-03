import { createHmac, randomUUID } from "node:crypto";
import type {
  NurtureCommandExecutionContext,
  NurtureCommandSpec,
} from "../domain/commands/command-kernel.js";
import type { NurtureInteractionContextService } from "../domain/interactions/interaction-context.js";
import type { ProtectedContentWritePort } from "./protected-content.js";
import {
  NO_PUBLISH_EDIT_HOLD_VERSION,
  type NurtureCaregiverWriteAuthority,
  type NurturePublishDraftFacts,
  type NurturePublishEditHoldFacts,
  type NurturePublishProcessCancelFacts,
  type NurturePublishProcessTransaction,
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

export type PublishEditHoldStateV1 = {
  holder_participant_id: string;
  holder_label: string;
  expires_at: string;
  /**
   * The head the `publish_edit_hold must_equal` binding compares against.
   * The owner never exposed one, so the contract required an equality no
   * prepare step could ever freeze. `0` is reserved for "no live hold" — see
   * `NO_PUBLISH_EDIT_HOLD_VERSION`.
   */
  hold_version: number;
};

/**
 * The minimum the hold rules need. The query port's `PublishEditHoldFactsV1`
 * and the command transaction's `NurturePublishEditHoldFacts` are both
 * assignable here, so prepare and execute cannot answer the same rule with two
 * copies of it.
 */
export type PublishEditHoldRuleFactsV1 = {
  authority: NurtureCaregiverWriteAuthority;
  process_state: string;
  current_hold?: PublishEditHoldStateV1;
};

export type PublishEditHoldFactsV1 = {
  process_state: PublishProcessStateV1;
  authority: CaregiverFactAuthorityV1;
  current_hold?: PublishEditHoldStateV1;
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

/**
 * The hold as it stands at one instant. An expired hold is no hold — it is
 * never renewed implicitly by being read — so this is the only way any rule,
 * prepare step or write asks whether a process is held.
 */
export const currentPublishEditHold = (
  facts: Pick<PublishEditHoldRuleFactsV1, "current_hold">,
  now: Date,
): PublishEditHoldStateV1 | undefined => {
  const hold = facts.current_hold;
  if (!hold) return undefined;
  return new Date(hold.expires_at).getTime() > now.getTime() ? hold : undefined;
};

export const parseEditHoldTtlSeconds = (
  value: unknown,
): { status: "ok"; ttl_seconds: number } | { status: "invalid" } => {
  const ttlSeconds = value ?? DEFAULT_EDIT_HOLD_TTL_SECONDS;
  return Number.isSafeInteger(ttlSeconds) &&
    (ttlSeconds as number) >= 1 &&
    (ttlSeconds as number) <= MAX_EDIT_HOLD_TTL_SECONDS
    ? { status: "ok", ttl_seconds: ttlSeconds as number }
    : { status: "invalid" };
};

type HoldRuleRequest = {
  process_ref: string;
  facts: PublishEditHoldRuleFactsV1;
  ttl_seconds?: number;
  now: Date;
};

const heldByOther = (hold: PublishEditHoldStateV1): EditHoldDecisionV1 => ({
  // Display-safe only: another class teacher keeps read access and waits.
  status: "held_by_other",
  holderLabel: hold.holder_label,
  expiresAt: hold.expires_at,
});

export const evaluatePublishEditHoldAcquire = (
  scope: BoardScopeV1,
  request: HoldRuleRequest,
): EditHoldDecisionV1 => {
  const ttl = parseEditHoldTtlSeconds(request.ttl_seconds);
  if (ttl.status === "invalid") return { status: "denied", reason_code: "invalid_hold_ttl" };
  const facts = request.facts;
  // A hold never substitutes for authority: the class role is re-read here and
  // again on every action taken while holding it.
  if (!actorEligible(facts.authority)) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  if (!isPublishProcessState(facts.process_state) || !editableState(facts.process_state)) {
    return { status: "denied", reason_code: "process_not_editable" };
  }
  const current = currentPublishEditHold(facts, request.now);
  if (current && current.holder_participant_id !== scope.participant_id) {
    return heldByOther(current);
  }
  return {
    status: "granted",
    hold: {
      processRef: request.process_ref,
      expiresAt: new Date(request.now.getTime() + ttl.ttl_seconds * 1_000).toISOString(),
      ttlSeconds: ttl.ttl_seconds,
    },
  };
};

export const evaluatePublishEditHoldRenew = (
  scope: BoardScopeV1,
  request: HoldRuleRequest,
): EditHoldDecisionV1 => {
  const facts = request.facts;
  if (!actorEligible(facts.authority)) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  const current = currentPublishEditHold(facts, request.now);
  // An expired hold is gone; it is renewed by acquiring a fresh one, so a stale
  // local buffer can never keep blocking the server.
  if (!current) return { status: "denied", reason_code: "hold_expired" };
  if (current.holder_participant_id !== scope.participant_id) return heldByOther(current);
  return evaluatePublishEditHoldAcquire(scope, request);
};

export const evaluatePublishEditHoldRelease = (
  scope: BoardScopeV1,
  request: Omit<HoldRuleRequest, "ttl_seconds">,
): EditHoldDecisionV1 => {
  const facts = request.facts;
  if (!actorEligible(facts.authority)) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  const current = currentPublishEditHold(facts, request.now);
  // Releasing an already-expired or absent hold is a no-op, not an error: the
  // next class teacher can take a fresh one either way.
  if (!current) return { status: "released" };
  if (current.holder_participant_id !== scope.participant_id) return heldByOther(current);
  return { status: "released" };
};

const loadHoldRuleRequest = async (
  deps: PublishEditingDependencies,
  scope: BoardScopeV1,
  request: { process_ref: string; ttl_seconds?: number },
): Promise<HoldRuleRequest | { status: "denied"; reason_code: string }> => {
  const processKey = await resolveProcessKey(deps, scope, request.process_ref);
  if (!processKey) return { status: "denied", reason_code: "target_unavailable" };
  const facts = await deps.reads.loadEditHoldFacts({ ...scope, process_key: processKey });
  if (!facts) return { status: "denied", reason_code: "target_unavailable" };
  return {
    process_ref: request.process_ref,
    facts,
    ...(request.ttl_seconds !== undefined ? { ttl_seconds: request.ttl_seconds } : {}),
    now: (deps.now ?? (() => new Date()))(),
  };
};

export const acquirePublishEditHold = async (
  deps: PublishEditingDependencies,
  scope: BoardScopeV1,
  request: { process_ref: string; ttl_seconds?: number },
): Promise<EditHoldDecisionV1> => {
  // The TTL is rejected before anything is read: an out-of-range hold is a
  // caller mistake, not a fact about the process.
  if (parseEditHoldTtlSeconds(request.ttl_seconds).status === "invalid") {
    return { status: "denied", reason_code: "invalid_hold_ttl" };
  }
  const loaded = await loadHoldRuleRequest(deps, scope, request);
  return "status" in loaded ? loaded : evaluatePublishEditHoldAcquire(scope, loaded);
};

export const renewPublishEditHold = async (
  deps: PublishEditingDependencies,
  scope: BoardScopeV1,
  request: { process_ref: string; ttl_seconds?: number },
): Promise<EditHoldDecisionV1> => {
  const loaded = await loadHoldRuleRequest(deps, scope, request);
  return "status" in loaded ? loaded : evaluatePublishEditHoldRenew(scope, loaded);
};

export const releasePublishEditHold = async (
  deps: PublishEditingDependencies,
  scope: BoardScopeV1,
  request: { process_ref: string },
): Promise<EditHoldDecisionV1> => {
  const loaded = await loadHoldRuleRequest(deps, scope, request);
  return "status" in loaded ? loaded : evaluatePublishEditHoldRelease(scope, loaded);
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

export type PublishDraftRuleFactsV1 = PublishEditHoldRuleFactsV1 & {
  current_revision: number;
  known_source_refs: string[];
  /** Set when this exact command identity already produced a revision. */
  replayed_revision?: { revision: number; content_digest: string; saved_at: string };
};

export type PublishDraftFactsV1 = PublishEditHoldFactsV1 & {
  current_revision: number;
  known_source_refs: string[];
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
 * One autosave, over one already-loaded owner answer. The revision head is the
 * whole concurrency contract: an exact match advances, an exact command replay
 * returns the original revision, and any drift is a conflict the client must
 * refresh and reapply. There is no last-write-wins branch and no local
 * timestamp tiebreak.
 *
 * Prepare and execute both call this, so what is legal at prepare and what is
 * legal inside the write transaction are the same sentence rather than two.
 */
export const evaluatePublishProcessDraftSave = (
  deps: { integrity_key: string },
  scope: BoardScopeV1,
  request: {
    process_ref: string;
    input: SavePublishProcessDraftInputV1;
    expected_draft_revision: number;
    facts: PublishDraftRuleFactsV1;
    now: Date;
  },
): SaveDraftDecisionV1 => {
  const facts = request.facts;
  if (
    !Number.isSafeInteger(request.expected_draft_revision) ||
    // A process with no saved revision reports `current_revision: 0`, and the
    // save that creates revision 1 must be able to say so. Rejecting 0 left
    // that process with no satisfiable input at all.
    request.expected_draft_revision < 0
  ) {
    return { status: "denied", reason_code: "invalid_expected_revision" };
  }
  if (!actorEligible(facts.authority)) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  if (!isPublishProcessState(facts.process_state) || !editableState(facts.process_state)) {
    // A released or cancelled process is never edited in place.
    return { status: "denied", reason_code: "process_not_editable" };
  }

  const current = currentPublishEditHold(facts, request.now);
  if (current && current.holder_participant_id !== scope.participant_id) {
    return heldByOther(current) as SaveDraftDecisionV1;
  }
  if (requiresOnlineEditHold(facts.process_state) && !current) {
    return { status: "denied", reason_code: "edit_hold_required" };
  }

  // Every retained source ref must still be one the owner issued for this
  // process; an unknown ref would fabricate provenance.
  const known = new Set(facts.known_source_refs);
  if (request.input.segments.some((segment) => segment.sourceRef && !known.has(segment.sourceRef))) {
    return { status: "denied", reason_code: "unknown_source_ref" };
  }

  const contentDigest = computeDraftContentDigest(deps.integrity_key, request.input);
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
      savedAt: request.now.toISOString(),
    },
  };
};

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
  const facts = await deps.reads.loadDraftFacts({
    ...scope,
    process_key: processKey,
    command_request_id: request.command_request_id,
  });
  if (!facts) return { status: "denied", reason_code: "target_unavailable" };
  return evaluatePublishProcessDraftSave(deps, scope, {
    process_ref: request.process_ref,
    input: parsed.input,
    expected_draft_revision: request.expected_draft_revision,
    facts,
    now: (deps.now ?? (() => new Date()))(),
  });
};

// ---------------------------------------------------------------------------
// The edit lane commands: three hold transitions and one autosave.
//
// All four resolve the sealed process ref against the set the owner would
// currently accept an edit for, run the rule over one owner read, and freeze the
// head the write is checked against.

export const ACQUIRE_PUBLISH_EDIT_HOLD_COMMAND_SCOPE = "publish_edit_hold_acquire";
export const RENEW_PUBLISH_EDIT_HOLD_COMMAND_SCOPE = "publish_edit_hold_renew";
export const RELEASE_PUBLISH_EDIT_HOLD_COMMAND_SCOPE = "publish_edit_hold_release";
export const SAVE_PUBLISH_PROCESS_DRAFT_COMMAND_SCOPE = "publish_process_draft";

export type EditLanePrepareDecision =
  | {
      status: "ready_to_confirm";
      preview: Record<string, string | number>;
      confirmation_ref: string;
      expires_at: string;
      command_request_id: string;
    }
  | { status: "needs_input"; fields: string[] }
  | { status: "denied"; reason_code: string };

/** The frozen hold input: an optional TTL and nothing else. */
export const parsePublishEditHoldInputV1 = (
  value: unknown,
): { status: "ok"; ttl_seconds?: number } | { status: "invalid"; fields: string[] } => {
  if (value === undefined) return { status: "ok" };
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { status: "invalid", fields: ["operation_input"] };
  }
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== "ttlSeconds")) {
    return { status: "invalid", fields: ["operation_input"] };
  }
  if (record.ttlSeconds === undefined) return { status: "ok" };
  const parsed = parseEditHoldTtlSeconds(record.ttlSeconds);
  return parsed.status === "ok"
    ? { status: "ok", ttl_seconds: parsed.ttl_seconds }
    : { status: "invalid", fields: ["ttlSeconds"] };
};

/**
 * One command shape for all three transitions. Release simply carries no TTL,
 * and the canonical form drops it, so the three still hash differently: the
 * command key and scope are part of the payload identity.
 */
export type PublishEditHoldCommandV1 = {
  process_key: string;
  expected_hold_version: number;
  ttl_seconds?: number;
};

export const canonicalizePublishEditHoldCommand = (
  input: PublishEditHoldCommandV1,
): unknown => ({
  process_key: input.process_key,
  expected_hold_version: input.expected_hold_version,
  ...(input.ttl_seconds !== undefined ? { ttl_seconds: input.ttl_seconds } : {}),
});

/**
 * The head the write is checked against. `0` is the reserved absence value, so
 * "there was no hold when I prepared" and "there was a hold" are different
 * frozen values rather than the same one.
 */
const frozenHoldVersion = (facts: PublishEditHoldRuleFactsV1, at: Date): number =>
  currentPublishEditHold(facts, at)?.hold_version ?? NO_PUBLISH_EDIT_HOLD_VERSION;

/** Every hold decision that is not a write is a refusal the caller can act on. */
const holdRefusalReason = (decision: EditHoldDecisionV1): string | null => {
  if (decision.status === "denied") return decision.reason_code;
  // The holder label and expiry stay on the queue projection. The refusal
  // envelope carries a reason code and has nowhere to put a colleague's name.
  if (decision.status === "held_by_other") return "held_by_other";
  return null;
};

type EditLanePrepareDeps = PublishEditingDependencies & {
  contexts: NurtureInteractionContextService;
  create_command_id?: () => string;
};

type EditLanePrepareRequest = BoardScopeV1 & {
  surface: string;
  host_conversation_ref?: string;
  operation_input?: unknown;
  target_option_ref?: string;
};

const issueEditLaneConfirmation = async (
  deps: EditLanePrepareDeps,
  request: EditLanePrepareRequest,
  issue: {
    capability: { key: string; version: string };
    process_key: string;
    expected_heads: Record<string, number>;
    canonical_command: unknown;
    preview: Record<string, string | number>;
  },
): Promise<EditLanePrepareDecision> => {
  const commandRequestId = (deps.create_command_id ?? (() => `command:${randomUUID()}`))();
  const issued = await issueHarnessConfirmation(deps.contexts, {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    surface: request.surface,
    ...(request.host_conversation_ref
      ? { host_conversation_ref: request.host_conversation_ref }
      : {}),
    payload: {
      capability_key: issue.capability.key,
      capability_version: issue.capability.version,
      command_request_id: commandRequestId,
      target_refs: { publish_process: issue.process_key },
      expected_heads: issue.expected_heads,
      input_integrity_tag: computeHarnessInputIntegrityTag(
        deps.integrity_key,
        issue.canonical_command,
      ),
      integrity_tag_version: 1,
    },
  });
  return {
    status: "ready_to_confirm",
    preview: issue.preview,
    confirmation_ref: issued.token,
    expires_at: issued.expires_at,
    command_request_id: commandRequestId,
  };
};

const prepareHoldTransition = async (
  deps: EditLanePrepareDeps,
  request: EditLanePrepareRequest,
  transition: {
    capability: { key: string; version: string };
    evaluate(scope: BoardScopeV1, ruleRequest: HoldRuleRequest): EditHoldDecisionV1;
    carries_ttl: boolean;
  },
): Promise<EditLanePrepareDecision> => {
  const parsed = transition.carries_ttl
    ? parsePublishEditHoldInputV1(request.operation_input)
    : ({
        ...(isEmptyEditLaneInput(request.operation_input)
          ? { status: "ok" as const }
          : { status: "invalid" as const, fields: ["operation_input"] }),
      } as ReturnType<typeof parsePublishEditHoldInputV1>);
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };
  if (!request.target_option_ref) return { status: "needs_input", fields: ["target"] };

  const scope: BoardScopeV1 = {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
  };
  const processKey = await resolveProcessKey(deps, scope, request.target_option_ref);
  if (!processKey) return { status: "denied", reason_code: "target_unavailable" };
  const facts = await deps.reads.loadEditHoldFacts({ ...scope, process_key: processKey });
  if (!facts) return { status: "denied", reason_code: "target_unavailable" };

  // One instant for the whole evaluation: the expiry that decides the frozen
  // head is the same expiry the rule answered on.
  const at = (deps.now ?? (() => new Date()))();
  const ruleRequest: HoldRuleRequest = {
    process_ref: request.target_option_ref,
    facts,
    ...(parsed.ttl_seconds !== undefined ? { ttl_seconds: parsed.ttl_seconds } : {}),
    now: at,
  };
  const decision = transition.evaluate(scope, ruleRequest);
  const refused = holdRefusalReason(decision);
  if (refused) return { status: "denied", reason_code: refused };

  const command: PublishEditHoldCommandV1 = {
    process_key: processKey,
    expected_hold_version: frozenHoldVersion(facts, at),
    ...(transition.carries_ttl
      ? {
          ttl_seconds:
            decision.status === "granted"
              ? decision.hold.ttlSeconds
              : DEFAULT_EDIT_HOLD_TTL_SECONDS,
        }
      : {}),
  };
  return issueEditLaneConfirmation(deps, request, {
    capability: transition.capability,
    process_key: processKey,
    expected_heads: { publish_edit_hold: command.expected_hold_version },
    canonical_command: canonicalizePublishEditHoldCommand(command),
    preview:
      decision.status === "granted"
        ? {
            effect: transition.capability.key,
            ttl_seconds: decision.hold.ttlSeconds,
            expires_at: decision.hold.expiresAt,
          }
        : // Releasing a hold nobody holds is legal and idempotent; the preview
          // says so instead of promising a release that has nothing to release.
          { effect: transition.capability.key },
  });
};

const isEmptyEditLaneInput = (value: unknown): boolean =>
  value === undefined ||
  (Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as object).length === 0);

export const prepareAcquirePublishEditHold = (
  deps: EditLanePrepareDeps,
  request: EditLanePrepareRequest,
): Promise<EditLanePrepareDecision> =>
  prepareHoldTransition(deps, request, {
    capability: ACQUIRE_PUBLISH_EDIT_HOLD_CAPABILITY,
    evaluate: evaluatePublishEditHoldAcquire,
    carries_ttl: true,
  });

export const prepareRenewPublishEditHold = (
  deps: EditLanePrepareDeps,
  request: EditLanePrepareRequest,
): Promise<EditLanePrepareDecision> =>
  prepareHoldTransition(deps, request, {
    capability: RENEW_PUBLISH_EDIT_HOLD_CAPABILITY,
    evaluate: evaluatePublishEditHoldRenew,
    carries_ttl: true,
  });

export const prepareReleasePublishEditHold = (
  deps: EditLanePrepareDeps,
  request: EditLanePrepareRequest,
): Promise<EditLanePrepareDecision> =>
  prepareHoldTransition(deps, request, {
    capability: RELEASE_PUBLISH_EDIT_HOLD_CAPABILITY,
    evaluate: evaluatePublishEditHoldRelease,
    carries_ttl: false,
  });

// ---------------------------------------------------------------------------
// The three hold commands.

const holdCommandScope = (context: NurtureCommandExecutionContext): BoardScopeV1 => ({
  workspace_id: context.workspace_id,
  participant_id: context.business_actor_ref,
});

const holdRuleRequestFrom = (
  deps: { integrity_key: string },
  context: NurtureCommandExecutionContext,
  input: PublishEditHoldCommandV1,
  facts: NurturePublishEditHoldFacts,
): HoldRuleRequest => ({
  process_ref: issueBoardSealedRef(
    deps.integrity_key,
    holdCommandScope(context),
    PUBLISH_PROCESS_TARGET_KIND,
    input.process_key,
  ),
  facts,
  ...(input.ttl_seconds !== undefined ? { ttl_seconds: input.ttl_seconds } : {}),
  // The owner's own read instant, not this process's clock.
  now: new Date(facts.read_at),
});

type HoldTransitionWrite = { expires_at?: string; ttl_seconds?: number };

const createPublishEditHoldSpec = (
  deps: { integrity_key: string },
  transition: {
    capability: { key: string; version: string };
    command_scope: string;
    carries_ttl: boolean;
    evaluate(scope: BoardScopeV1, ruleRequest: HoldRuleRequest): EditHoldDecisionV1;
  },
): NurtureCommandSpec<PublishEditHoldCommandV1> =>
  createBoardWriteSpec<
    PublishEditHoldCommandV1,
    NurturePublishProcessTransaction,
    NurturePublishEditHoldFacts,
    HoldTransitionWrite
  >({
    capability: transition.capability,
    command_scope: transition.command_scope,
    contract_version: 1,
    result_schema_version: 1,
    canonicalize: canonicalizePublishEditHoldCommand,
    port: {
      select: (tx) => tx.publishProcess,
      unavailable_reason_code: "publish_process_port_unavailable",
    },
    revalidateInput: (input) =>
      input.process_key.length > 0 &&
      Number.isSafeInteger(input.expected_hold_version) &&
      input.expected_hold_version >= 0 &&
      transition.carries_ttl === (input.ttl_seconds !== undefined) &&
      (input.ttl_seconds === undefined ||
        parseEditHoldTtlSeconds(input.ttl_seconds).status === "ok")
        ? null
        : { status: "invalid", reason_code: "invalid_hold_input" },
    loadFacts: (owner, input, context) =>
      owner.loadPublishEditHoldFacts({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        process_key: input.process_key,
      }),
    facts_absent_reason_code: "target_unavailable",
    expectedHeads: (input) => ({ publish_edit_hold: input.expected_hold_version }),
    // Expiry is decided at the owner's read instant, so the head this compares
    // and the hold the rule judged are the same hold.
    currentHeads: (facts) => ({
      publish_edit_hold: frozenHoldVersion(facts, new Date(facts.read_at)),
    }),
    authorize: (facts, input, context) => {
      const ruleRequest = holdRuleRequestFrom(deps, context, input, facts);
      const decision = transition.evaluate(holdCommandScope(context), ruleRequest);
      const refused = holdRefusalReason(decision);
      if (refused) return { status: "blocked", reason_code: refused };
      if (decision.status === "granted") {
        return {
          status: "authorized",
          write: { expires_at: decision.hold.expiresAt, ttl_seconds: decision.hold.ttlSeconds },
        };
      }
      // A release with no live hold changed nothing, and says so against the
      // process the owner just returned rather than claiming a fresh release.
      return currentPublishEditHold(facts, ruleRequest.now)
        ? { status: "authorized", write: {} }
        : {
            status: "already_satisfied",
            effect: {
              output_refs: [facts.publish_process_ref],
              committed_result: {
                processRef: ruleRequest.process_ref,
                released: true,
              },
            },
          };
    },
    apply: async (owner, input, context, write) => {
      const processRef = issueBoardSealedRef(
        deps.integrity_key,
        holdCommandScope(context),
        PUBLISH_PROCESS_TARGET_KIND,
        input.process_key,
      );
      const owned = {
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        process_key: input.process_key,
        expected_hold_version: input.expected_hold_version,
      };
      if (write.expires_at === undefined || write.ttl_seconds === undefined) {
        const released = await owner.applyPublishEditHoldRelease(owned);
        return {
          output_refs: [released.publish_process_ref],
          committed_result: { processRef, released: true },
        };
      }
      const granted = await owner.applyPublishEditHoldGrant({
        ...owned,
        expires_at: write.expires_at,
      });
      return {
        output_refs: [granted.publish_process_ref],
        committed_result: {
          processRef,
          // The window the owner stored, not the one this command computed.
          expiresAt: granted.expires_at,
          ttlSeconds: write.ttl_seconds,
        },
      };
    },
  });

export const createAcquirePublishEditHoldSpec = (deps: {
  integrity_key: string;
}): NurtureCommandSpec<PublishEditHoldCommandV1> =>
  createPublishEditHoldSpec(deps, {
    capability: ACQUIRE_PUBLISH_EDIT_HOLD_CAPABILITY,
    command_scope: ACQUIRE_PUBLISH_EDIT_HOLD_COMMAND_SCOPE,
    carries_ttl: true,
    evaluate: evaluatePublishEditHoldAcquire,
  });

export const createRenewPublishEditHoldSpec = (deps: {
  integrity_key: string;
}): NurtureCommandSpec<PublishEditHoldCommandV1> =>
  createPublishEditHoldSpec(deps, {
    capability: RENEW_PUBLISH_EDIT_HOLD_CAPABILITY,
    command_scope: RENEW_PUBLISH_EDIT_HOLD_COMMAND_SCOPE,
    carries_ttl: true,
    evaluate: evaluatePublishEditHoldRenew,
  });

export const createReleasePublishEditHoldSpec = (deps: {
  integrity_key: string;
}): NurtureCommandSpec<PublishEditHoldCommandV1> =>
  createPublishEditHoldSpec(deps, {
    capability: RELEASE_PUBLISH_EDIT_HOLD_CAPABILITY,
    command_scope: RELEASE_PUBLISH_EDIT_HOLD_COMMAND_SCOPE,
    carries_ttl: false,
    evaluate: evaluatePublishEditHoldRelease,
  });

// ---------------------------------------------------------------------------
// The autosave command.

export type SavePublishProcessDraftCommandV1 = {
  process_key: string;
  expected_draft_revision: number;
  title: string;
  segments: DraftSegmentInputV1[];
};

/**
 * The draft body never enters the canonical payload. A keyed digest stands in,
 * so neither the CommandExecution payload hash nor the confirmation stores an
 * enumerable bare hash of what a teacher wrote.
 */
export const canonicalizeSavePublishProcessDraftCommand =
  (integrityKey: string) =>
  (input: SavePublishProcessDraftCommandV1): unknown => ({
    process_key: input.process_key,
    expected_draft_revision: input.expected_draft_revision,
    content_digest: computeDraftContentDigest(integrityKey, {
      title: input.title,
      segments: input.segments,
    }),
  });

export const prepareSavePublishProcessDraft = async (
  deps: EditLanePrepareDeps & { reads: PublishDraftReadPort & PublishEditHoldReadPort },
  request: EditLanePrepareRequest & { expected_draft_revision?: unknown },
): Promise<EditLanePrepareDecision> => {
  const parsed = parseSavePublishProcessDraftInputV1(request.operation_input);
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };
  if (!request.target_option_ref) return { status: "needs_input", fields: ["target"] };

  const scope: BoardScopeV1 = {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
  };
  const processKey = await resolveProcessKey(deps, scope, request.target_option_ref);
  if (!processKey) return { status: "denied", reason_code: "target_unavailable" };

  const commandRequestId = (deps.create_command_id ?? (() => `command:${randomUUID()}`))();
  const facts = await deps.reads.loadDraftFacts({
    ...scope,
    process_key: processKey,
    command_request_id: commandRequestId,
  });
  if (!facts) return { status: "denied", reason_code: "target_unavailable" };

  // The revision head is the owner's, never the caller's: a client that has not
  // refreshed cannot talk this step into accepting the revision it remembers.
  const decision = evaluatePublishProcessDraftSave(deps, scope, {
    process_ref: request.target_option_ref,
    input: parsed.input,
    expected_draft_revision: facts.current_revision,
    facts,
    now: (deps.now ?? (() => new Date()))(),
  });
  if (decision.status === "denied") return decision;
  if (decision.status === "needs_input") return decision;
  if (decision.status === "held_by_other") {
    return { status: "denied", reason_code: "held_by_other" };
  }
  if (decision.status === "conflict") {
    return { status: "denied", reason_code: "draft_revision_conflict" };
  }

  const command: SavePublishProcessDraftCommandV1 = {
    process_key: processKey,
    expected_draft_revision: facts.current_revision,
    title: parsed.input.title,
    segments: parsed.input.segments,
  };
  const issued = await issueHarnessConfirmation(deps.contexts, {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    surface: request.surface,
    ...(request.host_conversation_ref
      ? { host_conversation_ref: request.host_conversation_ref }
      : {}),
    payload: {
      capability_key: SAVE_PUBLISH_PROCESS_DRAFT_CAPABILITY.key,
      capability_version: SAVE_PUBLISH_PROCESS_DRAFT_CAPABILITY.version,
      command_request_id: commandRequestId,
      target_refs: { publish_process: processKey },
      expected_heads: { draft_revision: command.expected_draft_revision },
      input_integrity_tag: computeHarnessInputIntegrityTag(
        deps.integrity_key,
        canonicalizeSavePublishProcessDraftCommand(deps.integrity_key)(command),
      ),
      integrity_tag_version: 1,
    },
  });
  return {
    status: "ready_to_confirm",
    preview: {
      effect: SAVE_PUBLISH_PROCESS_DRAFT_CAPABILITY.key,
      // The revision this save would land on, not the body it carries.
      revision: decision.result.revision,
      segments: command.segments.length,
    },
    confirmation_ref: issued.token,
    expires_at: issued.expires_at,
    command_request_id: commandRequestId,
  };
};

export const createSavePublishProcessDraftSpec = (deps: {
  integrity_key: string;
  protected_content: ProtectedContentWritePort;
}): NurtureCommandSpec<SavePublishProcessDraftCommandV1> =>
  createBoardWriteSpec<
    SavePublishProcessDraftCommandV1,
    NurturePublishProcessTransaction,
    NurturePublishDraftFacts & { command_request_id: string },
    { content_digest: string }
  >({
    capability: SAVE_PUBLISH_PROCESS_DRAFT_CAPABILITY,
    command_scope: SAVE_PUBLISH_PROCESS_DRAFT_COMMAND_SCOPE,
    contract_version: 1,
    result_schema_version: 1,
    canonicalize: canonicalizeSavePublishProcessDraftCommand(deps.integrity_key),
    port: {
      select: (tx) => tx.publishProcess,
      unavailable_reason_code: "publish_process_port_unavailable",
    },
    revalidateInput: (input) => {
      const parsed = parseSavePublishProcessDraftInputV1({
        title: input.title,
        segments: input.segments,
      });
      return input.process_key.length > 0 &&
        Number.isSafeInteger(input.expected_draft_revision) &&
        input.expected_draft_revision >= 0 &&
        parsed.status === "ok" &&
        parsed.input.title === input.title
        ? null
        : { status: "invalid", reason_code: "invalid_draft_input" };
    },
    loadFacts: async (owner, input, context) => {
      const facts = await owner.loadPublishDraftFacts({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        process_key: input.process_key,
        command_request_id: context.command_request_id,
      });
      return facts ? { ...facts, command_request_id: context.command_request_id } : null;
    },
    facts_absent_reason_code: "target_unavailable",
    expectedHeads: (input) => ({ draft_revision: input.expected_draft_revision }),
    currentHeads: (facts) => ({ draft_revision: facts.current_revision }),
    authorize: (facts, input, context) => {
      const scope = holdCommandScope(context);
      const processRef = issueBoardSealedRef(
        deps.integrity_key,
        scope,
        PUBLISH_PROCESS_TARGET_KIND,
        input.process_key,
      );
      const decision = evaluatePublishProcessDraftSave(deps, scope, {
        process_ref: processRef,
        input: { title: input.title, segments: input.segments },
        expected_draft_revision: input.expected_draft_revision,
        facts,
        // The owner's own read instant decides whether the hold is live.
        now: new Date(facts.read_at),
      });
      if (decision.status === "saved") {
        return { status: "authorized", write: { content_digest: decision.result.contentDigest } };
      }
      if (decision.status === "replayed") {
        // This exact command identity already produced a revision, so the save
        // answers from that revision rather than appending a second one.
        return {
          status: "already_satisfied",
          effect: {
            output_refs: [facts.publish_process_ref],
            committed_result: {
              processRef,
              revision: decision.result.revision,
              savedAt: decision.result.savedAt,
            },
          },
        };
      }
      if (decision.status === "conflict") {
        return { status: "conflict", reason_code: "stale_confirmation" };
      }
      if (decision.status === "held_by_other") {
        return { status: "blocked", reason_code: "held_by_other" };
      }
      if (decision.status === "needs_input") {
        return { status: "invalid", reason_code: "invalid_draft_input" };
      }
      return { status: "blocked", reason_code: decision.reason_code };
    },
    apply: async (owner, input, context, write) => {
      const applied = await owner.applyPublishProcessDraftSave({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        process_key: input.process_key,
        command_request_id: context.command_request_id,
        expected_draft_revision: input.expected_draft_revision,
        content: {
          // The owner stores envelopes only. Sealing happens here, where the key
          // lives, so no plaintext body reaches the repository layer.
          title_envelope: deps.protected_content.seal(input.title),
          body_envelope: deps.protected_content.seal(JSON.stringify(input.segments)),
          content_digest: write.content_digest,
        },
      });
      return {
        output_refs: [applied.publish_process_ref],
        committed_result: {
          processRef: issueBoardSealedRef(
            deps.integrity_key,
            holdCommandScope(context),
            PUBLISH_PROCESS_TARGET_KIND,
            input.process_key,
          ),
          revision: applied.revision,
          savedAt: applied.saved_at,
        },
      };
    },
  });

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
