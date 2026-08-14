export const TEACHER_ORGANIZATION_OWNER_FEED_PATH =
  "/internal/nurture/teacher-organization-owner/v1/feed";
export const TEACHER_ORGANIZATION_OWNER_ORGANIZATION_PATH =
  "/internal/nurture/teacher-organization-owner/v1/organization";
export const TEACHER_ORGANIZATION_OWNER_ORGANIZE_PATH =
  "/internal/nurture/teacher-organization-owner/v1/organize";
export const TEACHER_ORGANIZATION_OWNER_SUPPLEMENT_PATH =
  "/internal/nurture/teacher-organization-owner/v1/supplement";
export const TEACHER_ORGANIZATION_OWNER_CLASS_NOTE_PATH =
  "/internal/nurture/teacher-organization-owner/v1/class-note";
export const TEACHER_ORGANIZATION_OWNER_QUEUE_ADMISSION_PATH =
  "/internal/nurture/teacher-organization-owner/v1/queue-admission";

export const TEACHER_ORGANIZATION_OWNER_INTERFACE = Object.freeze({
  key: "nurture.teacher-organization-owner",
  version: "1.0.0",
  digest:
    "sha256:b0d4602ff30017338f2a46d3a84cfdaaa011a2d04e134aba8d4dde0125304161",
});

export type TeacherOrganizationOwnerOperation =
  | "feed_query"
  | "organization_query"
  | "organize_exchange"
  | "supplement_exchange"
  | "class_note_exchange"
  | "queue_admission_exchange";

export const TEACHER_ORGANIZATION_OWNER_CONTRACT_DESCRIPTOR = Object.freeze({
  interface_key: TEACHER_ORGANIZATION_OWNER_INTERFACE.key,
  interface_version: TEACHER_ORGANIZATION_OWNER_INTERFACE.version,
  interface_digest: TEACHER_ORGANIZATION_OWNER_INTERFACE.digest,
  authentication: "service_bearer" as const,
  cache_control: "private, no-store" as const,
  default_off: true,
  mobile_mode: "read_and_command" as const,
  paths: Object.freeze({
    feed_query: TEACHER_ORGANIZATION_OWNER_FEED_PATH,
    organization_query: TEACHER_ORGANIZATION_OWNER_ORGANIZATION_PATH,
    organize_exchange: TEACHER_ORGANIZATION_OWNER_ORGANIZE_PATH,
    supplement_exchange: TEACHER_ORGANIZATION_OWNER_SUPPLEMENT_PATH,
    class_note_exchange: TEACHER_ORGANIZATION_OWNER_CLASS_NOTE_PATH,
    queue_admission_exchange: TEACHER_ORGANIZATION_OWNER_QUEUE_ADMISSION_PATH,
  }),
});
