import type { TeacherAssistantQueryOwnerOperation } from "@the-nurture/scenario";
import { TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE } from "@the-nurture/scenario";
import type {
  TeacherAssistantQueryMissingRecordsRequestV1,
  TeacherAssistantQueryWeeklyDraftRequestV1,
  TeacherAssistantQueryWeeklySourceRequestV1,
} from "./teacher-assistant-query-owner-http.js";
import { assertPublishedTeacherAssistantQueryResponse } from "./teacher-assistant-query-owner-response-validator.js";

export type TeacherAssistantQueryOwnerResolutionV1 = Readonly<{
  resolution_ref: string;
  presentation_role: "caregiver" | "lead_caregiver";
  scope_kind: "care_group";
  scope_ref: string;
  context_ref: string;
  scope_version: number;
  resolved_at: string;
}>;

type TeacherAssistantQueryIdentityV1 = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
  operation: TeacherAssistantQueryOwnerOperation;
  class_ref: string;
}>;

export type TeacherAssistantQueryAuthorityResultV1 =
  | Readonly<{
      status: "resolved";
      owner_resolution: TeacherAssistantQueryOwnerResolutionV1;
    }>
  | Readonly<{
      status: "closed";
      response: unknown;
    }>;

export interface TeacherAssistantQueryAuthorityResolverV1 {
  resolve(
    input: TeacherAssistantQueryIdentityV1,
  ): Promise<TeacherAssistantQueryAuthorityResultV1>;
}

export interface TeacherAssistantQueryOwnerV1 {
  missingRecords(input: Readonly<{
    request: TeacherAssistantQueryMissingRecordsRequestV1;
    authority: TeacherAssistantQueryOwnerResolutionV1;
  }>): Promise<unknown>;
  weeklySource(input: Readonly<{
    request: TeacherAssistantQueryWeeklySourceRequestV1;
    authority: TeacherAssistantQueryOwnerResolutionV1;
  }>): Promise<unknown>;
  weeklyDraft(input: Readonly<{
    request: TeacherAssistantQueryWeeklyDraftRequestV1;
    authority: TeacherAssistantQueryOwnerResolutionV1;
  }>): Promise<unknown>;
}

type AnyTeacherAssistantQueryRequestV1 =
  | TeacherAssistantQueryMissingRecordsRequestV1
  | TeacherAssistantQueryWeeklySourceRequestV1
  | TeacherAssistantQueryWeeklyDraftRequestV1;

export class TeacherAssistantQueryOwnerComposition {
  constructor(
    private readonly authorityResolver: TeacherAssistantQueryAuthorityResolverV1,
    private readonly owner: TeacherAssistantQueryOwnerV1,
  ) {}

  missingRecords(
    request: TeacherAssistantQueryMissingRecordsRequestV1,
  ): Promise<unknown> {
    return this.execute("missing_records_query", request, (authority) =>
      this.owner.missingRecords({ request, authority }));
  }

  weeklySource(
    request: TeacherAssistantQueryWeeklySourceRequestV1,
  ): Promise<unknown> {
    return this.execute("weekly_source_query", request, (authority) =>
      this.owner.weeklySource({ request, authority }));
  }

  weeklyDraft(request: TeacherAssistantQueryWeeklyDraftRequestV1): Promise<unknown> {
    return this.execute("weekly_draft_exchange", request, (authority) =>
      this.owner.weeklyDraft({ request, authority }));
  }

  private async execute(
    operation: TeacherAssistantQueryOwnerOperation,
    request: AnyTeacherAssistantQueryRequestV1,
    run: (
      authority: TeacherAssistantQueryOwnerResolutionV1,
    ) => Promise<unknown>,
  ): Promise<unknown> {
    const authority = await this.authorityResolver.resolve({
      workspace_id: request.workspace_id,
      my_chat_user_id: request.my_chat_user_id,
      host_request_id: request.host_request_id,
      context_ref: request.context_ref,
      operation,
      class_ref: request.class_ref,
    });
    const response = authority.status === "closed"
      ? authority.response
      : await run(authority.owner_resolution);
    assertPublishedTeacherAssistantQueryResponse(operation, response);
    assertRequestBinding(operation, request, authority, response);
    return response;
  }
}

const violation: () => never = () => {
  throw new Error("teacher_assistant_query_binding_violation");
};

const assertRequestBinding = (
  operation: TeacherAssistantQueryOwnerOperation,
  request: AnyTeacherAssistantQueryRequestV1,
  authority: TeacherAssistantQueryAuthorityResultV1,
  response: unknown,
): void => {
  if (!isRecord(response)) violation();
  if (response.status === "masked" || response.status === "unavailable") {
    if (response.context_ref !== request.context_ref) violation();
    return;
  }
  // Every remaining status is owner-produced and requires live authority.
  if (authority.status !== "resolved") violation();
  if (operation === "weekly_draft_exchange") {
    if (response.context_ref !== request.context_ref) violation();
    const commandRequestId =
      (request as TeacherAssistantQueryWeeklyDraftRequestV1).command_request_id;
    if (response.command_request_id !== commandRequestId) violation();
    return;
  }
  assertReadBinding(request, authority.owner_resolution, response, operation);
};

const assertReadBinding = (
  request: AnyTeacherAssistantQueryRequestV1,
  ownerResolution: TeacherAssistantQueryOwnerResolutionV1,
  response: Record<string, unknown>,
  operation: TeacherAssistantQueryOwnerOperation,
): void => {
  const resolution = response.owner_resolution;
  const cache = response.cache_partition;
  // Weekly answers key by the owner-computed Monday; missing-records by
  // the requested date, which the response must also echo.
  const queryKey = operation === "missing_records_query"
    ? `${request.class_ref}|${request.local_date}`
    : `${request.class_ref}|${String(response.week_start)}`;
  if (
    !isRecord(resolution)
    || !isRecord(cache)
    || resolution.context_ref !== request.context_ref
    || resolution.resolution_ref !== ownerResolution.resolution_ref
    || resolution.presentation_role !== ownerResolution.presentation_role
    || resolution.scope_kind !== "care_group"
    || resolution.scope_ref !== ownerResolution.scope_ref
    || resolution.scope_version !== ownerResolution.scope_version
    || resolution.resolved_at !== ownerResolution.resolved_at
    || resolution.scope_ref !== request.class_ref
    || cache.interface_key !== TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE.key
    || cache.interface_version !== TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE.version
    || cache.contract_digest !== TEACHER_ASSISTANT_QUERY_OWNER_INTERFACE.digest
    || cache.context_ref !== request.context_ref
    || cache.workspace_id !== request.workspace_id
    || cache.my_chat_user_id !== request.my_chat_user_id
    || cache.operation !== operation
    || cache.query_key !== queryKey
  ) {
    violation();
  }
  if (
    operation === "missing_records_query"
    && response.local_date !== request.local_date
  ) {
    violation();
  }
  if (
    operation === "weekly_source_query"
    && !(
      String(response.week_start) <= request.local_date
      && request.local_date <= String(response.week_end)
    )
  ) {
    violation();
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
