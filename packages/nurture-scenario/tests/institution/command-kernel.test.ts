import { describe, expect, it } from "vitest";
import type { DomainContextRef } from "@my-chat/workflow-contracts";
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

const workspaceId = "ws-command";
const outputRef = (version = 1): DomainContextRef => ({
  namespace: "nurture",
  object_type: "test_output",
  object_id: "output-1",
  version,
  owner_scope: "workspace",
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

  it("returns retryable non-committed outcomes for lock busy and transaction failure", async () => {
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
    const broken = await command(brokenRepository, spec(() => undefined));
    expect(broken.status === "not_committed" && broken.decision).toBe("technical_error");

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
  });
});

describe("family_strategy.calibrate command adoption", () => {
  it("canonicalizes semantic constraint sets independent of input order and duplicates", () => {
    const base = {
      workspace_id: workspaceId,
      project_id: "project-1",
      expected_version: 0,
      goal_payload: { objective: "reduce conflict" },
      evidence_target_ref: { kind: "workflow_run" as const, id: "family-run", version: 1 },
      evidence_ref: { kind: "context_snapshot" as const, id: "basis", version: 0 },
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
        evidence_target_ref: { kind: "workflow_run" as const, id: "family-run", version: 1 },
        evidence_ref: { kind: "context_snapshot" as const, id: "basis", version: 0 },
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
