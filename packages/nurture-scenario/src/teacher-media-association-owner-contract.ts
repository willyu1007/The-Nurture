export const TEACHER_MEDIA_ASSOCIATION_OWNER_UNASSOCIATED_PATH =
  "/internal/nurture/teacher-media-association-owner/v1/unassociated";
export const TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATION_PATH =
  "/internal/nurture/teacher-media-association-owner/v1/association";
export const TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATE_PATH =
  "/internal/nurture/teacher-media-association-owner/v1/associate";
export const TEACHER_MEDIA_ASSOCIATION_OWNER_DISCARD_PATH =
  "/internal/nurture/teacher-media-association-owner/v1/discard";

export const TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE = Object.freeze({
  key: "nurture.teacher-media-association-owner",
  version: "1.0.0",
  digest:
    "sha256:528e50c8170a8b2fa41679cd7fc8d20f5fb344278a6d8e3a6294adc405dd96b4",
});

export type TeacherMediaAssociationOwnerOperation =
  | "unassociated_query"
  | "association_query"
  | "associate_exchange"
  | "discard_exchange";

export const TEACHER_MEDIA_ASSOCIATION_OWNER_CONTRACT_DESCRIPTOR = Object.freeze({
  interface_key: TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE.key,
  interface_version: TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE.version,
  interface_digest: TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE.digest,
  authentication: "service_bearer" as const,
  cache_control: "private, no-store" as const,
  default_off: true,
  mobile_mode: "read_and_command" as const,
  paths: Object.freeze({
    unassociated_query: TEACHER_MEDIA_ASSOCIATION_OWNER_UNASSOCIATED_PATH,
    association_query: TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATION_PATH,
    associate_exchange: TEACHER_MEDIA_ASSOCIATION_OWNER_ASSOCIATE_PATH,
    discard_exchange: TEACHER_MEDIA_ASSOCIATION_OWNER_DISCARD_PATH,
  }),
});
