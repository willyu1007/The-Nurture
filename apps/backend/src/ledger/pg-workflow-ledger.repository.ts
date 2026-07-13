import type { WorkflowCommandMeta, WorkflowCommandResponse, WorkflowRunRef } from "@my-chat/workflow-contracts";
import type { WorkflowLedgerRepository, WorkflowRegistry } from "@my-chat/workflow-runtime";
import { type DevHostPrismaClient, Prisma } from "../db/dev-host-client.js";

const json = (v: unknown): Prisma.InputJsonValue => v as Prisma.InputJsonValue;

const entrypointWorkflowVersionId = (input: {
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  workflow_version: number;
  workflow_version_id?: string;
}): string => input.workflow_version_id ?? `${input.scenario_key}:${input.capability_key}:${input.entrypoint_key}:v${input.workflow_version}`;

/** Postgres dev-ledger: start_run inserts the run + seeds steps from the manifest; get_run reads it back. */
export class PgWorkflowLedgerRepository implements WorkflowLedgerRepository {
  constructor(private readonly prisma: DevHostPrismaClient, private readonly registry: WorkflowRegistry) {}

  async start_run(input: {
    scenario_key: string;
    capability_key: string;
    entrypoint_key: string;
    requirement_values: Record<string, unknown>;
    meta: WorkflowCommandMeta;
  }): Promise<WorkflowCommandResponse<WorkflowRunRef>> {
    const scenario = this.registry.scenarios.get(input.scenario_key);
    if (!scenario) throw new Error(`scenario not registered: ${input.scenario_key}`);
    const capability = scenario.manifest.capabilities.find((c) => c.capability_key === input.capability_key);
    const entrypoint = capability?.entrypoints.find((e) => e.entrypoint_key === input.entrypoint_key);
    if (!capability || !entrypoint) throw new Error(`entrypoint not found: ${input.capability_key}/${input.entrypoint_key}`);
    const workflowVersionId = entrypointWorkflowVersionId({
      scenario_key: input.scenario_key,
      capability_key: input.capability_key,
      entrypoint_key: input.entrypoint_key,
      workflow_version: entrypoint.workflow_version,
      workflow_version_id: entrypoint.workflow_version_id,
    });

    const existing = await this.prisma.workflowRun.findFirst({
      where: { workspaceId: input.meta.workspace_id, idempotencyKey: input.meta.idempotency_key },
    });

    const run =
      existing ??
      (await this.prisma.$transaction(async (tx) => {
        const created = await tx.workflowRun.create({
          data: {
            workspaceId: input.meta.workspace_id,
            scenarioKey: input.scenario_key,
            capabilityKey: input.capability_key,
            entrypointKey: input.entrypoint_key,
            workflowVersionId,
            status: "running",
            aggregateVersion: 0,
            actorId: input.meta.actor_id,
            requirementValuesPayload: json(input.requirement_values),
            idempotencyKey: input.meta.idempotency_key,
            correlationId: input.meta.correlation_id,
            traceId: input.meta.trace_id,
            clientSurface: input.meta.client_surface,
          },
        });
        await tx.workflowStep.createMany({
          data: entrypoint.steps.map((s) => ({
            runId: created.id,
            workspaceId: input.meta.workspace_id,
            stepKey: s.step_key,
            stepOrder: s.order,
            status: "pending",
            aggregateVersion: 0,
          })),
        });
        await tx.workflowOutboxEvent.create({
          data: {
            workspaceId: input.meta.workspace_id,
            runId: created.id,
            eventType: "workflow.run.created",
            aggregateType: "workflow_run",
            aggregateId: created.id,
            aggregateVersion: 0,
            payload: json({ body: "no_body", pii: "no_pii", signal_version: 1, run_id: created.id, scenario_key: input.scenario_key }),
            idempotencyKey: `${created.id}:run.created`,
            correlationId: input.meta.correlation_id,
            traceId: input.meta.trace_id,
            clientSurface: input.meta.client_surface,
            status: "pending",
          },
        });
        return created;
      }));

    const data: WorkflowRunRef = {
      run_id: run.id,
      scenario_key: input.scenario_key,
      capability_key: input.capability_key,
      entrypoint_key: input.entrypoint_key,
      workflow_version_id: workflowVersionId,
      status: run.status,
      aggregate_version: run.aggregateVersion,
    };
    return {
      ok: true,
      data,
      canonical_refs: [{ kind: "workflow_run", id: run.id, version: run.aggregateVersion }],
      aggregate_versions: { [run.id]: run.aggregateVersion },
      action_availability: [],
      outbox_event_ids: [],
    };
  }

  async get_run(input: { workspace_id: string; run_id: string }): Promise<WorkflowRunRef | null> {
    const run = await this.prisma.workflowRun.findFirst({ where: { id: input.run_id, workspaceId: input.workspace_id } });
    if (!run) return null;
    return {
      run_id: run.id,
      scenario_key: run.scenarioKey,
      capability_key: run.capabilityKey,
      entrypoint_key: run.entrypointKey,
      workflow_version_id: run.workflowVersionId,
      status: run.status,
      aggregate_version: run.aggregateVersion,
    };
  }
}
