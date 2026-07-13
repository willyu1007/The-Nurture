import { randomUUID } from "node:crypto";
import type {
  WorkflowCommandResponse,
  WorkflowRuntimePort,
  WorkflowStepLease,
  WorkflowStepResult,
} from "@my-chat/workflow-contracts";
import {
  type DevHostPrismaClient,
  Prisma,
  WorkflowApprovalStatus,
  WorkflowStepResultStatus,
} from "../db/dev-host-client.js";

const LEASE_MS = 60_000;
const json = (v: unknown): Prisma.InputJsonValue => v as Prisma.InputJsonValue;

const toResultStatus = (s?: string): WorkflowStepResultStatus =>
  s === "manual_review_required"
    ? WorkflowStepResultStatus.manual_review_required
    : s === "retry_requested"
      ? WorkflowStepResultStatus.retry_requested
      : s === "failed"
        ? WorkflowStepResultStatus.failed
        : WorkflowStepResultStatus.completed;

/**
 * Postgres-backed WorkflowRuntimePort (dev-ledger). The worker calls
 * claim_step(expected_version) then complete_step(lease.aggregate_version), so
 * each step takes two optimistic-locked version bumps. complete_step drains the
 * handler's artifact_drafts / context_bindings / event_drafts into the ledger
 * tables in ONE transaction so outbox ids + versions stay consistent.
 */
export class PgWorkflowRuntimePort implements WorkflowRuntimePort {
  constructor(private readonly prisma: DevHostPrismaClient) {}

  async claim_step(input: {
    run_id: string;
    step_id: string;
    expected_version: number;
    worker_id: string;
    meta: { workspace_id: string };
  }): Promise<WorkflowStepLease> {
    const claimToken = randomUUID();
    const expiresAt = new Date(Date.now() + LEASE_MS);
    const res = await this.prisma.workflowStep.updateMany({
      where: { id: input.step_id, runId: input.run_id, aggregateVersion: input.expected_version },
      data: { status: "running", claimToken, claimedByWorkerId: input.worker_id, claimExpiresAt: expiresAt, aggregateVersion: { increment: 1 } },
    });
    if (res.count === 0) {
      throw new Error(`claim_step CAS failed: step ${input.step_id} not at version ${input.expected_version}`);
    }
    const step = await this.prisma.workflowStep.findUniqueOrThrow({ where: { id: input.step_id } });
    return {
      run_id: input.run_id,
      step_id: input.step_id,
      step_key: step.stepKey,
      claim_token: claimToken,
      aggregate_version: step.aggregateVersion,
      expires_at: expiresAt.toISOString(),
    };
  }

  async complete_step(input: Parameters<WorkflowRuntimePort["complete_step"]>[0]): Promise<WorkflowCommandResponse<WorkflowStepResult>> {
    const ws = input.meta.workspace_id;
    return this.prisma.$transaction(async (tx) => {
      const res = await tx.workflowStep.updateMany({
        where: { id: input.step_id, runId: input.run_id, aggregateVersion: input.expected_version },
        data: {
          status: input.status ?? "completed",
          resultStatus: toResultStatus(input.status),
          claimToken: null,
          outputRefsPayload: json(input.output_refs),
          aggregateVersion: { increment: 1 },
        },
      });
      if (res.count === 0) {
        throw new Error(`complete_step CAS failed: step ${input.step_id} not at version ${input.expected_version}`);
      }
      const step = await tx.workflowStep.findUniqueOrThrow({ where: { id: input.step_id } });

      for (const a of input.artifact_drafts ?? []) {
        await tx.workflowArtifact.create({
          data: {
            runId: input.run_id,
            stepId: input.step_id,
            workspaceId: ws,
            artifactType: a.artifact_type,
            exposureLevel: a.exposure_level,
            sourceRefsPayload: json(a.source_refs),
            storageRefPayload: a.storage_ref ? json(a.storage_ref) : undefined,
            safeTitle: a.safe_title,
            safeSummary: a.safe_summary,
            status: "created",
            aggregateVersion: 1,
          },
        });
      }

      for (const b of input.context_bindings ?? []) {
        await tx.workflowContextBinding.create({
          data: {
            runId: input.run_id,
            stepId: input.step_id,
            workspaceId: ws,
            targetType: b.target_ref.kind,
            targetId: b.target_ref.id,
            targetRefPayload: json(b.target_ref),
            contextRefsPayload: json(b.context_refs),
            snapshotRefsPayload: json(b.snapshot_refs),
            status: "bound",
            aggregateVersion: 1,
          },
        });
      }

      const outboxEventIds: string[] = [];
      for (const e of input.event_drafts ?? []) {
        const row = await tx.workflowOutboxEvent.upsert({
          where: { workspaceId_idempotencyKey_eventType: { workspaceId: ws, idempotencyKey: input.meta.idempotency_key, eventType: e.event_type } },
          create: {
            workspaceId: ws,
            runId: input.run_id,
            stepId: input.step_id,
            eventType: e.event_type,
            aggregateType: e.aggregate_type,
            aggregateId: e.aggregate_id,
            aggregateVersion: e.aggregate_version,
            payload: json(e.payload),
            idempotencyKey: input.meta.idempotency_key,
            correlationId: input.meta.correlation_id,
            traceId: input.meta.trace_id,
            clientSurface: input.meta.client_surface,
            status: "pending",
          },
          update: {},
        });
        outboxEventIds.push(row.id);
      }

      // A request_approval step that pauses the run records a workflow_approval
      // (status pending) so the approve/reject action has a row to resolve.
      const requestsApproval = (input.event_drafts ?? []).some((e) => e.event_type === "workflow.approval.requested");
      if (requestsApproval) {
        const existing = await tx.workflowApproval.findFirst({ where: { runId: input.run_id, stepId: input.step_id } });
        if (!existing) {
          await tx.workflowApproval.create({
            data: {
              runId: input.run_id,
              stepId: input.step_id,
              workspaceId: ws,
              targetType: "workflow_run",
              targetId: input.run_id,
              status: WorkflowApprovalStatus.pending,
              aggregateVersion: 0,
            },
          });
        }
      }

      return {
        ok: true as const,
        data: {
          run_id: input.run_id,
          step_id: input.step_id,
          status: input.status ?? "completed",
          aggregate_version: step.aggregateVersion,
          output_refs: input.output_refs,
        },
        canonical_refs: input.output_refs,
        aggregate_versions: { [input.step_id]: step.aggregateVersion },
        action_availability: [],
        outbox_event_ids: outboxEventIds,
      };
    });
  }

  async fail_step(input: Parameters<WorkflowRuntimePort["fail_step"]>[0]): Promise<WorkflowCommandResponse<WorkflowStepResult>> {
    const status = input.retryable ? "retry_requested" : "failed";
    const res = await this.prisma.workflowStep.updateMany({
      where: { id: input.step_id, runId: input.run_id, aggregateVersion: input.expected_version },
      data: {
        status,
        resultStatus: input.retryable ? WorkflowStepResultStatus.retry_requested : WorkflowStepResultStatus.failed,
        reasonCode: input.reason_code,
        retryable: input.retryable,
        claimToken: null,
        aggregateVersion: { increment: 1 },
      },
    });
    if (res.count === 0) {
      throw new Error(`fail_step CAS failed: step ${input.step_id} not at version ${input.expected_version}`);
    }
    const step = await this.prisma.workflowStep.findUniqueOrThrow({ where: { id: input.step_id } });
    return {
      ok: true as const,
      data: { run_id: input.run_id, step_id: input.step_id, status, aggregate_version: step.aggregateVersion, output_refs: [] },
      canonical_refs: [],
      aggregate_versions: { [input.step_id]: step.aggregateVersion },
      action_availability: [],
      outbox_event_ids: [],
    };
  }
}
