import { describe, expect, it } from "vitest";
import type {
  CanonicalRef,
  ScenarioCommandDriverContext,
} from "@my-chat/workflow-contracts";
import {
  NurtureCommandRunner,
  canonicalJsonV1,
  hashCommandPayload,
  hashCommandRequestId,
  hashInvocationRequestId,
  type NurtureCommandInput,
  type NurtureCommandRepository,
  type NurtureCommandSpec,
  type NurtureWorkflowProject,
} from "../../src/index.js";
import { calibrateFamilyStrategyCommand } from "../../src/domain/commands/family-strategy.command.js";
import { createInMemoryNurtureCommandRepository } from "../../src/domain/testing/in-memory-institution-ports.js";

type DomainContextRef = CanonicalRef;

const workspaceId = "ws-command";
const outputRef = (version = 1): DomainContextRef => ({
  schema_version: 1,
  namespace: "nurture",
  object_type: "test_output",
  object_id: "output-1",
  version,
});

const driver = (
  stepId = "step-1",
  claimToken = "claim-token-1",
  expectedStepVersion = 2,
): ScenarioCommandDriverContext => ({
  driverRef: {
    schema_version: 1,
    namespace: "my_chat",
    object_type: "workflow_step",
    object_id: stepId,
  },
  contractHash: "contract-hash-1",
  capabilityKey: "test_capability",
  entrypointKey: "execute_test",
  claimToken,
  expectedStepVersion,
});

const spec = (effect: () => void, decision: "ready" | "blocked" | "already_satisfied" = "ready"):
  NurtureCommandSpec<{ value: number }> => ({
  command_key: "test.apply",
  command_scope: "test",
  contract_version: 1,
  canonicalize: (input) => input,
  checkPreconditions: async () =>
    decision === "blocked"
      ? { status: "blocked", reason_code: "test_blocked" }
      : decision === "already_satisfied"
        ? { status: "already_satisfied", output_refs: [outputRef(2)] }
        : { status: "ready" },
  apply: async () => {
    effect();
    return { output_refs: [outputRef()] };
  },
});

const activationSpec = (effect: () => void): NurtureCommandSpec<{ value: number }> => ({
  ...spec(effect),
  handoff: {
    capability_key: "test_capability",
    entrypoint_key: "execute_test",
    handoff_key: "user_attention",
    requested_purpose: "user_attention",
    select_source_context_refs: (_input, outputRefs) => [...outputRefs],
  },
});

const command = (
  repository: NurtureCommandRepository,
  commandSpec: NurtureCommandSpec<{ value: number }>,
  overrides: Partial<NurtureCommandInput<{ value: number }>> = {},
) =>
  new NurtureCommandRunner(repository).execute({
    workspace_id: workspaceId,
    invocation_request_id: "invocation-1",
    command_request_id: "command-1",
    business_actor_ref: "nurture:test-actor",
    target_refs: [],
    payload: { value: 1 },
    spec: commandSpec,
    ...overrides,
  });

describe("Nurture command canonicalization", () => {
  it("sorts object keys, preserves array order, and distinguishes null from omission", () => {
    expect(canonicalJsonV1({ b: 2, a: 1 })).toBe(canonicalJsonV1({ a: 1, b: 2 }));
    expect(hashCommandPayload({ values: [1, 2] })).not.toBe(hashCommandPayload({ values: [2, 1] }));
    expect(hashCommandPayload({ optional: undefined })).not.toBe(hashCommandPayload({ optional: null }));
  });

  it("separates workspaces and command/invocation hash namespaces", () => {
    expect(hashCommandRequestId("ws-a", "same-id")).not.toBe(hashCommandRequestId("ws-b", "same-id"));
    expect(hashCommandRequestId("ws-a", "same-id")).not.toBe(hashInvocationRequestId("ws-a", "same-id"));
  });
});

describe("NurtureCommandRunner", () => {
  it("commits once, replays exactly, and persists explicit empty snapshots without raw ids", async () => {
    let effects = 0;
    const repository = createInMemoryNurtureCommandRepository();
    const commandSpec = spec(() => {
      effects += 1;
    });
    const first = await command(repository, commandSpec);
    const replay = await command(repository, commandSpec);

    expect(first.status).toBe("ok");
    expect(first.status === "ok" && first.disposition).toBe("executed");
    expect(replay.status === "ok" && replay.disposition).toBe("replayed");
    expect(replay.status === "ok" && replay.handoff_request_snapshots).toEqual([]);
    expect(effects).toBe(1);

    const record = await repository.findCommitted({
      workspace_id: workspaceId,
      command_request_id_hash: hashCommandRequestId(workspaceId, "command-1"),
    });
    expect(record?.command_request_id_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(record)).not.toContain("command-1");
    expect(record?.handoff_request_snapshots_payload).toEqual([]);
  });

  it("rejects same key with a different semantic payload", async () => {
    const repository = createInMemoryNurtureCommandRepository();
    const commandSpec = spec(() => undefined);
    await command(repository, commandSpec);
    const conflict = await command(repository, commandSpec, { payload: { value: 2 } });
    expect(conflict).toEqual({
      status: "not_committed",
      decision: "idempotency_conflict",
      reason_code: "command_request_payload_mismatch",
    });
  });

  it("returns the immutable committed result on exact replay", async () => {
    const repository = createInMemoryNurtureCommandRepository();
    const commandSpec: NurtureCommandSpec<{ value: number }> = {
      ...spec(() => undefined),
      apply: async () => ({
        output_refs: [outputRef()],
        result_schema_version: 1,
        committed_result: {
          capability_key: "test.apply",
          historical_effect: "original",
        },
      }),
    };

    const first = await command(repository, commandSpec);
    const replay = await command(repository, commandSpec);

    expect(first).toMatchObject({
      status: "ok",
      disposition: "executed",
      committed_result: {
        capability_key: "test.apply",
        historical_effect: "original",
      },
    });
    expect(replay).toMatchObject({
      status: "ok",
      disposition: "replayed",
      committed_result: {
        capability_key: "test.apply",
        historical_effect: "original",
      },
    });
  });

  it("requires a valid claimed Step before activation without consuming command identity", async () => {
    let effects = 0;
    const repository = createInMemoryNurtureCommandRepository();
    const commandSpec = activationSpec(() => {
      effects += 1;
    });
    const missing = await command(repository, commandSpec, {
      handoff_activation: { request_id: "attention-1" },
    });
    expect(missing).toEqual({
      status: "not_committed",
      decision: "invalid",
      reason_code: "missing_durable_handoff_driver",
    });
    expect(effects).toBe(0);

    const corrected = await command(repository, commandSpec, {
      handoff_activation: { request_id: "attention-1", driver_context: driver() },
    });
    expect(corrected).toMatchObject({ status: "ok", disposition: "executed" });
    expect(effects).toBe(1);
  });

  it("persists a refs-only replay seed and fences replay to the original Step", async () => {
    let effects = 0;
    const repository = createInMemoryNurtureCommandRepository();
    const commandSpec = activationSpec(() => {
      effects += 1;
    });
    const first = await command(repository, commandSpec, {
      handoff_activation: { request_id: "attention-1", driver_context: driver() },
    });
    expect(first).toMatchObject({
      status: "ok",
      disposition: "executed",
      handoff_request_snapshots: [
        {
          requestId: "attention-1",
          handoffKey: "user_attention",
          requestedPurpose: "user_attention",
          sourceContextRefs: [{ object_type: "test_output", object_id: "output-1" }],
        },
      ],
    });

    const record = await repository.findCommitted({
      workspace_id: workspaceId,
      command_request_id_hash: hashCommandRequestId(workspaceId, "command-1"),
    });
    expect(record?.handoff_driver_ref).toEqual({
      schema_version: 1,
      namespace: "my_chat",
      object_type: "workflow_step",
      object_id: "step-1",
    });
    expect(JSON.stringify(record)).not.toContain("claim-token-1");
    expect(record?.handoff_driver_ref?.version).toBeUndefined();

    const reclaimed = await command(repository, commandSpec, {
      handoff_activation: {
        request_id: "attention-1",
        driver_context: driver("step-1", "rotated-claim-token", 9),
      },
    });
    expect(reclaimed).toMatchObject({ status: "ok", disposition: "replayed" });
    expect(effects).toBe(1);

    const wrongStep = await command(repository, commandSpec, {
      handoff_activation: {
        request_id: "attention-1",
        driver_context: driver("step-other", "other-token", 1),
      },
    });
    expect(wrongStep).toEqual({
      status: "not_committed",
      decision: "invalid",
      reason_code: "invalid_durable_handoff_driver",
    });
  });

  it("preserves a zero-based Nurture aggregate version at the shared Handoff boundary", async () => {
    const repository = createInMemoryNurtureCommandRepository();
    const zeroVersionSpec: NurtureCommandSpec<{ value: number }> = {
      ...spec(() => undefined),
      apply: async () => ({ output_refs: [outputRef(0)] }),
      handoff: {
        capability_key: "test_capability",
        entrypoint_key: "execute_test",
        handoff_key: "user_attention",
        requested_purpose: "user_attention",
        select_source_context_refs: (_input, outputRefs) => [...outputRefs],
      },
    };

    const result = await command(repository, zeroVersionSpec, {
      handoff_activation: {
        request_id: "attention-zero-version",
        driver_context: driver(),
      },
    });

    expect(result).toMatchObject({ status: "ok", disposition: "executed" });
    if (result.status !== "ok") throw new Error("zero-version command did not commit");
    expect(result.handoff_request_snapshots[0]?.sourceContextRefs).toEqual([
      {
        schema_version: 1,
        namespace: "nurture",
        object_type: "test_output",
        object_id: "output-1",
        version: 0,
      },
    ]);
  });

  it("rejects driver versions, wrong bindings, and activation drift", async () => {
    const repository = createInMemoryNurtureCommandRepository();
    const commandSpec = activationSpec(() => undefined);
    const versionedDriver = driver();
    versionedDriver.driverRef = { ...versionedDriver.driverRef, version: 2 };
    await expect(
      command(repository, commandSpec, {
        handoff_activation: { request_id: "attention-versioned", driver_context: versionedDriver },
      }),
    ).resolves.toMatchObject({
      status: "not_committed",
      reason_code: "invalid_durable_handoff_driver",
    });

    await expect(
      command(repository, commandSpec, {
        handoff_activation: {
          request_id: "attention-consumer",
          driver_context: {
            ...driver(),
            driverRef: { ...driver().driverRef, namespace: "nurture" },
          },
        },
      }),
    ).resolves.toMatchObject({
      status: "not_committed",
      reason_code: "invalid_durable_handoff_driver",
    });

    await expect(
      command(repository, commandSpec, {
        handoff_activation: {
          request_id: "attention-binding",
          driver_context: { ...driver(), entrypointKey: "wrong_entrypoint" },
        },
      }),
    ).resolves.toMatchObject({
      status: "not_committed",
      reason_code: "invalid_durable_handoff_driver",
    });

    await command(repository, commandSpec);
    const activationAfterEmpty = await command(repository, commandSpec, {
      handoff_activation: { request_id: "attention-late", driver_context: driver() },
    });
    expect(activationAfterEmpty).toMatchObject({
      status: "not_committed",
      decision: "idempotency_conflict",
    });
  });

  it("fails closed when stored replay routing metadata is corrupt", async () => {
    const repository = createInMemoryNurtureCommandRepository();
    const commandSpec = activationSpec(() => undefined);
    await command(repository, commandSpec, {
      handoff_activation: { request_id: "attention-1", driver_context: driver() },
    });
    const stored = await repository.findCommitted({
      workspace_id: workspaceId,
      command_request_id_hash: hashCommandRequestId(workspaceId, "command-1"),
    });
    expect(stored).not.toBeNull();
    stored!.handoff_request_snapshots_payload[0] = {
      ...stored!.handoff_request_snapshots_payload[0]!,
      handoffKey: "tampered_attention",
    };

    const replay = await command(repository, commandSpec, {
      handoff_activation: { request_id: "attention-1", driver_context: driver() },
    });
    expect(replay).toEqual({
      status: "not_committed",
      decision: "technical_error",
      reason_code: "invalid_stored_handoff_replay_seed",
    });
  });

  it("does not consume identity for a blocked attempt", async () => {
    const repository = createInMemoryNurtureCommandRepository();
    const blocked = await command(repository, spec(() => undefined, "blocked"));
    expect(blocked.status === "not_committed" && blocked.decision).toBe("blocked");
    const corrected = await command(repository, spec(() => undefined, "ready"));
    expect(corrected.status === "ok" && corrected.disposition).toBe("executed");
  });

  it("separates already-satisfied business outcome from replay disposition", async () => {
    const repository = createInMemoryNurtureCommandRepository();
    const commandSpec = spec(() => {
      throw new Error("must not apply");
    }, "already_satisfied");
    const first = await command(repository, commandSpec);
    const replay = await command(repository, commandSpec);
    expect(first.status === "ok" && [first.disposition, first.business_outcome]).toEqual([
      "executed",
      "already_satisfied",
    ]);
    expect(replay.status === "ok" && [replay.disposition, replay.business_outcome]).toEqual([
      "replayed",
      "already_satisfied",
    ]);
  });

  it("classifies finalizer failure as a definite rollback and leaves no execution", async () => {
    const repository = createInMemoryNurtureCommandRepository();
    const commandSpec: NurtureCommandSpec<{ value: number }> = {
      ...spec(() => undefined),
      afterExecutionCreated: async () => {
        throw new Error("finalizer failed before transaction commit");
      },
    };

    expect(await command(repository, commandSpec)).toEqual({
      status: "not_committed",
      decision: "technical_error",
      reason_code: "command_execution_failed",
    });
    await expect(
      repository.findCommitted({
        workspace_id: workspaceId,
        command_request_id_hash: hashCommandRequestId(workspaceId, "command-1"),
      }),
    ).resolves.toBeNull();
  });

  it("separates lock busy, indeterminate transactions and pre-transaction lookup failure", async () => {
    const busyRepository: NurtureCommandRepository = {
      findCommitted: async () => null,
      executeLocked: async () => ({ acquired: false }),
    };
    const busy = await command(busyRepository, spec(() => undefined));
    expect(busy.status === "not_committed" && busy.decision).toBe("command_busy");

    const brokenRepository: NurtureCommandRepository = {
      findCommitted: async () => null,
      executeLocked: async () => {
        throw new Error("database unavailable");
      },
    };
    // The transaction wrapper itself failed, so whether COMMIT landed is not
    // observable: the honest answer is outcome_unknown, reconciled by the same
    // command identity — never a definite "no effect".
    const broken = await command(brokenRepository, spec(() => undefined));
    expect(broken).toEqual({
      status: "outcome_unknown",
      reason_code: "command_execution_failed",
    });

    // A guard that throws INSIDE the operation aborts before COMMIT, so the
    // outcome is certain: definite not_committed, not outcome_unknown.
    const guarded = await command(
      createInMemoryNurtureCommandRepository(),
      spec(() => {
        throw new Error("deterministic guard");
      }),
    );
    expect(guarded).toEqual({
      status: "not_committed",
      decision: "technical_error",
      reason_code: "command_execution_failed",
    });

    const lookupFailure: NurtureCommandRepository = {
      findCommitted: async () => {
        throw new Error("database unavailable");
      },
      executeLocked: async () => ({ acquired: false }),
    };
    expect(await command(lookupFailure, spec(() => undefined))).toEqual({
      status: "not_committed",
      decision: "technical_error",
      reason_code: "command_lookup_failed",
    });

    // A spec emitting out-of-contract refs is a deterministic defect: the
    // transaction rolls back for certain, so the answer is a definite
    // not_committed — never outcome_unknown, which would strand the caller in
    // a reconciliation loop that can never find an execution.
    const overflowing: NurtureCommandSpec<{ value: number }> = {
      ...spec(() => undefined),
      apply: async () => ({
        output_refs: Array.from({ length: 33 }, (_, index) => ({
          ...outputRef(),
          object_id: `output-${index + 1}`,
        })),
      }),
    };
    expect(await command(createInMemoryNurtureCommandRepository(), overflowing)).toEqual({
      status: "not_committed",
      decision: "technical_error",
      reason_code: "command_execution_failed",
    });
  });
});

describe("family_strategy.calibrate command adoption", () => {
  it("canonicalizes semantic constraint sets independent of input order and duplicates", () => {
    const base = {
      workspace_id: workspaceId,
      project_id: "project-1",
      expected_version: 0,
      goal_payload: { objective: "reduce conflict" },
      evidence_target_ref: {
        schema_version: 1 as const,
        namespace: "my_chat",
        object_type: "workflow_run",
        object_id: "family-run",
        version: 1,
      },
      evidence_ref: {
        schema_version: 1 as const,
        namespace: "nurture",
        object_type: "context_snapshot",
        object_id: "basis",
        version: 1,
      },
    };
    const left = calibrateFamilyStrategyCommand.canonicalize({
      ...base,
      constraint_payload: {
        non_negotiable_boundaries: ["safety", "privacy", "safety"],
        negotiable_levers: ["timing", "wording"],
      },
    });
    const right = calibrateFamilyStrategyCommand.canonicalize({
      ...base,
      constraint_payload: {
        non_negotiable_boundaries: ["privacy", "safety"],
        negotiable_levers: ["wording", "timing"],
      },
    });
    expect(canonicalJsonV1(left)).toBe(canonicalJsonV1(right));
  });

  it("commits project update, evidence, and execution through the shared runner", async () => {
    const project: NurtureWorkflowProject = {
      project_id: "project-1",
      workspace_id: workspaceId,
      template_key: "family_rule_trial",
      issue_type: "bedtime",
      status: "confirmed",
      family_ref_key: "family-1",
      aggregate_version: 0,
    };
    let updates = 0;
    let evidence = 0;
    const repository = createInMemoryNurtureCommandRepository({
      getWorkflowProjectById: async () => project,
      updateWorkflowProjectStrategy: async (input) => {
        updates += 1;
        return {
          ...project,
          goal_payload: input.goal_payload,
          constraint_payload: input.constraint_payload,
          aggregate_version: 1,
        };
      },
      appendEvidenceRef: async () => {
        evidence += 1;
      },
    });
    const runner = new NurtureCommandRunner(repository);
    const input = {
      workspace_id: workspaceId,
      invocation_request_id: "family-run:step-1",
      command_request_id: "family-run:step-1",
      business_actor_ref: "nurture:system:family_strategy",
      target_refs: [],
      expected_versions: { "project-1": 0 },
      payload: {
        workspace_id: workspaceId,
        project_id: "project-1",
        expected_version: 0,
        goal_payload: { objective: "reduce conflict" },
        constraint_payload: { safety_floor: "non-punitive" },
        evidence_target_ref: {
          schema_version: 1 as const,
          namespace: "my_chat",
          object_type: "workflow_run",
          object_id: "family-run",
          version: 1,
        },
        evidence_ref: {
          schema_version: 1 as const,
          namespace: "nurture",
          object_type: "context_snapshot",
          object_id: "basis",
          version: 1,
        },
      },
      spec: calibrateFamilyStrategyCommand,
    };
    const first = await runner.execute(input);
    const replay = await runner.execute(input);
    expect(first.status === "ok" && first.business_outcome).toBe("applied");
    expect(replay.status === "ok" && replay.disposition).toBe("replayed");
    expect(updates).toBe(1);
    expect(evidence).toBe(1);
  });
});
