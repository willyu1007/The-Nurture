import {
  INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE,
  type InstitutionBusinessCommunicationDecisionV1,
  type NurtureCommandResult,
} from "@the-nurture/scenario/harness";

/**
 * Private Harness transport layer for the formal ingress. My-Chat provides
 * the authenticated trusted context (workspace, actor, surface); typed
 * operation input stays capability-specific and target/authority fields are
 * never accepted from the caller.
 */
export const HARNESS_PREPARE_PATH = "/internal/nurture/harness/prepare-action";
export const HARNESS_EXECUTE_PATH = "/internal/nurture/harness/execute-action";
export const HARNESS_QUERY_PATH = "/internal/nurture/harness/query";
export const HARNESS_READ_RESULT_PATH = "/internal/nurture/harness/read-result";
export const INSTITUTION_BUSINESS_COMMUNICATION_READ_PATH =
  "/internal/nurture/institution/business-communications:read";

export const HARNESS_CAPABILITY_KEYS = [
  "submit_family_care_question",
  "acknowledge_family_care_item",
  "reply_family_care_item",
  "correct_family_care_message",
  "withdraw_family_care_request",
  "redact_family_care_message",
  "policy_redact_family_care_message",
] as const;

export const HARNESS_QUERY_CAPABILITY_KEYS = [
  "query_guardian_family_care_timeline",
  "query_caregiver_family_care_work",
  "query_family_care_item",
] as const;

export type HarnessCapabilityKey = (typeof HARNESS_CAPABILITY_KEYS)[number];
export type HarnessQueryCapabilityKey = (typeof HARNESS_QUERY_CAPABILITY_KEYS)[number];

const CAPABILITY_KEY_SET = new Set<string>(HARNESS_CAPABILITY_KEYS);
const QUERY_CAPABILITY_KEY_SET = new Set<string>(HARNESS_QUERY_CAPABILITY_KEYS);
const SURFACES = new Set(["chat", "board"]);
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,511}$/;

export type HarnessPrepareRequestV1 = {
  workspace_id: string;
  actor_participant_id: string;
  surface: "chat" | "board";
  capability_key: HarnessCapabilityKey;
  capability_version: "1.0.0";
  operation_input?: unknown;
  target_option_ref?: string;
  host_conversation_ref?: string;
};

export type HarnessExecuteRequestV1 = {
  workspace_id: string;
  actor_participant_id: string;
  surface: "chat" | "board";
  capability_key: HarnessCapabilityKey;
  capability_version: "1.0.0";
  invocation_request_id: string;
  command_request_id: string;
  confirmation_ref: string;
  operation_input?: unknown;
  host_conversation_ref?: string;
};

const PREPARE_KEYS = new Set([
  "workspace_id",
  "actor_participant_id",
  "surface",
  "capability_key",
  "capability_version",
  "operation_input",
  "target_option_ref",
  "host_conversation_ref",
]);

const EXECUTE_KEYS = new Set([
  "workspace_id",
  "actor_participant_id",
  "surface",
  "capability_key",
  "capability_version",
  "invocation_request_id",
  "command_request_id",
  "confirmation_ref",
  "operation_input",
  "host_conversation_ref",
]);

export class HarnessRequestParseError extends Error {
  constructor(readonly code: "invalid_harness_request" | "unknown_capability") {
    super(code);
    this.name = "HarnessRequestParseError";
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const parseSharedShell = (
  body: unknown,
  allowedKeys: Set<string>,
  capabilityKeys: Set<string> = CAPABILITY_KEY_SET,
): Record<string, unknown> => {
  if (!isRecord(body) || Object.keys(body).some((key) => !allowedKeys.has(key))) {
    throw new HarnessRequestParseError("invalid_harness_request");
  }
  const record = body;
  if (
    typeof record.workspace_id !== "string" ||
    !ID_PATTERN.test(record.workspace_id) ||
    typeof record.actor_participant_id !== "string" ||
    !ID_PATTERN.test(record.actor_participant_id) ||
    typeof record.surface !== "string" ||
    !SURFACES.has(record.surface)
  ) {
    throw new HarnessRequestParseError("invalid_harness_request");
  }
  if (
    typeof record.capability_key !== "string" ||
    record.capability_version !== "1.0.0"
  ) {
    throw new HarnessRequestParseError("invalid_harness_request");
  }
  if (!capabilityKeys.has(record.capability_key)) {
    throw new HarnessRequestParseError("unknown_capability");
  }
  if (
    record.host_conversation_ref !== undefined &&
    (typeof record.host_conversation_ref !== "string" ||
      !REF_PATTERN.test(record.host_conversation_ref))
  ) {
    throw new HarnessRequestParseError("invalid_harness_request");
  }
  return record;
};

export const parseHarnessPrepareRequestV1 = (body: unknown): HarnessPrepareRequestV1 => {
  const record = parseSharedShell(body, PREPARE_KEYS);
  if (
    record.target_option_ref !== undefined &&
    (typeof record.target_option_ref !== "string" ||
      !REF_PATTERN.test(record.target_option_ref))
  ) {
    throw new HarnessRequestParseError("invalid_harness_request");
  }
  return record as unknown as HarnessPrepareRequestV1;
};

export const parseHarnessExecuteRequestV1 = (body: unknown): HarnessExecuteRequestV1 => {
  const record = parseSharedShell(body, EXECUTE_KEYS);
  if (
    typeof record.invocation_request_id !== "string" ||
    !ID_PATTERN.test(record.invocation_request_id) ||
    typeof record.command_request_id !== "string" ||
    !ID_PATTERN.test(record.command_request_id) ||
    typeof record.confirmation_ref !== "string" ||
    !/^[A-Za-z0-9_-]{32,256}$/.test(record.confirmation_ref)
  ) {
    throw new HarnessRequestParseError("invalid_harness_request");
  }
  return record as unknown as HarnessExecuteRequestV1;
};

export type HarnessQueryRequestV1 = {
  workspace_id: string;
  actor_participant_id: string;
  surface: "chat" | "board";
  capability_key: HarnessQueryCapabilityKey;
  capability_version: "1.0.0";
  page_size?: number;
  cursor?: string;
  target_option_ref?: string;
};

export type HarnessReadResultRequestV1 = {
  workspace_id: string;
  actor_participant_id: string;
  surface: "chat" | "board";
  command_request_id: string;
};

export type InstitutionBusinessCommunicationReadRequestV1 = {
  workspace_id: string;
  actor_participant_id: string;
  surface: "admin";
  interface_contract: typeof INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE;
  target_option_ref: string;
};

export type InstitutionBusinessCommunicationReadResponseV1 =
  InstitutionBusinessCommunicationDecisionV1;

const QUERY_KEYS = new Set([
  "workspace_id",
  "actor_participant_id",
  "surface",
  "capability_key",
  "capability_version",
  "page_size",
  "cursor",
  "target_option_ref",
]);

const READ_RESULT_KEYS = new Set([
  "workspace_id",
  "actor_participant_id",
  "surface",
  "command_request_id",
]);

export const parseHarnessQueryRequestV1 = (body: unknown): HarnessQueryRequestV1 => {
  const record = parseSharedShell(body, QUERY_KEYS, QUERY_CAPABILITY_KEY_SET);
  if (
    (record.page_size !== undefined && typeof record.page_size !== "number") ||
    (record.cursor !== undefined &&
      (typeof record.cursor !== "string" || record.cursor.length > 2_048)) ||
    (record.target_option_ref !== undefined &&
      (typeof record.target_option_ref !== "string" ||
        !REF_PATTERN.test(record.target_option_ref)))
  ) {
    throw new HarnessRequestParseError("invalid_harness_request");
  }
  return record as unknown as HarnessQueryRequestV1;
};

export const parseHarnessReadResultRequestV1 = (
  body: unknown,
): HarnessReadResultRequestV1 => {
  if (!isRecord(body) || Object.keys(body).some((key) => !READ_RESULT_KEYS.has(key))) {
    throw new HarnessRequestParseError("invalid_harness_request");
  }
  const record = body;
  if (
    typeof record.workspace_id !== "string" ||
    !ID_PATTERN.test(record.workspace_id) ||
    typeof record.actor_participant_id !== "string" ||
    !ID_PATTERN.test(record.actor_participant_id) ||
    typeof record.surface !== "string" ||
    !SURFACES.has(record.surface) ||
    typeof record.command_request_id !== "string" ||
    !ID_PATTERN.test(record.command_request_id)
  ) {
    throw new HarnessRequestParseError("invalid_harness_request");
  }
  return record as unknown as HarnessReadResultRequestV1;
};

const INSTITUTION_BUSINESS_COMMUNICATION_READ_KEYS = new Set([
  "workspace_id",
  "actor_participant_id",
  "surface",
  "interface_contract",
  "target_option_ref",
]);

export const parseInstitutionBusinessCommunicationReadRequestV1 = (
  body: unknown,
): InstitutionBusinessCommunicationReadRequestV1 => {
  if (
    !isRecord(body) ||
    Object.keys(body).some(
      (key) => !INSTITUTION_BUSINESS_COMMUNICATION_READ_KEYS.has(key),
    ) ||
    typeof body.workspace_id !== "string" ||
    !ID_PATTERN.test(body.workspace_id) ||
    typeof body.actor_participant_id !== "string" ||
    !ID_PATTERN.test(body.actor_participant_id) ||
    body.surface !== "admin" ||
    typeof body.target_option_ref !== "string" ||
    !REF_PATTERN.test(body.target_option_ref) ||
    !isRecord(body.interface_contract) ||
    Object.keys(body.interface_contract).length !== 3 ||
    body.interface_contract.key !== INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE.key ||
    body.interface_contract.version !==
      INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE.version ||
    body.interface_contract.digest !== INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE.digest
  ) {
    throw new HarnessRequestParseError("invalid_harness_request");
  }
  return body as InstitutionBusinessCommunicationReadRequestV1;
};

export type HarnessQueryResponseV1 =
  | { status: "ok"; output: unknown }
  | { status: "refresh_required" }
  | { status: "denied"; reason_code: string };

export type HarnessPrepareResponseV1 =
  | {
      status: "ready_to_confirm";
      preview: Record<string, string>;
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

export type HarnessExecuteResponseV1 =
  | {
      status: "committed";
      execution_disposition: "executed" | "replayed";
      business_outcome: "applied" | "already_satisfied";
      execution_ref: unknown;
      output_refs: unknown[];
      committed_result?: unknown;
    }
  | {
      status: "not_committed";
      decision: string;
      reason_code: string;
      recovery: "none" | "refresh" | "reprepare" | "retry_same_command";
    }
  | {
      status: "outcome_unknown";
      reason_code: string;
      recovery: "reconcile_same_command";
    };

type HarnessRecovery = "none" | "refresh" | "reprepare" | "retry_same_command";

const RECOVERY_BY_REASON: Record<string, HarnessRecovery> = {
  confirmation_expired: "reprepare",
  input_integrity_mismatch: "reprepare",
  stale_confirmation: "reprepare",
  confirmation_replayed: "refresh",
  command_busy: "retry_same_command",
  command_lookup_failed: "retry_same_command",
  command_execution_failed: "retry_same_command",
};

export const notCommitted = (
  decision: string,
  reasonCode: string,
): HarnessExecuteResponseV1 => ({
  status: "not_committed",
  decision,
  reason_code: reasonCode,
  recovery: RECOVERY_BY_REASON[reasonCode] ?? "none",
});

export const mapHarnessCommandResult = (
  result: NurtureCommandResult,
): HarnessExecuteResponseV1 => {
  if (result.status === "ok") {
    return {
      status: "committed",
      execution_disposition: result.disposition,
      business_outcome: result.business_outcome,
      execution_ref: result.execution_ref,
      output_refs: result.output_refs,
      ...(result.committed_result ? { committed_result: result.committed_result } : {}),
    };
  }
  if (result.status === "outcome_unknown") {
    // Never a substitute command: the caller reconciles this exact identity.
    return {
      status: "outcome_unknown",
      reason_code: result.reason_code,
      recovery: "reconcile_same_command",
    };
  }
  return notCommitted(result.decision, result.reason_code);
};
