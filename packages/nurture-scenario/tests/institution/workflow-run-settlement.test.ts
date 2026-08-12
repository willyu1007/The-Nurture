import { describe, expect, it } from "vitest";
import {
  createNurtureWorkflowRunSettlementOwner,
  workflowRunSettlementBinding,
  type NurtureWorkflowRunReservationEvidenceV1,
  type NurtureWorkflowRunSettlementBindingV1,
  type NurtureWorkflowRunSettlementRecordV1,
  type NurtureWorkflowRunSettlementRepositoryV1,
} from "../../src/domain/institution/workflow-run-settlement.js";

const request = Object.freeze({
  workspace_id: "workspace-1",
  command_request_id: "nurture-command-1",
  host_reservation: Object.freeze({
    evidence_version: 1 as const,
    logical_operation_id: "logical-operation-1",
    reservation_ref: Object.freeze({
      schema_version: 1 as const,
      namespace: "my_chat",
      object_type: "workflow_run_reservation",
      object_id: "reservation-1",
      version: 1,
    }),
    run_ref: Object.freeze({
      schema_version: 1 as const,
      namespace: "my_chat",
      object_type: "workflow_run",
      object_id: "run-1",
    }),
    binding_fingerprint_sha256: "a".repeat(64),
    reservation_evidence_sha256: "b".repeat(64),
  } satisfies NurtureWorkflowRunReservationEvidenceV1),
});

describe("Nurture Workflow Run settlement owner", () => {
  it("registers only opaque hashes and replays the same unknown settlement", async () => {
    const repository = new MemorySettlementRepository();
    const owner = createNurtureWorkflowRunSettlementOwner({ repository });

    const first = await owner.register(request);
    const replay = await owner.register(request);

    expect(first).toEqual({
      status: "prepared",
      disposition: "created",
      settlement_ref: settlementRef(1),
      run_ref: runRef(),
      outcome: "unknown",
    });
    expect(replay).toEqual({ ...first, disposition: "replayed" });
    expect(JSON.stringify(repository.record)).not.toMatch(
      /logical-operation-1|nurture-command-1|prospective|contact|participant|child|family/u,
    );
  });

  it("returns committed history without rechecking current authority or prepared TTL", async () => {
    const repository = new MemorySettlementRepository();
    const owner = createNurtureWorkflowRunSettlementOwner({ repository });
    await owner.register(request);
    repository.commit("execution-1");

    const status = await owner.readStatus(request);
    expect(status).toEqual({
      status: "committed",
      settlement_ref: settlementRef(2),
      run_ref: runRef(),
      outcome: "committed",
      proof: {
        proof_version: 1,
        outcome: "committed",
        writer_fence_receipt_ref: "receipt-1",
        receipt_sha256: "c".repeat(64),
      },
    });

    const replay = await owner.register(request);
    expect(replay).toEqual({ ...status, disposition: "replayed" });
  });

  it("returns confirmed-no-effect only after the repository writer fence settles it", async () => {
    const repository = new MemorySettlementRepository();
    const owner = createNurtureWorkflowRunSettlementOwner({ repository });
    await owner.register(request);

    const settled = await owner.confirmNoEffect(request);
    expect(settled).toMatchObject({
      status: "confirmed_no_effect",
      outcome: "confirmed_no_effect",
      proof: {
        outcome: "confirmed_no_effect",
        writer_fence_receipt_ref: "receipt-no-effect-1",
        receipt_sha256: "d".repeat(64),
      },
    });
    await expect(owner.confirmNoEffect(request)).resolves.toEqual(settled);
  });

  it("fails closed on semantic drift, malformed Host refs and owner outage", async () => {
    const repository = new MemorySettlementRepository();
    const owner = createNurtureWorkflowRunSettlementOwner({ repository });
    await owner.register(request);

    await expect(owner.register({
      ...request,
      host_reservation: {
        ...request.host_reservation,
        run_ref: { ...request.host_reservation.run_ref, object_id: "run-2" },
      },
    })).resolves.toEqual({
      status: "denied",
      reason_code: "workflow_run_settlement_binding_conflict",
    });

    await expect(owner.readStatus({
      ...request,
      host_reservation: {
        ...request.host_reservation,
        reservation_ref: {
          ...request.host_reservation.reservation_ref,
          namespace: "nurture",
        },
      } as never,
    })).resolves.toEqual({
      status: "denied",
      reason_code: "workflow_run_settlement_request_invalid",
    });

    const unavailable = createNurtureWorkflowRunSettlementOwner({
      repository: {
        register: async () => { throw new Error("db unavailable"); },
        read: async () => { throw new Error("db unavailable"); },
        confirmNoEffect: async () => { throw new Error("db unavailable"); },
      },
    });
    await expect(unavailable.readStatus(request)).resolves.toEqual({
      status: "unavailable",
      reason_code: "workflow_run_settlement_owner_unavailable",
    });
  });

  it("derives the exact command-writer hash used by the command kernel", () => {
    const binding = workflowRunSettlementBinding(request);
    expect(binding).toMatchObject({
      workspace_id: "workspace-1",
      run_object_id: "run-1",
      command_key: "nurture.start_enrollment_inquiry",
      binding_fingerprint_sha256: "a".repeat(64),
      reservation_evidence_sha256: "b".repeat(64),
    });
    expect(binding?.logical_operation_id_hash).toMatch(/^[0-9a-f]{64}$/u);
    expect(binding?.command_request_id_hash).toMatch(/^[0-9a-f]{64}$/u);
  });
});

class MemorySettlementRepository implements NurtureWorkflowRunSettlementRepositoryV1 {
  record?: NurtureWorkflowRunSettlementRecordV1;

  async register(input: NurtureWorkflowRunSettlementBindingV1) {
    if (this.record) {
      return sameBinding(this.record, input)
        ? { disposition: "replayed" as const, record: this.record }
        : { disposition: "conflict" as const };
    }
    this.record = {
      ...input,
      settlement_id: "settlement-1",
      state: "prepared",
      aggregate_version: 1,
      prepared_at: "2026-08-12T08:00:00.000Z",
    };
    return { disposition: "created" as const, record: this.record };
  }

  async read(input: NurtureWorkflowRunSettlementBindingV1) {
    return this.record && sameBinding(this.record, input) ? this.record : null;
  }

  async confirmNoEffect(input: NurtureWorkflowRunSettlementBindingV1) {
    if (!this.record) return { disposition: "not_found" as const };
    if (!sameBinding(this.record, input)) return { disposition: "conflict" as const };
    if (this.record.state !== "prepared") {
      return { disposition: "replayed" as const, record: this.record };
    }
    this.record = {
      ...this.record,
      state: "confirmed_no_effect",
      settlement_receipt_ref: "receipt-no-effect-1",
      settlement_evidence_sha256: "d".repeat(64),
      aggregate_version: 2,
      confirmed_no_effect_at: "2026-08-12T08:01:00.000Z",
    };
    return { disposition: "settled" as const, record: this.record };
  }

  commit(executionId: string) {
    if (!this.record) throw new Error("not registered");
    this.record = {
      ...this.record,
      state: "committed",
      command_execution_id: executionId,
      settlement_receipt_ref: "receipt-1",
      settlement_evidence_sha256: "c".repeat(64),
      aggregate_version: 2,
      committed_at: "2026-08-12T08:01:00.000Z",
    };
  }
}

function sameBinding(
  record: NurtureWorkflowRunSettlementRecordV1,
  binding: NurtureWorkflowRunSettlementBindingV1,
) {
  return (Object.keys(binding) as Array<keyof NurtureWorkflowRunSettlementBindingV1>)
    .every((key) => record[key] === binding[key]);
}

function settlementRef(version: number) {
  return {
    schema_version: 1,
    namespace: "nurture",
    object_type: "workflow_run_settlement",
    object_id: "settlement-1",
    version,
  };
}

function runRef() {
  return {
    schema_version: 1,
    namespace: "my_chat",
    object_type: "workflow_run",
    object_id: "run-1",
  };
}
