import { randomUUID } from "node:crypto";
import type {
  NurtureCommandExecutionDraft,
  NurtureCommandExecutionRecord,
  NurtureCommandRepository,
  NurtureCommandTransaction,
} from "../commands/command-kernel.js";
import type {
  NurtureInteractionContextRecord,
  NurtureInteractionContextRepository,
} from "../interactions/interaction-context.js";

type CommandTransactionOverrides = Partial<
  Pick<
    NurtureCommandTransaction,
    "getWorkflowProjectById" | "updateWorkflowProjectStrategy" | "appendEvidenceRef"
  >
>;

export const createInMemoryNurtureCommandRepository = (
  overrides: CommandTransactionOverrides = {},
): NurtureCommandRepository => {
  const executions = new Map<string, NurtureCommandExecutionRecord>();
  const locks = new Set<string>();
  const key = (workspaceId: string, commandHash: string) => `${workspaceId}:${commandHash}`;

  const findCommitted: NurtureCommandTransaction["findCommitted"] = async (input) =>
    executions.get(key(input.workspace_id, input.command_request_id_hash)) ?? null;
  const createExecution: NurtureCommandTransaction["createExecution"] = async (
    input: NurtureCommandExecutionDraft,
  ) => {
    const execution: NurtureCommandExecutionRecord = {
      ...input,
      id: randomUUID(),
      committed_at: new Date().toISOString(),
    };
    const identityKey = key(input.workspace_id, input.command_request_id_hash);
    if (executions.has(identityKey)) throw new Error("duplicate command execution");
    executions.set(identityKey, execution);
    return execution;
  };

  return {
    findCommitted,
    async executeLocked(input) {
      const lockKey = key(input.workspace_id, input.command_request_id_hash);
      if (locks.has(lockKey)) return { acquired: false };
      locks.add(lockKey);
      try {
        const transaction: NurtureCommandTransaction = {
          findCommitted,
          createExecution,
          getWorkflowProjectById:
            overrides.getWorkflowProjectById ?? (async () => null),
          updateWorkflowProjectStrategy:
            overrides.updateWorkflowProjectStrategy ??
            (async () => {
              throw new Error("in-memory project strategy update is not configured");
            }),
          appendEvidenceRef: overrides.appendEvidenceRef ?? (async () => undefined),
        };
        return { acquired: true, value: await input.operation(transaction) };
      } finally {
        locks.delete(lockKey);
      }
    },
  };
};

export const createInMemoryInteractionContextRepository = (): NurtureInteractionContextRepository => {
  const records = new Map<string, NurtureInteractionContextRecord>();
  const tokenKey = (workspaceId: string, tokenHash: string) => `${workspaceId}:${tokenHash}`;

  return {
    async create(input) {
      const now = new Date().toISOString();
      const record: NurtureInteractionContextRecord = {
        ...input,
        id: randomUUID(),
        created_at: now,
        updated_at: now,
      };
      const key = tokenKey(input.workspace_id, input.token_hash);
      if ([...records.values()].some((row) => tokenKey(row.workspace_id, row.token_hash) === key)) {
        throw new Error("duplicate interaction token hash");
      }
      records.set(record.id, record);
      return record;
    },
    async findByTokenHash(input) {
      return (
        [...records.values()].find(
          (row) => row.workspace_id === input.workspace_id && row.token_hash === input.token_hash,
        ) ?? null
      );
    },
    async consume(input) {
      const record = records.get(input.context_id);
      if (
        !record ||
        record.workspace_id !== input.workspace_id ||
        record.status !== "active" ||
        record.version !== input.expected_version
      ) {
        return null;
      }
      const next = {
        ...record,
        status: "consumed" as const,
        consumed_at: input.consumed_at,
        version: record.version + 1,
        updated_at: input.consumed_at,
      };
      records.set(record.id, next);
      return next;
    },
    async revoke(input) {
      const record = records.get(input.context_id);
      if (
        !record ||
        record.workspace_id !== input.workspace_id ||
        record.status !== "active" ||
        record.version !== input.expected_version
      ) {
        return null;
      }
      const next = {
        ...record,
        status: "revoked" as const,
        revoked_at: input.revoked_at,
        version: record.version + 1,
        updated_at: input.revoked_at,
      };
      records.set(record.id, next);
      return next;
    },
  };
};
