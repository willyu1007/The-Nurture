import {
  QUERY_TEACHER_PUBLISH_QUEUE_CAPABILITY,
  RELEASE_PUBLISH_PROCESS_CAPABILITY,
  type NurtureHostInvocationEnvelope,
  type NurtureResolverResult,
  type ReleaseTargetPresentationDecisionV1,
} from "@the-nurture/scenario";
import type {
  HarnessExecuteRequestV1,
  HarnessExecuteResponseV1,
  HarnessPrepareRequestV1,
  HarnessPrepareResponseV1,
  HarnessQueryRequestV1,
  HarnessQueryResponseV1,
} from "./harness-http.js";
import {
  sanitizeTeacherReleaseOwnerCommitted,
  sanitizeTeacherReleaseOwnerNotCommitted,
  sanitizeTeacherReleaseOwnerPrepare,
  sanitizeTeacherReleaseOwnerQuery,
  sanitizeTeacherReleaseOwnerTargets,
  type TeacherReleaseOwnerConfirmResultV3,
  type TeacherReleaseOwnerPrepareResultV3,
  type TeacherReleaseOwnerQueryResultV3,
  type TeacherReleaseOwnerTargetsResultV3,
} from "./teacher-release-owner-codec.js";

const OWNER_SURFACE = "board" as const;
const OWNER_VIEW = "teacher_publish_queue" as const;
const ACCESS_CHANGED_REASONS = new Set([
  "confirmation_revoked",
  "not_authorized",
]);

export type TeacherReleaseOwnerIdentityV3 = {
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  host_conversation_ref?: string;
};

export type TeacherReleaseOwnerQueryRequestV3 =
  TeacherReleaseOwnerIdentityV3 & {
    page_size?: number;
    cursor?: string;
  };

export type TeacherReleaseOwnerPrepareRequestV3 =
  TeacherReleaseOwnerIdentityV3 & {
    process_ref: string;
    action_option_ref: string;
    target_snapshot_ref: string;
  };

export type TeacherReleaseOwnerTargetsRequestV3 =
  TeacherReleaseOwnerIdentityV3 & {
    process_ref: string;
    action_option_ref: string;
  };

export type TeacherReleaseOwnerConfirmRequestV3 =
  TeacherReleaseOwnerIdentityV3 & {
    invocation_request_id: string;
    command_request_id: string;
    confirmation_ref: string;
  };

type ResolverClarification = Extract<
  NurtureResolverResult,
  { status: "needs_clarification" }
>;
type OwnerClarificationInteraction = Extract<
  ResolverClarification["interaction"],
  { kind: "single_choice" }
>;

export type TeacherReleaseOwnerResultV3<Result> =
  | { status: "ready"; result: Result }
  | {
      status: "needs_clarification";
      scenario_token: ResolverClarification["scenario_token"];
      interaction: OwnerClarificationInteraction;
      safe_reason_code: ResolverClarification["safe_state"]["reason_code"];
    }
  | {
      status: "unavailable";
      safe_reason_code: "access_changed" | "unavailable";
    };

type OwnerResolution =
  | { status: "resolved"; participant_id: string }
  | Exclude<TeacherReleaseOwnerResultV3<never>, { status: "ready" }>;

export type TeacherReleaseOwnerResolver = {
  resolve(
    envelope: NurtureHostInvocationEnvelope,
  ): Promise<NurtureResolverResult>;
};

export type TeacherReleaseOwnerEngine = {
  query(request: HarnessQueryRequestV1): Promise<HarnessQueryResponseV1>;
  prepare(
    request: HarnessPrepareRequestV1 & { target_snapshot_ref: string },
  ): Promise<HarnessPrepareResponseV1>;
  execute(request: HarnessExecuteRequestV1): Promise<HarnessExecuteResponseV1>;
  presentReleaseTargets(request: {
    workspace_id: string;
    actor_participant_id: string;
    process_ref: string;
  }): Promise<ReleaseTargetPresentationDecisionV1>;
};

/**
 * Composes Host identity with current Nurture owner resolution before every
 * teacher queue/release operation. The caller can never supply a Nurture
 * Participant, role or CareGroup.
 */
export class TeacherReleaseOwnerComposition {
  constructor(
    private readonly resolver: TeacherReleaseOwnerResolver,
    private readonly engine: TeacherReleaseOwnerEngine,
  ) {}

  private async resolveOwner(
    input: TeacherReleaseOwnerIdentityV3,
  ): Promise<OwnerResolution> {
    const envelope: NurtureHostInvocationEnvelope = {
      host: {
        workspace_id: input.workspace_id,
        my_chat_user_id: input.my_chat_user_id,
        scenario_key: "nurture",
        surface: OWNER_SURFACE,
        host_request_id: input.host_request_id,
      },
      ...(input.host_conversation_ref
        ? {
            conversation: {
              host_conversation_ref: input.host_conversation_ref,
            },
          }
        : {}),
      event: { kind: "surface_open" },
      display_state: { selected_view_key: OWNER_VIEW },
    };
    const resolved = await this.resolver.resolve(envelope);
    if (resolved.status === "needs_clarification") {
      if (resolved.interaction.kind !== "single_choice") {
        return { status: "unavailable", safe_reason_code: "unavailable" };
      }
      return {
        status: "needs_clarification",
        scenario_token: resolved.scenario_token,
        interaction: resolved.interaction,
        safe_reason_code: resolved.safe_state.reason_code,
      };
    }
    if (resolved.status === "blocked") {
      return {
        status: "unavailable",
        safe_reason_code: resolved.safe_user_state,
      };
    }

    const {
      actor,
      work_scope: workScope,
      policy_seed: policySeed,
    } = resolved.context;
    if (
      !["caregiver", "lead_caregiver"].includes(actor.role_kind) ||
      actor.scope_type !== "care_group" ||
      workScope.kind !== "care_group" ||
      !workScope.care_group_id ||
      actor.scope_id !== workScope.care_group_id ||
      policySeed.action_key !== QUERY_TEACHER_PUBLISH_QUEUE_CAPABILITY.key
    ) {
      return { status: "unavailable", safe_reason_code: "access_changed" };
    }
    return { status: "resolved", participant_id: actor.participant_id };
  }

  private unavailableForReason(
    reasonCode: string,
  ): Extract<TeacherReleaseOwnerResultV3<never>, { status: "unavailable" }> {
    return {
      status: "unavailable",
      safe_reason_code: ACCESS_CHANGED_REASONS.has(reasonCode)
        ? "access_changed"
        : "unavailable",
    };
  }

  async query(
    request: TeacherReleaseOwnerQueryRequestV3,
  ): Promise<TeacherReleaseOwnerResultV3<TeacherReleaseOwnerQueryResultV3>> {
    const owner = await this.resolveOwner(request);
    if (owner.status !== "resolved") return owner;
    const result = await this.engine.query({
      workspace_id: request.workspace_id,
      actor_participant_id: owner.participant_id,
      surface: OWNER_SURFACE,
      capability_key: QUERY_TEACHER_PUBLISH_QUEUE_CAPABILITY.key,
      capability_version: QUERY_TEACHER_PUBLISH_QUEUE_CAPABILITY.version,
      ...(request.page_size !== undefined
        ? { page_size: request.page_size }
        : {}),
      ...(request.cursor !== undefined ? { cursor: request.cursor } : {}),
    });
    if (result.status === "denied")
      return this.unavailableForReason(result.reason_code);
    const safe = sanitizeTeacherReleaseOwnerQuery(result);
    return safe
      ? { status: "ready", result: safe }
      : this.unavailableForReason("invalid_owner_result");
  }

  async prepare(
    request: TeacherReleaseOwnerPrepareRequestV3,
  ): Promise<TeacherReleaseOwnerResultV3<TeacherReleaseOwnerPrepareResultV3>> {
    const owner = await this.resolveOwner(request);
    if (owner.status !== "resolved") return owner;
    if (request.process_ref !== request.action_option_ref) {
      return {
        status: "ready",
        result: { status: "needs_input", fields: ["target"] },
      };
    }
    const result = await this.engine.prepare({
      workspace_id: request.workspace_id,
      actor_participant_id: owner.participant_id,
      surface: OWNER_SURFACE,
      capability_key: RELEASE_PUBLISH_PROCESS_CAPABILITY.key,
      capability_version: RELEASE_PUBLISH_PROCESS_CAPABILITY.version,
      target_option_ref: request.action_option_ref,
      target_snapshot_ref: request.target_snapshot_ref,
      ...(request.host_conversation_ref
        ? { host_conversation_ref: request.host_conversation_ref }
        : {}),
    });
    if (result.status === "denied" || result.status === "unavailable") {
      return this.unavailableForReason(result.reason_code);
    }
    const safe = sanitizeTeacherReleaseOwnerPrepare(result);
    return safe
      ? { status: "ready", result: safe }
      : this.unavailableForReason("invalid_owner_result");
  }

  async targets(
    request: TeacherReleaseOwnerTargetsRequestV3,
  ): Promise<
    TeacherReleaseOwnerResultV3<TeacherReleaseOwnerTargetsResultV3>
  > {
    const owner = await this.resolveOwner(request);
    if (owner.status !== "resolved") return owner;
    if (request.process_ref !== request.action_option_ref) {
      return { status: "unavailable", safe_reason_code: "unavailable" };
    }
    const result = await this.engine.presentReleaseTargets({
      workspace_id: request.workspace_id,
      actor_participant_id: owner.participant_id,
      process_ref: request.process_ref,
    });
    if (result.status === "denied") {
      return this.unavailableForReason(result.reason_code);
    }
    const safe = sanitizeTeacherReleaseOwnerTargets(result);
    return safe && safe.detail.processRef === request.process_ref
      ? { status: "ready", result: safe }
      : this.unavailableForReason("invalid_owner_result");
  }

  async confirm(
    request: TeacherReleaseOwnerConfirmRequestV3,
  ): Promise<TeacherReleaseOwnerResultV3<TeacherReleaseOwnerConfirmResultV3>> {
    const owner = await this.resolveOwner(request);
    if (owner.status !== "resolved") return owner;
    const result = await this.engine.execute({
      workspace_id: request.workspace_id,
      actor_participant_id: owner.participant_id,
      surface: OWNER_SURFACE,
      capability_key: RELEASE_PUBLISH_PROCESS_CAPABILITY.key,
      capability_version: RELEASE_PUBLISH_PROCESS_CAPABILITY.version,
      invocation_request_id: request.invocation_request_id,
      command_request_id: request.command_request_id,
      confirmation_ref: request.confirmation_ref,
      ...(request.host_conversation_ref
        ? { host_conversation_ref: request.host_conversation_ref }
        : {}),
    });
    if (result.status === "not_committed") {
      const safe = sanitizeTeacherReleaseOwnerNotCommitted(result);
      return safe
        ? { status: "ready", result: safe }
        : this.unavailableForReason(result.reason_code);
    }
    if (result.status === "outcome_unknown") {
      return {
        status: "ready",
        result: {
          status: "outcome_unknown",
          reason_code: "release_outcome_unknown",
          recovery: "reconcile_same_command",
        },
      };
    }
    const safe = sanitizeTeacherReleaseOwnerCommitted(result);
    return safe
      ? { status: "ready", result: safe }
      : this.unavailableForReason("invalid_owner_result");
  }
}
