import type { WorkflowHostValidationSnapshot } from "@my-chat/workflow-contracts";
import { standardWorkflowEvents } from "@my-chat/workflow-contracts";

// Shared joint-lane host snapshot: declares everything the real My-Chat
// module validator requires to register the nurture module at "dev".
// Mirrors the scenario package's conformance snapshot (keep in sync); this
// copy replaced the deleted legacy host's `devHostSnapshot` (T-014).
export const jointHostValidationSnapshot: WorkflowHostValidationSnapshot = {
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
  host_capabilities: [
    "scenario_federation_v1",
    "workflow_handoff_materialization_v1",
    "trusted_scenario_invocation_v1",
    "scenario_subject_presentation_v1",
  ],
};
