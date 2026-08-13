export const PARENT_CONTEXT_PRESENTER_DAY_PATH =
  "/internal/nurture/parent-context-presenter/v1/day";
export const PARENT_CONTEXT_PRESENTER_DAILY_CARE_PATH =
  "/internal/nurture/parent-context-presenter/v1/daily-care";
export const PARENT_CONTEXT_PRESENTER_ACTIVITY_DETAIL_PATH =
  "/internal/nurture/parent-context-presenter/v1/activity-detail";
export const PARENT_CONTEXT_PRESENTER_NOTICES_PATH =
  "/internal/nurture/parent-context-presenter/v1/notices";
export const PARENT_CONTEXT_PRESENTER_FRESHNESS_ATTENDANCE_PATH =
  "/internal/nurture/parent-context-presenter/v1/freshness-attendance";

export const PARENT_CONTEXT_PRESENTER_INTERFACE = Object.freeze({
  key: "nurture.parent-context-presenter",
  version: "1.0.0",
  digest:
    "sha256:3ac0906c6b514c861d266c3b4e470e5dcacb6cccdd61887e7b7a03e4c194c196",
});

export const PARENT_CONTEXT_PRESENTER_CONTRACT_DESCRIPTOR = Object.freeze({
  interface_key: PARENT_CONTEXT_PRESENTER_INTERFACE.key,
  interface_version: PARENT_CONTEXT_PRESENTER_INTERFACE.version,
  interface_digest: PARENT_CONTEXT_PRESENTER_INTERFACE.digest,
  authentication: "service_bearer" as const,
  cache_control: "private, no-store" as const,
  default_off: true,
  paths: Object.freeze({
    day_query: PARENT_CONTEXT_PRESENTER_DAY_PATH,
    daily_care_cards_query: PARENT_CONTEXT_PRESENTER_DAILY_CARE_PATH,
    activity_detail_query: PARENT_CONTEXT_PRESENTER_ACTIVITY_DETAIL_PATH,
    notice_list_and_confirmation: PARENT_CONTEXT_PRESENTER_NOTICES_PATH,
    freshness_attendance_projection:
      PARENT_CONTEXT_PRESENTER_FRESHNESS_ATTENDANCE_PATH,
  }),
});

export type ParentContextPresenterOperation =
  | "day_query"
  | "daily_care_cards_query"
  | "activity_detail_query"
  | "notice_list_and_confirmation"
  | "freshness_attendance_projection";
