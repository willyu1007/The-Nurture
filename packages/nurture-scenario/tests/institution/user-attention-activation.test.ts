import { describe, expect, it } from "vitest";
import {
  NurtureUserAttentionService,
  type NurtureUserAttentionFacts,
  type NurtureUserAttentionRepository,
} from "../../src/index.js";

const refs = () => [
  {
    namespace: "nurture",
    consumer_scenario_key: "nurture",
    object_type: "family_care_message",
    object_id: "message-1",
    version: 0,
    owner_scope: "workspace" as const,
  },
  {
    namespace: "nurture",
    consumer_scenario_key: "nurture",
    object_type: "child_link_receipt",
    object_id: "receipt-1",
    version: 0,
    owner_scope: "workspace" as const,
  },
  {
    namespace: "nurture",
    consumer_scenario_key: "nurture",
    object_type: "family_care_item",
    object_id: "item-1",
    version: 0,
    owner_scope: "workspace" as const,
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

const service = (value: NurtureUserAttentionFacts) =>
  new NurtureUserAttentionService(
    { loadCurrentFacts: async () => value } satisfies NurtureUserAttentionRepository,
    () => new Date("2026-07-15T08:00:00.000Z"),
  );

describe("NurtureUserAttentionService", () => {
  it("returns only current My-Chat recipient ids and generic display data", async () => {
    await expect(
      service(facts()).resolve({
        workspace_id: "workspace-1",
        source_context_refs: refs(),
      }),
    ).resolves.toEqual({
      status: "ready",
      recipient_user_ids: ["user-1", "user-2"],
      title_display: "New family care item",
      body_display: "Open The Nurture to review the current item.",
      route_key: "teacher_attention_board",
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

  it("rejects partial, duplicate, unlinked, and no-longer-open sources", async () => {
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
      service(facts({ item: { ...facts().item!, status: "resolved" } })).resolve({
        workspace_id: "workspace-1",
        source_context_refs: refs(),
      }),
    ).resolves.toEqual({ status: "stopped", reason_code: "policy_blocked" });
  });
});
