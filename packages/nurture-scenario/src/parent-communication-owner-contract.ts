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

export type ParentCommunicationIdentityV1 = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
}>;

export type ParentCommunicationSummaryRequestV1 = ParentCommunicationIdentityV1;

export type ParentCommunicationDetailRequestV1 = ParentCommunicationIdentityV1 &
  Readonly<{
    segment: "teachers" | "class_group";
    page_size: number;
    cursor?: string;
  }>;

export type ParentCommunicationMediaAccessRequestV1 =
  ParentCommunicationIdentityV1 &
    Readonly<{
      presentation_version: string;
      segment: "teachers" | "class_group";
      message_ref: string;
      media_ref: string;
      purpose: "family_teacher_communication";
    }>;

export type ParentCommunicationSendTextPrepareRequestV1 =
  ParentCommunicationIdentityV1 &
    Readonly<{
      kind: "prepare";
      presentation_version: string;
      segment: "teachers";
      command_request_id: string;
      body: string;
      purpose: "family_teacher_communication";
    }>;

export type ParentCommunicationSendTextConfirmRequestV1 =
  ParentCommunicationIdentityV1 &
    Readonly<{
      kind: "confirm";
      presentation_version: string;
      segment: "teachers";
      command_request_id: string;
      confirmation_ref: string;
      prepared_preview_digest: string;
      purpose: "family_teacher_communication";
    }>;

export type ParentCommunicationSendTextRequestV1 =
  | ParentCommunicationSendTextPrepareRequestV1
  | ParentCommunicationSendTextConfirmRequestV1;

export type ParentCommunicationOwnerRequestV1 =
  | ParentCommunicationSummaryRequestV1
  | ParentCommunicationDetailRequestV1
  | ParentCommunicationMediaAccessRequestV1
  | ParentCommunicationSendTextRequestV1;

/** Internal-only exact heads used to prevent read/write TOCTOU drift. */
export type ParentCommunicationResolvedAuthorityV1 = Readonly<{
  participant_id: string;
  participant_version: number;
  guardian_role_assignment_id: string;
  guardian_role_version: number;
  association_ref: string;
  association_version: number;
  child_anchor_ref: string;
  child_anchor_version: number;
  family_anchor_ref: string;
  family_anchor_version: number;
  parent_context_selection_version: number;
  enrollment_ref: string;
  enrollment_version: number;
  care_group_ref: string;
  care_group_version: number;
  institution_ref: string;
  institution_version: number;
  family_ref: string;
  family_version: number;
  child_care_process_ref: string;
  child_care_process_version: number;
  thread_ref: string;
  thread_version: number;
  membership_ref: string;
  membership_version: number;
  grant_ref: string;
  grant_version: number;
  context_version: string;
  resolution_ref: string;
  scope_ref: string;
  scope_version: number;
  context_ref: string;
}>;

export type ParentCommunicationAuthorityResultV1 =
  | Readonly<{
      status: "resolved";
      authority: ParentCommunicationResolvedAuthorityV1;
    }>
  | Readonly<{
      status:
        | "scope_loss"
        | "revoked"
        | "stale_context_ref"
        | "ambiguous_enrollment"
        | "protected_display_denial";
    }>
  | Readonly<{ status: "temporarily_unavailable" }>;

export type ParentCommunicationAuthorityResolverV1 = Readonly<{
  resolve(input: {
    operation: ParentCommunicationOwnerOperation;
    workspace_id: string;
    my_chat_user_id: string;
    host_request_id: string;
    context_ref: string;
    context_selection: ParentContextSelectionV1;
  }): Promise<ParentCommunicationAuthorityResultV1>;
}>;

export type ParentCommunicationOwnerV1 = Readonly<{
  execute(input: {
    operation: ParentCommunicationOwnerOperation;
    request: ParentCommunicationOwnerRequestV1;
    authority: ParentCommunicationResolvedAuthorityV1;
  }): Promise<unknown>;
}>;

export type ParentCommunicationAsyncBoundaryV1 = Readonly<{
  capture(input: {
    operation: ParentCommunicationOwnerOperation;
    workspace_id: string;
    my_chat_user_id: string;
    host_request_id: string;
    context_ref: string;
  }): Promise<Readonly<{ response_generation: number }>>;
  current(input: {
    operation: ParentCommunicationOwnerOperation;
    workspace_id: string;
    my_chat_user_id: string;
    host_request_id: string;
  }): Promise<
    Readonly<{
      active_generation: number;
      active_context_ref: string;
    }>
  >;
}>;

export type ParentCommunicationOwnerBindingV1 = Readonly<{
  authorityResolver: ParentCommunicationAuthorityResolverV1;
  owner: ParentCommunicationOwnerV1;
  asyncBoundary: ParentCommunicationAsyncBoundaryV1;
}>;
import type { ParentContextSelectionV1 } from "./parent-context-selection-contract.js";
