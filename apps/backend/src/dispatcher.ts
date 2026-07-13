import type { WorkflowRegistry, WorkflowWorker, WorkflowWorkerPayload } from "@my-chat/workflow-runtime";
import { type DevHostPrismaClient, WorkflowStepResultStatus } from "./db/dev-host-client.js";

const MAX_STEP_RETRIES = 3;

type RunRow = {
  id: string;
  workspaceId: string;
  scenarioKey: string;
  capabilityKey: string;
  entrypointKey: string;
  correlationId: string | null;
  traceId: string | null;
};
type StepRow = { id: string; stepKey: string; stepOrder: number; status: string; aggregateVersion: number };

/**
 * Dev step dispatcher: polls workflow_step and drives the next runnable step
 * through the WorkflowWorker (which claims/runs/completes via the module's
 * Postgres runtime port). A run is paused while any step is manual_review_required
 * (approval / safety escalation) and completed when all steps are completed.
 */
export class StepDispatcher {
  private timer?: ReturnType<typeof setInterval>;
  private busy = false;
  // Per-step retry budget (in-memory; dev harness). Bounds retry_requested
  // re-dispatch so a persistently-failing step halts instead of hanging.
  private readonly retryAttempts = new Map<string, number>();

  constructor(
    private readonly prisma: DevHostPrismaClient,
    private readonly registry: WorkflowRegistry,
    private readonly worker: WorkflowWorker,
  ) {}

  start(intervalMs = 300): void {
    this.timer = setInterval(() => void this.tick(), intervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** One guarded global tick (no overlap). Returns whether a step was dispatched. */
  async tick(): Promise<boolean> {
    if (this.busy) return false;
    this.busy = true;
    try {
      return await this.runOnce();
    } finally {
      this.busy = false;
    }
  }

  /**
   * Drive to quiescence. Pass a runId to scope to a single run — required for
   * deterministic tests where multiple dispatchers share one Postgres (an
   * unscoped drain would race other runs' steps).
   */
  async drain(runId?: string, maxSteps = 50): Promise<void> {
    for (let i = 0; i < maxSteps; i++) {
      if (!(await this.runOnce(runId))) return;
    }
  }

  async runOnce(runId?: string): Promise<boolean> {
    const found = await this.nextRunnableStep(runId);
    if (!found) return false;
    await this.dispatch(found.run, found.step);
    return true;
  }

  private async nextRunnableStep(runId?: string): Promise<{ run: RunRow; step: StepRow } | null> {
    const runs = (await this.prisma.workflowRun.findMany({
      where: runId ? { id: runId, status: "running" } : { status: "running" },
      orderBy: { createdAt: "asc" },
    })) as RunRow[];
    for (const run of runs) {
      const steps = (await this.prisma.workflowStep.findMany({ where: { runId: run.id }, orderBy: { stepOrder: "asc" } })) as StepRow[];
      if (steps.some((s) => s.status === "manual_review_required" || s.status === "failed")) continue; // paused / halted
      const next = steps.find((s) => s.status !== "completed");
      if (!next) {
        // version/status-guarded so a concurrent cancel/reject is not clobbered.
        await this.prisma.workflowRun.updateMany({ where: { id: run.id, status: "running" }, data: { status: "completed", aggregateVersion: { increment: 1 } } });
        continue;
      }
      if (next.status === "pending") return { run, step: next };
      if (next.status === "retry_requested") {
        const attempts = (this.retryAttempts.get(next.id) ?? 0) + 1;
        this.retryAttempts.set(next.id, attempts);
        if (attempts > MAX_STEP_RETRIES) {
          // exhausted: halt the run on this step instead of looping forever.
          await this.prisma.workflowStep.update({
            where: { id: next.id },
            data: { status: "failed", resultStatus: WorkflowStepResultStatus.failed, reasonCode: "retry_exhausted", aggregateVersion: { increment: 1 } },
          });
          continue;
        }
        await this.prisma.workflowStep.update({ where: { id: next.id }, data: { status: "pending", aggregateVersion: { increment: 1 } } });
        const refreshed = (await this.prisma.workflowStep.findUniqueOrThrow({ where: { id: next.id } })) as StepRow;
        return { run, step: refreshed };
      }
      // status running: in-flight, leave for a later tick
    }
    return null;
  }

  private async dispatch(run: RunRow, step: StepRow): Promise<void> {
    const scenario = this.registry.scenarios.get(run.scenarioKey);
    if (!scenario) throw new Error(`scenario not registered: ${run.scenarioKey}`);
    const capability = scenario.manifest.capabilities.find((c) => c.capability_key === run.capabilityKey);
    const entrypoint = capability?.entrypoints.find((e) => e.entrypoint_key === run.entrypointKey);
    const mstep = entrypoint?.steps.find((s) => s.step_key === step.stepKey);
    if (!entrypoint || !mstep) throw new Error(`manifest step not found: ${run.capabilityKey}/${run.entrypointKey}/${step.stepKey}`);
    const workflowVersionId =
      entrypoint.workflow_version_id ?? `${run.scenarioKey}:${run.capabilityKey}:${run.entrypointKey}:v${entrypoint.workflow_version}`;

    const payload: WorkflowWorkerPayload = {
      workspace_id: run.workspaceId,
      run_id: run.id,
      step_id: step.id,
      expected_step_version: step.aggregateVersion,
      scenario_key: run.scenarioKey,
      capability_key: run.capabilityKey,
      entrypoint_key: run.entrypointKey,
      workflow_version_id: workflowVersionId,
      step_key: step.stepKey,
      handler_key: mstep.handler_key,
      contract_hash: scenario.contract_hash,
      worker_id: "dev-worker",
      correlation_id: run.correlationId ?? run.id,
      trace_id: run.traceId ?? undefined,
    };
    await this.worker.run(payload);
  }
}
