import { createHash, createHmac } from "node:crypto";
import { nurtureCanonicalJson } from "./c30/canonical-json.js";
import type {
  NurtureCommandInput,
  NurtureCommandResult,
  NurtureCommandSpec,
} from "./domain/commands/command-kernel.js";
import { NurtureDeterministicRollback } from "./domain/commands/command-kernel.js";
import {
  classifyInteractionContextRow,
  hashScenarioToken,
  type NurtureInteractionContextService,
} from "./domain/interactions/interaction-context.js";
import { issueBoardOpaqueRef } from "./harness/board-projection.js";
import {
  canonicalizeCancelPublishProcessCommand,
  createCancelPublishProcessSpec,
  type CancelPublishProcessCommandV1,
} from "./harness/publish-process-editing.js";
import type { ProtectedContentWritePort } from "./harness/protected-content.js";
import { assertProtectedContentEnvelopeV1 } from "./harness/protected-content.js";
import {
  TEACHER_COMMUNICATION_OWNER_INTERFACE,
  type TeacherCommunicationOwnerOperation,
} from "./teacher-communication-owner-contract.js";
import type {
  TeacherCaregiverContextV1,
  TeacherClassFactsV1,
} from "./teacher-class-stream-service.js";

/**
 * W8 real-owner service for `nurture.teacher-communication-owner@1.0.0`.
 * Reads follow the W6 discipline; the three exchanges run on the generic
 * command ledger with the W7 actor HMAC folded into every canonical payload.
 * Thread, message and process refs are workspace-bound opaque HMACs resolved
 * by candidate matching, so foreign or stale refs purge without existence
 * leaks. Timeline cursors are owner-sealed tokens; a tampered cursor is a
 * non-retryable invalid request, never a guess.
 */

const RESPONSE_TTL_MS = 300_000;
const MAX_THREADS = 80;
const MAX_MEMBERS = 20;
const PAGE_SIZE = 50;
const UNREAD_CAP = 99;
const SUMMARY_CAP = 999;

type CaregiverRole = "caregiver" | "lead_caregiver";

type BaseRequestV1 = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
  class_ref: string;
}>;

export type TeacherCommunicationTargetsRequest = BaseRequestV1;
export type TeacherCommunicationMembershipRequest = BaseRequestV1 &
  Readonly<{ thread_ref: string }>;
export type TeacherCommunicationTimelineRequest = BaseRequestV1 &
  Readonly<{ thread_ref: string; cursor?: string }>;
export type TeacherCommunicationSendTextRequest = BaseRequestV1 &
  Readonly<{ thread_ref: string; command_request_id: string }> &
  (
    | Readonly<{ kind: "prepare"; prepare: Readonly<{ text: string }> }>
    | Readonly<{
        kind: "confirm";
        confirm: Readonly<{
          confirmation_ref: string;
          prepared_preview_digest: string;
        }>;
      }>
  );
export type TeacherCommunicationWithdrawStagedRequest = BaseRequestV1 &
  Readonly<{ process_ref: string; command_request_id: string }>;
export type TeacherCommunicationMarkReadRequest = BaseRequestV1 &
  Readonly<{ thread_ref: string; message_ref: string; command_request_id: string }>;

export type TeacherCommunicationResolutionV1 = Readonly<{
  resolution_ref: string;
  presentation_role: CaregiverRole;
  scope_kind: "care_group";
  scope_ref: string;
  context_ref: string;
  scope_version: number;
  resolved_at: string;
}>;

export type TeacherCommunicationAuthorityDecisionV1 =
  | Readonly<{ status: "resolved"; owner_resolution: TeacherCommunicationResolutionV1 }>
  | Readonly<{ status: "closed"; response: unknown }>;

export interface TeacherCommunicationAuthorityPortV1 {
  resolve(
    input: Readonly<{
      workspace_id: string;
      my_chat_user_id: string;
      host_request_id: string;
      context_ref: string;
      operation: TeacherCommunicationOwnerOperation;
      class_ref: string;
    }>,
  ): Promise<TeacherCommunicationAuthorityDecisionV1>;
}

export interface TeacherCommunicationOwnerPortV1 {
  targets(input: Readonly<{
    request: TeacherCommunicationTargetsRequest;
    authority: TeacherCommunicationResolutionV1;
  }>): Promise<unknown>;
  membership(input: Readonly<{
    request: TeacherCommunicationMembershipRequest;
    authority: TeacherCommunicationResolutionV1;
  }>): Promise<unknown>;
  timeline(input: Readonly<{
    request: TeacherCommunicationTimelineRequest;
    authority: TeacherCommunicationResolutionV1;
  }>): Promise<unknown>;
  sendText(input: Readonly<{
    request: TeacherCommunicationSendTextRequest;
    authority: TeacherCommunicationResolutionV1;
  }>): Promise<unknown>;
  withdrawStaged(input: Readonly<{
    request: TeacherCommunicationWithdrawStagedRequest;
    authority: TeacherCommunicationResolutionV1;
  }>): Promise<unknown>;
  markRead(input: Readonly<{
    request: TeacherCommunicationMarkReadRequest;
    authority: TeacherCommunicationResolutionV1;
  }>): Promise<unknown>;
}

export type TeacherCommunicationOwnerServiceBindingV1 = Readonly<{
  authorityResolver: TeacherCommunicationAuthorityPortV1;
  owner: TeacherCommunicationOwnerPortV1;
}>;

// ---------------------------------------------------------------------------
// Owner-internal read facts.

export interface TeacherCommunicationContextReadPortV1 {
  loadCaregiverContext(input: Readonly<{
    workspace_id: string;
    my_chat_user_id: string;
    at: Date;
  }>): Promise<TeacherCaregiverContextV1 | null>;
}

export type TeacherCommunicationThreadRowV1 = Readonly<{
  thread_id: string;
  family_safe_label: string;
  child_safe_label: string;
  /** Owner-computed against the teacher's own cursor; never negative. */
  unread_count: number;
  latest_message_at?: string;
}>;

export type TeacherCommunicationMemberRowV1 = Readonly<{
  member_id: string;
  display_name: string;
  role_display: string;
}>;

export type TeacherCommunicationMessageRowV1 = Readonly<{
  message_id: string;
  kind: "text" | "media" | "system";
  sender_kind: "parent" | "teacher" | "system" | "agent";
  agent_authored: boolean;
  sender_display: string;
  sent_at: string;
  delivery_state: "sent" | "delivered" | "read" | "not_applicable";
  has_media: boolean;
  body_envelope?: unknown;
}>;

export type TeacherCommunicationTimelinePageV1 = Readonly<{
  messages: readonly TeacherCommunicationMessageRowV1[];
  has_more: boolean;
  /** Present when has_more; the position the next page continues before. */
  next?: Readonly<{ sent_at: string; message_id: string }>;
}>;

export type TeacherCommunicationWithdrawCandidateV1 = Readonly<{
  process_id: string;
  process_key: string;
}>;

export interface TeacherCommunicationThreadReadPortV1 {
  listClassThreads(input: Readonly<{
    workspace_id: string;
    care_group_id: string;
    participant_id: string;
    at: Date;
  }>): Promise<readonly TeacherCommunicationThreadRowV1[]>;
  /**
   * Withdraw-resolution candidates: the class's publish processes in any
   * pre-release or already-cancelled state, so an exact replay after the
   * cancel still resolves the same ref instead of masking.
   */
  listWithdrawCandidates(input: Readonly<{
    workspace_id: string;
    care_group_id: string;
  }>): Promise<readonly TeacherCommunicationWithdrawCandidateV1[]>;
  listThreadMembers(input: Readonly<{
    workspace_id: string;
    thread_id: string;
  }>): Promise<readonly TeacherCommunicationMemberRowV1[]>;
  loadTimelinePage(input: Readonly<{
    workspace_id: string;
    thread_id: string;
    participant_id: string;
    page_size: number;
    before?: Readonly<{ sent_at: string; message_id: string }>;
  }>): Promise<TeacherCommunicationTimelinePageV1>;
}

export type TeacherCommunicationCommandRunnerV1 = Readonly<{
  execute<Input>(input: NurtureCommandInput<Input>): Promise<NurtureCommandResult>;
}>;

export type TeacherCommunicationConfirmationIssuerV1 = Readonly<{
  issue: NurtureInteractionContextService["issue"];
}>;

export type TeacherCommunicationOwnerServiceDependenciesV1 = Readonly<{
  contextReads: TeacherCommunicationContextReadPortV1;
  threadReads: TeacherCommunicationThreadReadPortV1;
  interactionContexts: TeacherCommunicationConfirmationIssuerV1;
  commands: TeacherCommunicationCommandRunnerV1;
  protectedContent: ProtectedContentWritePort;
  integrityKey: string;
  now?: () => Date;
}>;

// ---------------------------------------------------------------------------

const digestOf = (value: unknown): string =>
  `sha256:${createHash("sha256")
    .update(nurtureCanonicalJson(value), "utf8")
    .digest("hex")}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

type PreparedSendState = Readonly<{
  schema_version: 1;
  command_request_id: string;
  context_ref: string;
  prepared_preview_digest: string;
  resolution_ref: string;
  scope_version: number;
  thread_id: string;
  body_envelope: unknown;
}>;

const parsePreparedSendState = (value: unknown): PreparedSendState | null => {
  if (!isRecord(value) || value.schema_version !== 1) return null;
  if (
    typeof value.command_request_id !== "string"
    || typeof value.context_ref !== "string"
    || typeof value.prepared_preview_digest !== "string"
    || typeof value.resolution_ref !== "string"
    || typeof value.scope_version !== "number"
    || typeof value.thread_id !== "string"
    || value.body_envelope === undefined
  ) {
    return null;
  }
  return value as PreparedSendState;
};

export const createTeacherCommunicationOwnerService = (
  deps: TeacherCommunicationOwnerServiceDependenciesV1,
): TeacherCommunicationOwnerServiceBindingV1 => {
  const now = deps.now ?? (() => new Date());
  if (deps.integrityKey.length < 32) {
    throw new Error(
      "Teacher communication integrity key must be at least 32 characters",
    );
  }

  const scopeOf = (workspaceId: string) => ({ workspace_id: workspaceId });
  const refOf = (workspaceId: string, kind: string, id: string): string =>
    issueBoardOpaqueRef(deps.integrityKey, scopeOf(workspaceId), kind, id);
  const classRefOf = (workspaceId: string, careGroupId: string): string =>
    refOf(workspaceId, "care_group", careGroupId);
  const actorBindingOf = (workspaceId: string, participantId: string): string =>
    createHmac("sha256", deps.integrityKey)
      .update(
        `nurture.teacher-communication-actor.v1\0${workspaceId}\0${participantId}`,
        "utf8",
      )
      .digest("hex");

  const cursorTagOf = (workspaceId: string, threadId: string, body: string): string =>
    createHmac("sha256", deps.integrityKey)
      .update(`nurture.teacher-communication-cursor.v1\0${workspaceId}\0${threadId}\0${body}`, "utf8")
      .digest("hex")
      .slice(0, 16);

  const encodeCursor = (
    workspaceId: string,
    threadId: string,
    position: Readonly<{ sent_at: string; message_id: string }>,
  ): string => {
    const body = Buffer.from(
      `${position.sent_at}\0${position.message_id}`,
      "utf8",
    ).toString("base64url");
    return `${body}.${cursorTagOf(workspaceId, threadId, body)}`;
  };

  const decodeCursor = (
    workspaceId: string,
    threadId: string,
    cursor: string,
  ): Readonly<{ sent_at: string; message_id: string }> | null => {
    const separator = cursor.lastIndexOf(".");
    if (separator <= 0) return null;
    const body = cursor.slice(0, separator);
    if (cursor.slice(separator + 1) !== cursorTagOf(workspaceId, threadId, body)) {
      return null;
    }
    const decoded = Buffer.from(body, "base64url").toString("utf8");
    const divider = decoded.indexOf("\0");
    if (divider <= 0) return null;
    return { sent_at: decoded.slice(0, divider), message_id: decoded.slice(divider + 1) };
  };

  const masked = (
    contextRef: string,
    reason: "access_changed" | "context_changed" | "refresh_not_retryable",
  ): unknown => ({
    status: "masked",
    context_ref: contextRef,
    masked_at: now().toISOString(),
    mask_signal: {
      kind: "mask",
      reason_code: reason,
      purge_partition: true,
      content_masked: true,
    },
  });

  const unavailable = (
    contextRef: string,
    reason: "content_unavailable" | "temporarily_unavailable" | "request_invalid",
  ): unknown => ({
    status: "unavailable",
    context_ref: contextRef,
    failed_at: now().toISOString(),
    reason_code: reason,
    retryable: reason === "temporarily_unavailable",
  });

  const outcomeUnknown = (contextRef: string, commandRequestId: string): unknown => ({
    status: "outcome_unknown",
    context_ref: contextRef,
    command_request_id: commandRequestId,
    recovery: "reconcile_same_command",
  });

  const notCommitted = (
    request: Readonly<{ context_ref: string; command_request_id: string }>,
    reason: string,
  ): unknown => ({
    status: "not_committed",
    context_ref: request.context_ref,
    command_request_id: request.command_request_id,
    reason_code: reason,
  });

  const findByClassRef = (
    workspaceId: string,
    context: TeacherCaregiverContextV1,
    classRef: string,
  ): TeacherClassFactsV1 | undefined =>
    context.classes.find(
      (entry) => classRefOf(workspaceId, entry.care_group_id) === classRef,
    );

  const loadContext = (request: BaseRequestV1) =>
    deps.contextReads.loadCaregiverContext({
      workspace_id: request.workspace_id,
      my_chat_user_id: request.my_chat_user_id,
      at: now(),
    });

  const classResolution = (
    request: BaseRequestV1,
    entry: TeacherClassFactsV1,
    resolvedAt: string,
  ): TeacherCommunicationResolutionV1 => {
    const scopeVersion = Math.max(1, entry.role_version, entry.care_group_version);
    return Object.freeze({
      resolution_ref: refOf(
        request.workspace_id,
        "resolution",
        `communication:${entry.care_group_id}:${scopeVersion}`,
      ),
      presentation_role: entry.role,
      scope_kind: "care_group" as const,
      scope_ref: request.class_ref,
      context_ref: request.context_ref,
      scope_version: scopeVersion,
      resolved_at: resolvedAt,
    });
  };

  const readyEnvelope = (
    request: BaseRequestV1,
    authority: TeacherCommunicationResolutionV1,
    operation: "targets_query" | "membership_query" | "timeline_query",
    queryKey: string,
  ) => {
    const generatedAt = now();
    return {
      status: "ready" as const,
      owner_resolution: authority,
      cache_partition: {
        partition_key: refOf(
          request.workspace_id,
          "partition",
          `${operation}\0${request.my_chat_user_id}\0${authority.resolution_ref}\0${queryKey}`,
        ),
        interface_key: TEACHER_COMMUNICATION_OWNER_INTERFACE.key,
        interface_version: TEACHER_COMMUNICATION_OWNER_INTERFACE.version,
        contract_digest: TEACHER_COMMUNICATION_OWNER_INTERFACE.digest,
        workspace_id: request.workspace_id,
        my_chat_user_id: request.my_chat_user_id,
        presentation_role: authority.presentation_role,
        context_ref: request.context_ref,
        resolution_ref: authority.resolution_ref,
        scope_version: authority.scope_version,
        operation,
        query_key: queryKey,
        expires_at: new Date(generatedAt.getTime() + RESPONSE_TTL_MS).toISOString(),
      },
      generated_at: generatedAt.toISOString(),
      freshness: {
        resolved_at: authority.resolved_at,
        source: "current_owner_read" as const,
      },
    };
  };

  const authorityResolver: TeacherCommunicationAuthorityPortV1 = {
    async resolve(input) {
      let context: TeacherCaregiverContextV1 | null;
      try {
        context = await deps.contextReads.loadCaregiverContext({
          workspace_id: input.workspace_id,
          my_chat_user_id: input.my_chat_user_id,
          at: now(),
        });
      } catch {
        return {
          status: "closed",
          response: unavailable(input.context_ref, "temporarily_unavailable"),
        };
      }
      const entry = context
        ? findByClassRef(input.workspace_id, context, input.class_ref)
        : undefined;
      if (!entry) {
        return {
          status: "closed",
          response: masked(input.context_ref, "access_changed"),
        };
      }
      return {
        status: "resolved",
        owner_resolution: classResolution(input, entry, now().toISOString()),
      };
    },
  };

  type Membership = Readonly<{
    context: TeacherCaregiverContextV1;
    entry: TeacherClassFactsV1;
  }>;

  const resolveMembership = async (
    request: BaseRequestV1,
  ): Promise<Membership | null> => {
    const context = await loadContext(request);
    if (!context) return null;
    const entry = findByClassRef(request.workspace_id, context, request.class_ref);
    return entry ? { context, entry } : null;
  };

  const resolveThread = async (
    request: BaseRequestV1 & Readonly<{ thread_ref: string }>,
    membership: Membership,
  ): Promise<TeacherCommunicationThreadRowV1 | null> => {
    const threads = await deps.threadReads.listClassThreads({
      workspace_id: request.workspace_id,
      care_group_id: membership.entry.care_group_id,
      participant_id: membership.context.participant_id,
      at: now(),
    });
    return (
      threads.find(
        (thread) =>
          refOf(request.workspace_id, "family_care_thread", thread.thread_id)
          === request.thread_ref,
      ) ?? null
    );
  };

  const owner: TeacherCommunicationOwnerPortV1 = {
    async targets({ request, authority }) {
      const membership = await resolveMembership(request);
      if (!membership) return masked(request.context_ref, "access_changed");
      const threads = await deps.threadReads.listClassThreads({
        workspace_id: request.workspace_id,
        care_group_id: membership.entry.care_group_id,
        participant_id: membership.context.participant_id,
        at: now(),
      });
      const bounded = threads.slice(0, MAX_THREADS).map((thread) => ({
        thread_ref: refOf(
          request.workspace_id,
          "family_care_thread",
          thread.thread_id,
        ),
        family_safe_label: thread.family_safe_label,
        child_safe_label: thread.child_safe_label,
        unread_count: Math.min(Math.max(thread.unread_count, 0), UNREAD_CAP),
        ...(thread.latest_message_at
          ? { latest_message_at: thread.latest_message_at }
          : {}),
      }));
      const total = bounded.reduce((sum, thread) => sum + thread.unread_count, 0);
      return {
        ...readyEnvelope(request, authority, "targets_query", request.class_ref),
        class_group: {
          send_availability: "unavailable" as const,
          reason_code: "class_group_reserved" as const,
        },
        threads: bounded,
        unread_summary: {
          total_unread: Math.min(total, SUMMARY_CAP),
          threads_with_unread: bounded.filter((thread) => thread.unread_count > 0)
            .length,
        },
      };
    },

    async membership({ request, authority }) {
      const membership = await resolveMembership(request);
      if (!membership) return masked(request.context_ref, "access_changed");
      const thread = await resolveThread(request, membership);
      if (!thread) return masked(request.context_ref, "access_changed");
      const members = await deps.threadReads.listThreadMembers({
        workspace_id: request.workspace_id,
        thread_id: thread.thread_id,
      });
      if (members.length === 0) {
        return unavailable(request.context_ref, "content_unavailable");
      }
      return {
        ...readyEnvelope(request, authority, "membership_query", request.thread_ref),
        thread_ref: request.thread_ref,
        members: members.slice(0, MAX_MEMBERS).map((member) => ({
          member_ref: refOf(request.workspace_id, "thread_member", member.member_id),
          display_name: member.display_name.slice(0, 80),
          role_display: member.role_display.slice(0, 40),
        })),
      };
    },

    async timeline({ request, authority }) {
      const membership = await resolveMembership(request);
      if (!membership) return masked(request.context_ref, "access_changed");
      const thread = await resolveThread(request, membership);
      if (!thread) return masked(request.context_ref, "access_changed");
      const before = request.cursor === undefined
        ? undefined
        : decodeCursor(request.workspace_id, thread.thread_id, request.cursor);
      if (request.cursor !== undefined && before === null) {
        return unavailable(request.context_ref, "request_invalid");
      }
      const page = await deps.threadReads.loadTimelinePage({
        workspace_id: request.workspace_id,
        thread_id: thread.thread_id,
        participant_id: membership.context.participant_id,
        page_size: PAGE_SIZE,
        ...(before ? { before } : {}),
      });
      const queryKey = `${request.thread_ref}|${request.cursor ?? "first"}`;
      return {
        ...readyEnvelope(request, authority, "timeline_query", queryKey),
        thread_ref: request.thread_ref,
        cursor_echo: request.cursor ?? null,
        messages: page.messages.slice(0, PAGE_SIZE).map((message) => {
          const body =
            message.kind === "text" && message.body_envelope !== undefined
              ? unsealBody(message.body_envelope)
              : undefined;
          return {
            message_ref: refOf(
              request.workspace_id,
              "family_care_message",
              message.message_id,
            ),
            kind: message.kind,
            sender_kind: message.sender_kind,
            agent_authored: message.agent_authored,
            sender_display: message.sender_display.slice(0, 80),
            sent_at: message.sent_at,
            delivery_state: message.delivery_state,
            has_media: message.has_media,
            ...(message.kind === "text" && body ? { body } : {}),
          };
        }),
        page: {
          has_more: page.has_more,
          ...(page.has_more && page.next
            ? {
                next_cursor: encodeCursor(request.workspace_id, thread.thread_id, {
                  sent_at: page.next.sent_at,
                  message_id: page.next.message_id,
                }),
              }
            : {}),
        },
      };
    },

    async sendText({ request, authority }) {
      const membership = await resolveMembership(request);
      if (!membership) return masked(request.context_ref, "access_changed");
      const thread = await resolveThread(request, membership);
      if (!thread) return masked(request.context_ref, "access_changed");
      return request.kind === "prepare"
        ? sendPrepare(request, authority, membership, thread)
        : sendConfirm(request, authority, membership, thread);
    },

    async withdrawStaged({ request }) {
      const membership = await resolveMembership(request);
      if (!membership) return masked(request.context_ref, "access_changed");
      return runWithdraw(request, membership);
    },

    async markRead({ request }) {
      const membership = await resolveMembership(request);
      if (!membership) return masked(request.context_ref, "access_changed");
      const thread = await resolveThread(request, membership);
      if (!thread) return masked(request.context_ref, "access_changed");
      return runMarkRead(request, membership, thread);
    },
  };

  const unsealBody = (envelope: unknown): string | undefined => {
    try {
      const plaintext = deps.protectedContent.unseal(
        assertProtectedContentEnvelopeV1(envelope),
      );
      const bounded = plaintext.slice(0, 4000);
      return bounded.length > 0 ? bounded : undefined;
    } catch {
      return undefined;
    }
  };

  const sendPrepare = async (
    request: Extract<TeacherCommunicationSendTextRequest, { kind: "prepare" }>,
    authority: TeacherCommunicationResolutionV1,
    membership: Membership,
    thread: TeacherCommunicationThreadRowV1,
  ): Promise<unknown> => {
    const sealed = deps.protectedContent.seal(request.prepare.text);
    const digest = digestOf({
      thread_ref: request.thread_ref,
      text: request.prepare.text,
    });
    const issued = await deps.interactionContexts.issue({
      workspace_id: request.workspace_id,
      participant_id: membership.context.participant_id,
      purpose: "prepare_action",
      surface: "teacher_communication",
      host_conversation_ref: request.command_request_id,
      payload_schema_version: 1,
      state_payload: {
        schema_version: 1,
        command_request_id: request.command_request_id,
        context_ref: request.context_ref,
        prepared_preview_digest: digest,
        resolution_ref: authority.resolution_ref,
        scope_version: authority.scope_version,
        thread_id: thread.thread_id,
        body_envelope: sealed,
      } satisfies PreparedSendState,
      ttl_ms: 5 * 60_000,
    });
    return {
      status: "ready_to_confirm",
      context_ref: request.context_ref,
      command_request_id: request.command_request_id,
      confirmation_ref: issued.token,
      prepared_preview_digest: digest,
      expires_at: issued.expires_at,
    };
  };

  const sendConfirm = async (
    request: Extract<TeacherCommunicationSendTextRequest, { kind: "confirm" }>,
    authority: TeacherCommunicationResolutionV1,
    membership: Membership,
    thread: TeacherCommunicationThreadRowV1,
  ): Promise<unknown> => {
    let prepared: PreparedSendState | undefined;
    const participantId = membership.context.participant_id;
    const actorBinding = actorBindingOf(request.workspace_id, participantId);
    const spec: NurtureCommandSpec<Record<string, unknown>> = {
      command_key: "teacher_communication_send_text",
      command_scope: "teacher_communication",
      contract_version: 1,
      canonicalize: (payload) => payload,
      checkPreconditions: async (transaction) => {
        if (!transaction.interactionContexts || !transaction.teacherCommunication) {
          return {
            status: "blocked",
            reason_code: "teacher_communication_ports_unavailable",
          };
        }
        const row = await transaction.interactionContexts.findByTokenHash({
          workspace_id: request.workspace_id,
          token_hash: hashScenarioToken(
            request.workspace_id,
            request.confirm.confirmation_ref,
          ),
        });
        const classified = classifyInteractionContextRow(
          row,
          {
            workspace_id: request.workspace_id,
            participant_id: participantId,
            purpose: "prepare_action",
            surface: "teacher_communication",
            host_conversation_ref: request.command_request_id,
          },
          now(),
        );
        if (classified.status === "expired") {
          return { status: "blocked", reason_code: "confirmation_expired" };
        }
        if (classified.status === "blocked") {
          return { status: "blocked", reason_code: "confirmation_foreign" };
        }
        const state = parsePreparedSendState(classified.context.state_payload);
        if (
          !state
          || state.command_request_id !== request.command_request_id
          || state.context_ref !== request.context_ref
          || state.resolution_ref !== authority.resolution_ref
          || state.scope_version !== authority.scope_version
          || state.thread_id !== thread.thread_id
        ) {
          return { status: "blocked", reason_code: "confirmation_foreign" };
        }
        if (state.prepared_preview_digest !== request.confirm.prepared_preview_digest) {
          return { status: "blocked", reason_code: "preview_digest_mismatch" };
        }
        const consumed = await transaction.interactionContexts.consume({
          workspace_id: request.workspace_id,
          context_id: classified.context.id,
          expected_version: classified.context.version,
          consumed_at: now().toISOString(),
        });
        if (!consumed) {
          return { status: "blocked", reason_code: "confirmation_consumed" };
        }
        prepared = state;
        return { status: "ready" };
      },
      apply: async (transaction) => {
        if (!prepared || !transaction.teacherCommunication) {
          throw new Error("teacher communication apply port unavailable");
        }
        const applied = await transaction.teacherCommunication.applyThreadTextMessage({
          workspace_id: request.workspace_id,
          participant_id: participantId,
          thread_id: prepared.thread_id,
          body_envelope: prepared.body_envelope,
          sent_at: now().toISOString(),
        });
        if (applied.status !== "applied") {
          throw new NurtureDeterministicRollback(
            applied.status === "not_authorized"
              ? "not_authorized"
              : "thread_unavailable",
          );
        }
        return {
          output_refs: [
            {
              schema_version: 1,
              namespace: "nurture",
              object_type: "family_care_message",
              object_id: applied.message_id,
              version: 1,
            },
          ],
          result_schema_version: 1,
          committed_result: {
            schema_version: 1,
            message_id: applied.message_id,
            committed_at: applied.committed_at,
          },
        };
      },
    };
    const result = await deps.commands.execute({
      workspace_id: request.workspace_id,
      invocation_request_id: request.host_request_id,
      command_request_id: request.command_request_id,
      business_actor_ref: participantId,
      payload: {
        confirmation_digest: digestOf({
          confirmation_ref: request.confirm.confirmation_ref,
          prepared_preview_digest: request.confirm.prepared_preview_digest,
        }),
        actor_binding_ref: actorBinding,
      },
      spec,
    });
    if (result.status === "outcome_unknown") {
      return outcomeUnknown(request.context_ref, request.command_request_id);
    }
    if (result.status === "ok") {
      const committed = isRecord(result.committed_result)
        ? result.committed_result
        : undefined;
      if (
        !committed
        || typeof committed.message_id !== "string"
        || typeof committed.committed_at !== "string"
      ) {
        return outcomeUnknown(request.context_ref, request.command_request_id);
      }
      return {
        status: "committed",
        context_ref: request.context_ref,
        command_request_id: request.command_request_id,
        executed: result.disposition,
        message_ref: refOf(
          request.workspace_id,
          "family_care_message",
          committed.message_id,
        ),
        committed_at: committed.committed_at,
      };
    }
    if (result.decision === "idempotency_conflict") {
      return notCommitted(request, "command_payload_conflict");
    }
    if (
      [
        "confirmation_expired",
        "confirmation_consumed",
        "confirmation_foreign",
        "preview_digest_mismatch",
      ].includes(result.reason_code)
    ) {
      return notCommitted(request, result.reason_code);
    }
    if (result.reason_code === "not_authorized") {
      return masked(request.context_ref, "access_changed");
    }
    return unavailable(request.context_ref, "content_unavailable");
  };

  const runWithdraw = async (
    request: TeacherCommunicationWithdrawStagedRequest,
    membership: Membership,
  ): Promise<unknown> => {
    const lane = await deps.threadReads.listWithdrawCandidates({
      workspace_id: request.workspace_id,
      care_group_id: membership.entry.care_group_id,
    });
    const target = lane.find(
      (row) =>
        refOf(request.workspace_id, "publish_process", row.process_id)
        === request.process_ref,
    );
    if (!target) return masked(request.context_ref, "access_changed");
    const participantId = membership.context.participant_id;
    const actorBinding = actorBindingOf(request.workspace_id, participantId);
    const specWithOptionalHeads: NurtureCommandSpec<CancelPublishProcessCommandV1> & {
      expectedHeads?: unknown;
      head_keys?: unknown;
    } = createCancelPublishProcessSpec({
      integrity_key: deps.integrityKey,
      now,
    });
    const { expectedHeads, head_keys, ...spec } = specWithOptionalHeads;
    void expectedHeads;
    void head_keys;
    const result = await deps.commands.execute({
      workspace_id: request.workspace_id,
      invocation_request_id: request.host_request_id,
      command_request_id: request.command_request_id,
      business_actor_ref: participantId,
      payload: {
        process_key: target.process_key,
        // The head still gates the write via expected-heads; identity must
        // not depend on it or a replay after the cancel could never match.
        expected_process_version: 0,
      } satisfies CancelPublishProcessCommandV1,
      spec: {
        ...spec,
        canonicalize: (input: CancelPublishProcessCommandV1) => ({
          process_key: (
            canonicalizeCancelPublishProcessCommand(input) as {
              process_key: string;
            }
          ).process_key,
          actor_binding_ref: actorBinding,
        }),
      },
      // The kernel treats absent head helpers like undefined ones. The cancel
      // rule re-reads live process state, so this exchange omits those helpers.
    });
    if (result.status === "outcome_unknown") {
      return outcomeUnknown(request.context_ref, request.command_request_id);
    }
    if (result.status === "ok") {
      const committed = isRecord(result.committed_result)
        ? result.committed_result
        : undefined;
      const cancelledAt =
        committed && typeof committed.cancelledAt === "string"
          ? committed.cancelledAt
          : undefined;
      if (!cancelledAt) {
        return outcomeUnknown(request.context_ref, request.command_request_id);
      }
      return {
        status: "committed",
        context_ref: request.context_ref,
        command_request_id: request.command_request_id,
        executed: result.disposition,
        disposition:
          result.business_outcome === "already_satisfied"
            ? "already_withdrawn"
            : "withdrawn",
        process_ref: request.process_ref,
        withdrawn_at: cancelledAt,
      };
    }
    if (result.decision === "idempotency_conflict") {
      return notCommitted(request, "command_payload_conflict");
    }
    if (result.reason_code === "not_authorized") {
      return masked(request.context_ref, "access_changed");
    }
    if (
      [
        "target_unavailable",
        "already_released",
        "illegal_transition",
        "cancel_evidence_unavailable",
      ].includes(result.reason_code)
    ) {
      return notCommitted(request, result.reason_code);
    }
    return unavailable(request.context_ref, "content_unavailable");
  };

  const runMarkRead = async (
    request: TeacherCommunicationMarkReadRequest,
    membership: Membership,
    thread: TeacherCommunicationThreadRowV1,
  ): Promise<unknown> => {
    const participantId = membership.context.participant_id;
    const actorBinding = actorBindingOf(request.workspace_id, participantId);
    const messageRef = request.message_ref;
    const spec: NurtureCommandSpec<Record<string, unknown>> = {
      command_key: "teacher_communication_mark_read",
      command_scope: "teacher_communication",
      contract_version: 1,
      canonicalize: (payload) => payload,
      checkPreconditions: async (transaction) =>
        transaction.teacherCommunication
          ? { status: "ready" }
          : {
              status: "blocked",
              reason_code: "teacher_communication_ports_unavailable",
            },
      apply: async (transaction) => {
        const applied = await transaction.teacherCommunication!.applyThreadReadCursor({
          workspace_id: request.workspace_id,
          participant_id: participantId,
          thread_id: thread.thread_id,
          // Resolved by candidate matching inside the transaction: the ref
          // must name a message of this exact thread.
          message_ref: messageRef,
          issue_ref: (messageId: string) =>
            refOf(request.workspace_id, "family_care_message", messageId),
          at: now().toISOString(),
        });
        if (applied.status === "message_foreign" || applied.status === "not_authorized") {
          throw new NurtureDeterministicRollback("not_authorized");
        }
        if (applied.status === "cursor_regression") {
          throw new NurtureDeterministicRollback("cursor_regression");
        }
        return {
          output_refs: [
            {
              schema_version: 1,
              namespace: "nurture",
              object_type: "family_care_thread",
              object_id: thread.thread_id,
              version: 1,
            },
          ],
          result_schema_version: 1,
          committed_result: {
            schema_version: 1,
            disposition: applied.status,
          },
        };
      },
    };
    const result = await deps.commands.execute({
      workspace_id: request.workspace_id,
      invocation_request_id: request.host_request_id,
      command_request_id: request.command_request_id,
      business_actor_ref: participantId,
      payload: {
        thread_id_digest: digestOf(thread.thread_id),
        message_ref: messageRef,
        actor_binding_ref: actorBinding,
      },
      spec,
    });
    if (result.status === "outcome_unknown") {
      return outcomeUnknown(request.context_ref, request.command_request_id);
    }
    if (result.status === "ok") {
      const committed = isRecord(result.committed_result)
        ? result.committed_result
        : undefined;
      if (
        !committed
        || (committed.disposition !== "advanced"
          && committed.disposition !== "already_satisfied")
      ) {
        return outcomeUnknown(request.context_ref, request.command_request_id);
      }
      return {
        status: "committed",
        context_ref: request.context_ref,
        command_request_id: request.command_request_id,
        executed: result.disposition,
        disposition: committed.disposition,
        thread_ref: request.thread_ref,
      };
    }
    if (result.decision === "idempotency_conflict") {
      return notCommitted(request, "command_payload_conflict");
    }
    if (result.reason_code === "cursor_regression") {
      return notCommitted(request, "cursor_regression");
    }
    if (result.reason_code === "not_authorized") {
      return masked(request.context_ref, "access_changed");
    }
    return unavailable(request.context_ref, "content_unavailable");
  };

  return { authorityResolver, owner };
};
