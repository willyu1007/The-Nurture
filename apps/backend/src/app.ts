import {
  loadWorkflowRegistry,
  createScenarioCommandDriverContext,
  createWorkflowHandoffDraftsFromScenarioSnapshots,
  WorkflowCommandService,
  WorkflowQueryService,
  WorkflowWorker,
  type WorkflowRegistry,
} from "@my-chat/workflow-runtime";
import type { WorkflowPresenters } from "@my-chat/workflow-contracts";
import { createNurtureScenarioModule } from "@the-nurture/scenario";
import {
  resolveNurtureUserAttention,
  type NurtureUserAttentionResolution,
} from "@the-nurture/scenario";
import type { DomainContextRef } from "@my-chat/workflow-contracts";
import { createNurtureRepositories, createPrismaClient, createScenarioRepositories, type NurturePrismaClient } from "@the-nurture/db";
import { createDevHostPrismaClient, type DevHostPrismaClient } from "./db/dev-host-client.js";
import { MockCanonicalObjectResolver, PgArtifactPreviewPort, PgRunContextPort } from "./deps/mock-deps.js";
import { PgWorkflowRuntimePort } from "./runtime/pg-workflow-runtime.port.js";
import { PgWorkflowLedgerRepository } from "./ledger/pg-workflow-ledger.repository.js";
import { WorkflowActionService } from "./actions/action-service.js";
import { StepDispatcher } from "./dispatcher.js";
import { devHostSnapshot } from "./host-snapshot.js";

export type NurtureApp = {
  nurturePrisma: NurturePrismaClient;
  devHostPrisma: DevHostPrismaClient;
  registry: WorkflowRegistry;
  command: WorkflowCommandService;
  query: WorkflowQueryService;
  actions: WorkflowActionService;
  dispatcher: StepDispatcher;
  artifacts: PgArtifactPreviewPort;
  /** Exposure-gated presenters (the redaction boundary for artifact reads). */
  presenters: WorkflowPresenters;
  /** Scenario-table repos (projects/captures/...) for the internal API (B3). */
  scenarioRepositories: ReturnType<typeof createScenarioRepositories>;
  resolveUserAttention(input: {
    workspace_id: string;
    source_context_refs: readonly DomainContextRef[];
    actor_user_id?: string;
  }): Promise<NurtureUserAttentionResolution>;
  disconnect(): Promise<void>;
};

/**
 * Build the dev host with two explicit persistence clients. Nurture repositories
 * use the production client; workflow runtime/ledger/artifact ports use only the
 * backend-private dev-host client. There is no cross-database transaction.
 */
export const createNurtureApp = (
  opts: { nurtureDatabaseUrl?: string; devHostDatabaseUrl?: string } = {},
): NurtureApp => {
  const nurturePrisma = createPrismaClient(opts.nurtureDatabaseUrl);
  const devHostPrisma = createDevHostPrismaClient(opts.devHostDatabaseUrl);

  const workerRuntime = new PgWorkflowRuntimePort(devHostPrisma);
  const canonicalResolver = new MockCanonicalObjectResolver(devHostPrisma);
  const runContext = new PgRunContextPort(devHostPrisma);
  const artifacts = new PgArtifactPreviewPort(devHostPrisma);
  const repositories = createNurtureRepositories(nurturePrisma);
  const handlerDeps = {
    repositories,
    canonicalResolver,
    runContext,
    scenarioCommandBridge: {
      createDriverContext: createScenarioCommandDriverContext,
      createHandoffDrafts: createWorkflowHandoffDraftsFromScenarioSnapshots,
    },
  };

  const module = createNurtureScenarioModule({
    handlerDeps,
    presenterDeps: { artifacts },
    workerRuntime,
  });

  const registry = loadWorkflowRegistry({ modules: [module], host_snapshot: devHostSnapshot });
  const scenario = registry.scenarios.get("nurture");
  if (!scenario) throw new Error("nurture scenario failed to register");
  const presenters = scenario.presenters;
  const ledger = new PgWorkflowLedgerRepository(devHostPrisma, registry);
  const command = new WorkflowCommandService(ledger);
  const query = new WorkflowQueryService(ledger);
  const actions = new WorkflowActionService(devHostPrisma);
  const worker = new WorkflowWorker(registry, workerRuntime);
  const dispatcher = new StepDispatcher(devHostPrisma, registry, worker);

  return {
    nurturePrisma,
    devHostPrisma,
    registry,
    command,
    query,
    actions,
    dispatcher,
    artifacts,
    presenters,
    scenarioRepositories: createScenarioRepositories(nurturePrisma),
    resolveUserAttention: (input) => resolveNurtureUserAttention(handlerDeps, input),
    async disconnect() {
      await Promise.all([nurturePrisma.$disconnect(), devHostPrisma.$disconnect()]);
    },
  };
};
