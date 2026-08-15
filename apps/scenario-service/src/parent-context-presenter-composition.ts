import { createHash } from "node:crypto";
import {
  nurtureCanonicalJson,
  PARENT_CONTEXT_PRESENTER_INTERFACE,
  type ParentContextPresenterAsyncBoundaryV1,
  type ParentContextPresenterAuthorityResolverV1,
  type ParentContextPresenterOperation,
  type ParentContextPresenterOwnerV1,
  type ParentContextPresenterRequestV1,
  type ParentContextPresenterResolvedAuthorityV1,
  type ParentContextSelectionV1,
} from "@the-nurture/scenario";
import type {
  ParentContextPresenterActivityDetailRequestV1,
  ParentContextPresenterDateRequestV1,
  ParentContextPresenterIdentityV1,
  ParentContextPresenterNoticeRequestV1,
} from "./parent-context-presenter-http.js";
import {
  assertPublishedParentContextPresenterResponse,
  ParentContextPresenterResponseContractError,
} from "./parent-context-presenter-response-validator.js";

export type {
  ParentContextPresenterAsyncBoundaryV1,
  ParentContextPresenterAuthorityResultV1,
  ParentContextPresenterAuthorityResolverV1,
  ParentContextPresenterOwnerV1,
  ParentContextPresenterResolvedAuthorityV1,
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
  non_retryable_refresh: "refresh_not_retryable",
} as const;

export class ParentContextPresenterComposition {
  constructor(
    private readonly authorityResolver: ParentContextPresenterAuthorityResolverV1,
    private readonly owner: ParentContextPresenterOwnerV1,
    private readonly asyncBoundary: ParentContextPresenterAsyncBoundaryV1,
    private readonly now: () => Date = () => new Date(),
  ) {}

  day(
    request: ParentContextPresenterDateRequestV1,
    selection: ParentContextSelectionV1,
  ): Promise<unknown> {
    return this.execute("day_query", request, selection);
  }

  dailyCare(
    request: ParentContextPresenterDateRequestV1,
    selection: ParentContextSelectionV1,
  ): Promise<unknown> {
    return this.execute("daily_care_cards_query", request, selection);
  }

  activityDetail(
    request: ParentContextPresenterActivityDetailRequestV1,
    selection: ParentContextSelectionV1,
  ): Promise<unknown> {
    return this.execute("activity_detail_query", request, selection);
  }

  notices(
    request: ParentContextPresenterNoticeRequestV1,
    selection: ParentContextSelectionV1,
  ): Promise<unknown> {
    return this.execute("notice_list_and_confirmation", request, selection);
  }

  freshnessAttendance(
    request: ParentContextPresenterDateRequestV1,
    selection: ParentContextSelectionV1,
  ): Promise<unknown> {
    return this.execute("freshness_attendance_projection", request, selection);
  }

  private async execute(
    operation: ParentContextPresenterOperation,
    request: ParentContextPresenterRequestV1,
    selection: ParentContextSelectionV1,
  ): Promise<unknown> {
    let responseGeneration: number;
    try {
      const captured = await this.asyncBoundary.capture({
        operation,
        workspace_id: request.workspace_id,
        my_chat_user_id: request.my_chat_user_id,
        host_request_id: request.host_request_id,
        context_ref: request.context_ref,
      });
      responseGeneration = captured.response_generation;
    } catch {
      return this.checkedResponse(operation, this.unavailable(request, true));
    }
    const resolved = await this.authorityResolver.resolve({
      operation,
      workspace_id: request.workspace_id,
      my_chat_user_id: request.my_chat_user_id,
      host_request_id: request.host_request_id,
      context_ref: request.context_ref,
      context_selection: selection,
    });
    if (resolved.status === "temporarily_unavailable") {
      return this.applyAsyncBoundary(
        operation,
        request,
        responseGeneration,
        this.checkedResponse(operation, this.unavailable(request, true)),
      );
    }
    if (resolved.status !== "resolved") {
      return this.applyAsyncBoundary(
        operation,
        request,
        responseGeneration,
        this.checkedResponse(
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
        this.checkedResponse(
          operation,
          this.masked(request, "access_changed"),
        ),
      );
    }
    let presented: unknown;
    try {
      presented = await this.owner.present({
        operation,
        request,
        authority: resolved.authority,
      });
    } catch {
      return this.applyAsyncBoundary(
        operation,
        request,
        responseGeneration,
        this.checkedResponse(operation, this.unavailable(request, true)),
      );
    }
    const response = structuredClone(presented);
    assertPublishedParentContextPresenterResponse(operation, response);
    if (
      !this.ownerResponseIsSafe(
        operation,
        request,
        resolved.authority,
        response,
      )
    ) {
      throw new ParentContextPresenterResponseContractError();
    }
    return this.applyAsyncBoundary(
      operation,
      request,
      responseGeneration,
      response,
    );
  }

  private async applyAsyncBoundary(
    operation: ParentContextPresenterOperation,
    request: ParentContextPresenterRequestV1,
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
      return this.checkedResponse(operation, this.unavailable(request, true));
    }
    return lateResultMayApply({
      responseGeneration,
      requestContextRef: request.context_ref,
      active,
      response,
    })
      ? response
      : this.checkedResponse(operation, this.unavailable(request, false));
  }

  private checkedResponse(
    operation: ParentContextPresenterOperation,
    response: unknown,
  ): unknown {
    assertPublishedParentContextPresenterResponse(operation, response);
    return response;
  }

  private ownerResponseIsSafe(
    operation: ParentContextPresenterOperation,
    request: ParentContextPresenterRequestV1,
    authority: ParentContextPresenterResolvedAuthorityV1,
    response: unknown,
  ): boolean {
    if (!isRecord(response) || containsForbiddenResponseField(response)) return false;
    if (
      operation === "notice_list_and_confirmation"
      && (!isNoticeRequest(request)
        || !noticeStatusMatchesKind(request.kind, response.status))
    ) {
      return false;
    }
    if (response.status === "masked" || response.status === "unavailable") {
      return response.context_ref === request.context_ref;
    }
    if (operation === "notice_list_and_confirmation") {
      if (response.status === "not_committed" || response.status === "outcome_unknown") {
        return true;
      }
    }
    if (!readyBindingMatches(operation, request, authority, response)) return false;
    if (operation === "day_query") {
      return response.status === "ready"
        && isRecord(response.day)
        && response.day.selected_date === localDateOf(request)
        && Array.isArray(response.activities)
        && response.activities.length <= 20
        && uniqueStringField(response.activities, "activity_ref");
    }
    if (operation === "daily_care_cards_query") {
      return response.status === "ready" && response.local_date === localDateOf(request);
    }
    if (operation === "activity_detail_query") {
      if (
        response.status !== "ready"
        || !isRecord(response.activity)
        || !("activity_ref" in request)
        || response.activity.activity_ref !== request.activity_ref
        || response.activity.local_date !== request.local_date
        || !Array.isArray(response.activity.media)
      ) {
        return false;
      }
      return response.activity.media_state !== "none"
        || response.activity.media.length === 0;
    }
    if (operation === "freshness_attendance_projection") {
      return response.status === "ready" && response.local_date === localDateOf(request);
    }
    if (!isNoticeRequest(request)) return false;
    if (request.kind === "list") {
      return response.status === "ready"
        && Array.isArray(response.notices)
        && response.notices.length <= 20
        && uniqueStringField(response.notices, "notice_ref")
        && isRecord(response.page_info)
        && (response.page_info.has_more === false
          || typeof response.page_info.next_cursor === "string");
    }
    if (request.kind === "prepare_confirmation") {
      return response.status === "ready_to_confirm"
        && response.notice_ref === request.notice_ref
        && response.notice_version === request.expected_notice_version
        && response.action_ref === request.action_ref
        && response.action_version === request.action_version
        && isRecord(response.preview)
        && response.prepared_preview_digest === digestPreview(response.preview);
    }
    return request.kind === "confirm"
      && (response.status === "committed"
        || response.status === "not_committed"
        || response.status === "outcome_unknown");
  }

  private masked(
    request: ParentContextPresenterIdentityV1,
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
    request: ParentContextPresenterIdentityV1,
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

const noticeStatusMatchesKind = (
  kind: ParentContextPresenterNoticeRequestV1["kind"],
  status: unknown,
): boolean => {
  if (status === "masked" || status === "unavailable") return true;
  switch (kind) {
    case "list":
      return status === "ready";
    case "prepare_confirmation":
      return status === "ready_to_confirm";
    case "confirm":
      return status === "committed"
        || status === "not_committed"
        || status === "outcome_unknown";
  }
};

const isNoticeRequest = (
  request: ParentContextPresenterRequestV1,
): request is ParentContextPresenterNoticeRequestV1 => "kind" in request;

const lateResultMayApply = (input: {
  responseGeneration: number;
  requestContextRef: string;
  active: Readonly<{
    active_generation: number;
    active_context_ref: string;
  }>;
  response: unknown;
}): boolean => {
  if (
    !Number.isSafeInteger(input.responseGeneration)
    || input.responseGeneration < 0
    || !Number.isSafeInteger(input.active.active_generation)
    || input.active.active_generation < 0
    || input.responseGeneration !== input.active.active_generation
    || input.requestContextRef !== input.active.active_context_ref
    || !isRecord(input.response)
  ) {
    return false;
  }
  const responseContextRef = isRecord(input.response.cache_partition)
    ? input.response.cache_partition.context_ref
    : input.response.context_ref ?? input.requestContextRef;
  return responseContextRef === input.active.active_context_ref;
};

const readyBindingMatches = (
  operation: ParentContextPresenterOperation,
  request: ParentContextPresenterRequestV1,
  authority: ParentContextPresenterResolvedAuthorityV1,
  response: Record<string, unknown>,
): boolean => {
  if (!isRecord(response.owner_resolution) || !isRecord(response.cache_partition)) {
    return false;
  }
  return response.owner_resolution.presentation_role === "parent"
    && response.owner_resolution.scope_kind === "parent_context"
    && response.owner_resolution.context_ref === request.context_ref
    && response.owner_resolution.resolution_ref === authority.resolution_ref
    && response.owner_resolution.scope_version === authority.scope_version
    && response.cache_partition.interface_key === PARENT_CONTEXT_PRESENTER_INTERFACE.key
    && response.cache_partition.interface_version === PARENT_CONTEXT_PRESENTER_INTERFACE.version
    && response.cache_partition.contract_digest === PARENT_CONTEXT_PRESENTER_INTERFACE.digest
    && response.cache_partition.workspace_id === request.workspace_id
    && response.cache_partition.my_chat_user_id === request.my_chat_user_id
    && response.cache_partition.context_ref === request.context_ref
    && response.cache_partition.resolution_ref === authority.resolution_ref
    && response.cache_partition.scope_version === authority.scope_version
    && response.cache_partition.operation === operation;
};

const localDateOf = (request: ParentContextPresenterRequestV1): string | undefined =>
  "local_date" in request ? request.local_date : undefined;

const digestPreview = (preview: Record<string, unknown>): string =>
  `sha256:${createHash("sha256")
    .update(nurtureCanonicalJson(preview), "utf8")
    .digest("hex")}`;

const uniqueStringField = (
  values: readonly unknown[],
  field: string,
): boolean => {
  const refs = values.map((value) =>
    isRecord(value) && typeof value[field] === "string" ? value[field] : undefined
  );
  return refs.every((ref): ref is string => ref !== undefined)
    && new Set(refs).size === refs.length;
};

const containsForbiddenResponseField = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(containsForbiddenResponseField);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(
    ([key, child]) =>
      FORBIDDEN_RESPONSE_FIELDS.has(key) || containsForbiddenResponseField(child),
  );
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
