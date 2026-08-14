export const TEACHER_COMMUNICATION_OWNER_TARGETS_PATH =
  "/internal/nurture/teacher-communication-owner/v1/targets";
export const TEACHER_COMMUNICATION_OWNER_MEMBERSHIP_PATH =
  "/internal/nurture/teacher-communication-owner/v1/membership";
export const TEACHER_COMMUNICATION_OWNER_TIMELINE_PATH =
  "/internal/nurture/teacher-communication-owner/v1/timeline";
export const TEACHER_COMMUNICATION_OWNER_SEND_TEXT_PATH =
  "/internal/nurture/teacher-communication-owner/v1/send-text";
export const TEACHER_COMMUNICATION_OWNER_WITHDRAW_STAGED_PATH =
  "/internal/nurture/teacher-communication-owner/v1/withdraw-staged";
export const TEACHER_COMMUNICATION_OWNER_MARK_READ_PATH =
  "/internal/nurture/teacher-communication-owner/v1/mark-read";

export const TEACHER_COMMUNICATION_OWNER_INTERFACE = Object.freeze({
  key: "nurture.teacher-communication-owner",
  version: "1.0.0",
  digest:
    "sha256:e4a831cdb867ab2a5ad38d6e634e13b9da41d44606a9644c6aa0b7fd36503edf",
});

export type TeacherCommunicationOwnerOperation =
  | "targets_query"
  | "membership_query"
  | "timeline_query"
  | "send_text_exchange"
  | "withdraw_staged_exchange"
  | "mark_read_exchange";

export const TEACHER_COMMUNICATION_OWNER_CONTRACT_DESCRIPTOR = Object.freeze({
  interface_key: TEACHER_COMMUNICATION_OWNER_INTERFACE.key,
  interface_version: TEACHER_COMMUNICATION_OWNER_INTERFACE.version,
  interface_digest: TEACHER_COMMUNICATION_OWNER_INTERFACE.digest,
  authentication: "service_bearer" as const,
  cache_control: "private, no-store" as const,
  default_off: true,
  mobile_mode: "read_and_command" as const,
  paths: Object.freeze({
    targets_query: TEACHER_COMMUNICATION_OWNER_TARGETS_PATH,
    membership_query: TEACHER_COMMUNICATION_OWNER_MEMBERSHIP_PATH,
    timeline_query: TEACHER_COMMUNICATION_OWNER_TIMELINE_PATH,
    send_text_exchange: TEACHER_COMMUNICATION_OWNER_SEND_TEXT_PATH,
    withdraw_staged_exchange: TEACHER_COMMUNICATION_OWNER_WITHDRAW_STAGED_PATH,
    mark_read_exchange: TEACHER_COMMUNICATION_OWNER_MARK_READ_PATH,
  }),
});
