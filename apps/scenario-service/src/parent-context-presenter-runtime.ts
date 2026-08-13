import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import {
  ParentContextPresenterComposition,
  type ParentContextPresenterAsyncBoundaryV1,
  type ParentContextPresenterAuthorityResolverV1,
  type ParentContextPresenterOwnerV1,
} from "./parent-context-presenter-composition.js";

export type ParentContextPresenterOwnerBindingV1 = Readonly<{
  authorityResolver: ParentContextPresenterAuthorityResolverV1;
  owner: ParentContextPresenterOwnerV1;
  asyncBoundary: ParentContextPresenterAsyncBoundaryV1;
}>;

export const createParentContextPresenterComposition = (input: {
  enabled: boolean;
  serviceAuth: BindingOwnerServiceAuth;
  ownerBinding?: ParentContextPresenterOwnerBindingV1;
}): ParentContextPresenterComposition | undefined => {
  const binding = input.ownerBinding;
  if (
    !input.enabled
    || !input.serviceAuth.configured
    || !binding?.authorityResolver
    || !binding.owner
    || !binding.asyncBoundary
  ) {
    return undefined;
  }
  return new ParentContextPresenterComposition(
    binding.authorityResolver,
    binding.owner,
    binding.asyncBoundary,
  );
};
