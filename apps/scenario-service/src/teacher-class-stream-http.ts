import {
  TEACHER_CLASS_STREAM_CHILD_DAY_DETAIL_PATH,
  TEACHER_CLASS_STREAM_CHILD_STRIP_PATH,
  TEACHER_CLASS_STREAM_CLASS_CONTEXT_PATH,
  TEACHER_CLASS_STREAM_INTERFACE,
  TEACHER_CLASS_STREAM_SCHEDULE_PATH,
} from "@the-nurture/scenario";

export {
  TEACHER_CLASS_STREAM_CHILD_DAY_DETAIL_PATH,
  TEACHER_CLASS_STREAM_CHILD_STRIP_PATH,
  TEACHER_CLASS_STREAM_CLASS_CONTEXT_PATH,
  TEACHER_CLASS_STREAM_INTERFACE,
  TEACHER_CLASS_STREAM_SCHEDULE_PATH,
};

type TeacherClassStreamIdentityV1 = Readonly<{
  interface_contract: typeof TEACHER_CLASS_STREAM_INTERFACE;
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
}>;

export type TeacherClassStreamClassContextRequestV1 =
  TeacherClassStreamIdentityV1 &
    Readonly<{ local_date: string; selected_class_ref?: string }>;

export type TeacherClassStreamChildStripRequestV1 =
  TeacherClassStreamIdentityV1 &
    Readonly<{ class_ref: string; local_date: string }>;

export type TeacherClassStreamChildDayDetailRequestV1 =
  TeacherClassStreamIdentityV1 &
    Readonly<{ class_ref: string; child_ref: string; local_date: string }>;

export type TeacherClassStreamScheduleRequestV1 =
  TeacherClassStreamIdentityV1 &
    Readonly<{ class_ref: string; local_date: string }>;

export class TeacherClassStreamRequestParseError extends Error {
  readonly code:
    | "invalid_teacher_class_stream_request"
    | "teacher_class_stream_contract_mismatch";

  constructor(
    code:
      | "invalid_teacher_class_stream_request"
      | "teacher_class_stream_contract_mismatch",
  ) {
    super(code);
    this.name = "TeacherClassStreamRequestParseError";
    this.code = code;
  }
}

export const parseTeacherClassStreamClassContextRequestV1 = (
  value: unknown,
): TeacherClassStreamClassContextRequestV1 => {
  const body = parseBase(value, ["local_date"], ["selected_class_ref"]);
  const selectedClassRef = optionalString(body.selected_class_ref, 512);
  return Object.freeze({
    ...identity(body),
    local_date: parseLocalDate(body.local_date),
    ...(selectedClassRef ? { selected_class_ref: selectedClassRef } : {}),
  });
};

export const parseTeacherClassStreamChildStripRequestV1 = (
  value: unknown,
): TeacherClassStreamChildStripRequestV1 => {
  const body = parseBase(value, ["class_ref", "local_date"]);
  return Object.freeze({
    ...identity(body),
    class_ref: requiredString(body.class_ref, 512),
    local_date: parseLocalDate(body.local_date),
  });
};

export const parseTeacherClassStreamChildDayDetailRequestV1 = (
  value: unknown,
): TeacherClassStreamChildDayDetailRequestV1 => {
  const body = parseBase(value, ["class_ref", "child_ref", "local_date"]);
  return Object.freeze({
    ...identity(body),
    class_ref: requiredString(body.class_ref, 512),
    child_ref: requiredString(body.child_ref, 512),
    local_date: parseLocalDate(body.local_date),
  });
};

export const parseTeacherClassStreamScheduleRequestV1 = (
  value: unknown,
): TeacherClassStreamScheduleRequestV1 => {
  const body = parseBase(value, ["class_ref", "local_date"]);
  return Object.freeze({
    ...identity(body),
    class_ref: requiredString(body.class_ref, 512),
    local_date: parseLocalDate(body.local_date),
  });
};

const identity = (
  body: Record<string, unknown>,
): TeacherClassStreamIdentityV1 =>
  Object.freeze({
    interface_contract: TEACHER_CLASS_STREAM_INTERFACE,
    workspace_id: requiredString(body.workspace_id, 256),
    my_chat_user_id: requiredString(body.my_chat_user_id, 256),
    host_request_id: requiredString(body.host_request_id, 256),
    context_ref: requiredString(body.context_ref, 512),
  });

const parseBase = (
  value: unknown,
  operationRequired: readonly string[],
  operationOptional: readonly string[] = [],
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
  const allowed = new Set([...required, ...operationOptional]);
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
    || contract.key !== TEACHER_CLASS_STREAM_INTERFACE.key
    || contract.version !== TEACHER_CLASS_STREAM_INTERFACE.version
    || contract.digest !== TEACHER_CLASS_STREAM_INTERFACE.digest
  ) {
    throw new TeacherClassStreamRequestParseError(
      "teacher_class_stream_contract_mismatch",
    );
  }
  return value;
};

const parseLocalDate = (value: unknown): string => {
  const localDate = requiredString(value, 10);
  if (!validDate(localDate)) throw invalidRequest();
  return localDate;
};

const requiredString = (value: unknown, maxLength: number): string => {
  if (
    typeof value !== "string"
    || value.length < 1
    || value.length > maxLength
  ) {
    throw invalidRequest();
  }
  return value;
};

const optionalString = (
  value: unknown,
  maxLength: number,
): string | undefined => {
  if (value === undefined) return undefined;
  return requiredString(value, maxLength);
};

const validDate = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime())
    && date.toISOString().slice(0, 10) === value;
};

const invalidRequest = (): TeacherClassStreamRequestParseError =>
  new TeacherClassStreamRequestParseError("invalid_teacher_class_stream_request");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
