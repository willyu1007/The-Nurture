import type { DirectorPresenterOperation } from "@the-nurture/scenario";
import type {
  DirectorPresenterDrilldownRequestV1,
  DirectorPresenterMaterialRequestV1,
  DirectorPresenterOverviewRequestV1,
} from "./director-presenter-http.js";
import { assertPublishedDirectorPresenterResponse } from "./director-presenter-response-validator.js";

export type DirectorPresenterOwnerResolutionV1 = Readonly<{
  resolution_ref: string;
  presentation_role: "institution_director";
  scope_kind: "institution";
  scope_ref: string;
  context_ref: string;
  scope_version: number;
  resolved_at: string;
}>;

type DirectorPresenterIdentityV1 = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
  operation: DirectorPresenterOperation;
}>;

export type DirectorPresenterAuthorityResultV1 =
  | Readonly<{
      status: "resolved";
      owner_resolution: DirectorPresenterOwnerResolutionV1;
    }>
  | Readonly<{
      status: "closed";
      response: unknown;
    }>;

export interface DirectorPresenterAuthorityResolverV1 {
  resolve(
    input: DirectorPresenterIdentityV1,
  ): Promise<DirectorPresenterAuthorityResultV1>;
}

export interface DirectorPresenterOwnerV1 {
  overview(input: Readonly<{
    request: DirectorPresenterOverviewRequestV1;
    authority: DirectorPresenterOwnerResolutionV1;
  }>): Promise<unknown>;
  drilldown(input: Readonly<{
    request: DirectorPresenterDrilldownRequestV1;
    authority: DirectorPresenterOwnerResolutionV1;
  }>): Promise<unknown>;
  materials(input: Readonly<{
    request: DirectorPresenterMaterialRequestV1;
    authority: DirectorPresenterOwnerResolutionV1;
  }>): Promise<unknown>;
}

export class DirectorPresenterComposition {
  constructor(
    private readonly authorityResolver: DirectorPresenterAuthorityResolverV1,
    private readonly owner: DirectorPresenterOwnerV1,
  ) {}

  overview(request: DirectorPresenterOverviewRequestV1): Promise<unknown> {
    return this.execute("overview_query", request, (authority) =>
      this.owner.overview({ request, authority }));
  }

  drilldown(request: DirectorPresenterDrilldownRequestV1): Promise<unknown> {
    return this.execute("drilldown_query", request, (authority) =>
      this.owner.drilldown({ request, authority }));
  }

  materials(request: DirectorPresenterMaterialRequestV1): Promise<unknown> {
    return this.execute("material_query", request, (authority) =>
      this.owner.materials({ request, authority }));
  }

  private async execute(
    operation: DirectorPresenterOperation,
    request:
      | DirectorPresenterOverviewRequestV1
      | DirectorPresenterDrilldownRequestV1
      | DirectorPresenterMaterialRequestV1,
    read: (authority: DirectorPresenterOwnerResolutionV1) => Promise<unknown>,
  ): Promise<unknown> {
    const authority = await this.authorityResolver.resolve({
      workspace_id: request.workspace_id,
      my_chat_user_id: request.my_chat_user_id,
      host_request_id: request.host_request_id,
      context_ref: request.context_ref,
      operation,
    });
    const response = authority.status === "closed"
      ? authority.response
      : await read(authority.owner_resolution);
    assertPublishedDirectorPresenterResponse(operation, response);
    assertRequestBinding(operation, request, authority, response);
    return response;
  }
}

const assertRequestBinding = (
  operation: DirectorPresenterOperation,
  request:
    | DirectorPresenterOverviewRequestV1
    | DirectorPresenterDrilldownRequestV1
    | DirectorPresenterMaterialRequestV1,
  authority: DirectorPresenterAuthorityResultV1,
  response: unknown,
): void => {
  if (!isRecord(response)) throw new Error("director_presenter_binding_violation");
  if (response.status !== "ready") {
    if (response.context_ref !== request.context_ref) {
      throw new Error("director_presenter_binding_violation");
    }
    return;
  }
  if (authority.status !== "resolved") {
    throw new Error("director_presenter_binding_violation");
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
    || cache.interface_key !== "nurture.director-presenter"
    || cache.interface_version !== "1.0.0"
    || cache.contract_digest
      !== "sha256:39b879a6d6b310327bb5c5699e4d03b5774f4c3e6aee82761ed78899a5aa2ea9"
    || cache.context_ref !== request.context_ref
    || cache.workspace_id !== request.workspace_id
    || cache.my_chat_user_id !== request.my_chat_user_id
    || cache.operation !== operation
  ) {
    throw new Error("director_presenter_binding_violation");
  }
  const queryKey = operation === "overview_query"
    ? (request as DirectorPresenterOverviewRequestV1).local_date
    : operation === "drilldown_query"
      ? (request as DirectorPresenterDrilldownRequestV1).drilldown_ref
      : (request as DirectorPresenterMaterialRequestV1).collection_ref;
  if (cache.query_key !== queryKey) {
    throw new Error("director_presenter_binding_violation");
  }
  if (
    operation === "material_query"
    && response.request_cursor
      !== ((request as DirectorPresenterMaterialRequestV1).cursor ?? null)
  ) {
    throw new Error("director_presenter_binding_violation");
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
