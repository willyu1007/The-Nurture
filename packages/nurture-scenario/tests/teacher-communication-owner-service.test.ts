import { describe, expect, it, vi } from "vitest";
import type { NurtureCommandResult } from "../src/domain/commands/command-kernel.js";
import { issueBoardOpaqueRef } from "../src/harness/board-projection.js";
import {
  createTeacherCommunicationOwnerService,
  type TeacherCommunicationMessageRowV1,
  type TeacherCommunicationOwnerServiceDependenciesV1,
  type TeacherCommunicationThreadRowV1,
} from "../src/teacher-communication-owner-service.js";

const INTEGRITY_KEY = "teacher-communication-owner-unit-key-01";
const NOW = new Date("2026-08-14T09:00:00.000Z");
const WORKSPACE = "workspace-unit-01";
const USER = "user-unit-01";
const PARTICIPANT = "participant-unit-01";
const CARE_GROUP = "care-group-unit-01";

const ref = (kind: string, id: string) =>
  issueBoardOpaqueRef(INTEGRITY_KEY, { workspace_id: WORKSPACE }, kind, id);

const context = () => ({
  participant_id: PARTICIPANT,
  participant_version: 2,
  classes: [
    {
      care_group_id: CARE_GROUP,
      care_group_label: "向日葵班",
      role: "lead_caregiver" as const,
      role_version: 3,
      care_group_version: 4,
      institution_id: "institution-unit-01",
      publication_policy_resolved: true,
    },
  ],
});

const baseRequest = () => ({
  workspace_id: WORKSPACE,
  my_chat_user_id: USER,
  host_request_id: "host-unit-01",
  context_ref: "context:teacher:unit:v1",
  class_ref: ref("care_group", CARE_GROUP),
});

const seal = (plaintext: string) => ({
  algVersion: 1,
  keyRef: "unit-key",
  ciphertext: Buffer.from(plaintext, "utf8").toString("base64url"),
  integrityTag: "dGFnLXVuaXQtMDAx",
});

const protectedContent = {
  seal,
  unseal: (envelope: { ciphertext: string }) =>
    Buffer.from(envelope.ciphertext, "base64url").toString("utf8"),
} as unknown as TeacherCommunicationOwnerServiceDependenciesV1["protectedContent"];

const THREADS: TeacherCommunicationThreadRowV1[] = [
  {
    thread_id: "thread-unit-01",
    family_safe_label: "小明家庭",
    child_safe_label: "小明",
    unread_count: 150,
    latest_message_at: "2026-08-14T08:55:00.000Z",
  },
  {
    thread_id: "thread-unit-02",
    family_safe_label: "小红家庭",
    child_safe_label: "小红",
    unread_count: 0,
  },
];

const MESSAGES: TeacherCommunicationMessageRowV1[] = [
  {
    message_id: "message-unit-01",
    kind: "text",
    sender_kind: "parent",
    agent_authored: false,
    sender_display: "小明妈妈",
    sent_at: "2026-08-14T08:40:00.000Z",
    delivery_state: "not_applicable",
    has_media: false,
    body_envelope: seal("今天有点咳嗽"),
  },
];

const deps = (
  overrides: Partial<TeacherCommunicationOwnerServiceDependenciesV1> & {
    result?: NurtureCommandResult;
    page?: {
      messages: readonly TeacherCommunicationMessageRowV1[];
      has_more: boolean;
      next?: { sent_at: string; message_id: string };
    };
  } = {},
): TeacherCommunicationOwnerServiceDependenciesV1 & {
  execute: ReturnType<typeof vi.fn>;
} => {
  const execute = vi.fn(async () =>
    overrides.result
      ?? ({
        status: "not_committed",
        decision: "technical_error",
        reason_code: "unexpected",
      } satisfies NurtureCommandResult));
  return {
    contextReads: { loadCaregiverContext: async () => context() },
    threadReads: {
      listClassThreads: async () => THREADS,
      listWithdrawCandidates: async () => [
        { process_id: "process-unit-01", process_key: "process-key-unit-01" },
      ],
      listThreadMembers: async () => [
        { member_id: "member-1", display_name: "小明妈妈", role_display: "家长" },
        { member_id: "member-2", display_name: "林老师", role_display: "带班老师" },
      ],
      loadTimelinePage: async () =>
        overrides.page ?? { messages: MESSAGES, has_more: false },
    },
    interactionContexts: {
      issue: async () => ({
        token: "confirmation-token-unit-01",
        purpose: "prepare_action",
        expires_at: new Date(NOW.getTime() + 300_000).toISOString(),
        context_id: "context-row-unit-01",
      }),
    },
    commands: { execute },
    protectedContent,
    integrityKey: INTEGRITY_KEY,
    now: () => NOW,
    execute,
    ...overrides,
  };
};

const authorityFor = async (
  binding: ReturnType<typeof createTeacherCommunicationOwnerService>,
  operation:
    | "targets_query"
    | "membership_query"
    | "timeline_query"
    | "send_text_exchange"
    | "withdraw_staged_exchange"
    | "mark_read_exchange",
) => {
  const decision = await binding.authorityResolver.resolve({
    ...baseRequest(),
    operation,
  });
  expect(decision.status).toBe("resolved");
  return (decision as unknown as { owner_resolution: never }).owner_resolution;
};

describe("teacher communication owner service", () => {
  it("masks foreign classes and reports resolver read failures as retryable", async () => {
    const binding = createTeacherCommunicationOwnerService(deps());
    const foreign = await binding.authorityResolver.resolve({
      ...baseRequest(),
      class_ref: ref("care_group", "care-group-foreign"),
      operation: "targets_query",
    });
    expect(foreign.status).toBe("closed");
    expect((foreign as { response: { status: string } }).response.status).toBe(
      "masked",
    );
    const failing = createTeacherCommunicationOwnerService(
      deps({
        contextReads: {
          loadCaregiverContext: async () => {
            throw new Error("db down");
          },
        },
      }),
    );
    const unavailable = await failing.authorityResolver.resolve({
      ...baseRequest(),
      operation: "timeline_query",
    });
    expect(
      (unavailable as { response: { status: string; retryable: boolean } }).response,
    ).toMatchObject({ status: "unavailable", retryable: true });
  });

  it("serves the rail with capped unread, a frozen class_group and a consistent summary", async () => {
    const binding = createTeacherCommunicationOwnerService(deps());
    const authority = await authorityFor(binding, "targets_query");
    const response = (await binding.owner.targets({
      request: baseRequest(),
      authority,
    })) as Record<string, unknown>;
    expect(response.status).toBe("ready");
    expect(response.class_group).toEqual({
      send_availability: "unavailable",
      reason_code: "class_group_reserved",
    });
    const threads = response.threads as Array<Record<string, unknown>>;
    expect(threads[0]).toMatchObject({
      thread_ref: ref("family_care_thread", "thread-unit-01"),
      unread_count: 99,
    });
    expect(response.unread_summary).toEqual({
      total_unread: 99,
      threads_with_unread: 1,
    });
    const cache = response.cache_partition as Record<string, unknown>;
    expect(cache.query_key).toBe(baseRequest().class_ref);
  });

  it("echoes cursors per the W4 rule and refuses tampered ones", async () => {
    const binding = createTeacherCommunicationOwnerService(
      deps({
        page: {
          messages: MESSAGES,
          has_more: true,
          next: { sent_at: "2026-08-14T08:40:00.000Z", message_id: "message-unit-01" },
        },
      }),
    );
    const authority = await authorityFor(binding, "timeline_query");
    const request = {
      ...baseRequest(),
      thread_ref: ref("family_care_thread", "thread-unit-01"),
    };
    const first = (await binding.owner.timeline({
      request,
      authority,
    })) as Record<string, unknown>;
    expect(first.cursor_echo).toBeNull();
    const page = first.page as Record<string, unknown>;
    expect(page.has_more).toBe(true);
    const nextCursor = String(page.next_cursor);

    const second = (await binding.owner.timeline({
      request: { ...request, cursor: nextCursor },
      authority,
    })) as Record<string, unknown>;
    expect(second.cursor_echo).toBe(nextCursor);
    const cache = second.cache_partition as Record<string, unknown>;
    expect(cache.query_key).toBe(`${request.thread_ref}|${nextCursor}`);
    const messages = first.messages as Array<Record<string, unknown>>;
    expect(messages[0]?.body).toBe("今天有点咳嗽");

    const tampered = (await binding.owner.timeline({
      request: { ...request, cursor: "not-a-real-cursor.ffff" },
      authority,
    })) as Record<string, unknown>;
    expect(tampered).toMatchObject({
      status: "unavailable",
      reason_code: "request_invalid",
      retryable: false,
    });
  });

  it("prepares a send with a bound digest and masks foreign threads", async () => {
    const binding = createTeacherCommunicationOwnerService(deps());
    const authority = await authorityFor(binding, "send_text_exchange");
    const request = {
      ...baseRequest(),
      thread_ref: ref("family_care_thread", "thread-unit-01"),
      command_request_id: "command-unit-send-0001",
      kind: "prepare" as const,
      prepare: { text: "明天请给小明带外套。" },
    };
    const prepared = (await binding.owner.sendText({
      request,
      authority,
    })) as Record<string, unknown>;
    expect(prepared).toMatchObject({
      status: "ready_to_confirm",
      confirmation_ref: "confirmation-token-unit-01",
    });
    expect(String(prepared.prepared_preview_digest)).toMatch(/^sha256:[a-f0-9]{64}$/);

    const foreign = (await binding.owner.sendText({
      request: {
        ...request,
        thread_ref: ref("family_care_thread", "thread-foreign"),
      },
      authority,
    })) as Record<string, unknown>;
    expect(foreign.status).toBe("masked");
  });

  it("maps send confirm results and binds the actor into the payload", async () => {
    const dependencies = deps({
      result: {
        status: "ok",
        disposition: "executed",
        business_outcome: "applied",
        execution_ref: {
          schema_version: 1,
          namespace: "nurture",
          object_type: "execution",
          object_id: "execution-1",
          version: 1,
        } as never,
        output_refs: [],
        handoff_request_snapshots: [],
        committed_result: {
          schema_version: 1,
          message_id: "message-unit-99",
          committed_at: "2026-08-14T09:00:02.000Z",
        },
      },
    });
    const binding = createTeacherCommunicationOwnerService(dependencies);
    const authority = await authorityFor(binding, "send_text_exchange");
    const response = (await binding.owner.sendText({
      request: {
        ...baseRequest(),
        thread_ref: ref("family_care_thread", "thread-unit-01"),
        command_request_id: "command-unit-send-0002",
        kind: "confirm" as const,
        confirm: {
          confirmation_ref: "confirmation-token-unit-01",
          prepared_preview_digest: `sha256:${"ab".repeat(32)}`,
        },
      },
      authority,
    })) as Record<string, unknown>;
    expect(response).toMatchObject({
      status: "committed",
      executed: "executed",
      message_ref: ref("family_care_message", "message-unit-99"),
      committed_at: "2026-08-14T09:00:02.000Z",
    });
    const payload = dependencies.execute.mock.calls[0]?.[0]?.payload as Record<string, unknown>;
    expect(typeof payload.actor_binding_ref).toBe("string");
    expect(String(payload.confirmation_digest)).toMatch(/^sha256:/);
  });

  it("withdraws through the cancel spec with head-free command identity", async () => {
    const dependencies = deps({
      result: {
        status: "ok",
        disposition: "replayed",
        business_outcome: "applied",
        execution_ref: {
          schema_version: 1,
          namespace: "nurture",
          object_type: "execution",
          object_id: "execution-2",
          version: 1,
        } as never,
        output_refs: [],
        handoff_request_snapshots: [],
        committed_result: {
          processRef: "sealed-ref",
          cancelledAt: "2026-08-14T09:00:03.000Z",
          auditRef: "audit-ref",
        },
      },
    });
    const binding = createTeacherCommunicationOwnerService(dependencies);
    const authority = await authorityFor(binding, "withdraw_staged_exchange");
    const processRef = ref("publish_process", "process-unit-01");
    const response = (await binding.owner.withdrawStaged({
      request: {
        ...baseRequest(),
        process_ref: processRef,
        command_request_id: "command-unit-withdraw-0001",
      },
      authority,
    })) as Record<string, unknown>;
    expect(response).toMatchObject({
      status: "committed",
      executed: "replayed",
      disposition: "withdrawn",
      process_ref: processRef,
      withdrawn_at: "2026-08-14T09:00:03.000Z",
    });
    const call = dependencies.execute.mock.calls[0]?.[0] as {
      payload: { process_key: string };
      spec: { canonicalize: (input: unknown) => Record<string, unknown> };
    };
    const canonical = call.spec.canonicalize(call.payload);
    expect(canonical.process_key).toBe("process-key-unit-01");
    expect(typeof canonical.actor_binding_ref).toBe("string");
    expect(canonical.expected_process_version).toBeUndefined();

    const foreign = (await binding.owner.withdrawStaged({
      request: {
        ...baseRequest(),
        process_ref: ref("publish_process", "process-foreign"),
        command_request_id: "command-unit-withdraw-0002",
      },
      authority,
    })) as Record<string, unknown>;
    expect(foreign.status).toBe("masked");
  });

  it("maps mark-read dispositions and the frozen regression reason", async () => {
    const ok = deps({
      result: {
        status: "ok",
        disposition: "executed",
        business_outcome: "applied",
        execution_ref: {
          schema_version: 1,
          namespace: "nurture",
          object_type: "execution",
          object_id: "execution-3",
          version: 1,
        } as never,
        output_refs: [],
        handoff_request_snapshots: [],
        committed_result: { schema_version: 1, disposition: "advanced" },
      },
    });
    const binding = createTeacherCommunicationOwnerService(ok);
    const authority = await authorityFor(binding, "mark_read_exchange");
    const request = {
      ...baseRequest(),
      thread_ref: ref("family_care_thread", "thread-unit-01"),
      message_ref: ref("family_care_message", "message-unit-01"),
      command_request_id: "command-unit-markread-0001",
    };
    const response = (await binding.owner.markRead({
      request,
      authority,
    })) as Record<string, unknown>;
    expect(response).toMatchObject({
      status: "committed",
      disposition: "advanced",
      thread_ref: request.thread_ref,
    });

    const regression = createTeacherCommunicationOwnerService(
      deps({
        result: {
          status: "not_committed",
          decision: "blocked",
          reason_code: "cursor_regression",
        },
      }),
    );
    const denied = (await regression.owner.markRead({
      request: { ...request, command_request_id: "command-unit-markread-0002" },
      authority,
    })) as Record<string, unknown>;
    expect(denied).toMatchObject({
      status: "not_committed",
      reason_code: "cursor_regression",
    });
  });
});
