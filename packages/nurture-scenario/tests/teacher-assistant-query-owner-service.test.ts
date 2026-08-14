import { describe, expect, it } from "vitest";
import type {
  NurtureCommandInput,
  NurtureCommandResult,
  NurtureCommandTransaction,
} from "../src/domain/commands/command-kernel.js";
import type {
  NurtureTeacherAssistantTransaction,
  NurtureWeeklyDraftFacts,
} from "../src/domain/institution/teacher-assistant-transaction.js";
import { issueBoardOpaqueRef } from "../src/harness/board-projection.js";
import { PROTECTED_CONTENT_ALG_VERSION } from "../src/harness/protected-content.js";
import {
  createTeacherAssistantQueryOwnerService,
  teacherAssistantWeekOf,
  type TeacherAssistantQueryOwnerServiceDependenciesV1,
} from "../src/teacher-assistant-query-owner-service.js";

const INTEGRITY_KEY = "teacher-assistant-query-unit-key-0001";
const NOW = new Date("2026-08-14T09:00:00.000Z");
const WORKSPACE = "workspace-unit-01";
const USER = "user-unit-01";
const PARTICIPANT = "participant-unit-01";
const CARE_GROUP = "care-group-unit-01";
const CHILD_A = "child-process-unit-01";
const CHILD_B = "child-process-unit-02";
const PROCESS_ID = "publish-process-unit-01";

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
  local_date: "2026-08-12",
});

const zeroCounts = {
  meal: 0,
  nap: 0,
  mood: 0,
  activity: 0,
  health_observation: 0,
};

const WEEKLY_FACTS = [
  {
    child_care_process_id: CHILD_A,
    care_counts: { meal: 5, nap: 5, mood: 3, activity: 4, health_observation: 1 },
    confirmed_media_count: 2,
  },
  {
    child_care_process_id: CHILD_B,
    care_counts: { meal: 5, nap: 4, mood: 2, activity: 3, health_observation: 0 },
    confirmed_media_count: 1,
  },
];

const DRAFT_FACTS: NurtureWeeklyDraftFacts = {
  authorizing_role_assignment_id: "role-unit-01",
  safety_policy: { policy_ref: "policy:safety:unit", policy_head: 3 },
  targets: [
    {
      child_care_process_id: CHILD_A,
      enrollment_id: "enrollment-unit-01",
      family_id: "family-unit-01",
      grant_id: "grant-unit-01",
    },
  ],
};

type RunnerExecute = TeacherAssistantQueryOwnerServiceDependenciesV1["commands"]["execute"];

// A kernel stand-in that runs the real spec against a fake transaction:
// precondition short-circuits and the apply path both stay honest.
const specExecutor = (transaction: Partial<NurtureCommandTransaction>) => {
  const calls: Array<NurtureCommandInput<unknown>> = [];
  const run = async (
    input: NurtureCommandInput<unknown>,
  ): Promise<NurtureCommandResult> => {
    calls.push(input);
    const full = transaction as NurtureCommandTransaction;
    const contextRecord = {
      workspace_id: input.workspace_id,
      business_actor_ref: input.business_actor_ref,
      command_request_id: input.command_request_id,
    };
    const decision = await input.spec.checkPreconditions(
      full,
      input.payload as never,
      contextRecord,
    );
    if (decision.status === "already_satisfied") {
      return {
        status: "ok",
        disposition: "executed",
        business_outcome: "already_satisfied",
        execution_ref: {
          schema_version: 1,
          namespace: "nurture",
          object_type: "command_execution",
          object_id: "execution-unit",
          version: 1,
        },
        output_refs: decision.output_refs,
        handoff_request_snapshots: [],
        committed_result: decision.committed_result,
      };
    }
    if (decision.status !== "ready") {
      return {
        status: "not_committed",
        decision: decision.status,
        reason_code: decision.reason_code,
      };
    }
    const effect = await input.spec.apply(
      full,
      input.payload as never,
      contextRecord,
    );
    return {
      status: "ok",
      disposition: "executed",
      business_outcome: "applied",
      execution_ref: {
        schema_version: 1,
        namespace: "nurture",
        object_type: "command_execution",
        object_id: "execution-unit",
        version: 1,
      },
      output_refs: effect.output_refs,
      handoff_request_snapshots: [],
      committed_result: effect.committed_result,
    };
  };
  return { execute: run as RunnerExecute, calls };
};

const deps = (
  overrides: Partial<TeacherAssistantQueryOwnerServiceDependenciesV1> & {
    weeklyFacts?: typeof WEEKLY_FACTS;
    recordedKinds?: ReadonlyArray<{
      child_care_process_id: string;
      kinds: readonly ("meal" | "nap" | "mood" | "activity" | "health_observation")[];
    }>;
    existingDraftId?: string | null;
  } = {},
): TeacherAssistantQueryOwnerServiceDependenciesV1 => ({
  contextReads: { loadCaregiverContext: async () => context() },
  assistantReads: {
    listClassChildren: async () => [
      { child_care_process_id: CHILD_A, display_label: "小明" },
      { child_care_process_id: CHILD_B, display_label: "小红" },
    ],
    listRecordedDayKinds: async () =>
      overrides.recordedKinds
      ?? [
        { child_care_process_id: CHILD_A, kinds: ["meal", "nap"] },
        {
          child_care_process_id: CHILD_B,
          kinds: ["meal", "nap", "mood", "activity", "health_observation"],
        },
      ],
    loadWeeklyCareFacts: async () => overrides.weeklyFacts ?? WEEKLY_FACTS,
    findWeeklyDraftProcessId: async () =>
      overrides.existingDraftId === undefined ? null : overrides.existingDraftId,
  },
  supplementEligibility: {
    resolveCaregiverDailyCareEligibility: async () => ({
      participant_active: true,
      children: [
        {
          child_care_process_id: CHILD_A,
          display_label: "小明",
          care_group_version: 4,
          caregiver_role_version: 3,
          enrollment_version: 5,
        },
      ],
    }),
  },
  protectedContent: {
    seal: (plaintext) => ({
      algVersion: PROTECTED_CONTENT_ALG_VERSION,
      keyRef: "unit-key",
      ciphertext: Buffer.from(plaintext, "utf8").toString("base64url"),
      integrityTag: "unit-tag",
    }),
    unseal: (envelope) =>
      Buffer.from(envelope.ciphertext, "base64url").toString("utf8"),
  },
  commands: {
    execute: async () => ({
      status: "not_committed",
      decision: "technical_error",
      reason_code: "unexpected",
    }),
  },
  integrityKey: INTEGRITY_KEY,
  now: () => NOW,
  ...overrides,
});

const authorityFor = async (
  binding: ReturnType<typeof createTeacherAssistantQueryOwnerService>,
  operation: "missing_records_query" | "weekly_source_query" | "weekly_draft_exchange",
) => {
  const decision = await binding.authorityResolver.resolve({
    ...baseRequest(),
    operation,
  });
  expect(decision.status).toBe("resolved");
  return (decision as unknown as { owner_resolution: never }).owner_resolution;
};

describe("W10 teacher assistant-query owner service", () => {
  it("computes Monday-Sunday windows from any weekday", () => {
    expect(teacherAssistantWeekOf("2026-08-12")).toEqual({
      week_start: "2026-08-10",
      week_end: "2026-08-16",
    });
    expect(teacherAssistantWeekOf("2026-08-10")).toEqual({
      week_start: "2026-08-10",
      week_end: "2026-08-16",
    });
    expect(teacherAssistantWeekOf("2026-08-16")).toEqual({
      week_start: "2026-08-10",
      week_end: "2026-08-16",
    });
  });

  it("answers the missing-record partition with typed non-executable handoffs", async () => {
    const binding = createTeacherAssistantQueryOwnerService(deps());
    const response = (await binding.owner.missingRecords({
      request: baseRequest(),
      authority: await authorityFor(binding, "missing_records_query"),
    })) as Record<string, unknown>;
    expect(response.status).toBe("ready");
    expect(response.local_date).toBe("2026-08-12");
    expect(response.missing_count).toBe(3);
    const children = response.children as Array<Record<string, unknown>>;
    const [first, second] = children;
    expect(first).toMatchObject({
      child_safe_label: "小明",
      present_kinds: ["meal", "nap"],
      missing_kinds: ["mood", "activity", "health_observation"],
    });
    expect(first?.handoff).toMatchObject({
      interface_key: "nurture.teacher-organization-owner",
      interface_version: "1.0.0",
      operation: "supplement_exchange",
      child_ref: first?.child_ref,
      availability: "available",
    });
    expect(second?.missing_kinds).toEqual([]);
    expect(second && "handoff" in second).toBe(false);
    expect(JSON.stringify(response)).not.toContain("action_ref");
    const cache = response.cache_partition as Record<string, unknown>;
    expect(cache.query_key).toBe(`${baseRequest().class_ref}|2026-08-12`);
  });

  it("marks the handoff unavailable when the supplement target is not eligible", async () => {
    const binding = createTeacherAssistantQueryOwnerService(
      deps({
        recordedKinds: [
          { child_care_process_id: CHILD_B, kinds: ["meal"] },
        ],
      }),
    );
    const response = (await binding.owner.missingRecords({
      request: baseRequest(),
      authority: await authorityFor(binding, "missing_records_query"),
    })) as Record<string, unknown>;
    const children = response.children as Array<Record<string, unknown>>;
    const childB = children.find((child) => child.child_safe_label === "小红");
    expect((childB?.handoff as Record<string, unknown>)?.availability).toBe(
      "unavailable",
    );
  });

  it("answers the owner-computed week with totals and the existing draft ref", async () => {
    const binding = createTeacherAssistantQueryOwnerService(
      deps({ existingDraftId: PROCESS_ID }),
    );
    const response = (await binding.owner.weeklySource({
      request: baseRequest(),
      authority: await authorityFor(binding, "weekly_source_query"),
    })) as Record<string, unknown>;
    expect(response.status).toBe("ready");
    expect(response.week_start).toBe("2026-08-10");
    expect(response.week_end).toBe("2026-08-16");
    expect(response.class_total_records).toBe(32);
    expect(response.class_total_confirmed_media).toBe(3);
    expect(response.draft_process_ref).toBe(ref("publish_process", PROCESS_ID));
    const cache = response.cache_partition as Record<string, unknown>;
    expect(cache.query_key).toBe(`${baseRequest().class_ref}|2026-08-10`);
  });

  it("creates the weekly draft through the real spec over the owner transaction", async () => {
    let applied:
      | Parameters<NurtureTeacherAssistantTransaction["applyWeeklyDraftProcess"]>[0]
      | undefined;
    const teacherAssistant: NurtureTeacherAssistantTransaction = {
      loadWeeklyDraftFacts: async () => DRAFT_FACTS,
      applyWeeklyDraftProcess: async (input) => {
        applied = input;
        return { process_id: PROCESS_ID, process_version: 0 };
      },
    };
    const runner = specExecutor({ teacherAssistant });
    const binding = createTeacherAssistantQueryOwnerService(
      deps({ commands: { execute: runner.execute } }),
    );
    const response = (await binding.owner.weeklyDraft({
      request: { ...baseRequest(), command_request_id: "command-unit-0001" },
      authority: await authorityFor(binding, "weekly_draft_exchange"),
    })) as Record<string, unknown>;
    expect(response).toMatchObject({
      status: "committed",
      executed: "executed",
      disposition: "created",
      process_ref: ref("publish_process", PROCESS_ID),
      week_start: "2026-08-10",
      state: "draft",
    });
    const commandInput = runner.calls[0];
    expect(commandInput?.payload).toMatchObject({
      care_group_id: CARE_GROUP,
      week_start: "2026-08-10",
    });
    expect(
      (commandInput?.payload as Record<string, unknown>)?.actor_binding_ref,
    ).toMatch(/^[0-9a-f]{64}$/);
    expect(applied).toMatchObject({
      process_key: `weekly:${CARE_GROUP}:2026-08-10`,
      state: "draft",
      week_start: "2026-08-10",
      week_end: "2026-08-16",
      authorizing_role_assignment_id: "role-unit-01",
    });
    expect(applied?.content_digest).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(applied?.targets).toEqual([
      {
        child_care_process_id: CHILD_A,
        enrollment_id: "enrollment-unit-01",
        family_id: "family-unit-01",
        grant_id: "grant-unit-01",
        target_key: `${CHILD_A}~enrollment-unit-01~grant-unit-01`,
      },
    ]);
    const title = applied?.title_envelope as { ciphertext: string };
    expect(Buffer.from(title.ciphertext, "base64url").toString("utf8")).toBe(
      "每周成长小结 2026-08-10",
    );
    const body = applied?.body_envelope as { ciphertext: string };
    const document = JSON.parse(
      Buffer.from(body.ciphertext, "base64url").toString("utf8"),
    ) as Record<string, unknown>;
    expect(document).toMatchObject({
      kind: "weekly_care_summary_facts",
      week_start: "2026-08-10",
      week_end: "2026-08-16",
    });
    expect(JSON.stringify(document)).not.toContain(CHILD_A);
  });

  it("answers already_satisfied with the existing process for a duplicate week", async () => {
    const teacherAssistant: NurtureTeacherAssistantTransaction = {
      loadWeeklyDraftFacts: async () => ({
        ...DRAFT_FACTS,
        existing: { process_id: PROCESS_ID, state: "needs_review" },
      }),
      applyWeeklyDraftProcess: async () => {
        throw new Error("must not create a second weekly draft");
      },
    };
    const binding = createTeacherAssistantQueryOwnerService(
      deps({ commands: { execute: specExecutor({ teacherAssistant }).execute } }),
    );
    const response = (await binding.owner.weeklyDraft({
      request: { ...baseRequest(), command_request_id: "command-unit-0002" },
      authority: await authorityFor(binding, "weekly_draft_exchange"),
    })) as Record<string, unknown>;
    expect(response).toMatchObject({
      status: "committed",
      disposition: "already_satisfied",
      process_ref: ref("publish_process", PROCESS_ID),
      state: "needs_review",
    });
  });

  it("refuses an empty week honestly but still runs the command when a draft exists", async () => {
    const emptyWeek = WEEKLY_FACTS.map((entry) => ({
      ...entry,
      care_counts: { ...zeroCounts },
      confirmed_media_count: 0,
    }));
    let ledgerRuns = 0;
    const execute = (async () => {
      ledgerRuns += 1;
      throw new Error("ledger must not run for an empty new week");
    }) as unknown as RunnerExecute;
    const binding = createTeacherAssistantQueryOwnerService(
      deps({ weeklyFacts: emptyWeek, commands: { execute } }),
    );
    const refusal = (await binding.owner.weeklyDraft({
      request: { ...baseRequest(), command_request_id: "command-unit-0003" },
      authority: await authorityFor(binding, "weekly_draft_exchange"),
    })) as Record<string, unknown>;
    expect(refusal).toMatchObject({
      status: "not_committed",
      reason_code: "no_weekly_facts",
    });
    expect(ledgerRuns).toBe(0);

    // The W7 lesson: an existing (class, week) draft means the command must
    // run so the ledger or the domain answers it — never the empty-week veto.
    const teacherAssistant: NurtureTeacherAssistantTransaction = {
      loadWeeklyDraftFacts: async () => ({
        ...DRAFT_FACTS,
        existing: { process_id: PROCESS_ID, state: "draft" },
      }),
      applyWeeklyDraftProcess: async () => {
        throw new Error("unreachable");
      },
    };
    const replayBinding = createTeacherAssistantQueryOwnerService(
      deps({
        weeklyFacts: emptyWeek,
        existingDraftId: PROCESS_ID,
        commands: { execute: specExecutor({ teacherAssistant }).execute },
      }),
    );
    const satisfied = (await replayBinding.owner.weeklyDraft({
      request: { ...baseRequest(), command_request_id: "command-unit-0003" },
      authority: await authorityFor(replayBinding, "weekly_draft_exchange"),
    })) as Record<string, unknown>;
    expect(satisfied).toMatchObject({
      status: "committed",
      disposition: "already_satisfied",
    });
  });

  it("refuses classes and weeks the schema cannot represent", async () => {
    const bigClass = Array.from({ length: 81 }, (_, index) => ({
      child_care_process_id: `child-process-big-${index}`,
      display_label: `孩子${index}`,
    }));
    const oversize = createTeacherAssistantQueryOwnerService(
      deps({
        assistantReads: {
          ...deps().assistantReads,
          listClassChildren: async () => bigClass,
        },
      }),
    );
    const missing = (await oversize.owner.missingRecords({
      request: baseRequest(),
      authority: await authorityFor(oversize, "missing_records_query"),
    })) as Record<string, unknown>;
    expect(missing).toMatchObject({
      status: "unavailable",
      reason_code: "content_unavailable",
      retryable: false,
    });
    const weekly = (await oversize.owner.weeklySource({
      request: baseRequest(),
      authority: await authorityFor(oversize, "weekly_source_query"),
    })) as Record<string, unknown>;
    expect(weekly).toMatchObject({ status: "unavailable" });

    // An unrepresentable class with NO existing draft refuses the draft
    // too — but an existing (class, week) draft still answers through the
    // domain (the W7 replay lesson).
    const draftRefusal = (await oversize.owner.weeklyDraft({
      request: { ...baseRequest(), command_request_id: "command-unit-0010" },
      authority: await authorityFor(oversize, "weekly_draft_exchange"),
    })) as Record<string, unknown>;
    expect(draftRefusal).toMatchObject({ status: "unavailable" });
    const teacherAssistant: NurtureTeacherAssistantTransaction = {
      loadWeeklyDraftFacts: async () => ({
        ...DRAFT_FACTS,
        existing: { process_id: PROCESS_ID, state: "draft" },
      }),
      applyWeeklyDraftProcess: async () => {
        throw new Error("unreachable");
      },
    };
    const oversizeWithDraft = createTeacherAssistantQueryOwnerService(
      deps({
        assistantReads: {
          ...deps().assistantReads,
          listClassChildren: async () => bigClass,
          findWeeklyDraftProcessId: async () => PROCESS_ID,
        },
        commands: { execute: specExecutor({ teacherAssistant }).execute },
      }),
    );
    const satisfied = (await oversizeWithDraft.owner.weeklyDraft({
      request: { ...baseRequest(), command_request_id: "command-unit-0010" },
      authority: await authorityFor(oversizeWithDraft, "weekly_draft_exchange"),
    })) as Record<string, unknown>;
    expect(satisfied).toMatchObject({
      status: "committed",
      disposition: "already_satisfied",
    });

    const overflowFacts = [CHILD_A, CHILD_B, "child-process-unit-03"].map(
      (id) => ({
        child_care_process_id: id,
        care_counts: {
          meal: 999,
          nap: 999,
          mood: 999,
          activity: 999,
          health_observation: 999,
        },
        confirmed_media_count: 999,
      }),
    );
    const overflow = createTeacherAssistantQueryOwnerService(
      deps({
        assistantReads: {
          ...deps().assistantReads,
          listClassChildren: async () => [
            { child_care_process_id: CHILD_A, display_label: "小明" },
            { child_care_process_id: CHILD_B, display_label: "小红" },
            { child_care_process_id: "child-process-unit-03", display_label: "小刚" },
          ],
          loadWeeklyCareFacts: async () => overflowFacts,
        },
      }),
    );
    const overflowWeekly = (await overflow.owner.weeklySource({
      request: baseRequest(),
      authority: await authorityFor(overflow, "weekly_source_query"),
    })) as Record<string, unknown>;
    expect(overflowWeekly).toMatchObject({
      status: "unavailable",
      reason_code: "content_unavailable",
    });
  });

  it("dedupes duplicated child identities from the read port", async () => {
    const binding = createTeacherAssistantQueryOwnerService(
      deps({
        assistantReads: {
          ...deps().assistantReads,
          listClassChildren: async () => [
            { child_care_process_id: CHILD_A, display_label: "小明" },
            { child_care_process_id: CHILD_A, display_label: "小明" },
            { child_care_process_id: CHILD_B, display_label: "小红" },
          ],
        },
      }),
    );
    const response = (await binding.owner.missingRecords({
      request: baseRequest(),
      authority: await authorityFor(binding, "missing_records_query"),
    })) as Record<string, unknown>;
    const children = response.children as Array<Record<string, unknown>>;
    expect(children).toHaveLength(2);
    expect(new Set(children.map((child) => child.child_ref)).size).toBe(2);
  });

  it("maps ledger refusals to the frozen reason codes", async () => {
    const request = { ...baseRequest(), command_request_id: "command-unit-0004" };
    const resultOf = async (result: NurtureCommandResult) => {
      const binding = createTeacherAssistantQueryOwnerService(
        deps({ commands: { execute: async () => result } }),
      );
      return (await binding.owner.weeklyDraft({
        request,
        authority: await authorityFor(binding, "weekly_draft_exchange"),
      })) as Record<string, unknown>;
    };
    expect(
      await resultOf({
        status: "not_committed",
        decision: "idempotency_conflict",
        reason_code: "command_request_payload_mismatch",
      }),
    ).toMatchObject({ status: "not_committed", reason_code: "command_payload_conflict" });
    expect(
      await resultOf({
        status: "not_committed",
        decision: "blocked",
        reason_code: "no_eligible_target",
      }),
    ).toMatchObject({ status: "not_committed", reason_code: "no_eligible_target" });
    expect(
      await resultOf({
        status: "not_committed",
        decision: "blocked",
        reason_code: "safety_route_unavailable",
      }),
    ).toMatchObject({
      status: "not_committed",
      reason_code: "safety_route_unavailable",
    });
    expect(
      await resultOf({
        status: "not_committed",
        decision: "blocked",
        reason_code: "not_authorized",
      }),
    ).toMatchObject({ status: "masked" });
    expect(
      await resultOf({
        status: "not_committed",
        decision: "conflict",
        reason_code: "command_write_conflict",
      }),
    ).toMatchObject({
      status: "unavailable",
      reason_code: "temporarily_unavailable",
      retryable: true,
    });
    expect(
      await resultOf({ status: "outcome_unknown", reason_code: "commit_ambiguous" }),
    ).toMatchObject({
      status: "outcome_unknown",
      recovery: "reconcile_same_command",
      command_request_id: request.command_request_id,
    });
  });

  it("masks foreign classes and reports resolver outages honestly", async () => {
    const binding = createTeacherAssistantQueryOwnerService(deps());
    const foreign = await binding.authorityResolver.resolve({
      ...baseRequest(),
      class_ref: ref("care_group", "care-group-foreign"),
      operation: "missing_records_query",
    });
    expect(foreign.status).toBe("closed");
    expect((foreign as { response: Record<string, unknown> }).response).toMatchObject({
      status: "masked",
    });

    const failing = createTeacherAssistantQueryOwnerService(
      deps({
        contextReads: {
          loadCaregiverContext: async () => {
            throw new Error("read model down");
          },
        },
      }),
    );
    const outage = await failing.authorityResolver.resolve({
      ...baseRequest(),
      operation: "weekly_source_query",
    });
    expect(outage.status).toBe("closed");
    expect((outage as { response: Record<string, unknown> }).response).toMatchObject({
      status: "unavailable",
      reason_code: "temporarily_unavailable",
      retryable: true,
    });
  });
});
