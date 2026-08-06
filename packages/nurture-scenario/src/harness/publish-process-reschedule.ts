import { randomUUID } from "node:crypto";
import type {
  NurtureCommandSpec,
} from "../domain/commands/command-kernel.js";
import type { NurtureInteractionContextService } from "../domain/interactions/interaction-context.js";
import type {
  NurtureCaregiverWriteAuthority,
  NurturePublishProcessRescheduleFacts,
  NurturePublishProcessTransaction,
} from "../domain/institution/publish-process-transaction.js";
import {
  CAREGIVER_BOARD_ROLES,
  resolveBoardSealedRef,
  type BoardScopeV1,
} from "./board-projection.js";
import { createBoardWriteSpec } from "./board-write-spec.js";
import {
  computeHarnessInputIntegrityTag,
  issueHarnessConfirmation,
} from "./confirmation.js";
import {
  PUBLISH_PROCESS_TARGET_KIND,
  isPublishProcessState,
} from "./publish-process.js";
import {
  RESCHEDULE_PUBLISH_PROCESS_CAPABILITY,
  evaluateReschedule,
  parseRescheduleInputV1,
  type ResolvedPublishScheduleV1,
} from "./publish-schedule.js";

export type PublishProcessRescheduleFactsV1 = Omit<
  NurturePublishProcessRescheduleFacts,
  "publish_process_ref"
>;

export type PublishProcessRescheduleReadPort = {
  listEditableProcessKeys(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<string[]>;
  loadRescheduleFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
  }): Promise<PublishProcessRescheduleFactsV1 | null>;
};

type RescheduleDependencies = {
  integrity_key: string;
  reads: PublishProcessRescheduleReadPort;
  contexts: NurtureInteractionContextService;
  create_command_id?: () => string;
};

export type ReschedulePublishProcessPrepareDecision =
  | {
      status: "ready_to_confirm";
      preview: Record<string, string | number>;
      confirmation_ref: string;
      expires_at: string;
      command_request_id: string;
    }
  | { status: "needs_input"; fields: string[] }
  | { status: "denied"; reason_code: string };

const actorEligible = (authority: NurtureCaregiverWriteAuthority): boolean =>
  CAREGIVER_BOARD_ROLES.includes(authority.role) &&
  authority.role_scope_type === "care_group" &&
  authority.role_scope_matches_source &&
  authority.role_assignment_current;

const policyMatchesFrozenSchedule = (
  facts: Pick<PublishProcessRescheduleFactsV1, "schedule" | "current_policy">,
): boolean =>
  facts.schedule !== null &&
  facts.current_policy !== null &&
  facts.current_policy.policy_ref === facts.schedule.policyRef &&
  facts.current_policy.policy_head === facts.schedule.policyHead &&
  facts.current_policy.policy_version === facts.schedule.policyVersion;

const decideReschedule = (
  facts: PublishProcessRescheduleFactsV1,
  participantId: string,
  operationInput: unknown,
) => {
  if (!actorEligible(facts.authority)) {
    return { status: "denied", reason_code: "not_authorized" } as const;
  }
  if (!facts.schedule || !facts.current_policy) {
    return { status: "denied", reason_code: "publication_policy_unavailable" } as const;
  }
  if (!policyMatchesFrozenSchedule(facts)) {
    return { status: "denied", reason_code: "publication_policy_drift" } as const;
  }
  if (!isPublishProcessState(facts.process_state)) {
    return { status: "denied", reason_code: "process_not_queued" } as const;
  }
  const at = new Date(facts.read_at);
  const hold = facts.current_hold;
  return evaluateReschedule({
    now: at,
    state: facts.process_state,
    frozen: facts.schedule,
    edit_hold_held_by_other: Boolean(
      hold &&
        Date.parse(hold.expires_at) > at.getTime() &&
        hold.holder_participant_id !== participantId,
    ),
    has_committed_release: facts.committed_release_count > 0,
    operation_input: operationInput,
  });
};

const resolveProcessKey = async (
  deps: Pick<RescheduleDependencies, "integrity_key" | "reads">,
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

export type ReschedulePublishProcessCommandV1 = {
  process_key: string;
  scheduled_at: string;
  expected_schedule_version: number;
};

export const canonicalizeReschedulePublishProcessCommand = (
  input: ReschedulePublishProcessCommandV1,
): unknown => ({
  process_key: input.process_key,
  scheduled_at: input.scheduled_at,
  expected_schedule_version: input.expected_schedule_version,
});

export const prepareReschedulePublishProcess = async (
  deps: RescheduleDependencies,
  request: BoardScopeV1 & {
    surface: string;
    host_conversation_ref?: string;
    operation_input?: unknown;
    target_option_ref?: string;
  },
): Promise<ReschedulePublishProcessPrepareDecision> => {
  const parsed = parseRescheduleInputV1(request.operation_input);
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };
  if (!request.target_option_ref) return { status: "needs_input", fields: ["target"] };
  const scope = {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
  };
  const processKey = await resolveProcessKey(deps, scope, request.target_option_ref);
  if (!processKey) return { status: "denied", reason_code: "target_unavailable" };
  const facts = await deps.reads.loadRescheduleFacts({ ...scope, process_key: processKey });
  if (!facts) return { status: "denied", reason_code: "target_unavailable" };
  const decision = decideReschedule(facts, request.participant_id, request.operation_input);
  if (decision.status === "needs_input" || decision.status === "denied") return decision;

  const command: ReschedulePublishProcessCommandV1 = {
    process_key: processKey,
    scheduled_at: decision.schedule.scheduledAt,
    expected_schedule_version: facts.process_version,
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
      capability_key: RESCHEDULE_PUBLISH_PROCESS_CAPABILITY.key,
      capability_version: RESCHEDULE_PUBLISH_PROCESS_CAPABILITY.version,
      command_request_id: commandRequestId,
      target_refs: { publish_process: processKey },
      expected_heads: { publication_schedule: command.expected_schedule_version },
      input_integrity_tag: computeHarnessInputIntegrityTag(
        deps.integrity_key,
        canonicalizeReschedulePublishProcessCommand(command),
      ),
      integrity_tag_version: 1,
    },
  });
  return {
    status: "ready_to_confirm",
    preview: {
      effect: "reschedule_publish_process",
      scheduledAt: decision.schedule.scheduledAt,
      notAfter: decision.schedule.notAfter,
      timeZone: decision.schedule.timeZone,
    },
    confirmation_ref: issued.token,
    expires_at: issued.expires_at,
    command_request_id: commandRequestId,
  };
};

const committedResult = (schedule: ResolvedPublishScheduleV1) => ({ ...schedule });

export const createReschedulePublishProcessSpec = (): NurtureCommandSpec<ReschedulePublishProcessCommandV1> =>
  createBoardWriteSpec({
    capability: RESCHEDULE_PUBLISH_PROCESS_CAPABILITY,
    command_scope: "publish_process_reschedule",
    contract_version: 1,
    result_schema_version: 1,
    canonicalize: canonicalizeReschedulePublishProcessCommand,
    port: {
      select: (transaction) => transaction.publishProcess,
      unavailable_reason_code: "publish_process_port_unavailable",
    },
    revalidateInput: (input) => {
      const parsed = parseRescheduleInputV1({ scheduledAt: input.scheduled_at });
      return input.process_key.length > 0 &&
        parsed.status === "ok" &&
        Number.isSafeInteger(input.expected_schedule_version) &&
        input.expected_schedule_version >= 0
        ? null
        : { status: "invalid", reason_code: "invalid_reschedule_input" };
    },
    loadFacts: (owner, input, context) =>
      owner.loadPublishProcessRescheduleFacts({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        process_key: input.process_key,
      }),
    facts_absent_reason_code: "target_unavailable",
    authorize: (facts, input, context) => {
      const decision = decideReschedule(
        facts,
        context.business_actor_ref,
        { scheduledAt: input.scheduled_at },
      );
      if (decision.status === "needs_input") {
        return { status: "invalid", reason_code: "invalid_reschedule_input" };
      }
      if (decision.status === "denied") {
        return { status: "blocked", reason_code: decision.reason_code };
      }
      if (facts.schedule?.scheduledAt === input.scheduled_at) {
        return {
          status: "already_satisfied",
          effect: {
            output_refs: [facts.publish_process_ref],
            committed_result: committedResult(decision.schedule),
          },
        };
      }
      return {
        status: "authorized",
        write: {
          schedule: decision.schedule,
          authorizing_role_assignment_id: facts.authorizing_role_assignment_id,
        },
      };
    },
    head_keys: ["publication_schedule"],
    expectedHeads: (input) => ({
      publication_schedule: input.expected_schedule_version,
    }),
    currentHeads: (facts) => ({ publication_schedule: facts.process_version }),
    apply: async (owner: NurturePublishProcessTransaction, input, context, write) => {
      const applied = await owner.applyPublishProcessReschedule({
        workspace_id: context.workspace_id,
        process_key: input.process_key,
        expected_process_version: input.expected_schedule_version,
        scheduled_at: write.schedule.scheduledAt,
        authorizing_role_assignment_id: write.authorizing_role_assignment_id,
      });
      return {
        output_refs: [applied.publish_process_ref],
        committed_result: committedResult(applied.schedule),
      };
    },
  });
