import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { NurtureWorkflowRunSettlementBindingV1 } from "@the-nurture/scenario";
import {
  PrismaNurtureWorkflowRunSettlementRepository,
  PrismaNurtureWorkflowRunSettlementTransaction,
} from "../src/repositories/workflow-run-settlement.repository.js";

const NOW = new Date("2026-08-12T09:00:00.000Z");
const binding: NurtureWorkflowRunSettlementBindingV1 = Object.freeze({
  workspace_id: "workspace-1",
  logical_operation_id_hash: "a".repeat(64),
  reservation_ref_hash: "b".repeat(64),
  reservation_evidence_sha256: "c".repeat(64),
  run_object_id: "run-1",
  binding_fingerprint_sha256: "d".repeat(64),
  command_request_id_hash: "e".repeat(64),
  command_key: "nurture.start_enrollment_inquiry",
});

describe("Prisma Nurture Workflow Run settlement repository", () => {
  it("keeps the migration additive, body-free and terminal-state coherent", () => {
    const sql = readFileSync(
      new URL(
        "../../../prisma/migrations/20260812170000_t007_workflow_run_settlement/migration.sql",
        import.meta.url,
      ),
      "utf8",
    );
    expect(sql).toContain('CREATE TABLE "nurture_workflow_run_settlement"');
    expect(sql).toContain('"state" = \'committed\'');
    expect(sql).toContain('"state" = \'confirmed_no_effect\'');
    expect(sql).toContain('"command_execution_id" IS NOT NULL');
    expect(sql).toContain('"command_execution_id" IS NULL');
    expect(sql).toContain(
      "Repository migration artifact. Apply only to an explicitly approved target.",
    );
    expect(sql).not.toMatch(/contact|participant|child|family|authority|payload|ciphertext/iu);
  });

  it("registers under the command writer fence without storing Scenario facts", async () => {
    const database = fakeDatabase();
    const repository = owner(database);

    const created = await repository.register(binding);
    const replay = await repository.register(binding);

    expect(created).toMatchObject({
      disposition: "created",
      record: { state: "prepared", aggregate_version: 1 },
    });
    expect(replay).toEqual({ ...created, disposition: "replayed" });
    expect(database.advisoryCalls).toBe(2);
    expect(database.executions).toHaveLength(0);
    expect(JSON.stringify(database.settlements)).not.toMatch(
      /contact|participant|child|family|authority|command payload/u,
    );
  });

  it("confirms no-effect only while holding the same writer fence and stays terminal", async () => {
    const database = fakeDatabase();
    const repository = owner(database);
    await repository.register(binding);

    const settled = await repository.confirmNoEffect(binding);
    const replay = await repository.confirmNoEffect(binding);

    expect(settled).toMatchObject({
      disposition: "settled",
      record: {
        state: "confirmed_no_effect",
        aggregate_version: 2,
        confirmed_no_effect_at: NOW.toISOString(),
      },
    });
    expect(replay).toEqual({ ...settled, disposition: "replayed" });
    expect(database.advisoryCalls).toBe(3);
    expect(database.executions).toHaveLength(0);
  });

  it("reconciles an exact committed execution instead of falsely confirming no-effect", async () => {
    const database = fakeDatabase();
    const repository = owner(database);
    await repository.register(binding);
    database.executions.push(execution("execution-1"));

    const result = await repository.confirmNoEffect(binding);

    expect(result).toMatchObject({
      disposition: "settled",
      record: {
        state: "committed",
        command_execution_id: "execution-1",
        aggregate_version: 2,
      },
    });
  });

  it("marks committed inside the caller transaction and rejects the opposite terminal state", async () => {
    const committedDb = fakeDatabase();
    await owner(committedDb).register(binding);
    committedDb.executions.push(execution("execution-1"));
    const transaction = new PrismaNurtureWorkflowRunSettlementTransaction(
      committedDb.client as never,
      () => NOW,
      () => "receipt-1",
    );

    const committed = await transaction.markCommitted({
      ...binding,
      command_execution_id: "execution-1",
    });
    expect(committed).toMatchObject({
      state: "committed",
      settlement_receipt_ref: "receipt-1",
      aggregate_version: 2,
    });
    await expect(transaction.markCommitted({
      ...binding,
      command_execution_id: "execution-1",
    })).resolves.toEqual(committed);

    const abandonedDb = fakeDatabase();
    const abandonedOwner = owner(abandonedDb);
    await abandonedOwner.register(binding);
    await abandonedOwner.confirmNoEffect(binding);
    abandonedDb.executions.push(execution("execution-2"));
    await expect(new PrismaNurtureWorkflowRunSettlementTransaction(
      abandonedDb.client as never,
      () => NOW,
      () => "receipt-2",
    ).markCommitted({
      ...binding,
      command_execution_id: "execution-2",
    })).rejects.toThrow(/already confirmed no-effect/u);
  });
});

function owner(database: ReturnType<typeof fakeDatabase>) {
  let id = 0;
  return new PrismaNurtureWorkflowRunSettlementRepository(
    database.client as never,
    () => NOW,
    () => `settlement-or-receipt-${++id}`,
  );
}

function execution(id: string) {
  return {
    id,
    workspaceId: binding.workspace_id,
    commandRequestIdHash: binding.command_request_id_hash,
    commandKey: binding.command_key,
  };
}

function fakeDatabase() {
  const settlements: Array<Record<string, any>> = [];
  const executions: Array<Record<string, any>> = [];
  const database = {
    settlements,
    executions,
    advisoryCalls: 0,
    client: undefined as unknown,
  };
  const settlementDelegate = {
    async findUnique(input: Record<string, any>) {
      if (input.where.id) return settlements.find((row) => row.id === input.where.id) ?? null;
      const key = input.where.workspaceId_logicalOperationIdHash;
      return settlements.find((row) =>
        row.workspaceId === key.workspaceId &&
        row.logicalOperationIdHash === key.logicalOperationIdHash
      ) ?? null;
    },
    async findUniqueOrThrow(input: Record<string, any>) {
      const found = await settlementDelegate.findUnique(input);
      if (!found) throw new Error("not found");
      return found;
    },
    async create(input: Record<string, any>) {
      const row = {
        ...input.data,
        commandExecutionId: null,
        settlementReceiptRef: null,
        settlementEvidenceHash: null,
        aggregateVersion: 1,
        committedAt: null,
        confirmedNoEffectAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      };
      settlements.push(row);
      return row;
    },
    async updateMany(input: Record<string, any>) {
      const row = settlements.find((candidate) => candidate.id === input.where.id);
      if (!row || row.state !== input.where.state ||
          row.aggregateVersion !== input.where.aggregateVersion) return { count: 0 };
      for (const [key, value] of Object.entries(input.data)) {
        if (value === undefined) continue;
        if (key === "aggregateVersion") row.aggregateVersion += (value as any).increment;
        else row[key] = value;
      }
      row.updatedAt = NOW;
      return { count: 1 };
    },
  };
  const executionDelegate = {
    async findUnique(input: Record<string, any>) {
      const key = input.where.workspaceId_commandRequestIdHash;
      return executions.find((row) =>
        row.workspaceId === key.workspaceId &&
        row.commandRequestIdHash === key.commandRequestIdHash
      ) ?? null;
    },
    async findFirst(input: Record<string, any>) {
      return executions.find((row) => Object.entries(input.where)
        .every(([key, value]) => row[key] === value)) ?? null;
    },
  };
  const client = {
    nurtureWorkflowRunSettlement: settlementDelegate,
    nurtureCommandExecution: executionDelegate,
    async $queryRaw() {
      database.advisoryCalls += 1;
      return [{ acquired: true }];
    },
    async $transaction(operation: (transaction: unknown) => unknown) {
      return operation(client);
    },
  };
  database.client = client;
  return database;
}
