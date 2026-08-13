export const PARENT_COMMUNICATION_OWNER_SUMMARY_PATH =
  "/internal/nurture/parent-communication-owner/v1/summary";
export const PARENT_COMMUNICATION_OWNER_DETAIL_PATH =
  "/internal/nurture/parent-communication-owner/v1/detail";
export const PARENT_COMMUNICATION_OWNER_MEDIA_ACCESS_PATH =
  "/internal/nurture/parent-communication-owner/v1/media-access";
export const PARENT_COMMUNICATION_OWNER_SEND_TEXT_PATH =
  "/internal/nurture/parent-communication-owner/v1/send-text";

export const PARENT_COMMUNICATION_OWNER_INTERFACE = Object.freeze({
  key: "nurture.parent-communication-owner",
  version: "1.0.0",
  digest:
    "sha256:b1dce3a73ac45ff244452e13434834a152bc1ffdc8ede685f8a20b04c9b24a7f",
});

export const PARENT_COMMUNICATION_OWNER_CONTRACT_DESCRIPTOR = Object.freeze({
  interface_key: PARENT_COMMUNICATION_OWNER_INTERFACE.key,
  interface_version: PARENT_COMMUNICATION_OWNER_INTERFACE.version,
  interface_digest: PARENT_COMMUNICATION_OWNER_INTERFACE.digest,
  authentication: "service_bearer" as const,
  cache_control: "private, no-store" as const,
  default_off: true,
  p0_send_scope: "text_only_teacher_segment" as const,
  paths: Object.freeze({
    summary_query: PARENT_COMMUNICATION_OWNER_SUMMARY_PATH,
    detail_query: PARENT_COMMUNICATION_OWNER_DETAIL_PATH,
    media_access_query: PARENT_COMMUNICATION_OWNER_MEDIA_ACCESS_PATH,
    send_text_exchange: PARENT_COMMUNICATION_OWNER_SEND_TEXT_PATH,
  }),
});

export type ParentCommunicationOwnerOperation =
  | "summary_query"
  | "detail_query"
  | "media_access_query"
  | "send_text_exchange";
