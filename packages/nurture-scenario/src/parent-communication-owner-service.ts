import { createHash, createHmac } from "node:crypto";
import type { CanonicalRef } from "@my-chat/workflow-contracts";
import {
  assertProtectedContentEnvelopeV1,
  type ProtectedContentEnvelopeV1,
  type ProtectedContentWritePort,
} from "./harness/protected-content.js";
import {
  NurtureCommandRunner,
  type NurtureCommandSpec,
} from "./domain/commands/command-kernel.js";
import {
  classifyInteractionContextRow,
  hashScenarioToken,
  NurtureInteractionContextService,
} from "./domain/interactions/interaction-context.js";
import { nurtureCanonicalJson } from "./c30/canonical-json.js";
import {
  PARENT_COMMUNICATION_OWNER_INTERFACE,
  type ParentCommunicationAsyncBoundaryV1,
  type ParentCommunicationDetailRequestV1,
  type ParentCommunicationOwnerOperation,
  type ParentCommunicationOwnerRequestV1,
  type ParentCommunicationOwnerV1,
  type ParentCommunicationResolvedAuthorityV1,
  type ParentCommunicationSendTextConfirmRequestV1,
  type ParentCommunicationSendTextPrepareRequestV1,
} from "./parent-communication-owner-contract.js";

export type ParentCommunicationReadMemberV1 = Readonly<{
  participant_id: string;
  display_name: string;
  role_display: string;
  aggregate_version: number;
}>;

export type ParentCommunicationReadMessageV1 = Readonly<{
  message_id: string;
  sender_participant_id: string;
  sender_kind: "parent" | "teacher" | "system" | "agent";
  sender_display: string;
  sent_at: string;
  delivery_state: "sent" | "delivered" | "read" | "not_applicable";
  body_envelope: unknown;
}>;

export type ParentCommunicationReadSnapshotV1 = Readonly<{
  status: "current";
  refreshed_at: string;
  unread_count: number;
  presentation_head: string;
  members: readonly ParentCommunicationReadMemberV1[];
  messages: readonly ParentCommunicationReadMessageV1[];
  has_more: boolean;
  next_cursor?: string;
}>;

export type ParentCommunicationOwnerReadPortV1 = Readonly<{
  read(input: {
    workspace_id: string;
    authority: ParentCommunicationResolvedAuthorityV1;
    page_size: number;
    cursor?: string;
    include_detail: boolean;
  }): Promise<ParentCommunicationReadSnapshotV1 | Readonly<{ status: "scope_changed" }>>;
}>;

type OwnerDeps = Readonly<{
  reads: ParentCommunicationOwnerReadPortV1;
  interactionContexts: NurtureInteractionContextService;
  commands: NurtureCommandRunner;
  protectedContent: ProtectedContentWritePort;
  integrityKey: string;
  now?: () => Date;
}>;

type PreparedState = Readonly<{
  schema_version: 1;
  command_request_id: string;
  context_ref: string;
  presentation_version: string;
  prepared_preview_digest: string;
  resolution_ref: string;
  scope_version: number;
  protected_content_envelope: ProtectedContentEnvelopeV1;
}>;

type ConfirmPayload = Readonly<{
  context_ref: string;
  presentation_version: string;
  prepared_preview_digest: string;
  actor_binding_ref: string;
}>;

type CommittedResult = Readonly<{
  schema_version: 1;
  message_ref: string;
  receipt_ref: string;
  committed_at: string;
}>;

const CACHE_TTL_MS = 5 * 60_000;
const CONFIRMATION_TTL_MS = 5 * 60_000;

export class NurtureParentCommunicationOwner implements ParentCommunicationOwnerV1 {
  private readonly now: () => Date;

  constructor(private readonly deps: OwnerDeps) {
    if (deps.integrityKey.length < 32) {
      throw new Error("parent communication integrity key must contain at least 32 characters");
    }
    this.now = deps.now ?? (() => new Date());
  }

  async execute(input: {
    operation: ParentCommunicationOwnerOperation;
    request: ParentCommunicationOwnerRequestV1;
    authority: ParentCommunicationResolvedAuthorityV1;
  }): Promise<unknown> {
    switch (input.operation) {
      case "summary_query":
        return this.summary(input.request, input.authority);
      case "detail_query":
        return this.detail(input.request as ParentCommunicationDetailRequestV1, input.authority);
      case "send_text_exchange":
        return "kind" in input.request && input.request.kind === "prepare"
          ? this.prepare(input.request, input.authority)
          : this.confirm(input.request as ParentCommunicationSendTextConfirmRequestV1, input.authority);
      case "media_access_query":
        return unavailable(input.request.context_ref, this.now, "content_unavailable", false);
    }
  }

  private async summary(
    request: ParentCommunicationOwnerRequestV1,
    authority: ParentCommunicationResolvedAuthorityV1,
  ): Promise<unknown> {
    const snapshot = await this.deps.reads.read({
      workspace_id: request.workspace_id,
      authority,
      page_size: 1,
      include_detail: false,
    });
    if (snapshot.status === "scope_changed") return masked(request.context_ref, this.now);
    const presentationVersion = presentationVersionFor(authority, snapshot.presentation_head);
    return {
      status: "ready",
      presentation_version: presentationVersion,
      refreshed_at: snapshot.refreshed_at,
      segments: {
        teachers: { available: true, unread_count: boundedUnread(snapshot.unread_count) },
        class_group: { available: false, unread_count: 0 },
      },
      ...this.binding("summary_query", request, authority, presentationVersion),
    };
  }

  private async detail(
    request: ParentCommunicationDetailRequestV1,
    authority: ParentCommunicationResolvedAuthorityV1,
  ): Promise<unknown> {
    if (request.segment === "class_group") {
      return unavailable(request.context_ref, this.now, "unsupported_segment", false);
    }
    const snapshot = await this.deps.reads.read({
      workspace_id: request.workspace_id,
      authority,
      page_size: request.page_size,
      ...(request.cursor ? { cursor: request.cursor } : {}),
      include_detail: true,
    });
    if (snapshot.status === "scope_changed") return masked(request.context_ref, this.now);
    const presentationVersion = presentationVersionFor(authority, snapshot.presentation_head);
    const messages = snapshot.messages.map((message) => ({
      kind: "text" as const,
      message_ref: this.publicRef(request, "message", message.message_id),
      sender_kind: message.sender_kind,
      sender_display: displayText(message.sender_display, 80, "成员"),
      sent_at: message.sent_at,
      delivery_state: message.delivery_state,
      body: this.deps.protectedContent.unseal(
        assertProtectedContentEnvelopeV1(message.body_envelope),
      ),
    }));
    return {
      status: "ready",
      segment: "teachers",
      presentation_version: presentationVersion,
      refreshed_at: snapshot.refreshed_at,
      unread_count: boundedUnread(snapshot.unread_count),
      members: snapshot.members.slice(0, 20).map((member) => ({
        member_ref: this.publicRef(request, "member", member.participant_id),
        display_name: displayText(member.display_name, 80, "成员"),
        role_display: displayText(member.role_display, 40, "教师"),
      })),
      messages,
      page_info: {
        has_more: snapshot.has_more,
        ...(snapshot.has_more && snapshot.next_cursor
          ? { next_cursor: snapshot.next_cursor }
          : {}),
      },
      ...this.binding("detail_query", request, authority, presentationVersion),
    };
  }

  private async prepare(
    request: ParentCommunicationSendTextPrepareRequestV1,
    authority: ParentCommunicationResolvedAuthorityV1,
  ): Promise<unknown> {
    const snapshot = await this.deps.reads.read({
      workspace_id: request.workspace_id,
      authority,
      page_size: 1,
      include_detail: false,
    });
    if (snapshot.status === "scope_changed") return masked(request.context_ref, this.now);
    const currentPresentation = presentationVersionFor(authority, snapshot.presentation_head);
    if (currentPresentation !== request.presentation_version) {
      return notCommitted(request.command_request_id, "stale_presentation", "refresh_presentation");
    }
    const preview = {
      body: request.body,
      target_display: "带班老师",
      effect: "send_text_message" as const,
    };
    const digest = digestPreview(preview);
    const issued = await this.deps.interactionContexts.issue({
      workspace_id: request.workspace_id,
      participant_id: authority.participant_id,
      purpose: "prepare_action",
      surface: "parent_communication",
      host_conversation_ref: request.command_request_id,
      payload_schema_version: 1,
      state_payload: {
        schema_version: 1,
        command_request_id: request.command_request_id,
        context_ref: request.context_ref,
        presentation_version: request.presentation_version,
        prepared_preview_digest: digest,
        resolution_ref: authority.resolution_ref,
        scope_version: authority.scope_version,
        protected_content_envelope: this.deps.protectedContent.seal(request.body),
      } satisfies PreparedState,
      ttl_ms: CONFIRMATION_TTL_MS,
    });
    return {
      status: "ready_to_confirm",
      segment: "teachers",
      presentation_version: request.presentation_version,
      command_request_id: request.command_request_id,
      confirmation_ref: issued.token,
      prepared_preview_digest: digest,
      expires_at: issued.expires_at,
      preview,
      ...this.binding("send_text_exchange", request, authority, request.presentation_version),
    };
  }

  private async confirm(
    request: ParentCommunicationSendTextConfirmRequestV1,
    authority: ParentCommunicationResolvedAuthorityV1,
  ): Promise<unknown> {
    let prepared: PreparedState | undefined;
    const spec: NurtureCommandSpec<ConfirmPayload> = {
      command_key: "parent_communication_send_text",
      command_scope: "parent_communication",
      contract_version: 1,
      canonicalize: (payload) => payload,
      checkPreconditions: async (transaction) => {
        if (!transaction.interactionContexts || !transaction.familyCare?.loadParentCommunicationSendFacts) {
          return { status: "blocked", reason_code: "parent_communication_ports_unavailable" };
        }
        const row = await transaction.interactionContexts.findByTokenHash({
          workspace_id: request.workspace_id,
          token_hash: hashScenarioToken(request.workspace_id, request.confirmation_ref),
        });
        const classified = classifyInteractionContextRow(row, {
          workspace_id: request.workspace_id,
          participant_id: authority.participant_id,
          purpose: "prepare_action",
          surface: "parent_communication",
          host_conversation_ref: request.command_request_id,
        }, this.now());
        if (classified.status === "expired") {
          return { status: "blocked", reason_code: "token_expired" };
        }
        if (classified.status === "blocked") {
          return { status: "blocked", reason_code: classified.reason_code };
        }
        const state = parsePreparedState(classified.context.state_payload);
        if (!state
          || state.command_request_id !== request.command_request_id
          || state.context_ref !== request.context_ref
          || state.presentation_version !== request.presentation_version
          || state.prepared_preview_digest !== request.prepared_preview_digest
          || state.resolution_ref !== authority.resolution_ref
          || state.scope_version !== authority.scope_version) {
          return { status: "invalid", reason_code: "token_mismatch" };
        }
        const facts = await transaction.familyCare.loadParentCommunicationSendFacts({
          workspace_id: request.workspace_id,
          authority,
        });
        if (!facts.current) return { status: "blocked", reason_code: "access_changed" };
        const consumed = await transaction.interactionContexts.consume({
          workspace_id: request.workspace_id,
          context_id: classified.context.id,
          expected_version: classified.context.version,
          consumed_at: this.now().toISOString(),
        });
        if (!consumed) return { status: "blocked", reason_code: "token_replayed" };
        prepared = state;
        return { status: "ready" };
      },
      apply: async (transaction) => {
        if (!prepared || !transaction.familyCare?.applyG2Submit) {
          throw new Error("parent communication apply port unavailable");
        }
        const applied = await transaction.familyCare.applyG2Submit({
          workspace_id: request.workspace_id,
          participant_id: authority.participant_id,
          enrollment_id: authority.enrollment_ref,
          guardian_role_assignment_id: authority.guardian_role_assignment_id,
          child_care_process_id: authority.child_care_process_ref,
          family_id: authority.family_ref,
          care_group_id: authority.care_group_ref,
          thread_id: authority.thread_ref,
          grant_id: authority.grant_ref,
          expected_thread_version: authority.thread_version,
          body_envelope: prepared.protected_content_envelope,
          safe_summary: "家长新消息",
        });
        const committed: CommittedResult = {
          schema_version: 1,
          message_ref: this.publicRef(request, "message", applied.message_ref.object_id),
          receipt_ref: this.publicRef(request, "receipt", applied.receipt_ref.object_id),
          committed_at: this.now().toISOString(),
        };
        return {
          output_refs: [
            applied.message_ref,
            applied.item_ref,
            applied.item_event_ref,
            applied.receipt_ref,
            applied.attention_ref,
          ] satisfies CanonicalRef[],
          result_schema_version: 1,
          committed_result: committed,
        };
      },
    };
    const result = await this.deps.commands.execute({
      workspace_id: request.workspace_id,
      invocation_request_id: request.host_request_id,
      command_request_id: request.command_request_id,
      business_actor_ref: authority.participant_id,
      child_care_process_id: authority.child_care_process_ref,
      payload: {
        context_ref: request.context_ref,
        presentation_version: request.presentation_version,
        prepared_preview_digest: request.prepared_preview_digest,
        // The generic command ledger is workspace-scoped. Bind this command
        // hash to the current actor without persisting a public raw row id so
        // another guardian cannot obtain an exact replay by reusing ids.
        actor_binding_ref: this.publicRef(
          request,
          "actor",
          authority.participant_id,
        ),
      },
      spec,
    });
    if (result.status === "outcome_unknown") {
      return outcomeUnknown(request.command_request_id);
    }
    if (result.status === "ok") {
      const committed = parseCommittedResult(result.committed_result);
      if (!committed) return outcomeUnknown(request.command_request_id);
      return {
        status: "committed",
        execution_disposition: result.disposition,
        command_request_id: request.command_request_id,
        message_ref: committed.message_ref,
        receipt_ref: committed.receipt_ref,
        committed_at: committed.committed_at,
      };
    }
    return mapNotCommitted(request.command_request_id, result.reason_code);
  }

  private binding(
    operation: ParentCommunicationOwnerOperation,
    request: ParentCommunicationOwnerRequestV1,
    authority: ParentCommunicationResolvedAuthorityV1,
    presentationVersion: string,
  ): object {
    return {
      owner_resolution: {
        presentation_role: "parent",
        scope_kind: "parent_communication",
        context_ref: request.context_ref,
        resolution_ref: authority.resolution_ref,
        scope_version: authority.scope_version,
      },
      cache_partition: {
        interface_key: PARENT_COMMUNICATION_OWNER_INTERFACE.key,
        interface_version: PARENT_COMMUNICATION_OWNER_INTERFACE.version,
        contract_digest: PARENT_COMMUNICATION_OWNER_INTERFACE.digest,
        workspace_id: request.workspace_id,
        my_chat_user_id: request.my_chat_user_id,
        context_ref: request.context_ref,
        resolution_ref: authority.resolution_ref,
        scope_version: authority.scope_version,
        operation,
        presentation_version: presentationVersion,
        expires_at: new Date(this.now().getTime() + CACHE_TTL_MS).toISOString(),
      },
    };
  }

  private publicRef(
    request: { workspace_id: string; my_chat_user_id: string; context_ref: string },
    kind: string,
    canonicalId: string,
  ): string {
    return createHmac("sha256", this.deps.integrityKey)
      .update(
        `nurture.parent-communication-ref.v1\0${request.workspace_id}\0${request.my_chat_user_id}\0${request.context_ref}\0${kind}\0${canonicalId}`,
        "utf8",
      )
      .digest("hex");
  }
}

type AsyncEntry = { generation: number; context_ref: string; touched_at: number };

export class LatestParentCommunicationAsyncBoundary implements ParentCommunicationAsyncBoundaryV1 {
  private readonly entries = new Map<string, AsyncEntry>();

  constructor(
    private readonly now: () => Date = () => new Date(),
    private readonly maxEntries = 2_000,
    private readonly ttlMs = 10 * 60_000,
  ) {
    if (!Number.isSafeInteger(maxEntries) || maxEntries < 1 || ttlMs < 1) {
      throw new Error("invalid parent communication async boundary limits");
    }
  }

  async capture(input: {
    operation: ParentCommunicationOwnerOperation;
    workspace_id: string;
    my_chat_user_id: string;
    host_request_id: string;
    context_ref: string;
  }): Promise<Readonly<{ response_generation: number }>> {
    this.prune();
    const key = asyncKey(input);
    const previous = this.entries.get(key);
    const generation = (previous?.generation ?? 0) + 1;
    // Map insertion order is the eviction order. Refreshing an active key
    // must move it to the tail or a frequently used entry can be evicted as
    // if it were the oldest one.
    this.entries.delete(key);
    this.entries.set(key, {
      generation,
      context_ref: input.context_ref,
      touched_at: this.now().getTime(),
    });
    this.trim();
    return { response_generation: generation };
  }

  async current(input: {
    operation: ParentCommunicationOwnerOperation;
    workspace_id: string;
    my_chat_user_id: string;
    host_request_id: string;
  }): Promise<Readonly<{ active_generation: number; active_context_ref: string }>> {
    this.prune();
    const entry = this.entries.get(asyncKey(input));
    if (!entry) throw new Error("parent communication async generation missing");
    return {
      active_generation: entry.generation,
      active_context_ref: entry.context_ref,
    };
  }

  private prune(): void {
    const cutoff = this.now().getTime() - this.ttlMs;
    for (const [key, entry] of this.entries) {
      if (entry.touched_at <= cutoff) this.entries.delete(key);
    }
  }

  private trim(): void {
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value as string | undefined;
      if (!oldest) return;
      this.entries.delete(oldest);
    }
  }
}

const asyncKey = (input: {
  operation: ParentCommunicationOwnerOperation;
  workspace_id: string;
  my_chat_user_id: string;
}): string => `${input.workspace_id}\0${input.my_chat_user_id}\0${input.operation}`;

const digestPreview = (preview: unknown): string =>
  `sha256:${createHash("sha256").update(nurtureCanonicalJson(preview), "utf8").digest("hex")}`;

const presentationVersionFor = (
  authority: ParentCommunicationResolvedAuthorityV1,
  presentationHead: string,
): string => `pc-${createHash("sha256")
  .update(`${authority.resolution_ref}\0${authority.scope_version}\0${presentationHead}`, "utf8")
  .digest("hex")
  .slice(0, 24)}`;

const parsePreparedState = (value: unknown): PreparedState | null => {
  if (!isRecord(value)
    || value.schema_version !== 1
    || typeof value.command_request_id !== "string"
    || typeof value.context_ref !== "string"
    || typeof value.presentation_version !== "string"
    || typeof value.prepared_preview_digest !== "string"
    || typeof value.resolution_ref !== "string"
    || !Number.isSafeInteger(value.scope_version)) return null;
  try {
    return {
      schema_version: 1,
      command_request_id: value.command_request_id,
      context_ref: value.context_ref,
      presentation_version: value.presentation_version,
      prepared_preview_digest: value.prepared_preview_digest,
      resolution_ref: value.resolution_ref,
      scope_version: value.scope_version as number,
      protected_content_envelope: assertProtectedContentEnvelopeV1(
        value.protected_content_envelope,
      ),
    };
  } catch {
    return null;
  }
};

const parseCommittedResult = (value: unknown): CommittedResult | null =>
  isRecord(value)
  && value.schema_version === 1
  && typeof value.message_ref === "string" && /^[a-f0-9]{64}$/u.test(value.message_ref)
  && typeof value.receipt_ref === "string" && /^[a-f0-9]{64}$/u.test(value.receipt_ref)
  && typeof value.committed_at === "string"
  && !Number.isNaN(Date.parse(value.committed_at))
    ? value as CommittedResult
    : null;

const mapNotCommitted = (commandId: string, reason: string): unknown => {
  if (reason === "access_changed") return notCommitted(commandId, "access_changed", "resolve_context_again");
  if (reason === "token_expired") return notCommitted(commandId, "confirmation_expired", "refresh_presentation");
  if (reason === "token_replayed") return notCommitted(commandId, "confirmation_replayed", "none");
  if (reason === "token_mismatch" || reason === "token_revoked") return notCommitted(commandId, "invalid_confirmation", "none");
  if (reason === "command_write_conflict"
    || reason === "command_lookup_failed"
    || reason === "command_busy"
    || reason === "command_execution_failed"
    || reason === "parent_communication_ports_unavailable") {
    return notCommitted(commandId, "message_rejected", "retry_same_command");
  }
  return notCommitted(commandId, "message_rejected", "edit_message");
};

const notCommitted = (commandId: string, reason: string, recovery: string): unknown => ({
  status: "not_committed",
  command_request_id: commandId,
  reason_code: reason,
  recovery,
});

const outcomeUnknown = (commandId: string): unknown => ({
  status: "outcome_unknown",
  command_request_id: commandId,
  reason_code: "send_outcome_unknown",
  recovery: "reconcile_same_command",
});

const masked = (contextRef: string, now: () => Date): unknown => ({
  status: "masked",
  context_ref: contextRef,
  masked_at: now().toISOString(),
  mask_signal: {
    kind: "mask",
    reason_code: "access_changed",
    purge_partition: true,
    content_masked: true,
    actions_disabled: true,
    media_access_invalidated: true,
  },
});

const unavailable = (
  contextRef: string,
  now: () => Date,
  reason: string,
  retryable: boolean,
): unknown => ({
  status: "unavailable",
  context_ref: contextRef,
  failed_at: now().toISOString(),
  reason_code: reason,
  retryable,
});

const displayText = (value: string, max: number, fallback: string): string => {
  const normalized = value
    .replace(/[\u0000-\u001f\u007f]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  const selected = normalized || fallback;
  if (selected.length <= max) return selected;
  const cut = selected.slice(0, max);
  const last = cut.charCodeAt(cut.length - 1);
  return last >= 0xd800 && last <= 0xdbff ? cut.slice(0, -1) : cut;
};

const boundedUnread = (value: number): number =>
  Number.isSafeInteger(value) ? Math.max(0, Math.min(999, value)) : 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
