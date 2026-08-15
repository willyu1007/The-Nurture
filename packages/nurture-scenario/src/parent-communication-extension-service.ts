import { createHash, createHmac, randomUUID } from "node:crypto";
import { nurtureCanonicalJson } from "./c30/canonical-json.js";
import type {
  NurtureCommandInput,
  NurtureCommandResult,
  NurtureCommandSpec,
} from "./domain/commands/command-kernel.js";
import { isNurtureCommandRetryable } from "./domain/commands/command-kernel.js";
import {
  classifyInteractionContextRow,
  hashScenarioToken,
  type NurtureInteractionContextService,
} from "./domain/interactions/interaction-context.js";
import {
  createRedactFamilyCareMessageSpec,
  type LifecycleFactsReadPort,
  type RedactFamilyCareMessageCommandV1,
} from "./harness/family-care-lifecycle-actions.js";
import type { G2MessageChangeFacts } from "./domain/institution/family-care-transaction.js";
import {
  PARENT_COMMUNICATION_EXTENSION_INTERFACE,
  type ParentCommunicationExtensionOperation,
} from "./parent-communication-extension-contract.js";
import type {
  ParentCommunicationAuthorityResolverV1,
  ParentCommunicationResolvedAuthorityV1,
} from "./parent-communication-owner-contract.js";
import type { ParentContextSelectionV1 } from "./parent-context-selection-contract.js";
import {
  presentationVersionFor,
  type ParentCommunicationOwnerReadPortV1,
} from "./parent-communication-owner-service.js";

/**
 * W11 real-owner service for `nurture.parent-communication-owner@1.1.0` —
 * the additive guardian extension. Authority, presentation identity and
 * message refs come from the SAME machinery the frozen v1 owner uses (the
 * v1 resolver, the v1 read port and the v1 ref derivation), so a ref the
 * v1 detail issued resolves here and nothing about the v1 surface moves.
 * The commit rides the frozen G4-C author-redaction spec on the generic
 * ledger with the W7 actor HMAC folded into the canonical payload.
 */

const CACHE_TTL_MS = 5 * 60_000;
const CONFIRMATION_TTL_MS = 5 * 60_000;
const REPLY_CAP = 99;

type BaseRequestV1 = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
  message_ref: string;
}>;

export type ParentCommunicationExtensionPreviewRequest = BaseRequestV1 &
  Readonly<{ presentation_version: string; command_request_id: string }>;
export type ParentCommunicationExtensionRedactRequest = BaseRequestV1 &
  Readonly<{
    presentation_version: string;
    command_request_id: string;
    confirmation_ref: string;
    prepared_preview_digest: string;
  }>;
export type ParentCommunicationExtensionReceiptRequest = BaseRequestV1;

export type ParentCommunicationExtensionServiceResolutionV1 = Readonly<{
  presentation_role: "parent";
  scope_kind: "parent_communication";
  context_ref: string;
  resolution_ref: string;
  scope_version: number;
  context_selection: ParentContextSelectionV1;
}>;

export type ParentCommunicationExtensionAuthorityDecisionV1 =
  | Readonly<{
      status: "resolved";
      owner_resolution: ParentCommunicationExtensionServiceResolutionV1;
    }>
  | Readonly<{ status: "closed"; response: unknown }>;

export interface ParentCommunicationExtensionAuthorityPortV1 {
  resolve(
    input: Readonly<{
      workspace_id: string;
      my_chat_user_id: string;
      host_request_id: string;
      context_ref: string;
      operation: ParentCommunicationExtensionOperation;
      message_ref: string;
      context_selection: ParentContextSelectionV1;
    }>,
  ): Promise<ParentCommunicationExtensionAuthorityDecisionV1>;
}

export interface ParentCommunicationExtensionOwnerPortV1 {
  redactionPreview(input: Readonly<{
    request: ParentCommunicationExtensionPreviewRequest;
    authority: ParentCommunicationExtensionServiceResolutionV1;
  }>): Promise<unknown>;
  redact(input: Readonly<{
    request: ParentCommunicationExtensionRedactRequest;
    authority: ParentCommunicationExtensionServiceResolutionV1;
  }>): Promise<unknown>;
  deliveryReceipt(input: Readonly<{
    request: ParentCommunicationExtensionReceiptRequest;
    authority: ParentCommunicationExtensionServiceResolutionV1;
  }>): Promise<unknown>;
}

export type ParentCommunicationExtensionServiceBindingV1 = Readonly<{
  authorityResolver: ParentCommunicationExtensionAuthorityPortV1;
  owner: ParentCommunicationExtensionOwnerPortV1;
}>;

// ---------------------------------------------------------------------------
// Owner-internal read facts.

export type ParentCommunicationRedactionImpactV1 = Readonly<{
  affected_reply_count: number;
  derived_record_present: boolean;
}>;

export type ParentCommunicationDeliveryAggregateV1 = Readonly<{
  delivery_state: "sent" | "delivered" | "read" | "not_applicable";
  advanced_at?: string;
}>;

export interface ParentCommunicationExtensionReadPortV1 {
  /** Every message id of the exact thread, terminal states included. */
  listThreadMessageIds(input: Readonly<{
    workspace_id: string;
    thread_id: string;
  }>): Promise<readonly string[]>;
  loadRedactionImpact(input: Readonly<{
    workspace_id: string;
    message_id: string;
  }>): Promise<ParentCommunicationRedactionImpactV1>;
  loadDeliveryAggregate(input: Readonly<{
    workspace_id: string;
    message_id: string;
  }>): Promise<ParentCommunicationDeliveryAggregateV1 | null>;
}

export type ParentCommunicationExtensionCommandRunnerV1 = Readonly<{
  execute<Input>(input: NurtureCommandInput<Input>): Promise<NurtureCommandResult>;
}>;

export type ParentCommunicationExtensionServiceDependenciesV1 = Readonly<{
  authority: ParentCommunicationAuthorityResolverV1;
  reads: ParentCommunicationOwnerReadPortV1;
  extensionReads: ParentCommunicationExtensionReadPortV1;
  messageFacts: LifecycleFactsReadPort;
  interactionContexts: NurtureInteractionContextService;
  commands: ParentCommunicationExtensionCommandRunnerV1;
  integrityKey: string;
  now?: () => Date;
  create_cascade_audit_id?: () => string;
}>;

// ---------------------------------------------------------------------------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

type PreparedRedactionState = Readonly<{
  schema_version: 1;
  command_request_id: string;
  context_ref: string;
  resolution_ref: string;
  scope_version: number;
  presentation_version: string;
  prepared_preview_digest: string;
  message_id: string;
  expected_message_version: number;
  cascade_audit_id: string;
  cascade_scope: "source_question" | "reply_local";
  /** The reply count the preview promised; the commit reports exactly it. */
  affected_reply_count: number;
}>;

const parsePreparedRedactionState = (
  value: unknown,
): PreparedRedactionState | null => {
  if (
    !isRecord(value)
    || value.schema_version !== 1
    || typeof value.command_request_id !== "string"
    || typeof value.context_ref !== "string"
    || typeof value.resolution_ref !== "string"
    || !Number.isSafeInteger(value.scope_version)
    || typeof value.presentation_version !== "string"
    || typeof value.prepared_preview_digest !== "string"
    || typeof value.message_id !== "string"
    || !Number.isSafeInteger(value.expected_message_version)
    || typeof value.cascade_audit_id !== "string"
    || (value.cascade_scope !== "source_question"
      && value.cascade_scope !== "reply_local")
    || !Number.isSafeInteger(value.affected_reply_count)
  ) {
    return null;
  }
  return value as unknown as PreparedRedactionState;
};

/** The frozen G4-C author-authority rule, restated over the facts read. */
const authorRedactionAuthorized = (facts: G2MessageChangeFacts): boolean =>
  facts.participant_active
  && facts.message_present
  && facts.writer_contract === "harness_g2_v1"
  && Boolean(facts.message_kind)
  && facts.exact_author
  && facts.same_side_reachable
  && Boolean(facts.current_author_role_assignment_id);

export const createParentCommunicationExtensionService = (
  deps: ParentCommunicationExtensionServiceDependenciesV1,
): ParentCommunicationExtensionServiceBindingV1 => {
  const now = deps.now ?? (() => new Date());
  if (deps.integrityKey.length < 32) {
    throw new Error(
      "Parent-communication extension integrity key must be at least 32 characters",
    );
  }

  // The exact v1 ref derivation, so refs the v1 detail issued resolve here.
  const publicRef = (
    request: Readonly<{
      workspace_id: string;
      my_chat_user_id: string;
      context_ref: string;
    }>,
    kind: string,
    canonicalId: string,
  ): string =>
    createHmac("sha256", deps.integrityKey)
      .update(
        `nurture.parent-communication-ref.v1\0${request.workspace_id}\0${request.my_chat_user_id}\0${request.context_ref}\0${kind}\0${canonicalId}`,
        "utf8",
      )
      .digest("hex");

  const actorBindingOf = (workspaceId: string, participantId: string): string =>
    createHmac("sha256", deps.integrityKey)
      .update(
        `nurture.parent-communication-extension-actor.v1\0${workspaceId}\0${participantId}`,
        "utf8",
      )
      .digest("hex");

  const digestOf = (value: unknown): string =>
    `sha256:${createHash("sha256")
      .update(nurtureCanonicalJson(value), "utf8")
      .digest("hex")}`;

  const masked = (
    contextRef: string,
    reason:
      | "access_changed"
      | "context_changed"
      | "ambiguous_context"
      | "protected_display_denied",
  ): unknown => ({
    status: "masked",
    context_ref: contextRef,
    masked_at: now().toISOString(),
    mask_signal: {
      kind: "mask",
      reason_code: reason,
      purge_partition: true,
      content_masked: true,
      actions_disabled: true,
      media_access_invalidated: true,
    },
  });

  const unavailable = (
    contextRef: string,
    reason: "content_unavailable" | "temporarily_unavailable",
  ): unknown => ({
    status: "unavailable",
    context_ref: contextRef,
    failed_at: now().toISOString(),
    reason_code: reason,
    retryable: reason === "temporarily_unavailable",
  });

  const notCommitted = (
    commandRequestId: string,
    reason:
      | "stale_confirmation"
      | "confirmation_expired"
      | "confirmation_foreign"
      | "preview_digest_mismatch"
      | "redaction_evidence_unavailable"
      | "command_payload_conflict",
  ): unknown => ({
    status: "not_committed",
    command_request_id: commandRequestId,
    reason_code: reason,
    recovery:
      reason === "command_payload_conflict"
        ? "new_command"
        : reason === "redaction_evidence_unavailable"
          ? "none"
          : "re_prepare",
  });

  const outcomeUnknown = (commandRequestId: string): unknown => ({
    status: "outcome_unknown",
    command_request_id: commandRequestId,
    reason_code: "redact_outcome_unknown",
    recovery: "reconcile_same_command",
  });

  type ResolvedWorld = Readonly<{
    authority: ParentCommunicationResolvedAuthorityV1;
    presentation_version: string;
    refreshed_at: string;
  }>;

  const resolveWorld = async (
    request: Readonly<{
      workspace_id: string;
      my_chat_user_id: string;
      host_request_id: string;
      context_ref: string;
      context_selection: ParentContextSelectionV1;
    }>,
  ): Promise<ResolvedWorld | { closed: unknown }> => {
    let resolved;
    try {
      resolved = await deps.authority.resolve({
        // Authority derivation is operation-independent in the v1 resolver;
        // the extension resolves through the same summary lens.
        operation: "summary_query",
        workspace_id: request.workspace_id,
        my_chat_user_id: request.my_chat_user_id,
        host_request_id: request.host_request_id,
        context_ref: request.context_ref,
        context_selection: request.context_selection,
      });
    } catch {
      return { closed: unavailable(request.context_ref, "temporarily_unavailable") };
    }
    if (resolved.status !== "resolved") {
      if (resolved.status === "temporarily_unavailable") {
        return {
          closed: unavailable(request.context_ref, "temporarily_unavailable"),
        };
      }
      const reason =
        resolved.status === "stale_context_ref"
          ? "context_changed"
          : resolved.status === "ambiguous_enrollment"
            ? "ambiguous_context"
            : "access_changed";
      return { closed: masked(request.context_ref, reason) };
    }
    const snapshot = await deps.reads.read({
      workspace_id: request.workspace_id,
      authority: resolved.authority,
      page_size: 1,
      include_detail: false,
    });
    if (snapshot.status === "scope_changed") {
      return { closed: masked(request.context_ref, "access_changed") };
    }
    return {
      authority: resolved.authority,
      presentation_version: presentationVersionFor(
        resolved.authority,
        snapshot.presentation_head,
      ),
      refreshed_at: snapshot.refreshed_at,
    };
  };

  const resolveMessageId = async (
    request: BaseRequestV1,
    authority: ParentCommunicationResolvedAuthorityV1,
  ): Promise<string | null> => {
    const ids = await deps.extensionReads.listThreadMessageIds({
      workspace_id: request.workspace_id,
      thread_id: authority.thread_ref,
    });
    return (
      ids.find((id) => publicRef(request, "message", id) === request.message_ref)
      ?? null
    );
  };

  const envelope = (
    request: BaseRequestV1,
    operation: "redaction_preview_query" | "delivery_receipt_query",
    world: ResolvedWorld,
  ) => ({
    owner_resolution: {
      presentation_role: "parent" as const,
      scope_kind: "parent_communication" as const,
      context_ref: request.context_ref,
      resolution_ref: world.authority.resolution_ref,
      scope_version: world.authority.scope_version,
    },
    cache_partition: {
      interface_key: PARENT_COMMUNICATION_EXTENSION_INTERFACE.key,
      interface_version: PARENT_COMMUNICATION_EXTENSION_INTERFACE.version,
      contract_digest: PARENT_COMMUNICATION_EXTENSION_INTERFACE.digest,
      workspace_id: request.workspace_id,
      my_chat_user_id: request.my_chat_user_id,
      context_ref: request.context_ref,
      resolution_ref: world.authority.resolution_ref,
      scope_version: world.authority.scope_version,
      operation,
      presentation_version: world.presentation_version,
      expires_at: new Date(now().getTime() + CACHE_TTL_MS).toISOString(),
    },
  });

  const authorityResolver: ParentCommunicationExtensionAuthorityPortV1 = {
    async resolve(input) {
      const world = await resolveWorld(input);
      if ("closed" in world) return { status: "closed", response: world.closed };
      return {
        status: "resolved",
        owner_resolution: {
          presentation_role: "parent",
          scope_kind: "parent_communication",
          context_ref: input.context_ref,
          resolution_ref: world.authority.resolution_ref,
          scope_version: world.authority.scope_version,
          context_selection: input.context_selection,
        },
      };
    },
  };

  const owner: ParentCommunicationExtensionOwnerPortV1 = {
    async redactionPreview({ request, authority }) {
      const world = await resolveWorld({
        ...request,
        context_selection: authority.context_selection,
      });
      if ("closed" in world) return world.closed;
      if (world.presentation_version !== request.presentation_version) {
        // A stale presentation cannot anchor an irreversible prepare; the
        // caller re-reads the v1 surface and prepares again.
        return masked(request.context_ref, "context_changed");
      }
      const messageId = await resolveMessageId(request, world.authority);
      if (!messageId) return masked(request.context_ref, "access_changed");
      const facts = await deps.messageFacts.loadG2MessageChangeFacts({
        workspace_id: request.workspace_id,
        participant_id: world.authority.participant_id,
        message_id: messageId,
      });
      if (!authorRedactionAuthorized(facts)) {
        return masked(request.context_ref, "access_changed");
      }
      if (facts.message_status !== "sent" && facts.message_status !== "redacted") {
        return unavailable(request.context_ref, "content_unavailable");
      }
      const impact = await deps.extensionReads.loadRedactionImpact({
        workspace_id: request.workspace_id,
        message_id: messageId,
      });
      const preview = {
        message_ref: request.message_ref,
        cascade_scope:
          facts.message_kind === "family_message"
            ? ("source_question" as const)
            : ("reply_local" as const),
        affected_reply_count: Math.min(
          Math.max(impact.affected_reply_count, 0),
          REPLY_CAP,
        ),
        derived_record_present: impact.derived_record_present,
        effect: "redact_family_care_message_irreversibly" as const,
      };
      const preparedPreviewDigest = digestOf(preview);
      const issued = await deps.interactionContexts.issue({
        workspace_id: request.workspace_id,
        participant_id: world.authority.participant_id,
        purpose: "prepare_action",
        surface: "parent_communication_extension",
        host_conversation_ref: request.command_request_id,
        payload_schema_version: 1,
        state_payload: {
          schema_version: 1,
          command_request_id: request.command_request_id,
          context_ref: request.context_ref,
          resolution_ref: world.authority.resolution_ref,
          scope_version: world.authority.scope_version,
          presentation_version: world.presentation_version,
          prepared_preview_digest: preparedPreviewDigest,
          message_id: messageId,
          expected_message_version: facts.message_version ?? 0,
          cascade_audit_id: (deps.create_cascade_audit_id ?? randomUUID)(),
          cascade_scope: preview.cascade_scope,
          affected_reply_count: preview.affected_reply_count,
        } satisfies PreparedRedactionState,
        ttl_ms: CONFIRMATION_TTL_MS,
      });
      return {
        status: "ready_to_confirm",
        command_request_id: request.command_request_id,
        confirmation_ref: issued.token,
        prepared_preview_digest: preparedPreviewDigest,
        expires_at: issued.expires_at,
        presentation_version: world.presentation_version,
        preview,
        ...envelope(request, "redaction_preview_query", world),
      };
    },

    async redact({ request, authority }) {
      const world = await resolveWorld({
        ...request,
        context_selection: authority.context_selection,
      });
      if ("closed" in world) return world.closed;
      const participantId = world.authority.participant_id;
      const messageId = await resolveMessageId(request, world.authority);
      if (!messageId) return masked(request.context_ref, "access_changed");

      // The W8 confirm discipline: the command identity is the confirmation
      // digest, and the confirmation is verified and consumed INSIDE the
      // command transaction — an exact replay short-circuits on the ledger
      // and never needs the consumed confirmation again.
      const base = createRedactFamilyCareMessageSpec("author", {
        integrity_key: deps.integrityKey,
      });
      const actorBinding = actorBindingOf(request.workspace_id, participantId);
      const redactedAt = now().toISOString();
      let prepared: PreparedRedactionState | undefined;
      const commandOf = (
        state: PreparedRedactionState,
      ): RedactFamilyCareMessageCommandV1 => ({
        message_id: state.message_id,
        expected_message_version: state.expected_message_version,
        cascade_audit_id: state.cascade_audit_id,
        cascade_scope: state.cascade_scope,
        actor_kind: "author",
      });
      const spec: NurtureCommandSpec<Record<string, unknown>> = {
        command_key: "parent_communication_extension_redact",
        command_scope: "parent_communication_extension",
        contract_version: 1,
        canonicalize: (payload) => payload,
        checkPreconditions: async (transaction, _input, context) => {
          if (!transaction.interactionContexts) {
            return {
              status: "blocked",
              reason_code: "parent_communication_extension_ports_unavailable",
            };
          }
          const row = await transaction.interactionContexts.findByTokenHash({
            workspace_id: request.workspace_id,
            token_hash: hashScenarioToken(
              request.workspace_id,
              request.confirmation_ref,
            ),
          });
          const classified = classifyInteractionContextRow(
            row,
            {
              workspace_id: request.workspace_id,
              participant_id: participantId,
              purpose: "prepare_action",
              surface: "parent_communication_extension",
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
          const state = parsePreparedRedactionState(
            classified.context.state_payload,
          );
          if (
            !state
            || state.command_request_id !== request.command_request_id
            || state.context_ref !== request.context_ref
            || state.message_id !== messageId
          ) {
            return { status: "blocked", reason_code: "confirmation_foreign" };
          }
          if (state.prepared_preview_digest !== request.prepared_preview_digest) {
            return { status: "blocked", reason_code: "preview_digest_mismatch" };
          }
          if (
            state.resolution_ref !== world.authority.resolution_ref
            || state.scope_version !== world.authority.scope_version
            || state.presentation_version !== request.presentation_version
          ) {
            return { status: "conflict", reason_code: "stale_confirmation" };
          }
          // The frozen preconditions run BEFORE the consume: a refusal must
          // leave the guardian's confirmation intact for its re-prepare.
          const decision = await base.checkPreconditions(
            transaction,
            commandOf(state),
            context,
          );
          if (decision.status === "already_satisfied") {
            return {
              ...decision,
              committed_result: {
                ...(isRecord(decision.committed_result)
                  ? decision.committed_result
                  : {}),
                extensionMessageRef: publicRef(request, "message", state.message_id),
              },
            };
          }
          if (decision.status !== "ready") return decision;
          const consumed = await transaction.interactionContexts.consume({
            workspace_id: request.workspace_id,
            context_id: classified.context.id,
            expected_version: classified.context.version,
            consumed_at: now().toISOString(),
          });
          if (!consumed) {
            return { status: "blocked", reason_code: "confirmation_foreign" };
          }
          prepared = state;
          return { status: "ready" };
        },
        // Enrich the recorded result with the instant and the cascade size
        // (the base result carries refs only); replays then answer the
        // original apply evidence, and already_satisfied never fabricates
        // one (its result comes from the base precondition branch).
        apply: async (transaction, _input, context) => {
          if (!prepared) {
            throw new Error("parent-communication extension apply state unavailable");
          }
          const command = commandOf(prepared);
          const effect = await base.apply(transaction, command, context);
          return {
            ...effect,
            committed_result: {
              ...(isRecord(effect.committed_result) ? effect.committed_result : {}),
              redactedAt,
              cascadeScope: prepared.cascade_scope,
              // The count the preview promised — never the internal cascade
              // fan-out, which would leak the recipient/receipt shape.
              affectedCount: Math.min(
                Math.max(prepared.affected_reply_count, 0),
                REPLY_CAP,
              ),
              // The recorded message identity: an exact replay must answer
              // the message it redacted, whatever ref a retry names.
              extensionMessageRef: publicRef(request, "message", prepared.message_id),
            },
          };
        },
        afterExecutionCreated: async (transaction, _input, context, applied) => {
          if (!base.afterExecutionCreated) return;
          if (!prepared) return;
          await base.afterExecutionCreated(
            transaction,
            commandOf(prepared),
            context,
            applied,
          );
        },
      };
      const result = await deps.commands.execute({
        workspace_id: request.workspace_id,
        invocation_request_id: request.host_request_id,
        command_request_id: request.command_request_id,
        business_actor_ref: participantId,
        payload: {
          confirmation_digest: digestOf({
            confirmation_ref: request.confirmation_ref,
            prepared_preview_digest: request.prepared_preview_digest,
          }),
          actor_binding_ref: actorBinding,
        },
        spec,
      });
      if (result.status === "outcome_unknown") {
        return outcomeUnknown(request.command_request_id);
      }
      if (result.status === "ok") {
        const committed = isRecord(result.committed_result)
          ? result.committed_result
          : undefined;
        // The ledger replays by command identity alone; the recorded result
        // names the message the command actually touched. A retry naming a
        // different message must be refused, never confirmed against it.
        if (
          typeof committed?.extensionMessageRef === "string"
          && committed.extensionMessageRef !== request.message_ref
        ) {
          return notCommitted(
            request.command_request_id,
            "command_payload_conflict",
          );
        }
        if (result.business_outcome === "already_satisfied") {
          return {
            status: "committed",
            execution_disposition: result.disposition,
            disposition: "already_satisfied",
            command_request_id: request.command_request_id,
            message_ref: request.message_ref,
          };
        }
        if (!committed || typeof committed.redactedAt !== "string") {
          return outcomeUnknown(request.command_request_id);
        }
        const affected = Number(committed.affectedCount);
        return {
          status: "committed",
          execution_disposition: result.disposition,
          disposition: "applied",
          command_request_id: request.command_request_id,
          message_ref: request.message_ref,
          redacted_at: committed.redactedAt,
          cascade: {
            scope:
              committed.cascadeScope === "reply_local"
                ? "reply_local"
                : "source_question",
            affected_count: Number.isSafeInteger(affected)
              ? Math.min(Math.max(affected, 0), REPLY_CAP)
              : 0,
          },
        };
      }
      if (result.decision === "idempotency_conflict") {
        return notCommitted(request.command_request_id, "command_payload_conflict");
      }
      if (
        result.reason_code === "confirmation_expired"
        || result.reason_code === "confirmation_foreign"
        || result.reason_code === "preview_digest_mismatch"
        || result.reason_code === "stale_confirmation"
        || result.reason_code === "redaction_evidence_unavailable"
      ) {
        return notCommitted(request.command_request_id, result.reason_code);
      }
      if (result.reason_code === "not_authorized") {
        return masked(request.context_ref, "access_changed");
      }
      if (isNurtureCommandRetryable(result)) {
        // Rolled-back write conflicts and busy locks left the confirmation
        // unconsumed; the same command is safe to retry.
        return unavailable(request.context_ref, "temporarily_unavailable");
      }
      return unavailable(request.context_ref, "content_unavailable");
    },

    async deliveryReceipt({ request, authority }) {
      const world = await resolveWorld({
        ...request,
        context_selection: authority.context_selection,
      });
      if ("closed" in world) return world.closed;
      const messageId = await resolveMessageId(request, world.authority);
      if (!messageId) return masked(request.context_ref, "access_changed");
      const aggregate = await deps.extensionReads.loadDeliveryAggregate({
        workspace_id: request.workspace_id,
        message_id: messageId,
      });
      if (!aggregate) {
        return unavailable(request.context_ref, "content_unavailable");
      }
      return {
        status: "ready",
        message_ref: request.message_ref,
        delivery: {
          delivery_state: aggregate.delivery_state,
          ...(aggregate.advanced_at ? { advanced_at: aggregate.advanced_at } : {}),
        },
        presentation_version: world.presentation_version,
        refreshed_at: world.refreshed_at,
        ...envelope(request, "delivery_receipt_query", world),
      };
    },
  };

  return { authorityResolver, owner };
};
