import type {
  CanonicalRef,
  DomainContextRef,
  WorkflowHandoffDraft,
  WorkflowStepHandler,
  WorkflowStepHandlerInput,
  WorkflowStepHandlerResult,
} from "@my-chat/workflow-contracts";
import type {
  NurtureHandlerDeps,
  NurtureScenarioCommandBridgePort,
} from "../deps.js";
import { NurtureCommandRunner } from "../domain/commands/command-kernel.js";
import {
  familyInputRouteCommandKey,
  familyInputRouteSpec,
} from "../domain/institution/family-care-commands.js";
import {
  emitNurtureCommandTelemetry,
  type NurtureCommandTelemetryOutcome,
} from "../observability/institution-workflow-telemetry.js";

const workflowResult = (
  status: "retry_requested" | "manual_review_required",
  reasonCode: string,
): WorkflowStepHandlerResult => ({
  status,
  output_refs: [],
  handoff_drafts: [],
  reason_code: reasonCode,
});

const childCareProcessRef = (objectId: string): DomainContextRef => ({
  namespace: "nurture",
  consumer_scenario_key: "nurture",
  object_type: "child_care_process",
  object_id: objectId,
  owner_scope: "workspace",
});

const executionRefToCanonical = (ref: DomainContextRef): CanonicalRef => ({
  kind: "domain_context_ref",
  id: `nurture:command_execution:${ref.object_id}`,
  ...(ref.version !== undefined ? { version: ref.version } : {}),
});

const createDriver = (
  bridge: NurtureScenarioCommandBridgePort,
  input: WorkflowStepHandlerInput,
) => {
  try {
    return {
      status: "ready" as const,
      driver: bridge.createDriverContext(input),
    };
  } catch {
    return { status: "invalid" as const };
  }
};

/**
 * X4 live handler. The canonical manifest advertises it only through the
 * activation module; default/static/dev-host composition remains
 * pre-activation. Business command resolution stays scenario-owned; transient
 * Step evidence and draft mapping stay host-injected.
 */
export const makeCaptureFamilyInput = (deps: NurtureHandlerDeps): WorkflowStepHandler =>
  async (input) => {
    const nowMs = deps.institutionWorkflowTelemetry?.nowMs ?? Date.now;
    const startedAtMs = nowMs();
    const finish = (
      result: WorkflowStepHandlerResult,
      outcome: NurtureCommandTelemetryOutcome,
      contextRefCount = 0,
    ): WorkflowStepHandlerResult => {
      emitNurtureCommandTelemetry({
        commandKey: familyInputRouteCommandKey,
        outcome,
        contextRefCount,
        llmCallCount: 0,
        cacheHitCount: 0,
        startedAtMs,
        finishedAtMs: nowMs(),
        telemetry: deps.institutionWorkflowTelemetry,
      });
      return result;
    };

    try {
      const bridge = deps.scenarioCommandBridge;
      if (!bridge) {
        return finish(
          workflowResult(
            "manual_review_required",
            "workflow_handoff_bridge_unavailable",
          ),
          "manual_review_required",
        );
      }
      const driver = createDriver(bridge, input);
      if (driver.status === "invalid") {
        return finish(
          workflowResult(
            "manual_review_required",
            "invalid_durable_handoff_driver",
          ),
          "manual_review_required",
        );
      }
      if (!deps.familyInputWorkflow) {
        return finish(
          workflowResult(
            "manual_review_required",
            "family_input_workflow_not_configured",
          ),
          "manual_review_required",
        );
      }

      const command = await deps.familyInputWorkflow.resolveCommand({
        workspace_id: input.meta.workspace_id,
        run_id: input.run_id,
        step_id: input.step_id,
        ...(input.meta.actor_id ? { actor_id: input.meta.actor_id } : {}),
        correlation_id: input.meta.correlation_id,
      });
      if (!command) {
        return finish(
          workflowResult(
            "retry_requested",
            "family_input_workflow_source_unavailable",
          ),
          "retry_requested",
        );
      }

      const result = await new NurtureCommandRunner(
        deps.repositories.commands,
      ).execute({
        workspace_id: input.meta.workspace_id,
        invocation_request_id: command.invocation_request_id,
        command_request_id: command.command_request_id,
        business_actor_ref: command.payload.participant_id,
        primary_scope_ref: childCareProcessRef(
          command.payload.child_care_process_id,
        ),
        child_care_process_id: command.payload.child_care_process_id,
        handoff_activation: {
          request_id: command.handoff_request_id,
          ...(command.handoff_expires_at
            ? { expires_at: command.handoff_expires_at }
            : {}),
          driver_context: driver.driver,
        },
        payload: command.payload,
        spec: familyInputRouteSpec,
      });

      if (result.status === "not_committed") {
        const retryable =
          result.decision === "command_busy" ||
          result.decision === "technical_error";
        return finish(
          workflowResult(
            retryable ? "retry_requested" : "manual_review_required",
            result.reason_code,
          ),
          retryable ? "retry_requested" : "manual_review_required",
        );
      }

      if (result.handoff_request_snapshots.length === 0) {
        return finish(
          workflowResult(
            "manual_review_required",
            "missing_handoff_replay_seed",
          ),
          "manual_review_required",
        );
      }

      let handoffDrafts: WorkflowHandoffDraft[];
      try {
        handoffDrafts = bridge.createHandoffDrafts(
          result.handoff_request_snapshots,
        );
      } catch {
        return finish(
          workflowResult(
            "manual_review_required",
            "invalid_handoff_replay_seed",
          ),
          "manual_review_required",
        );
      }
      if (handoffDrafts.length !== result.handoff_request_snapshots.length) {
        return finish(
          workflowResult(
            "manual_review_required",
            "invalid_handoff_replay_seed",
          ),
          "manual_review_required",
        );
      }

      const contextRefCount = result.handoff_request_snapshots.reduce(
        (count, snapshot) => count + (snapshot.sourceContextRefs?.length ?? 0),
        0,
      );
      return finish(
        {
          status: "completed",
          output_refs: [executionRefToCanonical(result.execution_ref)],
          handoff_drafts: handoffDrafts,
        },
        result.disposition === "replayed" ? "replayed" : "completed",
        contextRefCount,
      );
    } catch (error) {
      emitNurtureCommandTelemetry({
        commandKey: familyInputRouteCommandKey,
        outcome: "failed",
        contextRefCount: 0,
        llmCallCount: 0,
        cacheHitCount: 0,
        startedAtMs,
        finishedAtMs: nowMs(),
        errorClass: error instanceof Error ? error.name : typeof error,
        telemetry: deps.institutionWorkflowTelemetry,
      });
      throw error;
    }
  };
