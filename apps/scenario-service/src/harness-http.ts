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

/**
 * Admission is per capability, not per lane: each key names the one exact
 * version the ingress accepts. A shared per-lane version would admit a key at a
 * version it was never registered at, which is the opposite of exact pinning.
 */
export const HARNESS_CAPABILITY_VERSIONS = {
  submit_family_care_question: "1.0.0",
  initiate_caregiver_direct_message: "1.0.0",
  acknowledge_family_care_item: "1.0.0",
  reply_family_care_item: "1.0.0",
  correct_family_care_message: "1.0.0",
  withdraw_family_care_request: "1.0.0",
  redact_family_care_message: "1.0.0",
  policy_redact_family_care_message: "1.0.0",
  update_guardian_current_focus: "1.0.0",
  record_caregiver_daily_care: "1.0.0",
  cancel_publish_process: "1.0.0",
  acquire_publish_edit_hold: "1.0.0",
  renew_publish_edit_hold: "1.0.0",
  release_publish_edit_hold: "1.0.0",
  save_publish_process_draft: "1.0.0",
  confirm_child_media_attribution: "1.0.0",
  reject_child_media_attribution: "1.0.0",
  supersede_child_media_attribution: "1.0.0",
  detach_publish_process_media: "1.0.0",
  discard_media_asset: "1.0.0",
} as const;

export const HARNESS_QUERY_CAPABILITY_VERSIONS = {
  query_guardian_family_care_timeline: "1.1.0",
  query_caregiver_family_care_work: "1.1.0",
  query_family_care_item: "1.1.0",
  query_guardian_family_board: "1.0.0",
  query_guardian_current_focus: "1.0.0",
  query_guardian_enrollment_activity: "1.0.0",
  query_caregiver_teacher_board: "1.0.0",
  query_caregiver_child_today: "1.0.0",
  query_teacher_publish_queue: "1.0.0",
} as const;

export const HARNESS_CAPABILITY_KEYS = Object.keys(
  HARNESS_CAPABILITY_VERSIONS,
) as ReadonlyArray<keyof typeof HARNESS_CAPABILITY_VERSIONS>;

export const HARNESS_QUERY_CAPABILITY_KEYS = Object.keys(
  HARNESS_QUERY_CAPABILITY_VERSIONS,
) as ReadonlyArray<keyof typeof HARNESS_QUERY_CAPABILITY_VERSIONS>;

export type HarnessCapabilityKey = keyof typeof HARNESS_CAPABILITY_VERSIONS;
export type HarnessQueryCapabilityKey = keyof typeof HARNESS_QUERY_CAPABILITY_VERSIONS;

const CAPABILITY_VERSIONS = new Map<string, string>(
  Object.entries(HARNESS_CAPABILITY_VERSIONS),
);
const QUERY_CAPABILITY_VERSIONS = new Map<string, string>(
  Object.entries(HARNESS_QUERY_CAPABILITY_VERSIONS),
);
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
  capabilityVersions: Map<string, string> = CAPABILITY_VERSIONS,
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
  if (typeof record.capability_key !== "string") {
    throw new HarnessRequestParseError("invalid_harness_request");
  }
  const admittedVersion = capabilityVersions.get(record.capability_key);
  if (admittedVersion === undefined) {
    throw new HarnessRequestParseError("unknown_capability");
  }
  if (record.capability_version !== admittedVersion) {
    throw new HarnessRequestParseError("invalid_harness_request");
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
  capability_version: string;
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
  const record = parseSharedShell(body, QUERY_KEYS, QUERY_CAPABILITY_VERSIONS);
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
      // A preview is a safe display projection of the prepared command. Some
      // fields are genuinely numeric (a focus priority); stringifying them here
      // would make the transport reformat domain output.
      preview: Record<string, string | number>;
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
