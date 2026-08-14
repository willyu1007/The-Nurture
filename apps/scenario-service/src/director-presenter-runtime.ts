import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import {
  DirectorPresenterComposition,
  type DirectorPresenterAuthorityResolverV1,
  type DirectorPresenterOwnerV1,
} from "./director-presenter-composition.js";

export type DirectorPresenterOwnerBindingV1 = Readonly<{
  authorityResolver: DirectorPresenterAuthorityResolverV1;
  owner: DirectorPresenterOwnerV1;
}>;

export const createDirectorPresenterComposition = (input: {
  enabled: boolean;
  serviceAuth: BindingOwnerServiceAuth;
  ownerBinding?: DirectorPresenterOwnerBindingV1;
}): DirectorPresenterComposition | undefined => {
  const binding = input.ownerBinding;
  if (
    !input.enabled
    || !input.serviceAuth.configured
    || !binding?.authorityResolver
    || !binding.owner
  ) {
    return undefined;
  }
  return new DirectorPresenterComposition(
    binding.authorityResolver,
    binding.owner,
  );
};
