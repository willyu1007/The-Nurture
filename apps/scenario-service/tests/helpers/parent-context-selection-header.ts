import {
  MY_CHAT_PARENT_CONTEXT_SELECTION_INTERFACE,
  nurtureCanonicalJson,
  type ParentContextSelectionV1,
} from "@the-nurture/scenario";

export const parentContextSelectionFor = (
  request: Record<string, unknown>,
): ParentContextSelectionV1 => ({
  interface_contract: MY_CHAT_PARENT_CONTEXT_SELECTION_INTERFACE,
  workspace_id: String(request.workspace_id),
  my_chat_user_id: String(request.my_chat_user_id),
  host_request_id: String(request.host_request_id),
  context_ref: String(request.context_ref),
  context_version: "pcv1:scenario-service-test",
  child_binding: {
    owner_ref: "nurture_child_binding_anchor_v1:11111111-1111-4111-8111-111111111111",
    owner_version: 4,
  },
  family_binding: {
    owner_ref: "nurture_family_binding_anchor_v1:22222222-2222-4222-8222-222222222222",
    owner_version: 5,
  },
});

export const parentContextSelectionHeaderFor = (
  request: Record<string, unknown>,
): string => Buffer.from(
  nurtureCanonicalJson(parentContextSelectionFor(request)),
  "utf8",
).toString("base64url");
