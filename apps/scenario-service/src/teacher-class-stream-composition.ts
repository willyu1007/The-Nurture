import type { TeacherClassStreamOperation } from "@the-nurture/scenario";
import { TEACHER_CLASS_STREAM_INTERFACE } from "@the-nurture/scenario";
import type {
  TeacherClassStreamChildDayDetailRequestV1,
  TeacherClassStreamChildStripRequestV1,
  TeacherClassStreamClassContextRequestV1,
  TeacherClassStreamScheduleRequestV1,
} from "./teacher-class-stream-http.js";
import { assertPublishedTeacherClassStreamResponse } from "./teacher-class-stream-response-validator.js";

export type TeacherClassStreamOwnerResolutionV1 = Readonly<{
  resolution_ref: string;
  presentation_role: "caregiver" | "lead_caregiver";
  scope_kind: "participant" | "care_group";
  scope_ref: string;
  context_ref: string;
  scope_version: number;
  resolved_at: string;
}>;

type TeacherClassStreamIdentityV1 = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
  operation: TeacherClassStreamOperation;
  /** Present for the three class-scoped reads; absent for class_context_query. */
  class_ref?: string;
}>;

export type TeacherClassStreamAuthorityResultV1 =
  | Readonly<{
      status: "resolved";
      owner_resolution: TeacherClassStreamOwnerResolutionV1;
    }>
  | Readonly<{
      status: "closed";
      response: unknown;
    }>;

export interface TeacherClassStreamAuthorityResolverV1 {
  resolve(
    input: TeacherClassStreamIdentityV1,
  ): Promise<TeacherClassStreamAuthorityResultV1>;
}

export interface TeacherClassStreamOwnerV1 {
  classContext(input: Readonly<{
    request: TeacherClassStreamClassContextRequestV1;
    authority: TeacherClassStreamOwnerResolutionV1;
  }>): Promise<unknown>;
  childStrip(input: Readonly<{
    request: TeacherClassStreamChildStripRequestV1;
    authority: TeacherClassStreamOwnerResolutionV1;
  }>): Promise<unknown>;
  childDayDetail(input: Readonly<{
    request: TeacherClassStreamChildDayDetailRequestV1;
    authority: TeacherClassStreamOwnerResolutionV1;
  }>): Promise<unknown>;
  schedule(input: Readonly<{
    request: TeacherClassStreamScheduleRequestV1;
    authority: TeacherClassStreamOwnerResolutionV1;
  }>): Promise<unknown>;
}

type AnyTeacherClassStreamRequestV1 =
  | TeacherClassStreamClassContextRequestV1
  | TeacherClassStreamChildStripRequestV1
  | TeacherClassStreamChildDayDetailRequestV1
  | TeacherClassStreamScheduleRequestV1;

export class TeacherClassStreamComposition {
  constructor(
    private readonly authorityResolver: TeacherClassStreamAuthorityResolverV1,
    private readonly owner: TeacherClassStreamOwnerV1,
  ) {}

  classContext(
    request: TeacherClassStreamClassContextRequestV1,
  ): Promise<unknown> {
    return this.execute("class_context_query", request, (authority) =>
      this.owner.classContext({ request, authority }));
  }

  childStrip(request: TeacherClassStreamChildStripRequestV1): Promise<unknown> {
    return this.execute("child_strip_query", request, (authority) =>
      this.owner.childStrip({ request, authority }));
  }

  childDayDetail(
    request: TeacherClassStreamChildDayDetailRequestV1,
  ): Promise<unknown> {
    return this.execute("child_day_detail_query", request, (authority) =>
      this.owner.childDayDetail({ request, authority }));
  }

  schedule(request: TeacherClassStreamScheduleRequestV1): Promise<unknown> {
    return this.execute("schedule_query", request, (authority) =>
      this.owner.schedule({ request, authority }));
  }

  private async execute(
    operation: TeacherClassStreamOperation,
    request: AnyTeacherClassStreamRequestV1,
    read: (
      authority: TeacherClassStreamOwnerResolutionV1,
    ) => Promise<unknown>,
  ): Promise<unknown> {
    const classRef = operation === "class_context_query"
      ? undefined
      : (request as TeacherClassStreamChildStripRequestV1).class_ref;
    const authority = await this.authorityResolver.resolve({
      workspace_id: request.workspace_id,
      my_chat_user_id: request.my_chat_user_id,
      host_request_id: request.host_request_id,
      context_ref: request.context_ref,
      operation,
      ...(classRef ? { class_ref: classRef } : {}),
    });
    const response = authority.status === "closed"
      ? authority.response
      : await read(authority.owner_resolution);
    assertPublishedTeacherClassStreamResponse(operation, response);
    assertRequestBinding(operation, request, authority, response);
    return response;
  }
}

const assertRequestBinding = (
  operation: TeacherClassStreamOperation,
  request: AnyTeacherClassStreamRequestV1,
  authority: TeacherClassStreamAuthorityResultV1,
  response: unknown,
): void => {
  if (!isRecord(response)) throw new Error("teacher_class_stream_binding_violation");
  if (response.status !== "ready") {
    if (response.context_ref !== request.context_ref) {
      throw new Error("teacher_class_stream_binding_violation");
    }
    return;
  }
  if (authority.status !== "resolved") {
    throw new Error("teacher_class_stream_binding_violation");
  }
  const resolution = response.owner_resolution;
  const cache = response.cache_partition;
  if (
    !isRecord(resolution)
    || !isRecord(cache)
    || resolution.context_ref !== request.context_ref
    || resolution.resolution_ref !== authority.owner_resolution.resolution_ref
    || resolution.presentation_role
      !== authority.owner_resolution.presentation_role
    || resolution.scope_kind !== authority.owner_resolution.scope_kind
    || resolution.scope_ref !== authority.owner_resolution.scope_ref
    || resolution.scope_version !== authority.owner_resolution.scope_version
    || resolution.resolved_at !== authority.owner_resolution.resolved_at
    || cache.interface_key !== TEACHER_CLASS_STREAM_INTERFACE.key
    || cache.interface_version !== TEACHER_CLASS_STREAM_INTERFACE.version
    || cache.contract_digest !== TEACHER_CLASS_STREAM_INTERFACE.digest
    || cache.context_ref !== request.context_ref
    || cache.workspace_id !== request.workspace_id
    || cache.my_chat_user_id !== request.my_chat_user_id
    || cache.operation !== operation
  ) {
    throw new Error("teacher_class_stream_binding_violation");
  }
  if (operation === "class_context_query") {
    if (resolution.scope_kind !== "participant") {
      throw new Error("teacher_class_stream_binding_violation");
    }
  } else {
    const classRef =
      (request as TeacherClassStreamChildStripRequestV1).class_ref;
    if (
      resolution.scope_kind !== "care_group"
      || resolution.scope_ref !== classRef
    ) {
      throw new Error("teacher_class_stream_binding_violation");
    }
  }
  const queryKey = operation === "class_context_query"
    ? (request as TeacherClassStreamClassContextRequestV1).local_date
    : operation === "child_day_detail_query"
      ? `${(request as TeacherClassStreamChildDayDetailRequestV1).child_ref}|${
        (request as TeacherClassStreamChildDayDetailRequestV1).local_date
      }`
      : `${(request as TeacherClassStreamChildStripRequestV1).class_ref}|${
        (request as TeacherClassStreamChildStripRequestV1).local_date
      }`;
  if (cache.query_key !== queryKey) {
    throw new Error("teacher_class_stream_binding_violation");
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
