import type { WorkflowRuntimePort, WorkflowScenarioModule } from "@my-chat/workflow-contracts";
import { nurtureActions } from "./actions/shared-actions.js";
import { nurtureAdapters } from "./adapters/chat-workflow.adapter.js";
import { createNurtureHandlers, nurtureHandlers } from "./handlers/p0-handlers.js";
import { defaultNurtureDeps, type NurtureHandlerDeps, type NurturePresenterDeps } from "./deps.js";
import { createNurturePolicies, nurturePolicies } from "./policies.js";
import { createNurturePresenters, nurturePresenters } from "./presenters.js";
import { nurtureInternalApiHandlers, nurtureScenarioManifest } from "./registry.js";
import { createInstitutionInternalApiHandlers } from "./institution-surfaces.js";

// Static module bound to synthetic default deps — used by conformance/journey
// tests and any importer that does not wire a host.
export const nurtureScenarioModule: WorkflowScenarioModule = {
  manifest: nurtureScenarioManifest,
  handlers: nurtureHandlers,
  actions: nurtureActions,
  adapters: nurtureAdapters,
  presenters: nurturePresenters,
  policies: nurturePolicies,
  internal_api_handlers: {
    ...nurtureInternalApiHandlers,
    ...createInstitutionInternalApiHandlers(defaultNurtureDeps),
  },
};

export type NurtureScenarioModuleDeps = {
  /** Resolver + repository ports for handlers and policies. */
  handlerDeps: NurtureHandlerDeps;
  /** Pre-redacted artifact-preview port for presenters. */
  presenterDeps: NurturePresenterDeps;
  /** Host-owned (Postgres) runtime port that persists claim/complete/fail. */
  workerRuntime: WorkflowRuntimePort;
};

/**
 * Build a fully-bound scenario module for the host (P3). Every handler/policy/
 * presenter closure is bound to the injected deps at construction time, because
 * the registry descriptor deep-freezes the module. The host's Postgres runtime
 * port replaces the synthetic in-memory worker_runtime adapter.
 */
export const createNurtureScenarioModule = (deps: NurtureScenarioModuleDeps): WorkflowScenarioModule => ({
  manifest: nurtureScenarioManifest,
  handlers: createNurtureHandlers(deps.handlerDeps),
  actions: nurtureActions,
  adapters: { ...nurtureAdapters, worker_runtime: deps.workerRuntime },
  presenters: createNurturePresenters(nurtureScenarioManifest, deps.presenterDeps),
  policies: createNurturePolicies(deps.handlerDeps),
  internal_api_handlers: {
    ...nurtureInternalApiHandlers,
    ...createInstitutionInternalApiHandlers(deps.handlerDeps),
  },
});
