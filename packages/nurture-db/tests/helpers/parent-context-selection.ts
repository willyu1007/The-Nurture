import {
  formatNurtureBindingOwnerRef,
  MY_CHAT_PARENT_CONTEXT_SELECTION_INTERFACE,
  type ParentContextSelectionV1,
} from "@the-nurture/scenario";

export const parentContextSelectionFor = (input: Readonly<{
  workspaceId: string;
  myChatUserId: string;
  hostRequestId: string;
  contextRef: string;
  childAnchorId: string;
  familyAnchorId: string;
  childOwnerVersion: number;
  familyOwnerVersion: number;
}>): ParentContextSelectionV1 => ({
  interface_contract: MY_CHAT_PARENT_CONTEXT_SELECTION_INTERFACE,
  workspace_id: input.workspaceId,
  my_chat_user_id: input.myChatUserId,
  host_request_id: input.hostRequestId,
  context_ref: input.contextRef,
  context_version: "pcv1:db-integration",
  child_binding: {
    owner_ref: formatNurtureBindingOwnerRef("child", input.childAnchorId),
    owner_version: input.childOwnerVersion,
  },
  family_binding: {
    owner_ref: formatNurtureBindingOwnerRef("family", input.familyAnchorId),
    owner_version: input.familyOwnerVersion,
  },
});
