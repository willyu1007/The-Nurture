import { randomUUID } from "node:crypto";
import type {
  NurtureCommandApplyResult,
  NurtureCommandSpec,
} from "../domain/commands/command-kernel.js";
import {
  grantAuthorizesDirectCareCommunication,
  grantAuthorizesFamilyCare,
  type FamilyCareTransactionInput,
  type G2MessageChangeFacts,
  type G2MessageChangePayload,
  type G2RedactionFinalization,
  type G2WithdrawalFacts,
  type G2WithdrawalPayload,
} from "../domain/institution/family-care-transaction.js";
import { NurtureInteractionContextService } from "../domain/interactions/interaction-context.js";
import { computeHarnessInputIntegrityTag, issueHarnessConfirmation } from "./confirmation.js";
import type { ProtectedContentWritePort } from "./protected-content.js";
import {
  computeProtectedBodyTag,
  issueCapabilityResultRef,
  resolveCareItemTargetRef,
  resolveFamilyCareMessageTargetRef,
  resolvePolicyRedactionDecisionRef,
} from "./keyed-refs.js";

/** G2-B lifecycle capabilities frozen by 07-increment-2-change-contract.md. */
export const CORRECT_FAMILY_CARE_MESSAGE_CAPABILITY = {
  key: "correct_family_care_message",
  version: "1.0.0",
} as const;

export const WITHDRAW_FAMILY_CARE_REQUEST_CAPABILITY = {
  key: "withdraw_family_care_request",
  version: "1.0.0",
} as const;

export const REDACT_FAMILY_CARE_MESSAGE_CAPABILITY = {
  key: "redact_family_care_message",
  version: "1.0.0",
} as const;

export const POLICY_REDACT_FAMILY_CARE_MESSAGE_CAPABILITY = {
  key: "policy_redact_family_care_message",
  version: "1.0.0",
} as const;

const MIN_BODY_CHARS = 1;
const MAX_BODY_CHARS = 2_000;

export type LifecycleFactsReadPort = {
  loadG2MessageChangeFacts(
    input: FamilyCareTransactionInput<G2MessageChangePayload>,
  ): Promise<G2MessageChangeFacts>;
  loadG2WithdrawalFacts(
    input: FamilyCareTransactionInput<G2WithdrawalPayload>,
  ): Promise<G2WithdrawalFacts>;
};

export type LifecyclePrepareDependencies = {
  facts: LifecycleFactsReadPort;
  contexts: NurtureInteractionContextService;
  integrity_key: string;
  create_command_id?: () => string;
  create_cascade_audit_id?: () => string;
};

export type LifecyclePrepareRequest = {
  workspace_id: string;
  participant_id: string;
  surface: string;
  host_conversation_ref?: string;
  target_option_ref: string;
  operation_input?: unknown;
};

export type LifecyclePrepareDecision =
  | {
      status: "ready_to_confirm";
      preview: { target_label: string; effect: string };
      confirmation_ref: string;
      expires_at: string;
      command_request_id: string;
    }
  | { status: "needs_input"; fields: string[] }
  | { status: "denied"; reason_code: string }
  | { status: "unavailable"; reason_code: string };

const emptyInput = (value: unknown): boolean =>
  value === undefined ||
  (typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0);

export type CorrectFamilyCareMessageInputV1 = { body: string };

export type PolicyRedactFamilyCareMessageInputV1 = { policyDecisionRef: string };

export const parsePolicyRedactFamilyCareMessageInputV1 = (
  value: unknown,
):
  | { status: "ok"; input: PolicyRedactFamilyCareMessageInputV1 }
  | { status: "invalid"; fields: string[] } => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { status: "invalid", fields: ["policyDecisionRef"] };
  }
  const record = value as Record<string, unknown>;
  const unknown = Object.keys(record).filter((key) => key !== "policyDecisionRef");
  if (unknown.length > 0) return { status: "invalid", fields: unknown };
  return typeof record.policyDecisionRef === "string" && record.policyDecisionRef.length > 0
    ? { status: "ok", input: { policyDecisionRef: record.policyDecisionRef } }
    : { status: "invalid", fields: ["policyDecisionRef"] };
};

export const parseCorrectFamilyCareMessageInputV1 = (
  value: unknown,
):
  | { status: "ok"; input: CorrectFamilyCareMessageInputV1 }
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

export type CorrectFamilyCareMessageCommandV1 = {
  body: string;
  message_id: string;
  expected_message_version: number;
  expected_correction_head: number;
  expected_lifecycle_head?: number;
};

export const canonicalizeCorrectFamilyCareMessageCommand = (
  integrityKey: string,
  input: CorrectFamilyCareMessageCommandV1,
): unknown => ({
  body_tag: computeProtectedBodyTag(integrityKey, input.body),
  message_id: input.message_id,
  expected_message_version: input.expected_message_version,
  expected_correction_head: input.expected_correction_head,
  ...(input.expected_lifecycle_head !== undefined
    ? { expected_lifecycle_head: input.expected_lifecycle_head }
    : {}),
});

const messageGrantAuthorizesCorrection = (facts: G2MessageChangeFacts): boolean =>
  facts.message_kind === "caregiver_direct_message"
    ? grantAuthorizesDirectCareCommunication(facts.grant)
    : Boolean(facts.message_direction) &&
      grantAuthorizesFamilyCare(facts.grant, facts.message_direction!);

const correctionAuthorized = (facts: G2MessageChangeFacts): boolean =>
  facts.participant_active &&
  facts.message_present &&
  facts.writer_contract === "harness_g2_v1" &&
  facts.message_status === "sent" &&
  facts.exact_author &&
  facts.same_side_reachable &&
  Boolean(facts.current_author_role_assignment_id) &&
  messageGrantAuthorizesCorrection(facts) &&
  (facts.source_item_id === undefined || facts.source_item_lifecycle_state === "active") &&
  (facts.message_kind !== "family_message" ||
    facts.source_item_response_state === "awaiting_reply");

export const prepareCorrectFamilyCareMessage = async (
  deps: LifecyclePrepareDependencies,
  request: LifecyclePrepareRequest,
): Promise<LifecyclePrepareDecision> => {
  const parsed = parseCorrectFamilyCareMessageInputV1(request.operation_input);
  if (parsed.status === "invalid") return { status: "needs_input", fields: parsed.fields };
  const messageId = resolveFamilyCareMessageTargetRef(
    deps.integrity_key,
    { workspace_id: request.workspace_id, participant_id: request.participant_id },
    request.target_option_ref,
  );
  if (!messageId) return { status: "denied", reason_code: "not_authorized" };
  const facts = await deps.facts.loadG2MessageChangeFacts({
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    message_id: messageId,
  });
  if (!correctionAuthorized(facts)) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  const commandRequestId = (deps.create_command_id ?? (() => `command:${randomUUID()}`))();
  const command: CorrectFamilyCareMessageCommandV1 = {
    body: parsed.input.body,
    message_id: messageId,
    expected_message_version: facts.message_version!,
    expected_correction_head: facts.correction_head,
    ...(facts.source_item_lifecycle_head !== undefined
      ? { expected_lifecycle_head: facts.source_item_lifecycle_head }
      : {}),
  };
  const issued = await issueHarnessConfirmation(deps.contexts, {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    surface: request.surface,
    ...(request.host_conversation_ref
      ? { host_conversation_ref: request.host_conversation_ref }
      : {}),
    payload: {
      capability_key: CORRECT_FAMILY_CARE_MESSAGE_CAPABILITY.key,
      capability_version: CORRECT_FAMILY_CARE_MESSAGE_CAPABILITY.version,
      command_request_id: commandRequestId,
      target_refs: {
        family_care_message: messageId,
        ...(facts.source_item_id ? { care_item: facts.source_item_id } : {}),
      },
      expected_heads: {
        message: command.expected_message_version,
        correction: command.expected_correction_head,
        ...(command.expected_lifecycle_head !== undefined
          ? { lifecycle: command.expected_lifecycle_head }
          : {}),
      },
      input_integrity_tag: computeHarnessInputIntegrityTag(
        deps.integrity_key,
        canonicalizeCorrectFamilyCareMessageCommand(deps.integrity_key, command),
      ),
      integrity_tag_version: 1,
    },
  });
  return {
    status: "ready_to_confirm",
    preview: { target_label: "Family care message", effect: "correct_family_care_message" },
    confirmation_ref: issued.token,
    expires_at: issued.expires_at,
    command_request_id: commandRequestId,
  };
};

const correctionFinalization = (
  value: unknown,
): { correction_id: string } | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const correctionId = (value as { correction_id?: unknown }).correction_id;
  return typeof correctionId === "string" && correctionId.length > 0
    ? { correction_id: correctionId }
    : null;
};

export const createCorrectFamilyCareMessageSpec = (deps: {
  protected_content: ProtectedContentWritePort;
  integrity_key: string;
}): NurtureCommandSpec<CorrectFamilyCareMessageCommandV1> => ({
  command_key: CORRECT_FAMILY_CARE_MESSAGE_CAPABILITY.key,
  command_scope: "family_care",
  contract_version: 1,
  canonicalize: (input) => canonicalizeCorrectFamilyCareMessageCommand(deps.integrity_key, input),
  async checkPreconditions(transaction, input, context) {
    const familyCare = transaction.familyCare;
    if (!familyCare?.loadG2MessageChangeFacts) {
      return { status: "invalid", reason_code: "family_care_port_unavailable" };
    }
    if (
      typeof input.body !== "string" ||
      input.body.trim() !== input.body ||
      input.body.length < MIN_BODY_CHARS ||
      input.body.length > MAX_BODY_CHARS
    ) {
      return { status: "invalid", reason_code: "invalid_protected_body" };
    }
    const facts = await familyCare.loadG2MessageChangeFacts({
      workspace_id: context.workspace_id,
      participant_id: context.business_actor_ref,
      message_id: input.message_id,
    });
    if (!correctionAuthorized(facts)) {
      return { status: "blocked", reason_code: "not_authorized" };
    }
    if (
      facts.message_version !== input.expected_message_version ||
      facts.correction_head !== input.expected_correction_head ||
      (input.expected_lifecycle_head !== undefined &&
        facts.source_item_lifecycle_head !== input.expected_lifecycle_head)
    ) {
      return { status: "conflict", reason_code: "stale_confirmation" };
    }
    return { status: "ready" };
  },
  async apply(transaction, input, context) {
    const familyCare = transaction.familyCare;
    if (!familyCare?.loadG2MessageChangeFacts || !familyCare.applyG2Correction) {
      throw new Error("family care G2 correction port is unavailable");
    }
    const facts = await familyCare.loadG2MessageChangeFacts({
      workspace_id: context.workspace_id,
      participant_id: context.business_actor_ref,
      message_id: input.message_id,
    });
    if (!facts.current_author_role_assignment_id || !correctionAuthorized(facts)) {
      throw new Error("G2 correction facts changed inside the transaction");
    }
    const applied = await familyCare.applyG2Correction({
      workspace_id: context.workspace_id,
      participant_id: context.business_actor_ref,
      message_id: input.message_id,
      current_author_role_assignment_id: facts.current_author_role_assignment_id,
      expected_message_version: input.expected_message_version,
      expected_correction_head: input.expected_correction_head,
      ...(input.expected_lifecycle_head !== undefined
        ? { expected_lifecycle_head: input.expected_lifecycle_head }
        : {}),
      body_envelope: deps.protected_content.seal(input.body),
    });
    return {
      output_refs: [
        applied.message_ref,
        ...(applied.item_ref ? [applied.item_ref] : []),
        applied.correction_ref,
        applied.receipt_ref,
      ],
      result_schema_version: 1,
      committed_result: {
        effect: "correction_appended",
        messageRef: issueCapabilityResultRef(
          deps.integrity_key,
          context,
          "message",
          applied.message_ref,
        ),
        correctionRef: issueCapabilityResultRef(
          deps.integrity_key,
          context,
          "correction",
          applied.correction_ref,
        ),
        receiptRef: issueCapabilityResultRef(
          deps.integrity_key,
          context,
          "receipt",
          applied.receipt_ref,
        ),
      },
      finalization_payload: applied.finalization,
    };
  },
  async afterExecutionCreated(transaction, _input, context, applied) {
    if (applied.business_outcome !== "applied") return;
    const finalization = correctionFinalization(applied.finalization_payload);
    if (!finalization || !transaction.familyCare?.finalizeG2Correction) {
      throw new Error("G2 correction finalization is unavailable");
    }
    await transaction.familyCare.finalizeG2Correction({
      workspace_id: context.workspace_id,
      correction_id: finalization.correction_id,
      command_execution_id: applied.execution.id,
    });
  },
});

export type WithdrawFamilyCareRequestCommandV1 = {
  item_id: string;
  expected_lifecycle_head: number;
};

export const canonicalizeWithdrawFamilyCareRequestCommand = (
  input: WithdrawFamilyCareRequestCommandV1,
): unknown => ({
  item_id: input.item_id,
  expected_lifecycle_head: input.expected_lifecycle_head,
});

const withdrawalAuthority = (facts: G2WithdrawalFacts): boolean =>
  facts.participant_active &&
  facts.item_present &&
  facts.writer_contract === "harness_g2_v1" &&
  facts.exact_source_author &&
  facts.same_side_reachable &&
  Boolean(facts.current_guardian_role_assignment_id) &&
  grantAuthorizesFamilyCare(facts.grant, "family_to_org");

export const prepareWithdrawFamilyCareRequest = async (
  deps: LifecyclePrepareDependencies,
  request: LifecyclePrepareRequest,
): Promise<LifecyclePrepareDecision> => {
  if (!emptyInput(request.operation_input)) {
    return { status: "needs_input", fields: ["operation_input"] };
  }
  const itemId = resolveCareItemTargetRef(
    deps.integrity_key,
    { workspace_id: request.workspace_id, participant_id: request.participant_id },
    request.target_option_ref,
  );
  if (!itemId) return { status: "denied", reason_code: "not_authorized" };
  const facts = await deps.facts.loadG2WithdrawalFacts({
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    item_id: itemId,
  });
  if (!withdrawalAuthority(facts)) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  if (
    facts.lifecycle_state !== "active" &&
    !(facts.lifecycle_state === "closed" && facts.lifecycle_reason === "family_withdrawn")
  ) {
    return { status: "denied", reason_code: "target_unavailable" };
  }
  const commandRequestId = (deps.create_command_id ?? (() => `command:${randomUUID()}`))();
  const command: WithdrawFamilyCareRequestCommandV1 = {
    item_id: itemId,
    expected_lifecycle_head: facts.lifecycle_head ?? 0,
  };
  const issued = await issueHarnessConfirmation(deps.contexts, {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    surface: request.surface,
    ...(request.host_conversation_ref
      ? { host_conversation_ref: request.host_conversation_ref }
      : {}),
    payload: {
      capability_key: WITHDRAW_FAMILY_CARE_REQUEST_CAPABILITY.key,
      capability_version: WITHDRAW_FAMILY_CARE_REQUEST_CAPABILITY.version,
      command_request_id: commandRequestId,
      target_refs: { care_item: itemId },
      expected_heads: { lifecycle: command.expected_lifecycle_head },
      input_integrity_tag: computeHarnessInputIntegrityTag(
        deps.integrity_key,
        canonicalizeWithdrawFamilyCareRequestCommand(command),
      ),
      integrity_tag_version: 1,
    },
  });
  return {
    status: "ready_to_confirm",
    preview: { target_label: "Family care request", effect: "withdraw_family_care_request" },
    confirmation_ref: issued.token,
    expires_at: issued.expires_at,
    command_request_id: commandRequestId,
  };
};

export const createWithdrawFamilyCareRequestSpec = (deps: {
  integrity_key: string;
}): NurtureCommandSpec<WithdrawFamilyCareRequestCommandV1> => ({
    command_key: WITHDRAW_FAMILY_CARE_REQUEST_CAPABILITY.key,
    command_scope: "family_care",
    contract_version: 1,
    canonicalize: canonicalizeWithdrawFamilyCareRequestCommand,
    async checkPreconditions(transaction, input, context) {
      const familyCare = transaction.familyCare;
      if (!familyCare?.loadG2WithdrawalFacts) {
        return { status: "invalid", reason_code: "family_care_port_unavailable" };
      }
      const facts = await familyCare.loadG2WithdrawalFacts({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        item_id: input.item_id,
      });
      if (!withdrawalAuthority(facts)) {
        return { status: "blocked", reason_code: "not_authorized" };
      }
      if (facts.lifecycle_state === "closed" && facts.lifecycle_reason === "family_withdrawn") {
        const refs = facts.existing_withdrawal_refs ?? [];
        return refs.length >= 3
          ? {
              status: "already_satisfied",
              output_refs: refs,
              result_schema_version: 1,
              committed_result: {
                effect: "request_withdrawn",
                careItemRef: issueCapabilityResultRef(
                  deps.integrity_key,
                  context,
                  "care_item",
                  refs[0]!,
                ),
                receiptRef: issueCapabilityResultRef(
                  deps.integrity_key,
                  context,
                  "receipt",
                  refs[2]!,
                ),
              },
            }
          : { status: "conflict", reason_code: "withdrawal_evidence_unavailable" };
      }
      if (
        facts.lifecycle_state !== "active" ||
        facts.lifecycle_head !== input.expected_lifecycle_head
      ) {
        return { status: "conflict", reason_code: "stale_confirmation" };
      }
      return { status: "ready" };
    },
    async apply(transaction, input, context) {
      const familyCare = transaction.familyCare;
      if (!familyCare?.loadG2WithdrawalFacts || !familyCare.applyG2Withdrawal) {
        throw new Error("family care G2 withdrawal port is unavailable");
      }
      const facts = await familyCare.loadG2WithdrawalFacts({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        item_id: input.item_id,
      });
      if (!facts.current_guardian_role_assignment_id || !withdrawalAuthority(facts)) {
        throw new Error("G2 withdrawal facts changed inside the transaction");
      }
      const applied = await familyCare.applyG2Withdrawal({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        item_id: input.item_id,
        current_guardian_role_assignment_id: facts.current_guardian_role_assignment_id,
        expected_lifecycle_head: input.expected_lifecycle_head,
      });
      return {
        output_refs: [
          applied.item_ref,
          applied.withdrawal_event_ref,
          applied.receipt_ref,
        ],
        result_schema_version: 1,
        committed_result: {
          effect: "request_withdrawn",
          careItemRef: issueCapabilityResultRef(
            deps.integrity_key,
            context,
            "care_item",
            applied.item_ref,
          ),
          receiptRef: issueCapabilityResultRef(
            deps.integrity_key,
            context,
            "receipt",
            applied.receipt_ref,
          ),
        },
      };
    },
  });

export type RedactFamilyCareMessageCommandV1 = {
  message_id: string;
  expected_message_version: number;
  cascade_audit_id: string;
  cascade_scope: "source_question" | "reply_local";
  actor_kind: "author" | "policy";
  policy_decision_ref?: string;
  expected_policy_decision_head?: number;
};

export const canonicalizeRedactFamilyCareMessageCommand = (
  input: RedactFamilyCareMessageCommandV1,
): unknown => ({ ...input });

const redactionAuthority = (
  facts: G2MessageChangeFacts,
  actorKind: RedactFamilyCareMessageCommandV1["actor_kind"],
): boolean =>
  facts.participant_active &&
  facts.message_present &&
  facts.writer_contract === "harness_g2_v1" &&
  Boolean(facts.message_kind) &&
  (actorKind === "author"
    ? facts.exact_author &&
      facts.same_side_reachable &&
      Boolean(facts.current_author_role_assignment_id)
    : facts.policy_actor_authorized && Boolean(facts.policy_role_assignment_id));

const prepareRedaction = async (
  deps: LifecyclePrepareDependencies,
  request: LifecyclePrepareRequest,
  actorKind: RedactFamilyCareMessageCommandV1["actor_kind"],
): Promise<LifecyclePrepareDecision> => {
  const policyInput =
    actorKind === "policy"
      ? parsePolicyRedactFamilyCareMessageInputV1(request.operation_input)
      : undefined;
  if (policyInput?.status === "invalid") {
    return { status: "needs_input", fields: policyInput.fields };
  }
  if (actorKind === "author" && !emptyInput(request.operation_input)) {
    return { status: "needs_input", fields: ["operation_input"] };
  }
  const messageId = resolveFamilyCareMessageTargetRef(
    deps.integrity_key,
    { workspace_id: request.workspace_id, participant_id: request.participant_id },
    request.target_option_ref,
  );
  if (!messageId) return { status: "denied", reason_code: "not_authorized" };
  const facts = await deps.facts.loadG2MessageChangeFacts({
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    message_id: messageId,
  });
  if (!redactionAuthority(facts, actorKind)) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  const policyDecision =
    actorKind === "policy" && policyInput?.status === "ok"
      ? resolvePolicyRedactionDecisionRef(
          deps.integrity_key,
          { workspace_id: request.workspace_id, participant_id: request.participant_id },
          policyInput.input.policyDecisionRef,
        )
      : undefined;
  if (
    actorKind === "policy" &&
    (!policyDecision ||
      policyDecision.message_id !== messageId ||
      policyDecision.message_version !== facts.message_version)
  ) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  if (facts.message_status !== "sent" && facts.message_status !== "redacted") {
    return { status: "denied", reason_code: "target_unavailable" };
  }
  const commandRequestId = (deps.create_command_id ?? (() => `command:${randomUUID()}`))();
  const command: RedactFamilyCareMessageCommandV1 = {
    message_id: messageId,
    expected_message_version: facts.message_version ?? 0,
    cascade_audit_id: (deps.create_cascade_audit_id ?? randomUUID)(),
    cascade_scope: facts.message_kind === "family_message" ? "source_question" : "reply_local",
    actor_kind: actorKind,
    ...(actorKind === "policy" && policyInput?.status === "ok" && policyDecision
      ? {
          policy_decision_ref: policyInput.input.policyDecisionRef,
          expected_policy_decision_head: policyDecision.message_version,
        }
      : {}),
  };
  const capability =
    actorKind === "author"
      ? REDACT_FAMILY_CARE_MESSAGE_CAPABILITY
      : POLICY_REDACT_FAMILY_CARE_MESSAGE_CAPABILITY;
  const issued = await issueHarnessConfirmation(deps.contexts, {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    surface: request.surface,
    ...(request.host_conversation_ref
      ? { host_conversation_ref: request.host_conversation_ref }
      : {}),
    payload: {
      capability_key: capability.key,
      capability_version: capability.version,
      command_request_id: commandRequestId,
      target_refs: {
        family_care_message: messageId,
        cascade_audit: command.cascade_audit_id,
        ...(facts.source_item_id ? { care_item: facts.source_item_id } : {}),
        redaction_scope: command.cascade_scope,
      },
      expected_heads: {
        message: command.expected_message_version,
        ...(command.expected_policy_decision_head !== undefined
          ? { policy_decision: command.expected_policy_decision_head }
          : {}),
      },
      input_integrity_tag: computeHarnessInputIntegrityTag(
        deps.integrity_key,
        canonicalizeRedactFamilyCareMessageCommand(command),
      ),
      integrity_tag_version: 1,
    },
  });
  return {
    status: "ready_to_confirm",
    preview: {
      target_label: "Family care message",
      effect:
        actorKind === "author"
          ? "redact_family_care_message_irreversibly"
          : "apply_policy_redaction",
    },
    confirmation_ref: issued.token,
    expires_at: issued.expires_at,
    command_request_id: commandRequestId,
  };
};

export const prepareRedactFamilyCareMessage = (
  deps: LifecyclePrepareDependencies,
  request: LifecyclePrepareRequest,
): Promise<LifecyclePrepareDecision> => prepareRedaction(deps, request, "author");

export const preparePolicyRedactFamilyCareMessage = (
  deps: LifecyclePrepareDependencies,
  request: LifecyclePrepareRequest,
): Promise<LifecyclePrepareDecision> => prepareRedaction(deps, request, "policy");

const parseRedactionFinalization = (value: unknown): G2RedactionFinalization | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Partial<G2RedactionFinalization>;
  if (
    typeof record.cascade_audit_id !== "string" ||
    typeof record.root_message_id !== "string" ||
    (record.cascade_scope !== "source_question" && record.cascade_scope !== "reply_local") ||
    !Array.isArray(record.affected_refs)
  ) {
    return null;
  }
  return record as G2RedactionFinalization;
};

export const createRedactFamilyCareMessageSpec = (
  actorKind: RedactFamilyCareMessageCommandV1["actor_kind"],
  deps: { integrity_key: string },
): NurtureCommandSpec<RedactFamilyCareMessageCommandV1> => {
  const capability =
    actorKind === "author"
      ? REDACT_FAMILY_CARE_MESSAGE_CAPABILITY
      : POLICY_REDACT_FAMILY_CARE_MESSAGE_CAPABILITY;
  return {
    command_key: capability.key,
    command_scope: "family_care",
    contract_version: 1,
    canonicalize: canonicalizeRedactFamilyCareMessageCommand,
    async checkPreconditions(transaction, input, context) {
      const familyCare = transaction.familyCare;
      if (!familyCare?.loadG2MessageChangeFacts) {
        return { status: "invalid", reason_code: "family_care_port_unavailable" };
      }
      if (input.actor_kind !== actorKind) {
        return { status: "invalid", reason_code: "invalid_redaction_actor" };
      }
      if (
        (actorKind === "policy" &&
          (typeof input.policy_decision_ref !== "string" ||
            input.expected_policy_decision_head === undefined)) ||
        (actorKind === "author" &&
          (input.policy_decision_ref !== undefined ||
            input.expected_policy_decision_head !== undefined))
      ) {
        return { status: "invalid", reason_code: "invalid_policy_decision" };
      }
      const facts = await familyCare.loadG2MessageChangeFacts({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        message_id: input.message_id,
      });
      if (!redactionAuthority(facts, actorKind)) {
        return { status: "blocked", reason_code: "not_authorized" };
      }
      if (actorKind === "policy") {
        const policyDecision = resolvePolicyRedactionDecisionRef(
          deps.integrity_key,
          { workspace_id: context.workspace_id, participant_id: context.business_actor_ref },
          input.policy_decision_ref!,
        );
        if (
          !policyDecision ||
          policyDecision.message_id !== input.message_id ||
          policyDecision.message_version !== input.expected_policy_decision_head ||
          facts.message_version !== policyDecision.message_version
        ) {
          return { status: "conflict", reason_code: "stale_confirmation" };
        }
      }
      if (facts.message_status === "redacted") {
        const refs = facts.existing_redaction_refs ?? [];
        return refs.length >= 2
          ? {
              status: "already_satisfied",
              output_refs: refs,
              result_schema_version: 1,
              committed_result:
                actorKind === "author"
                  ? {
                      effect: "content_redacted",
                      messageRef: issueCapabilityResultRef(
                        deps.integrity_key,
                        context,
                        "message",
                        refs[0]!,
                      ),
                      tombstoneRef: issueCapabilityResultRef(
                        deps.integrity_key,
                        context,
                        "redaction_tombstone",
                        refs[0]!,
                      ),
                    }
                  : {
                      effect: "policy_content_redacted",
                      messageRef: issueCapabilityResultRef(
                        deps.integrity_key,
                        context,
                        "message",
                        refs[0]!,
                      ),
                      tombstoneRef: issueCapabilityResultRef(
                        deps.integrity_key,
                        context,
                        "redaction_tombstone",
                        refs[0]!,
                      ),
                      auditEventRef: issueCapabilityResultRef(
                        deps.integrity_key,
                        context,
                        "policy_audit_event",
                        refs[1]!,
                      ),
                    },
            }
          : { status: "conflict", reason_code: "redaction_evidence_unavailable" };
      }
      if (
        facts.message_status !== "sent" ||
        facts.message_version !== input.expected_message_version
      ) {
        return { status: "conflict", reason_code: "stale_confirmation" };
      }
      const expectedScope =
        facts.message_kind === "family_message" ? "source_question" : "reply_local";
      if (input.cascade_scope !== expectedScope) {
        return { status: "invalid", reason_code: "invalid_redaction_scope" };
      }
      return { status: "ready" };
    },
    async apply(transaction, input, context): Promise<NurtureCommandApplyResult> {
      const familyCare = transaction.familyCare;
      if (!familyCare?.loadG2MessageChangeFacts || !familyCare.applyG2Redaction) {
        throw new Error("family care G2 redaction port is unavailable");
      }
      const facts = await familyCare.loadG2MessageChangeFacts({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        message_id: input.message_id,
      });
      const actorRoleAssignmentId =
        actorKind === "author"
          ? facts.current_author_role_assignment_id
          : facts.policy_role_assignment_id;
      if (!actorRoleAssignmentId || !redactionAuthority(facts, actorKind)) {
        throw new Error("G2 redaction facts changed inside the transaction");
      }
      if (actorKind === "policy") {
        const policyDecision = resolvePolicyRedactionDecisionRef(
          deps.integrity_key,
          { workspace_id: context.workspace_id, participant_id: context.business_actor_ref },
          input.policy_decision_ref!,
        );
        if (
          !policyDecision ||
          policyDecision.message_id !== input.message_id ||
          policyDecision.message_version !== input.expected_policy_decision_head ||
          facts.message_version !== policyDecision.message_version
        ) {
          throw new Error("G2 policy redaction decision changed inside the transaction");
        }
      }
      const applied = await familyCare.applyG2Redaction({
        workspace_id: context.workspace_id,
        participant_id: context.business_actor_ref,
        message_id: input.message_id,
        actor_role_assignment_id: actorRoleAssignmentId,
        expected_message_version: input.expected_message_version,
        cascade_audit_id: input.cascade_audit_id,
        cascade_scope: input.cascade_scope,
        reason_code: actorKind === "author" ? "author_redaction" : "policy_redaction",
      });
      return {
        output_refs: [
          applied.message_ref,
          ...(applied.item_ref ? [applied.item_ref] : []),
          applied.cascade_audit_ref,
        ],
        result_schema_version: 1,
        committed_result:
          actorKind === "author"
            ? {
                effect: "content_redacted",
                messageRef: issueCapabilityResultRef(
                  deps.integrity_key,
                  context,
                  "message",
                  applied.message_ref,
                ),
                tombstoneRef: issueCapabilityResultRef(
                  deps.integrity_key,
                  context,
                  "redaction_tombstone",
                  applied.message_ref,
                ),
              }
            : {
                effect: "policy_content_redacted",
                messageRef: issueCapabilityResultRef(
                  deps.integrity_key,
                  context,
                  "message",
                  applied.message_ref,
                ),
                tombstoneRef: issueCapabilityResultRef(
                  deps.integrity_key,
                  context,
                  "redaction_tombstone",
                  applied.message_ref,
                ),
                auditEventRef: issueCapabilityResultRef(
                  deps.integrity_key,
                  context,
                  "policy_audit_event",
                  applied.cascade_audit_ref,
                ),
              },
        finalization_payload: applied.finalization,
      };
    },
    async afterExecutionCreated(transaction, _input, context, applied) {
      if (applied.business_outcome !== "applied") return;
      const finalization = parseRedactionFinalization(applied.finalization_payload);
      if (!finalization || !transaction.familyCare?.finalizeG2Redaction) {
        throw new Error("G2 redaction finalization is unavailable");
      }
      await transaction.familyCare.finalizeG2Redaction({
        workspace_id: context.workspace_id,
        ...finalization,
        command_execution_id: applied.execution.id,
      });
    },
  };
};
