import { describe, expect, it } from "vitest";
import { assertPublishedTeacherClassStreamResponse } from "../../../apps/scenario-service/src/teacher-class-stream-response-validator.js";
import {
  createTeacherClassStreamService,
  type TeacherCaregiverContextV1,
  type TeacherChildDayFactsV1,
  type TeacherClassChildFactsV1,
  type TeacherClassStreamReadPortV1,
  type TeacherClassStreamResolutionV1,
  type TeacherScheduleFactsV1,
} from "../src/teacher-class-stream-service.js";

const INTEGRITY_KEY = "w6-teacher-class-stream-integrity-key-32";
const NOW = new Date("2026-08-14T09:00:00.000Z");
const LOCAL_DATE = "2026-08-14";

const CONTEXT: TeacherCaregiverContextV1 = {
  participant_id: "participant-01",
  participant_version: 2,
  classes: [
    {
      care_group_id: "care-group-sunflower",
      care_group_label: "向日葵班",
      role: "lead_caregiver",
      role_version: 3,
      care_group_version: 4,
      institution_id: "institution-01",
      publication_policy_resolved: true,
    },
    {
      care_group_id: "care-group-maple",
      care_group_label: "枫叶班",
      role: "caregiver",
      role_version: 1,
      care_group_version: 2,
      institution_id: "institution-01",
      publication_policy_resolved: false,
    },
  ],
};

const CHILDREN: TeacherClassChildFactsV1[] = [
  {
    child_care_process_id: "process-rain",
    child_safe_label: "小雨",
    last_activity_at: "2026-08-14T08:52:00.000Z",
    attention_priorities: ["routine", "urgent"],
  },
  {
    child_care_process_id: "process-sunny",
    child_safe_label: "小晴",
    last_activity_at: null,
    attention_priorities: [],
  },
];

const CHILD_DAY: TeacherChildDayFactsV1 = {
  child_safe_label: "小雨",
  arrival: { state: "present", recorded_at: "2026-08-14T00:35:00.000Z", fact_version: 3 },
  daily_care: [
    {
      log_id: "log-01",
      kind: "meal",
      summary: "早餐完成",
      occurred_at: "2026-08-14T00:00:00.000Z",
      fact_version: 5,
    },
  ],
  family_instructions: [
    {
      item_id: "item-01",
      summary: "午睡盖薄毯",
      received_at: "2026-08-13T22:10:00.000Z",
      fact_version: 2,
    },
  ],
};

const SCHEDULE: TeacherScheduleFactsV1 = {
  status: "resolved",
  resolution: "day_override",
  version_head: 12,
  slots: [
    { source_ref: "slot-a", label: "晨间活动", starts_at: "08:30", ends_at: "09:30" },
  ],
};

const createPort = (
  overrides: Partial<TeacherClassStreamReadPortV1> = {},
): TeacherClassStreamReadPortV1 => ({
  loadCaregiverContext: async () => CONTEXT,
  listClassChildren: async () => CHILDREN,
  loadChildDay: async () => CHILD_DAY,
  loadClassSchedule: async () => SCHEDULE,
  ...overrides,
});

const createService = (overrides: Partial<TeacherClassStreamReadPortV1> = {}) =>
  createTeacherClassStreamService({
    reads: createPort(overrides),
    integrityKey: INTEGRITY_KEY,
    now: () => NOW,
  });

const baseRequest = {
  workspace_id: "workspace-01",
  my_chat_user_id: "user-teacher-01",
  host_request_id: "request-01",
  context_ref: "context:teacher:test:v1",
};

const resolveAuthority = async (
  service = createService(),
  operation:
    | "class_context_query"
    | "child_strip_query"
    | "child_day_detail_query"
    | "schedule_query" = "class_context_query",
  classRef?: string,
): Promise<TeacherClassStreamResolutionV1> => {
  const decision = await service.authorityResolver.resolve({
    ...baseRequest,
    operation,
    ...(classRef ? { class_ref: classRef } : {}),
  });
  if (decision.status !== "resolved") throw new Error("expected resolved authority");
  return decision.owner_resolution;
};

const classRefOf = async (careGroupLabelPrefixLength = 1): Promise<string> => {
  // Recover the deterministic class_ref for the first ordered class through
  // the public surface: the class-context response lists it.
  const service = createService();
  const authority = await resolveAuthority(service);
  const response = (await service.owner.classContext({
    request: { ...baseRequest, local_date: LOCAL_DATE },
    authority,
  })) as { classes: Array<{ class_ref: string; current: boolean }> };
  expect(careGroupLabelPrefixLength).toBeGreaterThan(0);
  return response.classes.find((entry) => entry.current)!.class_ref;
};

describe("teacher class-stream owner service", () => {
  it("resolves participant scope for class context and class scope for class reads", async () => {
    const service = createService();
    const participant = await resolveAuthority(service, "class_context_query");
    expect(participant.scope_kind).toBe("participant");
    expect(participant.presentation_role).toBe("lead_caregiver");
    expect(participant.scope_version).toBe(4);

    const ref = await classRefOf();
    const classScope = await resolveAuthority(service, "child_strip_query", ref);
    expect(classScope.scope_kind).toBe("care_group");
    expect(classScope.scope_ref).toBe(ref);
  });

  it("closes with a purging mask when authority or a class ref does not resolve", async () => {
    const service = createService({ loadCaregiverContext: async () => null });
    const decision = await service.authorityResolver.resolve({
      ...baseRequest,
      operation: "class_context_query",
    });
    expect(decision.status).toBe("closed");
    if (decision.status === "closed") {
      expect(decision.response).toMatchObject({
        status: "masked",
        mask_signal: { reason_code: "access_changed", purge_partition: true },
      });
    }

    const foreign = await createService().authorityResolver.resolve({
      ...baseRequest,
      operation: "schedule_query",
      class_ref: "1.ffffffffffffffffffffffffffffffff",
    });
    expect(foreign.status).toBe("closed");
  });

  it("serves a published class-context response with exactly one current class", async () => {
    const service = createService();
    const authority = await resolveAuthority(service);
    const response = await service.owner.classContext({
      request: { ...baseRequest, local_date: LOCAL_DATE },
      authority,
    });
    assertPublishedTeacherClassStreamResponse("class_context_query", response);
    const body = response as {
      classes: Array<{ class_label: string; current: boolean }>;
      day_header: { class_label: string; effective_schedule: string; publication_window: string };
      cache_partition: { query_key: string };
      owner_resolution: TeacherClassStreamResolutionV1;
    };
    expect(body.owner_resolution).toEqual(authority);
    expect(body.classes.map((entry) => entry.class_label)).toEqual([
      "枫叶班",
      "向日葵班",
    ]);
    expect(body.day_header.class_label).toBe("枫叶班");
    expect(body.day_header.effective_schedule).toBe("available");
    expect(body.day_header.publication_window).toBe("unresolved");
    expect(body.cache_partition.query_key).toBe(LOCAL_DATE);
  });

  it("honors an explicit selected_class_ref and masks a stale one", async () => {
    const service = createService();
    const authority = await resolveAuthority(service);
    const listed = (await service.owner.classContext({
      request: { ...baseRequest, local_date: LOCAL_DATE },
      authority,
    })) as { classes: Array<{ class_ref: string; class_label: string; current: boolean }> };
    const sunflower = listed.classes.find((entry) => !entry.current)!;
    const reselected = (await service.owner.classContext({
      request: {
        ...baseRequest,
        local_date: LOCAL_DATE,
        selected_class_ref: sunflower.class_ref,
      },
      authority,
    })) as { classes: Array<{ class_ref: string; current: boolean }>; day_header: { class_ref: string } };
    expect(
      reselected.classes.find((entry) => entry.current)?.class_ref,
    ).toBe(sunflower.class_ref);
    expect(reselected.day_header.class_ref).toBe(sunflower.class_ref);

    const stale = await service.owner.classContext({
      request: {
        ...baseRequest,
        local_date: LOCAL_DATE,
        selected_class_ref: "1.00000000000000000000000000000000",
      },
      authority,
    });
    expect(stale).toMatchObject({ status: "masked" });
  });

  it("aggregates the child strip with count-consistent text alternatives", async () => {
    const service = createService();
    const ref = await classRefOf();
    const authority = await resolveAuthority(service, "child_strip_query", ref);
    const response = await service.owner.childStrip({
      request: { ...baseRequest, class_ref: ref, local_date: LOCAL_DATE },
      authority,
    });
    assertPublishedTeacherClassStreamResponse("child_strip_query", response);
    const body = response as {
      children: Array<{
        child_safe_label: string;
        attention: { count: number; highest_priority: string; text_alternative: string };
        last_activity_at?: string;
      }>;
      cache_partition: { query_key: string };
    };
    expect(body.cache_partition.query_key).toBe(`${ref}|${LOCAL_DATE}`);
    const rain = body.children.find((child) => child.child_safe_label === "小雨")!;
    expect(rain.attention).toEqual({
      count: 2,
      highest_priority: "urgent",
      text_alternative: "2 项待关注，最高级别为紧急",
    });
    const sunny = body.children.find((child) => child.child_safe_label === "小晴")!;
    expect(sunny.attention.highest_priority).toBe("none");
    expect(sunny.last_activity_at).toBeUndefined();
  });

  it("serves the five ordered detail sections with honest reserved sections", async () => {
    const service = createService();
    const ref = await classRefOf();
    const strip = (await service.owner.childStrip({
      request: { ...baseRequest, class_ref: ref, local_date: LOCAL_DATE },
      authority: await resolveAuthority(service, "child_strip_query", ref),
    })) as { children: Array<{ child_ref: string; child_safe_label: string }> };
    const childRef = strip.children.find((child) => child.child_safe_label === "小雨")!
      .child_ref;
    const authority = await resolveAuthority(service, "child_day_detail_query", ref);
    const response = await service.owner.childDayDetail({
      request: {
        ...baseRequest,
        class_ref: ref,
        child_ref: childRef,
        local_date: LOCAL_DATE,
      },
      authority,
    });
    assertPublishedTeacherClassStreamResponse("child_day_detail_query", response);
    const body = response as {
      child_ref: string;
      sections: Array<Record<string, unknown>>;
      cache_partition: { query_key: string };
    };
    expect(body.child_ref).toBe(childRef);
    expect(body.cache_partition.query_key).toBe(`${childRef}|${LOCAL_DATE}`);
    expect(body.sections.map((section) => `${section.section_key}:${section.status}`))
      .toEqual([
        "arrival:ready",
        "daily_care:ready",
        "family_instructions:ready",
        "observations:unavailable",
        "focus_link:unavailable",
      ]);
    expect(body.sections[0]).toMatchObject({ arrival_state: "arrived" });
    expect(body.sections[1]).toMatchObject({
      supplement_action: { availability: "available" },
    });
  });

  it("maps not-expected arrival to an empty section and masks a cross-class child", async () => {
    const service = createService({
      loadChildDay: async () => ({
        ...CHILD_DAY,
        arrival: { state: "not_expected", recorded_at: NOW.toISOString(), fact_version: 1 },
        daily_care: [],
        family_instructions: [],
      }),
    });
    const ref = await classRefOf();
    const strip = (await service.owner.childStrip({
      request: { ...baseRequest, class_ref: ref, local_date: LOCAL_DATE },
      authority: await resolveAuthority(service, "child_strip_query", ref),
    })) as { children: Array<{ child_ref: string }> };
    const authority = await resolveAuthority(service, "child_day_detail_query", ref);
    const response = (await service.owner.childDayDetail({
      request: {
        ...baseRequest,
        class_ref: ref,
        child_ref: strip.children[0]!.child_ref,
        local_date: LOCAL_DATE,
      },
      authority,
    })) as { sections: Array<Record<string, unknown>> };
    expect(response.sections[0]).toEqual({
      section_key: "arrival",
      status: "empty",
      title: "到园",
    });
    expect(response.sections[1]).toMatchObject({ status: "empty" });

    const foreignChild = await service.owner.childDayDetail({
      request: {
        ...baseRequest,
        class_ref: ref,
        child_ref: "1.11111111111111111111111111111111",
        local_date: LOCAL_DATE,
      },
      authority,
    });
    expect(foreignChild).toMatchObject({ status: "masked" });
  });

  it("serves the schedule, reports an owner-confirmed absence and closes malformed payloads", async () => {
    const service = createService();
    const ref = await classRefOf();
    const authority = await resolveAuthority(service, "schedule_query", ref);
    const response = await service.owner.schedule({
      request: { ...baseRequest, class_ref: ref, local_date: LOCAL_DATE },
      authority,
    });
    assertPublishedTeacherClassStreamResponse("schedule_query", response);
    expect(response).toMatchObject({
      resolution: "day_override",
      schedule_version_head: 12,
      slots: [{ label: "晨间活动", current: false }],
    });

    const noneService = createService({
      loadClassSchedule: async () => ({
        status: "resolved",
        resolution: "none",
        version_head: 0,
        slots: [],
      }),
    });
    const noneResponse = await noneService.owner.schedule({
      request: { ...baseRequest, class_ref: ref, local_date: LOCAL_DATE },
      authority: await resolveAuthority(noneService, "schedule_query", ref),
    });
    assertPublishedTeacherClassStreamResponse("schedule_query", noneResponse);
    expect(noneResponse).toMatchObject({ resolution: "none", schedule_version_head: 0 });

    const malformedService = createService({
      loadClassSchedule: async () => ({ status: "malformed" }),
    });
    const malformed = await malformedService.owner.schedule({
      request: { ...baseRequest, class_ref: ref, local_date: LOCAL_DATE },
      authority: await resolveAuthority(malformedService, "schedule_query", ref),
    });
    expect(malformed).toMatchObject({
      status: "unavailable",
      reason_code: "content_unavailable",
      retryable: false,
    });
  });

  it("fails closed to a temporarily unavailable read error", async () => {
    const service = createService({
      loadCaregiverContext: async () => {
        throw new Error("database offline");
      },
    });
    const decision = await service.authorityResolver.resolve({
      ...baseRequest,
      operation: "class_context_query",
    });
    expect(decision.status).toBe("closed");
    if (decision.status === "closed") {
      expect(decision.response).toMatchObject({
        status: "unavailable",
        reason_code: "temporarily_unavailable",
        retryable: true,
      });
    }
  });
});
