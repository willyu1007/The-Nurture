import type {
  WorkflowRuntimePort,
  WorkflowScenarioModule,
} from "@my-chat/workflow-contracts";
import { nurtureActions } from "./actions/shared-actions.js";
import { nurtureAdapters } from "./adapters/chat-workflow.adapter.js";
import { createNurtureHandlers, nurtureHandlers } from "./handlers/p0-handlers.js";
import {
  defaultNurtureDeps,
  type NurtureHandlerDeps,
  type NurturePresenterDeps,
} from "./deps.js";
import { createNurturePolicies, nurturePolicies } from "./policies.js";
import { createNurturePresenters, nurturePresenters } from "./presenters.js";
import {
  nurtureInternalApiHandlers,
  nurtureScenarioManifest,
} from "./registry.js";
import { createInstitutionInternalApiHandlers } from "./institution-surfaces.js";
import {
  createNurtureEnrollmentJourneyInternalApiHandlers,
  defaultNurtureEnrollmentJourneySurfaceDeps,
  type NurtureEnrollmentJourneySurfaceDeps,
} from "./enrollment-journey-surfaces.js";

/**
 * Canonical default-off production module. The manifest contains no activation
 * state, and all legacy capabilities remain explicitly disabled.
 */
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
    ...createNurtureEnrollmentJourneyInternalApiHandlers(
      defaultNurtureEnrollmentJourneySurfaceDeps,
    ),
  },
};

export type NurtureScenarioModuleDeps = {
  handlerDeps: NurtureHandlerDeps;
  presenterDeps: NurturePresenterDeps;
  workerRuntime: WorkflowRuntimePort;
  /** I2-B is fail-closed unless an explicit synthetic or future I3 owner set is supplied. */
  enrollmentJourneySurfaceDeps?: NurtureEnrollmentJourneySurfaceDeps;
};

/**
 * Bind owner ports without changing the canonical manifest or activation
 * posture. My-Chat remains the sole owner of capability activation.
 */
export const createNurtureScenarioModule = (
  deps: NurtureScenarioModuleDeps,
): WorkflowScenarioModule => ({
  manifest: nurtureScenarioManifest,
  handlers: createNurtureHandlers(deps.handlerDeps),
  actions: nurtureActions,
  adapters: { ...nurtureAdapters, worker_runtime: deps.workerRuntime },
  presenters: createNurturePresenters(
    nurtureScenarioManifest,
    deps.presenterDeps,
  ),
  policies: createNurturePolicies(deps.handlerDeps),
  internal_api_handlers: {
    ...nurtureInternalApiHandlers,
    ...createInstitutionInternalApiHandlers(deps.handlerDeps),
    ...createNurtureEnrollmentJourneyInternalApiHandlers(
      deps.enrollmentJourneySurfaceDeps ??
        defaultNurtureEnrollmentJourneySurfaceDeps,
    ),
  },
});
