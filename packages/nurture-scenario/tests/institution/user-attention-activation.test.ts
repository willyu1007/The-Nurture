import { describe, expect, it, vi } from "vitest";
import {
  NurtureUserAttentionService,
  type NurtureUserAttentionFacts,
  type NurtureUserAttentionRepository,
} from "../../src/index.js";

const refs = () => [
  {
    schema_version: 1 as const,
    namespace: "nurture",
    object_type: "family_care_message",
    object_id: "message-1",
    version: 1,
  },
  {
    schema_version: 1 as const,
    namespace: "nurture",
    object_type: "child_link_receipt",
    object_id: "receipt-1",
    version: 1,
  },
  {
    schema_version: 1 as const,
    namespace: "nurture",
    object_type: "family_care_item",
    object_id: "item-1",
    version: 1,
  },
];

const facts = (overrides: Partial<NurtureUserAttentionFacts> = {}): NurtureUserAttentionFacts => ({
  message: {
    id: "message-1",
    status: "sent",
    redacted: false,
    thread_id: "thread-1",
    child_care_process_id: "process-1",
    grant_id: "grant-1",
  },
  receipt: {
    id: "receipt-1",
    status: "delivered",
    direction: "family_to_org",
    data_class: "family_care_question",
    source_type: "family_care_message",
    source_id: "message-1",
    target_scope_type: "care_group",
    target_scope_id: "group-1",
    grant_id: "grant-1",
    child_care_process_id: "process-1",
    enrollment_id: "enrollment-1",
  },
  item: {
    id: "item-1",
    status: "open",
    source_message_id: "message-1",
    thread_id: "thread-1",
    child_care_process_id: "process-1",
    enrollment_id: "enrollment-1",
    care_group_id: "group-1",
    grant_id: "grant-1",
    data_class: "family_care_question",
    version: 0,
    updated_at: "2026-07-15T07:00:00.000Z",
    acknowledged: false,
    acknowledgement: null,
  },
  current: {
    grant_active: true,
    grant_revoked: false,
    grant_direction_allowed: true,
    grant_data_class_allowed: true,
    grant_target_matches: true,
    enrollment_active: true,
    thread_active: true,
    care_group_active: true,
    institution_active: true,
  },
  recipient_user_ids: ["user-2", "user-1", "user-1"],
  ...overrides,
});

const acknowledgedFacts = (): NurtureUserAttentionFacts =>
  facts({
    receipt: { ...facts().receipt!, status: "acknowledged" },
    item: {
      ...facts().item!,
      status: "acknowledged",
      version: 1,
      acknowledged: true,
      acknowledgement: {
        receipt_id: "ack-event-1",
        idempotency_key: "command-1",
        item_version: 2,
        acknowledged_at: "2026-07-15T07:30:00.000Z",
      },
    },
  });

const repository = (
  value: NurtureUserAttentionFacts,
  applyAcknowledgement: NurtureUserAttentionRepository["applyAcknowledgement"] = async () => ({
    status: "conflict",
  }),
): NurtureUserAttentionRepository => ({
  loadCurrentFacts: async () => value,
  applyAcknowledgement,
});

const service = (
  value: NurtureUserAttentionFacts,
  applyAcknowledgement?: NurtureUserAttentionRepository["applyAcknowledgement"],
) =>
  new NurtureUserAttentionService(
    repository(value, applyAcknowledgement),
    () => new Date("2026-07-15T08:00:00.000Z"),
  );

const expectedItem = () => ({
  contract_version: 1,
  presentation_type: "nurture_attention_v1",
  owner_ref: {
    schema_version: 1,
    namespace: "nurture",
    object_type: "family_care_item",
    object_id: "item-1",
    version: 1,
  },
  title_display: "New family care item",
  source_display: "The Nurture",
  data_class: "family_private",
  status: "attention",
  item_version: 1,
  updated_at: "2026-07-15T07:00:00.000Z",
  detail_deep_link: "morethan://nurture/family-care/item-1",
  available_actions: [
    { key: "acknowledge", label_display: "Acknowledge", confirmation_required: false },
  ],
});

describe("NurtureUserAttentionService", () => {
  it("returns only current My-Chat recipient ids and a generic dashboard item", async () => {
    await expect(
      service(facts()).resolve({
        workspace_id: "workspace-1",
        source_context_refs: refs(),
      }),
    ).resolves.toEqual({
      status: "ready",
      recipient_user_ids: ["user-1", "user-2"],
      item: expectedItem(),
    });
  });

  it("presents an acknowledged item with no available actions", async () => {
    await expect(
      service(acknowledgedFacts()).resolve({
        workspace_id: "workspace-1",
        source_context_refs: refs(),
        actor_user_id: "user-1",
      }),
    ).resolves.toEqual({
      status: "ready",
      recipient_user_ids: ["user-1"],
      item: {
        ...expectedItem(),
        owner_ref: { ...expectedItem().owner_ref, version: 2 },
        status: "acknowledged",
        item_version: 2,
        available_actions: [],
      },
    });
  });

  it("rechecks actor authorization when a deep link is opened", async () => {
    await expect(
      service(facts()).resolve({
        workspace_id: "workspace-1",
        source_context_refs: refs(),
        actor_user_id: "user-other",
      }),
    ).resolves.toEqual({ status: "stopped", reason_code: "target_unavailable" });
  });

  it("keeps an authorized deep link readable after the business receipt was read", async () => {
    await expect(
      service(
        facts({
          receipt: { ...facts().receipt!, status: "read" },
        }),
      ).resolve({
        workspace_id: "workspace-1",
        source_context_refs: refs(),
        actor_user_id: "user-1",
      }),
    ).resolves.toMatchObject({
      status: "ready",
      recipient_user_ids: ["user-1"],
    });

    await expect(
      service(
        facts({
          receipt: { ...facts().receipt!, status: "read" },
        }),
      ).resolve({
        workspace_id: "workspace-1",
        source_context_refs: refs(),
      }),
    ).resolves.toEqual({ status: "stopped", reason_code: "policy_blocked" });
  });

  it("classifies redaction and grant revoke before target delivery", async () => {
    await expect(
      service(
        facts({
          message: { ...facts().message!, status: "redacted", redacted: true },
        }),
      ).resolve({ workspace_id: "workspace-1", source_context_refs: refs() }),
    ).resolves.toEqual({ status: "stopped", reason_code: "source_redacted" });
    await expect(
      service(
        facts({
          current: { ...facts().current, grant_active: false, grant_revoked: true },
        }),
      ).resolve({ workspace_id: "workspace-1", source_context_refs: refs() }),
    ).resolves.toEqual({ status: "stopped", reason_code: "grant_revoked" });
  });

  it("does not disclose lifecycle reasons to a non-recipient deep-link actor", async () => {
    await expect(
      service(
        facts({
          message: { ...facts().message!, status: "redacted", redacted: true },
        }),
      ).resolve({
        workspace_id: "workspace-1",
        source_context_refs: refs(),
        actor_user_id: "user-other",
      }),
    ).resolves.toEqual({ status: "stopped", reason_code: "target_unavailable" });
  });

  it("rejects partial, duplicate, unlinked, and no-longer-current sources", async () => {
    await expect(
      service(facts()).resolve({
        workspace_id: "workspace-1",
        source_context_refs: refs().slice(0, 2),
      }),
    ).resolves.toEqual({ status: "stopped", reason_code: "policy_blocked" });
    await expect(
      service(facts({ item: { ...facts().item!, source_message_id: "message-other" } })).resolve({
        workspace_id: "workspace-1",
        source_context_refs: refs(),
      }),
    ).resolves.toEqual({ status: "stopped", reason_code: "policy_blocked" });
    await expect(
      service(facts({ item: { ...facts().item!, status: "closed" } })).resolve({
        workspace_id: "workspace-1",
        source_context_refs: refs(),
      }),
    ).resolves.toEqual({ status: "stopped", reason_code: "policy_blocked" });
  });

  describe("acknowledge", () => {
    it("applies a fenced acknowledgement and returns the receipt", async () => {
      const applyAcknowledgement = vi.fn(
        async (): ReturnType<NurtureUserAttentionRepository["applyAcknowledgement"]> => ({
          status: "applied",
          receipt_id: "ack-event-1",
          acknowledged_at: "2026-07-15T08:00:00.000Z",
        }),
      );
      await expect(
        service(facts(), applyAcknowledgement).acknowledge({
          workspace_id: "workspace-1",
          source_context_refs: refs(),
          actor_user_id: "user-1",
          expected_item_version: 1,
          idempotency_key: "command-1",
        }),
      ).resolves.toEqual({
        status: "applied",
        receipt_ref: {
          schema_version: 1,
          namespace: "nurture",
          object_type: "user_attention_receipt",
          object_id: "ack-event-1",
          version: 2,
        },
        item_version: 2,
        acknowledged_at: "2026-07-15T08:00:00.000Z",
        replayed: false,
      });
      expect(applyAcknowledgement).toHaveBeenCalledWith({
        workspace_id: "workspace-1",
        item_id: "item-1",
        receipt_id: "receipt-1",
        actor_user_id: "user-1",
        idempotency_key: "command-1",
        expected_item_version: 0,
        acknowledged_item_version: 2,
        at: "2026-07-15T08:00:00.000Z",
      });
    });

    it("replays the stored response for the same idempotency key", async () => {
      await expect(
        service(acknowledgedFacts()).acknowledge({
          workspace_id: "workspace-1",
          source_context_refs: refs(),
          actor_user_id: "user-1",
          expected_item_version: 1,
          idempotency_key: "command-1",
        }),
      ).resolves.toEqual({
        status: "applied",
        receipt_ref: {
          schema_version: 1,
          namespace: "nurture",
          object_type: "user_attention_receipt",
          object_id: "ack-event-1",
          version: 2,
        },
        item_version: 2,
        acknowledged_at: "2026-07-15T07:30:00.000Z",
        replayed: true,
      });
    });

    it("rejects an already-acknowledged item under a different idempotency key", async () => {
      await expect(
        service(acknowledgedFacts()).acknowledge({
          workspace_id: "workspace-1",
          source_context_refs: refs(),
          actor_user_id: "user-1",
          expected_item_version: 2,
          idempotency_key: "command-other",
        }),
      ).resolves.toEqual({ status: "rejected", reason_code: "version_conflict" });
    });

    it("rejects stale expected versions and lost write races as version_conflict", async () => {
      await expect(
        service(facts()).acknowledge({
          workspace_id: "workspace-1",
          source_context_refs: refs(),
          actor_user_id: "user-1",
          expected_item_version: 7,
          idempotency_key: "command-1",
        }),
      ).resolves.toEqual({ status: "rejected", reason_code: "version_conflict" });
      await expect(
        service(facts(), async () => ({ status: "conflict" })).acknowledge({
          workspace_id: "workspace-1",
          source_context_refs: refs(),
          actor_user_id: "user-1",
          expected_item_version: 1,
          idempotency_key: "command-1",
        }),
      ).resolves.toEqual({ status: "rejected", reason_code: "version_conflict" });
    });

    it("keeps the owner-reread and revocation fences on the action path", async () => {
      await expect(
        service(
          facts({
            current: { ...facts().current, grant_active: false, grant_revoked: true },
          }),
        ).acknowledge({
          workspace_id: "workspace-1",
          source_context_refs: refs(),
          actor_user_id: "user-1",
          expected_item_version: 1,
          idempotency_key: "command-1",
        }),
      ).resolves.toEqual({ status: "rejected", reason_code: "grant_revoked" });
      await expect(
        service(facts()).acknowledge({
          workspace_id: "workspace-1",
          source_context_refs: refs(),
          actor_user_id: "user-other",
          expected_item_version: 1,
          idempotency_key: "command-1",
        }),
      ).resolves.toEqual({ status: "rejected", reason_code: "target_unavailable" });
    });
  });
});
