import {
  TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATE_PATH,
  TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATION_PATH,
  TEACHER_MEDIA_ASSOCIATION_OWNER_DISCARD_PATH,
  TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE,
  TEACHER_MEDIA_ASSOCIATION_OWNER_UNASSOCIATED_PATH,
} from "@the-nurture/scenario";

export {
  TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATE_PATH,
  TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATION_PATH,
  TEACHER_MEDIA_ASSOCIATION_OWNER_DISCARD_PATH,
  TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE,
  TEACHER_MEDIA_ASSOCIATION_OWNER_UNASSOCIATED_PATH,
};

type TeacherMediaAssociationIdentityV1 = Readonly<{
  interface_contract: typeof TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE;
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
}>;

export type TeacherMediaAssociationUnassociatedRequestV1 =
  TeacherMediaAssociationIdentityV1 & Readonly<{ class_ref: string }>;

export type TeacherMediaAssociationAssociationRequestV1 =
  TeacherMediaAssociationIdentityV1 &
    Readonly<{ class_ref: string; media_ref: string }>;

export type TeacherMediaAssociationAssociateRequestV1 =
  TeacherMediaAssociationIdentityV1 &
    Readonly<{
      class_ref: string;
      media_ref: string;
      child_ref: string;
      command_request_id: string;
      decision: "confirm" | "reject";
      expected_attribution_revision: number;
      expected_media_revision: number;
    }>;

export type TeacherMediaAssociationDiscardRequestV1 =
  TeacherMediaAssociationIdentityV1 &
    Readonly<{ class_ref: string; media_ref: string; command_request_id: string }>;

export class TeacherMediaAssociationRequestParseError extends Error {
  readonly code:
    | "invalid_teacher_media_association_request"
    | "teacher_media_association_contract_mismatch";

  constructor(
    code:
      | "invalid_teacher_media_association_request"
      | "teacher_media_association_contract_mismatch",
  ) {
    super(code);
    this.name = "TeacherMediaAssociationRequestParseError";
    this.code = code;
  }
}

export const parseTeacherMediaAssociationUnassociatedRequestV1 = (
  value: unknown,
): TeacherMediaAssociationUnassociatedRequestV1 => {
  const body = parseBase(value, ["class_ref"]);
  return Object.freeze({ ...identity(body), class_ref: opaqueRef(body.class_ref) });
};

export const parseTeacherMediaAssociationAssociationRequestV1 = (
  value: unknown,
): TeacherMediaAssociationAssociationRequestV1 => {
  const body = parseBase(value, ["class_ref", "media_ref"]);
  return Object.freeze({
    ...identity(body),
    class_ref: opaqueRef(body.class_ref),
    media_ref: opaqueRef(body.media_ref),
  });
};

export const parseTeacherMediaAssociationAssociateRequestV1 = (
  value: unknown,
): TeacherMediaAssociationAssociateRequestV1 => {
  const body = parseBase(value, [
    "class_ref",
    "media_ref",
    "child_ref",
    "command_request_id",
    "decision",
    "expected_attribution_revision",
    "expected_media_revision",
  ]);
  if (body.decision !== "confirm" && body.decision !== "reject") {
    throw invalidRequest();
  }
  return Object.freeze({
    ...identity(body),
    class_ref: opaqueRef(body.class_ref),
    media_ref: opaqueRef(body.media_ref),
    child_ref: opaqueRef(body.child_ref),
    command_request_id: commandRequestId(body.command_request_id),
    decision: body.decision,
    expected_attribution_revision: boundedInteger(body.expected_attribution_revision, 0),
    expected_media_revision: boundedInteger(body.expected_media_revision, 1),
  });
};

export const parseTeacherMediaAssociationDiscardRequestV1 = (
  value: unknown,
): TeacherMediaAssociationDiscardRequestV1 => {
  const body = parseBase(value, ["class_ref", "media_ref", "command_request_id"]);
  return Object.freeze({
    ...identity(body),
    class_ref: opaqueRef(body.class_ref),
    media_ref: opaqueRef(body.media_ref),
    command_request_id: commandRequestId(body.command_request_id),
  });
};

const identity = (
  body: Record<string, unknown>,
): TeacherMediaAssociationIdentityV1 =>
  Object.freeze({
    interface_contract: TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE,
    workspace_id: requiredString(body.workspace_id, 1, 256),
    my_chat_user_id: requiredString(body.my_chat_user_id, 1, 256),
    host_request_id: requiredString(body.host_request_id, 1, 256),
    context_ref: opaqueRef(body.context_ref),
  });

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
    || contract.key !== TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE.key
    || contract.version !== TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE.version
    || contract.digest !== TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE.digest
  ) {
    throw new TeacherMediaAssociationRequestParseError(
      "teacher_media_association_contract_mismatch",
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

const boundedInteger = (value: unknown, minimum: number): number => {
  if (!Number.isSafeInteger(value) || Number(value) < minimum) {
    throw invalidRequest();
  }
  return Number(value);
};

const invalidRequest = (): TeacherMediaAssociationRequestParseError =>
  new TeacherMediaAssociationRequestParseError(
    "invalid_teacher_media_association_request",
  );

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
