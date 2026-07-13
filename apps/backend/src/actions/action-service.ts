import {
  type DevHostPrismaClient,
  WorkflowApprovalStatus,
  WorkflowStepResultStatus,
} from "../db/dev-host-client.js";

export type WorkflowActionInput = {
  workspace_id: string;
  run_id: string;
  action: "approve" | "reject" | "cancel" | string;
  reason_code?: string;
};

export type WorkflowActionResult = {
  ok: boolean;
  action: string;
  run_id: string;
  resolved_step_id?: string;
  reason?: string;
};

/**
 * Host-owned strong-confirmed actions. approve resolves a pending workflow_approval
 * and completes the request_approval step so the dispatcher resumes the run;
 * reject/cancel resolve the approval and cancel the run. (The scenario's chat/web
 * adapters are presentation-only; the authoritative state lives in the ledger.)
 */
export class WorkflowActionService {
  constructor(private readonly prisma: DevHostPrismaClient) {}

  async execute(input: WorkflowActionInput): Promise<WorkflowActionResult> {
    const approval = await this.prisma.workflowApproval.findFirst({
      where: { runId: input.run_id, workspaceId: input.workspace_id, status: WorkflowApprovalStatus.pending },
    });

    if (input.action === "approve") {
      if (!approval) return { ok: false, action: input.action, run_id: input.run_id, reason: "no_pending_approval" };
      await this.prisma.workflowApproval.update({
        where: { id: approval.id },
        data: { status: WorkflowApprovalStatus.approved, action: "approve", resolvedAt: new Date() },
      });
      if (approval.stepId) {
        // unblock: complete the request_approval step so the dispatcher advances.
        await this.prisma.workflowStep.updateMany({
          where: { id: approval.stepId, runId: input.run_id },
          data: { status: "completed", resultStatus: WorkflowStepResultStatus.completed, aggregateVersion: { increment: 1 } },
        });
      }
      return { ok: true, action: "approve", run_id: input.run_id, resolved_step_id: approval.stepId ?? undefined };
    }

    if (input.action === "reject" || input.action === "cancel") {
      // Revoke ANY non-terminal approval (pending OR already approved) so a
      // cancelled run can never keep reporting guardian_approved=true.
      await this.prisma.workflowApproval.updateMany({
        where: { runId: input.run_id, workspaceId: input.workspace_id, status: { in: [WorkflowApprovalStatus.pending, WorkflowApprovalStatus.approved] } },
        data: { status: WorkflowApprovalStatus.rejected, action: input.action, reasonCode: input.reason_code, resolvedAt: new Date() },
      });
      await this.prisma.workflowRun.update({ where: { id: input.run_id }, data: { status: "cancelled" } });
      return { ok: true, action: input.action, run_id: input.run_id, resolved_step_id: approval?.stepId ?? undefined };
    }

    return { ok: false, action: input.action, run_id: input.run_id, reason: "unsupported_action" };
  }
}
