import type { TeacherCommunicationOwnerOperation } from "@the-nurture/scenario";
import { TEACHER_COMMUNICATION_OWNER_INTERFACE } from "@the-nurture/scenario";
import type {
  TeacherCommunicationMarkReadRequestV1,
  TeacherCommunicationMembershipRequestV1,
  TeacherCommunicationSendTextRequestV1,
  TeacherCommunicationTargetsRequestV1,
  TeacherCommunicationTimelineRequestV1,
  TeacherCommunicationWithdrawStagedRequestV1,
} from "./teacher-communication-owner-http.js";
import { assertPublishedTeacherCommunicationResponse } from "./teacher-communication-owner-response-validator.js";

export type TeacherCommunicationOwnerResolutionV1 = Readonly<{
  resolution_ref: string;
  presentation_role: "caregiver" | "lead_caregiver";
  scope_kind: "care_group";
  scope_ref: string;
  context_ref: string;
  scope_version: number;
  resolved_at: string;
}>;

type TeacherCommunicationIdentityV1 = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
  operation: TeacherCommunicationOwnerOperation;
  class_ref: string;
}>;

export type TeacherCommunicationAuthorityResultV1 =
  | Readonly<{
      status: "resolved";
      owner_resolution: TeacherCommunicationOwnerResolutionV1;
    }>
  | Readonly<{
      status: "closed";
      response: unknown;
    }>;

export interface TeacherCommunicationAuthorityResolverV1 {
  resolve(
    input: TeacherCommunicationIdentityV1,
  ): Promise<TeacherCommunicationAuthorityResultV1>;
}

export interface TeacherCommunicationOwnerV1 {
  targets(input: Readonly<{
    request: TeacherCommunicationTargetsRequestV1;
    authority: TeacherCommunicationOwnerResolutionV1;
  }>): Promise<unknown>;
  membership(input: Readonly<{
    request: TeacherCommunicationMembershipRequestV1;
    authority: TeacherCommunicationOwnerResolutionV1;
  }>): Promise<unknown>;
  timeline(input: Readonly<{
    request: TeacherCommunicationTimelineRequestV1;
    authority: TeacherCommunicationOwnerResolutionV1;
  }>): Promise<unknown>;
  sendText(input: Readonly<{
    request: TeacherCommunicationSendTextRequestV1;
    authority: TeacherCommunicationOwnerResolutionV1;
  }>): Promise<unknown>;
  withdrawStaged(input: Readonly<{
    request: TeacherCommunicationWithdrawStagedRequestV1;
    authority: TeacherCommunicationOwnerResolutionV1;
  }>): Promise<unknown>;
  markRead(input: Readonly<{
    request: TeacherCommunicationMarkReadRequestV1;
    authority: TeacherCommunicationOwnerResolutionV1;
  }>): Promise<unknown>;
}

type AnyTeacherCommunicationRequestV1 =
  | TeacherCommunicationTargetsRequestV1
  | TeacherCommunicationMembershipRequestV1
  | TeacherCommunicationTimelineRequestV1
  | TeacherCommunicationSendTextRequestV1
  | TeacherCommunicationWithdrawStagedRequestV1
  | TeacherCommunicationMarkReadRequestV1;

export class TeacherCommunicationOwnerComposition {
  constructor(
    private readonly authorityResolver: TeacherCommunicationAuthorityResolverV1,
    private readonly owner: TeacherCommunicationOwnerV1,
  ) {}

  targets(request: TeacherCommunicationTargetsRequestV1): Promise<unknown> {
    return this.execute("targets_query", request, (authority) =>
      this.owner.targets({ request, authority }));
  }

  membership(
    request: TeacherCommunicationMembershipRequestV1,
  ): Promise<unknown> {
    return this.execute("membership_query", request, (authority) =>
      this.owner.membership({ request, authority }));
  }

  timeline(request: TeacherCommunicationTimelineRequestV1): Promise<unknown> {
    return this.execute("timeline_query", request, (authority) =>
      this.owner.timeline({ request, authority }));
  }

  sendText(request: TeacherCommunicationSendTextRequestV1): Promise<unknown> {
    return this.execute("send_text_exchange", request, (authority) =>
      this.owner.sendText({ request, authority }));
  }

  withdrawStaged(
    request: TeacherCommunicationWithdrawStagedRequestV1,
  ): Promise<unknown> {
    return this.execute("withdraw_staged_exchange", request, (authority) =>
      this.owner.withdrawStaged({ request, authority }));
  }

  markRead(request: TeacherCommunicationMarkReadRequestV1): Promise<unknown> {
    return this.execute("mark_read_exchange", request, (authority) =>
      this.owner.markRead({ request, authority }));
  }

  private async execute(
    operation: TeacherCommunicationOwnerOperation,
    request: AnyTeacherCommunicationRequestV1,
    run: (
      authority: TeacherCommunicationOwnerResolutionV1,
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
    assertPublishedTeacherCommunicationResponse(operation, response);
    assertRequestBinding(operation, request, authority, response);
    return response;
  }
}

const READ_OPERATIONS: readonly TeacherCommunicationOwnerOperation[] = [
  "targets_query",
  "membership_query",
  "timeline_query",
];

const violation: () => never = () => {
  throw new Error("teacher_communication_binding_violation");
};

const queryKeyFor = (
  operation: TeacherCommunicationOwnerOperation,
  request: AnyTeacherCommunicationRequestV1,
): string => {
  if (operation === "targets_query") return request.class_ref;
  const threadRef =
    (request as TeacherCommunicationMembershipRequestV1).thread_ref;
  if (operation === "membership_query") return threadRef;
  const cursor = (request as TeacherCommunicationTimelineRequestV1).cursor;
  return `${threadRef}|${cursor ?? "first"}`;
};

const assertRequestBinding = (
  operation: TeacherCommunicationOwnerOperation,
  request: AnyTeacherCommunicationRequestV1,
  authority: TeacherCommunicationAuthorityResultV1,
  response: unknown,
): void => {
  if (!isRecord(response)) violation();
  if (response.status === "masked" || response.status === "unavailable") {
    if (response.context_ref !== request.context_ref) violation();
    return;
  }
  // Every remaining status is owner-produced and requires live authority.
  if (authority.status !== "resolved") violation();
  if (READ_OPERATIONS.includes(operation)) {
    assertReadBinding(request, authority.owner_resolution, response, operation);
    return;
  }
  if (response.context_ref !== request.context_ref) violation();
  const commandRequestId =
    (request as TeacherCommunicationWithdrawStagedRequestV1).command_request_id;
  if (response.command_request_id !== commandRequestId) violation();
  if (operation === "send_text_exchange") {
    const kind = (request as TeacherCommunicationSendTextRequestV1).kind;
    if (kind === "prepare" && response.status === "committed") violation();
    if (kind === "confirm" && response.status === "ready_to_confirm") violation();
  }
  if (
    operation === "withdraw_staged_exchange"
    && response.status === "committed"
    && response.process_ref
      !== (request as TeacherCommunicationWithdrawStagedRequestV1).process_ref
  ) {
    violation();
  }
  if (
    operation === "mark_read_exchange"
    && response.status === "committed"
    && response.thread_ref
      !== (request as TeacherCommunicationMarkReadRequestV1).thread_ref
  ) {
    violation();
  }
};

const assertReadBinding = (
  request: AnyTeacherCommunicationRequestV1,
  ownerResolution: TeacherCommunicationOwnerResolutionV1,
  response: Record<string, unknown>,
  operation: TeacherCommunicationOwnerOperation,
): void => {
  const resolution = response.owner_resolution;
  const cache = response.cache_partition;
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
    || cache.interface_key !== TEACHER_COMMUNICATION_OWNER_INTERFACE.key
    || cache.interface_version !== TEACHER_COMMUNICATION_OWNER_INTERFACE.version
    || cache.contract_digest !== TEACHER_COMMUNICATION_OWNER_INTERFACE.digest
    || cache.context_ref !== request.context_ref
    || cache.workspace_id !== request.workspace_id
    || cache.my_chat_user_id !== request.my_chat_user_id
    || cache.operation !== operation
    || cache.query_key !== queryKeyFor(operation, request)
  ) {
    violation();
  }
  if (operation === "membership_query" || operation === "timeline_query") {
    const threadRef =
      (request as TeacherCommunicationMembershipRequestV1).thread_ref;
    if (response.thread_ref !== threadRef) violation();
  }
  if (operation === "timeline_query") {
    const cursor = (request as TeacherCommunicationTimelineRequestV1).cursor;
    // The W4 replay rule: the response names the exact page it answered,
    // null for the first page.
    if (response.cursor_echo !== (cursor ?? null)) violation();
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
