export const TEACHER_ASSISTANT_QUERY_OWNER_MISSING_RECORDS_PATH =
  "/internal/nurture/teacher-assistant-query-owner/v1/missing-records";
export const TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_SOURCE_PATH =
  "/internal/nurture/teacher-assistant-query-owner/v1/weekly-source";
export const TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_DRAFT_PATH =
  "/internal/nurture/teacher-assistant-query-owner/v1/weekly-draft";

export const TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE = Object.freeze({
  key: "nurture.teacher-assistant-query-owner",
  version: "1.0.0",
  digest:
    "sha256:d401066102cb398f00b6bd897611ba794abb36d11837a25423f1c19101cadb8e",
});

export type TeacherAssistantQueryOwnerOperation =
  | "missing_records_query"
  | "weekly_source_query"
  | "weekly_draft_exchange";

export const TEACHER_ASSISTANT_QUERY_OWNER_CONTRACT_DESCRIPTOR = Object.freeze({
  interface_key: TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE.key,
  interface_version: TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE.version,
  interface_digest: TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE.digest,
  authentication: "service_bearer" as const,
  cache_control: "private, no-store" as const,
  default_off: true,
  mobile_mode: "read_and_command" as const,
  paths: Object.freeze({
    missing_records_query: TEACHER_ASSISTANT_QUERY_OWNER_MISSING_RECORDS_PATH,
    weekly_source_query: TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_SOURCE_PATH,
    weekly_draft_exchange: TEACHER_ASSISTANT_QUERY_OWNER_WEEKLY_DRAFT_PATH,
  }),
});
