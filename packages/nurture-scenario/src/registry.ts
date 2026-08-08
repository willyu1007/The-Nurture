import type { WorkflowInternalApiRegistry } from "@my-chat/workflow-contracts";
export { nurtureScenarioManifest } from "./generated/manifest.generated.js";

export const nurtureInternalApiHandlers: WorkflowInternalApiRegistry = {
  async "nurture.internal.get_profile"(input) {
    return {
      method: input.method,
      path: input.path,
      workspace_id: input.meta.workspace_id,
      profile: null,
    };
  },
  async "nurture.internal.update_profile_projection"(input) {
    return {
      method: input.method,
      path: input.path,
      workspace_id: input.meta.workspace_id,
      accepted: true,
      payload_shape: typeof input.payload,
    };
  },
  async "nurture.internal.preview_activity_comparison"(input) {
    return {
      method: input.method,
      path: input.path,
      workspace_id: input.meta.workspace_id,
      preview: "activity_comparison_summary",
    };
  },
};
