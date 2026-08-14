import {
  TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE,
  TEACHER_ASSISTANT_QUERY_OWNER_MISSING_RECORDS_PATH,
  TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_DRAFT_PATH,
  TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_SOURCE_PATH,
} from "@the-nurture/scenario";

export {
  TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE,
  TEACHER_ASSISTANT_QUERY_OWNER_MISSING_RECORDS_PATH,
  TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_DRAFT_PATH,
  TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_SOURCE_PATH,
};

type TeacherAssistantQueryIdentityV1 = Readonly<{
  interface_contract: typeof TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE;
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
}>;

export type TeacherAssistantQueryMissingRecordsRequestV1 =
  TeacherAssistantQueryIdentityV1 &
    Readonly<{ class_ref: string; local_date: string }>;

export type TeacherAssistantQueryWeeklySourceRequestV1 =
  TeacherAssistantQueryIdentityV1 &
    Readonly<{ class_ref: string; local_date: string }>;

export type TeacherAssistantQueryWeeklyDraftRequestV1 =
  TeacherAssistantQueryIdentityV1 &
    Readonly<{ class_ref: string; local_date: string; command_request_id: string }>;

export class TeacherAssistantQueryRequestParseError extends Error {
  readonly code:
    | "invalid_teacher_assistant_query_request"
    | "teacher_assistant_query_contract_mismatch";

  constructor(
    code:
      | "invalid_teacher_assistant_query_request"
      | "teacher_assistant_query_contract_mismatch",
  ) {
    super(code);
    this.name = "TeacherAssistantQueryRequestParseError";
    this.code = code;
  }
}

export const parseTeacherAssistantQueryMissingRecordsRequestV1 = (
  value: unknown,
): TeacherAssistantQueryMissingRecordsRequestV1 => {
  const body = parseBase(value, ["class_ref", "local_date"]);
  return Object.freeze({
    ...identity(body),
    class_ref: opaqueRef(body.class_ref),
    local_date: localDate(body.local_date),
  });
};

export const parseTeacherAssistantQueryWeeklySourceRequestV1 = (
  value: unknown,
): TeacherAssistantQueryWeeklySourceRequestV1 => {
  const body = parseBase(value, ["class_ref", "local_date"]);
  return Object.freeze({
    ...identity(body),
    class_ref: opaqueRef(body.class_ref),
    local_date: localDate(body.local_date),
  });
};

export const parseTeacherAssistantQueryWeeklyDraftRequestV1 = (
  value: unknown,
): TeacherAssistantQueryWeeklyDraftRequestV1 => {
  const body = parseBase(value, ["class_ref", "local_date", "command_request_id"]);
  return Object.freeze({
    ...identity(body),
    class_ref: opaqueRef(body.class_ref),
    local_date: localDate(body.local_date),
    command_request_id: commandRequestId(body.command_request_id),
  });
};

const identity = (
  body: Record<string, unknown>,
): TeacherAssistantQueryIdentityV1 =>
  Object.freeze({
    interface_contract: TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE,
    workspace_id: requiredString(body.workspace_id, 1, 256),
    my_chat_user_id: requiredString(body.my_chat_user_id, 1, 256),
    // The command kernel rejects invocation ids outside its pattern, so a
    // malformed one must die here as invalid, not later as unavailable.
    host_request_id: invocationRequestId(body.host_request_id),
    context_ref: opaqueRef(body.context_ref),
  });

// Week boundaries are owner-computed: the allowlist below rejects any
// week_start/week_end (or other hidden field) at parse time.
const parseBase = (
  value: unknown,
  operationRequired: readonly string[],
): Record<string, unknown> => {
  if (!isRecord(value)) throw invalidRequest();
  const required = [
    "interface_contract",
    "workspace_id",
    "my_chat_user_id",
    "host_request_id",
    "context_ref",
    ...operationRequired,
  ];
  const allowed = new Set(required);
  const keys = Object.keys(value);
  if (
    required.some((key) => !Object.hasOwn(value, key))
    || keys.some((key) => !allowed.has(key))
  ) {
    throw invalidRequest();
  }
  const contract = value.interface_contract;
  if (
    !isRecord(contract)
    || Object.keys(contract).sort().join("|") !== "digest|key|version"
    || contract.key !== TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE.key
    || contract.version !== TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE.version
    || contract.digest !== TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE.digest
  ) {
    throw new TeacherAssistantQueryRequestParseError(
      "teacher_assistant_query_contract_mismatch",
    );
  }
  return value;
};

const requiredString = (
  value: unknown,
  minLength: number,
  maxLength: number,
): string => {
  if (
    typeof value !== "string"
    || value.length < minLength
    || value.length > maxLength
  ) {
    throw invalidRequest();
  }
  return value;
};

const invocationRequestId = (value: unknown): string => {
  const candidate = requiredString(value, 1, 200);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(candidate)) {
    throw invalidRequest();
  }
  return candidate;
};

const opaqueRef = (value: unknown): string => requiredString(value, 8, 512);

const commandRequestId = (value: unknown): string =>
  requiredString(value, 8, 128);

const localDate = (value: unknown): string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw invalidRequest();
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime())
    || parsed.toISOString().slice(0, 10) !== value
  ) {
    throw invalidRequest();
  }
  return value;
};

const invalidRequest = (): TeacherAssistantQueryRequestParseError =>
  new TeacherAssistantQueryRequestParseError(
    "invalid_teacher_assistant_query_request",
  );

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
