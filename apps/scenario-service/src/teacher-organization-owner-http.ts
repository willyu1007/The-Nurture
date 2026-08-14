import {
  TEACHER_ORGANIZATION_OWNER_CLASS_NOTE_PATH,
  TEACHER_ORGANIZATION_OWNER_FEED_PATH,
  TEACHER_ORGANIZATION_OWNER_INTERFACE,
  TEACHER_ORGANIZATION_OWNER_ORGANIZATION_PATH,
  TEACHER_ORGANIZATION_OWNER_ORGANIZE_PATH,
  TEACHER_ORGANIZATION_OWNER_QUEUE_ADMISSION_PATH,
  TEACHER_ORGANIZATION_OWNER_SUPPLEMENT_PATH,
} from "@the-nurture/scenario";

export {
  TEACHER_ORGANIZATION_OWNER_CLASS_NOTE_PATH,
  TEACHER_ORGANIZATION_OWNER_FEED_PATH,
  TEACHER_ORGANIZATION_OWNER_INTERFACE,
  TEACHER_ORGANIZATION_OWNER_ORGANIZATION_PATH,
  TEACHER_ORGANIZATION_OWNER_ORGANIZE_PATH,
  TEACHER_ORGANIZATION_OWNER_QUEUE_ADMISSION_PATH,
  TEACHER_ORGANIZATION_OWNER_SUPPLEMENT_PATH,
};

type TeacherOrganizationIdentityV1 = Readonly<{
  interface_contract: typeof TEACHER_ORGANIZATION_OWNER_INTERFACE;
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
}>;

export type TeacherOrganizationFeedRequestV1 = TeacherOrganizationIdentityV1 &
  Readonly<{ class_ref: string }>;

export type TeacherOrganizationOrganizationRequestV1 =
  TeacherOrganizationFeedRequestV1;

export type TeacherOrganizationOrganizeRequestV1 =
  TeacherOrganizationIdentityV1 &
    Readonly<{ class_ref: string; command_request_id: string; trigger: "manual" }>;

export type TeacherOrganizationSupplementRequestV1 =
  TeacherOrganizationIdentityV1 &
    Readonly<{
      class_ref: string;
      child_ref: string;
      command_request_id: string;
    }> &
    (
      | Readonly<{
          kind: "prepare";
          prepare: Readonly<{
            local_date: string;
            care_kind: "meal" | "nap" | "mood" | "activity" | "health_observation";
            text: string;
          }>;
        }>
      | Readonly<{
          kind: "confirm";
          confirm: Readonly<{
            confirmation_ref: string;
            prepared_preview_digest: string;
          }>;
        }>
    );

export type TeacherOrganizationClassNoteRequestV1 =
  TeacherOrganizationIdentityV1 &
    Readonly<{ class_ref: string; command_request_id: string; text: string }>;

export type TeacherOrganizationQueueAdmissionRequestV1 =
  TeacherOrganizationIdentityV1 &
    Readonly<{ class_ref: string; process_ref: string; command_request_id: string }>;

export class TeacherOrganizationRequestParseError extends Error {
  readonly code:
    | "invalid_teacher_organization_request"
    | "teacher_organization_contract_mismatch";

  constructor(
    code:
      | "invalid_teacher_organization_request"
      | "teacher_organization_contract_mismatch",
  ) {
    super(code);
    this.name = "TeacherOrganizationRequestParseError";
    this.code = code;
  }
}

const CARE_KINDS = new Set([
  "meal",
  "nap",
  "mood",
  "activity",
  "health_observation",
]);

export const parseTeacherOrganizationFeedRequestV1 = (
  value: unknown,
): TeacherOrganizationFeedRequestV1 => {
  const body = parseBase(value, ["class_ref"]);
  return Object.freeze({ ...identity(body), class_ref: opaqueRef(body.class_ref) });
};

export const parseTeacherOrganizationOrganizationRequestV1 = (
  value: unknown,
): TeacherOrganizationOrganizationRequestV1 =>
  parseTeacherOrganizationFeedRequestV1(value);

export const parseTeacherOrganizationOrganizeRequestV1 = (
  value: unknown,
): TeacherOrganizationOrganizeRequestV1 => {
  const body = parseBase(value, ["class_ref", "command_request_id", "trigger"]);
  if (body.trigger !== "manual") throw invalidRequest();
  return Object.freeze({
    ...identity(body),
    class_ref: opaqueRef(body.class_ref),
    command_request_id: commandRequestId(body.command_request_id),
    trigger: "manual" as const,
  });
};

export const parseTeacherOrganizationSupplementRequestV1 = (
  value: unknown,
): TeacherOrganizationSupplementRequestV1 => {
  const body = parseBase(
    value,
    ["class_ref", "child_ref", "command_request_id", "kind"],
    ["prepare", "confirm"],
  );
  const shared = Object.freeze({
    ...identity(body),
    class_ref: opaqueRef(body.class_ref),
    child_ref: opaqueRef(body.child_ref),
    command_request_id: commandRequestId(body.command_request_id),
  });
  if (body.kind === "prepare") {
    if (Object.hasOwn(body, "confirm") || !isRecord(body.prepare)) {
      throw invalidRequest();
    }
    const prepare = body.prepare;
    const careKind = prepare.care_kind;
    if (
      Object.keys(prepare).sort().join("|") !== "care_kind|local_date|text"
      || typeof careKind !== "string"
      || !CARE_KINDS.has(careKind)
    ) {
      throw invalidRequest();
    }
    return Object.freeze({
      ...shared,
      kind: "prepare" as const,
      prepare: Object.freeze({
        local_date: localDate(prepare.local_date),
        care_kind: careKind as "meal" | "nap" | "mood" | "activity" | "health_observation",
        text: boundedText(prepare.text),
      }),
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

export const parseTeacherOrganizationClassNoteRequestV1 = (
  value: unknown,
): TeacherOrganizationClassNoteRequestV1 => {
  const body = parseBase(value, ["class_ref", "command_request_id", "text"]);
  return Object.freeze({
    ...identity(body),
    class_ref: opaqueRef(body.class_ref),
    command_request_id: commandRequestId(body.command_request_id),
    text: boundedText(body.text),
  });
};

export const parseTeacherOrganizationQueueAdmissionRequestV1 = (
  value: unknown,
): TeacherOrganizationQueueAdmissionRequestV1 => {
  const body = parseBase(value, ["class_ref", "process_ref", "command_request_id"]);
  return Object.freeze({
    ...identity(body),
    class_ref: opaqueRef(body.class_ref),
    process_ref: opaqueRef(body.process_ref),
    command_request_id: commandRequestId(body.command_request_id),
  });
};

const identity = (
  body: Record<string, unknown>,
): TeacherOrganizationIdentityV1 =>
  Object.freeze({
    interface_contract: TEACHER_ORGANIZATION_OWNER_INTERFACE,
    workspace_id: requiredString(body.workspace_id, 1, 256),
    my_chat_user_id: requiredString(body.my_chat_user_id, 1, 256),
    host_request_id: requiredString(body.host_request_id, 1, 256),
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
    || contract.key !== TEACHER_ORGANIZATION_OWNER_INTERFACE.key
    || contract.version !== TEACHER_ORGANIZATION_OWNER_INTERFACE.version
    || contract.digest !== TEACHER_ORGANIZATION_OWNER_INTERFACE.digest
  ) {
    throw new TeacherOrganizationRequestParseError(
      "teacher_organization_contract_mismatch",
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

const opaqueRef = (value: unknown): string => requiredString(value, 8, 512);

const commandRequestId = (value: unknown): string =>
  requiredString(value, 8, 128);

const boundedText = (value: unknown): string => requiredString(value, 1, 500);

const sha256Digest = (value: unknown): string => {
  const digest = requiredString(value, 71, 71);
  if (!/^sha256:[a-f0-9]{64}$/.test(digest)) throw invalidRequest();
  return digest;
};

const localDate = (value: unknown): string => {
  const date = requiredString(value, 10, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw invalidRequest();
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw invalidRequest();
  }
  return date;
};

const invalidRequest = (): TeacherOrganizationRequestParseError =>
  new TeacherOrganizationRequestParseError("invalid_teacher_organization_request");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
