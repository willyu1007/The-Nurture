import {
  TEACHER_RELEASE_OWNER_INTERFACE,
  TEACHER_RELEASE_OWNER_QUERY_PATH,
  TEACHER_RELEASE_OWNER_TARGETS_PATH,
  TEACHER_RELEASE_OWNER_PREPARE_PATH,
  TEACHER_RELEASE_OWNER_CONFIRM_PATH,
} from "@the-nurture/scenario";
import type {
  TeacherReleaseOwnerConfirmRequestV3,
  TeacherReleaseOwnerIdentityV3,
  TeacherReleaseOwnerPrepareRequestV3,
  TeacherReleaseOwnerQueryRequestV3,
  TeacherReleaseOwnerTargetsRequestV3,
} from "./teacher-release-owner-composition.js";

export {
  TEACHER_RELEASE_OWNER_INTERFACE,
  TEACHER_RELEASE_OWNER_QUERY_PATH,
  TEACHER_RELEASE_OWNER_TARGETS_PATH,
  TEACHER_RELEASE_OWNER_PREPARE_PATH,
  TEACHER_RELEASE_OWNER_CONFIRM_PATH,
};

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,2047}$/;
const COMMON_KEYS = [
  "interface_contract",
  "workspace_id",
  "my_chat_user_id",
  "host_request_id",
  "host_conversation_ref",
] as const;

export class TeacherReleaseOwnerRequestParseError extends Error {
  constructor(
    readonly code:
      | "invalid_teacher_release_owner_request"
      | "teacher_release_owner_contract_mismatch",
  ) {
    super(code);
    this.name = "TeacherReleaseOwnerRequestParseError";
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const parseIdentity = (
  body: unknown,
  operationKeys: readonly string[],
): {
  record: Record<string, unknown>;
  identity: TeacherReleaseOwnerIdentityV3;
} => {
  if (!isRecord(body)) throw invalidRequest();
  const allowedKeys = new Set<string>([...COMMON_KEYS, ...operationKeys]);
  if (Object.keys(body).some((key) => !allowedKeys.has(key)))
    throw invalidRequest();

  if (
    !isRecord(body.interface_contract) ||
    Object.keys(body.interface_contract).length !== 3 ||
    body.interface_contract.key !== TEACHER_RELEASE_OWNER_INTERFACE.key ||
    body.interface_contract.version !==
      TEACHER_RELEASE_OWNER_INTERFACE.version ||
    body.interface_contract.digest !== TEACHER_RELEASE_OWNER_INTERFACE.digest
  ) {
    throw new TeacherReleaseOwnerRequestParseError(
      "teacher_release_owner_contract_mismatch",
    );
  }
  if (
    typeof body.workspace_id !== "string" ||
    !ID_PATTERN.test(body.workspace_id) ||
    typeof body.my_chat_user_id !== "string" ||
    !ID_PATTERN.test(body.my_chat_user_id) ||
    typeof body.host_request_id !== "string" ||
    !ID_PATTERN.test(body.host_request_id) ||
    (body.host_conversation_ref !== undefined &&
      (typeof body.host_conversation_ref !== "string" ||
        !REF_PATTERN.test(body.host_conversation_ref)))
  ) {
    throw invalidRequest();
  }
  return {
    record: body,
    identity: {
      workspace_id: body.workspace_id,
      my_chat_user_id: body.my_chat_user_id,
      host_request_id: body.host_request_id,
      ...(typeof body.host_conversation_ref === "string"
        ? { host_conversation_ref: body.host_conversation_ref }
        : {}),
    },
  };
};

export const parseTeacherReleaseOwnerQueryRequestV3 = (
  body: unknown,
): TeacherReleaseOwnerQueryRequestV3 => {
  const { record, identity } = parseIdentity(body, ["page_size", "cursor"]);
  if (
    (record.page_size !== undefined &&
      (typeof record.page_size !== "number" ||
        !Number.isSafeInteger(record.page_size) ||
        record.page_size < 1 ||
        record.page_size > 20)) ||
    (record.cursor !== undefined &&
      (typeof record.cursor !== "string" || !REF_PATTERN.test(record.cursor)))
  ) {
    throw invalidRequest();
  }
  return {
    ...identity,
    ...(typeof record.page_size === "number"
      ? { page_size: record.page_size }
      : {}),
    ...(typeof record.cursor === "string" ? { cursor: record.cursor } : {}),
  };
};

export const parseTeacherReleaseOwnerPrepareRequestV3 = (
  body: unknown,
): TeacherReleaseOwnerPrepareRequestV3 => {
  const { record, identity } = parseIdentity(body, [
    "process_ref",
    "action_option_ref",
    "target_snapshot_ref",
  ]);
  if (
    !isRef(record.process_ref) ||
    !isRef(record.action_option_ref) ||
    !isRef(record.target_snapshot_ref) ||
    record.process_ref !== record.action_option_ref
  )
    throw invalidRequest();
  return {
    ...identity,
    process_ref: record.process_ref,
    action_option_ref: record.action_option_ref,
    target_snapshot_ref: record.target_snapshot_ref,
  };
};

export const parseTeacherReleaseOwnerTargetsRequestV3 = (
  body: unknown,
): TeacherReleaseOwnerTargetsRequestV3 => {
  const { record, identity } = parseIdentity(body, [
    "process_ref",
    "action_option_ref",
  ]);
  if (
    !isRef(record.process_ref) ||
    !isRef(record.action_option_ref) ||
    record.process_ref !== record.action_option_ref
  ) {
    throw invalidRequest();
  }
  return {
    ...identity,
    process_ref: record.process_ref,
    action_option_ref: record.action_option_ref,
  };
};

export const parseTeacherReleaseOwnerConfirmRequestV3 = (
  body: unknown,
): TeacherReleaseOwnerConfirmRequestV3 => {
  const { record, identity } = parseIdentity(body, [
    "invocation_request_id",
    "command_request_id",
    "confirmation_ref",
  ]);
  if (
    typeof record.invocation_request_id !== "string" ||
    !ID_PATTERN.test(record.invocation_request_id) ||
    typeof record.command_request_id !== "string" ||
    !ID_PATTERN.test(record.command_request_id) ||
    typeof record.confirmation_ref !== "string" ||
    !/^[A-Za-z0-9_-]{32,256}$/.test(record.confirmation_ref)
  ) {
    throw invalidRequest();
  }
  return {
    ...identity,
    invocation_request_id: record.invocation_request_id,
    command_request_id: record.command_request_id,
    confirmation_ref: record.confirmation_ref,
  };
};

const isRef = (value: unknown): value is string =>
  typeof value === "string" && REF_PATTERN.test(value);

const invalidRequest = (): TeacherReleaseOwnerRequestParseError =>
  new TeacherReleaseOwnerRequestParseError(
    "invalid_teacher_release_owner_request",
  );
