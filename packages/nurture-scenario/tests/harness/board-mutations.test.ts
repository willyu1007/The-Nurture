import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  NurtureInteractionContextService,
  RECORD_CAREGIVER_DAILY_CARE_CAPABILITY,
  UPDATE_GUARDIAN_CURRENT_FOCUS_CAPABILITY,
  createRecordCaregiverDailyCareSpec,
  createUpdateGuardianCurrentFocusSpec,
  issueChildCareProcessTargetRef,
  issueFocusGoalTargetRef,
  parseRecordCaregiverDailyCareInputV1,
  parseUpdateGuardianCurrentFocusInputV1,
  prepareRecordCaregiverDailyCare,
  prepareUpdateGuardianCurrentFocus,
  type NurtureCaregiverDailyCareFacts,
  type NurtureCommandExecutionContext,
  type NurtureCommandTransaction,
  type NurtureGuardianFocusGoalFacts,
  type NurtureInteractionContextRepository,
  type RecordCaregiverDailyCareCommandV1,
  type UpdateGuardianCurrentFocusCommandV1,
} from "../../src/index.js";
import { BOARD_INTEGRITY_KEY } from "./board-fixtures.js";

const guardianScope = { workspace_id: "ws-1", participant_id: "guardian-1" };
const caregiverScope = { workspace_id: "ws-1", participant_id: "caregiver-1" };

const context: NurtureCommandExecutionContext = {
  workspace_id: "ws-1",
  business_actor_ref: "guardian-1",
};

const contexts = (): NurtureInteractionContextService =>
  new NurtureInteractionContextService({
    create: async (input: unknown) =>
      ({
        ...(input as object),
        id: randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }) as never,
    findByTokenHash: async () => null,
    findLatestActiveByConversationHash: async () => null,
    consume: async () => null,
    revoke: async () => null,
  } satisfies NurtureInteractionContextRepository);

const focusEligibility = (
  goals = [
    {
      focus_goal_id: "goal-1",
      focus_cycle_id: "cycle-1",
      display_label: "Syn Focus Goal",
      focus_cycle_version: 3,
      focus_goal_version: 4,
    },
  ],
  participantActive = true,
) => ({
  resolveGuardianFocusEligibility: async () => ({
    participant_active: participantActive,
    goals,
  }),
});

const dailyCareEligibility = (
  children = [
    {
      child_care_process_id: "child-1",
      display_label: "Syn Child A",
      care_group_version: 2,
      caregiver_role_version: 5,
      enrollment_version: 6,
    },
  ],
  participantActive = true,
) => ({
  resolveCaregiverDailyCareEligibility: async () => ({
    participant_active: participantActive,
    children,
  }),
});

const focusFacts = (
  overrides: Partial<NurtureGuardianFocusGoalFacts> = {},
): NurtureGuardianFocusGoalFacts => ({
  participant_active: true,
  guardian_authority_current: true,
  family_ref_key: "family-1",
  focus_cycle_id: "cycle-1",
  focus_cycle_version: 3,
  focus_goal_version: 4,
  child_scope_explicit: false,
  ...overrides,
});

const dailyCareFacts = (
  overrides: Partial<NurtureCaregiverDailyCareFacts> = {},
): NurtureCaregiverDailyCareFacts => ({
  participant_active: true,
  caregiver_role: "caregiver",
  role_scope_type: "care_group",
  role_scope_matches_source: true,
  caregiver_role_assignment_id: "role-1",
  care_group_id: "care-group-1",
  enrollment_id: "enrollment-1",
  enrollment_active: true,
  care_group_version: 2,
  caregiver_role_version: 5,
  enrollment_version: 6,
  ...overrides,
});

const focusCommand = (
  overrides: Partial<UpdateGuardianCurrentFocusCommandV1> = {},
): UpdateGuardianCurrentFocusCommandV1 => ({
  label: "Syn Updated Focus",
  priority: 2,
  focus_goal_id: "goal-1",
  focus_cycle_id: "cycle-1",
  expected_focus_cycle_version: 3,
  expected_focus_goal_version: 4,
  ...overrides,
});

const dailyCareCommand = (
  overrides: Partial<RecordCaregiverDailyCareCommandV1> = {},
): RecordCaregiverDailyCareCommandV1 => ({
  kind: "nap",
  summary: "Syn Nap Record",
  child_care_process_id: "child-1",
  expected_care_group_version: 2,
  expected_role_version: 5,
  expected_enrollment_version: 6,
  ...overrides,
});

const boardTransaction = (
  overrides: Partial<NurtureCommandTransaction["boardMutations"] & object> = {},
  facts: {
    focus?: NurtureGuardianFocusGoalFacts;
    dailyCare?: NurtureCaregiverDailyCareFacts;
  } = {},
): NurtureCommandTransaction =>
  ({
    boardMutations: {
      loadGuardianFocusGoalFacts: async () => facts.focus ?? focusFacts(),
      applyGuardianFocusGoalUpdate: async () => ({
        focus_goal_ref: {
          schema_version: 1,
          namespace: "nurture",
          object_type: "focus_goal",
          object_id: "goal-1",
          version: 5,
        },
        revision: 5,
      }),
      loadCaregiverDailyCareFacts: async () => facts.dailyCare ?? dailyCareFacts(),
      applyCaregiverDailyCareRecord: async () => ({
        daily_care_log_ref: {
          schema_version: 1,
          namespace: "nurture",
          object_type: "daily_care_log",
          object_id: "log-1",
          version: 1,
        },
        recorded_at: "2026-08-02T10:00:00.000Z",
      }),
      ...overrides,
    },
  }) as unknown as NurtureCommandTransaction;

describe("G3-A update_guardian_current_focus", () => {
  it("accepts only the closed business input", () => {
    expect(parseUpdateGuardianCurrentFocusInputV1({ label: " Syn ", priority: 1 })).toEqual({
      status: "ok",
      input: { label: "Syn", priority: 1 },
    });
    for (const invalid of [
      { label: "", priority: 1 },
      { label: "Syn", priority: 0 },
      { label: "Syn", priority: 1.5 },
      { label: "Syn", priority: 100 },
      { label: "Syn", priority: 1, targetOptionRef: "x" },
      { label: "Syn", priority: 1, expectedHeads: {} },
      "not-an-object",
    ]) {
      expect(parseUpdateGuardianCurrentFocusInputV1(invalid).status).toBe("invalid");
    }
  });

  it("prepares only through an owner-issued focus-goal ref", async () => {
    const deps = {
      eligibility: focusEligibility(),
      contexts: contexts(),
      integrity_key: BOARD_INTEGRITY_KEY,
      create_command_id: () => "command:focus-1",
    };
    const ready = await prepareUpdateGuardianCurrentFocus(deps, {
      ...guardianScope,
      surface: "board",
      operation_input: { label: "Syn Updated Focus", priority: 2 },
      target_option_ref: issueFocusGoalTargetRef(
        BOARD_INTEGRITY_KEY,
        guardianScope,
        "goal-1",
      ),
    });
    expect(ready.status).toBe("ready_to_confirm");
    if (ready.status !== "ready_to_confirm") return;
    expect(ready.command_request_id).toBe("command:focus-1");
    expect(ready.preview).toMatchObject({ effect: "update_guardian_current_focus" });

    for (const badRef of [
      "goal-1",
      issueFocusGoalTargetRef(
        BOARD_INTEGRITY_KEY,
        { workspace_id: "ws-1", participant_id: "guardian-2" },
        "goal-1",
      ),
      issueFocusGoalTargetRef(BOARD_INTEGRITY_KEY, guardianScope, "goal-9"),
      issueChildCareProcessTargetRef(BOARD_INTEGRITY_KEY, guardianScope, "goal-1"),
    ]) {
      await expect(
        prepareUpdateGuardianCurrentFocus(deps, {
          ...guardianScope,
          surface: "board",
          operation_input: { label: "Syn Updated Focus", priority: 2 },
          target_option_ref: badRef,
        }),
      ).resolves.toEqual({ status: "denied", reason_code: "not_authorized" });
    }
  });

  it("fails closed without the canonical owner port", async () => {
    const spec = createUpdateGuardianCurrentFocusSpec({ integrity_key: BOARD_INTEGRITY_KEY });
    await expect(
      spec.checkPreconditions({} as NurtureCommandTransaction, focusCommand(), context),
    ).resolves.toEqual({
      status: "invalid",
      reason_code: "board_mutation_port_unavailable",
    });
  });

  it("blocks a stale head and a lost Guardian authority instead of overwriting", async () => {
    const spec = createUpdateGuardianCurrentFocusSpec({ integrity_key: BOARD_INTEGRITY_KEY });
    await expect(
      spec.checkPreconditions(boardTransaction(), focusCommand(), context),
    ).resolves.toEqual({ status: "ready" });
    await expect(
      spec.checkPreconditions(
        boardTransaction({}, { focus: focusFacts({ focus_goal_version: 9 }) }),
        focusCommand(),
        context,
      ),
    ).resolves.toEqual({ status: "conflict", reason_code: "stale_confirmation" });
    await expect(
      spec.checkPreconditions(
        boardTransaction({}, { focus: focusFacts({ guardian_authority_current: false }) }),
        focusCommand(),
        context,
      ),
    ).resolves.toEqual({ status: "blocked", reason_code: "not_authorized" });
    await expect(
      spec.checkPreconditions(
        boardTransaction({}, { focus: focusFacts({ focus_cycle_id: "cycle-2" }) }),
        focusCommand(),
        context,
      ),
    ).resolves.toEqual({ status: "blocked", reason_code: "not_authorized" });
  });

  it("re-reads the owner inside the transaction and never invents child scope", async () => {
    const spec = createUpdateGuardianCurrentFocusSpec({ integrity_key: BOARD_INTEGRITY_KEY });
    const applied = await spec.apply(boardTransaction(), focusCommand(), context);
    expect(applied.committed_result).toMatchObject({
      revision: 5,
      scopeSource: "family_scope",
    });
    expect(JSON.stringify(applied.committed_result)).not.toContain("goal-1");

    const scoped = await spec.apply(
      boardTransaction({}, { focus: focusFacts({ child_scope_explicit: true }) }),
      focusCommand(),
      context,
    );
    expect(scoped.committed_result).toMatchObject({ scopeSource: "explicit_child_scope" });

    await expect(
      spec.apply(
        boardTransaction({}, { focus: focusFacts({ focus_goal_version: 9 }) }),
        focusCommand(),
        context,
      ),
    ).rejects.toThrow(/changed inside the transaction/);
  });
});

describe("G3-A record_caregiver_daily_care", () => {
  it("accepts only the closed business input", () => {
    expect(
      parseRecordCaregiverDailyCareInputV1({ kind: "meal", summary: " Syn " }),
    ).toEqual({ status: "ok", input: { kind: "meal", summary: "Syn" } });
    for (const invalid of [
      { kind: "publication", summary: "Syn" },
      { kind: "meal", summary: "" },
      { kind: "meal", summary: "x".repeat(501) },
      { kind: "meal", summary: "Syn", childId: "child-1" },
      42,
    ]) {
      expect(parseRecordCaregiverDailyCareInputV1(invalid).status).toBe("invalid");
    }
  });

  it("prepares only through an owner-issued child ref", async () => {
    const deps = {
      eligibility: dailyCareEligibility(),
      contexts: contexts(),
      integrity_key: BOARD_INTEGRITY_KEY,
      create_command_id: () => "command:daily-1",
    };
    const ready = await prepareRecordCaregiverDailyCare(deps, {
      ...caregiverScope,
      surface: "board",
      operation_input: { kind: "nap", summary: "Syn Nap Record" },
      target_option_ref: issueChildCareProcessTargetRef(
        BOARD_INTEGRITY_KEY,
        caregiverScope,
        "child-1",
      ),
    });
    expect(ready.status).toBe("ready_to_confirm");

    for (const badRef of [
      "child-1",
      issueChildCareProcessTargetRef(BOARD_INTEGRITY_KEY, caregiverScope, "child-9"),
      issueFocusGoalTargetRef(BOARD_INTEGRITY_KEY, caregiverScope, "child-1"),
    ]) {
      await expect(
        prepareRecordCaregiverDailyCare(deps, {
          ...caregiverScope,
          surface: "board",
          operation_input: { kind: "nap", summary: "Syn Nap Record" },
          target_option_ref: badRef,
        }),
      ).resolves.toEqual({ status: "denied", reason_code: "not_authorized" });
    }
    await expect(
      prepareRecordCaregiverDailyCare(deps, {
        ...caregiverScope,
        surface: "board",
        operation_input: { kind: "nap", summary: "Syn Nap Record" },
      }),
    ).resolves.toEqual({ status: "needs_input", fields: ["target"] });
  });

  it("refuses every identity that is not an exact-CareGroup caregiver", async () => {
    const spec = createRecordCaregiverDailyCareSpec({ integrity_key: BOARD_INTEGRITY_KEY });
    await expect(
      spec.checkPreconditions(boardTransaction(), dailyCareCommand(), context),
    ).resolves.toEqual({ status: "ready" });
    for (const wider of [
      { caregiver_role: "institution_admin" },
      { caregiver_role: "guardian" },
      { role_scope_type: "institution" },
      { role_scope_matches_source: false },
      { enrollment_active: false },
    ]) {
      await expect(
        spec.checkPreconditions(
          boardTransaction({}, { dailyCare: dailyCareFacts(wider) }),
          dailyCareCommand(),
          context,
        ),
      ).resolves.toEqual({ status: "blocked", reason_code: "not_authorized" });
    }
    await expect(
      spec.checkPreconditions(
        boardTransaction({}, { dailyCare: dailyCareFacts({ caregiver_role: "lead_caregiver" }) }),
        dailyCareCommand(),
        context,
      ),
    ).resolves.toEqual({ status: "ready" });
  });

  it("commits an internal class fact that claims no family visibility", async () => {
    const spec = createRecordCaregiverDailyCareSpec({ integrity_key: BOARD_INTEGRITY_KEY });
    const applied = await spec.apply(boardTransaction(), dailyCareCommand(), context);
    expect(applied.committed_result).toMatchObject({
      kind: "nap",
      recordedAt: "2026-08-02T10:00:00.000Z",
    });
    const serialized = JSON.stringify(applied.committed_result);
    for (const forbidden of [
      "receipt",
      "publication",
      "release",
      "visib",
      "delivered",
      "log-1",
    ]) {
      expect(serialized.toLowerCase()).not.toContain(forbidden);
    }
    await expect(
      spec.apply(
        boardTransaction({}, { dailyCare: dailyCareFacts({ enrollment_version: 9 }) }),
        dailyCareCommand(),
        context,
      ),
    ).rejects.toThrow(/changed inside the transaction/);
  });

  it("keeps the two board mutations on separate command scopes and keys", () => {
    const focus = createUpdateGuardianCurrentFocusSpec({ integrity_key: BOARD_INTEGRITY_KEY });
    const daily = createRecordCaregiverDailyCareSpec({ integrity_key: BOARD_INTEGRITY_KEY });
    expect(focus.command_key).toBe(UPDATE_GUARDIAN_CURRENT_FOCUS_CAPABILITY.key);
    expect(daily.command_key).toBe(RECORD_CAREGIVER_DAILY_CARE_CAPABILITY.key);
    expect(focus.command_scope).not.toBe(daily.command_scope);
    expect(focus.canonicalize(focusCommand())).not.toEqual(
      focus.canonicalize(focusCommand({ priority: 3 })),
    );
    expect(daily.canonicalize(dailyCareCommand())).toEqual(
      daily.canonicalize(dailyCareCommand()),
    );
  });
});
