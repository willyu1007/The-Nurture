import type { DirectorPresenterOwnerBindingV1 } from "@the-nurture/scenario";
import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";
import { DirectorPresenterComposition } from "./director-presenter-composition.js";

export type { DirectorPresenterOwnerBindingV1 } from "@the-nurture/scenario";

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
