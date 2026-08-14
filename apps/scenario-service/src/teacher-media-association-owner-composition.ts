import type { TeacherMediaAssociationOwnerOperation } from "@the-nurture/scenario";
import { TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE } from "@the-nurture/scenario";
import type {
  TeacherMediaAssociationAssociateRequestV1,
  TeacherMediaAssociationAssociationRequestV1,
  TeacherMediaAssociationDiscardRequestV1,
  TeacherMediaAssociationUnassociatedRequestV1,
} from "./teacher-media-association-owner-http.js";
import { assertPublishedTeacherMediaAssociationResponse } from "./teacher-media-association-owner-response-validator.js";

export type TeacherMediaAssociationOwnerResolutionV1 = Readonly<{
  resolution_ref: string;
  presentation_role: "caregiver" | "lead_caregiver";
  scope_kind: "care_group";
  scope_ref: string;
  context_ref: string;
  scope_version: number;
  resolved_at: string;
}>;

type TeacherMediaAssociationIdentityV1 = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
  operation: TeacherMediaAssociationOwnerOperation;
  class_ref: string;
}>;

export type TeacherMediaAssociationAuthorityResultV1 =
  | Readonly<{
      status: "resolved";
      owner_resolution: TeacherMediaAssociationOwnerResolutionV1;
    }>
  | Readonly<{
      status: "closed";
      response: unknown;
    }>;

export interface TeacherMediaAssociationAuthorityResolverV1 {
  resolve(
    input: TeacherMediaAssociationIdentityV1,
  ): Promise<TeacherMediaAssociationAuthorityResultV1>;
}

export interface TeacherMediaAssociationOwnerV1 {
  unassociated(input: Readonly<{
    request: TeacherMediaAssociationUnassociatedRequestV1;
    authority: TeacherMediaAssociationOwnerResolutionV1;
  }>): Promise<unknown>;
  association(input: Readonly<{
    request: TeacherMediaAssociationAssociationRequestV1;
    authority: TeacherMediaAssociationOwnerResolutionV1;
  }>): Promise<unknown>;
  associate(input: Readonly<{
    request: TeacherMediaAssociationAssociateRequestV1;
    authority: TeacherMediaAssociationOwnerResolutionV1;
  }>): Promise<unknown>;
  discard(input: Readonly<{
    request: TeacherMediaAssociationDiscardRequestV1;
    authority: TeacherMediaAssociationOwnerResolutionV1;
  }>): Promise<unknown>;
}

type AnyTeacherMediaAssociationRequestV1 =
  | TeacherMediaAssociationUnassociatedRequestV1
  | TeacherMediaAssociationAssociationRequestV1
  | TeacherMediaAssociationAssociateRequestV1
  | TeacherMediaAssociationDiscardRequestV1;

export class TeacherMediaAssociationOwnerComposition {
  constructor(
    private readonly authorityResolver: TeacherMediaAssociationAuthorityResolverV1,
    private readonly owner: TeacherMediaAssociationOwnerV1,
  ) {}

  unassociated(
    request: TeacherMediaAssociationUnassociatedRequestV1,
  ): Promise<unknown> {
    return this.execute("unassociated_query", request, (authority) =>
      this.owner.unassociated({ request, authority }));
  }

  association(
    request: TeacherMediaAssociationAssociationRequestV1,
  ): Promise<unknown> {
    return this.execute("association_query", request, (authority) =>
      this.owner.association({ request, authority }));
  }

  associate(request: TeacherMediaAssociationAssociateRequestV1): Promise<unknown> {
    return this.execute("associate_exchange", request, (authority) =>
      this.owner.associate({ request, authority }));
  }

  discard(request: TeacherMediaAssociationDiscardRequestV1): Promise<unknown> {
    return this.execute("discard_exchange", request, (authority) =>
      this.owner.discard({ request, authority }));
  }

  private async execute(
    operation: TeacherMediaAssociationOwnerOperation,
    request: AnyTeacherMediaAssociationRequestV1,
    run: (
      authority: TeacherMediaAssociationOwnerResolutionV1,
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
    assertPublishedTeacherMediaAssociationResponse(operation, response);
    assertRequestBinding(operation, request, authority, response);
    return response;
  }
}

const READ_OPERATIONS: readonly TeacherMediaAssociationOwnerOperation[] = [
  "unassociated_query",
  "association_query",
];

const violation: () => never = () => {
  throw new Error("teacher_media_association_binding_violation");
};

const assertRequestBinding = (
  operation: TeacherMediaAssociationOwnerOperation,
  request: AnyTeacherMediaAssociationRequestV1,
  authority: TeacherMediaAssociationAuthorityResultV1,
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
    (request as TeacherMediaAssociationAssociateRequestV1).command_request_id;
  if (response.command_request_id !== commandRequestId) violation();
  if (operation === "associate_exchange" && response.status === "committed") {
    const associate = request as TeacherMediaAssociationAssociateRequestV1;
    if (
      response.media_ref !== associate.media_ref
      || response.child_ref !== associate.child_ref
      || (associate.decision === "confirm") !== (response.state === "confirmed")
    ) {
      violation();
    }
  }
  if (
    operation === "discard_exchange"
    && response.status === "committed"
    && response.media_ref
      !== (request as TeacherMediaAssociationDiscardRequestV1).media_ref
  ) {
    violation();
  }
};

const assertReadBinding = (
  request: AnyTeacherMediaAssociationRequestV1,
  ownerResolution: TeacherMediaAssociationOwnerResolutionV1,
  response: Record<string, unknown>,
  operation: TeacherMediaAssociationOwnerOperation,
): void => {
  const resolution = response.owner_resolution;
  const cache = response.cache_partition;
  const queryKey = operation === "unassociated_query"
    ? request.class_ref
    : (request as TeacherMediaAssociationAssociationRequestV1).media_ref;
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
    || cache.interface_key !== TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE.key
    || cache.interface_version
      !== TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE.version
    || cache.contract_digest !== TEACHER_MEDIA_ASSOCIATION_OWNER_INTERFACE.digest
    || cache.context_ref !== request.context_ref
    || cache.workspace_id !== request.workspace_id
    || cache.my_chat_user_id !== request.my_chat_user_id
    || cache.operation !== operation
    || cache.query_key !== queryKey
  ) {
    violation();
  }
  if (operation === "association_query") {
    const mediaRef =
      (request as TeacherMediaAssociationAssociationRequestV1).media_ref;
    if (response.media_ref !== mediaRef) violation();
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
