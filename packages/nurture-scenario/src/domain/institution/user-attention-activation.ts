import type { DomainContextRef } from "@my-chat/workflow-contracts";

export const nurtureUserAttentionStopReasons = [
  "source_redacted",
  "grant_revoked",
  "policy_blocked",
  "target_unavailable",
] as const;

export type NurtureUserAttentionStopReason =
  (typeof nurtureUserAttentionStopReasons)[number];

export type NurtureUserAttentionFacts = {
  message: {
    id: string;
    status: "sent" | "redacted" | "failed";
    redacted: boolean;
    thread_id: string;
    child_care_process_id: string;
    grant_id?: string;
  } | null;
  receipt: {
    id: string;
    status: "pending" | "delivered" | "read" | "acknowledged" | "failed" | "blocked" | "revoked_after_delivery";
    direction: string;
    data_class?: string;
    source_type: string;
    source_id: string;
    target_scope_type?: string;
    target_scope_id?: string;
    grant_id?: string;
    child_care_process_id: string;
    enrollment_id?: string;
  } | null;
  item: {
    id: string;
    status: string;
    source_message_id?: string;
    thread_id: string;
    child_care_process_id: string;
    enrollment_id?: string;
    care_group_id: string;
    grant_id?: string;
    data_class: string;
    expires_at?: string;
  } | null;
  current: {
    grant_active: boolean;
    grant_revoked: boolean;
    grant_direction_allowed: boolean;
    grant_data_class_allowed: boolean;
    grant_target_matches: boolean;
    enrollment_active: boolean;
    thread_active: boolean;
    care_group_active: boolean;
    institution_active: boolean;
  };
  recipient_user_ids: string[];
};

export type NurtureUserAttentionRepository = {
  loadCurrentFacts(input: {
    workspace_id: string;
    message_id: string;
    receipt_id: string;
    item_id: string;
    at: string;
  }): Promise<NurtureUserAttentionFacts>;
};

export type NurtureUserAttentionResolution =
  | {
      status: "ready";
      recipient_user_ids: string[];
      title_display: "New family care item";
      body_display: "Open The Nurture to review the current item.";
      route_key: "teacher_attention_board";
    }
  | { status: "stopped"; reason_code: NurtureUserAttentionStopReason };

const sourceIds = (
  refs: readonly DomainContextRef[],
): { message_id: string; receipt_id: string; item_id: string } | null => {
  if (refs.length !== 3) return null;
  const byType = new Map<string, string>();
  for (const ref of refs) {
    if (
      ref.namespace !== "nurture" ||
      ref.consumer_scenario_key !== "nurture" ||
      ref.owner_scope !== "workspace" ||
      !["family_care_message", "child_link_receipt", "family_care_item"].includes(ref.object_type) ||
      byType.has(ref.object_type)
    ) {
      return null;
    }
    byType.set(ref.object_type, ref.object_id);
  }
  const messageId = byType.get("family_care_message");
  const receiptId = byType.get("child_link_receipt");
  const itemId = byType.get("family_care_item");
  return messageId && receiptId && itemId
    ? { message_id: messageId, receipt_id: receiptId, item_id: itemId }
    : null;
};

export class NurtureUserAttentionService {
  constructor(
    private readonly repository: NurtureUserAttentionRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async resolve(input: {
    workspace_id: string;
    source_context_refs: readonly DomainContextRef[];
    actor_user_id?: string;
  }): Promise<NurtureUserAttentionResolution> {
    const ids = sourceIds(input.source_context_refs);
    if (!ids) return { status: "stopped", reason_code: "policy_blocked" };
    const now = this.now();
    const facts = await this.repository.loadCurrentFacts({
      workspace_id: input.workspace_id,
      ...ids,
      at: now.toISOString(),
    });
    if (!facts.message || !facts.receipt || !facts.item) {
      return { status: "stopped", reason_code: "policy_blocked" };
    }
    const recipients = [...new Set(facts.recipient_user_ids)].sort();
    if (
      input.actor_user_id !== undefined &&
      !recipients.includes(input.actor_user_id)
    ) {
      return { status: "stopped", reason_code: "target_unavailable" };
    }
    if (facts.message.redacted || facts.message.status === "redacted") {
      return { status: "stopped", reason_code: "source_redacted" };
    }
    if (
      facts.receipt.status === "revoked_after_delivery" ||
      facts.current.grant_revoked
    ) {
      return { status: "stopped", reason_code: "grant_revoked" };
    }
    const linked =
      facts.message.status === "sent" &&
      facts.receipt.source_type === "family_care_message" &&
      facts.receipt.source_id === facts.message.id &&
      facts.item.source_message_id === facts.message.id &&
      facts.message.thread_id === facts.item.thread_id &&
      facts.message.child_care_process_id === facts.receipt.child_care_process_id &&
      facts.message.child_care_process_id === facts.item.child_care_process_id &&
      facts.receipt.enrollment_id === facts.item.enrollment_id &&
      facts.message.grant_id === facts.receipt.grant_id &&
      facts.message.grant_id === facts.item.grant_id &&
      facts.receipt.data_class === facts.item.data_class;
    const receiptStatusCurrent = input.actor_user_id
      ? ["delivered", "read", "acknowledged"].includes(facts.receipt.status)
      : facts.receipt.status === "delivered";
    const current =
      receiptStatusCurrent &&
      facts.receipt.direction === "family_to_org" &&
      facts.item.status === "open" &&
      (!facts.item.expires_at || new Date(facts.item.expires_at) > now) &&
      facts.current.grant_active &&
      facts.current.grant_direction_allowed &&
      facts.current.grant_data_class_allowed &&
      facts.current.grant_target_matches &&
      facts.current.enrollment_active &&
      facts.current.thread_active &&
      facts.current.care_group_active &&
      facts.current.institution_active;
    if (!linked || !current) {
      return { status: "stopped", reason_code: "policy_blocked" };
    }
    if (recipients.length === 0) {
      return { status: "stopped", reason_code: "target_unavailable" };
    }
    return {
      status: "ready",
      recipient_user_ids: input.actor_user_id ? [input.actor_user_id] : recipients,
      title_display: "New family care item",
      body_display: "Open The Nurture to review the current item.",
      route_key: "teacher_attention_board",
    };
  }
}
