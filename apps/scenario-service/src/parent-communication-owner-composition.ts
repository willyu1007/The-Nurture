import { createHash } from "node:crypto";
import {
  nurtureCanonicalJson,
  PARENT_COMMUNICATION_OWNER_INTERFACE,
  type ParentCommunicationAsyncBoundaryV1,
  type ParentCommunicationAuthorityResolverV1,
  type ParentCommunicationAuthorityResultV1,
  type ParentCommunicationOwnerRequestV1,
  type ParentCommunicationOwnerV1,
  type ParentCommunicationOwnerOperation,
  type ParentCommunicationResolvedAuthorityV1,
  type ParentContextSelectionV1,
} from "@the-nurture/scenario";
import type {
  ParentCommunicationDetailRequestV1,
  ParentCommunicationIdentityV1,
  ParentCommunicationMediaAccessRequestV1,
  ParentCommunicationSendTextRequestV1,
  ParentCommunicationSummaryRequestV1,
} from "./parent-communication-owner-http.js";
import {
  assertPublishedParentCommunicationOwnerResponse,
  ParentCommunicationOwnerResponseContractError,
} from "./parent-communication-owner-response-validator.js";

export type {
  ParentCommunicationAsyncBoundaryV1,
  ParentCommunicationAuthorityResolverV1,
  ParentCommunicationAuthorityResultV1,
  ParentCommunicationOwnerRequestV1,
  ParentCommunicationOwnerV1,
  ParentCommunicationResolvedAuthorityV1,
} from "@the-nurture/scenario";

const FORBIDDEN_RESPONSE_FIELDS = new Set([
  "participant_id",
  "participant_ref",
  "role_assignment_id",
  "role_assignment_ref",
  "association_ref",
  "enrollment_id",
  "enrollment_ref",
  "grant_id",
  "grant_ref",
  "care_group_id",
  "care_group_ref",
  "family_id",
  "child_id",
  "institution_id",
  "storage_ref",
  "signed_url",
  "url",
]);

const MASK_REASON_BY_STATE = {
  scope_loss: "access_changed",
  revoked: "access_changed",
  stale_context_ref: "context_changed",
  ambiguous_enrollment: "ambiguous_context",
  protected_display_denial: "protected_display_denied",
} as const;

export class ParentCommunicationOwnerComposition {
  constructor(
    private readonly authorityResolver: ParentCommunicationAuthorityResolverV1,
    private readonly owner: ParentCommunicationOwnerV1,
    private readonly asyncBoundary: ParentCommunicationAsyncBoundaryV1,
    private readonly now: () => Date = () => new Date(),
  ) {}

  summary(
    request: ParentCommunicationSummaryRequestV1,
    selection: ParentContextSelectionV1,
  ): Promise<unknown> {
    return this.execute("summary_query", request, selection);
  }

  detail(
    request: ParentCommunicationDetailRequestV1,
    selection: ParentContextSelectionV1,
  ): Promise<unknown> {
    return this.execute("detail_query", request, selection);
  }

  mediaAccess(
    request: ParentCommunicationMediaAccessRequestV1,
    selection: ParentContextSelectionV1,
  ): Promise<unknown> {
    return this.execute("media_access_query", request, selection);
  }

  sendText(
    request: ParentCommunicationSendTextRequestV1,
    selection: ParentContextSelectionV1,
  ): Promise<unknown> {
    return this.execute("send_text_exchange", request, selection);
  }

  private async execute(
    operation: ParentCommunicationOwnerOperation,
    request: ParentCommunicationOwnerRequestV1,
    selection: ParentContextSelectionV1,
  ): Promise<unknown> {
    let responseGeneration: number;
    try {
      responseGeneration = (
        await this.asyncBoundary.capture({
          operation,
          workspace_id: request.workspace_id,
          my_chat_user_id: request.my_chat_user_id,
          host_request_id: request.host_request_id,
          context_ref: request.context_ref,
        })
      ).response_generation;
    } catch {
      return this.checked(operation, this.unavailable(request, true));
    }
    let resolved: ParentCommunicationAuthorityResultV1;
    try {
      resolved = await this.authorityResolver.resolve({
        operation,
        workspace_id: request.workspace_id,
        my_chat_user_id: request.my_chat_user_id,
        host_request_id: request.host_request_id,
        context_ref: request.context_ref,
        context_selection: selection,
      });
    } catch {
      return this.applyAsyncBoundary(
        operation,
        request,
        responseGeneration,
        this.checked(operation, this.unavailable(request, true)),
      );
    }
    if (resolved.status === "temporarily_unavailable") {
      return this.applyAsyncBoundary(
        operation,
        request,
        responseGeneration,
        this.checked(operation, this.unavailable(request, true)),
      );
    }
    if (resolved.status !== "resolved") {
      return this.applyAsyncBoundary(
        operation,
        request,
        responseGeneration,
        this.checked(
          operation,
          this.masked(request, MASK_REASON_BY_STATE[resolved.status]),
        ),
      );
    }
    if (
      resolved.authority.context_ref !== request.context_ref
      || !Number.isSafeInteger(resolved.authority.scope_version)
      || resolved.authority.scope_version < 0
    ) {
      return this.applyAsyncBoundary(
        operation,
        request,
        responseGeneration,
        this.checked(operation, this.masked(request, "access_changed")),
      );
    }
    if (operation === "media_access_query") {
      return this.applyAsyncBoundary(
        operation,
        request,
        responseGeneration,
        this.checked(operation, this.unavailable(request, false)),
      );
    }
    let response: unknown;
    try {
      response = structuredClone(
        await this.owner.execute({
          operation,
          request,
          authority: resolved.authority,
        }),
      );
    } catch {
      return this.applyAsyncBoundary(
        operation,
        request,
        responseGeneration,
        this.checked(
          operation,
          isSendConfirm(request)
            ? this.outcomeUnknown(request)
            : this.unavailable(request, true),
        ),
      );
    }
    try {
      this.checked(operation, response);
      if (!ownerResponseIsSafe(operation, request, resolved.authority, response)) {
        throw new ParentCommunicationOwnerResponseContractError();
      }
    } catch (error) {
      if (!isSendConfirm(request)) throw error;
      return this.applyAsyncBoundary(
        operation,
        request,
        responseGeneration,
        this.checked(operation, this.outcomeUnknown(request)),
      );
    }
    return this.applyAsyncBoundary(
      operation,
      request,
      responseGeneration,
      response,
    );
  }

  private async applyAsyncBoundary(
    operation: ParentCommunicationOwnerOperation,
    request: ParentCommunicationOwnerRequestV1,
    responseGeneration: number,
    response: unknown,
  ): Promise<unknown> {
    let active: Readonly<{
      active_generation: number;
      active_context_ref: string;
    }>;
    try {
      active = await this.asyncBoundary.current({
        operation,
        workspace_id: request.workspace_id,
        my_chat_user_id: request.my_chat_user_id,
        host_request_id: request.host_request_id,
      });
    } catch {
      return this.checked(operation, this.asyncFailure(request));
    }
    return responseMayApply(responseGeneration, request.context_ref, active)
      ? response
      : this.checked(operation, this.asyncFailure(request));
  }

  private asyncFailure(request: ParentCommunicationOwnerRequestV1): unknown {
    return isSendConfirm(request)
      ? this.outcomeUnknown(request)
      : this.unavailable(request, false);
  }

  private outcomeUnknown(
    request: Extract<ParentCommunicationSendTextRequestV1, { kind: "confirm" }>,
  ): unknown {
    return {
      status: "outcome_unknown",
      command_request_id: request.command_request_id,
      reason_code: "send_outcome_unknown",
      recovery: "reconcile_same_command",
    };
  }

  private checked(
    operation: ParentCommunicationOwnerOperation,
    response: unknown,
  ): unknown {
    assertPublishedParentCommunicationOwnerResponse(operation, response);
    return response;
  }

  private masked(
    request: ParentCommunicationIdentityV1,
    reasonCode: (typeof MASK_REASON_BY_STATE)[keyof typeof MASK_REASON_BY_STATE],
  ): unknown {
    return {
      status: "masked",
      context_ref: request.context_ref,
      masked_at: this.now().toISOString(),
      mask_signal: {
        kind: "mask",
        reason_code: reasonCode,
        purge_partition: true,
        content_masked: true,
        actions_disabled: true,
        media_access_invalidated: true,
      },
    };
  }

  private unavailable(
    request: ParentCommunicationIdentityV1,
    retryable: boolean,
  ): unknown {
    return {
      status: "unavailable",
      context_ref: request.context_ref,
      failed_at: this.now().toISOString(),
      reason_code: retryable ? "temporarily_unavailable" : "content_unavailable",
      retryable,
    };
  }
}

const ownerResponseIsSafe = (
  operation: ParentCommunicationOwnerOperation,
  request: ParentCommunicationOwnerRequestV1,
  authority: ParentCommunicationResolvedAuthorityV1,
  response: unknown,
): boolean => {
  if (!isRecord(response) || containsForbiddenField(response)) return false;
  if (response.status === "masked" || response.status === "unavailable") {
    return response.context_ref === request.context_ref;
  }
  if (operation === "send_text_exchange") {
    if (!isSendRequest(request)) return false;
    if (request.kind === "confirm") {
      return ["committed", "not_committed", "outcome_unknown"].includes(
        String(response.status),
      )
        && response.command_request_id === request.command_request_id;
    }
    return response.status === "ready_to_confirm"
      && response.command_request_id === request.command_request_id
      && response.segment === request.segment
      && response.presentation_version === request.presentation_version
      && isRecord(response.preview)
      && response.preview.body === request.body
      && response.prepared_preview_digest === digestPreview(response.preview)
      && readyBindingMatches(operation, request, authority, response);
  }
  if (!readyBindingMatches(operation, request, authority, response)) return false;
  if (operation === "summary_query") {
    return response.status === "ready"
      && isRecord(response.segments)
      && segmentSummariesAreConsistent(response.segments)
      && !containsAnyField(response.segments, [
        "body",
        "message_ref",
        "media_ref",
        "receipt_ref",
        "member_ref",
      ]);
  }
  if (operation === "detail_query") {
    return isDetailRequest(request)
      && response.status === "ready"
      && response.segment === request.segment
      && Array.isArray(response.members)
      && response.members.length <= 20
      && uniqueStringField(response.members, "member_ref")
      && Array.isArray(response.messages)
      && response.messages.length <= request.page_size
      && uniqueStringField(response.messages, "message_ref")
      && isRecord(response.page_info)
      && (response.page_info.has_more === false
        || typeof response.page_info.next_cursor === "string");
  }
  return isMediaRequest(request)
    && response.status === "ready"
    && response.presentation_version === request.presentation_version
    && response.message_ref === request.message_ref
    && response.media_ref === request.media_ref
    && typeof response.stream_path === "string"
    && response.stream_path.startsWith(
      "/internal/nurture/parent-communication-owner/v1/media/",
    );
};

const segmentSummariesAreConsistent = (
  segments: Record<string, unknown>,
): boolean => ["teachers", "class_group"].every((key) => {
  const value = segments[key];
  return isRecord(value)
    && typeof value.available === "boolean"
    && Number.isSafeInteger(value.unread_count)
    && (value.available || value.unread_count === 0);
});

const readyBindingMatches = (
  operation: ParentCommunicationOwnerOperation,
  request: ParentCommunicationOwnerRequestV1,
  authority: ParentCommunicationResolvedAuthorityV1,
  response: Record<string, unknown>,
): boolean => {
  const owner = response.owner_resolution;
  const cache = response.cache_partition;
  return isRecord(owner)
    && isRecord(cache)
    && owner.presentation_role === "parent"
    && owner.scope_kind === "parent_communication"
    && owner.context_ref === request.context_ref
    && owner.resolution_ref === authority.resolution_ref
    && owner.scope_version === authority.scope_version
    && cache.interface_key === PARENT_COMMUNICATION_OWNER_INTERFACE.key
    && cache.interface_version === PARENT_COMMUNICATION_OWNER_INTERFACE.version
    && cache.contract_digest === PARENT_COMMUNICATION_OWNER_INTERFACE.digest
    && cache.workspace_id === request.workspace_id
    && cache.my_chat_user_id === request.my_chat_user_id
    && cache.context_ref === request.context_ref
    && cache.resolution_ref === authority.resolution_ref
    && cache.scope_version === authority.scope_version
    && cache.operation === operation
    && cache.presentation_version === response.presentation_version;
};

const responseMayApply = (
  responseGeneration: number,
  contextRef: string,
  active: Readonly<{
    active_generation: number;
    active_context_ref: string;
  }>,
): boolean =>
  Number.isSafeInteger(responseGeneration)
  && responseGeneration >= 0
  && Number.isSafeInteger(active.active_generation)
  && active.active_generation === responseGeneration
  && active.active_context_ref === contextRef;

const digestPreview = (preview: unknown): string =>
  `sha256:${createHash("sha256")
    .update(nurtureCanonicalJson(preview), "utf8")
    .digest("hex")}`;

const isDetailRequest = (
  value: ParentCommunicationOwnerRequestV1,
): value is ParentCommunicationDetailRequestV1 => "page_size" in value;
const isMediaRequest = (
  value: ParentCommunicationOwnerRequestV1,
): value is ParentCommunicationMediaAccessRequestV1 => "message_ref" in value;
const isSendRequest = (
  value: ParentCommunicationOwnerRequestV1,
): value is ParentCommunicationSendTextRequestV1 => "kind" in value;
const isSendConfirm = (
  value: ParentCommunicationOwnerRequestV1,
): value is Extract<ParentCommunicationSendTextRequestV1, { kind: "confirm" }> =>
  isSendRequest(value) && value.kind === "confirm";

const containsForbiddenField = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(containsForbiddenField);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(
    ([key, child]) => FORBIDDEN_RESPONSE_FIELDS.has(key) || containsForbiddenField(child),
  );
};

const containsAnyField = (value: unknown, fields: readonly string[]): boolean => {
  const forbidden = new Set(fields);
  const visit = (child: unknown): boolean => {
    if (Array.isArray(child)) return child.some(visit);
    if (!isRecord(child)) return false;
    return Object.entries(child).some(
      ([key, nested]) => forbidden.has(key) || visit(nested),
    );
  };
  return visit(value);
};

const uniqueStringField = (
  values: readonly unknown[],
  field: string,
): boolean => {
  const seen = new Set<string>();
  for (const value of values) {
    if (!isRecord(value) || typeof value[field] !== "string" || seen.has(value[field])) {
      return false;
    }
    seen.add(value[field]);
  }
  return true;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
