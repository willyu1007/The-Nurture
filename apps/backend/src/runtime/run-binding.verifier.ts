import type {
  WorkflowRunBindingVerifier,
  WorkflowRunExecutionBinding,
  WorkflowWorkerPayload,
} from "@my-chat/workflow-runtime";
import type { DevHostPrismaClient } from "../db/dev-host-client.js";

/**
 * Dev-host implementation of the Run binding verifier the worker requires once
 * a manifest declares a `workflow_step_complete_v1` handoff — the Nurture
 * manifest's `user_attention` handoff does.
 *
 * The point of the contract is that the Run's actor is *reread from durable
 * state*, never taken from the queue payload, so a tampered or stale payload
 * cannot execute a Handoff under someone else's identity. This mirrors that in
 * the dev host: the payload supplies only the run id to look up, and every
 * other field is checked against the stored row rather than trusted.
 *
 * It is deliberately not a Host-grade implementation. The real host also pins
 * the workflow version and the Handoff contract; here the dev-host database is
 * the only source of truth available, so this verifies exactly what that row
 * can prove and fails closed otherwise.
 */
export const createDevHostRunBindingVerifier = (
  prisma: DevHostPrismaClient,
): WorkflowRunBindingVerifier => ({
  async assert_pinned_binding(
    input: WorkflowWorkerPayload & { require_handoff_contract: boolean },
  ): Promise<WorkflowRunExecutionBinding> {
    const run = await prisma.workflowRun.findUnique({
      where: { id: input.run_id },
      select: {
        workspaceId: true,
        scenarioKey: true,
        capabilityKey: true,
        entrypointKey: true,
        actorId: true,
      },
    });
    if (!run) {
      throw new Error(`run binding: unknown run ${input.run_id}`);
    }

    // Every payload field the stored row can contradict is checked, so a
    // payload that names a real run but lies about its scope is rejected
    // rather than silently executed.
    const mismatches = (
      [
        ["workspace_id", run.workspaceId, input.workspace_id],
        ["scenario_key", run.scenarioKey, input.scenario_key],
        ["capability_key", run.capabilityKey, input.capability_key],
        ["entrypoint_key", run.entrypointKey, input.entrypoint_key],
      ] as const
    ).filter(([, stored, claimed]) => stored !== claimed);
    if (mismatches.length > 0) {
      const detail = mismatches
        .map(([field, stored, claimed]) => `${field} stored=${stored} payload=${claimed}`)
        .join("; ");
      throw new Error(`run binding mismatch for run ${input.run_id}: ${detail}`);
    }

    // `actor_id` is optional in `WorkflowRunExecutionBinding`, so an
    // actorless run is legal and the dev host creates them: its runs start
    // from an internal endpoint with no authenticated principal. Requiring an
    // actor here would be inventing a rule the contract does not make. What
    // the contract does require — that the actor come from durable state and
    // never from the payload — is satisfied by reading it from the row above
    // and by ignoring any actor the payload might carry.
    return run.actorId ? { actor_id: run.actorId } : {};
  },
});
