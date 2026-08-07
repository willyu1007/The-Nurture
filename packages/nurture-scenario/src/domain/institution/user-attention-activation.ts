import type { CanonicalRef } from "@my-chat/workflow-contracts";

type DomainContextRef = CanonicalRef;

export const nurtureUserAttentionStopReasons = [
  "source_redacted",
  "grant_revoked",
  "policy_blocked",
  "target_unavailable",
] as const;

export type NurtureUserAttentionStopReason =
  (typeof nurtureUserAttentionStopReasons)[number];

export type NurtureUserAttentionAcknowledgeReasonCode =
  | NurtureUserAttentionStopReason
  | "version_conflict";

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
    /** Persisted optimistic-lock version (0-based at creation). */
    version: number;
    updated_at: string;
    acknowledged: boolean;
    /**
     * The stored owner-side acknowledgement record, when one exists. Used to
     * replay the acknowledge response for the same idempotency key.
     */
    acknowledgement: {
      receipt_id: string;
      idempotency_key: string;
      item_version: number;
      acknowledged_at: string;
    } | null;
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

export type NurtureUserAttentionAcknowledgeApplied = {
  status: "applied";
  receipt_id: string;
  acknowledged_at: string;
};

export type NurtureUserAttentionRepository = {
  loadCurrentFacts(input: {
    workspace_id: string;
    message_id: string;
    receipt_id: string;
    item_id: string;
    at: string;
  }): Promise<NurtureUserAttentionFacts>;
  /**
   * Guarded acknowledgement write. Must re-fence in the same channel it
   * mutates: the item update is conditional on the expected persisted item
   * version, an open status, and a currently active grant, so a concurrent
   * acknowledge or revoke resolves to `conflict` instead of a lost update.
   */
  applyAcknowledgement(input: {
    workspace_id: string;
    item_id: string;
    receipt_id: string;
    actor_user_id: string;
    idempotency_key: string;
    /** Persisted item version the write is fenced on. */
    expected_item_version: number;
    /** Presented (contract) item version after the acknowledgement. */
    acknowledged_item_version: number;
    at: string;
  }): Promise<NurtureUserAttentionAcknowledgeApplied | { status: "conflict" }>;
};

/**
 * Dashboard item served to My-Chat's typed Nurture attention contract
 * (`nurture_attention_v1`, contract_version 1). Display fields stay generic:
 * the attention surface never carries message bodies or item summaries.
 */
export type NurtureUserAttentionDashboardItem = {
  contract_version: 1;
  presentation_type: "nurture_attention_v1";
  owner_ref: {
    schema_version: 1;
    namespace: "nurture";
    object_type: "family_care_item";
    object_id: string;
    version: number;
  };
  title_display: string;
  source_display: string;
  data_class: "family_private";
  status: "attention" | "acknowledged";
  item_version: number;
  updated_at: string;
  expires_at?: string;
  detail_deep_link: string;
  available_actions: {
    key: "acknowledge";
    label_display: string;
    confirmation_required: false;
  }[];
};

export type NurtureUserAttentionResolution =
  | {
      status: "ready";
      recipient_user_ids: string[];
      item: NurtureUserAttentionDashboardItem;
    }
  | { status: "stopped"; reason_code: NurtureUserAttentionStopReason };

export type NurtureUserAttentionAcknowledgeOutcome =
  | {
      status: "applied";
      receipt_ref: {
        schema_version: 1;
        namespace: "nurture";
        object_type: "user_attention_receipt";
        object_id: string;
        version: number;
      };
      item_version: number;
      acknowledged_at: string;
      replayed: boolean;
    }
  | { status: "rejected"; reason_code: NurtureUserAttentionAcknowledgeReasonCode };

const sourceIds = (
  refs: readonly DomainContextRef[],
): { message_id: string; receipt_id: string; item_id: string } | null => {
  if (refs.length !== 3) return null;
  const byType = new Map<string, string>();
  for (const ref of refs) {
    if (
      ref.schema_version !== 1 ||
      ref.namespace !== "nurture" ||
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

/**
 * The persisted item version is 0-based at creation while the contract
 * requires a positive `item_version`; the presented version is offset by one.
 */
const presentedItemVersion = (persistedVersion: number): number => persistedVersion + 1;

type EvaluatedCurrent =
  | { status: "stopped"; reason_code: NurtureUserAttentionStopReason }
  | {
      status: "current";
      recipient_user_ids: string[];
      item: NonNullable<NurtureUserAttentionFacts["item"]>;
    };

/** Owner-reread and revocation fences shared by resolve and acknowledge. */
const evaluateCurrentFacts = (
  facts: NurtureUserAttentionFacts,
  now: Date,
  actorUserId?: string,
): EvaluatedCurrent => {
  if (!facts.message || !facts.receipt || !facts.item) {
    return { status: "stopped", reason_code: "policy_blocked" };
  }
  const recipients = [...new Set(facts.recipient_user_ids)].sort();
  if (actorUserId !== undefined && !recipients.includes(actorUserId)) {
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
  const receiptStatusCurrent = actorUserId
    ? ["delivered", "read", "acknowledged"].includes(facts.receipt.status)
    : facts.receipt.status === "delivered";
  const current =
    receiptStatusCurrent &&
    facts.receipt.direction === "family_to_org" &&
    // Acknowledged items stay presentable (with zero available actions);
    // every other lifecycle state leaves the attention surface.
    ["open", "acknowledged"].includes(facts.item.status) &&
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
    status: "current",
    recipient_user_ids: actorUserId ? [actorUserId] : recipients,
    item: facts.item,
  };
};

const dashboardItem = (
  item: NonNullable<NurtureUserAttentionFacts["item"]>,
): NurtureUserAttentionDashboardItem => ({
  contract_version: 1,
  presentation_type: "nurture_attention_v1",
  owner_ref: {
    schema_version: 1,
    namespace: "nurture",
    object_type: "family_care_item",
    object_id: item.id,
    version: presentedItemVersion(item.version),
  },
  title_display: "New family care item",
  source_display: "The Nurture",
  data_class: "family_private",
  status: item.acknowledged ? "acknowledged" : "attention",
  item_version: presentedItemVersion(item.version),
  updated_at: item.updated_at,
  ...(item.expires_at ? { expires_at: item.expires_at } : {}),
  detail_deep_link: `morethan://nurture/family-care/${item.id}`,
  available_actions: item.acknowledged
    ? []
    : [{ key: "acknowledge", label_display: "Acknowledge", confirmation_required: false }],
});

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
    const evaluated = evaluateCurrentFacts(facts, now, input.actor_user_id);
    if (evaluated.status === "stopped") {
      return { status: "stopped", reason_code: evaluated.reason_code };
    }
    return {
      status: "ready",
      recipient_user_ids: evaluated.recipient_user_ids,
      item: dashboardItem(evaluated.item),
    };
  }

  async acknowledge(input: {
    workspace_id: string;
    source_context_refs: readonly DomainContextRef[];
    actor_user_id: string;
    expected_item_version: number;
    idempotency_key: string;
  }): Promise<NurtureUserAttentionAcknowledgeOutcome> {
    const ids = sourceIds(input.source_context_refs);
    if (!ids) return { status: "rejected", reason_code: "policy_blocked" };
    const now = this.now();
    const facts = await this.repository.loadCurrentFacts({
      workspace_id: input.workspace_id,
      ...ids,
      at: now.toISOString(),
    });
    const evaluated = evaluateCurrentFacts(facts, now, input.actor_user_id);
    if (evaluated.status === "stopped") {
      return { status: "rejected", reason_code: evaluated.reason_code };
    }
    const item = evaluated.item;
    if (item.acknowledged) {
      const stored = item.acknowledgement;
      if (stored && stored.idempotency_key === input.idempotency_key) {
        return {
          status: "applied",
          receipt_ref: {
            schema_version: 1,
            namespace: "nurture",
            object_type: "user_attention_receipt",
            object_id: stored.receipt_id,
            version: stored.item_version,
          },
          item_version: stored.item_version,
          acknowledged_at: stored.acknowledged_at,
          replayed: true,
        };
      }
      return { status: "rejected", reason_code: "version_conflict" };
    }
    if (input.expected_item_version !== presentedItemVersion(item.version)) {
      return { status: "rejected", reason_code: "version_conflict" };
    }
    const acknowledgedItemVersion = presentedItemVersion(item.version) + 1;
    const applied = await this.repository.applyAcknowledgement({
      workspace_id: input.workspace_id,
      item_id: item.id,
      receipt_id: ids.receipt_id,
      actor_user_id: input.actor_user_id,
      idempotency_key: input.idempotency_key,
      expected_item_version: item.version,
      acknowledged_item_version: acknowledgedItemVersion,
      at: now.toISOString(),
    });
    if (applied.status === "conflict") {
      return { status: "rejected", reason_code: "version_conflict" };
    }
    return {
      status: "applied",
      receipt_ref: {
        schema_version: 1,
        namespace: "nurture",
        object_type: "user_attention_receipt",
        object_id: applied.receipt_id,
        version: acknowledgedItemVersion,
      },
      item_version: acknowledgedItemVersion,
      acknowledged_at: applied.acknowledged_at,
      replayed: false,
    };
  }
}
