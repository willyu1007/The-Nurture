import { describe, expect, it, vi } from "vitest";
import type {
  NurtureCommandResult,
} from "../src/domain/commands/command-kernel.js";
import { issueBoardOpaqueRef } from "../src/harness/board-projection.js";
import {
  createTeacherOrganizationOwnerService,
  type TeacherOrganizationBatchFactsV1,
  type TeacherOrganizationLaneRowV1,
  type TeacherOrganizationOwnerServiceDependenciesV1,
} from "../src/teacher-organization-owner-service.js";

const INTEGRITY_KEY = "teacher-organization-owner-unit-key-0001";
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

const policy = () => ({
  policy_ref: "policy-unit-01",
  policy_head: 2,
  time_zone: "Asia/Shanghai",
  default_release_local_time: "17:30",
  organize_idle_seconds: 300,
  organize_fallback_lead_seconds: 1200,
  automatic_quiescence_seconds: 60,
  capture_activity_lease_seconds: 120,
  automatic_organize_enabled: true,
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
} as unknown as TeacherOrganizationOwnerServiceDependenciesV1["protectedContent"];

const deps = (
  overrides: Partial<TeacherOrganizationOwnerServiceDependenciesV1> & {
    batch?: TeacherOrganizationBatchFactsV1 | null;
    lane?: readonly TeacherOrganizationLaneRowV1[];
    result?: NurtureCommandResult;
  } = {},
): TeacherOrganizationOwnerServiceDependenciesV1 & {
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
    contextReads: {
      loadCaregiverContext: async () => context(),
    },
    batchReads: {
      loadCurrentBatch: async () => overrides.batch ?? null,
      listLaneProcesses: async () => overrides.lane ?? [],
    },
    captureReads: {
      loadOrganizeSource: async () => null,
      listOrganizeCareGroups: async () => [],
    },
    admissionPreview: {
      loadPublishQueueAdmissionFacts: async () => null,
    },
    supplementEligibility: {
      resolveCaregiverDailyCareEligibility: async () => ({
        participant_active: true,
        children: [
          {
            child_care_process_id: "child-process-unit-01",
            display_label: "小明",
            care_group_version: 4,
            caregiver_role_version: 3,
            enrollment_version: 5,
          },
        ],
      }),
    },
    directMessageEligibility: {
      resolveCaregiverDirectMessageEligibility: async () => ({
        participant_active: false,
        target_set_complete: true,
        targets: [],
      }),
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

describe("teacher organization owner service", () => {
  it("masks foreign class refs and reports resolver read failures as retryable", async () => {
    const binding = createTeacherOrganizationOwnerService(deps());
    const foreign = await binding.authorityResolver.resolve({
      ...baseRequest(),
      class_ref: ref("care_group", "care-group-foreign"),
      operation: "feed_query",
    });
    expect(foreign.status).toBe("closed");
    expect((foreign as { response: { status: string } }).response.status).toBe("masked");

    const failing = createTeacherOrganizationOwnerService(
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
      operation: "organization_query",
    });
    expect(unavailable.status).toBe("closed");
    expect(
      (unavailable as { response: { status: string; retryable: boolean } }).response,
    ).toMatchObject({ status: "unavailable", retryable: true });
  });

  it("serves the feed with bounded excerpts only for stable text kinds", async () => {
    const binding = createTeacherOrganizationOwnerService(
      deps({
        batch: {
          batch_id: "batch-unit-01",
          state: "collecting",
          watermark_sequence: 0,
          captures: [
            {
              capture_id: "capture-text",
              kind: "text",
              occurred_at: "2026-08-14T08:00:00.000Z",
              stable: true,
              has_media: false,
              body_envelope: seal(`${"长".repeat(200)}`),
            },
            {
              capture_id: "capture-media",
              kind: "media",
              occurred_at: "2026-08-14T08:05:00.000Z",
              stable: true,
              has_media: true,
              body_envelope: seal("media caption"),
            },
            {
              capture_id: "capture-processing",
              kind: "voice_transcript",
              occurred_at: "2026-08-14T08:06:00.000Z",
              stable: false,
              has_media: false,
              body_envelope: seal("尚在转写"),
            },
          ],
        },
      }),
    );
    const resolved = await binding.authorityResolver.resolve({
      ...baseRequest(),
      operation: "feed_query",
    });
    expect(resolved.status).toBe("resolved");
    const authority = (resolved as unknown as { owner_resolution: never }).owner_resolution;
    const response = (await binding.owner.feed({
      request: baseRequest(),
      authority,
    })) as Record<string, never>;
    expect(response.status).toBe("ready");
    const captures = response.captures as Array<Record<string, unknown>>;
    expect(captures).toHaveLength(3);
    expect((captures[0]?.text_excerpt as string).length).toBe(120);
    expect(captures[1]?.text_excerpt).toBeUndefined();
    expect(captures[2]?.text_excerpt).toBeUndefined();
    const cache = response.cache_partition as Record<string, unknown>;
    expect(cache.query_key).toBe(baseRequest().class_ref);
    expect(cache.operation).toBe("feed_query");
  });

  it("answers nothing_to_organize without touching the ledger when no cut is possible", async () => {
    const dependencies = deps({
      captureReads: {
        loadOrganizeSource: async () => ({
          batch_id: "batch-unit-02",
          batch_version: 3,
          state: "collecting" as const,
          organize_policy: policy(),
          captures: [],
          activity: { last_user_activity_at: "2026-08-14T08:00:00.000Z" },
        }),
        listOrganizeCareGroups: async () => [],
      },
    });
    const binding = createTeacherOrganizationOwnerService(dependencies);
    const response = (await binding.owner.organize({
      request: {
        ...baseRequest(),
        command_request_id: "command-unit-organize",
        trigger: "manual",
      },
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(response).toMatchObject({
      status: "committed",
      executed: "executed",
      outcome: "nothing_to_organize",
      batch_ref: ref("care_capture_batch", "batch-unit-02"),
      included_capture_count: 0,
    });
    expect(dependencies.execute).not.toHaveBeenCalled();
  });

  it("binds the actor into the organize canonical payload and maps ledger results", async () => {
    const source = {
      batch_id: "batch-unit-03",
      batch_version: 7,
      state: "collecting" as const,
      organize_policy: policy(),
      captures: [
        {
          capture_id: "capture-stable",
          kind: "text" as const,
          stable: true,
          source_sequence: 1,
          occurred_at: "2026-08-14T08:00:00.000Z",
          authority: {
            role: "lead_caregiver",
            role_scope_type: "care_group",
            role_scope_matches_source: true,
            role_assignment_current: true,
            fact_visible: true,
            purpose_allowed: true,
          } as never,
        },
      ],
      activity: { last_user_activity_at: "2026-08-14T08:00:00.000Z" },
    };
    const dependencies = deps({
      captureReads: {
        loadOrganizeSource: async () => source,
        listOrganizeCareGroups: async () => [],
      },
      result: {
        status: "ok",
        disposition: "replayed",
        business_outcome: "applied",
        execution_ref: {
          schema_version: 1,
          namespace: "nurture",
          object_type: "execution",
          object_id: "execution-1",
          version: 1,
        } as never,
        output_refs: [
          {
            schema_version: 1,
            namespace: "nurture",
            object_type: "care_capture_batch",
            object_id: "batch-unit-03",
            version: 8,
          } as never,
          {
            schema_version: 1,
            namespace: "nurture",
            object_type: "publish_process",
            object_id: "process-unit-01",
            version: 1,
          } as never,
        ],
        handoff_request_snapshots: [],
        committed_result: {
          batchRef: "sealed-batch-ref",
          outcome: "organized",
          processRef: "sealed-process-ref",
          watermarkSequence: 1,
          includedCaptureCount: 1,
          deferredCaptureCount: 0,
        },
      },
    });
    const binding = createTeacherOrganizationOwnerService(dependencies);
    const request = {
      ...baseRequest(),
      command_request_id: "command-unit-organize-2",
      trigger: "manual" as const,
    };
    const response = (await binding.owner.organize({
      request,
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(response).toMatchObject({
      status: "committed",
      executed: "replayed",
      outcome: "organized",
      process_ref: ref("publish_process", "process-unit-01"),
      watermark_sequence: 1,
    });
    const call = dependencies.execute.mock.calls[0]?.[0] as {
      business_actor_ref: string;
      payload: { care_group_id: string; expected_batch_version: number };
      spec: { canonicalize: (input: unknown) => Record<string, unknown> };
    };
    expect(call.business_actor_ref).toBe(PARTICIPANT);
    expect(call.payload.expected_batch_version).toBe(7);
    const canonical = call.spec.canonicalize(call.payload);
    expect(typeof canonical.actor_binding_ref).toBe("string");
  });

  it("maps head drift and payload divergence to the frozen organize reasons", async () => {
    const source = {
      batch_id: "batch-unit-04",
      batch_version: 2,
      state: "collecting" as const,
      organize_policy: policy(),
      captures: [
        {
          capture_id: "capture-stable",
          kind: "text" as const,
          stable: true,
          source_sequence: 1,
          occurred_at: "2026-08-14T08:00:00.000Z",
          authority: {
            role: "caregiver",
            role_scope_type: "care_group",
            role_scope_matches_source: true,
            role_assignment_current: true,
            fact_visible: true,
            purpose_allowed: true,
          } as never,
        },
      ],
      activity: { last_user_activity_at: "2026-08-14T08:00:00.000Z" },
    };
    const request = {
      ...baseRequest(),
      command_request_id: "command-unit-organize-3",
      trigger: "manual" as const,
    };
    for (const [result, reason] of [
      [
        { status: "not_committed", decision: "conflict", reason_code: "stale_confirmation" },
        "batch_head_moved",
      ],
      [
        {
          status: "not_committed",
          decision: "idempotency_conflict",
          reason_code: "command_request_payload_mismatch",
        },
        "command_payload_conflict",
      ],
    ] as const) {
      const binding = createTeacherOrganizationOwnerService(
        deps({
          captureReads: {
            loadOrganizeSource: async () => source,
            listOrganizeCareGroups: async () => [],
          },
          result: result as NurtureCommandResult,
        }),
      );
      const response = (await binding.owner.organize({
        request,
        authority: {} as never,
      })) as Record<string, unknown>;
      expect(response).toMatchObject({ status: "not_committed", reason_code: reason });
    }
  });

  it("prepares a supplement with a bound digest and masks foreign child refs", async () => {
    const binding = createTeacherOrganizationOwnerService(deps());
    const resolved = await binding.authorityResolver.resolve({
      ...baseRequest(),
      operation: "supplement_exchange",
    });
    const authority = (resolved as unknown as { owner_resolution: never }).owner_resolution;
    const request = {
      ...baseRequest(),
      child_ref: ref("child_care_process", "child-process-unit-01"),
      command_request_id: "command-unit-supplement",
      kind: "prepare" as const,
      prepare: {
        local_date: "2026-08-14",
        care_kind: "meal" as const,
        text: "午餐吃得很好",
      },
    };
    const response = (await binding.owner.supplement({
      request,
      authority,
    })) as Record<string, unknown>;
    expect(response).toMatchObject({
      status: "ready_to_confirm",
      command_request_id: "command-unit-supplement",
      confirmation_ref: "confirmation-token-unit-01",
    });
    expect(String(response.prepared_preview_digest)).toMatch(/^sha256:[a-f0-9]{64}$/);

    const foreign = (await binding.owner.supplement({
      request: {
        ...request,
        child_ref: ref("child_care_process", "child-process-foreign"),
      },
      authority,
    })) as Record<string, unknown>;
    expect(foreign.status).toBe("masked");
  });

  it("previews the lane with admission facts and keeps admission mapping frozen", async () => {
    const lane: TeacherOrganizationLaneRowV1[] = [
      {
        process_id: "process-unit-02",
        process_key: "process-key-unit-02",
        origin: "agent_organized",
        data_class: "daily_care_log",
        purpose_key: "family_daily_care_update",
        state: "draft",
        recipients_count: 2,
        safe_labels: ["小明", "小红"],
      },
    ];
    const createdAt = new Date(NOW.getTime() - 10_000).toISOString();
    const binding = createTeacherOrganizationOwnerService(
      deps({
        lane,
        admissionPreview: {
          loadPublishQueueAdmissionFacts: async () => ({
            process_state: "draft",
            process_version: 1,
            current_revision: 1,
            authorizing_role_assignment_id: "role-unit-01",
            authorizing_role_current: true,
            created_at: createdAt,
            read_at: NOW.toISOString(),
            current_hold_expires_at: null,
            current_policy: null,
            schedule: null,
          } as never),
        },
      }),
    );
    const resolved = await binding.authorityResolver.resolve({
      ...baseRequest(),
      operation: "organization_query",
    });
    const authority = (resolved as unknown as { owner_resolution: never }).owner_resolution;
    const response = (await binding.owner.organization({
      request: baseRequest(),
      authority,
    })) as Record<string, unknown>;
    expect(response.status).toBe("ready");
    const cards = response.lane as Array<Record<string, unknown>>;
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      process_ref: ref("publish_process", "process-unit-02"),
      state: "draft",
      admission_preview: { status: "waiting", reason_code: "quick_adjust_active" },
    });
    expect(typeof cards[0]?.quick_adjust_until).toBe("string");
    const batch = response.batch as Record<string, unknown>;
    expect(batch.state).toBe("none");
    expect((batch.trigger as Record<string, unknown>).availability).toBe("waiting");
  });

  it("admits through the ledger and answers the frozen admission shape", async () => {
    const lane: TeacherOrganizationLaneRowV1[] = [
      {
        process_id: "process-unit-03",
        process_key: "process-key-unit-03",
        origin: "manual",
        data_class: "care_day_note",
        purpose_key: "family_daily_care_update",
        state: "draft",
        recipients_count: 1,
        safe_labels: ["小明"],
      },
    ];
    const dependencies = deps({
      lane,
      result: {
        status: "ok",
        disposition: "executed",
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
          schema_version: 1,
          disposition: "queued",
          scheduled_at: "2026-08-14T17:30:00.000Z",
          not_after: "2026-08-14T19:30:00.000Z",
          schedule_policy_ref: "policy-unit-01",
          schedule_policy_head: 2,
        },
      },
    });
    const binding = createTeacherOrganizationOwnerService(dependencies);
    const processRef = ref("publish_process", "process-unit-03");
    const response = (await binding.owner.queueAdmission({
      request: {
        ...baseRequest(),
        process_ref: processRef,
        command_request_id: "command-unit-admission",
      },
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(response).toMatchObject({
      status: "committed",
      disposition: "queued",
      process_ref: processRef,
      scheduled_at: "2026-08-14T17:30:00.000Z",
      schedule_policy_head: 2,
    });
    const payload = dependencies.execute.mock.calls[0]?.[0]?.payload as Record<string, unknown>;
    expect(payload.process_key).toBe("process-key-unit-03");
    expect(typeof payload.actor_binding_ref).toBe("string");

    const foreign = (await binding.owner.queueAdmission({
      request: {
        ...baseRequest(),
        process_ref: ref("publish_process", "process-foreign"),
        command_request_id: "command-unit-admission-2",
      },
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(foreign.status).toBe("masked");
  });

  it("records a class note through the ledger with the text digest bound", async () => {
    const dependencies = deps({
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
        committed_result: { schema_version: 1, capture_id: "capture-note-01" },
      },
    });
    const binding = createTeacherOrganizationOwnerService(dependencies);
    const response = (await binding.owner.classNote({
      request: {
        ...baseRequest(),
        command_request_id: "command-unit-note",
        text: "今天户外活动 40 分钟",
      },
      authority: {} as never,
    })) as Record<string, unknown>;
    expect(response).toMatchObject({
      status: "committed",
      executed: "executed",
      capture_ref: ref("care_capture", "capture-note-01"),
    });
    const payload = dependencies.execute.mock.calls[0]?.[0]?.payload as Record<string, unknown>;
    expect(String(payload.text_digest)).toMatch(/^sha256:/);
    expect(typeof payload.actor_binding_ref).toBe("string");
  });
});
