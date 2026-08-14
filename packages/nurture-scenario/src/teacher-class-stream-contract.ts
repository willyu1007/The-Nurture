export const TEACHER_CLASS_STREAM_CLASS_CONTEXT_PATH =
  "/internal/nurture/teacher-class-stream/v1/class-context";
export const TEACHER_CLASS_STREAM_CHILD_STRIP_PATH =
  "/internal/nurture/teacher-class-stream/v1/child-strip";
export const TEACHER_CLASS_STREAM_CHILD_DAY_DETAIL_PATH =
  "/internal/nurture/teacher-class-stream/v1/child-day-detail";
export const TEACHER_CLASS_STREAM_SCHEDULE_PATH =
  "/internal/nurture/teacher-class-stream/v1/schedule";

export const TEACHER_CLASS_STREAM_INTERFACE = Object.freeze({
  key: "nurture.teacher-class-stream-presenter",
  version: "1.0.0",
  digest:
    "sha256:00a8494544e9b2ba6045f79da196b1003e2744f905399aab86bb5efdb9be5df3",
});

export type TeacherClassStreamOperation =
  | "class_context_query"
  | "child_strip_query"
  | "child_day_detail_query"
  | "schedule_query";

export const TEACHER_CLASS_STREAM_CONTRACT_DESCRIPTOR = Object.freeze({
  interface_key: TEACHER_CLASS_STREAM_INTERFACE.key,
  interface_version: TEACHER_CLASS_STREAM_INTERFACE.version,
  interface_digest: TEACHER_CLASS_STREAM_INTERFACE.digest,
  authentication: "service_bearer" as const,
  cache_control: "private, no-store" as const,
  default_off: true,
  mobile_mode: "read_only" as const,
  paths: Object.freeze({
    class_context_query: TEACHER_CLASS_STREAM_CLASS_CONTEXT_PATH,
    child_strip_query: TEACHER_CLASS_STREAM_CHILD_STRIP_PATH,
    child_day_detail_query: TEACHER_CLASS_STREAM_CHILD_DAY_DETAIL_PATH,
    schedule_query: TEACHER_CLASS_STREAM_SCHEDULE_PATH,
  }),
});
