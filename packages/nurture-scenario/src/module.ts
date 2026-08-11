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
import { defaultNurtureInstitutionKnowledgeSurfaceDeps } from "./institution-knowledge-surfaces.js";
import {
  admitNurtureInstitutionKnowledgeOwnerIntegration,
  type NurtureInstitutionKnowledgeOwnerIntegration,
} from "./institution-knowledge-owner-integration.js";
import {
  createNurtureC30TrustedInvocationHandlers,
  type NurtureC30TrustedInvocationOwner,
} from "./c30/trusted-handler-registry.js";
import {
  createNurtureInstitutionKnowledgeFormalInvocationHandlers,
  type NurtureInstitutionKnowledgeAuthorizedRetrievalOwnerFactoryPortV1,
} from "./institution-knowledge-formal-ingress.js";
import type {
  NurtureInstitutionKnowledgeFormalAuthorityResolverV1,
  NurtureInstitutionKnowledgePreparedCommandOwnerV1,
} from "./institution-knowledge-formal-ingress-contract.js";

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
  trusted_invocation_handlers: {
    ...createNurtureC30TrustedInvocationHandlers(),
    ...createNurtureInstitutionKnowledgeFormalInvocationHandlers({
      surfaceDeps: defaultNurtureInstitutionKnowledgeSurfaceDeps,
    }),
  },
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
  /** G4-E E7 admits the complete owner set only behind the exact Q2/Q3 pin tuple. */
  institutionKnowledgeFormalOwnerBinding?: NurtureInstitutionKnowledgeFormalOwnerBindingV1;
  /** Exact C30 owner; omitted production composition remains fail-closed. */
  c30SubjectPresentationOwner?: NurtureC30TrustedInvocationOwner;
};

/**
 * Single production binding for the formal Institution Knowledge ingress.
 * Keeping the four owner pieces in one value prevents authority, confirmation,
 * retrieval, and admitted surface dependencies from being mixed across tracks.
 */
export type NurtureInstitutionKnowledgeFormalOwnerBindingV1 = Readonly<{
  ownerIntegration: NurtureInstitutionKnowledgeOwnerIntegration;
  authorityResolver: NurtureInstitutionKnowledgeFormalAuthorityResolverV1;
  preparedCommandOwner: NurtureInstitutionKnowledgePreparedCommandOwnerV1;
  authorizedRetrievalOwnerFactory: NurtureInstitutionKnowledgeAuthorizedRetrievalOwnerFactoryPortV1;
}>;

/**
 * Bind owner ports without changing the canonical manifest or activation
 * posture. My-Chat remains the sole owner of capability activation.
 */
export const createNurtureScenarioModule = (
  deps: NurtureScenarioModuleDeps,
): WorkflowScenarioModule => {
  const formalOwnerBinding = deps.institutionKnowledgeFormalOwnerBinding;
  const surfaceDeps = admitNurtureInstitutionKnowledgeOwnerIntegration(
    formalOwnerBinding?.ownerIntegration,
  );
  const admittedFormalOwnerBinding =
    formalOwnerBinding && surfaceDeps !== defaultNurtureInstitutionKnowledgeSurfaceDeps
      ? formalOwnerBinding
      : undefined;
  return {
    manifest: nurtureScenarioManifest,
    handlers: createNurtureHandlers(deps.handlerDeps),
    actions: nurtureActions,
    adapters: { ...nurtureAdapters, worker_runtime: deps.workerRuntime },
    presenters: createNurturePresenters(nurtureScenarioManifest, deps.presenterDeps),
    policies: createNurturePolicies(deps.handlerDeps),
    trusted_invocation_handlers: {
      ...createNurtureC30TrustedInvocationHandlers(deps.c30SubjectPresentationOwner),
      ...createNurtureInstitutionKnowledgeFormalInvocationHandlers({
        surfaceDeps,
        authorityResolver: admittedFormalOwnerBinding?.authorityResolver,
        preparedCommandOwner: admittedFormalOwnerBinding?.preparedCommandOwner,
        authorizedRetrievalOwnerFactory:
          admittedFormalOwnerBinding?.authorizedRetrievalOwnerFactory,
      }),
    },
    internal_api_handlers: {
      ...nurtureInternalApiHandlers,
      ...createInstitutionInternalApiHandlers(deps.handlerDeps),
      ...createNurtureEnrollmentJourneyInternalApiHandlers(
        deps.enrollmentJourneySurfaceDeps ?? defaultNurtureEnrollmentJourneySurfaceDeps,
      ),
    },
  };
};
