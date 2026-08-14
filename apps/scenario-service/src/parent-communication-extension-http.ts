import {
  PARENT_COMMUNICATION_EXTENSION_DELIVERY_RECEIPTS_PATH,
  PARENT_COMMUNICATION_EXTENSION_INTERFACE,
  PARENT_COMMUNICATION_EXTENSION_REDACT_PATH,
  PARENT_COMMUNICATION_EXTENSION_REDACTION_PREVIEW_PATH,
} from "@the-nurture/scenario";

export {
  PARENT_COMMUNICATION_EXTENSION_DELIVERY_RECEIPTS_PATH,
  PARENT_COMMUNICATION_EXTENSION_INTERFACE,
  PARENT_COMMUNICATION_EXTENSION_REDACT_PATH,
  PARENT_COMMUNICATION_EXTENSION_REDACTION_PREVIEW_PATH,
};

type ParentCommunicationExtensionIdentityV1 = Readonly<{
  interface_contract: typeof PARENT_COMMUNICATION_EXTENSION_INTERFACE;
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
}>;

export type ParentCommunicationRedactionPreviewRequestV1 =
  ParentCommunicationExtensionIdentityV1 &
    Readonly<{
      message_ref: string;
      presentation_version: string;
      command_request_id: string;
    }>;

export type ParentCommunicationRedactRequestV1 =
  ParentCommunicationExtensionIdentityV1 &
    Readonly<{
      message_ref: string;
      presentation_version: string;
      command_request_id: string;
      confirmation_ref: string;
      prepared_preview_digest: string;
    }>;

export type ParentCommunicationDeliveryReceiptRequestV1 =
  ParentCommunicationExtensionIdentityV1 & Readonly<{ message_ref: string }>;

export class ParentCommunicationExtensionRequestParseError extends Error {
  readonly code:
    | "invalid_parent_communication_extension_request"
    | "parent_communication_extension_contract_mismatch";

  constructor(
    code:
      | "invalid_parent_communication_extension_request"
      | "parent_communication_extension_contract_mismatch",
  ) {
    super(code);
    this.name = "ParentCommunicationExtensionRequestParseError";
    this.code = code;
  }
}

export const parseParentCommunicationRedactionPreviewRequestV1 = (
  value: unknown,
): ParentCommunicationRedactionPreviewRequestV1 => {
  const body = parseBase(value, [
    "message_ref",
    "presentation_version",
    "command_request_id",
  ]);
  return Object.freeze({
    ...identity(body),
    message_ref: longRef(body.message_ref),
    presentation_version: presentationVersion(body.presentation_version),
    command_request_id: commandRequestId(body.command_request_id),
  });
};

export const parseParentCommunicationRedactRequestV1 = (
  value: unknown,
): ParentCommunicationRedactRequestV1 => {
  const body = parseBase(value, [
    "message_ref",
    "presentation_version",
    "command_request_id",
    "confirmation_ref",
    "prepared_preview_digest",
  ]);
  return Object.freeze({
    ...identity(body),
    message_ref: longRef(body.message_ref),
    presentation_version: presentationVersion(body.presentation_version),
    command_request_id: commandRequestId(body.command_request_id),
    confirmation_ref: confirmationRef(body.confirmation_ref),
    prepared_preview_digest: sha256Digest(body.prepared_preview_digest),
  });
};

export const parseParentCommunicationDeliveryReceiptRequestV1 = (
  value: unknown,
): ParentCommunicationDeliveryReceiptRequestV1 => {
  const body = parseBase(value, ["message_ref"]);
  return Object.freeze({
    ...identity(body),
    message_ref: longRef(body.message_ref),
  });
};

const identity = (
  body: Record<string, unknown>,
): ParentCommunicationExtensionIdentityV1 =>
  Object.freeze({
    interface_contract: PARENT_COMMUNICATION_EXTENSION_INTERFACE,
    workspace_id: requiredString(body.workspace_id, 1, 200),
    my_chat_user_id: requiredString(body.my_chat_user_id, 1, 200),
    host_request_id: requiredString(body.host_request_id, 1, 200),
    context_ref: longRef(body.context_ref),
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
    || contract.key !== PARENT_COMMUNICATION_EXTENSION_INTERFACE.key
    || contract.version !== PARENT_COMMUNICATION_EXTENSION_INTERFACE.version
    || contract.digest !== PARENT_COMMUNICATION_EXTENSION_INTERFACE.digest
  ) {
    throw new ParentCommunicationExtensionRequestParseError(
      "parent_communication_extension_contract_mismatch",
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

const longRef = (value: unknown): string => requiredString(value, 1, 2048);

const presentationVersion = (value: unknown): string =>
  requiredString(value, 1, 120);

const commandRequestId = (value: unknown): string => {
  const candidate = requiredString(value, 1, 200);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(candidate)) {
    throw invalidRequest();
  }
  return candidate;
};

const confirmationRef = (value: unknown): string =>
  requiredString(value, 32, 256);

const sha256Digest = (value: unknown): string => {
  const candidate = requiredString(value, 71, 71);
  if (!/^sha256:[a-f0-9]{64}$/.test(candidate)) throw invalidRequest();
  return candidate;
};

const invalidRequest = (): ParentCommunicationExtensionRequestParseError =>
  new ParentCommunicationExtensionRequestParseError(
    "invalid_parent_communication_extension_request",
  );

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
