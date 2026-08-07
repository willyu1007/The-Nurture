import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  NurtureDeterministicRollback,
  NurtureInteractionContextService,
  createBoardWriteSpec,
  RECORD_CAREGIVER_DAILY_CARE_CAPABILITY,
  createRecordCaregiverDailyCareSpec,
  issueChildCareProcessTargetRef,
  parseRecordCaregiverDailyCareInputV1,
  prepareRecordCaregiverDailyCare,
  type NurtureCaregiverDailyCareFacts,
  type NurtureCommandExecutionContext,
  type NurtureCommandTransaction,
  type NurtureInteractionContextRepository,
  type BoardWriteSpecDefinitionV1,
  type RecordCaregiverDailyCareCommandV1,
} from "../../src/index.js";
import { BOARD_INTEGRITY_KEY } from "./board-fixtures.js";

const caregiverScope = { workspace_id: "ws-1", participant_id: "caregiver-1" };

const context: NurtureCommandExecutionContext = {
  workspace_id: "ws-1",
  business_actor_ref: "guardian-1",
  command_request_id: "command:board-1",
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
    dailyCare?: NurtureCaregiverDailyCareFacts;
  } = {},
): NurtureCommandTransaction =>
  ({
    boardMutations: {
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
    // A closed shape, not a substring grep: the earlier six-substring scan
    // would have passed a raw enrollmentId straight through. Exactly these
    // keys, exactly these values, and the ref is a keyed 32-hex handle rather
    // than anything derived readably from the row id.
    expect(applied.committed_result).toEqual({
      dailyCareLogRef: expect.stringMatching(/^[0-9a-f]{32}$/),
      kind: "nap",
      recordedAt: "2026-08-02T10:00:00.000Z",
    });
    expect(JSON.stringify(applied.committed_result)).not.toContain("log-1");
    await expect(
      spec.apply(
        boardTransaction({}, { dailyCare: dailyCareFacts({ enrollment_version: 9 }) }),
        dailyCareCommand(),
        context,
      ),
    ).rejects.toThrow(NurtureDeterministicRollback);
  });

  it("binds the daily-care mutation to its exact command key and canonical form", () => {
    // The guardian current-focus mutation was ceded to My-Chat cultivation
    // in surface contract 1.16.0 (D-T009-01); daily care is the remaining
    // G3-A inline board mutation.
    const daily = createRecordCaregiverDailyCareSpec({ integrity_key: BOARD_INTEGRITY_KEY });
    expect(daily.command_key).toBe(RECORD_CAREGIVER_DAILY_CARE_CAPABILITY.key);
    expect(daily.canonicalize(dailyCareCommand())).toEqual(
      daily.canonicalize(dailyCareCommand()),
    );
    expect(daily.canonicalize(dailyCareCommand())).not.toEqual(
      daily.canonicalize(dailyCareCommand({ summary: "Syn Different" })),
    );
  });
});

// ---------------------------------------------------------------------------
// The five obligations every board write command carries. They are asserted
// against the factory itself rather than against one capability, because the
// point of the factory is that sixteen capabilities cannot each get them right.

type ProbeFacts = { version: number; already: boolean };
type ProbePort = { load(): Promise<ProbeFacts | null> };
type ProbeInput = { expected_version: number; label: string };

const probeRef = {
  schema_version: 1 as const,
  namespace: "nurture",
  object_type: "probe",
  object_id: "probe-1",
  version: 1,
};

const probeTransaction = (port?: ProbePort): NurtureCommandTransaction =>
  ({ probe: port }) as unknown as NurtureCommandTransaction;

const probePort = (facts: ProbeFacts | null = { version: 1, already: false }): ProbePort => ({
  load: async () => facts,
});

type ProbeDefinition = BoardWriteSpecDefinitionV1<
  ProbeInput,
  ProbePort,
  ProbeFacts,
  { label: string }
>;

const probeSpec = (overrides: Partial<ProbeDefinition> = {}) =>
  createBoardWriteSpec<ProbeInput, ProbePort, ProbeFacts, { label: string }>({
    capability: { key: "probe_board_write", version: "1.0.0" },
    command_scope: "probe",
    contract_version: 1,
    result_schema_version: 7,
    canonicalize: (input) => ({ ...input }),
    port: {
      select: (transaction) => (transaction as unknown as { probe?: ProbePort }).probe,
      unavailable_reason_code: "probe_port_unavailable",
    },
    revalidateInput: (input) =>
      input.label.trim() === input.label && input.label.length > 0
        ? null
        : { status: "invalid", reason_code: "invalid_probe_input" },
    loadFacts: (port) => port.load(),
    facts_absent_reason_code: "target_unavailable",
    authorize: (facts, input) =>
      facts.already
        ? {
            status: "already_satisfied",
            effect: { output_refs: [probeRef], committed_result: { probeRef: "existing" } },
          }
        : { status: "authorized", write: { label: input.label } },
    head_keys: ["probe"],
    expectedHeads: (input) => ({ probe: input.expected_version }),
    currentHeads: (facts) => ({ probe: facts.version }),
    apply: async (_port, _input, _context, write) => ({
      output_refs: [probeRef],
      committed_result: { label: write.label },
    }),
    ...overrides,
  });

const probeInput = (overrides: Partial<ProbeInput> = {}): ProbeInput => ({
  expected_version: 1,
  label: "Syn Probe",
  ...overrides,
});

const rollbackReason = async (run: Promise<unknown>): Promise<string> => {
  try {
    await run;
  } catch (error) {
    if (error instanceof NurtureDeterministicRollback) return error.reason_code;
    throw error;
  }
  throw new Error("expected a deterministic rollback");
};

describe("createBoardWriteSpec", () => {
  it("names the owner port it could not find, on both halves of the command", async () => {
    const spec = probeSpec();
    await expect(
      spec.checkPreconditions(probeTransaction(), probeInput(), context),
    ).resolves.toEqual({ status: "invalid", reason_code: "probe_port_unavailable" });
    // apply is reachable on its own, so it must fail with the same named cause
    // rather than an anonymous throw the transport maps to a generic retry.
    expect(await rollbackReason(spec.apply(probeTransaction(), probeInput(), context))).toBe(
      "probe_port_unavailable",
    );
  });

  it("re-parses the typed input inside the transaction", async () => {
    const spec = probeSpec();
    await expect(
      spec.checkPreconditions(
        probeTransaction(probePort()),
        probeInput({ label: " untrimmed " }),
        context,
      ),
    ).resolves.toEqual({ status: "invalid", reason_code: "invalid_probe_input" });
  });

  it("conflicts when a declared head moved under the command", async () => {
    const spec = probeSpec();
    await expect(
      spec.checkPreconditions(
        probeTransaction(probePort({ version: 4, already: false })),
        probeInput(),
        context,
      ),
    ).resolves.toEqual({ status: "conflict", reason_code: "stale_confirmation" });
  });

  it("refuses a head that appears only at runtime, on either side", async () => {
    // A head produced but not declared was never reviewable; a head declared but
    // not produced drops silently out of the comparison. Both fail closed.
    const undeclared = probeSpec({
      expectedHeads: (input) => ({ probe: input.expected_version, sneaky: 1 }),
    });
    expect(
      await rollbackReason(
        undeclared.checkPreconditions(probeTransaction(probePort()), probeInput(), context),
      ),
    ).toBe("undeclared_expected_head");

    const missing = probeSpec({ currentHeads: () => ({}) as Record<string, number> });
    expect(
      await rollbackReason(
        missing.checkPreconditions(probeTransaction(probePort()), probeInput(), context),
      ),
    ).toBe("undeclared_current_head");
  });

  it("answers already_satisfied before the head it necessarily moved", async () => {
    const spec = probeSpec();
    await expect(
      spec.checkPreconditions(
        probeTransaction(probePort({ version: 9, already: true })),
        probeInput(),
        context,
      ),
    ).resolves.toEqual({
      status: "already_satisfied",
      output_refs: [probeRef],
      result_schema_version: 7,
      committed_result: { probeRef: "existing" },
    });
  });

  it("refuses an already_satisfied that names no existing fact", async () => {
    const spec = probeSpec({
      authorize: () => ({
        status: "already_satisfied",
        effect: { output_refs: [], committed_result: { probeRef: "claimed" } },
      }),
    });
    expect(
      await rollbackReason(
        spec.checkPreconditions(probeTransaction(probePort()), probeInput(), context),
      ),
    ).toBe("already_satisfied_without_evidence");
  });

  it("stamps the result schema version and refuses an effect that names nothing", async () => {
    const spec = probeSpec();
    await expect(
      spec.apply(probeTransaction(probePort()), probeInput(), context),
    ).resolves.toEqual({
      output_refs: [probeRef],
      result_schema_version: 7,
      committed_result: { label: "Syn Probe" },
    });

    const empty = probeSpec({
      apply: async () => ({ output_refs: [], committed_result: {} }),
    });
    expect(
      await rollbackReason(empty.apply(probeTransaction(probePort()), probeInput(), context)),
    ).toBe("committed_without_output_ref");
  });

  it("aborts the write when the second owner read no longer authorises it", async () => {
    const spec = probeSpec();
    expect(
      await rollbackReason(
        spec.apply(probeTransaction(probePort({ version: 4, already: false })), probeInput(), context),
      ),
    ).toBe("stale_confirmation");
    expect(
      await rollbackReason(
        spec.apply(probeTransaction(probePort(null)), probeInput(), context),
      ),
    ).toBe("target_unavailable");
  });
});
