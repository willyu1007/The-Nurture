import { randomUUID } from "node:crypto";
import type { NurtureCommandSpec } from "../domain/commands/command-kernel.js";
import type { NurtureInteractionContextService } from "../domain/interactions/interaction-context.js";
import {
  grantAuthorizesDirectCareCommunication,
  type G2DirectMessageFacts,
} from "../domain/institution/family-care-transaction.js";
import { classifySafetyIntent } from "../domain/safety-classifier.js";
import {
  computeHarnessInputIntegrityTag,
  issueHarnessConfirmation,
} from "./confirmation.js";
import {
  computeProtectedBodyTag,
  issueCapabilityResultRef,
  issueTargetOptionRef,
  resolveTargetOptionRef,
} from "./keyed-refs.js";
import type { ProtectedContentWritePort } from "./protected-content.js";

export const INITIATE_CAREGIVER_DIRECT_MESSAGE_CAPABILITY = {
  key: "initiate_caregiver_direct_message",
  version: "1.0.0",
} as const;

const MIN_BODY_CHARS = 1;
const MAX_BODY_CHARS = 2_000;
const DIRECT_MESSAGE_SAFETY_POLICY_HEAD = 1;

export type InitiateCaregiverDirectMessageInputV1 = { body: string };

export const parseInitiateCaregiverDirectMessageInputV1 = (
  value: unknown,
):
  | { status: "ok"; input: InitiateCaregiverDirectMessageInputV1 }
  | { status: "invalid"; fields: string[] } => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { status: "invalid", fields: ["body"] };
  }
  const record = value as Record<string, unknown>;
  const unknown = Object.keys(record).filter((key) => key !== "body");
  if (unknown.length > 0) return { status: "invalid", fields: unknown };
  const body = typeof record.body === "string" ? record.body.trim() : "";
  if (body.length < MIN_BODY_CHARS || body.length > MAX_BODY_CHARS) {
    return { status: "invalid", fields: ["body"] };
  }
  return { status: "ok", input: { body } };
};

export type CaregiverDirectMessageTarget = {
  enrollment_id: string;
  grant_id: string;
  display_label: string;
  enrollment_version: number;
  care_group_version: number;
  caregiver_role_version: number;
  grant_version: number;
  thread_version: number;
};

export type CaregiverDirectMessageEligibilityReadPort = {
  resolveCaregiverDirectMessageEligibility(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<{
    participant_active: boolean;
    target_set_complete: boolean;
    targets: CaregiverDirectMessageTarget[];
  }>;
};

export type CaregiverDirectMessagePrepareDecision =
  | {
      status: "ready_to_confirm";
      preview: {
        normalized_body: string;
        target_label: string;
        effect: "send_caregiver_direct_message";
      };
      confirmation_ref: string;
      expires_at: string;
      command_request_id: string;
    }
  | {
      status: "needs_input";
      fields?: string[];
      choices?: Array<{ target_option_ref: string; display_label: string }>;
    }
  | { status: "denied"; reason_code: string }
  | { status: "unavailable"; reason_code: string; alternate_process?: string };

export type CaregiverDirectMessageCommandV1 = {
  body: string;
  enrollment_id: string;
  grant_id: string;
  expected_enrollment_version: number;
  expected_care_group_version: number;
  expected_role_version: number;
  expected_grant_version: number;
  expected_thread_version: number;
  expected_safety_policy_head: number;
};

export const canonicalizeCaregiverDirectMessageCommand = (
  integrityKey: string,
  input: CaregiverDirectMessageCommandV1,
): unknown => ({
  body_tag: computeProtectedBodyTag(integrityKey, input.body),
  enrollment_id: input.enrollment_id,
  grant_id: input.grant_id,
  expected_enrollment_version: input.expected_enrollment_version,
  expected_care_group_version: input.expected_care_group_version,
  expected_role_version: input.expected_role_version,
  expected_grant_version: input.expected_grant_version,
  expected_thread_version: input.expected_thread_version,
  expected_safety_policy_head: input.expected_safety_policy_head,
});

const directMessageAuthorized = (facts: G2DirectMessageFacts): boolean =>
  facts.participant_active &&
  facts.enrollment_active &&
  Boolean(facts.caregiver_role_assignment_id) &&
  Boolean(facts.child_care_process_id) &&
  Boolean(facts.family_id) &&
  Boolean(facts.care_group_id) &&
  Boolean(facts.thread_id) &&
  grantAuthorizesDirectCareCommunication(facts.grant);

export const prepareInitiateCaregiverDirectMessage = async (
  deps: {
    eligibility: CaregiverDirectMessageEligibilityReadPort;
    contexts: NurtureInteractionContextService;
    integrity_key: string;
    create_command_id?: () => string;
  },
  request: {
    workspace_id: string;
    participant_id: string;
    surface: string;
    host_conversation_ref?: string;
    operation_input: unknown;
    target_option_ref?: string;
  },
): Promise<CaregiverDirectMessagePrepareDecision> => {
  const parsed = parseInitiateCaregiverDirectMessageInputV1(request.operation_input);
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };
  const safety = classifySafetyIntent({ health_or_safety_material: [parsed.input.body] });
  if (safety.overall_level === "restricted") {
    return {
      status: "unavailable",
      reason_code: safety.reason_code ?? "SAFETY_RESTRICTED_INTENT",
      alternate_process: "offline_emergency_or_medical_channel",
    };
  }
  const eligibility = await deps.eligibility.resolveCaregiverDirectMessageEligibility({
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
  });
  if (!eligibility.participant_active || eligibility.targets.length === 0) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  if (!eligibility.target_set_complete) {
    return { status: "unavailable", reason_code: "target_selection_unavailable" };
  }
  const enrollmentId = request.target_option_ref
    ? resolveTargetOptionRef(
        deps.integrity_key,
        { workspace_id: request.workspace_id, participant_id: request.participant_id },
        request.target_option_ref,
        eligibility.targets.map((entry) => entry.enrollment_id),
      )
    : null;
  const target = eligibility.targets.find((entry) => entry.enrollment_id === enrollmentId);
  if (request.target_option_ref && !target) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  if (!target) {
    return {
      status: "needs_input",
      choices: eligibility.targets.map((entry) => ({
        target_option_ref: issueTargetOptionRef(deps.integrity_key, {
          workspace_id: request.workspace_id,
          participant_id: request.participant_id,
          enrollment_id: entry.enrollment_id,
        }),
        display_label: entry.display_label,
      })),
    };
  }
  const commandRequestId = (deps.create_command_id ?? (() => `command:${randomUUID()}`))();
  const command: CaregiverDirectMessageCommandV1 = {
    body: parsed.input.body,
    enrollment_id: target.enrollment_id,
    grant_id: target.grant_id,
    expected_enrollment_version: target.enrollment_version,
    expected_care_group_version: target.care_group_version,
    expected_role_version: target.caregiver_role_version,
    expected_grant_version: target.grant_version,
    expected_thread_version: target.thread_version,
    expected_safety_policy_head: DIRECT_MESSAGE_SAFETY_POLICY_HEAD,
  };
  const issued = await issueHarnessConfirmation(deps.contexts, {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    surface: request.surface,
    ...(request.host_conversation_ref
      ? { host_conversation_ref: request.host_conversation_ref }
      : {}),
    payload: {
      capability_key: INITIATE_CAREGIVER_DIRECT_MESSAGE_CAPABILITY.key,
      capability_version: INITIATE_CAREGIVER_DIRECT_MESSAGE_CAPABILITY.version,
      command_request_id: commandRequestId,
      target_refs: { enrollment: target.enrollment_id, grant: target.grant_id },
      expected_heads: {
        enrollment: command.expected_enrollment_version,
        care_group: command.expected_care_group_version,
        role: command.expected_role_version,
        grant: command.expected_grant_version,
        thread: command.expected_thread_version,
        safety_policy: command.expected_safety_policy_head,
      },
      input_integrity_tag: computeHarnessInputIntegrityTag(
        deps.integrity_key,
        canonicalizeCaregiverDirectMessageCommand(deps.integrity_key, command),
      ),
      integrity_tag_version: 1,
    },
  });
  return {
    status: "ready_to_confirm",
    preview: {
      normalized_body: parsed.input.body,
      target_label: target.display_label,
      effect: "send_caregiver_direct_message",
    },
    confirmation_ref: issued.token,
    expires_at: issued.expires_at,
    command_request_id: commandRequestId,
  };
};

export const createInitiateCaregiverDirectMessageSpec = (deps: {
  protected_content: ProtectedContentWritePort;
  integrity_key: string;
}): NurtureCommandSpec<CaregiverDirectMessageCommandV1> => ({
  command_key: INITIATE_CAREGIVER_DIRECT_MESSAGE_CAPABILITY.key,
  command_scope: "family_care",
  contract_version: 1,
  canonicalize: (input) =>
    canonicalizeCaregiverDirectMessageCommand(deps.integrity_key, input),
  async checkPreconditions(transaction, input, context) {
    const familyCare = transaction.familyCare;
    if (!familyCare?.loadG2DirectMessageFacts) {
      return { status: "invalid", reason_code: "family_care_port_unavailable" };
    }
    if (
      typeof input.body !== "string" ||
      input.body.trim() !== input.body ||
      input.body.length < MIN_BODY_CHARS ||
      input.body.length > MAX_BODY_CHARS ||
      input.expected_safety_policy_head !== DIRECT_MESSAGE_SAFETY_POLICY_HEAD
    ) {
      return { status: "invalid", reason_code: "invalid_direct_message_input" };
    }
    const safety = classifySafetyIntent({ health_or_safety_material: [input.body] });
    if (safety.overall_level === "restricted") {
      return { status: "blocked", reason_code: safety.reason_code ?? "SAFETY_RESTRICTED_INTENT" };
    }
    const facts = await familyCare.loadG2DirectMessageFacts({
      workspace_id: context.workspace_id,
      participant_id: context.business_actor_ref,
      enrollment_id: input.enrollment_id,
      grant_id: input.grant_id,
    });
    if (!directMessageAuthorized(facts)) {
      return { status: "blocked", reason_code: "not_authorized" };
    }
    if (
      facts.enrollment_version !== input.expected_enrollment_version ||
      facts.care_group_version !== input.expected_care_group_version ||
      facts.caregiver_role_version !== input.expected_role_version ||
      facts.grant.aggregate_version !== input.expected_grant_version ||
      facts.thread_version !== input.expected_thread_version
    ) {
      return { status: "conflict", reason_code: "stale_confirmation" };
    }
    return { status: "ready" };
  },
  async apply(transaction, input, context) {
    const familyCare = transaction.familyCare;
    if (!familyCare?.loadG2DirectMessageFacts || !familyCare.applyG2DirectMessage) {
      throw new Error("family care G2 direct-message port is unavailable");
    }
    const facts = await familyCare.loadG2DirectMessageFacts({
      workspace_id: context.workspace_id,
      participant_id: context.business_actor_ref,
      enrollment_id: input.enrollment_id,
      grant_id: input.grant_id,
    });
    if (
      !directMessageAuthorized(facts) ||
      !facts.caregiver_role_assignment_id ||
      !facts.child_care_process_id ||
      !facts.family_id ||
      !facts.care_group_id ||
      !facts.thread_id ||
      facts.enrollment_version !== input.expected_enrollment_version ||
      facts.care_group_version !== input.expected_care_group_version ||
      facts.caregiver_role_version !== input.expected_role_version ||
      facts.grant.aggregate_version !== input.expected_grant_version ||
      facts.thread_version !== input.expected_thread_version
    ) {
      throw new Error("G2 direct-message facts changed inside the transaction");
    }
    const applied = await familyCare.applyG2DirectMessage({
      workspace_id: context.workspace_id,
      participant_id: context.business_actor_ref,
      enrollment_id: input.enrollment_id,
      caregiver_role_assignment_id: facts.caregiver_role_assignment_id,
      child_care_process_id: facts.child_care_process_id,
      family_id: facts.family_id,
      care_group_id: facts.care_group_id,
      thread_id: facts.thread_id,
      grant_id: facts.grant.grant_id,
      expected_thread_version: input.expected_thread_version,
      body_envelope: deps.protected_content.seal(input.body),
    });
    return {
      output_refs: [applied.message_ref, applied.receipt_ref],
      result_schema_version: 1,
      committed_result: {
        messageRef: issueCapabilityResultRef(
          deps.integrity_key,
          context,
          "message",
          applied.message_ref,
        ),
        receiptRef: issueCapabilityResultRef(
          deps.integrity_key,
          context,
          "receipt",
          applied.receipt_ref,
        ),
        contentState: "sent",
      },
    };
  },
});
