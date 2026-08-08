import type { WorkflowHostValidationSnapshot } from "@my-chat/workflow-contracts";
import { standardWorkflowEvents } from "@my-chat/workflow-contracts";

// Dev host validation snapshot — declares everything the nurture manifest needs
// to pass validateWorkflowModule at activation_target "dev". Mirrors the
// scenario package's conformance test snapshot (keep in sync).
export const devHostSnapshot: WorkflowHostValidationSnapshot = {
  scenario_records: { nurture: { status: "draft" } },
  domain_resolver_keys: [
    "my_chat.object.child",
    "my_chat.object.expectant_mother",
    "my_chat.object.family",
    "my_chat.object.parent",
    "nurture.profile",
    "nurture.activity_option",
    "nurture.health_state_summary",
  ],
  downstream_owners: [
    "my_chat.forum",
    "my_chat.knowledge_base",
    "my_chat.notification",
    // The manifest's user-attention handoff owner; absent here it fails
    // fatally at WF-MAN-042.
    "user_attention",
  ],
  standard_events: [...standardWorkflowEvents],
  platform_events: [],
  allowed_surfaces: [
    "chat_workflow_control",
    "chat_dashboard_summary",
    "chat_citation",
    "web_domain_workbench",
    "web_run_workbench",
    "mobile_dashboard",
    "forum_publication",
    "rag_knowledge",
    "notification_push",
    "admin_operator",
    "worker_runtime",
  ],
  projection_reviews: [],
  // C30 (2026-08-08): the manifest now declares scenario_contracts capability
  // dependencies, so validateWorkflowModule fails fatally at WF-MAN-111 and
  // WF-MAN-119 unless the host declares matching support. Declaring them here
  // keeps this snapshot the mirror its comment above promises — it grants the
  // dev host nothing at runtime, since every manifest capability stays
  // enablement_policy "disabled".
  host_capabilities: [
    "scenario_federation_v1",
    "workflow_handoff_materialization_v1",
    "trusted_scenario_invocation_v1",
    "scenario_subject_presentation_v1",
  ],
};
