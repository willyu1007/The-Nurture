import type {
  ParentCommunicationExtensionOperation,
  ParentContextSelectionV1,
} from "@the-nurture/scenario";
import { PARENT_COMMUNICATION_EXTENSION_INTERFACE } from "@the-nurture/scenario";
import type {
  ParentCommunicationDeliveryReceiptRequestV1,
  ParentCommunicationRedactRequestV1,
  ParentCommunicationRedactionPreviewRequestV1,
} from "./parent-communication-extension-http.js";
import { assertPublishedParentCommunicationExtensionResponse } from "./parent-communication-extension-response-validator.js";

export type ParentCommunicationExtensionResolutionV1 = Readonly<{
  presentation_role: "parent";
  scope_kind: "parent_communication";
  context_ref: string;
  resolution_ref: string;
  scope_version: number;
  context_selection: ParentContextSelectionV1;
}>;

type ParentCommunicationExtensionIdentityV1 = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
  operation: ParentCommunicationExtensionOperation;
  message_ref: string;
  context_selection: ParentContextSelectionV1;
}>;

export type ParentCommunicationExtensionAuthorityResultV1 =
  | Readonly<{
      status: "resolved";
      owner_resolution: ParentCommunicationExtensionResolutionV1;
    }>
  | Readonly<{
      status: "closed";
      response: unknown;
    }>;

export interface ParentCommunicationExtensionAuthorityResolverV1 {
  resolve(
    input: ParentCommunicationExtensionIdentityV1,
  ): Promise<ParentCommunicationExtensionAuthorityResultV1>;
}

export interface ParentCommunicationExtensionOwnerV1 {
  redactionPreview(input: Readonly<{
    request: ParentCommunicationRedactionPreviewRequestV1;
    authority: ParentCommunicationExtensionResolutionV1;
  }>): Promise<unknown>;
  redact(input: Readonly<{
    request: ParentCommunicationRedactRequestV1;
    authority: ParentCommunicationExtensionResolutionV1;
  }>): Promise<unknown>;
  deliveryReceipt(input: Readonly<{
    request: ParentCommunicationDeliveryReceiptRequestV1;
    authority: ParentCommunicationExtensionResolutionV1;
  }>): Promise<unknown>;
}

type AnyParentCommunicationExtensionRequestV1 =
  | ParentCommunicationRedactionPreviewRequestV1
  | ParentCommunicationRedactRequestV1
  | ParentCommunicationDeliveryReceiptRequestV1;

export class ParentCommunicationExtensionComposition {
  constructor(
    private readonly authorityResolver: ParentCommunicationExtensionAuthorityResolverV1,
    private readonly owner: ParentCommunicationExtensionOwnerV1,
  ) {}

  redactionPreview(
    request: ParentCommunicationRedactionPreviewRequestV1,
    selection: ParentContextSelectionV1,
  ): Promise<unknown> {
    return this.execute("redaction_preview_query", request, selection, (authority) =>
      this.owner.redactionPreview({ request, authority }));
  }

  redact(
    request: ParentCommunicationRedactRequestV1,
    selection: ParentContextSelectionV1,
  ): Promise<unknown> {
    return this.execute("redact_exchange", request, selection, (authority) =>
      this.owner.redact({ request, authority }));
  }

  deliveryReceipt(
    request: ParentCommunicationDeliveryReceiptRequestV1,
    selection: ParentContextSelectionV1,
  ): Promise<unknown> {
    return this.execute("delivery_receipt_query", request, selection, (authority) =>
      this.owner.deliveryReceipt({ request, authority }));
  }

  private async execute(
    operation: ParentCommunicationExtensionOperation,
    request: AnyParentCommunicationExtensionRequestV1,
    selection: ParentContextSelectionV1,
    run: (
      authority: ParentCommunicationExtensionResolutionV1,
    ) => Promise<unknown>,
  ): Promise<unknown> {
    const authority = await this.authorityResolver.resolve({
      workspace_id: request.workspace_id,
      my_chat_user_id: request.my_chat_user_id,
      host_request_id: request.host_request_id,
      context_ref: request.context_ref,
      operation,
      message_ref: request.message_ref,
      context_selection: selection,
    });
    const response = authority.status === "closed"
      ? authority.response
      : await run(authority.owner_resolution);
    assertPublishedParentCommunicationExtensionResponse(operation, response);
    assertRequestBinding(operation, request, authority, response);
    return response;
  }
}

const violation: () => never = () => {
  throw new Error("parent_communication_extension_binding_violation");
};

const assertRequestBinding = (
  operation: ParentCommunicationExtensionOperation,
  request: AnyParentCommunicationExtensionRequestV1,
  authority: ParentCommunicationExtensionAuthorityResultV1,
  response: unknown,
): void => {
  if (!isRecord(response)) violation();
  if (response.status === "masked" || response.status === "unavailable") {
    if (response.context_ref !== request.context_ref) violation();
    return;
  }
  // Every remaining status is owner-produced and requires live authority.
  if (authority.status !== "resolved") violation();
  if (operation === "redact_exchange") {
    const redact = request as ParentCommunicationRedactRequestV1;
    if (response.command_request_id !== redact.command_request_id) violation();
    if (
      response.status === "committed"
      && response.message_ref !== redact.message_ref
    ) {
      violation();
    }
    return;
  }
  const resolution = authority.owner_resolution;
  const cache = response.cache_partition;
  if (
    !isRecord(cache)
    || cache.context_ref !== request.context_ref
    || cache.workspace_id !== request.workspace_id
    || cache.my_chat_user_id !== request.my_chat_user_id
    || cache.resolution_ref !== resolution.resolution_ref
    || cache.scope_version !== resolution.scope_version
    || cache.operation !== operation
    || cache.interface_key !== PARENT_COMMUNICATION_EXTENSION_INTERFACE.key
    || cache.interface_version
      !== PARENT_COMMUNICATION_EXTENSION_INTERFACE.version
    || cache.contract_digest !== PARENT_COMMUNICATION_EXTENSION_INTERFACE.digest
  ) {
    violation();
  }
  if (operation === "redaction_preview_query") {
    const preview = request as ParentCommunicationRedactionPreviewRequestV1;
    const previewBody = response.preview;
    if (
      response.command_request_id !== preview.command_request_id
      || !isRecord(previewBody)
      || previewBody.message_ref !== preview.message_ref
      || response.presentation_version !== preview.presentation_version
    ) {
      violation();
    }
  }
  if (
    operation === "delivery_receipt_query"
    && response.message_ref !== request.message_ref
  ) {
    violation();
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
