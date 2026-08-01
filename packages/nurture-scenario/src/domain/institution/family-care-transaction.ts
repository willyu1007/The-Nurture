import type { CanonicalRef } from "@my-chat/workflow-contracts";
import type {
  NurtureGrantDataClass,
  NurtureGrantDirection,
} from "./institution-context.js";

type DomainContextRef = CanonicalRef;

/** The purpose every G2 family-care grant must carry to authorize the loop. */
export const FAMILY_CARE_PURPOSE = "family_care_workflow";

export type FamilyCareCurrentGrant = {
  grant_id: string;
  status: "active" | "revoked" | "missing";
  directions: NurtureGrantDirection[];
  data_classes: NurtureGrantDataClass[];
  /** Present for G2 reads; legacy callers may omit it. */
  purposes?: string[];
  target_scope_type: "care_group" | "enrollment" | "institution";
  target_scope_id: string;
};

/**
 * A grant only authorizes the family-care loop when it is current AND
 * actually covers this data class, direction and purpose. Status alone is not
 * enough: an unrelated active grant must never stand in for the real one.
 */
export const grantAuthorizesFamilyCare = (
  grant: FamilyCareCurrentGrant,
  direction: NurtureGrantDirection,
): boolean =>
  grant.status === "active" &&
  grant.directions.includes(direction) &&
  grant.data_classes.includes("family_care_question") &&
  (grant.purposes ?? []).includes(FAMILY_CARE_PURPOSE);

export type FamilyCareGrantRevokePayload = {
  participant_id: string;
  role_assignment_id: string;
  grant_id: string;
  expected_version: number;
  reason_code: string;
};

export type FamilyCareGrantRevokeFacts = {
  participant_active: boolean;
  guardian_role_active: boolean;
  actor_owns_grant: boolean;
  role_reaches_grant: boolean;
  grant_status: "pending" | "active" | "revoked" | "expired" | "replaced" | "deleted" | "missing";
  grant_version: number;
  child_care_process_id?: string;
  output_refs: DomainContextRef[];
};

export type FamilyInputRoutePayload = {
  participant_id: string;
  role_assignment_id: string;
  child_care_process_id: string;
  family_id: string;
  enrollment_id: string;
  care_group_id: string;
  thread_id: string;
  data_class: NurtureGrantDataClass;
  category: "today_attention" | "constraint" | "question" | "follow_up" | "schedule" | "admin" | "other";
  urgency: "normal" | "today_attention" | "time_sensitive" | "urgent_non_emergency";
  safe_summary: string;
  protected_content_ref: DomainContextRef;
  attachment_refs: DomainContextRef[];
  source_surface: "mobile" | "web" | "system_import" | "workflow";
  routing_attempt_key: string;
  route_mode: "immediate" | "pending_workflow";
  pending_driver_ref?: DomainContextRef;
  requires_ack: boolean;
  requires_reply: boolean;
};

export type FamilyInputRouteFacts = {
  participant_active: boolean;
  guardian_role_active: boolean;
  role_reaches_family: boolean;
  child_process_active: boolean;
  family_active: boolean;
  enrollment_active: boolean;
  thread_active: boolean;
  thread_membership_active: boolean;
  grant: FamilyCareCurrentGrant;
};

export type FamilyInputRouteApplied = {
  message_ref: DomainContextRef;
  receipt_ref: DomainContextRef;
  item_ref?: DomainContextRef;
  attention_ref?: DomainContextRef;
};

export type FamilyCareItemActionPayload = {
  participant_id: string;
  role_assignment_id: string;
  item_id: string;
  expected_version: number;
  required_direction: NurtureGrantDirection;
};

export type FamilyCareItemActionFacts = {
  participant_active: boolean;
  caregiver_role_active: boolean;
  caregiver_scope_matches: boolean;
  enrollment_active: boolean;
  thread_active: boolean;
  thread_membership_active: boolean;
  grant: FamilyCareCurrentGrant;
  item_status:
    | "open"
    | "acknowledged"
    | "waiting_for_family"
    | "replied"
    | "followed_up"
    | "closed"
    | "expired"
    | "suppressed"
    | "missing";
  item_version: number;
  child_care_process_id?: string;
  item_data_class?: NurtureGrantDataClass;
  output_refs: DomainContextRef[];
};

export type FamilyCareReplyPayload = FamilyCareItemActionPayload & {
  protected_content_ref: DomainContextRef;
  safe_summary: string;
  routing_attempt_key: string;
};

export type FamilyCareReplyApplied = {
  item_ref: DomainContextRef;
  item_event_ref: DomainContextRef;
  message_ref: DomainContextRef;
  receipt_ref: DomainContextRef;
};

export type FamilyCareRedactionPayload = {
  participant_id: string;
  role_assignment_id: string;
  message_id: string;
  expected_version: number;
  reason_code: string;
};

export type FamilyCareRedactionFacts = {
  participant_active: boolean;
  author_role_active: boolean;
  actor_is_author: boolean;
  message_status: "sent" | "redacted" | "failed" | "missing";
  message_version: number;
  child_care_process_id?: string;
  output_refs: DomainContextRef[];
};

export type FamilyCareCancelRoutePayload = {
  participant_id: string;
  role_assignment_id: string;
  receipt_id: string;
  expected_version: number;
};

export type FamilyCareCancelRouteFacts = {
  participant_active: boolean;
  actor_owns_source: boolean;
  receipt_status:
    | "pending"
    | "delivered"
    | "read"
    | "acknowledged"
    | "failed"
    | "blocked"
    | "revoked_after_delivery"
    | "missing";
  receipt_version: number;
  child_care_process_id?: string;
  receipt_reason_code?: string;
  output_refs: DomainContextRef[];
};

export type FamilyCareTransactionInput<T> = T & { workspace_id: string };

// G2 three-axis submit (10-g2-schema-freeze.md; the Harness path is the only
// writer of harness_g2_v1 rows). Facts are server-resolved from the exact
// enrollment; the payload never carries raw scope/authority fields.
export type G2SubmitCommandPayload = {
  participant_id: string;
  enrollment_id: string;
  context_continuation_of_item_id?: string;
};

export type G2SubmitFacts = {
  participant_active: boolean;
  guardian_role_assignment_id?: string;
  enrollment_active: boolean;
  child_care_process_id?: string;
  family_id?: string;
  care_group_id?: string;
  thread_id?: string;
  grant: FamilyCareCurrentGrant;
  continuation_eligible?: boolean;
};

export type G2SubmitApplyInput = G2SubmitCommandPayload & {
  guardian_role_assignment_id: string;
  child_care_process_id: string;
  family_id: string;
  care_group_id: string;
  thread_id: string;
  grant_id: string;
  body_envelope: unknown;
  safe_summary: string;
};

export type G2SubmitApplied = {
  message_ref: DomainContextRef;
  item_ref: DomainContextRef;
  item_event_ref: DomainContextRef;
  receipt_ref: DomainContextRef;
  attention_ref: DomainContextRef;
};

// G2 caregiver item actions (acknowledge / reply). Facts are read from the
// item's own frozen original scope; the item's original Grant is re-read by
// id — a replacement Grant never takes over an existing Item.
export type G2ItemActionPayload = {
  participant_id: string;
  item_id: string;
};

export type G2ItemActionFacts = {
  participant_active: boolean;
  caregiver_role_assignment_id?: string;
  item_present: boolean;
  writer_contract?: "legacy_v1" | "legacy_migrated_v1" | "harness_g2_v1";
  acknowledgement_state?: "pending" | "acknowledged";
  acknowledgement_head?: number;
  response_state?: "awaiting_reply" | "responded" | "not_applicable";
  lifecycle_state?: "active" | "closed" | "suppressed";
  lifecycle_head?: number;
  item_safe_summary?: string;
  grant: FamilyCareCurrentGrant;
  existing_acknowledgement_refs?: DomainContextRef[];
};

export type G2AcknowledgeApplyInput = G2ItemActionPayload & {
  caregiver_role_assignment_id: string;
  expected_acknowledgement_head: number;
};

export type G2AcknowledgeApplied = {
  item_ref: DomainContextRef;
  item_event_ref: DomainContextRef;
  receipt_ref?: DomainContextRef;
};

export type G2ReplyApplyInput = G2ItemActionPayload & {
  caregiver_role_assignment_id: string;
  grant_id: string;
  body_envelope: unknown;
};

export type G2ReplyApplied = {
  message_ref: DomainContextRef;
  item_ref: DomainContextRef;
  item_event_ref: DomainContextRef;
  receipt_ref: DomainContextRef;
  reply_order_key: string;
  response_effect: "first_response" | "additional_response";
  attention_effect: "resolved" | "unchanged";
};

export type NurtureFamilyCareCommandTransaction = {
  loadFamilyCareGrantRevokeFacts(input: FamilyCareTransactionInput<FamilyCareGrantRevokePayload>): Promise<FamilyCareGrantRevokeFacts>;
  revokeFamilyCareGrant(input: FamilyCareTransactionInput<FamilyCareGrantRevokePayload>): Promise<{
    grant_ref: DomainContextRef;
    affected_item_refs: DomainContextRef[];
    affected_receipt_refs: DomainContextRef[];
  }>;
  loadFamilyInputRouteFacts(input: FamilyCareTransactionInput<FamilyInputRoutePayload>): Promise<FamilyInputRouteFacts>;
  applyFamilyInputRoute(input: FamilyCareTransactionInput<FamilyInputRoutePayload>): Promise<FamilyInputRouteApplied>;
  loadFamilyCareItemActionFacts(input: FamilyCareTransactionInput<FamilyCareItemActionPayload>): Promise<FamilyCareItemActionFacts>;
  acknowledgeFamilyCareItem(input: FamilyCareTransactionInput<FamilyCareItemActionPayload>): Promise<{
    item_ref: DomainContextRef;
    item_event_ref: DomainContextRef;
    receipt_ref?: DomainContextRef;
  }>;
  replyToFamilyCareItem(input: FamilyCareTransactionInput<FamilyCareReplyPayload>): Promise<FamilyCareReplyApplied>;
  loadFamilyCareRedactionFacts(input: FamilyCareTransactionInput<FamilyCareRedactionPayload>): Promise<FamilyCareRedactionFacts>;
  redactFamilyCareMessage(input: FamilyCareTransactionInput<FamilyCareRedactionPayload>): Promise<{
    message_ref: DomainContextRef;
    affected_item_refs: DomainContextRef[];
    affected_receipt_refs: DomainContextRef[];
  }>;
  loadFamilyCareCancelRouteFacts(input: FamilyCareTransactionInput<FamilyCareCancelRoutePayload>): Promise<FamilyCareCancelRouteFacts>;
  cancelFamilyCareRoute(input: FamilyCareTransactionInput<FamilyCareCancelRoutePayload>): Promise<{
    receipt_ref: DomainContextRef;
  }>;
  /** Present when the G2 three-axis Harness writer is wired. */
  loadG2SubmitFacts?(input: FamilyCareTransactionInput<G2SubmitCommandPayload>): Promise<G2SubmitFacts>;
  applyG2Submit?(input: FamilyCareTransactionInput<G2SubmitApplyInput>): Promise<G2SubmitApplied>;
  loadG2ItemActionFacts?(input: FamilyCareTransactionInput<G2ItemActionPayload>): Promise<G2ItemActionFacts>;
  applyG2Acknowledge?(input: FamilyCareTransactionInput<G2AcknowledgeApplyInput>): Promise<G2AcknowledgeApplied>;
  applyG2Reply?(input: FamilyCareTransactionInput<G2ReplyApplyInput>): Promise<G2ReplyApplied>;
};
