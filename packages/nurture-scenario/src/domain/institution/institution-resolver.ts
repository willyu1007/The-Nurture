import { createHash, randomBytes } from "node:crypto";
import {
  NurtureInteractionContextService,
  type NurtureInteractionPurpose,
} from "../interactions/interaction-context.js";
import {
  resolveCandidates,
  isResolutionCandidate,
  type ResolutionCandidate,
  type ResolutionKernelResult,
} from "../resolution/candidate-kernel.js";
import type {
  NurtureActorBinding,
  NurtureGrantDataClass,
  NurtureGrantDirection,
  NurtureInstitutionContextRepository,
  NurtureParticipantFact,
  NurtureResolvedContext,
  NurtureResolutionSourceKey,
} from "./institution-context.js";

export type NurtureHostInvocationEnvelope = {
  host: {
    my_chat_user_id: string;
    workspace_id?: string;
    scenario_key: string;
    surface: string;
    host_request_id: string;
    submitted_at?: string;
    locale?: string;
    time_zone?: string;
  };
  conversation?: {
    host_conversation_ref?: string;
    host_turn_id?: string;
    previous_turn_ref?: string;
  };
  event: {
    kind:
      | "chat_message"
      | "surface_open"
      | "scenario_token_event"
      | "form_submit"
      | "notification_open";
  };
  payload?: {
    text?: string;
    structured_payload?: Record<string, unknown>;
    form_data?: Record<string, unknown>;
    attachment_refs?: unknown[];
  };
  scenario_token?: {
    token: string;
    purpose: NurtureInteractionPurpose;
  };
  display_state?: {
    selected_view_key?: string;
    filters?: Record<string, unknown>;
    sort?: Record<string, unknown>;
    pagination?: Record<string, unknown>;
    client_local_context?: Record<string, unknown>;
  };
  idempotency?: {
    host_request_id?: string;
    client_mutation_id?: string;
    attempt_key?: string;
  };
};

export type NurtureStructuredInteraction =
  | {
      kind: "single_choice";
      title: string;
      description?: string;
      options: Array<{ option_token: string; label: string; description?: string }>;
    }
  | {
      kind: "text_input";
      title: string;
      description: string;
      fields: Array<{ field_key: "context_detail"; label: string; type: "text"; required: true }>;
    };

export type NurtureResolverResult =
  | { status: "resolved"; context: NurtureResolvedContext }
  | {
      status: "needs_clarification";
      scenario_token: { token: string; purpose: "clarify"; expires_at: string };
      interaction: NurtureStructuredInteraction;
      safe_state: {
        reason_code: "ambiguous_context" | "weak_context" | "candidate_limit_exceeded";
        can_skip: false;
      };
    }
  | {
      status: "blocked";
      reason_code:
        | "invalid_host_envelope"
        | "resolver_unavailable"
        | "participant_missing"
        | "role_missing"
        | "role_revoked"
        | "scope_mismatch"
        | "child_not_visible"
        | "grant_missing"
        | "grant_revoked"
        | "enrollment_inactive"
        | "thread_inactive"
        | "message_redacted"
        | "token_expired"
        | "token_replayed"
        | "token_mismatch"
        | "token_revoked"
        | "no_reachable_context";
      safe_user_state: "unavailable" | "access_changed";
    };

export type NurtureResolutionSourceAdapter = {
  source_key: NurtureResolutionSourceKey;
  load(input: {
    envelope: NurtureHostInvocationEnvelope;
    participant: NurtureParticipantFact;
    actor_bindings: NurtureActorBinding[];
    intent_key: string;
    at: string;
    limit: number;
  }): Promise<ResolutionCandidate[]>;
};

const FORBIDDEN_HOST_KEYS = new Set([
  "targetref",
  "workscopehint",
  "selectedroleassignmentid",
  "childcareprocessid",
  "familyid",
  "caregroupid",
  "institutionid",
  "grantid",
  "dataclass",
  "direction",
  "policydecision",
  "canview",
  "canwrite",
]);

const containsForbiddenHostKey = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(containsForbiddenHostKey);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value as Record<string, unknown>).some(
    ([key, nested]) =>
      FORBIDDEN_HOST_KEYS.has(key.replace(/[_-]/g, "").toLowerCase()) ||
      containsForbiddenHostKey(nested),
  );
};

const hashOptionToken = (workspaceId: string, optionToken: string): string =>
  createHash("sha256")
    .update(`nurture.resolver-option.v1\0${workspaceId}\0${optionToken}`, "utf8")
    .digest("hex");

const inferIntent = (input: NurtureHostInvocationEnvelope): string => {
  switch (input.display_state?.selected_view_key) {
    case "class_family_inbox":
      return "open_class_family_inbox";
    case "teacher_attention_board":
      return "open_today_attention_board";
    default:
      return "continue_nurture_work";
  }
};

const inferDistribution = (
  intentKey: string,
): { data_class?: NurtureGrantDataClass; direction?: NurtureGrantDirection } => {
  if (intentKey === "open_class_family_inbox") return { direction: "family_to_org" };
  return {};
};

const bindingSupportsIntent = (binding: NurtureActorBinding, intentKey: string): boolean => {
  if (intentKey === "open_class_family_inbox" || intentKey === "open_today_attention_board") {
    return (
      ["caregiver", "lead_caregiver", "institution_admin"].includes(binding.role_kind) &&
      ["care_group", "institution"].includes(binding.work_scope.kind)
    );
  }
  return true;
};

const scopeCandidate = (
  binding: NurtureActorBinding,
  intentKey: string,
  exactSurfaceIntent: boolean,
): ResolutionCandidate => ({
  candidate_key: `scope:${binding.actor_binding_ref}:${intentKey}`,
  actor_binding_ref: binding.actor_binding_ref,
  scope_ref: {
    kind: binding.work_scope.kind,
    id:
      binding.work_scope.child_care_process_id ??
      binding.work_scope.family_id ??
      binding.work_scope.care_group_id ??
      binding.work_scope.institution_id ??
      binding.scope_id,
  },
  intent_key: intentKey,
  source_key: "surface_default",
  state_class: "active_context",
  match_class: exactSurfaceIntent ? "exact_entities" : "weak_recent_context",
  evidence_codes: [exactSurfaceIntent ? "selected_view" : "active_role_scope"],
  dedupe_key: `scope:${binding.actor_binding_ref}:${intentKey}`,
  safe_label:
    binding.safe_scope_label ??
    (binding.work_scope.kind === "care_group"
      ? "Current care group"
      : binding.work_scope.kind === "institution"
        ? "Current institution"
        : "Current care context"),
});

type ResolverClarificationState = {
  kind: "resolver_clarification_v1";
  intent_key: string;
  options: Array<{ option_token_hash: string; candidate: ResolutionCandidate }>;
  narrowing_required: boolean;
};

const parseClarificationState = (value: unknown): ResolverClarificationState | null => {
  if (!value || typeof value !== "object") return null;
  const state = value as Partial<ResolverClarificationState>;
  if (
    state.kind !== "resolver_clarification_v1" ||
    typeof state.intent_key !== "string" ||
    !Array.isArray(state.options) ||
    typeof state.narrowing_required !== "boolean"
  ) {
    return null;
  }
  for (const option of state.options) {
    if (
      !option ||
      typeof option !== "object" ||
      !/^[0-9a-f]{64}$/.test((option as { option_token_hash?: string }).option_token_hash ?? "") ||
      !isResolutionCandidate((option as { candidate?: ResolutionCandidate }).candidate)
    ) {
      return null;
    }
  }
  return state as ResolverClarificationState;
};

export const createNurtureResolutionSourceAdapters = (
  repository: NurtureInstitutionContextRepository,
): NurtureResolutionSourceAdapter[] =>
  (["family_care_item", "teacher_attention_item", "family_care_thread"] as const).map(
    (sourceKey) => ({
      source_key: sourceKey,
      load: (input) =>
        repository.listResolutionCandidates({
          workspace_id: input.envelope.host.workspace_id!,
          participant: input.participant,
          actor_bindings: input.actor_bindings,
          source_key: sourceKey,
          intent_key: input.intent_key,
          query_text:
            input.envelope.payload?.text ??
            (typeof input.envelope.payload?.form_data?.context_detail === "string"
              ? input.envelope.payload.form_data.context_detail
              : undefined),
          at: input.at,
          limit: input.limit,
        }),
    }),
  );

const changedReason = new Set([
  "role_revoked",
  "grant_revoked",
  "enrollment_inactive",
  "message_redacted",
  "token_replayed",
  "token_revoked",
]);

export class NurtureInstitutionResolver {
  private readonly sources: NurtureResolutionSourceAdapter[];

  constructor(
    private readonly repository: NurtureInstitutionContextRepository,
    private readonly interactions: NurtureInteractionContextService,
    sources?: NurtureResolutionSourceAdapter[],
    private readonly options: {
      now?: () => Date;
      generate_option_token?: () => string;
      source_limit?: number;
      aggregate_candidate_limit?: number;
      rendered_option_limit?: number;
      clarification_ttl_ms?: number;
      issue_clarification?: boolean;
    } = {},
  ) {
    this.sources = sources ?? createNurtureResolutionSourceAdapters(repository);
  }

  private toBlocked(
    reasonCode: Extract<NurtureResolverResult, { status: "blocked" }>["reason_code"],
  ): Extract<NurtureResolverResult, { status: "blocked" }> {
    return {
      status: "blocked",
      reason_code: reasonCode,
      safe_user_state: changedReason.has(reasonCode) ? "access_changed" : "unavailable",
    };
  }

  private toContext(input: {
    participant: NurtureParticipantFact;
    binding: NurtureActorBinding;
    candidate: ResolutionCandidate;
    interaction_context_id?: string;
  }): NurtureResolvedContext {
    const distribution = inferDistribution(input.candidate.intent_key);
    return {
      actor: {
        participant_id: input.participant.participant_id,
        my_chat_user_id: input.participant.my_chat_user_id,
        role_assignment_id: input.binding.role_assignment_id,
        role_kind: input.binding.role_kind,
        scope_type: input.binding.scope_type,
        scope_id: input.binding.scope_id,
      },
      work_scope: input.binding.work_scope,
      ...(input.candidate.target_ref
        ? {
            target: {
              object_type: input.candidate.target_ref.object_type,
              object_id: input.candidate.target_ref.object_id,
              lifecycle_state: input.candidate.target_ref.lifecycle_state,
              ...(input.candidate.target_ref.child_care_process_id
                ? { child_care_process_id: input.candidate.target_ref.child_care_process_id }
                : {}),
            },
          }
        : {}),
      continuity: {
        ...(input.interaction_context_id
          ? { nurture_interaction_context_id: input.interaction_context_id }
          : {}),
        pending_intent: input.candidate.intent_key,
      },
      policy_seed: {
        action_key: input.candidate.intent_key,
        ...distribution,
      },
    };
  }

  private async issueClarification(input: {
    envelope: NurtureHostInvocationEnvelope;
    participant: NurtureParticipantFact;
    kernel: Extract<ResolutionKernelResult, { status: "needs_clarification" }>;
    intent_key: string;
  }): Promise<Extract<NurtureResolverResult, { status: "needs_clarification" }>> {
    const workspaceId = input.envelope.host.workspace_id!;
    const optionRows = input.kernel.candidates.map((rawCandidate) => {
      const compact = (value: string, maxLength: number): string =>
        value.replace(/\s+/g, " ").trim().slice(0, maxLength);
      const candidate: ResolutionCandidate = {
        ...rawCandidate,
        safe_label: compact(rawCandidate.safe_label, 120),
        ...(rawCandidate.safe_description
          ? { safe_description: compact(rawCandidate.safe_description, 240) }
          : {}),
        evidence_codes: rawCandidate.evidence_codes.slice(0, 16),
      };
      const optionToken = (this.options.generate_option_token ?? (() => randomBytes(24).toString("base64url")))();
      if (!/^[A-Za-z0-9_-]{24,256}$/.test(optionToken)) {
        throw new Error("resolver option token generator returned an unsafe token");
      }
      return {
        option_token: optionToken,
        option_token_hash: hashOptionToken(workspaceId, optionToken),
        candidate,
      };
    });
    const issued = await this.interactions.issue({
      workspace_id: workspaceId,
      participant_id: input.participant.participant_id,
      purpose: "clarify",
      surface: input.envelope.host.surface,
      host_conversation_ref: input.envelope.conversation?.host_conversation_ref,
      payload_schema_version: 1,
      state_payload: {
        kind: "resolver_clarification_v1",
        intent_key: input.intent_key,
        options: optionRows.map(({ option_token_hash, candidate }) => ({
          option_token_hash,
          candidate,
        })),
        narrowing_required: input.kernel.reason_code === "candidate_limit_exceeded",
      } satisfies ResolverClarificationState,
      ttl_ms: this.options.clarification_ttl_ms ?? 5 * 60_000,
    });
    const interaction: NurtureStructuredInteraction =
      optionRows.length > 0
        ? {
            kind: "single_choice",
            title: "Choose the care context",
            options: optionRows.map(({ option_token, candidate }) => ({
              option_token,
              label: candidate.safe_label,
              ...(candidate.safe_description
                ? { description: candidate.safe_description }
                : {}),
            })),
          }
        : {
            kind: "text_input",
            title: "Narrow the care context",
            description: "Add a child, class, date, or topic so the current context can be resolved safely.",
            fields: [
              {
                field_key: "context_detail",
                label: "Child, class, date, or topic",
                type: "text",
                required: true,
              },
            ],
          };
    return {
      status: "needs_clarification",
      scenario_token: { token: issued.token, purpose: "clarify", expires_at: issued.expires_at },
      interaction,
      safe_state: { reason_code: input.kernel.reason_code, can_skip: false },
    };
  }

  private async resolveToken(
    envelope: NurtureHostInvocationEnvelope,
    participant: NurtureParticipantFact,
  ): Promise<NurtureResolverResult> {
    const workspaceId = envelope.host.workspace_id!;
    const scenarioToken = envelope.scenario_token!;
    const classified = await this.interactions.classify({
      workspace_id: workspaceId,
      token: scenarioToken.token,
      participant_id: participant.participant_id,
      purpose: scenarioToken.purpose,
      surface: envelope.host.surface,
      host_conversation_ref: envelope.conversation?.host_conversation_ref,
    });
    if (classified.status !== "current") return this.toBlocked(classified.reason_code);
    const state = parseClarificationState(classified.context.state_payload);
    if (!state || scenarioToken.purpose !== "clarify") return this.toBlocked("token_mismatch");

    if (state.narrowing_required) {
      const detail = envelope.payload?.form_data?.context_detail;
      if (typeof detail !== "string" || detail.trim().length === 0) {
        return this.toBlocked("token_mismatch");
      }
      const consumed = await this.interactions.consume({
        workspace_id: workspaceId,
        token: scenarioToken.token,
        participant_id: participant.participant_id,
        purpose: "clarify",
        surface: envelope.host.surface,
        host_conversation_ref: envelope.conversation?.host_conversation_ref,
      });
      if (consumed.status !== "consumed") return this.toBlocked(consumed.reason_code);
      return this.resolveFresh(
        {
          ...envelope,
          scenario_token: undefined,
          payload: { ...envelope.payload, text: detail },
        },
        participant,
      );
    }

    const optionToken = envelope.payload?.structured_payload?.option_token;
    if (typeof optionToken !== "string") return this.toBlocked("token_mismatch");
    const selected = state.options.find(
      (option) => option.option_token_hash === hashOptionToken(workspaceId, optionToken),
    );
    if (!selected) return this.toBlocked("token_mismatch");
    const consumed = await this.interactions.consume({
      workspace_id: workspaceId,
      token: scenarioToken.token,
      participant_id: participant.participant_id,
      purpose: "clarify",
      surface: envelope.host.surface,
      host_conversation_ref: envelope.conversation?.host_conversation_ref,
    });
    if (consumed.status !== "consumed") return this.toBlocked(consumed.reason_code);
    const current = await this.repository.revalidateResolutionCandidate({
      workspace_id: workspaceId,
      participant_id: participant.participant_id,
      candidate: selected.candidate,
      at: (this.options.now ?? (() => new Date()))().toISOString(),
    });
    if (!current.current) return this.toBlocked(current.reason_code);
    return {
      status: "resolved",
      context: this.toContext({
        participant: current.participant,
        binding: current.actor_binding,
        candidate: current.candidate,
        interaction_context_id: consumed.context.id,
      }),
    };
  }

  private async resolveFresh(
    envelope: NurtureHostInvocationEnvelope,
    participant: NurtureParticipantFact,
  ): Promise<NurtureResolverResult> {
    const now = (this.options.now ?? (() => new Date()))().toISOString();
    const actorBindings = await this.repository.listActiveActorBindings({
      workspace_id: envelope.host.workspace_id!,
      participant_id: participant.participant_id,
      at: now,
      limit: 20,
    });
    if (actorBindings.length === 0) return this.toBlocked("role_missing");
    const intentKey = inferIntent(envelope);
    const exactSurfaceIntent = intentKey !== "continue_nurture_work";
    const compatibleBindings = actorBindings.filter((binding) =>
      bindingSupportsIntent(binding, intentKey),
    );
    const scopeCandidates = compatibleBindings
      .map((binding) => scopeCandidate(binding, intentKey, exactSurfaceIntent));
    const sourceLimit = this.options.source_limit ?? 20;
    const conversationContext = envelope.conversation?.host_conversation_ref
      ? await this.interactions.recoverCurrentConversation({
          workspace_id: envelope.host.workspace_id!,
          participant_id: participant.participant_id,
          purpose: "clarify",
          surface: envelope.host.surface,
          host_conversation_ref: envelope.conversation.host_conversation_ref,
        })
      : null;
    const recoveredState = conversationContext
      ? parseClarificationState(conversationContext.state_payload)
      : null;
    const conversationCandidates =
      recoveredState?.options.map(({ candidate }) => ({
        ...candidate,
        match_class: "explicit_continuation" as const,
        evidence_codes: [...new Set([...candidate.evidence_codes, "same_conversation_context"])],
      })) ?? [];
    const sourceCandidates = await Promise.all(
      this.sources.map((source) =>
        source.load({
          envelope,
          participant,
          actor_bindings: compatibleBindings,
          intent_key: intentKey,
          at: now,
          limit: sourceLimit,
        }),
      ),
    );
    const kernel = resolveCandidates([conversationCandidates, scopeCandidates, ...sourceCandidates], {
      aggregate_candidate_limit: this.options.aggregate_candidate_limit ?? 40,
      rendered_option_limit: this.options.rendered_option_limit ?? 8,
    });
    if (kernel.status === "blocked") return this.toBlocked(kernel.reason_code);
    if (kernel.status === "needs_clarification") {
      if (this.options.issue_clarification === false) {
        return this.toBlocked("no_reachable_context");
      }
      return this.issueClarification({ envelope, participant, kernel, intent_key: intentKey });
    }
    const current = await this.repository.revalidateResolutionCandidate({
      workspace_id: envelope.host.workspace_id!,
      participant_id: participant.participant_id,
      candidate: kernel.candidate,
      at: now,
    });
    if (!current.current) return this.toBlocked(current.reason_code);
    return {
      status: "resolved",
      context: this.toContext({
        participant: current.participant,
        binding: current.actor_binding,
        candidate: current.candidate,
        ...(conversationContext
          ? { interaction_context_id: conversationContext.id }
          : {}),
      }),
    };
  }

  async resolve(envelope: NurtureHostInvocationEnvelope): Promise<NurtureResolverResult> {
    if (
      containsForbiddenHostKey(envelope) ||
      envelope.host.scenario_key !== "nurture" ||
      !envelope.host.my_chat_user_id ||
      !envelope.host.surface ||
      !envelope.host.host_request_id
    ) {
      return this.toBlocked("invalid_host_envelope");
    }
    try {
      const participants = await this.repository.listActiveParticipants({
        workspace_id: envelope.host.workspace_id,
        my_chat_user_id: envelope.host.my_chat_user_id,
        limit: 2,
      });
      if (participants.length !== 1) return this.toBlocked("participant_missing");
      const participant = participants[0]!;
      const normalizedEnvelope: NurtureHostInvocationEnvelope = envelope.host.workspace_id
        ? envelope
        : { ...envelope, host: { ...envelope.host, workspace_id: participant.workspace_id } };
      return normalizedEnvelope.scenario_token
        ? await this.resolveToken(normalizedEnvelope, participant)
        : await this.resolveFresh(normalizedEnvelope, participant);
    } catch {
      return this.toBlocked("resolver_unavailable");
    }
  }
}
