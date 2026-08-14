export const PARENT_COMMUNICATION_EXTENSION_REDACTION_PREVIEW_PATH =
  "/internal/nurture/parent-communication-owner/v1.1/redaction-preview";
export const PARENT_COMMUNICATION_EXTENSION_REDACT_PATH =
  "/internal/nurture/parent-communication-owner/v1.1/redact";
export const PARENT_COMMUNICATION_EXTENSION_DELIVERY_RECEIPTS_PATH =
  "/internal/nurture/parent-communication-owner/v1.1/delivery-receipts";

export const PARENT_COMMUNICATION_EXTENSION_INTERFACE = Object.freeze({
  key: "nurture.parent-communication-owner",
  version: "1.1.0",
  digest:
    "sha256:d705146eb00185cbec425953e9a6fa358cc5fb9af193c86f788276617c7b29d1",
});

/** The frozen base the extension names and never republishes. */
export const PARENT_COMMUNICATION_EXTENSION_BASE_INTERFACE = Object.freeze({
  key: "nurture.parent-communication-owner",
  version: "1.0.0",
  digest:
    "sha256:b1dce3a73ac45ff244452e13434834a152bc1ffdc8ede685f8a20b04c9b24a7f",
});

export type ParentCommunicationExtensionOperation =
  | "redaction_preview_query"
  | "redact_exchange"
  | "delivery_receipt_query";

export const PARENT_COMMUNICATION_EXTENSION_CONTRACT_DESCRIPTOR = Object.freeze({
  interface_key: PARENT_COMMUNICATION_EXTENSION_INTERFACE.key,
  interface_version: PARENT_COMMUNICATION_EXTENSION_INTERFACE.version,
  interface_digest: PARENT_COMMUNICATION_EXTENSION_INTERFACE.digest,
  base_interface_digest: PARENT_COMMUNICATION_EXTENSION_BASE_INTERFACE.digest,
  authentication: "service_bearer" as const,
  cache_control: "private, no-store" as const,
  default_off: true,
  paths: Object.freeze({
    redaction_preview_query: PARENT_COMMUNICATION_EXTENSION_REDACTION_PREVIEW_PATH,
    redact_exchange: PARENT_COMMUNICATION_EXTENSION_REDACT_PATH,
    delivery_receipt_query: PARENT_COMMUNICATION_EXTENSION_DELIVERY_RECEIPTS_PATH,
  }),
});
