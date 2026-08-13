import {
  PARENT_COMMUNICATION_OWNER_DETAIL_PATH,
  PARENT_COMMUNICATION_OWNER_INTERFACE,
  PARENT_COMMUNICATION_OWNER_MEDIA_ACCESS_PATH,
  PARENT_COMMUNICATION_OWNER_SEND_TEXT_PATH,
  PARENT_COMMUNICATION_OWNER_SUMMARY_PATH,
} from "@the-nurture/scenario";

export {
  PARENT_COMMUNICATION_OWNER_DETAIL_PATH,
  PARENT_COMMUNICATION_OWNER_INTERFACE,
  PARENT_COMMUNICATION_OWNER_MEDIA_ACCESS_PATH,
  PARENT_COMMUNICATION_OWNER_SEND_TEXT_PATH,
  PARENT_COMMUNICATION_OWNER_SUMMARY_PATH,
};

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/u;
const REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._~:/+@=-]{0,2047}$/u;
const CONFIRMATION_PATTERN = /^[A-Za-z0-9_-]{32,256}$/u;
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/u;
const IDENTITY_KEYS = [
  "interface_contract",
  "workspace_id",
  "my_chat_user_id",
  "host_request_id",
  "context_ref",
] as const;

export type ParentCommunicationIdentityV1 = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
}>;

export type ParentCommunicationSummaryRequestV1 = ParentCommunicationIdentityV1;
export type ParentCommunicationDetailRequestV1 = ParentCommunicationIdentityV1 &
  Readonly<{
    segment: "teachers" | "class_group";
    page_size: number;
    cursor?: string;
  }>;
export type ParentCommunicationMediaAccessRequestV1 =
  ParentCommunicationIdentityV1 &
    Readonly<{
      presentation_version: string;
      segment: "teachers" | "class_group";
      message_ref: string;
      media_ref: string;
      purpose: "family_teacher_communication";
    }>;
export type ParentCommunicationSendTextPrepareRequestV1 =
  ParentCommunicationIdentityV1 &
    Readonly<{
      kind: "prepare";
      presentation_version: string;
      segment: "teachers";
      command_request_id: string;
      body: string;
      purpose: "family_teacher_communication";
    }>;
export type ParentCommunicationSendTextConfirmRequestV1 =
  ParentCommunicationIdentityV1 &
    Readonly<{
      kind: "confirm";
      presentation_version: string;
      segment: "teachers";
      command_request_id: string;
      confirmation_ref: string;
      prepared_preview_digest: string;
      purpose: "family_teacher_communication";
    }>;
export type ParentCommunicationSendTextRequestV1 =
  | ParentCommunicationSendTextPrepareRequestV1
  | ParentCommunicationSendTextConfirmRequestV1;

export class ParentCommunicationOwnerRequestParseError extends Error {
  constructor(
    readonly code:
      | "invalid_parent_communication_owner_request"
      | "parent_communication_owner_contract_mismatch",
  ) {
    super(code);
    this.name = "ParentCommunicationOwnerRequestParseError";
  }
}

export const parseParentCommunicationSummaryRequestV1 = (
  body: unknown,
): ParentCommunicationSummaryRequestV1 => parseIdentity(body, [] as const).identity;

export const parseParentCommunicationDetailRequestV1 = (
  body: unknown,
): ParentCommunicationDetailRequestV1 => {
  const { record, identity } = parseIdentity(body, ["segment", "page_size", "cursor"]);
  if (
    !isSegment(record.segment)
    || !isBoundedInteger(record.page_size, 1, 50)
    || (record.cursor !== undefined && !isRef(record.cursor))
  ) {
    throw invalidRequest();
  }
  return {
    ...identity,
    segment: record.segment,
    page_size: record.page_size,
    ...(typeof record.cursor === "string" ? { cursor: record.cursor } : {}),
  };
};

export const parseParentCommunicationMediaAccessRequestV1 = (
  body: unknown,
): ParentCommunicationMediaAccessRequestV1 => {
  const { record, identity } = parseIdentity(body, [
    "presentation_version",
    "segment",
    "message_ref",
    "media_ref",
    "purpose",
  ]);
  if (
    !isShortText(record.presentation_version, 120)
    || !isSegment(record.segment)
    || !isRef(record.message_ref)
    || !isRef(record.media_ref)
    || record.purpose !== "family_teacher_communication"
  ) {
    throw invalidRequest();
  }
  return {
    ...identity,
    presentation_version: record.presentation_version,
    segment: record.segment,
    message_ref: record.message_ref,
    media_ref: record.media_ref,
    purpose: "family_teacher_communication",
  };
};

export const parseParentCommunicationSendTextRequestV1 = (
  body: unknown,
): ParentCommunicationSendTextRequestV1 => {
  if (!isRecord(body) || (body.kind !== "prepare" && body.kind !== "confirm")) {
    throw invalidRequest();
  }
  const common = [
    "kind",
    "presentation_version",
    "segment",
    "command_request_id",
    "purpose",
  ] as const;
  if (body.kind === "prepare") {
    const { record, identity } = parseIdentity(body, [...common, "body"]);
    if (!sendCommonIsValid(record) || !isTrimmedText(record.body, 2_000)) {
      throw invalidRequest();
    }
    return {
      ...identity,
      kind: "prepare",
      presentation_version: record.presentation_version,
      segment: record.segment,
      command_request_id: record.command_request_id,
      body: record.body,
      purpose: "family_teacher_communication",
    };
  }
  const { record, identity } = parseIdentity(body, [
    ...common,
    "confirmation_ref",
    "prepared_preview_digest",
  ]);
  if (
    !sendCommonIsValid(record)
    || typeof record.confirmation_ref !== "string"
    || !CONFIRMATION_PATTERN.test(record.confirmation_ref)
    || typeof record.prepared_preview_digest !== "string"
    || !DIGEST_PATTERN.test(record.prepared_preview_digest)
  ) {
    throw invalidRequest();
  }
  return {
    ...identity,
    kind: "confirm",
    presentation_version: record.presentation_version,
    segment: record.segment,
    command_request_id: record.command_request_id,
    confirmation_ref: record.confirmation_ref,
    prepared_preview_digest: record.prepared_preview_digest,
    purpose: "family_teacher_communication",
  };
};

const sendCommonIsValid = (
  record: Record<string, unknown>,
): record is Record<string, unknown> & {
  presentation_version: string;
  segment: "teachers";
  command_request_id: string;
} =>
  isShortText(record.presentation_version, 120)
  && record.segment === "teachers"
  && isId(record.command_request_id)
  && record.purpose === "family_teacher_communication";

const parseIdentity = (
  body: unknown,
  operationKeys: readonly string[],
): Readonly<{
  record: Record<string, unknown>;
  identity: ParentCommunicationIdentityV1;
}> => {
  if (!isRecord(body)) throw invalidRequest();
  const allowed = new Set<string>([...IDENTITY_KEYS, ...operationKeys]);
  if (Object.keys(body).some((key) => !allowed.has(key))) throw invalidRequest();
  if (
    !isRecord(body.interface_contract)
    || Object.keys(body.interface_contract).length !== 3
    || body.interface_contract.key !== PARENT_COMMUNICATION_OWNER_INTERFACE.key
    || body.interface_contract.version !== PARENT_COMMUNICATION_OWNER_INTERFACE.version
    || body.interface_contract.digest !== PARENT_COMMUNICATION_OWNER_INTERFACE.digest
  ) {
    throw new ParentCommunicationOwnerRequestParseError(
      "parent_communication_owner_contract_mismatch",
    );
  }
  if (
    !isId(body.workspace_id)
    || !isId(body.my_chat_user_id)
    || !isId(body.host_request_id)
    || !isRef(body.context_ref)
  ) {
    throw invalidRequest();
  }
  return {
    record: body,
    identity: {
      workspace_id: body.workspace_id,
      my_chat_user_id: body.my_chat_user_id,
      host_request_id: body.host_request_id,
      context_ref: body.context_ref,
    },
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const isId = (value: unknown): value is string =>
  typeof value === "string" && ID_PATTERN.test(value);
const isRef = (value: unknown): value is string =>
  typeof value === "string" && REF_PATTERN.test(value);
const isSegment = (value: unknown): value is "teachers" | "class_group" =>
  value === "teachers" || value === "class_group";
const isShortText = (value: unknown, maximum: number): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= maximum;
const isTrimmedText = (value: unknown, maximum: number): value is string =>
  isShortText(value, maximum) && value.trim() === value;
const isBoundedInteger = (
  value: unknown,
  minimum: number,
  maximum: number,
): value is number =>
  typeof value === "number"
  && Number.isSafeInteger(value)
  && value >= minimum
  && value <= maximum;
const invalidRequest = (): ParentCommunicationOwnerRequestParseError =>
  new ParentCommunicationOwnerRequestParseError(
    "invalid_parent_communication_owner_request",
  );
