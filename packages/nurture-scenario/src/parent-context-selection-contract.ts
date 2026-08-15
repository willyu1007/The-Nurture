export const MY_CHAT_PARENT_CONTEXT_SELECTION_HEADER =
  "x-morethan-parent-context-selection";

export const MY_CHAT_PARENT_CONTEXT_SELECTION_INTERFACE = Object.freeze({
  key: "my-chat.parent-context-selection",
  version: "1.0.0",
  digest:
    "sha256:899871fa37ba17e0d9f0894874c9177fcc1f77f1fb7d61f8b9b56247078549e8",
});

export type ParentContextBindingSelectionV1 = Readonly<{
  owner_ref: string;
  owner_version: number;
}>;

/**
 * My-Chat-owned current context routing. These opaque binding refs may locate
 * Nurture anchors; they never authorize access or expose a local Enrollment.
 */
export type ParentContextSelectionV1 = Readonly<{
  interface_contract: typeof MY_CHAT_PARENT_CONTEXT_SELECTION_INTERFACE;
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
  context_version: string;
  child_binding: ParentContextBindingSelectionV1;
  family_binding: ParentContextBindingSelectionV1;
}>;
