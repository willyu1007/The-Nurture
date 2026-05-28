import { nurtureActions } from "./actions/shared-actions.js";
import { nurtureAdapters } from "./adapters/chat-workflow.adapter.js";
import { nurtureHandlers } from "./handlers/p0-handlers.js";
import { nurturePolicies } from "./policies.js";
import { nurturePresenters } from "./presenters.js";
import { nurtureInternalApiHandlers, nurtureScenarioManifest } from "./registry.js";
import type { WorkflowScenarioModule } from "./types.js";

export const nurtureScenarioModule: WorkflowScenarioModule = {
  manifest: nurtureScenarioManifest,
  handlers: nurtureHandlers,
  actions: nurtureActions,
  adapters: nurtureAdapters,
  presenters: nurturePresenters,
  policies: nurturePolicies,
  internal_api_handlers: nurtureInternalApiHandlers,
};
