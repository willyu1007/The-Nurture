import type { ParentContextSelectionV1 } from "./parent-context-selection-contract.js";

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

export type ParentContextPresenterIdentityV1 = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
}>;

export type ParentContextPresenterDateRequestV1 =
  ParentContextPresenterIdentityV1 & Readonly<{ local_date: string }>;

export type ParentContextPresenterActivityDetailRequestV1 =
  ParentContextPresenterDateRequestV1 & Readonly<{ activity_ref: string }>;

export type ParentContextPresenterNoticeListRequestV1 =
  ParentContextPresenterIdentityV1 &
  Readonly<{
    kind: "list";
    page_size?: number;
    cursor?: string;
  }>;

export type ParentContextPresenterNoticePrepareRequestV1 =
  ParentContextPresenterIdentityV1 &
  Readonly<{
    kind: "prepare_confirmation";
    notice_ref: string;
    action_ref: string;
    action_version: number;
    expected_notice_version: number;
  }>;

export type ParentContextPresenterNoticeConfirmRequestV1 =
  ParentContextPresenterIdentityV1 &
  Readonly<{
    kind: "confirm";
    invocation_request_id: string;
    command_request_id: string;
    confirmation_ref: string;
    action_ref: string;
    action_version: number;
    prepared_preview_digest: string;
  }>;

export type ParentContextPresenterNoticeRequestV1 =
  | ParentContextPresenterNoticeListRequestV1
  | ParentContextPresenterNoticePrepareRequestV1
  | ParentContextPresenterNoticeConfirmRequestV1;

export type ParentContextPresenterRequestV1 =
  | ParentContextPresenterDateRequestV1
  | ParentContextPresenterActivityDetailRequestV1
  | ParentContextPresenterNoticeRequestV1;

/** Minimum authority shape consumed by the transport composition. */
export type ParentContextPresenterResolvedAuthorityV1 = Readonly<{
  participant_id: string;
  guardian_role_assignment_id: string;
  association_ref: string;
  enrollment_ref: string;
  care_group_ref: string;
  grant_ref: string;
  resolution_ref: string;
  scope_ref: string;
  scope_version: number;
  context_ref: string;
}>;

export type ParentContextPresenterExactAuthorityV1 =
  ParentContextPresenterResolvedAuthorityV1 & Readonly<{
  participant_version: number;
  guardian_role_version: number;
  association_version: number;
  child_anchor_ref: string;
  child_anchor_version: number;
  family_anchor_ref: string;
  family_anchor_version: number;
  parent_context_selection_version: number;
  enrollment_version: number;
  care_group_version: number;
  institution_ref: string;
  institution_version: number;
  family_ref: string;
  family_version: number;
  child_care_process_ref: string;
  child_care_process_version: number;
  grant_version: number;
  thread_ref: string;
  thread_version: number;
  membership_ref: string;
  membership_version: number;
  resolved_at: string;
  host_context_version: string;
}>;

export type ParentContextPresenterAuthorityResultV1 =
  | Readonly<{
      status: "resolved";
      authority: ParentContextPresenterResolvedAuthorityV1;
    }>
  | Readonly<{
      status:
        | "scope_loss"
        | "revoked"
        | "stale_context_ref"
        | "ambiguous_enrollment"
        | "protected_display_denial"
        | "non_retryable_refresh";
    }>
  | Readonly<{ status: "temporarily_unavailable" }>;

export type ParentContextPresenterAuthorityResolverV1 = Readonly<{
  resolve(input: ParentContextPresenterIdentityV1 & {
    operation: ParentContextPresenterOperation;
    context_selection: ParentContextSelectionV1;
  }): Promise<ParentContextPresenterAuthorityResultV1>;
}>;

export type ParentContextPresenterOwnerV1 = Readonly<{
  present(input: {
    operation: ParentContextPresenterOperation;
    request: ParentContextPresenterRequestV1;
    authority: ParentContextPresenterResolvedAuthorityV1;
  }): Promise<unknown>;
}>;

export type ParentContextPresenterAsyncBoundaryV1 = Readonly<{
  capture(input: ParentContextPresenterIdentityV1 & {
    operation: ParentContextPresenterOperation;
  }): Promise<Readonly<{ response_generation: number }>>;
  current(input: Omit<ParentContextPresenterIdentityV1, "context_ref"> & {
    operation: ParentContextPresenterOperation;
  }): Promise<
    Readonly<{
      active_generation: number;
      active_context_ref: string;
    }>
  >;
}>;

export type ParentContextPresenterOwnerBindingV1 = Readonly<{
  authorityResolver: ParentContextPresenterAuthorityResolverV1;
  owner: ParentContextPresenterOwnerV1;
  asyncBoundary: ParentContextPresenterAsyncBoundaryV1;
}>;
