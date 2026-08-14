import type { TeacherOrganizationOwnerOperation } from "@the-nurture/scenario";
import { TEACHER_ORGANIZATION_OWNER_INTERFACE } from "@the-nurture/scenario";
import type {
  TeacherOrganizationClassNoteRequestV1,
  TeacherOrganizationFeedRequestV1,
  TeacherOrganizationOrganizationRequestV1,
  TeacherOrganizationOrganizeRequestV1,
  TeacherOrganizationQueueAdmissionRequestV1,
  TeacherOrganizationSupplementRequestV1,
} from "./teacher-organization-owner-http.js";
import { assertPublishedTeacherOrganizationResponse } from "./teacher-organization-owner-response-validator.js";

export type TeacherOrganizationOwnerResolutionV1 = Readonly<{
  resolution_ref: string;
  presentation_role: "caregiver" | "lead_caregiver";
  scope_kind: "care_group";
  scope_ref: string;
  context_ref: string;
  scope_version: number;
  resolved_at: string;
}>;

type TeacherOrganizationIdentityV1 = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
  operation: TeacherOrganizationOwnerOperation;
  class_ref: string;
}>;

export type TeacherOrganizationAuthorityResultV1 =
  | Readonly<{
      status: "resolved";
      owner_resolution: TeacherOrganizationOwnerResolutionV1;
    }>
  | Readonly<{
      status: "closed";
      response: unknown;
    }>;

export interface TeacherOrganizationAuthorityResolverV1 {
  resolve(
    input: TeacherOrganizationIdentityV1,
  ): Promise<TeacherOrganizationAuthorityResultV1>;
}

export interface TeacherOrganizationOwnerV1 {
  feed(input: Readonly<{
    request: TeacherOrganizationFeedRequestV1;
    authority: TeacherOrganizationOwnerResolutionV1;
  }>): Promise<unknown>;
  organization(input: Readonly<{
    request: TeacherOrganizationOrganizationRequestV1;
    authority: TeacherOrganizationOwnerResolutionV1;
  }>): Promise<unknown>;
  organize(input: Readonly<{
    request: TeacherOrganizationOrganizeRequestV1;
    authority: TeacherOrganizationOwnerResolutionV1;
  }>): Promise<unknown>;
  supplement(input: Readonly<{
    request: TeacherOrganizationSupplementRequestV1;
    authority: TeacherOrganizationOwnerResolutionV1;
  }>): Promise<unknown>;
  classNote(input: Readonly<{
    request: TeacherOrganizationClassNoteRequestV1;
    authority: TeacherOrganizationOwnerResolutionV1;
  }>): Promise<unknown>;
  queueAdmission(input: Readonly<{
    request: TeacherOrganizationQueueAdmissionRequestV1;
    authority: TeacherOrganizationOwnerResolutionV1;
  }>): Promise<unknown>;
}

type AnyTeacherOrganizationRequestV1 =
  | TeacherOrganizationFeedRequestV1
  | TeacherOrganizationOrganizeRequestV1
  | TeacherOrganizationSupplementRequestV1
  | TeacherOrganizationClassNoteRequestV1
  | TeacherOrganizationQueueAdmissionRequestV1;

export class TeacherOrganizationOwnerComposition {
  constructor(
    private readonly authorityResolver: TeacherOrganizationAuthorityResolverV1,
    private readonly owner: TeacherOrganizationOwnerV1,
  ) {}

  feed(request: TeacherOrganizationFeedRequestV1): Promise<unknown> {
    return this.execute("feed_query", request, (authority) =>
      this.owner.feed({ request, authority }));
  }

  organization(
    request: TeacherOrganizationOrganizationRequestV1,
  ): Promise<unknown> {
    return this.execute("organization_query", request, (authority) =>
      this.owner.organization({ request, authority }));
  }

  organize(request: TeacherOrganizationOrganizeRequestV1): Promise<unknown> {
    return this.execute("organize_exchange", request, (authority) =>
      this.owner.organize({ request, authority }));
  }

  supplement(request: TeacherOrganizationSupplementRequestV1): Promise<unknown> {
    return this.execute("supplement_exchange", request, (authority) =>
      this.owner.supplement({ request, authority }));
  }

  classNote(request: TeacherOrganizationClassNoteRequestV1): Promise<unknown> {
    return this.execute("class_note_exchange", request, (authority) =>
      this.owner.classNote({ request, authority }));
  }

  queueAdmission(
    request: TeacherOrganizationQueueAdmissionRequestV1,
  ): Promise<unknown> {
    return this.execute("queue_admission_exchange", request, (authority) =>
      this.owner.queueAdmission({ request, authority }));
  }

  private async execute(
    operation: TeacherOrganizationOwnerOperation,
    request: AnyTeacherOrganizationRequestV1,
    run: (
      authority: TeacherOrganizationOwnerResolutionV1,
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
    assertPublishedTeacherOrganizationResponse(operation, response);
    assertRequestBinding(operation, request, authority, response);
    return response;
  }
}

const READ_OPERATIONS: readonly TeacherOrganizationOwnerOperation[] = [
  "feed_query",
  "organization_query",
];

const violation: () => never = () => {
  throw new Error("teacher_organization_binding_violation");
};

const assertRequestBinding = (
  operation: TeacherOrganizationOwnerOperation,
  request: AnyTeacherOrganizationRequestV1,
  authority: TeacherOrganizationAuthorityResultV1,
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
    // Ready reads carry the context echo inside resolution and partition.
    assertReadBinding(request, authority.owner_resolution, response, operation);
    return;
  }
  if (response.context_ref !== request.context_ref) violation();
  const commandRequestId =
    (request as TeacherOrganizationOrganizeRequestV1).command_request_id;
  if (response.command_request_id !== commandRequestId) violation();
  if (operation === "supplement_exchange") {
    const kind = (request as TeacherOrganizationSupplementRequestV1).kind;
    if (kind === "prepare" && response.status === "committed") violation();
    if (kind === "confirm" && response.status === "ready_to_confirm") violation();
  }
  if (
    operation === "queue_admission_exchange"
    && response.status === "committed"
    && response.process_ref
      !== (request as TeacherOrganizationQueueAdmissionRequestV1).process_ref
  ) {
    violation();
  }
};

const assertReadBinding = (
  request: AnyTeacherOrganizationRequestV1,
  ownerResolution: TeacherOrganizationOwnerResolutionV1,
  response: Record<string, unknown>,
  operation: TeacherOrganizationOwnerOperation,
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
    || cache.interface_key !== TEACHER_ORGANIZATION_OWNER_INTERFACE.key
    || cache.interface_version !== TEACHER_ORGANIZATION_OWNER_INTERFACE.version
    || cache.contract_digest !== TEACHER_ORGANIZATION_OWNER_INTERFACE.digest
    || cache.context_ref !== request.context_ref
    || cache.workspace_id !== request.workspace_id
    || cache.my_chat_user_id !== request.my_chat_user_id
    || cache.operation !== operation
    || cache.query_key !== request.class_ref
  ) {
    violation();
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
