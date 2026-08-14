import {
  TEACHER_COMMUNICATION_OWNER_INTERFACE,
  TEACHER_COMMUNICATION_OWNER_MARK_READ_PATH,
  TEACHER_COMMUNICATION_OWNER_MEMBERSHIP_PATH,
  TEACHER_COMMUNICATION_OWNER_SEND_TEXT_PATH,
  TEACHER_COMMUNICATION_OWNER_TARGETS_PATH,
  TEACHER_COMMUNICATION_OWNER_TIMELINE_PATH,
  TEACHER_COMMUNICATION_OWNER_WITHDRAW_STAGED_PATH,
} from "@the-nurture/scenario";

export {
  TEACHER_COMMUNICATION_OWNER_INTERFACE,
  TEACHER_COMMUNICATION_OWNER_MARK_READ_PATH,
  TEACHER_COMMUNICATION_OWNER_MEMBERSHIP_PATH,
  TEACHER_COMMUNICATION_OWNER_SEND_TEXT_PATH,
  TEACHER_COMMUNICATION_OWNER_TARGETS_PATH,
  TEACHER_COMMUNICATION_OWNER_TIMELINE_PATH,
  TEACHER_COMMUNICATION_OWNER_WITHDRAW_STAGED_PATH,
};

type TeacherCommunicationIdentityV1 = Readonly<{
  interface_contract: typeof TEACHER_COMMUNICATION_OWNER_INTERFACE;
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
}>;

export type TeacherCommunicationTargetsRequestV1 =
  TeacherCommunicationIdentityV1 & Readonly<{ class_ref: string }>;

export type TeacherCommunicationMembershipRequestV1 =
  TeacherCommunicationIdentityV1 &
    Readonly<{ class_ref: string; thread_ref: string }>;

export type TeacherCommunicationTimelineRequestV1 =
  TeacherCommunicationIdentityV1 &
    Readonly<{ class_ref: string; thread_ref: string; cursor?: string }>;

export type TeacherCommunicationSendTextRequestV1 =
  TeacherCommunicationIdentityV1 &
    Readonly<{ class_ref: string; thread_ref: string; command_request_id: string }> &
    (
      | Readonly<{ kind: "prepare"; prepare: Readonly<{ text: string }> }>
      | Readonly<{
          kind: "confirm";
          confirm: Readonly<{
            confirmation_ref: string;
            prepared_preview_digest: string;
          }>;
        }>
    );

export type TeacherCommunicationWithdrawStagedRequestV1 =
  TeacherCommunicationIdentityV1 &
    Readonly<{ class_ref: string; process_ref: string; command_request_id: string }>;

export type TeacherCommunicationMarkReadRequestV1 =
  TeacherCommunicationIdentityV1 &
    Readonly<{
      class_ref: string;
      thread_ref: string;
      message_ref: string;
      command_request_id: string;
    }>;

export class TeacherCommunicationRequestParseError extends Error {
  readonly code:
    | "invalid_teacher_communication_request"
    | "teacher_communication_contract_mismatch";

  constructor(
    code:
      | "invalid_teacher_communication_request"
      | "teacher_communication_contract_mismatch",
  ) {
    super(code);
    this.name = "TeacherCommunicationRequestParseError";
    this.code = code;
  }
}

export const parseTeacherCommunicationTargetsRequestV1 = (
  value: unknown,
): TeacherCommunicationTargetsRequestV1 => {
  const body = parseBase(value, ["class_ref"]);
  return Object.freeze({ ...identity(body), class_ref: opaqueRef(body.class_ref) });
};

export const parseTeacherCommunicationMembershipRequestV1 = (
  value: unknown,
): TeacherCommunicationMembershipRequestV1 => {
  const body = parseBase(value, ["class_ref", "thread_ref"]);
  return Object.freeze({
    ...identity(body),
    class_ref: opaqueRef(body.class_ref),
    thread_ref: opaqueRef(body.thread_ref),
  });
};

export const parseTeacherCommunicationTimelineRequestV1 = (
  value: unknown,
): TeacherCommunicationTimelineRequestV1 => {
  const body = parseBase(value, ["class_ref", "thread_ref"], ["cursor"]);
  const cursor = body.cursor === undefined
    ? undefined
    : requiredString(body.cursor, 1, 256);
  return Object.freeze({
    ...identity(body),
    class_ref: opaqueRef(body.class_ref),
    thread_ref: opaqueRef(body.thread_ref),
    ...(cursor !== undefined ? { cursor } : {}),
  });
};

export const parseTeacherCommunicationSendTextRequestV1 = (
  value: unknown,
): TeacherCommunicationSendTextRequestV1 => {
  const body = parseBase(
    value,
    ["class_ref", "thread_ref", "command_request_id", "kind"],
    ["prepare", "confirm"],
  );
  const shared = Object.freeze({
    ...identity(body),
    class_ref: opaqueRef(body.class_ref),
    thread_ref: opaqueRef(body.thread_ref),
    command_request_id: commandRequestId(body.command_request_id),
  });
  if (body.kind === "prepare") {
    if (Object.hasOwn(body, "confirm") || !isRecord(body.prepare)) {
      throw invalidRequest();
    }
    const prepare = body.prepare;
    if (Object.keys(prepare).join("|") !== "text") throw invalidRequest();
    return Object.freeze({
      ...shared,
      kind: "prepare" as const,
      prepare: Object.freeze({ text: requiredString(prepare.text, 1, 2000) }),
    });
  }
  if (body.kind === "confirm") {
    if (Object.hasOwn(body, "prepare") || !isRecord(body.confirm)) {
      throw invalidRequest();
    }
    const confirm = body.confirm;
    if (
      Object.keys(confirm).sort().join("|")
        !== "confirmation_ref|prepared_preview_digest"
    ) {
      throw invalidRequest();
    }
    return Object.freeze({
      ...shared,
      kind: "confirm" as const,
      confirm: Object.freeze({
        confirmation_ref: opaqueRef(confirm.confirmation_ref),
        prepared_preview_digest: sha256Digest(confirm.prepared_preview_digest),
      }),
    });
  }
  throw invalidRequest();
};

export const parseTeacherCommunicationWithdrawStagedRequestV1 = (
  value: unknown,
): TeacherCommunicationWithdrawStagedRequestV1 => {
  const body = parseBase(value, ["class_ref", "process_ref", "command_request_id"]);
  return Object.freeze({
    ...identity(body),
    class_ref: opaqueRef(body.class_ref),
    process_ref: opaqueRef(body.process_ref),
    command_request_id: commandRequestId(body.command_request_id),
  });
};

export const parseTeacherCommunicationMarkReadRequestV1 = (
  value: unknown,
): TeacherCommunicationMarkReadRequestV1 => {
  const body = parseBase(value, [
    "class_ref",
    "thread_ref",
    "message_ref",
    "command_request_id",
  ]);
  return Object.freeze({
    ...identity(body),
    class_ref: opaqueRef(body.class_ref),
    thread_ref: opaqueRef(body.thread_ref),
    message_ref: opaqueRef(body.message_ref),
    command_request_id: commandRequestId(body.command_request_id),
  });
};

const identity = (
  body: Record<string, unknown>,
): TeacherCommunicationIdentityV1 =>
  Object.freeze({
    interface_contract: TEACHER_COMMUNICATION_OWNER_INTERFACE,
    workspace_id: requiredString(body.workspace_id, 1, 256),
    my_chat_user_id: requiredString(body.my_chat_user_id, 1, 256),
    // The command kernel rejects invocation ids outside its pattern, so a
    // malformed one must die here as invalid, not later as unavailable.
    host_request_id: invocationRequestId(body.host_request_id),
    context_ref: opaqueRef(body.context_ref),
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
    || contract.key !== TEACHER_COMMUNICATION_OWNER_INTERFACE.key
    || contract.version !== TEACHER_COMMUNICATION_OWNER_INTERFACE.version
    || contract.digest !== TEACHER_COMMUNICATION_OWNER_INTERFACE.digest
  ) {
    throw new TeacherCommunicationRequestParseError(
      "teacher_communication_contract_mismatch",
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

const sha256Digest = (value: unknown): string => {
  const digest = requiredString(value, 71, 71);
  if (!/^sha256:[a-f0-9]{64}$/.test(digest)) throw invalidRequest();
  return digest;
};

const invalidRequest = (): TeacherCommunicationRequestParseError =>
  new TeacherCommunicationRequestParseError(
    "invalid_teacher_communication_request",
  );

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
